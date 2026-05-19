-- ── AI Engine Interaction Log ────────────────────────────────────────────────
-- Records every feedback click (👍/👎) from the AI Assistant
-- Foundation for self-learning: template health, skill routing improvement

CREATE TABLE AI_ENGINE_INTERACTION_LOG (
    LOG_ID          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    RETAILER_ID     VARCHAR2(30)   NOT NULL,
    QUESTION_TEXT   VARCHAR2(2000),
    SKILL_ID        VARCHAR2(50),
    TEMPLATE_CODE   VARCHAR2(100),
    RESULT_COUNT    NUMBER         DEFAULT 0,
    ANSWER_QUALITY  VARCHAR2(30),
    THUMB_UP        NUMBER(1)      DEFAULT 0,
    THUMB_DOWN      NUMBER(1)      DEFAULT 0,
    ASKED_BY        VARCHAR2(50),
    ASKED_AT        TIMESTAMP      DEFAULT SYSTIMESTAMP
);

-- Index for template health queries
CREATE INDEX IDX_AILOG_TEMPLATE ON AI_ENGINE_INTERACTION_LOG (SKILL_ID, TEMPLATE_CODE);
CREATE INDEX IDX_AILOG_RETAILER  ON AI_ENGINE_INTERACTION_LOG (RETAILER_ID, ASKED_AT);

COMMIT;
