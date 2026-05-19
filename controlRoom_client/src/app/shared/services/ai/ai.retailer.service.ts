import { Injectable } from "@angular/core";
import { QueryService } from "../query/query.service";
import { UserService } from "../user/user.service";
import { HttpService } from "../request/html.service";
import { HttpHeaders, HttpParams } from "@angular/common/http";
import { map } from "rxjs/operators";

@Injectable({ providedIn: "root" })
export class AiRetailerService {

    // LIBQUERY IDs
    private Q_CORPENV_LIST    = "AI0000001";
    private Q_RETAILER_LIST   = "AI0000002";
    private Q_RETAILER_SINGLE = "AI0000003";
    private Q_CONTEXT_STATUS  = "AI0000004";
    private Q_CATALOG         = "AI0000005";
    private Q_VIEW_STATUS     = "AI0000006";
    private Q_SAVE_RETAILER   = "AI0000007";
    private Q_START_SESSION   = "AI0000008";
    private Q_SAVE_ANSWER     = "AI0000009";
    private Q_PROPOSE_SQL     = "AI0000010";
    private Q_VALIDATE_SQL    = "AI0000011";
    private Q_LOCK_CONTEXT      = "AI0000012";
    private Q_MARK_CONN_TESTED    = "AI0000013";
    private Q_SCHEMA_TABLES      = "AI0000020";
    private Q_SCHEMA_COLUMNS     = "AI0000021";
    private Q_SCHEMA_SCAN_STATUS = "AI0000022";
    private Q_SCHEMA_TABLE_TAG   = "AI0000023";
    private Q_SCHEMA_COLUMN_TAG  = "AI0000024";
    private Q_SAVE_CATALOG      = "AI0000015";
    private Q_DELETE_CATALOG    = "AI0000016";
    private Q_ENGINE_FEEDBACK     = "AI0000070";
    private Q_UNRESOLVED_INSERT   = "AI0000071";
    private Q_UNRESOLVED_LIST     = "AI0000072";
    private Q_UNRESOLVED_PROMOTE  = "AI0000073";
    private Q_UNRESOLVED_DISMISS  = "AI0000074";
    private Q_UNRESOLVED_STAMP    = "AI0000075";
    private Q_AUTO_PROMOTE_LIST   = "AI0000076";
    private Q_AUTO_PROMOTE_MERGE  = "AI0000077";
    private Q_AUTO_PROMOTE_STAMP  = "AI0000078";

    // Custom routes — procedural multi-step
    private BASE_AI   = "/api/ai/retailer/";
    private BASE_VIEW   = "/api/ai/view/";
    private BASE_SCHEMA = "/api/ai/schema/";
    private BASE_ENGINE = "/api/ai/engine/";

    constructor(
        private _query: QueryService,
        private _user: UserService,
        private http: HttpService
    ) {}

    // ── GET via LIBQUERY ────────────────────────────────────────────────────

    listCorpEnvs() {
        // Pass "-1" so QueryService param loop doesn't crash on empty array
        return this._query.getQueryResult(this.Q_CORPENV_LIST, ["-1"]);
    }

    getRetailers() {
        return this._query.getQueryResult(this.Q_RETAILER_LIST, ["-1"]);
    }

    getRetailer(retailerId: string) {
        return this._query.getQueryResult(this.Q_RETAILER_SINGLE, [retailerId]);
    }

    getContextStatus(retailerId: string) {
        return this._query.getQueryResult(this.Q_CONTEXT_STATUS, [retailerId]);
    }

    getCatalog() {
        return this._query.getQueryResult(this.Q_CATALOG, ["-1"]);
    }

    getViewStatus(retailerId: string) {
        const viewName = "V_GOLD_ACTIVE_ITEM_" + retailerId.toUpperCase();
        return this._query.getQueryResult(this.Q_VIEW_STATUS, [viewName, retailerId]);
    }

    // ── POST via LIBQUERY ───────────────────────────────────────────────────

    saveRetailer(p: any) {
        return this._query.postQueryResult(this.Q_SAVE_RETAILER, [{
            RETAILER_ID:   p.retailer_id,
            RETAILER_CODE: p.retailer_code,
            RETAILER_NAME: p.retailer_name,
            CORPENV_ID:    p.corpenv_id,
            CREATED_BY:    this._user.ICRUser
        }]);
    }

