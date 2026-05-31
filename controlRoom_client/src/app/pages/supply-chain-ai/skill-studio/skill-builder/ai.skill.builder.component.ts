import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from "@angular/core";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";
import { ConfirmationService, MessageService } from "primeng/api";
import { Observable, Subscription } from "rxjs";
import { UserService } from "src/app/shared/services";
import { LabelService } from "src/app/shared/services/labels/labels.service";
import { AiSkillEditorModel, AiSkillService } from "src/app/shared/services/ai/ai.skill.service";

@Component({
    selector: "ai-skill-builder-cmp",
    templateUrl: "./ai.skill.builder.component.html",
    styleUrls: ["./ai.skill.builder.component.scss"],
    encapsulation: ViewEncapsulation.None,
    providers: [MessageService, ConfirmationService]
})
export class AiSkillBuilderComponent implements OnInit, OnDestroy {

    screenID = 'SCR0000000057';
    private static readonly ASSISTANT_SQL_DRAFT_KEY = "ICR_AI_ASSISTANT_SQL_DRAFT";

    private static readonly COLS_KNOWLEDGE = [
        { field: "ITEM_ID", header: "ID" },
        { field: "KNOWLEDGE_KEY", header: "Key" },
        { field: "LABEL", header: "Label" },
        { field: "OVERRIDE_MODE", header: "Mode" },
        { field: "PRIORITY", header: "Pri" }
    ];
    private static readonly COLS_PLAYBOOK = [
        { field: "STEP_ID", header: "ID" },
        { field: "COMPLAINT_TYPE", header: "Complaint" },
        { field: "STEP_ORDER", header: "Ord" },
        { field: "STEP_CODE", header: "Code" },
        { field: "STEP_LABEL", header: "Label" }
    ];
    private static readonly COLS_SQL = [
        { field: "TEMPLATE_ID", header: "ID" },
        { field: "TEMPLATE_CODE", header: "Code" },
        { field: "TEMPLATE_LABEL", header: "Label" },
        { field: "PURPOSE", header: "Purpose" }
    ];
    private static readonly COLS_VOCAB = [
        { field: "VOCAB_ID", header: "ID" },
        { field: "TERM", header: "Term" },
        { field: "CANONICAL_CONCEPT", header: "Concept" },
        { field: "TERM_TYPE", header: "Type" }
    ];
    private static readonly COLS_TESTS = [
        { field: "TEST_ID", header: "ID" },
        { field: "TEST_NAME", header: "Name" },
        { field: "COMPLAINT_TYPE", header: "Complaint" },
        { field: "EXPECTED_ROOT_CAUSE", header: "Expect cause" }
    ];
    private static readonly COLS_DIAG_STEP = [
        { field: "STEP_ORDER", header: "Order" },
        { field: "TEMPLATE_CODE", header: "Template" },
        { field: "STEP_LABEL", header: "Label" },
        { field: "STOP_FIELD", header: "Field" },
        { field: "STOP_OPERATOR", header: "Op" },
        { field: "STOP_VALUE", header: "Value" },
        { field: "CONCLUSION_KEY", header: "Conclusion" },
        { field: "STEP_TYPE", header: "Type" }
    ];
    private static readonly COLS_DIAG_CONCL = [
        { field: "CONCLUSION_KEY", header: "Key" },
        { field: "SEVERITY", header: "Severity" }
    ];

    pageHeading = "";
    routeSkillId: string | null = null;

    loading = false;
    saving = false;
    submitting = false;

    model: AiSkillEditorModel = this.emptyModel();

    readonly domainOptions = [
        { label: "ITEM", value: "ITEM" },
        { label: "STOCK", value: "STOCK" },
        { label: "SUPPLIER", value: "SUPPLIER" },
        { label: "PROMOTION", value: "PROMOTION" },
        { label: "MOVEMENT", value: "MOVEMENT" },
        { label: "SITE", value: "SITE" },
        { label: "DSD", value: "DSD" },
        { label: "WAREHOUSE", value: "WAREHOUSE" },
        { label: "FINANCE", value: "FINANCE" }
    ];

    activeTabIndex = 0;

    knowledgeRows: Record<string, unknown>[] = [];
    playbookRows: Record<string, unknown>[] = [];
    sqlRows: Record<string, unknown>[] = [];
    vocabRows: Record<string, unknown>[] = [];
    testRows: Record<string, unknown>[] = [];

    knowledgeCols: { field: string; header: string }[] = [];
    playbookCols: { field: string; header: string }[] = [];
    sqlCols: { field: string; header: string }[] = [];
    vocabCols: { field: string; header: string }[] = [];
    testCols: { field: string; header: string }[] = [];

    diagStepRows: Record<string, unknown>[] = [];
    diagStepCols: { field: string; header: string }[] = [];
    diagConclusionRows: Record<string, unknown>[] = [];
    diagConclusionCols: { field: string; header: string }[] = [];
    diagTestEntity = "";
    diagTestLoading = false;
    diagTestResult: any = null;

    bundleLoading: Record<string, boolean> = {
        knowledge: false,
        playbook: false,
        sql: false,
        vocab: false,
        tests: false,
        diagStep: false
    };

    bundleTried: Record<string, boolean> = {
        knowledge: false,
        playbook: false,
        sql: false,
        vocab: false,
        tests: false,
        diagStep: false
    };

    sqlProbeText = "";

    bundleDialogVisible = false;
    bundleDialogSaving = false;
    bundleDialogKind: null | "knowledge" | "playbook" | "sql" | "vocab" | "tests" | "diagStep" | "diagConclusion" = null;
    bundleForm: Record<string, string> = {};

    readonly overrideModeOptions = [
        { label: "Extend", value: "EXTEND" },
        { label: "Override", value: "OVERRIDE" }
    ];

