-- =============================================================================
-- Diagnostic Chain Tables — Phase A infrastructure
-- Deploy after: 08_skill_engine.sql
-- Safe to re-run: CREATE TABLE guarded with exception handler (ORA-00955 ignored).
-- =============================================================================

-- AI_DIAGNOSTIC_STEP
-- One row per (skill, step_order, conclusion_key).
-- Multiple rows with the same (SKILL_ID, STEP_ORDER) share the same TEMPLATE_CODE —
-- the engine runs the SQL once and evaluates each condition row in order.
-- First matching condition stops the chain and records the CONCLUSION_KEY.
DECLARE
    v_exists NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_exists
    FROM user_tables
    WHERE table_name = 'AI_DIAGNOSTIC_STEP';

    IF v_exists = 0 THEN
        EXECUTE IMMEDIATE q'[
            CREATE TABLE AI_DIAGNOSTIC_STEP (
                SKILL_ID        VARCHAR2(100)  NOT NULL,
                STEP_ORDER      NUMBER(3)      NOT NULL,
                TEMPLATE_CODE   VARCHAR2(100)  NOT NULL,
                STOP_FIELD      VARCHAR2(100)  NOT NULL,
                STOP_OPERATOR   VARCHAR2(20)   DEFAULT '=' NOT NULL,
                STOP_VALUE      VARCHAR2(200)  NOT NULL,
                CONCLUSION_KEY  VARCHAR2(100)  NOT NULL,
                STEP_LABEL      VARCHAR2(200),
                CONSTRAINT pk_ai_diag_step PRIMARY KEY (SKILL_ID, STEP_ORDER, CONCLUSION_KEY)
            )
        ]';
        DBMS_OUTPUT.PUT_LINE('AI_DIAGNOSTIC_STEP created.');
    ELSE
        DBMS_OUTPUT.PUT_LINE('AI_DIAGNOSTIC_STEP already exists — skipped.');
    END IF;
END;
/

-- AI_DIAGNOSTIC_CONCLUSION
-- Conclusion templates with {token} substitution placeholders.
-- Tokens are filled from ctx fields (lu_id, site_id, …) and from
-- the first row returned by each diagnostic step SQL.
-- EVIDENCE_TEMPLATE: pipe-separated bullet lines → evidence_facts[] in the response.
DECLARE
    v_exists NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_exists
    FROM user_tables
    WHERE table_name = 'AI_DIAGNOSTIC_CONCLUSION';

    IF v_exists = 0 THEN
        EXECUTE IMMEDIATE q'[
            CREATE TABLE AI_DIAGNOSTIC_CONCLUSION (
                CONCLUSION_KEY      VARCHAR2(100)  NOT NULL,
                RETAILER_ID         VARCHAR2(50)   NOT NULL,
                SUMMARY_TEMPLATE    VARCHAR2(2000) NOT NULL,
                EVIDENCE_TEMPLATE   VARCHAR2(4000),
                FOLLOW_UP_TEMPLATE  VARCHAR2(500),
                SEVERITY            VARCHAR2(10)   DEFAULT 'WARNING' NOT NULL,
                CONSTRAINT pk_ai_diag_concl PRIMARY KEY (CONCLUSION_KEY, RETAILER_ID),
                CONSTRAINT chk_diag_sev CHECK (SEVERITY IN ('CRITICAL','WARNING','INFO'))
            )
        ]';
        DBMS_OUTPUT.PUT_LINE('AI_DIAGNOSTIC_CONCLUSION created.');
    ELSE
        DBMS_OUTPUT.PUT_LINE('AI_DIAGNOSTIC_CONCLUSION already exists — skipped.');
    END IF;
END;
/

COMMIT;

-- Verification
SELECT table_name, num_rows
FROM user_tables
WHERE table_name IN ('AI_DIAGNOSTIC_STEP', 'AI_DIAGNOSTIC_CONCLUSION')
ORDER BY table_name;
