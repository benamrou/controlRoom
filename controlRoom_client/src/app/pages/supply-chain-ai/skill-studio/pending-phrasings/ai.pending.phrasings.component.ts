import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { MessageService, ConfirmationService } from "primeng/api";
import { forkJoin } from "rxjs";

import { UserService } from "src/app/shared/services";
import { AiRetailerService } from "src/app/shared/services/ai/ai.retailer.service";
import { AiSkillService } from "src/app/shared/services/ai/ai.skill.service";

interface PendingPhrasingRow {
    UNRES_ID: number;
    RETAILER_ID: string;
    QUESTION_TEXT: string;
    NORMALIZED_TEXT?: string;
    TOP_SKILL_ID?: string;
    TOP_SKILL_CODE?: string;
    TOP_SCORE?: number;
    SECOND_SKILL_CODE?: string;
    SECOND_SCORE?: number;
    INTENT_TYPE?: string;
    REASON?: string;
    ASKED_BY?: string;
    ASKED_AT?: string;
    // Editor state (client-only)
    _targetSkillId?: string;
    _term?: string;
    _termType?: string;
    _concept?: string;
    _confidenceBoost?: number;
    _busy?: boolean;
    _expanded?: boolean;
}

interface AutoPromoteCandidate {
    PHRASE_NORM: string;
    SKILL_CODE: string;
    RETAILER_ID: string;
    TARGET_SKILL_ID: string;
    TARGET_SKILL_NAME?: string;
    TARGET_DOMAIN?: string;
    HIT_COUNT: number;
    DISTINCT_USERS: number;
    SAMPLE_QUESTION?: string;
    FIRST_SEEN?: string;
    LAST_SEEN?: string;
    // Editor state (client-only)
    _selected?: boolean;
    _busy?: boolean;
    _promoted?: boolean;
    _failed?: boolean;
}

@Component({
    selector: "ai-pending-phrasings-cmp",
    templateUrl: "./ai.pending.phrasings.component.html",
    styleUrls: ["./ai.pending.phrasings.component.scss"],
    encapsulation: ViewEncapsulation.None,
    providers: [MessageService]
})
export class AiPendingPhrasingsComponent implements OnInit {

    rows: PendingPhrasingRow[] = [];
    loading = false;

    skills: { skillId: string; code: string; name: string; domain: string }[] = [];
    skillOptions: { label: string; value: string }[] = [];

    readonly termTypeOptions = [
        { label: "INTENT_PHRASE — full question pattern (×9)", value: "INTENT_PHRASE" },
        { label: "SYNONYM — single-word substitution (×4)",   value: "SYNONYM" },
        { label: "BIND_HINT — bind pointer ('for store')",    value: "BIND_HINT" },
        { label: "JARGON — domain term (×5)",                  value: "JARGON" },
        { label: "BRAND_TERM — vendor/brand alias (×5)",       value: "BRAND_TERM" },
        { label: "ABBREVIATION — short form",                  value: "ABBREVIATION" },
        { label: "PROCESS_TERM — workflow term",               value: "PROCESS_TERM" }
    ];

    // ── Phase 7 — auto-promote dialog state ────────────────────────────────
    autoPromoteOpen = false;
    autoPromoteLoading = false;
    autoPromoteRunning = false;
    autoPromoteCandidates: AutoPromoteCandidate[] = [];
    autoThresholds = { minUsers: 2, minHits: 3, lookbackDays: 90, boost: 1.0 };

    constructor(
        public _user: UserService,
        private _svc: AiRetailerService,
        private _skillSvc: AiSkillService,
        private _msg: MessageService,
        private _confirm: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.loadAll();
    }

    get isAdmin(): boolean {
        return this._user.userInfo?.aiAdmin === 1;
    }