    readonly termTypeOptions = [
        { label: "Synonym", value: "SYNONYM" },
        { label: "Abbreviation", value: "ABBREVIATION" },
        { label: "Jargon", value: "JARGON" },
        { label: "Brand term", value: "BRAND_TERM" },
        { label: "Process term", value: "PROCESS_TERM" }
    ];

    readonly insertPositionOptions = [
        { label: "Append", value: "APPEND" },
        { label: "Prepend", value: "PREPEND" },
        { label: "After step", value: "AFTER" }
    ];
    readonly operatorOptions = [
        { label: "= equals", value: "=" },
        { label: "!= not equals", value: "!=" },
        { label: "> greater than", value: ">" },
        { label: "< less than", value: "<" },
        { label: ">= gte", value: ">=" },
        { label: "<= lte", value: "<=" },
        { label: "CONTAINS", value: "CONTAINS" },
        { label: "IS NULL", value: "IS NULL" },
        { label: "IS NOT NULL", value: "IS NOT NULL" }
    ];
    readonly diagSeverityOptions = [
        { label: "Critical", value: "CRITICAL" },
        { label: "Warning", value: "WARNING" },
        { label: "Info", value: "INFO" }
    ];
    readonly stepTypeOptions = [
        { label: "HARD — abort chain on match", value: "HARD" },
        { label: "SOFT — record issue, continue", value: "SOFT" }
    ];

    private subs = new Subscription();

    constructor(
        public _user: UserService,
        private _skillSvc: AiSkillService,
        private _route: ActivatedRoute,
        private _router: Router,
        private _msg: MessageService,
        private _confirm: ConfirmationService,
        private _cdr: ChangeDetectorRef,
        private _labels: LabelService,
    ) {}

    private setPageHeading(mode: "default" | "new" | "edit", skillName?: string): void {
        if (mode === "edit" && skillName) {
            this.pageHeading = `Edit: ${skillName}`;
            return;
        }
        if (mode === "new") {
            this.pageHeading = this._labels.text("S57.TITLE.NEW", "New template skill");
            return;
        }
        this.pageHeading = this._labels.text("S57.TITLE", "Skill Builder");
    }

    ngOnInit(): void {
        this.subs.add(
            this._labels.revision$.subscribe(() => {
                if (this.routeSkillId && this.model?.name) {
                    this.setPageHeading("edit", this.model.name);
                } else if (!this.routeSkillId) {
                    this.setPageHeading("new");
                } else {
                    this.setPageHeading("default");
                }
            }),
        );
        this.subs.add(
            this._route.paramMap.subscribe((pm: ParamMap) => {
                const id = pm.get("id");
                this.routeSkillId = id && id.trim() !== "" ? id.trim() : null;
                this.resetBundleState();
                if (this.routeSkillId) {
                    this.loadSkill(this.routeSkillId);
                } else {
                    this.model = this.emptyModel();
                    this.setPageHeading("new");
                    this.loading = false;
                }
            })
        );
    }

    ngOnDestroy(): void {
        this.subs.unsubscribe();
    }

    get isAdmin(): boolean {
        return this._user.userInfo?.aiAdmin === 1;
    }

    get isDesigner(): boolean {
        const u = this._user.userInfo;
        return u?.aiDesigner === 1 || u?.aiAdmin === 1;
    }

    get canEditForm(): boolean {
        return this.isDesigner && (this.model.status === "DRAFT" || !this.model.skillId);
    }

    get bundleDialogHeader(): string {
        switch (this.bundleDialogKind) {
            case "knowledge":
                return this.bundleForm.ITEM_ID ? "Edit knowledge item" : "Add knowledge item";
            case "playbook":
                return this.bundleForm.STEP_ID ? "Edit playbook step" : "Add playbook step";
            case "sql":
                return this.bundleForm.TEMPLATE_ID ? "Edit SQL template" : "Add SQL template";
            case "vocab":
                return this.bundleForm.VOCAB_ID ? "Edit vocabulary" : "Add vocabulary";
            case "tests":
                return this.bundleForm.TEST_ID ? "Edit test case" : "Add test case";
            case "diagStep":
                return this.bundleForm.STEP_ORDER && this.bundleForm.TEMPLATE_CODE ? "Edit diagnostic step" : "Add diagnostic step";
            case "diagConclusion":
                return "Edit conclusion: " + (this.bundleForm.CONCLUSION_KEY || "");
            default:
                return "";
        }
    }

    get canSubmitReview(): boolean {
        return this.isDesigner && !!this.model.skillId && this.model.status === "DRAFT";
    }

    onTabChange(ev: { index: number }): void {
        const i = ev?.index ?? 0;
        this.activeTabIndex = i;
        if (!this.model.skillId) { return; }
        switch (i) {
            case 0: this.ensureBundle("knowledge", () => this.loadKnowledge()); break;
            case 1: this.ensureBundle("playbook", () => this.loadPlaybook()); break;
            case 2: this.ensureBundle("sql", () => this.loadSql()); break;
            case 3: this.ensureBundle("vocab", () => this.loadVocab()); break;
            case 4: this.ensureBundle("tests", () => this.loadTests()); break;
            case 5: this.ensureBundle("diagStep", () => this.loadDiagSteps()); break;
            default: break;
        }
    }

    backToLibrary(): void {
        this._router.navigate(["/ai/skill-studio/library"]);
    }

