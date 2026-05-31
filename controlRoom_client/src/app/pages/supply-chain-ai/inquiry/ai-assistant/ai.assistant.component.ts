import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { AiRetailerService } from 'src/app/shared/services/ai/ai.retailer.service';
import { AiSkillService } from 'src/app/shared/services/ai/ai.skill.service';
import { ExportService } from 'src/app/shared/services/inout/export.service';
import { UserService } from 'src/app/shared/services';
import { LabelService } from 'src/app/shared/services/labels/labels.service';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';

const ASSISTANT_SQL_DRAFT_STORAGE_KEY = 'ICR_AI_ASSISTANT_SQL_DRAFT';

/** TRA_LABELS keys for session entity keys (analyst-facing Active context). */
const CONTEXT_ENTITY_LABEL_KEYS: Record<string, [string, string]> = {
    supplier_id: ['S60.CTX.SUP', 'Supplier'],
    vendor_text: ['S60.CTX.VND', 'Vendor'],
    site_id: ['S60.CTX.STO', 'Store'],
    lu_id: ['S60.CTX.LU', 'Item (LU)'],
    ean: ['S60.CTX.EAN', 'Barcode (EAN)'],
};

/**
 * Issue 7 — recoverable parameter gaps.
 * Maps entity name → { prompt shown to user, detect() extracts the value from the reply }.
 * When /execute returns parameter_gaps that contain one of these keys, the assistant
 * stashes the execute payload and prompts the user; the next reply resumes execution.
 */