    startSession(p: any) {
        const sessionId = p.retailer_id + "_" + p.knowledge_key + "_" + Date.now();
        return this._query.postQueryResult(this.Q_START_SESSION, [{
            SESSION_ID:    sessionId,
            RETAILER_ID:   p.retailer_id,
            KNOWLEDGE_KEY: p.knowledge_key,
            STARTED_BY:    this._user.ICRUser
        }]).pipe(map((r: any) => ({
            ...r,
            session_id:    sessionId,
            retailer_id:   p.retailer_id,
            knowledge_key: p.knowledge_key,
            round: 0,
            status: "ACTIVE"
        })));
    }

    saveAnswer(p: any) {
        return this._query.postQueryResult(this.Q_SAVE_ANSWER, [{
            SESSION_ID:    p.session_id,
            ROUND_NUM:     p.round,
            QUESTION_TEXT: p.question,
            ANSWER_TEXT:   p.answer
        }]);
    }

    proposeSql(p: any) {
        return this._query.postQueryResult(this.Q_PROPOSE_SQL, [{
            SESSION_ID:        p.session_id,
            TABLES_REFERENCED: p.tables_referenced || "",
            SQL_CONDITION:     p.sql_condition
        }]);
    }

    validateSql(p: any) {
        return this._query.postQueryResult(this.Q_VALIDATE_SQL, [{
            RETAILER_ID:        p.retailer_id,
            KNOWLEDGE_KEY:      p.knowledge_key,
            SQL_CONDITION:      p.sql_condition,
            TABLES_REFERENCED:  p.tables_referenced || "",
            COLUMNS_REFERENCED: p.columns_referenced || "",
            CONFIDENCE:         p.confidence,
            LEARNED_BY:         this._user.ICRUser
        }]);
    }

    lockContext(p: any) {
        return this._query.postQueryResult(this.Q_LOCK_CONTEXT, [{
            RETAILER_ID:   p.retailer_id,
            KNOWLEDGE_KEY: p.knowledge_key,
            LOCKED_BY:     this._user.ICRUser
        }]);
    }

    markConnectionTested(retailerId: string) {
        return this._query.postQueryResult(this.Q_MARK_CONN_TESTED, [{
            RETAILER_ID: retailerId
        }]);
    }

    // ── Custom POST routes — Oracle procedural (cannot be LIBQUERY) ──────────

    pingDbLink(payload: { db_link: string; gold_schema: string }) {
        return this.http.post(
            this.BASE_AI + "ping-dblink",
            new HttpParams(), new HttpHeaders(), payload
        ).pipe(map((r: any) => r));
    }

    // ── Catalog management ──────────────────────────────────────────────────────

    saveCatalogItem(p: any) {
        return this._query.postQueryResult(this.Q_SAVE_CATALOG, [{
            KNOWLEDGE_KEY:    p.knowledge_key,
            PRIORITY:         p.priority,
            DOMAIN:           p.domain,
            LABEL:            p.label,
            DESCRIPTION:      p.description,
            ANCHOR_QUESTION:  p.anchor_question,
            SQL_TEMPLATE:     p.sql_template || '',
            BLOCKING_MODULES: p.blocking_modules || ''
        }]);
    }

    deleteCatalogItem(knowledgeKey: string) {
        return this._query.postQueryResult(this.Q_DELETE_CATALOG, [{
            KNOWLEDGE_KEY: knowledgeKey
        }]);
    }

    getCatalogAll() {
        return this._query.getQueryResult(this.Q_CATALOG, ['-1']);
    }

    generateView(payload: any) {
        return this.http.post(
            this.BASE_VIEW + "generate",
            new HttpParams(), new HttpHeaders(), payload
        ).pipe(map((r: any) => r));
    }

    // ── Schema Discovery ──────────────────────────────────────────────────────

    getSchemaTables(retailerId: string) {
        return this._query.getQueryResult(this.Q_SCHEMA_TABLES, [retailerId]);
    }

    getSchemaColumns(tableId: number) {
        return this._query.getQueryResult(this.Q_SCHEMA_COLUMNS, [String(tableId)]);
    }

    getScanStatus(retailerId: string) {
        return this._query.getQueryResult(this.Q_SCHEMA_SCAN_STATUS, [retailerId]);
    }

    updateTableAnnotation(p: any) {
        return this._query.postQueryResult(this.Q_SCHEMA_TABLE_TAG, [{
            TABLE_ID:     p.table_id,
            IS_KEY_TABLE: p.is_key_table,
            DOMAIN_TAG:   p.domain_tag || "",
            DESCRIPTION:  p.description || ""
        }]);
    }

    updateColumnAnnotation(p: any) {
        return this._query.postQueryResult(this.Q_SCHEMA_COLUMN_TAG, [{
            COLUMN_ID:     p.column_id,
            IS_KEY_COLUMN: p.is_key_column,
            DESCRIPTION:   p.description || ""
        }]);
    }