    saveDraft(): void {
        if (!this.canEditForm) { return; }
        const code = (this.model.code || "").trim();
        const name = (this.model.name || "").trim();
        if (!code || !name) {
            this._msg.add({
                severity: "warn",
                summary: "Required fields",
                detail: "Skill code and name are required before saving."
            });
            return;
        }
        this.saving = true;
        this._skillSvc.saveSkill({
            skillId: this.model.skillId || undefined,
            code,
            name,
            domain: (this.model.domain || "ITEM").trim(),
            description: (this.model.description || "").trim()
        }).subscribe({
            next: (resp: unknown) => {
                this.saving = false;
                const hadId = !!this.model.skillId;
                const newId = this.extractNewSkillId(resp);
                if (newId && !hadId) {
                    this.model.skillId = newId;
                    this._router.navigate(["/ai/skill-studio/builder", newId], { replaceUrl: true });
                } else if (this.model.skillId) {
                    this.loadSkill(this.model.skillId);
                }
                this._msg.add({ severity: "success", summary: "Saved", detail: "Skill draft stored." });
            },
            error: (err: unknown) => {
                this.saving = false;
                this._msg.add({
                    severity: "error",
                    summary: "Save failed",
                    detail: this.errDetail(err, "Deploy LIBQUERY AI0000045 (skill upsert) or check permissions.")
                });
            }
        });
    }

    submitReview(): void {
        if (!this.canSubmitReview || !this.model.skillId) { return; }
        this.submitting = true;
        this._skillSvc.submitForReview(this.model.skillId).subscribe({
            next: () => {
                this.submitting = false;
                this._msg.add({ severity: "success", summary: "Submitted", detail: "Skill is now in review." });
                this.loadSkill(this.model.skillId!);
            },
            error: (err: unknown) => {
                this.submitting = false;
                this._msg.add({
                    severity: "error",
                    summary: "Submit failed",
                    detail: this.errDetail(err, "Deploy LIBQUERY AI0000041 or check permissions.")
                });
            }
        });
    }

    statusSeverity(status: string): string {
        switch ((status || "").toUpperCase()) {
            case "PUBLISHED": return "success";
            case "IN_REVIEW": return "warning";
            case "DRAFT": return "info";
            case "DEPRECATED": return "danger";
            default: return "secondary";
        }
    }

    formatStatus(status: string): string {
        switch ((status || "").toUpperCase()) {
            case "IN_REVIEW": return "In review";
            case "DRAFT": return "Draft";
            case "PUBLISHED": return "Published";
            case "DEPRECATED": return "Deprecated";
            default: return status || "—";
        }
    }

    private emptyModel(): AiSkillEditorModel {
        return {
            skillId: "",
            code: "",
            name: "",
            domain: "ITEM",
            status: "DRAFT",
            version: "",
            description: "",
            updatedAt: "",
            retailerId: ""
        };
    }

    private loadSkill(skillId: string): void {
        this.loading = true;
        this._skillSvc.getSkill(skillId).subscribe({
            next: (data: unknown) => {
                const rows = this.unwrapRows(data);
                if (!rows.length) {
                    this.loading = false;
                    this._msg.add({
                        severity: "warn",
                        summary: "Not found",
                        detail: "No skill row for this id. Ensure AI0000040 returns this skill_id, or return to the library."
                    });
                    this.backToLibrary();
                    return;
                }
                this.model = this.mapSkillRow(rows[0]);
                this.setPageHeading(
                    this.model.name ? "edit" : "default",
                    this.model.name || undefined,
                );
                this.loading = false;
                this.resetBundleState();
                this.ensureBundle("knowledge", () => this.loadKnowledge());
                const q = this._route.snapshot.queryParamMap;
                if (q.get("openSql") === "1") {
                    setTimeout(() => this.consumeAssistantSqlDraft(q), 0);
                }
            },
            error: (err: unknown) => {
                this.loading = false;
                this._msg.add({
                    severity: "error",
                    summary: "Load failed",
                    detail: this.errDetail(err, "Could not load template catalog (AI0000040) or verify the skill id.")
                });
                this.backToLibrary();
            }
        });
    }

    private resetBundleState(): void {
        this.knowledgeRows = [];
        this.playbookRows = [];
        this.sqlRows = [];
        this.vocabRows = [];
        this.testRows = [];
        this.knowledgeCols = [];
        this.playbookCols = [];
        this.sqlCols = [];
        this.vocabCols = [];
        this.testCols = [];
        this.diagStepRows = [];
        this.diagStepCols = [];
        this.diagConclusionRows = [];
        this.diagConclusionCols = [];
        this.diagTestResult = null;
        this.bundleTried = {
            knowledge: false,
            playbook: false,
            sql: false,
            vocab: false,
            tests: false,
            diagStep: false
        };
    }

    private ensureBundle(key: keyof typeof this.bundleTried, fn: () => void): void {
        if (this.bundleTried[key]) { return; }
        this.bundleTried[key] = true;
        fn();
    }

    private loadKnowledge(): void {
        this.loadBundle("knowledge", () => this._skillSvc.listSkillKnowledge(this.model.skillId), (rows, cols) => {
            this.knowledgeRows = rows;
            this.knowledgeCols = cols;
        }, AiSkillBuilderComponent.COLS_KNOWLEDGE);
    }

    private loadPlaybook(): void {
        this.loadBundle("playbook", () => this._skillSvc.listSkillPlaybook(this.model.skillId), (rows, cols) => {
            this.playbookRows = rows;
            this.playbookCols = cols;
        }, AiSkillBuilderComponent.COLS_PLAYBOOK);
    }

    private loadSql(): void {
        this.loadBundle("sql", () => this._skillSvc.listSkillSqlTemplates(this.model.skillId), (rows, cols) => {
            this.sqlRows = rows;
            this.sqlCols = cols;
        }, AiSkillBuilderComponent.COLS_SQL);
    }

    private loadVocab(): void {
        this.loadBundle("vocab", () => this._skillSvc.listSkillVocabulary(this.model.skillId), (rows, cols) => {
            this.vocabRows = rows;
            this.vocabCols = cols;
        }, AiSkillBuilderComponent.COLS_VOCAB);
    }