const RECOVERABLE_GAPS: Record<string, { prompt: string; detect: (t: string) => string | null }> = {
    lu_id: {
        prompt: 'Which item (LU code)? Reply with the item code — e.g., `item 100100` or just `100100`.',
        detect: (t: string) => {
            const clean = String(t || '').trim();
            const m = clean.match(/\b(?:item|article|codart|lu|sku|product)\s*(?:code|#|no\.?)?\s*(\d{4,8})\b/i)
                || clean.match(/^(\d{4,8})$/);
            return m ? m[1] : null;
        }
    },
    site_id: {
        prompt: 'For which store? Reply with the store code — e.g., `store 10` or just `10`.',
        detect: (t: string) => {
            const clean = String(t || '').trim();
            const m = clean.match(/\b(?:store|site|at)\s*0*(\d{1,5})\b/i) || clean.match(/^0*(\d{1,5})$/);
            return m ? m[1] : null;
        }
    },
    supplier_id: {
        prompt: 'Which supplier? Reply with the supplier code — e.g., `06966`, or name — e.g., `Lipari`.',
        detect: (t: string) => {
            const clean = String(t || '').trim();
            if (/^\d{3,8}$/.test(clean)) { return clean; }
            if (/^[A-Za-z0-9 &.\-]{2,40}$/.test(clean) && clean.split(/\s+/).length <= 4) { return clean; }
            return null;
        }
    },
    as_of_date: {
        prompt: 'As of which date? Reply in YYYY-MM-DD format, or `today` / `yesterday`.',
        detect: (t: string) => {
            const clean = String(t || '').trim().toLowerCase();
            if (clean === 'today') { return new Date().toISOString().slice(0, 10); }
            if (clean === 'yesterday') {
                const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10);
            }
            const m = clean.match(/\b(\d{4}-\d{2}-\d{2})\b/);
            return m ? m[1] : null;
        }
    }
};

@Component({
    selector: 'ai-assistant-cmp',
    templateUrl: './ai.assistant.component.html',
    styleUrls: ['./ai.assistant.component.scss'],
    encapsulation: ViewEncapsulation.None,
    providers: [MessageService, ExportService]
})
export class AiAssistantComponent implements OnInit, OnDestroy {
    screenID = 'SCR0000000060';
    retailers: any[] = [];
    selectedRetailer: any = null;
    loadingRetailers = false;

    queryText = '';
    running = false;
    confidence = 0;
    private timer: any = null;

    timelineEvents: any[] = [];
    evidenceFacts: any[] = [];
    conclusion: any = null;
    requestedSql: string[] = [];
    routeResult: any = null;
    resultRows: any[] = [];
    resultColumns: string[] = [];
    /** Last SQL the engine sent to GOLD, with all binds substituted. */
    executedSql = '';
    /** Bind ctx the engine used (for the debug panel). */
    bindContext: any = null;
    /** Raw Oracle error message (from `qErr` branch) or `null`. */
    executionError = '';
    /** UI toggle for the "Debug — executed SQL" panel. */
    showDebug = false;
    /** Full /diagnose response for the latest turn — top-N skill scores,
     *  vocab matches, extracted entities, top-skill template feasibility.
     *  Lets the designer answer "why was this skill picked?" and "why
     *  did the chosen template not run?" without inspecting server logs. */
    diagResult: any = null;
    /** HTTP error from /api/ai/engine/route, when present (status + body).
     *  Replaces the generic "Routing failed" message with the real cause
     *  (e.g. "AI0000061 unavailable") so the LIBQUERY/dblink issue is obvious. */
    routeError: { status: number; message: string; body: any } | null = null;
    chatTurns: any[] = [];
    followUpText = '';
    currentSessionContext: any = { entities: {}, bindings: {} };
    /**
     * Phase 12 — conversational enrichment for the item card.
     *
     * Set when the user asks to add retail/EAN/history to the V_GOLD_ITEM card
     * but a required bind (today: site_id when retail is requested) is missing.
     * The assistant prompts for it and stashes the requested include_* flags
     * + the skill_id that owns ITM_FULL_ATTRIBUTES here, so the NEXT turn
     * (the user supplying the missing value) can pick them back up, force
     * skill_id + template_code = 'ITM_FULL_ATTRIBUTES', and execute.
     *
     * ⚠️ skill_id MUST be captured here. The user's reply ("7", "store 7") is
     * too thin for the router to land on ITEM_MASTER_RETAIL — it picks
     * DSD_VENDOR_RETAIL or CONVERSATIONAL on partial overlap. If we only
     * override `template_code` and leave `skill_id` as `route.selected_skill_id`,
     * the engine looks for ITM_FULL_ATTRIBUTES inside the wrong skill and
     * falls back to a feasible template (e.g. DSD_ARTICLE_SITE_STATUS).
     *
     * Cleared on reset and after a successful enrichment execute.
     */
    private pendingEnrichment: {
        include_ean?: 'Y';
        include_retail?: 'Y';
        include_history?: 'Y';
        include_order_ref?: 'Y';
        skill_id?: string;
    } | null = null;
    /**
     * Issue 7 — stash for gap-entity recovery. Set when /execute returns
     * parameter_gaps containing a RECOVERABLE_GAPS key. Cleared on the next
     * turn if the user supplies a matching value; cleared unconditionally on
     * reset. independend of pendingEnrichment (item-card enrichment has its
     * own stash because it also tracks include_* flags).
     */
    private pendingGapResolution: {
        execPayload: any;
        route: any;
        gapEntity: string;
    } | null = null;
    /**
     * Vendor disambiguation stash. Set when /route returns requires_clarification=true
     * with candidate_options (ENGINE_VENDOR_RESOLVE found 2+ suppliers). On the next
     * turn, if the user's reply identifies one candidate (by code "(06966)", name, or
     * ordinal), we inject supplier_id into the stashed execPayload and re-submit
     * /execute directly — bypassing /route entirely so the original question context
     * is preserved. Cleared when a candidate is matched OR when the user types
     * something unrelated (no match → normal routing proceeds).
     */
    private pendingVendorClarification: {
        execPayload: any;
        route: any;
        candidates: any[];
    } | null = null;
    awaitingAssistant = false;
    private runCounter = 0;
    private activeRunId = 0;
    designerInput: any = {
        templateCode: '',
        bindingsText: '',
        notes: '',
        sqlTemplateDraft: ''
    };

    /** Template skills from AI0000040 — designer picks correct skill without creating a new one. */
    templateSkills: any[] = [];
    loadingTemplateSkills = false;
    designerSelectedSkill: any = null;

    // ADJUST — inline session-context editor (entity chips in right panel)
    contextEditKey: string | null = null;
    contextEditValue = '';
    contextAddMode = false;
    contextAddKey = '';
    contextAddValue = '';

    // LEARN — teach-correct-skill panel shown after thumb-down
    thumbDownTeachVisible: { [idx: number]: boolean } = {};
    thumbDownTeachDone:    { [idx: number]: boolean } = {};
    thumbDownTeachSkill:   { [idx: number]: any }     = {};

    private labelSub?: Subscription;

    constructor(
        private _svc: AiRetailerService,
        private _skillSvc: AiSkillService,
        private _msg: MessageService,
        private _router: Router,
        private _exportService: ExportService,
        private _userSvc: UserService,
        private _labels: LabelService,
    ) {}

    isAiAdmin = false;

    /** Empty-state starters — rebuilt on label revision. */
    examplePrompts: string[] = [];

    ngOnInit(): void {
        this.isAiAdmin = Number(this._userSvc.userInfo?.aiAdmin) === 1;
        this.buildExamplePrompts();
        this.labelSub = this._labels.revision$.subscribe(() => this.buildExamplePrompts());
        this.loadRetailers();
        this.loadTemplateSkills();
    }

    private L(key: string, fallback: string): string {
        return this._labels.text(key, fallback);
    }

    private buildExamplePrompts(): void {
        this.examplePrompts = [
            this.L('S60.EX.1', 'Tell me about item 100100 at store 7'),
            this.L('S60.EX.2', 'What DSD items can we buy from Lipari?'),
            this.L('S60.EX.3', 'Who supplies item 100100?'),
            this.L('S60.EX.4', 'Lookup barcode 041220185936'),
        ];
    }

    contextEntityLabel(key: string): string {
        const k = String(key || '').trim();
        if (!k) { return ''; }
        const mapped = CONTEXT_ENTITY_LABEL_KEYS[k];
        if (mapped) { return this.L(mapped[0], mapped[1]); }
        if (k === 'as_of_date') { return 'As of date'; }
        if (k === 'date_from') { return 'From date'; }
        if (k === 'date_to') { return 'To date'; }
        if (k === 'retailer_id') { return this.L('AI.CMN.RETAIL', 'Retailer'); }
        return k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }

    startNewConversation(): void {
        if (this.running) { return; }
        this.resetSessionState();
        this._msg.add({
            severity: 'info',
            summary: 'New conversation',
            detail: 'Context and chat history cleared. Ask a new question when ready.',
            life: 3000
        });
    }

    useExamplePrompt(text: string): void {
        if (this.running || this.chatTurns.length) { return; }
        this.queryText = text;
    }

    humanizeContextKey(key: string): string {
        return this.contextEntityLabel(key);
    }

    getTurnEvidenceFacts(t: any): string[] {
        const raw = t?.meta?.evidence_facts;
        return Array.isArray(raw) ? raw.filter((x) => x != null && String(x).trim()) : [];
    }

    getTurnFollowUpHint(t: any): string {
        const h = t?.meta?.follow_up_hint;
        return h != null && String(h).trim() ? String(h).trim() : '';
    }

    getAlternativeChipLabel(alt: { skill_code?: string; label?: string }): string {
        if (alt?.label) { return alt.label; }
        return this.humanizeSkillCode(alt?.skill_code || '');
    }

    private humanizeSkillCode(code: string): string {
        const c = String(code || '').trim();
        if (!c) { return 'Another skill'; }
        return c.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
    }

    private skillCatalogLabel(skillId?: string, skillCode?: string): string {
        const id = skillId != null ? String(skillId).trim().toUpperCase() : '';
        const code = skillCode != null ? String(skillCode).trim().toUpperCase() : '';
        const hit = this.templateSkills.find((s: any) => {
            const sid = String(s.SKILL_ID ?? s.skill_id ?? '').trim().toUpperCase();
            const sc = String(s.SKILL_CODE ?? s.skill_code ?? '').trim().toUpperCase();
            return (id && sid === id) || (code && sc === code);
        });
        if (hit) {
            const name = String(hit.SKILL_NAME ?? hit.skill_name ?? '').trim();
            const domain = String(hit.DOMAIN ?? hit.domain ?? '').trim();
            if (name && domain) { return `${name} · ${domain}`; }
            if (name) { return name; }
        }
        return this.humanizeSkillCode(skillCode || '');
    }

    get analystRoutingLabel(): string {
        return this.buildAnalystRoutingMeta(this.routeResult || {}).routing_label;
    }

    get analystRoutingSeverity(): string {
        return this.buildAnalystRoutingMeta(this.routeResult || {}).routing_severity;
    }

    buildAnalystRoutingMeta(route: any): { routing_label: string; routing_severity: string } {
        const conf = this.normalizeConfidence(route?.confidence, this.confidence, 0);
        const diag = route?.routing_diagnostics;
        const picked = !!(route?.selected_skill_id || route?.selected_skill_code);
        if (!picked && conf < 45) {
            return { routing_label: "Couldn't match your question", routing_severity: 'danger' };
        }
        if (diag?.low_confidence || conf < 50) {
            return { routing_label: 'Not sure — pick an option below or rephrase', routing_severity: 'warning' };
        }
        return { routing_label: 'Understood your question', routing_severity: 'success' };
    }

    private resetSessionState(): void {
        this.chatTurns = [];
        this.followUpText = '';
        this.queryText = '';
        this.pendingEnrichment = null;
        this.pendingGapResolution = null;
        this.pendingVendorClarification = null;
        this.confidence = 0;
        this.conclusion = null;
        this.evidenceFacts = [];
        this.requestedSql = [];
        this.routeResult = null;
        this.resultRows = [];
        this.resultColumns = [];
        this.executedSql = '';
        this.bindContext = null;
        this.executionError = '';
        this.showDebug = false;
        this.diagResult = null;
        this.routeError = null;
        this.runCounter = 0;
        this.activeRunId = 0;
        this.designerSelectedSkill = null;
        this.feedbackSent = {};
        this.thumbDownTeachVisible = {};
        this.thumbDownTeachDone = {};
        this.thumbDownTeachSkill = {};
        this.currentSessionContext = { entities: {}, bindings: {} };
        this.contextEditKey = null;
        this.contextEditValue = '';
        this.contextAddMode = false;
        this.contextAddKey = '';
        this.contextAddValue = '';
    }

    /** Skill used for designer retry / Skill Builder — overrides routed skill when set. */
    getDesignerSkillId(): string | null {
        const fromPicker = this.designerSelectedSkill?.SKILL_ID ?? this.designerSelectedSkill?.skill_id;
        if (fromPicker != null && String(fromPicker).trim() !== '') {
            return String(fromPicker).trim();
        }
        const fromRoute = this.routeResult?.selected_skill_id;
        return fromRoute != null && String(fromRoute).trim() !== '' ? String(fromRoute).trim() : null;
    }

    getDesignerSkillCode(): string {
        const c = this.designerSelectedSkill?.SKILL_CODE ?? this.designerSelectedSkill?.skill_code;
        return c != null ? String(c) : '';
    }

    private loadTemplateSkills(): void {
        this.loadingTemplateSkills = true;
        this._skillSvc.listTemplateSkills().subscribe({
            next: (data: any) => {
                const rows = Array.isArray(data) ? data : (Array.isArray(data?.rows) ? data.rows : []);
                this.templateSkills = rows
                    .map((r: any) => {
                        const id = r.SKILL_ID ?? r.skill_id;
                        const code = r.SKILL_CODE ?? r.skill_code ?? '';
                        const name = r.SKILL_NAME ?? r.skill_name ?? '';
                        const domain = r.DOMAIN ?? r.domain ?? '';
                        return {
                            ...r,
                            SKILL_ID: id,
                            SKILL_CODE: code,
                            SKILL_NAME: name,
                            DOMAIN: domain,
                            _label: `${code} — ${name}${domain ? ' (' + domain + ')' : ''}`
                        };
                    })
                    .filter((r: any) => !!r.SKILL_ID);
                this.loadingTemplateSkills = false;
            },
            error: () => {
                this.loadingTemplateSkills = false;
                this._msg.add({
                    severity: 'warn',
                    summary: 'Skill catalog',
                    detail: 'Could not load template skills (AI0000040). Skill picker may be empty.'
                });
            }
        });
    }

    private syncDesignerSkillFromRoute(): void {
        const id = this.routeResult?.selected_skill_id;
        if (!id || !this.templateSkills.length) { return; }
        const u = String(id).trim().toUpperCase();
        const hit = this.templateSkills.find((s: any) =>
            String(s.SKILL_ID ?? s.skill_id ?? '').trim().toUpperCase() === u);
        if (hit) {
            this.designerSelectedSkill = hit;
        }
    }

    loadRetailers(): void {
        this.loadingRetailers = true;
        this._svc.getRetailers().subscribe({
            next: (data: any) => {
                this.retailers = (Array.isArray(data) ? data : [])
                    .map((r: any) => ({
                        ...r,
                        RETAILER_ID: r.RETAILER_ID || r.retailer_id,
                        RETAILER_NAME: r.RETAILER_NAME || r.retailer_name || r.RETAILER_ID || r.retailer_id
                    }))
                    .filter((r: any) => !!r.RETAILER_ID);
                this.loadingRetailers = false;
                if (this.retailers.length && !this.selectedRetailer) {
                    this.selectedRetailer = this.retailers[0];
                }
            },
            error: () => {
                this.loadingRetailers = false;
                this._msg.add({ severity: 'error', summary: 'Retailers',
                    detail: 'Could not load retailer list (AI0000002).' });
            }
        });
    }

    ngOnDestroy(): void {
        this.labelSub?.unsubscribe();
        if (this.timer) { clearInterval(this.timer); this.timer = null; }
    }

    private pushTurn(role: 'user' | 'assistant', text: string, meta?: any): void {
        if (!text || !String(text).trim()) { return; }
        this.chatTurns.push({
            role,
            text: String(text).trim(),
            at: new Date(),
            meta: {
                runId: this.activeRunId,
                ...(meta || {})
            }
        });
    }

    private pushRunSeparator(label: string): void {
        this.chatTurns.push({
            role: 'separator',
            text: label,
            at: new Date(),
            meta: { runId: this.activeRunId }
        });
    }

    getComposerText(): string {
        return this.chatTurns.length ? this.followUpText : this.queryText;
    }

    setComposerText(value: string): void {
        if (this.chatTurns.length) {
            this.followUpText = value;
        } else {
            this.queryText = value;
        }
    }

    onComposerKeydown(event: KeyboardEvent): void {
        if (event.key !== 'Enter' || event.shiftKey) { return; }
        event.preventDefault();
        this.sendFromComposer();
    }

    sendFromComposer(): void {
        if (this.running || !this.selectedRetailer?.RETAILER_ID) { return; }
        const text = this.getComposerText();
        if (!text || !text.trim()) { return; }
        if (this.chatTurns.length) {
            this.continueDiscussion();
        } else {
            this.runInvestigation();
        }
    }

    private bindingsToParametersJson(): string {
        const obj = this.parseDesignerBindings(this.designerInput.bindingsText);
        const keys = Object.keys(obj);
        if (!keys.length) { return ''; }
        const arr = keys.map((name) => ({ name, type: 'STRING', required: true }));
        return JSON.stringify(arr);
    }

    openSkillBuilderWithDraft(): void {
        const skillId = this.getDesignerSkillId();
        if (!skillId) {
            this._msg.add({
                severity: 'warn',
                summary: 'Skill builder',
                detail: 'Select a skill from the catalog (or run a question so the routed skill is pre-selected).'
            });
            return;
        }
        const code = (this.designerInput.templateCode || '').trim();
        const sql = (this.designerInput.sqlTemplateDraft || '').trim();
        const notes = (this.designerInput.notes || '').trim();
        if (!code && !sql) {
            this._msg.add({
                severity: 'warn',
                summary: 'Skill builder',
                detail: 'Enter a template code and/or SQL draft before opening Skill Builder.'
            });
            return;
        }
        const paramsJson = this.bindingsToParametersJson();
        const draft: Record<string, string> = {
            templateCode: code,
            sqlText: sql,
            purpose: notes,
            templateLabel: code ? code.replace(/_/g, ' ') : 'Assistant SQL draft',
            sourceQuestion: this.getLastUserQuestion()
        };
        if (paramsJson) {
            draft.parametersJson = paramsJson;
        }
        try {
            sessionStorage.setItem(ASSISTANT_SQL_DRAFT_STORAGE_KEY, JSON.stringify(draft));
        } catch {
            this._msg.add({
                severity: 'error',
                summary: 'Skill builder',
                detail: 'Could not store draft in session storage.'
            });
            return;
        }
        const qp: Record<string, string> = { openSql: '1' };
        if (code) { qp.templateCode = code; }
        this._router.navigate(['/ai/skill-studio/builder', skillId], { queryParams: qp });
    }

    private parseDesignerBindings(text: string): any {
        const out: any = {};
        const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        lines.forEach((line) => {
            const i = line.indexOf('=');
            if (i <= 0) { return; }
            const k = line.slice(0, i).trim();
            const v = line.slice(i + 1).trim();
            if (k) { out[k] = v; }
        });
        return out;
    }

    private getLastUserQuestion(): string {
        for (let i = this.chatTurns.length - 1; i >= 0; i -= 1) {
            if (this.chatTurns[i]?.role === 'user') { return String(this.chatTurns[i].text || ''); }
        }
        return '';
    }

    private handleExecuteResponse(route: any, exec: any): void {
        this.requestedSql = exec?.requested_sql_templates || [];
        this.evidenceFacts = (exec?.evidence_facts || []).concat(this.evidenceFacts);
        this.confidence = this.normalizeConfidence(
            exec?.confidence,
            route?.confidence,
            this.confidence
        );
        this.resultRows = Array.isArray(exec?.result_rows) ? exec.result_rows : [];
        this.resultColumns = Array.isArray(exec?.result_columns) ? exec.result_columns : [];
        this.executedSql = typeof exec?.executed_sql === 'string' ? exec.executed_sql : '';
        this.bindContext = exec?.bind_context ?? null;
        this.executionError = typeof exec?.error_message === 'string' ? exec.error_message : '';
        const partialItems = exec?.answer_quality === 'PARTIAL_NON_ITEM_ROWS';

        // Prefer backend composer text; fall back to client-side summary
        const human = !this.requestedSql.length
            ? this.buildHumanAnswerSummary(route, this.resultRows.length, this.resultColumns, exec)
            : null;

        const missingBindings = Array.isArray(exec?.parameter_gaps) ? exec.parameter_gaps : [];
        const clarifications = Array.isArray(route?.candidate_options) ? route.candidate_options : [];

        this.conclusion = {
            label: this.requestedSql.length
                ? (partialItems ? 'Needs item-level SQL' : 'Designer input required')
                : (human?.label || 'Execution complete'),
            detail: this.requestedSql.length
                ? (partialItems
                    ? 'The vendor was resolved but the result does not include item identifiers. The SQL template needs to be updated to return LU / article codes.'
                    : 'This intent needs a SQL template before I can answer. Use the designer panel to author one.')
                : (human?.detail || ''),
            severity: this.requestedSql.length ? 'warning' : 'success'
        };

        // Prefer human_summary from backend; fall back to constructed text
        const humanSummary = exec?.human_summary || route?.human_summary || null;

        // Only show a clarification prompt if the engine actually asks for one.
        // candidate_options can be returned for transparency (runner-up alternatives)
        // even when an explicit code in vendor_text already disambiguated the pick.
        const needsClarification = !!route?.requires_clarification;
        const clarificationText = needsClarification
            ? (route?.human_clarification
                || (clarifications.length
                    ? ('I found ' + clarifications.length + ' suppliers matching that name. Which one did you mean?\n• ' +
                        clarifications.slice(0, 4).map((c: any) => `${c.supplier_name || c.supplier_id}${c.supplier_id ? ' (' + c.supplier_id + ')' : ''}`).join('\n• '))
                    : ''))
            : '';

        // Use composer-built gap question from exec if available
        const bindGapText = exec?.human_summary && missingBindings.length
            ? exec.human_summary
            : (missingBindings.length
                ? this.humanizeBindGaps(missingBindings)
                : '');

        // When the engine is asking the user to pick a vendor (needsClarification + candidates
        // present), the exec human_summary is from the gap branch ("I couldn't find…") which
        // is wrong — suppress it so only the clarification question is shown.
        const suppressExecSummary = needsClarification && clarifications.length > 0;
        const assistantText = (!suppressExecSummary && humanSummary)
            ? [humanSummary, clarificationText].filter(Boolean).join('\n\n')
            : [clarificationText, (!suppressExecSummary ? bindGapText : '')].filter(Boolean).join('\n\n');
        const templates = Array.isArray(exec?.templates_available) ? exec.templates_available : [];
        const templateCode = exec?.template_code
            || (templates[0] && (templates[0].template_code || templates[0].TEMPLATE_CODE))
            || (this.designerInput?.templateCode || '')
            || '';
        const answerQuality = exec?.answer_quality || (this.requestedSql.length ? 'NEEDS_DESIGNER_INPUT' : 'OK');
        const suggestions = this.computeFollowUpSuggestions({
            intent_type: route?.intent_type,
            skill_code: route?.selected_skill_code,
            template_code: templateCode,
            result_count: this.resultRows.length,
            answer_quality: answerQuality,
            designer_required: this.requestedSql.length > 0
        });
        // Phase 5 — when the route confidence is low, surface the runner-up
        // skills as clickable chips. Click resends the question with
        // `preferred_skill_id` so the engine forces that skill.
        const alternatives = this.buildAlternativeChips(route);
        const turnEvidence = Array.isArray(exec?.evidence_facts)
            ? exec.evidence_facts.map((x: any) => String(x).trim()).filter(Boolean)
            : [];
        const followUpHint = exec?.follow_up_hint != null && String(exec.follow_up_hint).trim()
            ? String(exec.follow_up_hint).trim()
            : '';
        const routingMeta = this.isAiAdmin ? {} : this.buildAnalystRoutingMeta(route);

        // Phase 12 — attach the result payload to the assistant turn so the
        // table, debug panel, and export buttons can render inline in the chat
        // bubble (no need to look at the side "Detailed results" card).
        // Snapshots are deep-copied so subsequent runs don't mutate older turns.
        const rowsSnapshot = (this.resultRows || []).map(r => ({ ...(r || {}) }));
        const columnsSnapshot = (this.resultColumns || []).slice();
        const bindSnapshot = this.bindContext
            ? JSON.parse(JSON.stringify(this.bindContext))
            : null;

        this.pushTurn('assistant', assistantText || 'Execution complete.', {
            retailer_name: (this.selectedRetailer as any)?.RETAILER_NAME || '',
            confidence: this.confidence,
            evidence_facts: turnEvidence,
            follow_up_hint: followUpHint,
            ...routingMeta,
            requested_sql_templates: this.requestedSql,
            candidate_options: clarifications,
            suggestions,
            alternatives,
            result_columns: columnsSnapshot,
            result_rows: rowsSnapshot,
            result_count: rowsSnapshot.length,
            executed_sql: this.executedSql || '',
            bind_context: bindSnapshot,
            execution_error: this.executionError || '',
            is_oracle_error: this.isOracleErrorRow(rowsSnapshot),
            template_code: templateCode,
            skill_code: route?.selected_skill_code || '',
            show_debug: false,
            feedback: {
                question_text: this.getLastUserQuestion(),
                // Prefer the skill_id the engine actually executed (carried back
                // on the exec response). On enrichment turns we force a different
                // skill_id than /route picked, and findLastItemCardSkillId() reads
                // this value on the NEXT turn to keep continuations on rails.
                skill_id: exec?.skill_id
                    || exec?.selected_skill_id
                    || route?.selected_skill_id
                    || this.getDesignerSkillId()
                    || '',
                template_code: templateCode,
                result_count: this.resultRows.length,
                answer_quality: answerQuality
            }
        });
    }

    /**
     * Phase 5 — build clarification chips. We only show them when the engine
     * itself signals low confidence (avoids noise on perfect routes). The
     * picked skill is excluded; we surface up to 2 distinct alternatives.
     */
    private buildAlternativeChips(route: any): {
        skill_id: string;
        skill_code: string;
        score: number;
        label: string;
    }[] {
        const diag = route?.routing_diagnostics;
        if (!diag || !diag.low_confidence) { return []; }
        const alts = Array.isArray(route?.alternatives) ? route.alternatives : [];
        const seen = new Set<string>();
        const out: { skill_id: string; skill_code: string; score: number; label: string }[] = [];
        const pickedId = String(route?.selected_skill_id || '');
        for (let i = 0; i < alts.length && out.length < 2; i++) {
            const a = alts[i] || {};
            const id = String(a.skill_id || '');
            const code = String(a.skill_code || '');
            if (!id || id === pickedId || seen.has(id)) { continue; }
            seen.add(id);
            out.push({
                skill_id: id,
                skill_code: code,
                score: Number(a.score || 0),
                label: this.skillCatalogLabel(id, code),
            });
        }
        return out;
    }

    applyDesignerInput(): void {
        if (this.running) { return; }
        const retailerId = this.selectedRetailer?.RETAILER_ID;
        const route = this.routeResult || {};
        const skillId = this.getDesignerSkillId();
        if (!retailerId || !skillId) {
            this._msg.add({ severity: 'warn', summary: 'Designer input',
                detail: 'Select a retailer and a skill (catalog or from last route), then retry.' });
            return;
        }

        const parsedBindings = this.parseDesignerBindings(this.designerInput.bindingsText);
        this.currentSessionContext.bindings = {
            ...(this.currentSessionContext.bindings || {}),
            ...parsedBindings
        };

        if (this.designerInput.notes || this.designerInput.sqlTemplateDraft || Object.keys(parsedBindings).length || this.getDesignerSkillCode()) {
            const lines = [];
            const code = this.getDesignerSkillCode();
            if (code) { lines.push('Skill: ' + code); }
            if (this.designerInput.notes) { lines.push('Notes: ' + this.designerInput.notes); }
            if (Object.keys(parsedBindings).length) {
                lines.push('Bindings: ' + Object.keys(parsedBindings).map((k) => `${k}=${parsedBindings[k]}`).join(', '));
            }
            if (this.designerInput.sqlTemplateDraft) { lines.push('SQL draft captured for skill shaping.'); }
            this.pushTurn('user', '[Designer input] ' + lines.join(' | '));
        }

        this.running = true;
        this.awaitingAssistant = true;
        const payload: any = {
            skill_id: skillId,
            intent_type: route?.intent_type,
            supplier_id: route?.entities?.supplier_id || this.currentSessionContext?.entities?.supplier_id || null,
            retailer_id: retailerId,
            question_text: this.getLastUserQuestion(),
            entities: {
                ...(this.currentSessionContext.entities || {}),
                ...(route?.entities || {})
            },
            bindings: this.currentSessionContext.bindings || {}
        };
        if (this.designerInput.templateCode && String(this.designerInput.templateCode).trim()) {
            payload.template_code = String(this.designerInput.templateCode).trim();
        }

        this._svc.executeInquiry(payload).subscribe({
            next: (exec: any) => {
                this.running = false;
                this.awaitingAssistant = false;
                this.handleExecuteResponse(route, exec);
            },
            error: () => {
                this.running = false;
                this.awaitingAssistant = false;
                this._msg.add({ severity: 'error', summary: 'Designer input',
                    detail: 'Could not apply designer input on execute.' });
            }
        });
    }

    /** Converts raw bind names to natural questions the user can actually answer. */
    private humanizeBindGaps(gaps: string[]): string {
        const LABELS: Record<string, string> = {
            site_id:      'Which store are you checking?',
            retailer_id:  'Which retailer should I use?',
            supplier_id:  'Which supplier are you looking for?',
            vendor_text:  'What is the supplier name?',
            date_from:    'What is the start date?',
            date_to:      'What is the end date?',
            as_of_date:   'What date should I use as the reference?',
            lu_id:        'What is the article LU code?',
            ean:          'What is the EAN / UPC / barcode number?',
            order_ref:    'What is the supplier reference to order number?'
        };
        const questions = gaps.map((g) => LABELS[g] || LABELS[g.toLowerCase()] || `What is the value for "${g}"?`);
        return questions.length === 1 ? questions[0] : 'I need a few more details: ' + questions.join(' ');
    }

    /**
     * Natural-language summary. Prefers human_summary from backend composer;
     * falls back to client-side logic for legacy responses that lack it.
     */
    private buildHumanAnswerSummary(
        route: any,
        rowCount: number,
        columns: string[],
        execResponse?: any
    ): { label: string; detail: string } {
        // Prefer synthesized text from backend composer
        if (execResponse?.human_summary && String(execResponse.human_summary).trim()) {
            return { label: rowCount > 0 ? 'Answer' : 'No results', detail: String(execResponse.human_summary).trim() };
        }

        // Client-side fallback (covers legacy responses)
        const intent = route?.intent_type;
        const supplierName = route?.entities?.supplier_name;
        const supplierId = route?.entities?.supplier_id;
        const vendorText = route?.entities?.vendor_text;
        const colUpper = (columns || []).map((c) => String(c).toUpperCase());
        const looksItemList = colUpper.some((c) => c === 'ITEM_LU' || c === 'ITEM_INTERNAL')
            || colUpper.some((c) => c.includes('CODART') || c.includes('ARACEXR'));
        const supplierPhrase = supplierName
            ? `${supplierName}${supplierId ? ' (' + supplierId + ')' : ''}`
            : (supplierId ? `supplier ${supplierId}` : (vendorText ? `"${vendorText}"` : 'the matched supplier'));

        if (intent === 'RETRIEVAL' && rowCount > 0 && looksItemList) {
            return {
                label: 'Answer',
                detail: rowCount === 1
                    ? `I found 1 item in GOLD linked to ${supplierPhrase}. The row is in the table below.`
                    : `I found ${rowCount} items in GOLD linked to ${supplierPhrase}. Every matching row is in the table — use the pager to scroll through the list.`
            };
        }

        if (rowCount > 0) {
            const first = this.resultRows?.length ? this.resultRows[0] : null;
            const text = first ? (first.ANSWER_TEXT || first.answer_text || first.ANSWER || first.answer) : null;
            if (text) { return { label: 'Answer', detail: String(text) }; }
            return {
                label: 'Answer',
                detail: `The query returned ${rowCount} row${rowCount === 1 ? '' : 's'}. Full results are in the table below.`
            };
        }

        const ean = route?.entities?.ean || route?.entities?.EAN;
        if (ean) {
            return {
                label: 'No results',
                detail: 'No item in GOLD matched EAN ' + ean + ' on the active barcode catalog (ARTCOCA). ' +
                    'Check the code, try a leading zero for 12-digit UPCs, or confirm the barcode is effective for today.'
            };
        }

        const orderRef = route?.entities?.order_ref || route?.entities?.ORDER_REF;
        if (orderRef) {
            return {
                label: 'No results',
                detail: 'No active ARTUC row matched reference to order ' + orderRef + '. ' +
                    'Check the number on the supplier contract or try the item LU / EAN instead.'
            };
        }

        return {
            label: 'No results',
            detail: 'The query ran successfully but returned no results for the current filters. ' +
                    'Try widening the date range or verifying the supplier code.'
        };
    }

    private extractOrderRefFromText(text: string): string | null {
        const raw = String(text || '').trim();
        const patterns = [
            /\b(?:ref\.?\s*to\s*order|reference\s+to\s*order|order\s+ref(?:erence)?)\s*(?:#|no\.?|number|code)?\s*[:#=]?\s*([0-9]{5,18})\b/i,
            /\b(?:ref\.?\s*to\s*order|reference\s+to\s*order)\s+([0-9]{5,18})\b/i
        ];
        for (const re of patterns) {
            const m = raw.match(re);
            if (m?.[1]) { return m[1]; }
        }
        return null;
    }

    /**
     * Ref. to order questions: ITM_ORDER_REF_LOOKUP → ITM_ARTICLE_HEADER (same as EAN chain).
     */
    private shouldChainOrderRefToItemCard(
        route: any,
        entities: Record<string, any>,
        enrichmentOverride: ReturnType<typeof this.buildEnrichmentOverride>,
        forcedTemplate?: string,
        itemCardOverride?: ReturnType<typeof this.buildItemCardOverride>,
        questionText?: string
    ): boolean {
        if (enrichmentOverride || itemCardOverride || forcedTemplate) { return false; }
        const orderRef = entities?.order_ref || entities?.ORDER_REF;
        const lu = entities?.lu_id || entities?.LU_ID;
        if (!orderRef || lu) { return false; }
        const skill = String(route?.selected_skill_code || '').toUpperCase();
        if (/ITEM_MASTER|ITEM_RETAIL/.test(skill)) { return true; }
        return !!this.extractOrderRefFromText(questionText || '');
    }

    /**
     * EAN / UPC questions: run ITM_BARCODE_LOOKUP first, then ITM_ARTICLE_HEADER
     * on ITEM_MASTER_RETAIL once we have an LU — not a single template with :ean only.
     */
    private shouldChainEanToItemCard(
        route: any,
        entities: Record<string, any>,
        enrichmentOverride: ReturnType<typeof this.buildEnrichmentOverride>,
        forcedTemplate?: string,
        itemCardOverride?: ReturnType<typeof this.buildItemCardOverride>
    ): boolean {
        if (enrichmentOverride || itemCardOverride || forcedTemplate) { return false; }
        const ean = entities?.ean || entities?.EAN;
        const lu = entities?.lu_id || entities?.LU_ID;
        if (!ean || lu) { return false; }
        const skill = String(route?.selected_skill_code || '').toUpperCase();
        return /ITEM_MASTER|ITEM_RETAIL/.test(skill);
    }

    private normalizeEanLookupVariants(ean: string): string[] {
        const digits = String(ean || '').replace(/\D/g, '');
        if (!digits) { return []; }
        const out: string[] = [digits];
        if (digits.length === 12) { out.push('0' + digits); }
        if (digits.length > 0 && digits.length < 13) { out.push(digits.padStart(13, '0')); }
        if (digits.length === 13 && /^0/.test(digits)) {
            const stripped = digits.replace(/^0+/, '');
            if (stripped && stripped !== digits) { out.push(stripped); }
        }
        return [...new Set(out)];
    }

    private extractLuIdFromBarcodeRows(rows: any[]): string | null {
        if (!rows?.length) { return null; }
        const r = rows[0] || {};
        const preferred = [
            'item_lu', 'ITEM_LU', 'Item code', 'ITEM_CODE', 'item_code',
            'LU', 'lu_id', 'LU_ID', 'ARTCEXR', 'variant_code', 'VARIANT_CODE'
        ];
        for (const k of preferred) {
            const v = r[k];
            if (v != null && String(v).trim()) { return String(v).trim(); }
        }
        for (const key of Object.keys(r)) {
            if (/^(item_)?lu$/i.test(key) || /item.*code/i.test(key)) {
                const v = r[key];
                if (v != null && String(v).trim()) { return String(v).trim(); }
            }
        }
        return null;
    }

    private prependHumanSummary(exec: any, prefix: string): void {
        if (!prefix) { return; }
        const existing = exec?.human_summary ? String(exec.human_summary).trim() : '';
        exec.human_summary = existing ? (prefix + ' ' + existing) : prefix;
    }

    /**
     * After barcode / order-ref lookup, force ITM_ARTICLE_HEADER.
     * Omits lookup binds from execute context so the engine cannot re-pick the resolver template.
     */
    private executeItemCardAfterLookup(
        route: any,
        basePayload: any,
        preamble: string,
        luId: string,
        lookupExec?: any
    ): void {
        const cardPayload = {
            ...basePayload,
            template_code: 'ITM_ARTICLE_HEADER',
            entities: { lu_id: luId },
            bindings: { lu_id: luId }
        };

        this._svc.executeInquiry(cardPayload).subscribe({
            next: (cardExec: any) => {
                const tpl = String(cardExec?.template_code || '').toUpperCase();
                if (tpl !== 'ITM_ARTICLE_HEADER') {
                    const fallback = lookupExec || cardExec;
                    this.prependHumanSummary(
                        fallback,
                        preamble + ' Use “Tell me about item ' + luId + '” for the full item card.'
                    );
                    this.finishExecuteInquiry(route, fallback, null);
                    return;
                }
                if (!(cardExec?.result_rows?.length)) {
                    this.prependHumanSummary(
                        cardExec,
                        preamble + ' No rows in V_GOLD_ITEM for that LU — check the view / DB link.'
                    );
                } else {
                    this.prependHumanSummary(cardExec, preamble);
                }
                this.finishExecuteInquiry(route, cardExec, null);
            },
            error: () => {
                if (lookupExec) {
                    this.prependHumanSummary(
                        lookupExec,
                        preamble + ' The item card query failed; try “Tell me about item ' + luId + '”.'
                    );
                    this.finishExecuteInquiry(route, lookupExec, null);
                } else {
                    this.failExecuteInquiry();
                }
            }
        });
    }

    /**
     * When the engine routes to a diagnostic skill (skill_id prefix 'DA') and
     * the intent is DIAGNOSTIC, bypass the normal execute path and run the
     * rule-based chain via POST /api/ai/engine/diagnose-chain instead.
     * This produces a structured root-cause conclusion with severity and evidence.
     */
    private isDiagnosticSkill(skillId: string | undefined): boolean {
        return !!skillId && String(skillId).toUpperCase().startsWith('DA');
    }

    private handleDiagnosticChainResponse(route: any, chain: any): void {
        this.timelineEvents[3].done = true;
        this.timelineEvents[3].date = new Date();
        this.timelineEvents[4].done = true;
        this.timelineEvents[4].date = new Date();
        this.running = false;
        this.awaitingAssistant = false;

        // Multi-issue: overall_severity from synthesizer; fallback to chain.severity for single-issue
        const rawSeverity = (chain?.severity || 'INFO').toUpperCase();
        const severityMap: Record<string, string> = { CRITICAL: 'danger', WARNING: 'warn', INFO: 'info' };
        const pSeverity = severityMap[rawSeverity] || 'info';

        const issuesFound: number = chain?.issues_found ?? (chain?.conclusion_key ? 1 : 0);
        const hasHardStop: boolean = !!chain?.has_hard_stop;
        const conclusions: any[] = Array.isArray(chain?.conclusions) ? chain.conclusions : [];
        const humanSummary = chain?.human_summary || 'Diagnostic complete.';
        const evidenceFacts: string[] = Array.isArray(chain?.evidence_facts) ? chain.evidence_facts : [];
        const followUpHint = chain?.follow_up_hint ? String(chain.follow_up_hint) : '';

        // Conclusion label — single key or issue count
        const conclusionLabel = issuesFound > 1
            ? ('Diagnostic — ' + issuesFound + ' issues found')
            : ('Diagnostic — ' + (chain?.conclusion_key || 'complete'));

        this.conclusion = {
            label: conclusionLabel,
            detail: humanSummary,
            severity: pSeverity
        };
        this.evidenceFacts = evidenceFacts.concat(this.evidenceFacts);

        const suggestions = this.computeFollowUpSuggestions({
            intent_type: 'DIAGNOSTIC',
            skill_code: route?.selected_skill_code || '',
            template_code: '',
            result_count: 0,
            answer_quality: chain?.success ? 'OK' : 'PARTIAL',
            designer_required: false
        });

        const steps = Array.isArray(chain?.diagnostic_steps) ? chain.diagnostic_steps : [];

        this.pushTurn('assistant', humanSummary, {
            retailer_name: (this.selectedRetailer as any)?.RETAILER_NAME || '',
            confidence: this.confidence,
            evidence_facts: evidenceFacts,
            follow_up_hint: followUpHint,
            suggestions,
            alternatives: this.buildAlternativeChips(route),
            is_diagnostic: true,
            diagnostic_severity: chain?.severity || 'INFO',
            conclusion_key: chain?.conclusion_key || '',
            issues_found: issuesFound,
            has_hard_stop: hasHardStop,
            conclusions: conclusions,
            diagnostic_steps: steps,
            result_columns: [],
            result_rows: [],
            result_count: 0,
            executed_sql: '',
            bind_context: chain?.bind_context || null,
            skill_code: route?.selected_skill_code || '',
            show_debug: false,
            feedback: {
                question_text: this.getLastUserQuestion(),
                skill_id: route?.selected_skill_id || '',
                template_code: 'DIAGNOSTIC_CHAIN',
                result_count: 0,
                answer_quality: chain?.success ? 'OK' : 'PARTIAL'
            }
        });
    }

    private submitExecuteInquiry(
        route: any,
        execPayload: any,
        enrichmentOverride: ReturnType<typeof this.buildEnrichmentOverride>,
        itemCardOverride?: ReturnType<typeof this.buildItemCardOverride>
    ): void {
        // Diagnostic skills (prefix DA) use the rule-based chain endpoint
        // instead of the regular execute flow.
        if (route?.intent_type === 'DIAGNOSTIC' && this.isDiagnosticSkill(execPayload.skill_id)) {
            const chainPayload = {
                skill_id: execPayload.skill_id,
                retailer_id: execPayload.retailer_id,
                question_text: execPayload.question_text,
                entities: execPayload.entities || {},
                bindings: execPayload.bindings || {}
            };
            this._svc.runDiagnosticChain(chainPayload).subscribe({
                next: (chain: any) => this.handleDiagnosticChainResponse(route, chain),
                error: () => this.failExecuteInquiry()
            });
            return;
        }

        const forcedTemplate = execPayload.template_code
            ? String(execPayload.template_code).trim()
            : '';
        const entities = { ...(execPayload.entities || {}) };
        const orderRef = entities.order_ref || entities.ORDER_REF
            || this.extractOrderRefFromText(execPayload.question_text);
        if (orderRef && !entities.lu_id && !entities.LU_ID) {
            entities.order_ref = String(orderRef);
        }

        if (this.shouldChainOrderRefToItemCard(
            route, entities, enrichmentOverride, forcedTemplate || undefined, itemCardOverride,
            execPayload.question_text
        )) {
            this.runOrderRefLookupThenItemCard(route, execPayload, String(entities.order_ref));
            return;
        }

        if (!this.shouldChainEanToItemCard(
            route, entities, enrichmentOverride, forcedTemplate || undefined, itemCardOverride
        )) {
            this._svc.executeInquiry(execPayload).subscribe({
                next: (exec: any) => this.finishExecuteInquiry(route, exec, enrichmentOverride, execPayload),
                error: () => this.failExecuteInquiry()
            });
            return;
        }

        const eanVariants = this.normalizeEanLookupVariants(entities.ean || entities.EAN);
        if (!eanVariants.length) {
            this._svc.executeInquiry(execPayload).subscribe({
                next: (exec: any) => this.finishExecuteInquiry(route, exec, enrichmentOverride, execPayload),
                error: () => this.failExecuteInquiry()
            });
            return;
        }

        this.runBarcodeLookupThenItemCard(route, execPayload, eanVariants, 0);
    }

    private runOrderRefLookupThenItemCard(
        route: any,
        basePayload: any,
        orderRef: string
    ): void {
        const lookupPayload = {
            ...basePayload,
            template_code: 'ITM_ORDER_REF_LOOKUP',
            entities: { order_ref: orderRef },
            bindings: { order_ref: orderRef }
        };

        this._svc.executeInquiry(lookupPayload).subscribe({
            next: (lookupExec: any) => {
                const luId = this.extractLuIdFromBarcodeRows(lookupExec?.result_rows || []);
                if (luId) {
                    this.currentSessionContext.entities = {
                        ...(this.currentSessionContext.entities || {}),
                        order_ref: orderRef,
                        lu_id: luId
                    };
                    this.executeItemCardAfterLookup(
                        route,
                        basePayload,
                        'Resolved reference to order ' + orderRef + ' to item LU ' + luId + '.',
                        luId,
                        lookupExec
                    );
                    return;
                }

                this.prependHumanSummary(
                    lookupExec,
                    'No GOLD item matched reference to order ' + orderRef + '.'
                );
                this.finishExecuteInquiry(route, lookupExec, null);
            },
            error: () => this.failExecuteInquiry()
        });
    }

    private runBarcodeLookupThenItemCard(
        route: any,
        basePayload: any,
        eanVariants: string[],
        variantIndex: number
    ): void {
        const ean = eanVariants[variantIndex];
        const lookupPayload = {
            ...basePayload,
            template_code: 'ITM_BARCODE_LOOKUP',
            entities: { ...(basePayload.entities || {}), ean },
            bindings: { ...(basePayload.bindings || {}), ean }
        };

        this._svc.executeInquiry(lookupPayload).subscribe({
            next: (lookupExec: any) => {
                const luId = this.extractLuIdFromBarcodeRows(lookupExec?.result_rows || []);
                if (luId) {
                    this.currentSessionContext.entities = {
                        ...(this.currentSessionContext.entities || {}),
                        ean,
                        lu_id: luId
                    };
                    this.executeItemCardAfterLookup(
                        route,
                        basePayload,
                        'Resolved EAN ' + ean + ' to item LU ' + luId + '.',
                        luId,
                        lookupExec
                    );
                    return;
                }

                if (variantIndex + 1 < eanVariants.length) {
                    this.runBarcodeLookupThenItemCard(route, basePayload, eanVariants, variantIndex + 1);
                    return;
                }

                this.prependHumanSummary(
                    lookupExec,
                    'No GOLD item matched EAN ' + eanVariants[0] +
                    (eanVariants.length > 1 ? ' (also tried alternate UPC/GTIN formats).' : '.')
                );
                this.finishExecuteInquiry(route, lookupExec, null);
            },
            error: () => this.failExecuteInquiry()
        });
    }

    private finishExecuteInquiry(
        route: any,
        exec: any,
        enrichmentOverride: ReturnType<typeof this.buildEnrichmentOverride>,
        execPayload?: any
    ): void {
        this.timelineEvents[3].done = true;
        this.timelineEvents[3].date = new Date();
        this.timelineEvents[4].done = true;
        this.timelineEvents[4].date = new Date();
        this.running = false;
        if (enrichmentOverride) { this.pendingEnrichment = null; }

        // Vendor disambiguation — clear the stash once /execute returns real rows.
        // On 0-result attempts (wrong vendor, inactive supplier) the stash persists
        // so the user can pick a different candidate without re-routing.
        if (this.pendingVendorClarification
                && Array.isArray(exec?.result_rows)
                && exec.result_rows.length > 0) {
            this.pendingVendorClarification = null;
        }

        // Issue 7 — when /execute returns parameter_gaps for a RECOVERABLE_GAPS
        // entity and we have the original execPayload, stash it and prompt the
        // user instead of showing a dead-end "I need X" message with no follow-up.
        // Enrichment turns (pendingEnrichment) already have their own stash path.
        //
        // Guard: do NOT prompt for lu_id when:
        //   - The routed skill is DSD/VENDOR/SUPPLIER domain (wrong entity entirely), OR
        //   - The session has active vendor_text (user is mid-vendor-disambiguation;
        //     pendingVendorClarification handles their next reply).
        if (execPayload && !enrichmentOverride && Array.isArray(exec?.parameter_gaps) && exec.parameter_gaps.length) {
            const skillCode = String(route?.selected_skill_code || '').toUpperCase();
            const isVendorDomainSkill = /DSD|VENDOR|SUPPLIER/.test(skillCode);
            const hasVendorContext = !!(this.currentSessionContext?.entities?.vendor_text);
            const recoverableGap = exec.parameter_gaps.find((g: string) => {
                if (!RECOVERABLE_GAPS[g]) { return false; }
                if (g === 'lu_id' && (isVendorDomainSkill || hasVendorContext)) { return false; }
                return true;
            });
            if (recoverableGap) {
                this.awaitingAssistant = false;
                this.promptForGapResolution(route, execPayload, recoverableGap, RECOVERABLE_GAPS[recoverableGap].prompt);
                return;
            }
        }

        this.handleExecuteResponse(route, exec);
        this.awaitingAssistant = false;
    }

    private failExecuteInquiry(): void {
        this.running = false;
        this.awaitingAssistant = false;
        this.conclusion = {
            label: 'Execution failed',
            detail: 'Could not load template execution context from AI engine.',
            severity: 'danger'
        };
        this.pushTurn('assistant', 'I could not execute the selected skill template context. Please retry or refine your question.');
    }

    // ── Phase 12 — Conversational enrichment helpers ──────────────────────────
    //
    // The flow: user asks "tell me about item 100100" → ITM_ARTICLE_HEADER fires
    // → session.entities.lu_id = '100100'. User then asks "add retail price for
    // store 10" — we want to land on ITM_FULL_ATTRIBUTES with include_retail='Y'
    // and reuse the prior lu_id. The detection below runs after /route returns
    // and BEFORE /execute, so we override `template_code` and `bindings` rather
    // than touch engine code.

    /** Match enrichment columns the user wants added to the item card. */
    private detectEnrichmentFlags(text: string): {
        include_retail?: 'Y'; include_ean?: 'Y'; include_history?: 'Y'; include_order_ref?: 'Y';
    } {
        const t = String(text || '').toLowerCase();
        const flags: any = {};
        if (/\b(retail|shelf\s+price|sale\s+price|current\s+price|promo\s+price|the\s+price)\b/.test(t)) {
            flags.include_retail = 'Y';
        }
        if (/\b(ean|upc|gtin|barcode)s?\b/.test(t)) {
            flags.include_ean = 'Y';
        }
        if (/\b(price\s+history|retail\s+history|price\s+changes?|last\s+90|past\s+90)\b/.test(t)) {
            flags.include_history = 'Y';
        }
        if (/\b(ref\.?\s*to\s*order|reference\s+to\s*order|order\s+ref|ord\.?\s*\/\s*rec|order(?:ing)?\s+reference)\b/.test(t)) {
            flags.include_order_ref = 'Y';
        }
        return flags;
    }

    /**
     * "and the retail", "add ean", "plus history", "include EAN codes",
     * "with retail", "also retail" — anything that smells like a continuation
     * rather than a fresh standalone question.
     */
    private hasContinuationMarker(text: string): boolean {
        const t = String(text || '');
        if (/\b(and|also|add|plus|with|include|enrich|consolidate|merge)\b/i.test(t)) { return true; }
        if (/\bshow\s+(me\s+)?(the\s+)?(retail|ean|upc|barcode|ref|order|reference|price\s+history)\b/i.test(t)) {
            return true;
        }
        return false;
    }

    /** True when we already have an item LU bound from a prior turn. */
    private hasItemContextInSession(): boolean {
        const e = this.currentSessionContext?.entities || {};
        return !!(e.lu_id || e.LU_ID);
    }

    /**
     * Pull a bare numeric reply ("10", "store 10", "041") as a site_id when
     * we already asked the user for one. Belt-and-braces — the BIND_HINTs
     * ("at store", "for store") usually catch this on /route already.
     */
    private extractSiteIdFromReply(text: string): string | null {
        const m = String(text || '').match(/\b(?:store|site|at)\s*0*(\d{1,5})\b/i);
        if (m) { return m[1]; }
        const bare = String(text || '').trim();
        if (/^\d{1,5}$/.test(bare)) { return bare; }
        return null;
    }

    // ── Issue 7 — gap-entity recovery helpers ────────────────────────────────

    /** Try to extract the requested entity value from the user's gap reply. */
    private extractEntityValueFromReply(text: string, gapEntity: string): string | null {
        const gap = RECOVERABLE_GAPS[gapEntity];
        if (!gap) { return null; }
        return gap.detect(String(text || '').trim());
    }

    /**
     * True when the reply is short and contains the expected entity type.
     * Prevents a brand-new multi-word question from accidentally resuming the stash.
     */
    private looksLikeGapReply(text: string, gapEntity: string): boolean {
        const t = String(text || '').trim();
        if (!t) { return false; }
        if (t.split(/\s+/).length > 8) { return false; }
        return this.extractEntityValueFromReply(t, gapEntity) !== null;
    }

    /**
     * Try to identify which candidate supplier the user selected from the
     * disambiguation list. Handles three reply patterns:
     *   1. Explicit code in parens or bare: "(06966)", "06966"
     *   2. Name substring match (longest wins): "LIPARI FOODS INC."
     *   3. Ordinal: "the first", "1", "option 2"
     * Returns the matching supplier_id string, or null if no candidate matched.
     */
    private extractSupplierFromCandidates(text: string, candidates: any[]): string | null {
        const t = String(text || '').trim();
        if (!candidates?.length || !t) { return null; }

        // 1 — explicit supplier code in parentheses: "(06966)" or "(AO0696672)"
        //     Also match bare all-digit codes like "06966" as a standalone token.
        const codeInParens = t.match(/\(([A-Z0-9]{3,12})\)/i);
        const bareDigitCode = t.match(/\b(\d{5,8})\b/);
        const codeTokens = [
            codeInParens ? codeInParens[1] : null,
            bareDigitCode ? bareDigitCode[1] : null
        ].filter(Boolean) as string[];

        for (const raw of codeTokens) {
            const codeNorm = raw.replace(/^0+/, '').toUpperCase();
            const hit = candidates.find((c: any) => {
                const id = String(c.supplier_id || c.SUPPLIER_ID || '').trim();
                const idNorm = id.replace(/^0+/, '').toUpperCase();
                return idNorm === codeNorm || id.toUpperCase() === raw.toUpperCase();
            });
            if (hit) { return String(hit.supplier_id || hit.SUPPLIER_ID); }
        }

        // 2 — supplier name substring (longest match wins, case-insensitive)
        const tUp = t.toUpperCase();
        let bestHit: any = null;
        let bestLen = 0;
        for (const c of candidates) {
            const name = String(c.supplier_name || c.SUPPLIER_NAME || '').trim().toUpperCase();
            if (name && tUp.includes(name) && name.length > bestLen) {
                bestHit = c;
                bestLen = name.length;
            }
        }
        if (bestHit) { return String(bestHit.supplier_id || bestHit.SUPPLIER_ID); }

        // 3 — ordinal selection ("first", "1", "option 1", "second", "2")
        if (/\b(first|1st|one|option\s*1|#\s*1|\b1\b)\b/i.test(t) && candidates[0]) {
            return String(candidates[0].supplier_id || candidates[0].SUPPLIER_ID);
        }
        if (/\b(second|2nd|two|option\s*2|#\s*2|\b2\b)\b/i.test(t) && candidates[1]) {
            return String(candidates[1].supplier_id || candidates[1].SUPPLIER_ID);
        }

        return null;
    }

    /**
     * Stash the execute payload, show a targeted prompt, and pause execution.
     * The next turn in processInquiry will check pendingGapResolution and resume.
     */
    private promptForGapResolution(route: any, execPayload: any, gapEntity: string, promptText: string): void {
        this.pendingGapResolution = { execPayload, route, gapEntity };
        this.pushTurn('assistant', promptText);
        this.timelineEvents.forEach((ev: any) => { if (!ev.done) { ev.done = true; ev.date = new Date(); } });
    }

    /**
     * True when the reply looks like the user is supplying the site code we
     * asked for (bare number, "store 10", or contains a store-like phrase).
     * Used to decide if pendingEnrichment should resume; otherwise typing a
     * brand-new question while pending would wrongly re-fire the old enrichment.
     */
    private looksLikeSiteIdReply(text: string): boolean {
        const t = String(text || '').trim();
        if (!t) { return false; }
        // Bare numeric reply (1–5 digits): "7", "041"
        if (/^\d{1,5}$/.test(t)) { return true; }
        // Short reply that mentions a store / site code
        if (/^(at\s+)?(store|site)\s+0*\d{1,5}\.?$/i.test(t)) { return true; }
        return false;
    }

    /**
     * Walk chatTurns backwards to find the skill_id that fired the last item-
     * card execute (ITM_ARTICLE_HEADER or ITM_FULL_ATTRIBUTES). We need this
     * because the user's enrichment reply ("add retail", "7") doesn't carry
     * enough signal for /route to land on ITEM_MASTER_RETAIL — we have to
     * force the skill ourselves so the engine looks for ITM_FULL_ATTRIBUTES
     * inside the right skill.
     */
    private findLastItemCardSkillId(): string | null {
        for (let i = this.chatTurns.length - 1; i >= 0; i -= 1) {
            const turn = this.chatTurns[i];
            if (turn?.role !== 'assistant') { continue; }
            const tpl = String(turn?.meta?.template_code || '').toUpperCase();
            if (tpl === 'ITM_ARTICLE_HEADER' || tpl === 'ITM_FULL_ATTRIBUTES') {
                const sid = turn?.meta?.feedback?.skill_id;
                if (sid) { return String(sid); }
            }
        }
        return null;
    }

    /**
     * Force ITM_ARTICLE_HEADER when the user (or a chip) asks for the item card
     * and we already have lu_id — e.g. after ITM_BARCODE_LOOKUP resolved the EAN.
     */
    private buildItemCardOverride(
        route: any,
        questionText: string
    ): { skill_id: string; template_code: string; bindings: any; entities: any } | null {
        const lu = this.currentSessionContext?.entities?.lu_id
            || this.currentSessionContext?.entities?.LU_ID;
        if (!lu) { return null; }
        const t = String(questionText || '').toLowerCase();
        if (!/\b(item card|full item|tell me about item|info on item|show (me )?item)\b/.test(t)) {
            return null;
        }
        const skillId = this.findLastItemCardSkillId() || route?.selected_skill_id;
        if (!skillId) { return null; }
        const luStr = String(lu);
        const entities: any = { lu_id: luStr };
        const site = this.currentSessionContext?.entities?.site_id
            || this.currentSessionContext?.entities?.SITE_ID;
        if (site) { entities.site_id = site; }
        return {
            skill_id: skillId,
            template_code: 'ITM_ARTICLE_HEADER',
            bindings: { lu_id: luStr },
            entities
        };
    }

    /**
     * If retail enrichment is requested but no site_id is in session entities,
     * we can't run ITM_FULL_ATTRIBUTES (the OUTER APPLY filter `:site_id IS
     * NOT NULL` would drop the retail row). Ask for the store first; persist
     * the flags AND the owning skill_id so the next turn picks them back up.
     */
    private promptForSiteIdBeforeEnrichment(
        flagsToFire: { include_retail?: 'Y'; include_ean?: 'Y'; include_history?: 'Y'; include_order_ref?: 'Y' },
        skillId: string | null
    ): void {
        this.pendingEnrichment = {
            ...flagsToFire,
            skill_id: skillId || undefined
        };
        const luPart = this.currentSessionContext?.entities?.lu_id
            ? ' for item ' + this.currentSessionContext.entities.lu_id
            : '';
        this.pushTurn(
            'assistant',
            'For which store should I look up retail' + luPart + '? ' +
            'Reply with the store code — e.g., `store 10` or just `10`.'
        );
        this.running = false;
        this.awaitingAssistant = false;
        this.timelineEvents.forEach((ev: any) => { if (!ev.done) { ev.done = true; ev.date = new Date(); } });
    }

    /**
     * Decide whether the user's question is an enrichment of the item card
     * already in scope. If so, return the skill_id + template_code + bindings
     * + entities the /execute call must use. Otherwise return null (normal
     * routing). The return shape carries skill_id because the user's bare
     * reply ("7") otherwise routes to whatever scrap of vocab matches — not
     * ITEM_MASTER_RETAIL.
     */
    private buildEnrichmentOverride(
        route: any,
        questionText: string
    ): { skill_id: string; template_code: string; bindings: any; entities: any } | null {
        const reuseSiteId = this.extractSiteIdFromReply(questionText);

        // Branch A — we're resuming a paused enrichment (pendingEnrichment was
        // set earlier because we asked for site_id). Only resume if the reply
        // actually looks like a site code; otherwise the user changed topic
        // (e.g. typed "tell me about item 200200") and we must clear the stash
        // so the new question routes normally.
        if (this.pendingEnrichment) {
            if (!this.looksLikeSiteIdReply(questionText)) {
                this.pendingEnrichment = null;
                return null;
            }
            const pending = this.pendingEnrichment;
            const flags: any = {};
            if (pending.include_ean)         { flags.include_ean = pending.include_ean; }
            if (pending.include_retail)      { flags.include_retail = pending.include_retail; }
            if (pending.include_history)     { flags.include_history = pending.include_history; }
            if (pending.include_order_ref)   { flags.include_order_ref = pending.include_order_ref; }
            const entities: any = { ...(this.currentSessionContext.entities || {}) };
            if (reuseSiteId && !entities.site_id) { entities.site_id = reuseSiteId; }
            const merged = { ...(this.currentSessionContext.bindings || {}), ...flags };
            // Prefer the stashed skill_id; fall back to walking chat history.
            const skillId = pending.skill_id || this.findLastItemCardSkillId();
            if (!skillId) { return null; }
            return {
                skill_id: skillId,
                template_code: 'ITM_FULL_ATTRIBUTES',
                bindings: merged,
                entities
            };
        }

        // Branch B — fresh continuation. Require BOTH a continuation marker
        // AND an enrichment keyword AND a session lu_id. This prevents
        // standalone questions ("show price history") from being hijacked
        // — those still route to the existing single-template skills.
        if (!this.hasItemContextInSession()) { return null; }
        if (!this.hasContinuationMarker(questionText)) { return null; }
        const newFlags = this.detectEnrichmentFlags(questionText);
        if (!newFlags.include_retail && !newFlags.include_ean && !newFlags.include_history
            && !newFlags.include_order_ref) {
            return null;
        }
        const skillId = this.findLastItemCardSkillId();
        if (!skillId) { return null; }
        const merged = { ...(this.currentSessionContext.bindings || {}), ...newFlags };
        // Carry forward whatever the route extracted (e.g., the user said
        // "add retail for store 10" — the lexical pass already put site_id
        // into route.entities; we just merge it on top of session entities).
        const entities = {
            ...(this.currentSessionContext.entities || {}),
            ...(route?.entities || {})
        };
        if (reuseSiteId && !entities.site_id) { entities.site_id = reuseSiteId; }
        return {
            skill_id: skillId,
            template_code: 'ITM_FULL_ATTRIBUTES',
            bindings: merged,
            entities
        };
    }

    private processInquiry(questionText: string, resetConversation: boolean,
                           preferredSkillId?: string): void {
        if (!questionText || this.running) { return; }
        const retailerId = this.selectedRetailer?.RETAILER_ID;
        if (!retailerId) {
            this._msg.add({ severity: 'warn', summary: 'Retailer',
                detail: 'Select a retailer before running the AI assistant.' });
            return;
        }

        if (resetConversation) {
            this.resetSessionState();
        }

        this.runCounter += 1;
        this.activeRunId = this.runCounter;
        if (this.chatTurns.length) {
            this.pushRunSeparator('Run ' + this.activeRunId);
        }
        this.pushTurn('user', questionText);

        this.running = true;
        this.awaitingAssistant = true;

        const base = new Date();
        this.timelineEvents = [
            { status: 'Question received', date: base, icon: 'fas fa-comment-dots', color: '#6366f1', done: true },
            { status: 'Classifying intent', date: null, icon: 'fas fa-brain', color: '#8b5cf6', done: false },
            { status: 'Routing skill and entities', date: null, icon: 'fas fa-route', color: '#0ea5e9', done: false },
            { status: 'Loading skill templates', date: null, icon: 'fas fa-project-diagram', color: '#14b8a6', done: false },
            { status: 'Generating conclusion', date: null, icon: 'fas fa-flag-checkered', color: '#10b981', done: false }
        ];
        this.timelineEvents[1].done = true;
        this.timelineEvents[1].date = new Date();

        // Issue 7 — if a recoverable gap was stashed on the previous turn,
        // try to extract the requested entity from this reply and resume execute
        // directly (skip routing entirely). If the reply doesn't match, clear the
        // stash and let routing proceed normally.
        if (this.pendingGapResolution && !resetConversation) {
            const entityValue = this.looksLikeGapReply(questionText, this.pendingGapResolution.gapEntity)
                ? this.extractEntityValueFromReply(questionText, this.pendingGapResolution.gapEntity)
                : null;
            if (entityValue) {
                const pending = this.pendingGapResolution;
                this.pendingGapResolution = null;
                this.timelineEvents[2].done = true;
                this.timelineEvents[2].date = new Date();
                this.timelineEvents[3].done = true;
                this.timelineEvents[3].date = new Date();
                // Inject the extracted value into the stashed payload.
                pending.execPayload.entities = {
                    ...(pending.execPayload.entities || {}),
                    [pending.gapEntity]: entityValue
                };
                pending.execPayload.bindings = {
                    ...(pending.execPayload.bindings || {}),
                    [pending.gapEntity]: entityValue
                };
                this.currentSessionContext.entities = {
                    ...(this.currentSessionContext.entities || {}),
                    [pending.gapEntity]: entityValue
                };
                this.submitExecuteInquiry(pending.route, pending.execPayload, null, null);
                return;
            }
            // Reply doesn't look like the expected entity — clear stash and route normally.
            this.pendingGapResolution = null;
        }

        // Vendor disambiguation — if the previous turn showed a "which supplier?"
        // clarification (requires_clarification=true from ENGINE_VENDOR_RESOLVE),
        // try to match this reply against the candidate list. If it matches,
        // inject supplier_id into a copy of the stashed execPayload and resume
        // /execute directly without re-routing (preserving the original context).
        //
        // The stash is NOT cleared here — it persists until /execute returns rows
        // (finishExecuteInquiry clears it on success). This lets the user try the
        // wrong vendor (0 results), then immediately pick the right one without
        // re-routing through an ambiguous question that lands on a wrong skill.
        if (this.pendingVendorClarification && !resetConversation) {
            const supplierId = this.extractSupplierFromCandidates(
                questionText, this.pendingVendorClarification.candidates
            );
            if (supplierId) {
                const pending = this.pendingVendorClarification;
                this.timelineEvents[2].done = true;
                this.timelineEvents[2].date = new Date();
                this.timelineEvents[3].done = true;
                this.timelineEvents[3].date = new Date();
                // Build a one-time attempt payload (copy — stash stays pristine for retry).
                // supplier_id goes ONLY into the attempt payload, not into session context.
                // Keeping it out of session prevents it from bleeding into subsequent
                // "what about [other vendor]?" questions via the execPayload entity merge.
                const attemptPayload = {
                    ...pending.execPayload,
                    supplier_id: supplierId,
                    entities: { ...(pending.execPayload.entities || {}), supplier_id: supplierId },
                    bindings: { ...(pending.execPayload.bindings || {}), supplier_id: supplierId }
                };
                // Use a resolved-route copy so handleExecuteResponse does NOT re-render
                // the clarification text ("Which one did you mean?") after the user
                // already selected a supplier.
                const resolvedRoute = { ...pending.route, requires_clarification: false };
                this.submitExecuteInquiry(resolvedRoute, attemptPayload, null, null);
                return;
            }
            // User typed something unrelated — clear stash and route normally.
            this.pendingVendorClarification = null;
        }

        const routePayload: any = {
            retailer_id: retailerId,
            question_text: questionText
        };
        if (preferredSkillId) {
            routePayload.preferred_skill_id = preferredSkillId;
        }

        // Phase 11 — fire /diagnose in parallel so the Engine diagnostics
        // panel always has scored candidates + vocab matches + bind feasibility,
        // even when /route fails entirely. Best-effort; never blocks the run.
        this._svc.diagnoseInquiry({ retailer_id: retailerId, question_text: questionText })
            .subscribe({
                next: (diag: any) => { this.diagResult = diag || null; },
                error: () => { /* diagnostics are non-essential */ }
            });

        this._svc.routeInquiry(routePayload).subscribe({
            next: (route: any) => {
                this.routeResult = route || {};
                this.routeError = null;
                if (!this.designerSelectedSkill) {
                    this.syncDesignerSkillFromRoute();
                }
                // Capture previous vendor before merging so we can detect a vendor switch.
                const prevVendorText = String(
                    this.currentSessionContext?.entities?.vendor_text || ''
                ).toUpperCase();
                this.currentSessionContext.entities = {
                    ...(this.currentSessionContext.entities || {}),
                    ...(route?.entities || {})
                };
                // Vendor-switch guard — if the question mentions a NEW supplier name
                // (vendor_text changed) but the engine hasn't yet resolved supplier_id,
                // clear the stale supplier_id from the previous vendor so it doesn't
                // bleed into this execute context.
                // e.g. "What about MIDLAND?" after a Lipari session: prevVendor=LIPARI,
                // newVendor=MIDLAND, route.entities.supplier_id=null → drop "06966".
                const newVendorText = String(
                    route?.entities?.vendor_text || ''
                ).toUpperCase();
                if (newVendorText
                        && newVendorText !== prevVendorText
                        && route?.entities?.supplier_id == null) {
                    delete this.currentSessionContext.entities.supplier_id;
                }
                this.timelineEvents[2].done = true;
                this.timelineEvents[2].date = new Date();
                this.evidenceFacts.unshift(
                    'Route: skill=' + (route?.selected_skill_code || '-') +
                    ', intent=' + (route?.intent_type || '-') +
                    ', confidence=' + (route?.confidence || 0)
                );
                this.confidence = this.normalizeConfidence(route?.confidence, this.confidence);

                this.maybeLogUnresolved(route, questionText, retailerId);

                // Phase 12 — conversational enrichment. If the question is a
                // follow-up like "add retail" / "and the EAN" / "with price
                // history" (or the user is replying with a missing site_id
                // after a previous prompt), pivot to ITM_FULL_ATTRIBUTES with
                // the accumulated include_* flags. The engine still routed to
                // ITEM_MASTER_RETAIL via vocab; we override the template pick.
                const enrichmentOverride = this.buildEnrichmentOverride(route, questionText);
                const itemCardOverride = enrichmentOverride
                    ? null
                    : this.buildItemCardOverride(route, questionText);
                const executeOverride = enrichmentOverride || itemCardOverride;
                if (enrichmentOverride
                    && enrichmentOverride.bindings.include_retail === 'Y'
                    && !enrichmentOverride.entities.site_id) {
                    // Retail requested but no store known yet — ask first.
                    // Stash the owning skill_id so the next turn can force it
                    // regardless of what /route picks on a bare "7" reply.
                    this.promptForSiteIdBeforeEnrichment({
                        include_retail: 'Y',
                        include_ean: enrichmentOverride.bindings.include_ean || undefined,
                        include_history: enrichmentOverride.bindings.include_history || undefined,
                        include_order_ref: enrichmentOverride.bindings.include_order_ref || undefined
                    }, enrichmentOverride.skill_id);
                    return;
                }
                if (executeOverride) {
                    // Persist the merged bindings + entities so subsequent
                    // turns keep adding columns rather than starting over.
                    this.currentSessionContext.bindings = executeOverride.bindings;
                    this.currentSessionContext.entities = executeOverride.entities;
                }

                const execPayload: any = {
                    // CRITICAL: override skill_id when enriching. /route may
                    // have landed on DSD_VENDOR_RETAIL / CONVERSATIONAL_ASSISTANT
                    // for a thin reply like "7" or "add retail", and the engine
                    // looks up `template_code` *inside the skill it was given*.
                    // Without this override, ITM_FULL_ATTRIBUTES isn't found in
                    // DSD_VENDOR_RETAIL and the engine falls back to a feasible
                    // template (e.g. DSD_ARTICLE_SITE_STATUS).
                    skill_id: executeOverride
                        ? executeOverride.skill_id
                        : route?.selected_skill_id,
                    intent_type: route?.intent_type,
                    // supplier_id is NOT carried from session context — the engine must
                    // re-resolve it from vendor_text via ENGINE_VENDOR_RESOLVE each time.
                    // Carrying it forward caused stale vendor codes to be used for follow-up
                    // questions about different vendors ("What about Midland?").
                    // Exception: when executeOverride (enrichment/item-card) supplies it,
                    // it comes through the override's entities, not here.
                    supplier_id: route?.entities?.supplier_id || null,
                    retailer_id: retailerId,
                    question_text: questionText,
                    entities: executeOverride
                        ? executeOverride.entities
                        : (() => {
                            // Merge session + route entities, but strip stale supplier_id
                            // from session — ENGINE_VENDOR_RESOLVE resolves it fresh.
                            const merged: any = {
                                ...(this.currentSessionContext.entities || {}),
                                ...(route?.entities || {})
                            };
                            if (!route?.entities?.supplier_id) { delete merged.supplier_id; }
                            return merged;
                        })(),
                    bindings: executeOverride
                        ? executeOverride.bindings
                        : (this.currentSessionContext.bindings || {})
                };
                if (executeOverride) {
                    execPayload.template_code = executeOverride.template_code;
                }

                // Vendor disambiguation — when ENGINE_VENDOR_RESOLVE found multiple
                // candidates the engine sets requires_clarification=true.
                // Two paths:
                //   A) The user's question text already contains the supplier code or
                //      exact name (e.g. "LIPARI FOODS INC. (06966)" after seeing the
                //      list) → self-resolve immediately: inject supplier_id and let
                //      execute run without another clarification round.
                //   B) The name is ambiguous and the text gives no hint → stash the
                //      execPayload so the NEXT reply can identify the selection and
                //      resume execute directly (skipping /route entirely).
                if (route?.requires_clarification
                        && Array.isArray(route?.candidate_options)
                        && route.candidate_options.length
                        && !executeOverride) {
                    const selfResolvedId = this.extractSupplierFromCandidates(
                        questionText, route.candidate_options
                    );
                    if (selfResolvedId) {
                        // Path A — inject supplier now; no stash needed.
                        // Also clear requires_clarification on the route object so
                        // handleExecuteResponse does not re-render the "Which one?"
                        // message after the supplier is already resolved.
                        execPayload.supplier_id = selfResolvedId;
                        execPayload.entities = {
                            ...(execPayload.entities || {}),
                            supplier_id: selfResolvedId
                        };
                        execPayload.bindings = {
                            ...(execPayload.bindings || {}),
                            supplier_id: selfResolvedId
                        };
                        this.currentSessionContext.entities = {
                            ...(this.currentSessionContext.entities || {}),
                            supplier_id: selfResolvedId
                        };
                        route.requires_clarification = false;
                        this.pendingVendorClarification = null;
                    } else {
                        // Path B — can't resolve from text; stash for the next reply
                        this.pendingVendorClarification = {
                            execPayload: { ...execPayload },
                            route,
                            candidates: route.candidate_options
                        };
                    }
                } else {
                    // Clean route (no clarification needed) — clear any stale stash
                    this.pendingVendorClarification = null;
                }

                this.submitExecuteInquiry(route, execPayload, enrichmentOverride, itemCardOverride);
            },
            error: (err: any) => {
                this.running = false;
                this.awaitingAssistant = false;

                const status = Number(err?.status || 0);
                const body = err?.error ?? err;
                const serverMsg = (body && (body.error || body.message))
                    ? String(body.error || body.message)
                    : '';
                const serverHint = body && body.hint ? String(body.hint) : '';
                this.routeError = {
                    status,
                    message: serverMsg || 'Route endpoint did not respond.',
                    body
                };

                this.conclusion = {
                    label: 'Routing failed (HTTP ' + (status || '???') + ')',
                    detail: [serverMsg, serverHint].filter(Boolean).join(' — ')
                        || 'No detail returned by /api/ai/engine/route.',
                    severity: 'danger'
                };

                this._msg.add({
                    severity: 'error',
                    summary: 'AI engine',
                    detail: serverMsg
                        ? ('Route failed: ' + serverMsg)
                        : 'Route endpoint failed. Open Engine diagnostics for details.'
                });

                const parts: string[] = [];
                parts.push(serverMsg
                    ? 'Routing failed before execution: ' + serverMsg + '.'
                    : 'Routing failed before execution.');
                if (serverHint) { parts.push('Fix: ' + serverHint); }
                if (this.isAiAdmin) {
                    parts.push('Open Engine diagnostics below for the full backend response.');
                } else {
                    parts.push('Try rephrasing your question or choose a suggested intent if offered.');
                }
                const routeMeta = this.isAiAdmin ? {} : this.buildAnalystRoutingMeta(this.routeResult || {});
                this.pushTurn('assistant', parts.join(' '), routeMeta);
            }
        });
    }

    runInvestigation(): void {
        this.processInquiry(this.queryText, true);
        this.queryText = '';
    }

    continueDiscussion(): void {
        const text = this.followUpText;
        if (!text || !text.trim()) { return; }
        this.followUpText = '';
        this.processInquiry(text, false);
    }

    /**
     * Pick the first numeric confidence available, normalize 0–1 to 0–100, and
     * clamp to the visible 0–100 range. Engine returns 0–100 today, but we keep
     * this defensive in case a route returns a probability.
     */
    private normalizeConfidence(...candidates: any[]): number {
        for (const raw of candidates) {
            if (raw === null || raw === undefined || raw === '') { continue; }
            const n = Number(raw);
            if (!Number.isFinite(n)) { continue; }
            const scaled = n > 0 && n <= 1 ? n * 100 : n;
            return Math.max(0, Math.min(100, Math.round(scaled)));
        }
        return 0;
    }

    /** SVG ring geometry for the inline confidence gauge (r=52). */
    readonly gaugeCircumference = 2 * Math.PI * 52;

    /** Dash offset = full circumference when 0%, 0 when 100%. */
    get gaugeDashOffset(): number {
        const pct = Math.max(0, Math.min(100, Number(this.confidence) || 0));
        return this.gaugeCircumference * (1 - pct / 100);
    }

    /** Color for the gauge based on confidence band — red / amber / green. */
    get confidenceColor(): string {
        if (this.confidence > 80) { return '#10b981'; }
        if (this.confidence >= 50) { return '#f59e0b'; }
        return '#ef4444';
    }

    /** PrimeNG severity used for the band tag next to the gauge. */
    get confidenceSeverity(): string {
        if (this.confidence > 80) { return 'success'; }
        if (this.confidence >= 50) { return 'warning'; }
        return 'danger';
    }

    /** Short band label shown beside the gauge. */
    get confidenceLabel(): string {
        if (this.confidence > 80) { return 'High confidence'; }
        if (this.confidence >= 50) { return 'Good match'; }
        return 'Not very sure which skill fits';
    }

    /** One-line explanation of what the gauge is telling the user. */
    get confidenceHint(): string {
        if (this.confidence > 80) {
            return 'The router is highly confident this skill matches your question.';
        }
        if (this.confidence >= 50) {
            return 'The router found a good skill match. Provide bindings or a clearer question to lift confidence above 80.';
        }
        return 'The router is not confident yet. Add vocabulary, refine the question, or pick the skill manually so the engine can learn.';
    }

    // ── Fix 4: Oracle error detection ─────────────────────────────────────────
    isOracleErrorRow(rows: any[]): boolean {
        if (!rows || !rows.length) { return false; }
        const firstKey = Object.keys(rows[0])[0] || '';
        return /ORA-\d{4,}|EXECUTINGISSUE|DBMS_SQL|INVALIDIDENTIFIER/i.test(firstKey);
    }

    getOracleErrorFriendly(): string {
        return "I ran into a data issue while querying your GOLD database. " +
               "This SQL template needs a fix — the issue has been noted.";
    }

    // ── Debug helpers ─────────────────────────────────────────────────────────

    /**
     * Pull the raw Oracle error text out of the result rows.
     *
     * The Heinens GOLD execution wrapper sometimes returns errors as a single
     * row whose first column NAME contains the ORA-xxxx code (e.g. column
     * key `"ORA-00942 table or view does not exist"`). Other times the value
     * is in a column called `EXECUTINGISSUE_*`. We try the column name first,
     * then values, and finally fall back to `executionError` (set when the
     * engine's `qErr` branch fired). Returns '' when no error is present.
     */
    getOracleErrorRaw(): string {
        if (this.executionError && this.executionError.trim()) {
            return this.executionError.trim();
        }
        if (!this.resultRows || !this.resultRows.length) { return ''; }
        const row = this.resultRows[0] || {};
        const keys = Object.keys(row);
        const errKey = keys.find(k => /ORA-\d{4,}|EXECUTINGISSUE|DBMS_SQL|INVALIDIDENTIFIER/i.test(k));
        if (errKey) {
            const v = row[errKey];
            if (v != null && String(v).trim() !== '') {
                return `${errKey}\n${String(v).trim()}`;
            }
            return errKey;
        }
        for (const k of keys) {
            const v = row[k];
            if (typeof v === 'string' && /ORA-\d{4,}/.test(v)) { return v; }
        }
        return '';
    }

    /** True when we have something interesting to show in the debug panel.
     *  Now covers routing-only cases (no SQL was run) so the analyst can
     *  still see why a question failed to route. */
    hasDebugInfo(): boolean {
        if (this.executedSql && this.executedSql.trim().length) { return true; }
        if (this.routeError) { return true; }
        if (this.diagResult && (this.diagResult.skills?.length || this.diagResult.intent_type)) { return true; }
        if (this.routeResult && Object.keys(this.routeResult || {}).length) { return true; }
        return false;
    }

    /**
     * Phase 11 — routing diagnostics helpers.
     *
     * These power the "Engine diagnostics" card so designers can answer
     *   1. Why was THIS skill picked? (top-N candidates + score breakdown)
     *   2. What did the engine extract? (intent, entities, bind hints)
     *   3. Why did the chosen skill not run? (per-template missing binds)
     *   4. What did GOLD return? (executed SQL + Oracle error)
     */

    /** Top 10 scored skill candidates (descending). Cap raised in Phase 11
     *  so analysts can spot a skill that *should* have won but landed at #6+. */
    getDiagSkills(): any[] {
        const list = Array.isArray(this.diagResult?.skills) ? this.diagResult.skills : [];
        return list.slice(0, 10);
    }

    /** Templates the chosen skill exposes, with bind feasibility. */
    getDiagTemplates(): any[] {
        const list = Array.isArray(this.diagResult?.top_templates) ? this.diagResult.top_templates : [];
        return list;
    }

    /** Non-empty extracted_entities keys for the entity table. */
    getEntityKeysWithValues(): string[] {
        const e = this.diagResult?.extracted_entities;
        if (!e) { return []; }
        return Object.keys(e).filter(k => e[k] != null && e[k] !== '');
    }

    /** Map a router score → 0..100% bar width (120 ≈ "very confident"). */
    scoreBarWidth(score: number): string {
        const n = Number(score) || 0;
        const w = Math.max(0, Math.min(100, Math.round((n / 120) * 100)));
        return w + '%';
    }

    scoreSeverity(score: number): 'danger' | 'warning' | 'success' {
        const n = Number(score) || 0;
        if (n < 45) { return 'danger'; }
        if (n < 80) { return 'warning'; }
        return 'success';
    }

    bindStatusSeverity(status: string): 'danger' | 'warning' | 'success' | 'info' {
        if (status === 'FEASIBLE') { return 'success'; }
        if (status === 'FEASIBLE_RESOLVER') { return 'info'; }
        return 'warning';
    }

    /** Pretty-printed JSON of the full routing diagnostics for one-click sharing. */
    getDiagJson(): string {
        const payload = {
            route: this.routeResult || null,
            route_error: this.routeError || null,
            diag: this.diagResult || null,
            executed_sql: this.executedSql || null,
            bind_context: this.bindContext || null,
            execution_error: this.executionError || null
        };
        try { return JSON.stringify(payload, null, 2); }
        catch { return String(payload); }
    }

    copyDiagJson(): void {
        this.copyToClipboard(this.getDiagJson(), 'Engine diagnostics JSON');
    }

    /** Pretty-printed JSON of the route HTTP error body. */
    getRouteErrorJson(): string {
        if (!this.routeError) { return ''; }
        try { return JSON.stringify(this.routeError, null, 2); }
        catch { return String(this.routeError); }
    }

    /** Pretty-printed JSON of the bind context for the debug panel. */
    getBindContextJson(): string {
        if (!this.bindContext) { return ''; }
        try {
            return JSON.stringify(this.bindContext, null, 2);
        } catch {
            return String(this.bindContext);
        }
    }

    /** Toggle the debug panel. */
    toggleDebug(): void {
        this.showDebug = !this.showDebug;
    }

    /** Copy a string to the clipboard with a tiny toast for feedback. */
    private copyToClipboard(text: string, label: string): void {
        if (!text) { return; }
        const finalize = (ok: boolean) => {
            this._msg.add({
                severity: ok ? 'success' : 'error',
                summary: ok ? 'Copied' : 'Copy failed',
                detail: ok ? `${label} copied to clipboard.` : `Could not copy ${label.toLowerCase()}.`
            });
        };
        if (navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(text).then(() => finalize(true)).catch(() => finalize(false));
            return;
        }
        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            const ok = document.execCommand('copy');
            document.body.removeChild(ta);
            finalize(ok);
        } catch {
            finalize(false);
        }
    }

    copyExecutedSql(): void { this.copyToClipboard(this.executedSql, 'SQL'); }
    copyOracleError(): void { this.copyToClipboard(this.getOracleErrorRaw(), 'Error message'); }

    // ── Result export (CSV / Excel) ───────────────────────────────────────────

    /** Whether the current results can be exported (rows present and not an Oracle error). */
    canExportResults(): boolean {
        return Array.isArray(this.resultRows)
            && this.resultRows.length > 0
            && Array.isArray(this.resultColumns)
            && this.resultColumns.length > 0
            && !this.isOracleErrorRow(this.resultRows);
    }

    /**
     * Build a filename like `ai_assistant_DSD_VENDOR_RETAIL_2026-05-10T20-30-12`.
     * The export service appends the correct extension.
     */
    private buildExportFileName(): string {
        const skill = String(this.routeResult?.selected_skill_code || 'ai_assistant')
            .replace(/[^A-Za-z0-9_\-]+/g, '_');
        const ts = new Date().toISOString().replace(/[:.]/g, '-').replace(/Z$/, '');
        return `ai_assistant_${skill}_${ts}`;
    }

    /**
     * Convert one cell to a CSV-safe string. Quotes embedded ", wraps in "..." when
     * the value contains a delimiter, quote, or newline. Null/undefined → empty.
     */
    private toCsvCell(value: any): string {
        if (value === null || value === undefined) { return ''; }
        let s: string;
        if (value instanceof Date) {
            s = value.toISOString();
        } else if (typeof value === 'object') {
            try { s = JSON.stringify(value); } catch { s = String(value); }
        } else {
            s = String(value);
        }
        if (/[",\r\n]/.test(s)) {
            s = '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
    }

    /** Build a CSV string from the current resultColumns + resultRows. */
    private buildCsvFromResults(): string {
        const cols = this.resultColumns || [];
        const lines: string[] = [];
        lines.push(cols.map(c => this.toCsvCell(c)).join(','));
        for (const row of this.resultRows || []) {
            lines.push(cols.map(c => this.toCsvCell(row?.[c])).join(','));
        }
        return lines.join('\r\n');
    }

    /** Trigger a browser download for an in-memory blob. */
    private downloadBlob(blob: Blob, filename: string): void {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        // Give the browser a tick to start the download before revoking
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }

    /** Export current AI Assistant results to a CSV file. */
    downloadResultsCsv(): void {
        if (!this.canExportResults()) { return; }
        const csv = this.buildCsvFromResults();
        // Prepend UTF-8 BOM so Excel opens accents/non-ASCII characters correctly.
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        this.downloadBlob(blob, this.buildExportFileName() + '.csv');
        this._msg.add({
            severity: 'success',
            summary: 'Export',
            detail: `Downloaded ${this.resultRows.length} rows as CSV.`
        });
    }

    /** Export current AI Assistant results to an XLSX file. */
    downloadResultsExcel(): void {
        if (!this.canExportResults()) { return; }
        // Project rows onto the displayed resultColumns so the sheet ordering matches the UI.
        const cols = this.resultColumns || [];
        const rows = (this.resultRows || []).map(r => {
            const flat: any = {};
            for (const c of cols) { flat[c] = r?.[c] ?? ''; }
            return flat;
        });
        const sheetName = String(this.routeResult?.selected_skill_code || 'Results')
            .slice(0, 30) || 'Results';
        const fileBase = this.buildExportFileName();
        try {
            const p = this._exportService.saveJsonAsXlsx(rows, fileBase, sheetName);
            if (p && typeof (p as any).then === 'function') {
                (p as any).then(() => {
                    this._msg.add({
                        severity: 'success',
                        summary: 'Export',
                        detail: `Downloaded ${rows.length} rows as Excel.`
                    });
                }).catch((err: any) => {
                    console.error('Excel export failed', err);
                    this._msg.add({
                        severity: 'error',
                        summary: 'Export failed',
                        detail: 'Could not build the Excel file. See console for details.'
                    });
                });
            }
        } catch (err) {
            console.error('Excel export failed', err);
            this._msg.add({
                severity: 'error',
                summary: 'Export failed',
                detail: 'Could not build the Excel file. See console for details.'
            });
        }
    }

    // ── Phase 12 — per-turn inline result helpers ─────────────────────────────

    /** True when this turn has tabular rows attached (and they aren't an Oracle error blob). */
    turnHasResults(t: any): boolean {
        const cols = t?.meta?.result_columns;
        const rows = t?.meta?.result_rows;
        return Array.isArray(cols) && cols.length > 0
            && Array.isArray(rows) && rows.length > 0;
    }

    /**
     * Phase 12 — return the human-readable enrichment labels for a turn.
     * Reads the include_* flags out of the captured bind_context. The labels
     * line up with the column groupings ITM_FULL_ATTRIBUTES adds.
     */
    getTurnEnrichments(t: any): string[] {
        const tpl = String(t?.meta?.template_code || '').toUpperCase();
        if (tpl !== 'ITM_FULL_ATTRIBUTES') { return []; }
        const bc = t?.meta?.bind_context || {};
        const isOn = (v: any) => {
            if (v == null) { return false; }
            const s = String(v).trim().toUpperCase();
            return s === 'Y' || s === 'YES' || s === '1' || s === 'TRUE';
        };
        const out: string[] = [];
        if (isOn(bc.include_retail)) {
            out.push(bc.site_id ? `retail @ store ${bc.site_id}` : 'retail (no store)');
        }
        if (isOn(bc.include_ean))     { out.push('all EAN codes'); }
        if (isOn(bc.include_history)) { out.push('90-day price changes'); }
        return out;
    }

    /** True when this turn's execution returned an Oracle-style error blob. */
    turnHasError(t: any): boolean {
        if (t?.meta?.is_oracle_error) { return true; }
        const err = t?.meta?.execution_error;
        return typeof err === 'string' && err.trim().length > 0;
    }

    /**
     * Pull the raw Oracle / engine error text out of a turn. Looks at the
     * captured `execution_error` first, then the result-row error pattern.
     */
    getTurnRawError(t: any): string {
        const direct = t?.meta?.execution_error;
        if (typeof direct === 'string' && direct.trim()) { return direct.trim(); }
        const rows = t?.meta?.result_rows;
        if (!Array.isArray(rows) || !rows.length) { return ''; }
        const row = rows[0] || {};
        const keys = Object.keys(row);
        const errKey = keys.find(k => /ORA-\d{4,}|EXECUTINGISSUE|DBMS_SQL|INVALIDIDENTIFIER/i.test(k));
        if (errKey) {
            const v = row[errKey];
            return (v != null && String(v).trim() !== '')
                ? `${errKey}\n${String(v).trim()}`
                : errKey;
        }
        for (const k of keys) {
            const v = row[k];
            if (typeof v === 'string' && /ORA-\d{4,}/.test(v)) { return v; }
        }
        return '';
    }

    /** True when this turn captured executed SQL we can show in its debug panel. */
    turnHasDebug(t: any): boolean {
        const sql = t?.meta?.executed_sql;
        return typeof sql === 'string' && sql.trim().length > 0;
    }

    /** Toggle the inline debug panel for one turn. */
    toggleTurnDebug(t: any): void {
        if (!t || !t.meta) { return; }
        t.meta.show_debug = !t.meta.show_debug;
    }

    /** Pretty-printed JSON of the turn's bind context. */
    getTurnBindContextJson(t: any): string {
        const ctx = t?.meta?.bind_context;
        if (!ctx) { return ''; }
        try { return JSON.stringify(ctx, null, 2); }
        catch { return String(ctx); }
    }

    /** Whether this specific turn can be exported. */
    canExportTurn(t: any): boolean {
        return this.turnHasResults(t) && !this.turnHasError(t);
    }

    /** Build a turn-specific filename including its template code + timestamp. */
    private buildTurnExportFileName(t: any): string {
        const skill = String(t?.meta?.skill_code || this.routeResult?.selected_skill_code || 'ai_assistant')
            .replace(/[^A-Za-z0-9_\-]+/g, '_');
        const template = String(t?.meta?.template_code || '').replace(/[^A-Za-z0-9_\-]+/g, '_');
        const stamp = (t?.at instanceof Date ? t.at : new Date())
            .toISOString().replace(/[:.]/g, '-').replace(/Z$/, '');
        return ['ai_assistant', skill, template, stamp].filter(Boolean).join('_');
    }

    /** Export one turn's rows to CSV. */
    downloadTurnCsv(t: any): void {
        if (!this.canExportTurn(t)) { return; }
        const cols: string[] = t.meta.result_columns || [];
        const rows: any[] = t.meta.result_rows || [];
        const lines: string[] = [];
        lines.push(cols.map(c => this.toCsvCell(c)).join(','));
        for (const row of rows) {
            lines.push(cols.map(c => this.toCsvCell(row?.[c])).join(','));
        }
        const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
        this.downloadBlob(blob, this.buildTurnExportFileName(t) + '.csv');
        this._msg.add({
            severity: 'success',
            summary: 'Export',
            detail: `Downloaded ${rows.length} rows as CSV.`
        });
    }

    /** Export one turn's rows to XLSX. */
    downloadTurnExcel(t: any): void {
        if (!this.canExportTurn(t)) { return; }
        const cols: string[] = t.meta.result_columns || [];
        const projected = (t.meta.result_rows || []).map((r: any) => {
            const flat: any = {};
            for (const c of cols) { flat[c] = r?.[c] ?? ''; }
            return flat;
        });
        const sheetName = String(t?.meta?.skill_code || 'Results').slice(0, 30) || 'Results';
        const fileBase = this.buildTurnExportFileName(t);
        try {
            const p = this._exportService.saveJsonAsXlsx(projected, fileBase, sheetName);
            if (p && typeof (p as any).then === 'function') {
                (p as any).then(() => {
                    this._msg.add({
                        severity: 'success',
                        summary: 'Export',
                        detail: `Downloaded ${projected.length} rows as Excel.`
                    });
                }).catch((err: any) => {
                    console.error('Excel export failed', err);
                    this._msg.add({
                        severity: 'error',
                        summary: 'Export failed',
                        detail: 'Could not build the Excel file. See console for details.'
                    });
                });
            }
        } catch (err) {
            console.error('Excel export failed', err);
            this._msg.add({
                severity: 'error',
                summary: 'Export failed',
                detail: 'Could not build the Excel file. See console for details.'
            });
        }
    }

    /** Copy this turn's executed SQL. */
    copyTurnSql(t: any): void {
        this.copyToClipboard(t?.meta?.executed_sql || '', 'SQL');
    }

    /** Copy this turn's raw error. */
    copyTurnError(t: any): void {
        this.copyToClipboard(this.getTurnRawError(t), 'Error message');
    }

    // ── Follow-up suggestions ─────────────────────────────────────────────────

    /**
     * Build 2–3 follow-up chips driven by intent_type + skill_code + result state.
     * Chips are computed once when the assistant turn is pushed and cached on
     * `turn.meta.suggestions` so the template doesn't re-run logic each CD pass.
     */
    private computeFollowUpSuggestions(ctx: {
        intent_type?: string;
        skill_code?: string;
        template_code?: string;
        result_count?: number;
        answer_quality?: string;
        designer_required?: boolean;
    }): string[] {
        const intent = String(ctx.intent_type || '').toUpperCase();
        const skill = String(ctx.skill_code || '').toUpperCase();
        const template = String(ctx.template_code || '').toUpperCase();
        const aq = String(ctx.answer_quality || '').toUpperCase();
        const rowCount = Number(ctx.result_count || 0);

        if (ctx.designer_required) {
            return [
                'Try with another supplier',
                'What skills are available?',
                'Show me the supplier list'
            ];
        }
        if (aq === 'PARTIAL_NON_ITEM_ROWS') {
            return [
                'Show me only the item LU codes',
                'Try a different supplier',
                'Filter by active items only'
            ];
        }
        if (skill.includes('CONVERSATIONAL')) {
            return [
                'What items can I buy from a supplier?',
                'Why is store 041 out of stock?',
                'Show me the supplier list'
            ];
        }

        // Phase 10 + 12 — granular drill-downs across ITEM_MASTER_RETAIL templates.
        // Chip text is authored with INTENT_PHRASE words ("retail price",
        // "all variants", "ean code", "price history") so the engine re-routes
        // the follow-up. For enrichment chips ("Add retail price", "Add EAN
        // codes", "Add price history"), the text BOTH matches new vocab in
        // script 29 (routes to ITM_FULL_ATTRIBUTES) AND triggers the client-
        // side enrichment override that forces template_code + include_* flags.
        // The existing entity context (lu_id, site_id, …) is carried over by
        // `currentSessionContext`, so the user doesn't need to re-type the LU.
        if (skill.includes('ITEM_MASTER_RETAIL') || skill === 'ITEM_RETAIL') {
            // Once the user is looking at a card, enrichment chips win over
            // "show a different table" chips — they keep the consolidated view.
            if (template === 'ITM_ARTICLE_HEADER') {
                return ['Add reference to order', 'Add retail price', 'Add EAN codes', 'Add price history'];
            }
            if (template === 'ITM_FULL_ATTRIBUTES') {
                // Surface only the flags that aren't already on, so the chips
                // grow the table progressively rather than firing no-op execs.
                const bindings = this.currentSessionContext?.bindings || {};
                const chips: string[] = [];
                if (bindings.include_order_ref !== 'Y') { chips.push('Add reference to order'); }
                if (bindings.include_retail !== 'Y')    { chips.push('Add retail price'); }
                if (bindings.include_ean !== 'Y')        { chips.push('Add EAN codes'); }
                if (bindings.include_history !== 'Y')    { chips.push('Add price history'); }
                // Always offer the full audit table as an escape hatch — that
                // one is fundamentally M:N per variant and renders as its own
                // table rather than a card column.
                chips.push('Show full price history');
                return chips.slice(0, 3);
            }
            if (template === 'ITM_VARIANTS') {
                return ['Show retail price', 'Show EAN codes', 'Show price history'];
            }
            if (template === 'ITM_EAN_FOR_LU') {
                return ['Show retail price', 'Show all variants', 'Show price history'];
            }
            if (template === 'ITM_RETAIL_ACTIVE') {
                return rowCount === 0
                    ? ['Show price history', 'Show all variants', 'Show EAN codes']
                    : ['Show price history', 'Show EAN codes', 'Show all variants'];
            }
            if (template === 'ITM_RETAIL_HISTORY') {
                return ['Show current retail price', 'Show all variants', 'Show EAN codes'];
            }
            if (template === 'ITM_BARCODE_LOOKUP') {
                const lu = this.currentSessionContext?.entities?.lu_id
                    || this.currentSessionContext?.entities?.LU_ID;
                if (lu) {
                    return [
                        'Tell me about item ' + lu,
                        'Add reference to order',
                        'Add retail price',
                        'Show all variants'
                    ];
                }
                return ['Show retail price', 'Show all variants', 'Show EAN codes'];
            }
            // Skill matched but template unknown (router didn't pick one yet)
            return ['Show retail price', 'Show all variants', 'Show EAN codes'];
        }
        if (intent === 'ANALYSIS' || skill.includes('SUPPLIER_HEALTH')) {
            return rowCount === 0
                ? ['Try a wider date range', 'Check a different supplier', 'Show open orders for this supplier']
                : ['Show receiving activity for this supplier', 'List open orders', 'Check a different date range'];
        }
        if (intent === 'RETRIEVAL') {
            if (skill.includes('DSD_VENDOR') || skill.includes('VENDOR')) {
                return [
                    'Filter by active items only',
                    'Show me the same for another store',
                    'Are there any delivery exceptions for this supplier?'
                ];
            }
            if (skill.includes('ITEM')) {
                return [
                    'Show me only stocked items',
                    'Filter by active items only',
                    'Compare with last week\'s catalog'
                ];
            }
            if (rowCount === 0) {
                return ['Try another supplier', 'Widen the date range', 'Show active items only'];
            }
            return ['Filter by active items only', 'Show me the same for another store', 'Compare with last week'];
        }
        if (intent === 'DIAGNOSTIC' || skill.includes('DELIVERY_EXCEPTION') || skill.includes('STOCK_VARIANCE')) {
            if (skill.includes('STOCK')) {
                return ['Show negative stock items at this store', 'Check replenishment parameters', 'List open orders for this item'];
            }
            return [
                'Show open orders pending receipt',
                'Check recent receiving movements',
                'Are there invoice discrepancies?'
            ];
        }
        return [
            'What items can I buy from a supplier?',
            'Are there any delivery exceptions this week?',
            'How is supplier performance looking?'
        ];
    }

    /** Index of the most recent assistant turn — used to scope the chips. */
    get lastAssistantTurnIndex(): number {
        for (let i = this.chatTurns.length - 1; i >= 0; i -= 1) {
            if (this.chatTurns[i]?.role === 'assistant') { return i; }
        }
        return -1;
    }

    /** Click on a suggestion chip — sends the chip as a follow-up question. */
    askFollowUp(text: string): void {
        if (this.running || !text || !String(text).trim()) { return; }
        if (!this.selectedRetailer?.RETAILER_ID) {
            this._msg.add({
                severity: 'warn',
                summary: 'Retailer',
                detail: 'Select a retailer before sending a follow-up.'
            });
            return;
        }
        this.processInquiry(String(text).trim(), false);
    }

    // ── Feedback / thumbs ─────────────────────────────────────────────────────
    /** turn index → 'up' | 'down' (one click per assistant message). */
    feedbackSent: { [idx: number]: 'up' | 'down' } = {};
    /** turn index → in-flight POST flag (disables both buttons during send). */
    private feedbackBusy: { [idx: number]: boolean } = {};

    canSendFeedback(turn: any, idx: number): boolean {
        if (!turn || turn.role !== 'assistant') { return false; }
        if (this.feedbackSent[idx]) { return false; }
        if (this.feedbackBusy[idx]) { return false; }
        return !!this.selectedRetailer?.RETAILER_ID;
    }

    isFeedbackBusy(idx: number): boolean {
        return !!this.feedbackBusy[idx];
    }

    sendFeedback(turn: any, idx: number, thumb: 'up' | 'down'): void {
        if (!this.canSendFeedback(turn, idx)) { return; }
        const meta = (turn?.meta?.feedback) || {};
        const payload = {
            retailer_id: this.selectedRetailer.RETAILER_ID,
            question_text: meta.question_text || this.getLastUserQuestion(),
            skill_id: meta.skill_id || '',
            template_code: meta.template_code || '',
            result_count: Number(meta.result_count || 0),
            answer_quality: meta.answer_quality || '',
            thumb
        };
        this.feedbackBusy[idx] = true;
        this._svc.sendEngineFeedback(payload).subscribe({
            next: () => {
                this.feedbackBusy[idx] = false;
                this.feedbackSent[idx] = thumb;
                this._msg.add({
                    severity: thumb === 'up' ? 'success' : 'info',
                    summary: 'Feedback recorded',
                    detail: thumb === 'up'
                        ? 'Thanks — logged as a positive answer.'
                        : 'Thanks — logged so the team can improve this skill.'
                });

                // Phase 4a — a thumb-down also flags this question for the
                // "Pending phrasings" admin queue so vocabulary can be tuned.
                if (thumb === 'down' && this.routeResult) {
                    this.logUnresolved(this.routeResult, payload.question_text,
                        this.selectedRetailer.RETAILER_ID, 'THUMB_DOWN');
                }
            },
            error: () => {
                this.feedbackBusy[idx] = false;
                this._msg.add({
                    severity: 'error',
                    summary: 'Feedback',
                    detail: 'Could not save feedback. Please retry.'
                });
            }
        });
    }

    /**
     * Phase 5 — re-run the previous question forcing the engine to use the
     * skill the analyst clicked from the alternative chips. The same retailer
     * + question text are reused; the engine returns route + execute as
     * usual but with `preferred_skill_id` overriding the scorer.
     */
    tryAlternativeSkill(alt: { skill_id: string; skill_code: string }): void {
        if (!alt || !alt.skill_id || this.running) { return; }
        const lastQuestion = this.getLastUserQuestion();
        if (!lastQuestion) { return; }
        const retailerId = this.selectedRetailer?.RETAILER_ID;
        const previousRoute = this.routeResult || {};

        // Record the override in AI_ENGINE_UNRESOLVED so admins see exactly
        // which alternative skill the analyst picked (the picked code lands
        // in second_skill_code; the engine's wrong pick is in top_skill_code).
        if (retailerId) {
            this._svc.logUnresolvedPhrasing({
                retailer_id: retailerId,
                question_text: lastQuestion,
                normalized_text: previousRoute?.routing_diagnostics?.normalized_text || '',
                top_skill_id: previousRoute?.selected_skill_id || '',
                top_skill_code: previousRoute?.selected_skill_code || '',
                top_score: previousRoute?.routing_diagnostics?.top_score,
                second_skill_code: alt.skill_code,
                second_score: undefined,
                intent_type: previousRoute?.intent_type,
                reason: 'USER_OVERRIDE'
            }).subscribe({
                next: () => { /* fire-and-forget */ },
                error: () => { /* fire-and-forget */ }
            });
        }

        this._msg.add({
            severity: 'info',
            summary: 'Routing to ' + alt.skill_code,
            detail: 'Re-running with the skill you picked. If that works, an admin can promote this phrasing from "Pending phrasings".'
        });
        this.processInquiry(lastQuestion, false, alt.skill_id);
    }

    /**
     * Phase 4a — when /route returns a low-confidence answer, drop the
     * question into AI_ENGINE_UNRESOLVED so an admin can promote it from the
     * Skill Studio "Pending phrasings" screen.
     */
    private maybeLogUnresolved(route: any, questionText: string, retailerId: string): void {
        const diag = route?.routing_diagnostics;
        if (!diag || !diag.low_confidence) { return; }
        this.logUnresolved(route, questionText, retailerId, 'LOW_CONFIDENCE');
    }

    private logUnresolved(route: any, questionText: string, retailerId: string,
                          reason: 'LOW_CONFIDENCE' | 'THUMB_DOWN' | 'PARAM_GAP'): void {
        const diag = route?.routing_diagnostics || {};
        this._svc.logUnresolvedPhrasing({
            retailer_id: retailerId,
            question_text: questionText,
            normalized_text: diag.normalized_text || '',
            top_skill_id: diag.top_skill_id || route?.selected_skill_id || '',
            top_skill_code: diag.top_skill_code || route?.selected_skill_code || '',
            top_score: diag.top_score,
            second_skill_code: diag.second_skill_code,
            second_score: diag.second_score,
            intent_type: route?.intent_type,
            reason
        }).subscribe({
            next: () => { /* fire-and-forget */ },
            error: () => { /* fire-and-forget */ }
        });
    }

    // ── SHARE ─────────────────────────────────────────────────────────────────

    copyTurnText(t: any): void {
        this.copyToClipboard(t?.text || '', 'Answer text');
    }

    exportConversation(): void {
        if (!this.chatTurns.length) { return; }
        const lines: string[] = [
            'AI Assistant — Session Export',
            `Retailer: ${this.selectedRetailer?.RETAILER_NAME || this.selectedRetailer?.RETAILER_ID || '-'}`,
            `Date: ${new Date().toLocaleString()}`,
            '─'.repeat(60)
        ];
        for (const t of this.chatTurns) {
            if (t.role === 'separator') {
                lines.push('', `[ ${t.text} ]`);
            } else {
                const who = t.role === 'user' ? 'You' : 'Assistant';
                const time = t.at instanceof Date ? t.at.toLocaleTimeString() : '';
                lines.push('', `[${time}] ${who}:`);
                lines.push(t.text);
                if (t.meta?.result_count != null && t.meta.result_count > 0) {
                    lines.push(`(${t.meta.result_count} rows · ${t.meta.template_code || t.meta.skill_code || 'SQL'})`);
                }
            }
        }
        const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
        const retailerCode = String(this.selectedRetailer?.RETAILER_ID || 'session')
            .replace(/[^A-Za-z0-9_]/g, '_');
        const ts = new Date().toISOString().replace(/[:.]/g, '-').replace(/Z$/, '');
        this.downloadBlob(blob, `ai_session_${retailerCode}_${ts}.txt`);
        this._msg.add({
            severity: 'success',
            summary: 'Export',
            detail: `Conversation exported (${this.chatTurns.filter(t => t.role !== 'separator').length} messages).`
        });
    }

    // ── ADJUST — Active context editor ────────────────────────────────────────

    hasContextEntities(): boolean {
        const e = this.currentSessionContext?.entities;
        return !!e && Object.keys(e).some(k => e[k] != null && String(e[k]).trim() !== '');
    }

    getContextEntityKeys(): string[] {
        const e = this.currentSessionContext?.entities;
        if (!e) { return []; }
        return Object.keys(e).filter(k => e[k] != null && String(e[k]).trim() !== '');
    }

    startEditContext(key: string, value: any): void {
        this.contextEditKey = key;
        this.contextEditValue = String(value ?? '');
    }

    commitEditContext(): void {
        if (!this.contextEditKey) { return; }
        if (!this.currentSessionContext.entities) { this.currentSessionContext.entities = {}; }
        this.currentSessionContext.entities[this.contextEditKey] = this.contextEditValue;
        this.contextEditKey = null;
        this.contextEditValue = '';
    }

    cancelEditContext(): void {
        this.contextEditKey = null;
        this.contextEditValue = '';
    }

    removeContextEntity(key: string): void {
        if (this.currentSessionContext?.entities) {
            delete this.currentSessionContext.entities[key];
        }
    }

    startAddContext(): void { this.contextAddMode = true; }

    commitAddContext(): void {
        const k = this.contextAddKey.trim();
        const v = this.contextAddValue.trim();
        if (k && v) {
            if (!this.currentSessionContext.entities) { this.currentSessionContext.entities = {}; }
            this.currentSessionContext.entities[k] = v;
        }
        this.contextAddMode = false;
        this.contextAddKey = '';
        this.contextAddValue = '';
    }

    cancelAddContext(): void {
        this.contextAddMode = false;
        this.contextAddKey = '';
        this.contextAddValue = '';
    }

    // ── LEARN — teach correct skill after thumb-down ──────────────────────────

    submitTeachSkill(turn: any, idx: number): void {
        const skill = this.thumbDownTeachSkill[idx];
        if (!skill) { return; }
        const retailerId = this.selectedRetailer?.RETAILER_ID;
        if (!retailerId) { return; }
        const meta = turn?.meta?.feedback || {};
        this._svc.logUnresolvedPhrasing({
            retailer_id: retailerId,
            question_text: meta.question_text || this.getLastUserQuestion(),
            normalized_text: this.routeResult?.routing_diagnostics?.normalized_text || '',
            top_skill_id: meta.skill_id || this.routeResult?.selected_skill_id || '',
            top_skill_code: this.routeResult?.selected_skill_code || meta.template_code || '',
            top_score: this.routeResult?.routing_diagnostics?.top_score,
            second_skill_code: skill.SKILL_CODE,
            intent_type: this.routeResult?.intent_type,
            reason: 'THUMB_DOWN'
        }).subscribe({
            next: () => {
                this.thumbDownTeachDone[idx] = true;
                this.thumbDownTeachVisible[idx] = false;
                this._msg.add({
                    severity: 'success',
                    summary: 'Phrase taught',
                    detail: `Logged for skill "${skill.SKILL_CODE}". An admin can promote it from Pending phrasings.`
                });
            },
            error: () => {
                this._msg.add({
                    severity: 'error',
                    summary: 'Teach failed',
                    detail: 'Could not save the phrase. Please retry.'
                });
            }
        });
    }

    // ── EXTEND — designer panel visibility ───────────────────────────────────

    /** Show the designer panel when SQL templates are missing (requestedSql) OR when
     *  the engine matched no skill at all (low confidence + no selected skill). */
    get showDesignerPanel(): boolean {
        if (this.requestedSql.length > 0) { return true; }
        if (!this.chatTurns.some(t => t.role === 'assistant')) { return false; }
        const noSkillMatched = !this.routeResult?.selected_skill_id
            || (this.diagResult?.low_confidence && !this.resultRows.length && !this.requestedSql.length);
        return !!noSkillMatched;
    }

    createNewSkillFromQuestion(): void {
        const question = this.getLastUserQuestion();
        const draft: Record<string, string> = {
            templateCode: '',
            sqlText: '',
            purpose: question ? `Answer: "${question}"` : '',
            templateLabel: 'New skill from assistant',
            sourceQuestion: question
        };
        try {
            sessionStorage.setItem(ASSISTANT_SQL_DRAFT_STORAGE_KEY, JSON.stringify(draft));
        } catch { /* ignore */ }
        this._router.navigate(['/ai/skill-studio/builder'], {
            queryParams: { openSql: '1', fromAssistant: '1' }
        });
    }
}