    triggerScan(payload: any) {
        return this.http.post(
            this.BASE_SCHEMA + "scan",
            new HttpParams(), new HttpHeaders(), payload
        ).pipe(map((r: any) => r));
    }

    routeInquiry(payload: any) {
        return this.http.post(
            this.BASE_ENGINE + "route",
            new HttpParams(), new HttpHeaders(), payload
        ).pipe(map((r: any) => r));
    }

    executeInquiry(payload: any) {
        return this.http.post(
            this.BASE_ENGINE + "execute",
            new HttpParams(), new HttpHeaders(), payload
        ).pipe(map((r: any) => r));
    }

    /**
     * Diagnostic Chain — POST /api/ai/engine/diagnose-chain.
     * Executes the rule-based chain for a chosen skill_id, returning a
     * structured root-cause conclusion with evidence and severity.
     */
    runDiagnosticChain(payload: {
        skill_id: string;
        retailer_id: string;
        question_text?: string;
        entities?: Record<string, string>;
        bindings?: Record<string, string>;
    }) {
        return this.http.post(
            this.BASE_ENGINE + "diagnose-chain",
            new HttpParams(), new HttpHeaders(), payload
        ).pipe(map((r: any) => r));
    }

    /**
     * Phase 6 — side-effect-free routing diagnostics for the Phrasing
     * Playground.  Returns scored skills with per-factor breakdown,
     * vocabulary hits, intent, tokens, extracted entities, and per-template
     * bind feasibility for the top skill. No SQL is executed.
     */
    diagnoseInquiry(payload: { retailer_id: string; question_text: string }) {
        return this.http.post(
            this.BASE_ENGINE + "diagnose",
            new HttpParams(), new HttpHeaders(), payload
        ).pipe(map((r: any) => r));
    }

    /**
     * Send 👍/👎 feedback for an assistant message via LIBQUERY AI0000070,
     * which inserts a row into AI_ENGINE_INTERACTION_LOG. `thumb` must be
     * `'up'` or `'down'`. Keys are uppercase to match JSON_TABLE PATHs.
     */
    sendEngineFeedback(payload: {
        retailer_id: string;
        question_text?: string;
        skill_id?: string;
        template_code?: string;
        result_count?: number;
        answer_quality?: string;
        thumb: 'up' | 'down';
    }) {
        return this._query.postQueryResult(this.Q_ENGINE_FEEDBACK, [{
            RETAILER_ID:    payload.retailer_id,
            QUESTION_TEXT:  payload.question_text || '',
            SKILL_ID:       payload.skill_id || '',
            TEMPLATE_CODE:  payload.template_code || '',
            RESULT_COUNT:   String(payload.result_count != null ? payload.result_count : 0),
            ANSWER_QUALITY: payload.answer_quality || '',
            THUMB:          payload.thumb,
            ASKED_BY:       this._user.ICRUser
        }]);
    }

    /**
     * Phase 4a — log a low-confidence question into AI_ENGINE_UNRESOLVED via
     * LIBQUERY AI0000071. Fire-and-forget from the assistant component.
     */
    logUnresolvedPhrasing(payload: {
        retailer_id: string;
        question_text: string;
        normalized_text?: string;
        top_skill_id?: string;
        top_skill_code?: string;
        top_score?: number;
        second_skill_code?: string;
        second_score?: number;
        intent_type?: string;
        reason?: 'LOW_CONFIDENCE' | 'THUMB_DOWN' | 'PARAM_GAP' | 'USER_OVERRIDE';
    }) {
        return this._query.postQueryResult(this.Q_UNRESOLVED_INSERT, [{
            RETAILER_ID:        payload.retailer_id,
            QUESTION_TEXT:      payload.question_text,
            NORMALIZED_TEXT:    payload.normalized_text || '',
            TOP_SKILL_ID:       payload.top_skill_id || '',
            TOP_SKILL_CODE:     payload.top_skill_code || '',
            TOP_SCORE:          payload.top_score != null ? String(payload.top_score) : '',
            SECOND_SKILL_CODE:  payload.second_skill_code || '',
            SECOND_SCORE:       payload.second_score != null ? String(payload.second_score) : '',
            INTENT_TYPE:        payload.intent_type || '',
            REASON:             payload.reason || 'LOW_CONFIDENCE',
            ASKED_BY:           this._user.ICRUser
        }]);
    }

    listUnresolvedPhrasings(retailerId: string = '-1', limit: number = 100) {
        return this._query.getQueryResult(this.Q_UNRESOLVED_LIST, [retailerId, String(limit)]);
    }