    private loadTests(): void {
        this.loadBundle("tests", () => this._skillSvc.listSkillTests(this.model.skillId), (rows, cols) => {
            this.testRows = rows;
            this.testCols = cols;
        }, AiSkillBuilderComponent.COLS_TESTS);
    }

    private loadDiagSteps(): void {
        this.loadBundle("diagStep", () => this._skillSvc.listDiagnosticSteps(this.model.skillId), (rows, cols) => {
            this.diagStepRows = rows;
            this.diagStepCols = cols;
            this.deriveDiagConclusionRows();
        }, AiSkillBuilderComponent.COLS_DIAG_STEP);
    }

    private deriveDiagConclusionRows(): void {
        const seen = new Set<string>();
        this.diagConclusionRows = [];
        for (const row of this.diagStepRows) {
            const key = this.cell(this.rowAsRecord(row), "CONCLUSION_KEY", "conclusion_key");
            if (key && !seen.has(key)) {
                seen.add(key);
                this.diagConclusionRows.push({ CONCLUSION_KEY: key, SEVERITY: "—" });
            }
        }
        this.diagConclusionCols = AiSkillBuilderComponent.COLS_DIAG_CONCL;
    }

    runDiagChainTest(): void {
        if (!this.model.skillId || !this.diagTestEntity.trim()) { return; }
        this.diagTestLoading = true;
        this.diagTestResult = null;
        const val = this.diagTestEntity.trim();
        this._skillSvc.runDiagnosticChain({
            skill_id: this.model.skillId,
            retailer_id: this.model.retailerId || "-1",
            question_text: "diagnostic test",
            entities: { lu_id: val, site_id: val }
        }).subscribe({
            next: (r: any) => { this.diagTestLoading = false; this.diagTestResult = r; },
            error: () => {
                this.diagTestLoading = false;
                this.diagTestResult = { error: true, human_summary: "Chain call failed — check Node logs and confirm tables 37/38 are deployed." };
            }
        });
    }

    get diagTestSteps(): any[] {
        return (this.diagTestResult?.diagnostic_steps) || [];
    }

    formatCell(row: Record<string, unknown>, field: string): string {
        const r = this.rowAsRecord(row);
        const v = this.cell(r, field, field.toUpperCase(), field.toLowerCase());
        return v.length > 120 ? `${v.slice(0, 117)}…` : v;
    }

