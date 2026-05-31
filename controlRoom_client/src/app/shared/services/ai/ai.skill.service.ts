import { Injectable } from "@angular/core";
import { map } from "rxjs/operators";
import { QueryService } from "../query/query.service";
import { UserService } from "../user/user.service";
import { HttpService } from "../request/html.service";
import { HttpHeaders, HttpParams } from "@angular/common/http";

/** Normalized row for Skill Library (S20). */
export interface AiSkillListItem {
    skillId: string;
    code: string;
    name: string;
    domain: string;
    status: string;
    version: string;
    description: string;
    updatedAt: string;
    retailerId: string;
}

/** Skill builder (S21) — header form + bundle tabs. */
export interface AiSkillEditorModel {
    skillId: string;
    code: string;
    name: string;
    domain: string;
    status: string;
    version: string;
    description: string;
    updatedAt: string;
    retailerId: string;
}

@Injectable({ providedIn: "root" })
export class AiSkillService {

    /** Full template catalog from `AI_SKILL` via LIBQUERY. */
    private Q_SKILL_LIST = "AI0000040";
    /** Upsert template skill header (insert/update). Body: SKILL_ID, SKILL_CODE, SKILL_NAME, DOMAIN, DESCRIPTION, ACTOR. */
    private Q_SKILL_SAVE = "AI0000045";
    /** Bundle rows — optional; deploy when `08_skill_engine.sql` bundle tables exist. */
    private Q_SKILL_BUNDLE_KNOWLEDGE = "AI0000046";
    private Q_SKILL_BUNDLE_PLAYBOOK = "AI0000047";
    private Q_SKILL_BUNDLE_SQL = "AI0000048";
    private Q_SKILL_BUNDLE_VOCAB = "AI0000049";
    private Q_SKILL_BUNDLE_TESTS = "AI0000050";
    /** Submit for review (DRAFT → IN_REVIEW). */
    private Q_SKILL_SUBMIT_REVIEW = "AI0000041";
    /** Publish (Admin, IN_REVIEW → PUBLISHED). */
    private Q_SKILL_PUBLISH = "AI0000042";
    /** Deprecate (Admin). */
    private Q_SKILL_DEPRECATE = "AI0000043";
    /** Delete template skill + bundle (Admin or draft owner workflow). */
    private Q_SKILL_DELETE = "AI0000065";
    private Q_BUNDLE_KI_SAVE = "AI0000051";
    private Q_BUNDLE_KI_DEL = "AI0000052";
    private Q_BUNDLE_PS_SAVE = "AI0000053";
    private Q_BUNDLE_PS_DEL = "AI0000054";
    private Q_BUNDLE_SQL_SAVE = "AI0000055";
    private Q_BUNDLE_SQL_DEL = "AI0000056";
    private Q_BUNDLE_VOC_SAVE = "AI0000057";
    private Q_BUNDLE_VOC_DEL = "AI0000058";
    private Q_BUNDLE_TC_SAVE = "AI0000059";
    private Q_BUNDLE_TC_DEL = "AI0000060";
    private Q_DIAG_STEPS     = "AI0000100";
    private Q_DIAG_CONCL     = "AI0000101";
    private Q_DIAG_STEP_SAVE = "AI0000103";
    private Q_DIAG_CONCL_SAVE = "AI0000104";
    private Q_DIAG_STEP_DEL  = "AI0000105";
    private BASE_ENGINE = "/api/ai/engine/";

    constructor(
        private _query: QueryService,
        private _user: UserService,
        private _http: HttpService
    ) {}

    /**
     * Template skill catalog — same LIBQUERY pattern as `AiRetailerService.listCorpEnvs()`:
     * raw `getQueryResult`; component unwraps `data` / `data.rows` like `AiRetailerSetupComponent.loadCorpEnvs`.
     */
    listTemplateSkills() {
        return this._query.getQueryResult(this.Q_SKILL_LIST, ["-1"]);
    }

    /**
     * One skill row for the builder from AI0000040 + client-side filter (avoids a separate GET-by-id query).
     */
    getSkill(skillId: string) {
        const id = String(skillId || "").trim().toUpperCase();
        return this.listTemplateSkills().pipe(
            map((data: any) => {
                const rows = Array.isArray(data) ? data
                    : (Array.isArray(data && data.rows) ? data.rows : []);
                const hit = rows.find((r: any) =>
                    String(r.SKILL_ID ?? r.skill_id ?? "").trim().toUpperCase() === id
                );
                return hit ? [hit] : [];
            })
        );
    }

    /**
     * Create/update draft header. Oracle LIBQUERY should merge on SKILL_ID null = insert else update.
     * Expected keys: SKILL_ID (optional), SKILL_CODE, SKILL_NAME, DOMAIN, DESCRIPTION, ACTOR.
     */
    saveSkill(p: {
        skillId?: string;
        code: string;
        name: string;
        domain: string;
        description: string;
    }) {
        return this._query.postQueryResult(this.Q_SKILL_SAVE, [{
            SKILL_ID: p.skillId || "",
            SKILL_CODE: p.code,
            SKILL_NAME: p.name,
            DOMAIN: p.domain,
            DESCRIPTION: p.description || "",
            ACTOR: this._user.ICRUser
        }]);
    }