    loadAll(): void {
        this.loading = true;
        forkJoin({
            unresolved: this._svc.listUnresolvedPhrasings("-1", 200),
            skills:     this._skillSvc.listTemplateSkills()
        }).subscribe({
            next: (result: any) => {
                const skillRows = this.unwrap(result.skills);
                this.skills = skillRows.map((s: any) => ({
                    skillId: String(s.SKILL_ID || s.skill_id || ""),
                    code:    String(s.SKILL_CODE || s.skill_code || ""),
                    name:    String(s.SKILL_NAME || s.skill_name || ""),
                    domain:  String(s.DOMAIN || s.domain || "")
                })).filter(s => s.skillId);
                this.skillOptions = this.skills.map(s => ({
                    label: `${s.code} — ${s.name || s.domain}`.trim(),
                    value: s.skillId
                }));

                const unresolvedRows = this.unwrap(result.unresolved);
                this.rows = unresolvedRows.map((r: any) => this.normalizeRow(r));
                this.loading = false;
            },
            error: (err: any) => {
                this.loading = false;
                this._msg.add({ severity: "error", summary: "Load failed",
                    detail: "Could not load pending phrasings or skills. Check AI0000072 / AI0000040." });
                console.error(err);
            }
        });
    }

    refresh(): void {
        this.loadAll();
    }

    promote(row: PendingPhrasingRow): void {
        if (row._busy) { return; }
        if (!row._targetSkillId) {
            this._msg.add({ severity: "warn", summary: "Target skill",
                detail: "Pick the skill that should learn this phrasing." });
            return;
        }
        const term = (row._term || row.NORMALIZED_TEXT || row.QUESTION_TEXT || "").trim();
        if (!term) {
            this._msg.add({ severity: "warn", summary: "Term",
                detail: "Enter a term/phrase to add to the vocabulary." });
            return;
        }
        const termType = row._termType || "INTENT_PHRASE";
        const concept  = (row._concept || "GENERAL_INTENT").trim();
        const boost    = row._confidenceBoost != null ? row._confidenceBoost : 1.5;

        row._busy = true;
        // Step 1 — insert into AI_SKILL_VOCABULARY
        this._svc.promoteUnresolvedToVocabulary({
            unres_id: row.UNRES_ID,
            skill_id: row._targetSkillId,
            term,
            canonical_concept: concept,
            term_type: termType as any,
            confidence_boost: boost
        }).subscribe({
            next: () => {
                // Step 2 — stamp PROMOTED_AT on the unresolved row
                this._svc.stampUnresolvedAsPromoted({
                    unres_id: row.UNRES_ID,
                    promoted_term: term,
                    promoted_concept: concept,
                    promoted_skill_id: row._targetSkillId!
                }).subscribe({
                    next: () => {
                        row._busy = false;
                        this.rows = this.rows.filter(r => r.UNRES_ID !== row.UNRES_ID);
                        this._msg.add({ severity: "success", summary: "Promoted",
                            detail: `'${term}' added to ${this.skillCodeFor(row._targetSkillId!)} as ${termType}.` });
                    },
                    error: () => {
                        row._busy = false;
                        this._msg.add({ severity: "warn", summary: "Promoted (partial)",
                            detail: "Vocabulary inserted, but stamp failed. Refresh to re-check status." });
                    }
                });
            },
            error: () => {
                row._busy = false;
                this._msg.add({ severity: "error", summary: "Promote failed",
                    detail: "Could not insert vocabulary row. Check AI0000073 / CHK_TERM_TYPE." });
            }
        });
    }

    dismiss(row: PendingPhrasingRow): void {
        if (row._busy) { return; }
        this._confirm.confirm({
            message: `Dismiss this phrasing without adding vocabulary?`,
            header: "Dismiss phrasing",
            icon: "pi pi-trash",
            accept: () => {
                row._busy = true;
                this._svc.dismissUnresolvedPhrasing(row.UNRES_ID).subscribe({
                    next: () => {
                        row._busy = false;
                        this.rows = this.rows.filter(r => r.UNRES_ID !== row.UNRES_ID);
                        this._msg.add({ severity: "info", summary: "Dismissed",
                            detail: "Phrasing removed from the queue." });
                    },
                    error: () => {
                        row._busy = false;
                        this._msg.add({ severity: "error", summary: "Dismiss failed",
                            detail: "Could not dismiss the phrasing. Try again." });
                    }
                });
            }
        });
    }

    toggle(row: PendingPhrasingRow): void {
        row._expanded = !row._expanded;
    }

    skillCodeFor(skillId: string): string {
        const hit = this.skills.find(s => s.skillId === skillId);
        return hit ? hit.code : skillId;
    }

