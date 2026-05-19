import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { MessageService } from "primeng/api";
import { UserService } from "src/app/shared/services";
import { AiRetailerService } from "src/app/shared/services/ai/ai.retailer.service";

interface DiagBreakdown { factor: string; delta: number; }
interface DiagVocabMatch {
    term: string;
    term_type: string;
    overlap: number;
    confidence_boost: number;
    contribution: number;
}
interface DiagSkill {
    skill_id: string;
    skill_code: string;
    skill_name: string;
    domain: string;
    score: number;
    vocab_hits: number;
    vocab_matches: DiagVocabMatch[];
    score_breakdown: DiagBreakdown[];
}
interface DiagTemplate {
    template_code: string;
    template_label: string;
    required_binds: string[];
    missing_binds: string[];
    bind_status: "FEASIBLE" | "FEASIBLE_RESOLVER" | "BIND_GAP";
}
interface DiagBindHintExtraction {
    term: string;
    concept: string;
    value: string;
    kind: "number" | "date" | "string";
    used: boolean;
    skipped_reason?: string;
    offset?: number | null;
}
interface DiagnosisResponse {
    question_text: string;
    normalized_text: string;
    tokens: string[];
    intent_type: string;
    extracted_entities: { [key: string]: string | null };
    bind_hint_extractions?: DiagBindHintExtraction[];
    top_skill_id: string | null;
    top_skill_code: string | null;
    top_score: number | null;
    low_confidence: boolean;
    skills: DiagSkill[];
    top_templates: DiagTemplate[];
}

@Component({
    selector: "ai-phrasing-playground-cmp",
    templateUrl: "./ai.phrasing.playground.component.html",
    styleUrls: ["./ai.phrasing.playground.component.scss"],
    encapsulation: ViewEncapsulation.None,
    providers: [MessageService]
})
export class AiPhrasingPlaygroundComponent implements OnInit {

    retailers: { id: string; label: string }[] = [];
    selectedRetailerId: string | null = null;

    questionText = "";
    running = false;

    diag: DiagnosisResponse | null = null;
    expandedSkills: { [skillId: string]: boolean } = {};

    /** Sample sentences designers can click to seed the input fast. */
    samples: string[] = [
        "what items can we buy from lipari for store 7",
        "list orderable items from lipari 06966",
        "tell me about article 1234567890",
        "what items we are buying from unilever",
        "site 7 buyable assortment from lipari",
        "supplier UNILEVER reliability over 90 days",
        // ── Phase 9 — Heinens / DSD jargon samples ──
        "do we still range items from lipari at store 7",
        "active dsd assortment from lipari for store 41",
        "scanback items from lipari 06966",
        "whats the fill rate for supplier 06966",
        "otif for vendor 06966 last 90 days",
        "is article 1234567890 ranged at store 7",
        "who supplies item 1234567890",
        "lookup codart 1234567890"
    ];

    constructor(
        public _user: UserService,
        private _svc: AiRetailerService,
        private _msg: MessageService
    ) {}

    ngOnInit(): void {
        this.loadRetailers();
    }

    get isAdmin(): boolean {
        return this._user.userInfo?.aiAdmin === 1;
    }

    loadRetailers(): void {
        this._svc.getRetailers().subscribe({
            next: (data: any) => {
                const rows = this.unwrap(data);
                this.retailers = rows.map((r: any) => ({
                    id: String(r.RETAILER_ID || r.retailer_id),
                    label: `${r.RETAILER_CODE || r.retailer_code || ''} — ${r.RETAILER_NAME || r.retailer_name || ''}`.trim()
                })).filter((r: any) => r.id);
                if (!this.selectedRetailerId && this.retailers.length) {
                    this.selectedRetailerId = this.retailers[0].id;
                }
            },
            error: () => {
                this._msg.add({ severity: "error", summary: "Retailers",
                    detail: "Could not load AI_RETAILER_CONFIG (AI0000002)." });
            }
        });
    }

    seedSample(s: string): void {
        this.questionText = s;
    }

    run(): void {
        const q = (this.questionText || "").trim();
        if (!q) {
            this._msg.add({ severity: "warn", summary: "Phrase",
                detail: "Type a phrase the engine should diagnose." });
            return;
        }
        if (!this.selectedRetailerId) {
            this._msg.add({ severity: "warn", summary: "Retailer",
                detail: "Pick a retailer (skills + vocabulary are filtered by active retailer set)." });
            return;
        }
        this.running = true;
        this.diag = null;
        this.expandedSkills = {};
        this._svc.diagnoseInquiry({
            retailer_id: this.selectedRetailerId,
            question_text: q
        }).subscribe({
            next: (data: DiagnosisResponse) => {
                this.diag = data;
                if (data && data.skills && data.skills.length) {
                    this.expandedSkills[data.skills[0].skill_id] = true;
                }
                this.running = false;
            },
            error: (err: any) => {
                this.running = false;
                this._msg.add({ severity: "error", summary: "Diagnose",
                    detail: "Engine /api/ai/engine/diagnose failed. Check server logs." });
                console.error(err);
            }
        });
    }

    toggleSkill(skillId: string): void {
        this.expandedSkills[skillId] = !this.expandedSkills[skillId];
    }

    /**
     * Map score → 0..100 for the bar width. 100 corresponds to "very
     * confident" (top skill ≈ 100+ in well-tuned vocabularies).
     */
    scoreBarWidth(score: number): string {
        const w = Math.max(0, Math.min(100, Math.round((score / 120) * 100)));
        return w + "%";
    }

    scoreSeverity(score: number): "danger" | "warning" | "success" {
        if (score < 45) { return "danger"; }
        if (score < 80) { return "warning"; }
        return "success";
    }

    bindStatusSeverity(status: string): "danger" | "warning" | "success" | "info" {
        if (status === "FEASIBLE") { return "success"; }
        if (status === "FEASIBLE_RESOLVER") { return "info"; }
        return "warning";
    }

    /**
     * Phase 8 — keep only entity keys with a non-empty value, so the UI
     * doesn't render "vendor_text: null" rows when nothing was extracted.
     */
    extractedEntityKeys(): string[] {
        if (!this.diag || !this.diag.extracted_entities) { return []; }
        return Object.keys(this.diag.extracted_entities)
            .filter(k => {
                const v = this.diag!.extracted_entities[k];
                return v != null && v !== "";
            });
    }

    bindHintKindSeverity(kind: string): "info" | "warning" | "success" {
        if (kind === "number") { return "success"; }
        if (kind === "date")   { return "info"; }
        return "warning";
    }

    private unwrap(payload: any): any[] {
        if (Array.isArray(payload)) { return payload; }
        if (Array.isArray(payload?.rows)) { return payload.rows; }
        if (Array.isArray(payload?.data?.rows)) { return payload.data.rows; }
        if (Array.isArray(payload?.data)) { return payload.data; }
        return [];
    }
}