    openBundleEditor(kind: "knowledge" | "playbook" | "sql" | "vocab" | "tests" | "diagStep" | "diagConclusion", row?: Record<string, unknown>): void {
        if (!this.canEditForm || !this.model.skillId) { return; }
        this.bundleDialogKind = kind;
        const sid = this.model.skillId;
        if (row) {
            const r = this.rowAsRecord(row);
            switch (kind) {
                case "knowledge":
                    this.bundleForm = {
                        ITEM_ID: this.cell(r, "ITEM_ID", "item_id"),
                        SKILL_ID: sid,
                        BASE_KNOWLEDGE_KEY: this.cell(r, "BASE_KNOWLEDGE_KEY", "base_knowledge_key"),
                        OVERRIDE_MODE: this.cell(r, "OVERRIDE_MODE", "override_mode") || "EXTEND",
                        KNOWLEDGE_KEY: this.cell(r, "KNOWLEDGE_KEY", "knowledge_key"),
                        LABEL: this.cell(r, "LABEL", "label"),
                        DESCRIPTION: this.cell(r, "DESCRIPTION", "description"),
                        ANCHOR_QUESTION: this.cell(r, "ANCHOR_QUESTION", "anchor_question"),
                        ROUNDS_JSON: this.cell(r, "ROUNDS_JSON", "rounds_json") || "[]",
                        VALIDATION_SQL: this.cell(r, "VALIDATION_SQL", "validation_sql"),
                        PRIORITY: this.cell(r, "PRIORITY", "priority") || "2",
                        IS_MANDATORY: this.cell(r, "IS_MANDATORY", "is_mandatory") || "1"
                    };
                    break;
                case "playbook":
                    this.bundleForm = {
                        STEP_ID: this.cell(r, "STEP_ID", "step_id"),
                        SKILL_ID: sid,
                        COMPLAINT_TYPE: this.cell(r, "COMPLAINT_TYPE", "complaint_type"),
                        STEP_ORDER: this.cell(r, "STEP_ORDER", "step_order") || "1",
                        STEP_CODE: this.cell(r, "STEP_CODE", "step_code"),
                        STEP_LABEL: this.cell(r, "STEP_LABEL", "step_label"),
                        HYPOTHESIS_TESTED: this.cell(r, "HYPOTHESIS_TESTED", "hypothesis_tested"),
                        GOLD_SCHEMA: this.cell(r, "GOLD_SCHEMA", "gold_schema"),
                        GOLD_TABLE: this.cell(r, "GOLD_TABLE", "gold_table"),
                        KEY_COLUMNS: this.cell(r, "KEY_COLUMNS", "key_columns"),
                        EVIDENCE_FACT_TYPE: this.cell(r, "EVIDENCE_FACT_TYPE", "evidence_fact_type"),
                        IS_MANDATORY: this.cell(r, "IS_MANDATORY", "is_mandatory") || "1",
                        INSERT_POSITION: this.cell(r, "INSERT_POSITION", "insert_position") || "APPEND",
                        INSERT_AFTER_STEP: this.cell(r, "INSERT_AFTER_STEP", "insert_after_step")
                    };
                    break;
                case "sql":
                    this.bundleForm = {
                        TEMPLATE_ID: this.cell(r, "TEMPLATE_ID", "template_id"),
                        SKILL_ID: sid,
                        TEMPLATE_CODE: this.cell(r, "TEMPLATE_CODE", "template_code"),
                        TEMPLATE_LABEL: this.cell(r, "TEMPLATE_LABEL", "template_label"),
                        PURPOSE: this.cell(r, "PURPOSE", "purpose"),
                        SQL_TEXT: this.cell(r, "SQL_TEXT", "sql_text"),
                        PARAMETERS_JSON: this.cell(r, "PARAMETERS_JSON", "parameters_json") || "[]",
                        TABLES_REFERENCED: this.cell(r, "TABLES_REFERENCED", "tables_referenced")
                    };
                    break;
                case "vocab":
                    this.bundleForm = {
                        VOCAB_ID: this.cell(r, "VOCAB_ID", "vocab_id"),
                        SKILL_ID: sid,
                        TERM: this.cell(r, "TERM", "term"),
                        CANONICAL_CONCEPT: this.cell(r, "CANONICAL_CONCEPT", "canonical_concept"),
                        TERM_TYPE: this.cell(r, "TERM_TYPE", "term_type") || "SYNONYM",
                        LANGUAGE_CODE: this.cell(r, "LANGUAGE_CODE", "language_code") || "EN",
                        CONFIDENCE_BOOST: this.cell(r, "CONFIDENCE_BOOST", "confidence_boost") || "1"
                    };
                    break;
                case "tests":
                    this.bundleForm = {
                        TEST_ID: this.cell(r, "TEST_ID", "test_id"),
                        SKILL_ID: sid,
                        TEST_NAME: this.cell(r, "TEST_NAME", "test_name"),
                        COMPLAINT_TEXT: this.cell(r, "COMPLAINT_TEXT", "complaint_text"),
                        COMPLAINT_TYPE: this.cell(r, "COMPLAINT_TYPE", "complaint_type"),
                        EXPECTED_ROOT_CAUSE: this.cell(r, "EXPECTED_ROOT_CAUSE", "expected_root_cause"),
                        EXPECTED_CONFIDENCE: this.cell(r, "EXPECTED_CONFIDENCE", "expected_confidence") || "PROBABLE",
                        EXPECTED_STEPS_MIN: this.cell(r, "EXPECTED_STEPS_MIN", "expected_steps_min")
                    };
                    break;
                case "diagStep":
                    this.bundleForm = {
                        SKILL_ID: sid,
                        STEP_ORDER: this.cell(r, "STEP_ORDER", "step_order"),
                        TEMPLATE_CODE: this.cell(r, "TEMPLATE_CODE", "template_code"),
                        STEP_LABEL: this.cell(r, "STEP_LABEL", "step_label"),
                        STOP_FIELD: this.cell(r, "STOP_FIELD", "stop_field"),
                        STOP_OPERATOR: this.cell(r, "STOP_OPERATOR", "stop_operator") || "=",
                        STOP_VALUE: this.cell(r, "STOP_VALUE", "stop_value"),
                        CONCLUSION_KEY: this.cell(r, "CONCLUSION_KEY", "conclusion_key"),
                        STEP_TYPE: this.cell(r, "STEP_TYPE", "step_type") || "HARD"
                    };
                    break;
                case "diagConclusion": {
                    const cKey = this.cell(r, "CONCLUSION_KEY", "conclusion_key");
                    if (!cKey) { return; }
                    this.bundleDialogKind = "diagConclusion";
                    this._skillSvc.getDiagnosticConclusion(cKey, this.model.retailerId).subscribe({
                        next: (data: unknown) => {
                            const cRows = this.unwrapRows(data);
                            const cr = cRows.length ? this.rowAsRecord(cRows[0]) : {};
                            this.bundleForm = {
                                CONCLUSION_KEY: cKey,
                                RETAILER_ID: this.model.retailerId || "",
                                SUMMARY_TEMPLATE: this.cell(cr, "SUMMARY_TEMPLATE", "summary_template"),
                                EVIDENCE_TEMPLATE: this.cell(cr, "EVIDENCE_TEMPLATE", "evidence_template"),
                                FOLLOW_UP_TEMPLATE: this.cell(cr, "FOLLOW_UP_TEMPLATE", "follow_up_template"),
                                SEVERITY: this.cell(cr, "SEVERITY", "severity") || "WARNING"
                            };
                            this.bundleDialogVisible = true;
                        },
                        error: () => {
                            this.bundleForm = {
                                CONCLUSION_KEY: cKey,
                                RETAILER_ID: this.model.retailerId || "",
                                SUMMARY_TEMPLATE: "",
                                EVIDENCE_TEMPLATE: "",
                                FOLLOW_UP_TEMPLATE: "",
                                SEVERITY: "WARNING"
                            };
                            this.bundleDialogVisible = true;
                        }
                    });
                    return;
                }
            }
        } else {
            switch (kind) {
                case "knowledge":
                    this.bundleForm = {
                        ITEM_ID: "",
                        SKILL_ID: sid,
                        BASE_KNOWLEDGE_KEY: "",
                        OVERRIDE_MODE: "EXTEND",
                        KNOWLEDGE_KEY: "",
                        LABEL: "",
                        DESCRIPTION: "",
                        ANCHOR_QUESTION: "",
                        ROUNDS_JSON: "[]",
                        VALIDATION_SQL: "",
                        PRIORITY: "2",
                        IS_MANDATORY: "1"
                    };
                    break;
                case "playbook":
                    this.bundleForm = {
                        STEP_ID: "",
                        SKILL_ID: sid,
                        COMPLAINT_TYPE: "GENERAL",
                        STEP_ORDER: "1",
                        STEP_CODE: "",
                        STEP_LABEL: "",
                        HYPOTHESIS_TESTED: "",
                        GOLD_SCHEMA: "",
                        GOLD_TABLE: "",
                        KEY_COLUMNS: "",
                        EVIDENCE_FACT_TYPE: "FACT",
                        IS_MANDATORY: "1",
                        INSERT_POSITION: "APPEND",
                        INSERT_AFTER_STEP: ""
                    };
                    break;
                case "sql":
                    this.bundleForm = {
                        TEMPLATE_ID: "",
                        SKILL_ID: sid,
                        TEMPLATE_CODE: "",
                        TEMPLATE_LABEL: "",
                        PURPOSE: "",
                        SQL_TEXT: "-- SQL fragment\nSELECT 1 FROM DUAL WHERE 1=0",
                        PARAMETERS_JSON: "[]",
                        TABLES_REFERENCED: ""
                    };
                    break;
                case "vocab":
                    this.bundleForm = {
                        VOCAB_ID: "",
                        SKILL_ID: sid,
                        TERM: "",
                        CANONICAL_CONCEPT: "",
                        TERM_TYPE: "SYNONYM",
                        LANGUAGE_CODE: "EN",
                        CONFIDENCE_BOOST: "1"
                    };
                    break;
                case "tests":
                    this.bundleForm = {
                        TEST_ID: "",
                        SKILL_ID: sid,
                        TEST_NAME: "",
                        COMPLAINT_TEXT: "",
                        COMPLAINT_TYPE: "GENERAL",
                        EXPECTED_ROOT_CAUSE: "UNKNOWN",
                        EXPECTED_CONFIDENCE: "PROBABLE",
                        EXPECTED_STEPS_MIN: ""
                    };
                    break;
                case "diagStep":
                    this.bundleForm = {
                        SKILL_ID: sid,
                        STEP_ORDER: String((this.diagStepRows.length || 0) + 1),
                        TEMPLATE_CODE: "",
                        STEP_LABEL: "",
                        STOP_FIELD: "",
                        STOP_OPERATOR: "=",
                        STOP_VALUE: "",
                        CONCLUSION_KEY: "",
                        STEP_TYPE: "HARD"
                    };
                    break;
                case "diagConclusion":
                    return;
            }
        }
        this.bundleDialogVisible = true;
    }