    private normalizeRow(r: any): PendingPhrasingRow {
        const topSkillId   = String(r.TOP_SKILL_ID    || r.top_skill_id    || "");
        const topCode      = String(r.TOP_SKILL_CODE  || r.top_skill_code  || "");
        const secondCode   = String(r.SECOND_SKILL_CODE || r.second_skill_code || "");
        const reason       = String(r.REASON || r.reason || "");
        const question     = String(r.QUESTION_TEXT  || r.question_text  || "");
        const normalized   = String(r.NORMALIZED_TEXT || r.normalized_text || "");

        // For USER_OVERRIDE rows the user already told us which skill they
        // wanted (it's in SECOND_SKILL_CODE); pre-select that skill in the
        // promote dropdown so admins only need to click "Promote".
        let defaultSkillId = topSkillId;
        if (reason === "USER_OVERRIDE" && secondCode) {
            const preferred = this.skills.find(s => s.code === secondCode);
            if (preferred) { defaultSkillId = preferred.skillId; }
        }

        return {
            UNRES_ID:          Number(r.UNRES_ID || r.unres_id),
            RETAILER_ID:       String(r.RETAILER_ID || r.retailer_id || ""),
            QUESTION_TEXT:     question,
            NORMALIZED_TEXT:   normalized,
            TOP_SKILL_ID:      topSkillId,
            TOP_SKILL_CODE:    topCode,
            TOP_SCORE:         r.TOP_SCORE != null ? Number(r.TOP_SCORE) : undefined,
            SECOND_SKILL_CODE: secondCode,
            SECOND_SCORE:      r.SECOND_SCORE != null ? Number(r.SECOND_SCORE) : undefined,
            INTENT_TYPE:       String(r.INTENT_TYPE || r.intent_type || ""),
            REASON:            reason,
            ASKED_BY:          String(r.ASKED_BY || r.asked_by || ""),
            ASKED_AT:          String(r.ASKED_AT || r.asked_at || ""),
            _targetSkillId:    defaultSkillId,
            _term:             (normalized || question).toLowerCase().slice(0, 180),
            _termType:         "INTENT_PHRASE",
            _concept:          "GENERAL_INTENT",
            _confidenceBoost:  reason === "USER_OVERRIDE" ? 1.7 : 1.5,
            _busy:             false,
            _expanded:         false
        };
    }

    private unwrap(payload: any): any[] {
        if (Array.isArray(payload)) { return payload; }
        if (Array.isArray(payload?.rows)) { return payload.rows; }
        if (Array.isArray(payload?.data?.rows)) { return payload.data.rows; }
        if (Array.isArray(payload?.data)) { return payload.data; }
        return [];
    }

    // ─────────────────────────────────────────────────────────────────────
    // Phase 7 — auto-promote on repeat
    //
    // When the same USER_OVERRIDE phrasing has been picked by enough distinct
    // analysts inside the lookback window, we can promote it without a manual
    // review. The dialog previews the candidates first and lets the admin
    // tweak the thresholds before pressing "Promote selected".
    // ─────────────────────────────────────────────────────────────────────

    openAutoPromote(): void {
        this.autoPromoteOpen = true;
        this.loadAutoPromotable();
    }

    closeAutoPromote(): void {
        this.autoPromoteOpen = false;
    }

    loadAutoPromotable(): void {
        this.autoPromoteLoading = true;
        this.autoPromoteCandidates = [];
        this._svc.listAutoPromotable(
            "-1",
            this.autoThresholds.minUsers,
            this.autoThresholds.minHits,
            this.autoThresholds.lookbackDays
        ).subscribe({
            next: (res: any) => {
                const rows = this.unwrap(res);
                this.autoPromoteCandidates = rows.map((r: any) => this.normalizeCandidate(r));
                this.autoPromoteLoading = false;
            },
            error: (err: any) => {
                this.autoPromoteLoading = false;
                this._msg.add({ severity: "error", summary: "Load failed",
                    detail: "Could not load auto-promote candidates. Check AI0000076." });
                console.error(err);
            }
        });
    }

    autoPromoteSelectedCount(): number {
        return this.autoPromoteCandidates.filter(c => c._selected && !c._promoted).length;
    }

    toggleAutoSelectAll(checked: boolean): void {
        this.autoPromoteCandidates.forEach(c => {
            if (!c._promoted) { c._selected = checked; }
        });
    }