    promoteUnresolvedToVocabulary(payload: {
        unres_id: number | string;
        skill_id: string;
        term: string;
        canonical_concept?: string;
        term_type?: 'INTENT_PHRASE' | 'SYNONYM' | 'BIND_HINT' | 'JARGON' | 'BRAND_TERM' | 'ABBREVIATION' | 'PROCESS_TERM';
        confidence_boost?: number;
    }) {
        return this._query.postQueryResult(this.Q_UNRESOLVED_PROMOTE, [{
            SKILL_ID:           payload.skill_id,
            TERM:               payload.term,
            CANONICAL_CONCEPT:  payload.canonical_concept || '',
            TERM_TYPE:          payload.term_type || 'INTENT_PHRASE',
            CONFIDENCE_BOOST:   payload.confidence_boost != null ? String(payload.confidence_boost) : ''
        }]);
    }

    stampUnresolvedAsPromoted(payload: {
        unres_id: number | string;
        promoted_term: string;
        promoted_concept?: string;
        promoted_skill_id: string;
    }) {
        return this._query.postQueryResult(this.Q_UNRESOLVED_STAMP, [{
            UNRES_ID:           String(payload.unres_id),
            PROMOTED_BY:        this._user.ICRUser,
            PROMOTED_TERM:      payload.promoted_term,
            PROMOTED_CONCEPT:   payload.promoted_concept || '',
            PROMOTED_SKILL_ID:  payload.promoted_skill_id
        }]);
    }

    dismissUnresolvedPhrasing(unresId: number | string) {
        return this._query.postQueryResult(this.Q_UNRESOLVED_DISMISS, [{
            UNRES_ID:     String(unresId),
            DISMISSED_BY: this._user.ICRUser
        }]);
    }

    /**
     * Phase 7 — list phrasings eligible for auto-promotion (USER_OVERRIDE rows
     * picked by enough distinct analysts inside the lookback window).
     * Returns one row per (NORMALIZED_TEXT, SECOND_SKILL_CODE, RETAILER_ID)
     * group with HIT_COUNT / DISTINCT_USERS / SAMPLE_QUESTION / TARGET_SKILL_ID.
     *
     * @param retailerId      retailer id, or '-1' for all retailers
     * @param minDistinctUsers minimum distinct analysts who picked the same skill (default 2)
     * @param minHits         minimum total hit count (default 3)
     * @param lookbackDays    only consider rows with ASKED_AT in the last N days (default 90)
     */
    listAutoPromotable(
        retailerId: string = '-1',
        minDistinctUsers: number = 2,
        minHits: number = 3,
        lookbackDays: number = 90
    ) {
        return this._query.getQueryResult(this.Q_AUTO_PROMOTE_LIST, [
            retailerId,
            String(minDistinctUsers),
            String(minHits),
            String(lookbackDays)
        ]);
    }

    /**
     * Phase 7 — idempotent MERGE of one phrasing into AI_SKILL_VOCABULARY.
     * Re-running on the same (skill_id, term, term_type) is a no-op.
     */
    autoPromoteMergeVocab(payload: {
        skill_id: string;
        term: string;
        canonical_concept?: string;
        term_type?: 'INTENT_PHRASE' | 'SYNONYM' | 'BIND_HINT' | 'JARGON' | 'BRAND_TERM' | 'ABBREVIATION' | 'PROCESS_TERM';
        confidence_boost?: number;
    }) {
        return this._query.postQueryResult(this.Q_AUTO_PROMOTE_MERGE, [{
            SKILL_ID:           payload.skill_id,
            TERM:               payload.term,
            CANONICAL_CONCEPT:  payload.canonical_concept || 'AUTO_PROMOTED',
            TERM_TYPE:          payload.term_type || 'INTENT_PHRASE',
            CONFIDENCE_BOOST:   payload.confidence_boost != null ? String(payload.confidence_boost) : '1.0'
        }]);
    }

    /**
     * Phase 7 — bulk-stamp every USER_OVERRIDE unresolved row matching
     * (NORMALIZED_TEXT, SECOND_SKILL_CODE, RETAILER_ID) as auto-promoted.
     */
    autoPromoteStamp(payload: {
        phrase_norm: string;
        skill_code: string;
        retailer_id: string;
        skill_id: string;
        canonical_concept?: string;
    }) {
        return this._query.postQueryResult(this.Q_AUTO_PROMOTE_STAMP, [{
            PHRASE_NORM:       payload.phrase_norm,
            SKILL_CODE:        payload.skill_code,
            RETAILER_ID:       payload.retailer_id,
            SKILL_ID:          payload.skill_id,
            CANONICAL_CONCEPT: payload.canonical_concept || 'AUTO_PROMOTED'
        }]);
    }

}