    onBundleVisibilityChange(visible: boolean): void {
        this.bundleDialogVisible = visible;
        if (!visible) {
            this.bundleDialogKind = null;
            this.bundleForm = {};
            this.bundleDialogSaving = false;
        }
    }

    closeBundleDialog(): void {
        this.onBundleVisibilityChange(false);
    }

    saveBundleForm(): void {
        const kind = this.bundleDialogKind;
        const f = this.bundleForm;
        if (!kind) { return; }
        if (kind === "knowledge") {
            if (!f.KNOWLEDGE_KEY?.trim() || !f.LABEL?.trim() || !f.ANCHOR_QUESTION?.trim()) {
                this._msg.add({ severity: "warn", summary: "Validation", detail: "Knowledge key, label, and anchor question are required." });
                return;
            }
        } else if (kind === "playbook") {
            if (!f.COMPLAINT_TYPE?.trim() || !f.STEP_CODE?.trim() || !f.STEP_LABEL?.trim()
                || !f.HYPOTHESIS_TESTED?.trim() || !f.GOLD_SCHEMA?.trim() || !f.GOLD_TABLE?.trim()) {
                this._msg.add({
                    severity: "warn",
                    summary: "Validation",
                    detail: "Complaint type, step code, label, hypothesis, GOLD schema, and GOLD table are required."
                });
                return;
            }
        } else if (kind === "sql") {
            if (!f.TEMPLATE_CODE?.trim() || !f.TEMPLATE_LABEL?.trim() || !f.SQL_TEXT?.trim()) {
                this._msg.add({ severity: "warn", summary: "Validation", detail: "Template code, label, and SQL text are required." });
                return;
            }
        } else if (kind === "vocab") {
            if (!f.TERM?.trim() || !f.CANONICAL_CONCEPT?.trim()) {
                this._msg.add({ severity: "warn", summary: "Validation", detail: "Term and canonical concept are required." });
                return;
            }
        } else if (kind === "tests") {
            if (!f.TEST_NAME?.trim() || !f.COMPLAINT_TEXT?.trim() || !f.COMPLAINT_TYPE?.trim()
                || !f.EXPECTED_ROOT_CAUSE?.trim()) {
                this._msg.add({ severity: "warn", summary: "Validation", detail: "Test name, complaint text, complaint type, and expected root cause are required." });
                return;
            }
        } else if (kind === "diagStep") {
            if (!f.STEP_ORDER?.trim() || !f.TEMPLATE_CODE?.trim() || !f.CONCLUSION_KEY?.trim()) {
                this._msg.add({ severity: "warn", summary: "Validation", detail: "Step order, template code, and conclusion key are required." });
                return;
            }
        } else if (kind === "diagConclusion") {
            if (!f.CONCLUSION_KEY?.trim() || !f.SUMMARY_TEMPLATE?.trim()) {
                this._msg.add({ severity: "warn", summary: "Validation", detail: "Conclusion key and summary template are required." });
                return;
            }
        }

        let req: Observable<unknown>;
        switch (kind) {
            case "knowledge": req = this._skillSvc.saveSkillKnowledge(f); break;
            case "playbook": req = this._skillSvc.saveSkillPlaybook(f); break;
            case "sql": req = this._skillSvc.saveSkillSqlTemplate(f); break;
            case "vocab": req = this._skillSvc.saveSkillVocabulary(f); break;
            case "tests": req = this._skillSvc.saveSkillTestCase(f); break;
            case "diagStep": req = this._skillSvc.saveDiagnosticStep(f); break;
            case "diagConclusion": req = this._skillSvc.saveDiagnosticConclusion(f); break;
            default: return;
        }
        this.bundleDialogSaving = true;
        req.subscribe({
            next: () => {
                this.bundleDialogSaving = false;
                this.closeBundleDialog();
                this._msg.add({ severity: "success", summary: "Saved", detail: "Row stored in Oracle." });
                this.refreshBundleAfterSave(kind);
            },
            error: (err: unknown) => {
                this.bundleDialogSaving = false;
                this._msg.add({
                    severity: "error",
                    summary: "Save failed",
                    detail: this.errDetail(err, "Deploy LIBQUERY AI0000051–AI0000060 or check bind keys.")
                });
            }
        });
    }