    listSkillKnowledge(skillId: string) {
        return this._query.getQueryResult(this.Q_SKILL_BUNDLE_KNOWLEDGE, [skillId]);
    }

    listSkillPlaybook(skillId: string) {
        return this._query.getQueryResult(this.Q_SKILL_BUNDLE_PLAYBOOK, [skillId]);
    }

    listSkillSqlTemplates(skillId: string) {
        return this._query.getQueryResult(this.Q_SKILL_BUNDLE_SQL, [skillId]);
    }

    listSkillVocabulary(skillId: string) {
        return this._query.getQueryResult(this.Q_SKILL_BUNDLE_VOCAB, [skillId]);
    }

    listSkillTests(skillId: string) {
        return this._query.getQueryResult(this.Q_SKILL_BUNDLE_TESTS, [skillId]);
    }

    saveSkillKnowledge(row: Record<string, string>) {
        return this._query.postQueryResult(this.Q_BUNDLE_KI_SAVE, [row]);
    }

    deleteSkillKnowledge(itemId: string, skillId: string) {
        return this._query.postQueryResult(this.Q_BUNDLE_KI_DEL, [{ ITEM_ID: itemId, SKILL_ID: skillId }]);
    }

    saveSkillPlaybook(row: Record<string, string>) {
        return this._query.postQueryResult(this.Q_BUNDLE_PS_SAVE, [row]);
    }

    deleteSkillPlaybook(stepId: string, skillId: string) {
        return this._query.postQueryResult(this.Q_BUNDLE_PS_DEL, [{ STEP_ID: stepId, SKILL_ID: skillId }]);
    }

    saveSkillSqlTemplate(row: Record<string, string>) {
        return this._query.postQueryResult(this.Q_BUNDLE_SQL_SAVE, [row]);
    }

    deleteSkillSqlTemplate(templateId: string, skillId: string) {
        return this._query.postQueryResult(this.Q_BUNDLE_SQL_DEL, [{ TEMPLATE_ID: templateId, SKILL_ID: skillId }]);
    }

    saveSkillVocabulary(row: Record<string, string>) {
        return this._query.postQueryResult(this.Q_BUNDLE_VOC_SAVE, [row]);
    }

    deleteSkillVocabulary(vocabId: string, skillId: string) {
        return this._query.postQueryResult(this.Q_BUNDLE_VOC_DEL, [{ VOCAB_ID: vocabId, SKILL_ID: skillId }]);
    }

    saveSkillTestCase(row: Record<string, string>) {
        return this._query.postQueryResult(this.Q_BUNDLE_TC_SAVE, [row]);
    }

    deleteSkillTestCase(testId: string, skillId: string) {
        return this._query.postQueryResult(this.Q_BUNDLE_TC_DEL, [{ TEST_ID: testId, SKILL_ID: skillId }]);
    }

    listDiagnosticSteps(skillId: string) {
        return this._query.getQueryResult(this.Q_DIAG_STEPS, [skillId]);
    }

    getDiagnosticConclusion(conclusionKey: string, retailerId: string) {
        return this._query.getQueryResult(this.Q_DIAG_CONCL, [conclusionKey, retailerId || "-1"]);
    }

    saveDiagnosticStep(row: Record<string, string>) {
        return this._query.postQueryResult(this.Q_DIAG_STEP_SAVE, [row]);
    }

    saveDiagnosticConclusion(row: Record<string, string>) {
        return this._query.postQueryResult(this.Q_DIAG_CONCL_SAVE, [row]);
    }

    deleteDiagnosticStep(skillId: string, stepOrder: string, conclusionKey: string) {
        return this._query.postQueryResult(this.Q_DIAG_STEP_DEL, [{
            SKILL_ID: skillId,
            STEP_ORDER: stepOrder,
            CONCLUSION_KEY: conclusionKey
        }]);
    }

    runDiagnosticChain(payload: {
        skill_id: string;
        retailer_id: string;
        question_text?: string;
        entities?: Record<string, string>;
    }) {
        return this._http.post(
            this.BASE_ENGINE + "diagnose-chain",
            new HttpParams(), new HttpHeaders(), payload
        ).pipe(map((r: any) => r));
    }

    submitForReview(skillId: string) {
        return this._query.postQueryResult(this.Q_SKILL_SUBMIT_REVIEW, [{
            SKILL_ID: skillId,
            ACTOR: this._user.ICRUser
        }]);
    }

    publish(skillId: string) {
        return this._query.postQueryResult(this.Q_SKILL_PUBLISH, [{
            SKILL_ID: skillId,
            ACTOR: this._user.ICRUser
        }]);
    }

    deprecate(skillId: string) {
        return this._query.postQueryResult(this.Q_SKILL_DEPRECATE, [{
            SKILL_ID: skillId,
            ACTOR: this._user.ICRUser
        }]);
    }

    deleteSkill(skillId: string) {
        return this._query.postQueryResult(this.Q_SKILL_DELETE, [{
            SKILL_ID: skillId,
            ACTOR: this._user.ICRUser
        }]);
    }
}