    runAutoPromote(): void {
        const selected = this.autoPromoteCandidates.filter(c => c._selected && !c._promoted);
        if (!selected.length) {
            this._msg.add({ severity: "warn", summary: "Nothing selected",
                detail: "Tick at least one candidate before promoting." });
            return;
        }
        this._confirm.confirm({
            message: `Auto-promote ${selected.length} phrasing(s) into AI_SKILL_VOCABULARY ` +
                     `with confidence boost ${this.autoThresholds.boost}? This is idempotent — ` +
                     `re-running on the same phrasings is a no-op.`,
            header: "Auto-promote selected phrasings",
            icon: "fas fa-arrow-up",
            accept: () => this.processAutoPromoteQueue(selected, 0)
        });
    }

    /**
     * Process the queue sequentially so we don't hammer the server with
     * 50 concurrent MERGE/UPDATE pairs. Each item runs MERGE -> STAMP, and
     * we stamp the row as `_promoted` only after both succeed.
     */
    private processAutoPromoteQueue(queue: AutoPromoteCandidate[], index: number): void {
        if (index >= queue.length) {
            this.autoPromoteRunning = false;
            const ok = queue.filter(c => c._promoted).length;
            const ko = queue.filter(c => c._failed).length;
            this._msg.add({ severity: ok ? "success" : "warn", summary: "Auto-promote done",
                detail: `${ok} promoted, ${ko} failed. Queue refreshed.` });
            // Refresh the main pending list (auto-stamped rows should now be gone).
            this.refresh();
            return;
        }
        this.autoPromoteRunning = true;
        const item = queue[index];
        item._busy = true;
        item._failed = false;

        this._svc.autoPromoteMergeVocab({
            skill_id:          item.TARGET_SKILL_ID,
            term:              item.PHRASE_NORM,
            canonical_concept: "AUTO_PROMOTED",
            term_type:         "INTENT_PHRASE",
            confidence_boost:  this.autoThresholds.boost
        }).subscribe({
            next: () => {
                this._svc.autoPromoteStamp({
                    phrase_norm:       item.PHRASE_NORM,
                    skill_code:        item.SKILL_CODE,
                    retailer_id:       item.RETAILER_ID,
                    skill_id:          item.TARGET_SKILL_ID,
                    canonical_concept: "AUTO_PROMOTED"
                }).subscribe({
                    next: () => {
                        item._busy = false;
                        item._promoted = true;
                        this.processAutoPromoteQueue(queue, index + 1);
                    },
                    error: () => {
                        item._busy = false;
                        item._failed = true;
                        // Vocabulary inserted but stamping failed — log and continue.
                        this.processAutoPromoteQueue(queue, index + 1);
                    }
                });
            },
            error: () => {
                item._busy = false;
                item._failed = true;
                this.processAutoPromoteQueue(queue, index + 1);
            }
        });
    }

    private normalizeCandidate(r: any): AutoPromoteCandidate {
        return {
            PHRASE_NORM:       String(r.PHRASE_NORM       || r.phrase_norm       || "").toLowerCase().trim(),
            SKILL_CODE:        String(r.SKILL_CODE        || r.skill_code        || ""),
            RETAILER_ID:       String(r.RETAILER_ID       || r.retailer_id       || ""),
            TARGET_SKILL_ID:   String(r.TARGET_SKILL_ID   || r.target_skill_id   || ""),
            TARGET_SKILL_NAME: String(r.TARGET_SKILL_NAME || r.target_skill_name || ""),
            TARGET_DOMAIN:     String(r.TARGET_DOMAIN     || r.target_domain     || ""),
            HIT_COUNT:         Number(r.HIT_COUNT         || r.hit_count         || 0),
            DISTINCT_USERS:    Number(r.DISTINCT_USERS    || r.distinct_users    || 0),
            SAMPLE_QUESTION:   String(r.SAMPLE_QUESTION   || r.sample_question   || ""),
            FIRST_SEEN:        String(r.FIRST_SEEN        || r.first_seen        || ""),
            LAST_SEEN:         String(r.LAST_SEEN         || r.last_seen         || ""),
            _selected:  true,
            _busy:      false,
            _promoted:  false,
            _failed:    false
        };
    }
}