    confirmDeleteBundle(kind: "knowledge" | "playbook" | "sql" | "vocab" | "tests" | "diagStep", row: Record<string, unknown>): void {
        if (!this.canEditForm || !this.model.skillId) { return; }
        const r = this.rowAsRecord(row);
        let idVal = "";
        switch (kind) {
            case "knowledge": idVal = this.cell(r, "ITEM_ID", "item_id"); break;
            case "playbook": idVal = this.cell(r, "STEP_ID", "step_id"); break;
            case "sql": idVal = this.cell(r, "TEMPLATE_ID", "template_id"); break;
            case "vocab": idVal = this.cell(r, "VOCAB_ID", "vocab_id"); break;
            case "tests": idVal = this.cell(r, "TEST_ID", "test_id"); break;
            case "diagStep":
                idVal = this.cell(r, "STEP_ORDER", "step_order") + "|" + this.cell(r, "CONCLUSION_KEY", "conclusion_key");
                break;
        }
        if (!idVal) {
            this._msg.add({ severity: "warn", summary: "Delete", detail: "Row has no id yet — refresh the list." });
            return;
        }
        this._confirm.confirm({
            message: "Delete this row from the database?",
            header: "Confirm delete",
            icon: "pi pi-trash",
            accept: () => this.execDeleteBundle(kind, idVal)
        });
    }

    private execDeleteBundle(kind: "knowledge" | "playbook" | "sql" | "vocab" | "tests" | "diagStep", id: string): void {
        const sid = this.model.skillId!;
        let req: Observable<unknown>;
        switch (kind) {
            case "knowledge": req = this._skillSvc.deleteSkillKnowledge(id, sid); break;
            case "playbook": req = this._skillSvc.deleteSkillPlaybook(id, sid); break;
            case "sql": req = this._skillSvc.deleteSkillSqlTemplate(id, sid); break;
            case "vocab": req = this._skillSvc.deleteSkillVocabulary(id, sid); break;
            case "tests": req = this._skillSvc.deleteSkillTestCase(id, sid); break;
            case "diagStep": {
                const parts = id.split("|");
                req = this._skillSvc.deleteDiagnosticStep(sid, parts[0] || "", parts[1] || "");
                break;
            }
            default: return;
        }
        req.subscribe({
            next: () => {
                this._msg.add({ severity: "success", summary: "Deleted", detail: "Row removed." });
                this.refreshBundleAfterSave(kind);
            },
            error: (err: unknown) => {
                this._msg.add({
                    severity: "error",
                    summary: "Delete failed",
                    detail: this.errDetail(err, "Check LIBQUERY delete entries (AI0000052, 54, 56, 58, 60).")
                });
            }
        });
    }

    private refreshBundleAfterSave(kind: "knowledge" | "playbook" | "sql" | "vocab" | "tests" | "diagStep" | "diagConclusion"): void {
        switch (kind) {
            case "knowledge": this.bundleTried.knowledge = true; this.loadKnowledge(); break;
            case "playbook": this.bundleTried.playbook = true; this.loadPlaybook(); break;
            case "sql": this.bundleTried.sql = true; this.loadSql(); break;
            case "vocab": this.bundleTried.vocab = true; this.loadVocab(); break;
            case "tests": this.bundleTried.tests = true; this.loadTests(); break;
            case "diagStep":
            case "diagConclusion":
                this.bundleTried.diagStep = true;
                this.loadDiagSteps();
                break;
            default: break;
        }
    }

    private cell(r: Record<string, unknown>, ...keys: string[]): string {
        for (const k of keys) {
            const raw = r[k] ?? r[k.toUpperCase()] ?? r[k.toLowerCase()];
            if (raw !== undefined && raw !== null && String(raw).trim() !== "") {
                return String(raw);
            }
        }
        return "";
    }

    private loadBundle(
        key: keyof typeof this.bundleLoading,
        req: () => Observable<unknown>,
        assign: (rows: Record<string, unknown>[], cols: { field: string; header: string }[]) => void,
        fallbackCols?: { field: string; header: string }[]
    ): void {
        if (!this.model.skillId) { return; }
        this.bundleLoading[key] = true;
        req().subscribe({
            next: (data: unknown) => {
                const rows = this.unwrapRows(data).map((r) => this.rowAsRecord(r));
                const inferred = this.inferColumns(rows);
                const cols = inferred.length ? inferred : (fallbackCols || []);
                assign(rows, cols);
                this.bundleLoading[key] = false;
            },
            error: () => {
                assign([], fallbackCols || []);
                this.bundleLoading[key] = false;
            }
        });
    }

    private rowAsRecord(r: unknown): Record<string, unknown> {
        return r && typeof r === "object" ? (r as Record<string, unknown>) : {};
    }

    private inferColumns(rows: Record<string, unknown>[]): { field: string; header: string }[] {
        if (!rows.length) { return []; }
        const keys = Object.keys(rows[0]).filter((k) => !String(k).startsWith("$"));
        return keys.slice(0, 14).map((field) => ({ field, header: field }));
    }

    private unwrapRows(data: unknown): any[] {
        if (Array.isArray(data)) { return data; }
        const d = data as { rows?: unknown };
        if (d && Array.isArray(d.rows)) { return d.rows; }
        return [];
    }

