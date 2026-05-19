-- ============================================================================
-- 22_engine_unresolved_table.sql
-- Phase 4a — capture every fast-path miss so admins can curate vocabulary.
-- ----------------------------------------------------------------------------
-- The engine writes one row whenever:
--   * top skill score < UNRESOLVED_SCORE_THRESHOLD (currently 45), or
--   * the user thumbs-down a result (forwarded by /api/ai/engine/feedback).
-- An admin promotes a row by adding the question text to AI_SKILL_VOCABULARY
-- as INTENT_PHRASE (or whatever term_type fits) and stamping PROMOTED_AT.
-- ============================================================================

CREATE TABLE AI_ENGINE_UNRESOLVED (
    UNRES_ID            NUMBER         GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    RETAILER_ID         VARCHAR2(30)   NOT NULL,
    QUESTION_TEXT       VARCHAR2(2000) NOT NULL,
    NORMALIZED_TEXT     VARCHAR2(2000),
    TOP_SKILL_ID        VARCHAR2(50),
    TOP_SKILL_CODE      VARCHAR2(100),
    TOP_SCORE           NUMBER,
    SECOND_SKILL_CODE   VARCHAR2(100),
    SECOND_SCORE        NUMBER,
    INTENT_TYPE         VARCHAR2(30),
    REASON              VARCHAR2(40),    -- LOW_CONFIDENCE | THUMB_DOWN | PARAM_GAP
    ASKED_BY            VARCHAR2(50),
    ASKED_AT            TIMESTAMP      DEFAULT SYSTIMESTAMP,
    PROMOTED_AT         TIMESTAMP,
    PROMOTED_BY         VARCHAR2(50),
    PROMOTED_TERM       VARCHAR2(200),
    PROMOTED_CONCEPT    VARCHAR2(100),
    PROMOTED_SKILL_ID   VARCHAR2(50),
    DISMISSED_AT        TIMESTAMP,
    DISMISSED_BY        VARCHAR2(50)
);

CREATE INDEX IDX_UNRES_RETAILER  ON AI_ENGINE_UNRESOLVED (RETAILER_ID, ASKED_AT);
CREATE INDEX IDX_UNRES_PENDING   ON AI_ENGINE_UNRESOLVED (PROMOTED_AT, DISMISSED_AT, ASKED_AT);
CREATE INDEX IDX_UNRES_QUESTION  ON AI_ENGINE_UNRESOLVED (NORMALIZED_TEXT);

COMMIT;