    private mapSkillRow(r: any): AiSkillEditorModel {
        return {
            skillId: String(r.SKILL_ID ?? r.skill_id ?? ""),
            code: String(r.SKILL_CODE ?? r.skill_code ?? ""),
            name: String(r.SKILL_NAME ?? r.skill_name ?? ""),
            domain: String(r.DOMAIN ?? r.domain ?? "ITEM"),
            status: String(r.STATUS ?? r.status ?? "DRAFT").toUpperCase(),
            version: String(r.VERSION ?? r.version ?? ""),
            description: String(r.DESCRIPTION ?? r.description ?? ""),
            updatedAt: String(r.UPDATED_AT ?? r.updated_at ?? r.LAST_UPDATED ?? ""),
            retailerId: String(r.RETAILER_ID ?? r.retailer_id ?? "")
        };
    }

    private extractNewSkillId(resp: unknown): string | null {
        const rows = this.unwrapRows(resp);
        if (rows.length) {
            const r = rows[0];
            const id = r?.SKILL_ID ?? r?.skill_id ?? r?.NEW_SKILL_ID ?? r?.new_skill_id;
            if (id != null && String(id).trim() !== "") { return String(id).trim(); }
        }
        const o = resp as { SKILL_ID?: string; skill_id?: string };
        const top = o?.SKILL_ID ?? o?.skill_id;
        if (top != null && String(top).trim() !== "") { return String(top).trim(); }
        return null;
    }

    private errDetail(err: unknown, fallback: string): string {
        const e = err as { error?: { message?: string } };
        return e?.error?.message || fallback;
    }

    /**
     * S14 assistant: opens SQL templates tab and pre-fills Add/Edit dialog from sessionStorage draft.
     * Query: openSql=1 (draft JSON in sessionStorage key ICR_AI_ASSISTANT_SQL_DRAFT).
     */
    private consumeAssistantSqlDraft(q: ParamMap): void {
        if (!this.model.skillId) { return; }
        let draft: Record<string, string> | null = null;
        try {
            const raw = sessionStorage.getItem(AiSkillBuilderComponent.ASSISTANT_SQL_DRAFT_KEY);
            if (raw) {
                draft = JSON.parse(raw) as Record<string, string>;
                sessionStorage.removeItem(AiSkillBuilderComponent.ASSISTANT_SQL_DRAFT_KEY);
            }
        } catch {
            draft = null;
        }
        const wantCodeQ = String(q.get("templateCode") || "").trim();
        const hasPayload = !!(draft && (draft.sqlText || draft.templateCode || draft.templateLabel)) || !!wantCodeQ;
        if (!hasPayload) {
            this._msg.add({
                severity: "warn",
                summary: "Skill builder",
                detail: "No assistant SQL draft found. Return to the assistant and use Open Skill Builder with draft again."
            });
            return;
        }

        this.activeTabIndex = 2;
        this._cdr.markForCheck();

        this.bundleLoading.sql = true;
        this._skillSvc.listSkillSqlTemplates(this.model.skillId).subscribe({
            next: (data: unknown) => {
                const rows = this.unwrapRows(data).map((r) => this.rowAsRecord(r));
                const inferred = this.inferColumns(rows);
                this.sqlRows = rows;
                this.sqlCols = inferred.length ? inferred : AiSkillBuilderComponent.COLS_SQL;
                this.bundleTried.sql = true;
                this.bundleLoading.sql = false;

                if (!this.canEditForm) {
                    this._msg.add({
                        severity: "info",
                        summary: "Skill builder",
                        detail: "Designer or AI admin rights are required to save SQL from an assistant draft."
                    });
                    this._cdr.markForCheck();
                    return;
                }

                const wantCode = String(draft?.templateCode || q.get("templateCode") || "").trim().toUpperCase();
                let match: Record<string, unknown> | undefined;
                if (wantCode) {
                    match = rows.find((r) => {
                        const c = String(this.cell(this.rowAsRecord(r), "TEMPLATE_CODE", "template_code")).toUpperCase();
                        return c === wantCode;
                    });
                }
                if (match) {
                    this.openBundleEditor("sql", match);
                } else {
                    this.openBundleEditor("sql");
                }
                this.mergeAssistantDraftIntoSqlForm(draft, wantCode);
                this._cdr.markForCheck();
                this._msg.add({
                    severity: "success",
                    summary: "Assistant draft loaded",
                    detail: "Review SQL template fields, then save to persist in Oracle."
                });
            },
            error: () => {
                this.bundleLoading.sql = false;
                this._cdr.markForCheck();
            }
        });
    }

    private mergeAssistantDraftIntoSqlForm(draft: Record<string, string> | null, wantCode: string): void {
        const d = draft || {};
        if (d.templateCode && String(d.templateCode).trim()) {
            this.bundleForm.TEMPLATE_CODE = String(d.templateCode).trim();
        } else if (wantCode) {
            this.bundleForm.TEMPLATE_CODE = wantCode;
        }
        if (d.sqlText && String(d.sqlText).trim()) {
            this.bundleForm.SQL_TEXT = String(d.sqlText).trim();
        }
        if (d.templateLabel && String(d.templateLabel).trim()) {
            this.bundleForm.TEMPLATE_LABEL = String(d.templateLabel).trim();
        } else if (this.bundleForm.TEMPLATE_CODE && !this.bundleForm.TEMPLATE_LABEL) {
            this.bundleForm.TEMPLATE_LABEL = String(this.bundleForm.TEMPLATE_CODE).replace(/_/g, " ");
        }
        if (d.purpose && String(d.purpose).trim()) {
            this.bundleForm.PURPOSE = String(d.purpose).trim();
        }
        if (d.parametersJson && String(d.parametersJson).trim()) {
            try {
                JSON.parse(String(d.parametersJson));
                this.bundleForm.PARAMETERS_JSON = String(d.parametersJson).trim();
            } catch {
                /* keep default */
            }
        }
        if (d.sourceQuestion && !this.bundleForm.PURPOSE) {
            this.bundleForm.PURPOSE = "From assistant: " + String(d.sourceQuestion).slice(0, 240);
        }
    }
}
