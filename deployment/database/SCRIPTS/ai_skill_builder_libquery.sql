-- =============================================================================
-- Supply Chain AI — Skill builder LIBQUERY templates (AI0000040, AI0000044–50, AI0000051–60 bundle DML)
-- =============================================================================
-- Full AI LIBQUERY deployment: prefer `deployment/database/SCRIPTS/libquery/` when maintaining one bundle.
-- This file remains the editable source for S20/S21 skill-builder ids if you version them separately.
-- Physical model: deployment/database/SCRIPTS/08_skill_engine.sql
--   AI_SKILL, AI_SKILL_KNOWLEDGE_ITEM, AI_SKILL_PLAYBOOK_STEP,
--   AI_SKILL_SQL_TEMPLATE, AI_SKILL_VOCABULARY, AI_SKILL_TEST_CASE
--
-- Template catalog rows use retailer_id = 'TEMPLATE' (see seed in 08_skill_engine.sql).
--
-- Angular GET: AI0000040 ['-1']; AI0000044 / AI0000046..50 [skill_id].
-- POST (DML): :param1 = REQUEST_QUERY_BODY.REQUESTID after insert; body JSON in REQUESTBODY.
--    Angular sends {"values":[{...}]}. QUERYSQL uses JSON_TABLE(..., '$.values[*]' COLUMNS(...)) like TRA_PARAMETERS pattern.
--    AI0000045 header MERGE; AI0000051/53/55/57/59 bundle MERGE; AI0000052/54/56/58/60 DELETE.
-- Large text: GET AI0000046/48/50 return CLOB columns untruncated; MERGE AI0000051/55/59 use JSON_TABLE CLOB paths for rounds_json, validation_sql, sql_text, parameters_json, complaint_text.
-- Redeploying: UPDATE LIBQUERY SET QUERYSQL = ... for existing QUERYNUM if inserts are not re-run.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- DDL: run 08_skill_engine.sql first — do not create duplicate tables here.
-- -----------------------------------------------------------------------------

-- =============================================================================
-- AI0000044 — GET one skill (QUERYUPDATE = 0); :param1 = skill_id
-- =============================================================================
/*
SELECT s.skill_id,
       s.retailer_id,
       s.skill_code,
       s.skill_name,
       s.domain,
       s.description,
       s.version,
       s.status,
       TO_CHAR(s.updated_at, 'YYYY-MM-DD HH24:MI:SS') AS updated_at
  FROM AI_SKILL s
 WHERE s.skill_id = :param1;
*/

-- =============================================================================
-- AI0000045 — UPSERT skill header (QUERYUPDATE = 1)
-- Deployed QUERYSQL: REQUEST_QUERY_BODY + JSON_TABLE + :param1 (REQUESTID) — see INSERT INTO LIBQUERY below.
-- Legacy snippet (direct binds — not used with PKREQUESTMANAGER POST on this stack):
-- =============================================================================
/*
MERGE INTO AI_SKILL t
USING (
    SELECT TRIM(:SKILL_ID)   AS sid,
           TRIM(:SKILL_CODE) AS sc,
           TRIM(:SKILL_NAME) AS sn,
           TRIM(:DOMAIN)     AS dom,
           :DESCRIPTION      AS descr,
           TRIM(:ACTOR)      AS actor
      FROM dual
) src
ON (src.sid IS NOT NULL AND LENGTH(src.sid) > 0 AND t.skill_id = src.sid)
WHEN MATCHED THEN UPDATE SET
    t.skill_code   = src.sc,
    t.skill_name   = src.sn,
    t.domain       = src.dom,
    t.description  = src.descr,
    t.updated_at   = SYSTIMESTAMP
WHEN NOT MATCHED THEN
    INSERT (skill_id, retailer_id, skill_code, skill_name, domain, description,
            version, status, created_by, created_at, updated_at)
    VALUES (
        NVL(NULLIF(src.sid, ''), SYS_GUID()),
        'TEMPLATE',
        src.sc,
        src.sn,
        src.dom,
        NVL(src.descr, ' '),
        1.0,
        'DRAFT',
        src.actor,
        SYSTIMESTAMP,
        SYSTIMESTAMP
    );
*/

-- Optional second statement / procedure to return row by skill_code after MERGE.

-- =============================================================================
-- AI0000046 — Knowledge items (QUERYUPDATE = 0) — AI_SKILL_KNOWLEDGE_ITEM
-- =============================================================================
/*
SELECT k.item_id,
       k.skill_id,
       k.base_knowledge_key,
       k.override_mode,
       k.knowledge_key,
       k.label,
       k.description,
       k.anchor_question,
       k.rounds_json,
       k.validation_sql,
       k.priority,
       k.is_mandatory,
       k.created_at
  FROM AI_SKILL_KNOWLEDGE_ITEM k
 WHERE k.skill_id = :param1
 ORDER BY k.priority, k.knowledge_key, k.item_id;
*/

-- =============================================================================
-- AI0000047 — Playbook steps (QUERYUPDATE = 0) — AI_SKILL_PLAYBOOK_STEP
-- =============================================================================
/*
SELECT p.step_id,
       p.skill_id,
       p.complaint_type,
       p.step_order,
       p.step_code,
       p.step_label,
       p.hypothesis_tested,
       p.gold_schema,
       p.gold_table,
       p.key_columns,
       p.evidence_fact_type,
       p.is_mandatory,
       p.insert_position,
       p.insert_after_step,
       p.created_at
  FROM AI_SKILL_PLAYBOOK_STEP p
 WHERE p.skill_id = :param1
 ORDER BY p.complaint_type, p.step_order, p.step_code;
*/

-- =============================================================================
-- AI0000048 — SQL templates (QUERYUPDATE = 0) — AI_SKILL_SQL_TEMPLATE
-- =============================================================================
/*
SELECT t.template_id,
       t.skill_id,
       t.template_code,
       t.template_label,
       t.purpose,
       t.sql_text,
       t.parameters_json,
       t.tables_referenced,
       t.last_tested_at,
       t.last_test_result,
       t.last_test_passed,
       t.tested_by,
       t.created_at
  FROM AI_SKILL_SQL_TEMPLATE t
 WHERE t.skill_id = :param1
 ORDER BY t.template_code;
*/

-- =============================================================================
-- AI0000049 — Vocabulary (QUERYUPDATE = 0) — AI_SKILL_VOCABULARY
-- =============================================================================
/*
SELECT v.vocab_id,
       v.skill_id,
       v.term,
       v.canonical_concept,
       v.term_type,
       v.language_code,
       v.confidence_boost,
       v.created_at
  FROM AI_SKILL_VOCABULARY v
 WHERE v.skill_id = :param1
 ORDER BY v.term, v.vocab_id;
*/

-- =============================================================================
-- AI0000050 — Test suite (QUERYUPDATE = 0) — AI_SKILL_TEST_CASE
-- =============================================================================
/*
SELECT e.test_id,
       e.skill_id,
       e.test_name,
       e.complaint_text,
       e.complaint_type,
       e.expected_root_cause,
       e.expected_confidence,
       e.expected_steps_min,
       e.last_run_at,
       e.last_run_by,
       e.actual_root_cause,
       e.actual_confidence,
       e.actual_steps_fired,
       e.passed,
       e.failure_reason,
       e.created_at
  FROM AI_SKILL_TEST_CASE e
 WHERE e.skill_id = :param1
 ORDER BY e.test_name, e.test_id;
*/

-- =============================================================================
-- AI0000040 — Template skill catalog (QUERYUPDATE = 0)
-- Lists global template skills (retailer_id = 'TEMPLATE' per 08_skill_engine.sql).
-- =============================================================================
/*
SELECT s.skill_id,
       s.retailer_id,
       s.skill_code,
       s.skill_name,
       s.domain,
       s.description,
       s.version,
       s.status,
       TO_CHAR(s.updated_at, 'YYYY-MM-DD HH24:MI:SS') AS updated_at
  FROM AI_SKILL s
 WHERE s.retailer_id = 'TEMPLATE'
 ORDER BY s.updated_at DESC NULLS LAST, s.skill_name;
*/

-- =============================================================================
-- INSERT INTO LIBQUERY — AI skill catalog + builder (AI0000040, AI0000044–50)
-- =============================================================================
-- QUERYID     Mandatory. Below: (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY)
--             so each INSERT gets the next id. Alternative: LIBQUERY_SEQ.NEXTVAL
--             (create/adjust sequence to stay above MAX(QUERYID)).
-- QUERYTYPE   0 = SQL stored in QUERYSQL (SELECT / MERGE / DML text)
--             1 = resolved via package (not used for these rows)
-- QUERYUPDATE 0 = read, 1 = DML
-- QUERYACCESS 1 = everyone, 0 = admin only
-- Add other NOT NULL columns your LIBQUERY table requires (PACKAGE_SOURCE, …).
-- =============================================================================

/*
-- Optional: remove old rows before re-insert (omit AI0000040 if already shared system-wide)
DELETE FROM LIBQUERY WHERE QUERYNUM IN (
  'AI0000040','AI0000044','AI0000045','AI0000046','AI0000047','AI0000048','AI0000049','AI0000050',
  'AI0000051','AI0000052','AI0000053','AI0000054','AI0000055','AI0000056','AI0000057','AI0000058','AI0000059','AI0000060'
);
COMMIT;
*/

/*
-- Optional sequence (use instead of MAX+1 in INSERT … SELECT if you prefer)
-- CREATE SEQUENCE LIBQUERY_SEQ START WITH <NVL(MAX(QUERYID),0)+1 FROM LIBQUERY> NOCACHE NOCYCLE;
*/

/*
INSERT INTO LIBQUERY (
    QUERYID,
    QUERYNUM,
    QUERYTITLE,
    QUERYDESC,
    QUERYSQL,
    QUERYPARAM,
    QUERYRESULT,
    QUERYACCESS,
    QUERYTYPE,
    QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000040',
       'AI — Template skill catalog',
       'Supply Chain AI S20: template skills (08_skill_engine AI_SKILL, retailer_id = TEMPLATE).',
       q'~
SELECT s.skill_id,
       s.retailer_id,
       s.skill_code,
       s.skill_name,
       s.domain,
       s.description,
       s.version,
       s.status,
       TO_CHAR(s.updated_at, 'YYYY-MM-DD HH24:MI:SS') AS updated_at
  FROM AI_SKILL s
 WHERE s.retailer_id = 'TEMPLATE'
 ORDER BY s.updated_at DESC NULLS LAST, s.skill_name
~',
       '',
       '',
       1,
       0,
       0
  FROM dual;

INSERT INTO LIBQUERY (
    QUERYID,
    QUERYNUM,
    QUERYTITLE,
    QUERYDESC,
    QUERYSQL,
    QUERYPARAM,
    QUERYRESULT,
    QUERYACCESS,
    QUERYTYPE,
    QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000044',
       'AI — Get template skill by id',
       'Supply Chain AI S21: single AI_SKILL row (08_skill_engine). PARAM :param1 = skill_id.',
       q'~
SELECT s.skill_id,
       s.retailer_id,
       s.skill_code,
       s.skill_name,
       s.domain,
       s.description,
       s.version,
       s.status,
       TO_CHAR(s.updated_at, 'YYYY-MM-DD HH24:MI:SS') AS updated_at
  FROM AI_SKILL s
 WHERE s.skill_id = :param1
~',
       '',
       '',
       1,
       0,
       0
  FROM dual;

INSERT INTO LIBQUERY (
    QUERYID,
    QUERYNUM,
    QUERYTITLE,
    QUERYDESC,
    QUERYSQL,
    QUERYPARAM,
    QUERYRESULT,
    QUERYACCESS,
    QUERYTYPE,
    QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000045',
       'AI — Upsert template skill header',
       'S21: MERGE AI_SKILL from REQUEST_QUERY_BODY. :param1=REQUESTID. JSON values[] keys: SKILL_ID, SKILL_CODE, SKILL_NAME, DOMAIN, DESCRIPTION, ACTOR.',
       q'~
MERGE INTO AI_SKILL t
USING (
    SELECT TRIM(j.skill_id)   AS sid,
           TRIM(j.skill_code) AS sc,
           TRIM(j.skill_name) AS sn,
           TRIM(j.domain)     AS dom,
           NVL(TRIM(j.description), ' ') AS descr,
           TRIM(j.actor)      AS actor
      FROM json_table(
             (SELECT r.requestbody
                FROM request_query_body r
               WHERE r.requestid = TO_NUMBER(TRIM(:param1))),
             '$.values[*]'
             COLUMNS (
                skill_id    VARCHAR2(36)  PATH '$."SKILL_ID"',
                skill_code  VARCHAR2(40)  PATH '$."SKILL_CODE"',
                skill_name  VARCHAR2(100) PATH '$."SKILL_NAME"',
                domain      VARCHAR2(40)  PATH '$."DOMAIN"',
                description VARCHAR2(1000) PATH '$."DESCRIPTION"',
                actor       VARCHAR2(50)  PATH '$."ACTOR"'
             )
           ) j
) src
ON (src.sid IS NOT NULL AND LENGTH(src.sid) > 0 AND t.skill_id = src.sid)
WHEN MATCHED THEN UPDATE SET
    t.skill_code   = src.sc,
    t.skill_name   = src.sn,
    t.domain       = src.dom,
    t.description  = src.descr,
    t.updated_at   = SYSTIMESTAMP
WHEN NOT MATCHED THEN
    INSERT (skill_id, retailer_id, skill_code, skill_name, domain, description,
            version, status, created_by, created_at, updated_at)
    VALUES (
        NVL(NULLIF(src.sid, ''), SYS_GUID()),
        'TEMPLATE',
        src.sc,
        src.sn,
        src.dom,
        NVL(src.descr, ' '),
        1.0,
        'DRAFT',
        src.actor,
        SYSTIMESTAMP,
        SYSTIMESTAMP
    )
~',
       '',
       '',
       1,
       0,
       1
  FROM dual;

INSERT INTO LIBQUERY (
    QUERYID,
    QUERYNUM,
    QUERYTITLE,
    QUERYDESC,
    QUERYSQL,
    QUERYPARAM,
    QUERYRESULT,
    QUERYACCESS,
    QUERYTYPE,
    QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000046',
       'AI — Skill knowledge bundle',
       'S21 tab: AI_SKILL_KNOWLEDGE_ITEM for skill_id (PARAM :param1). rounds_json, validation_sql as full CLOB.',
       q'~
SELECT k.item_id,
       k.skill_id,
       k.base_knowledge_key,
       k.override_mode,
       k.knowledge_key,
       k.label,
       k.description,
       k.anchor_question,
       k.rounds_json,
       k.validation_sql,
       k.priority,
       k.is_mandatory,
       k.created_at
  FROM AI_SKILL_KNOWLEDGE_ITEM k
 WHERE k.skill_id = :param1
 ORDER BY k.priority, k.knowledge_key, k.item_id
~',
       '',
       '',
       1,
       0,
       0
  FROM dual;

INSERT INTO LIBQUERY (
    QUERYID,
    QUERYNUM,
    QUERYTITLE,
    QUERYDESC,
    QUERYSQL,
    QUERYPARAM,
    QUERYRESULT,
    QUERYACCESS,
    QUERYTYPE,
    QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000047',
       'AI — Skill playbook steps',
       'S21 tab: AI_SKILL_PLAYBOOK_STEP for skill_id (PARAM :param1).',
       q'~
SELECT p.step_id,
       p.skill_id,
       p.complaint_type,
       p.step_order,
       p.step_code,
       p.step_label,
       p.hypothesis_tested,
       p.gold_schema,
       p.gold_table,
       p.key_columns,
       p.evidence_fact_type,
       p.is_mandatory,
       p.insert_position,
       p.insert_after_step,
       p.created_at
  FROM AI_SKILL_PLAYBOOK_STEP p
 WHERE p.skill_id = :param1
 ORDER BY p.complaint_type, p.step_order, p.step_code
~',
       '',
       '',
       1,
       0,
       0
  FROM dual;

INSERT INTO LIBQUERY (
    QUERYID,
    QUERYNUM,
    QUERYTITLE,
    QUERYDESC,
    QUERYSQL,
    QUERYPARAM,
    QUERYRESULT,
    QUERYACCESS,
    QUERYTYPE,
    QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000048',
       'AI — Skill SQL templates',
       'S21 tab: AI_SKILL_SQL_TEMPLATE for skill_id (PARAM :param1). Full CLOB: sql_text, parameters_json, last_test_result.',
       q'~
SELECT t.template_id,
       t.skill_id,
       t.template_code,
       t.template_label,
       t.purpose,
       t.sql_text,
       t.parameters_json,
       t.tables_referenced,
       t.last_tested_at,
       t.last_test_result,
       t.last_test_passed,
       t.tested_by,
       t.created_at
  FROM AI_SKILL_SQL_TEMPLATE t
 WHERE t.skill_id = :param1
 ORDER BY t.template_code
~',
       '',
       '',
       1,
       0,
       0
  FROM dual;

INSERT INTO LIBQUERY (
    QUERYID,
    QUERYNUM,
    QUERYTITLE,
    QUERYDESC,
    QUERYSQL,
    QUERYPARAM,
    QUERYRESULT,
    QUERYACCESS,
    QUERYTYPE,
    QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000049',
       'AI — Skill vocabulary',
       'S21 tab: AI_SKILL_VOCABULARY for skill_id (PARAM :param1).',
       q'~
SELECT v.vocab_id,
       v.skill_id,
       v.term,
       v.canonical_concept,
       v.term_type,
       v.language_code,
       v.confidence_boost,
       v.created_at
  FROM AI_SKILL_VOCABULARY v
 WHERE v.skill_id = :param1
 ORDER BY v.term, v.vocab_id
~',
       '',
       '',
       1,
       0,
       0
  FROM dual;

INSERT INTO LIBQUERY (
    QUERYID,
    QUERYNUM,
    QUERYTITLE,
    QUERYDESC,
    QUERYSQL,
    QUERYPARAM,
    QUERYRESULT,
    QUERYACCESS,
    QUERYTYPE,
    QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000050',
       'AI — Skill test suite',
       'S21 tab: AI_SKILL_TEST_CASE for skill_id (PARAM :param1). complaint_text as full CLOB.',
       q'~
SELECT e.test_id,
       e.skill_id,
       e.test_name,
       e.complaint_text,
       e.complaint_type,
       e.expected_root_cause,
       e.expected_confidence,
       e.expected_steps_min,
       e.last_run_at,
       e.last_run_by,
       e.actual_root_cause,
       e.actual_confidence,
       e.actual_steps_fired,
       e.passed,
       e.failure_reason,
       e.created_at
  FROM AI_SKILL_TEST_CASE e
 WHERE e.skill_id = :param1
 ORDER BY e.test_name, e.test_id
~',
       '',
       '',
       1,
       0,
       0
  FROM dual;

INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000051',
       'AI — MERGE skill knowledge item',
       'S21 POST: :param1=REQUESTID. JSON values[]: ITEM_ID, SKILL_ID, ... ROUNDS_JSON, VALIDATION_SQL as CLOB-capable (large corpus chunks). Empty ITEM_ID = insert.',
       q'~
MERGE INTO AI_SKILL_KNOWLEDGE_ITEM t
USING (
    SELECT CASE WHEN NULLIF(TRIM(j.item_id), '') IS NOT NULL THEN TO_NUMBER(TRIM(j.item_id)) END AS iid,
           TRIM(j.skill_id) AS sid,
           NULLIF(TRIM(j.base_knowledge_key), '') AS bk,
           NVL(NULLIF(TRIM(j.override_mode), ''), 'EXTEND') AS ov,
           TRIM(j.knowledge_key) AS kk,
           TRIM(j.label) AS lbl,
           NVL(TRIM(j.description), ' ') AS descr,
           NVL(TRIM(j.anchor_question), ' ') AS aq,
           CASE
             WHEN j.rounds_json IS NULL
                  OR DBMS_LOB.GETLENGTH(j.rounds_json) = 0
               THEN TO_CLOB('[]')
             ELSE j.rounds_json
           END AS rj,
           CASE
             WHEN j.validation_sql IS NULL
                  OR DBMS_LOB.GETLENGTH(j.validation_sql) = 0
               THEN NULL
             ELSE j.validation_sql
           END AS vs,
           NVL(TO_NUMBER(NULLIF(TRIM(j.priority), '')), 2) AS pri,
           NVL(TO_NUMBER(NULLIF(TRIM(j.is_mandatory), '')), 1) AS im
      FROM json_table(
             (SELECT r.requestbody
                FROM request_query_body r
               WHERE r.requestid = TO_NUMBER(TRIM(:param1))),
             '$.values[*]'
             COLUMNS (
                item_id            VARCHAR2(40)  PATH '$."ITEM_ID"',
                skill_id           VARCHAR2(36)  PATH '$."SKILL_ID"',
                base_knowledge_key VARCHAR2(40)  PATH '$."BASE_KNOWLEDGE_KEY"',
                override_mode      VARCHAR2(10)  PATH '$."OVERRIDE_MODE"',
                knowledge_key      VARCHAR2(40)  PATH '$."KNOWLEDGE_KEY"',
                label              VARCHAR2(100) PATH '$."LABEL"',
                description        VARCHAR2(500) PATH '$."DESCRIPTION"',
                anchor_question    VARCHAR2(2000) PATH '$."ANCHOR_QUESTION"',
                rounds_json        CLOB            PATH '$."ROUNDS_JSON"',
                validation_sql     CLOB            PATH '$."VALIDATION_SQL"',
                priority           VARCHAR2(10)  PATH '$."PRIORITY"',
                is_mandatory       VARCHAR2(10)  PATH '$."IS_MANDATORY"'
             )
           ) j
) src
ON (src.iid IS NOT NULL AND t.item_id = src.iid AND t.skill_id = src.sid)
WHEN MATCHED THEN UPDATE SET
    t.base_knowledge_key  = src.bk,
    t.override_mode       = src.ov,
    t.knowledge_key       = src.kk,
    t.label               = src.lbl,
    t.description         = src.descr,
    t.anchor_question     = src.aq,
    t.rounds_json         = src.rj,
    t.validation_sql      = src.vs,
    t.priority            = src.pri,
    t.is_mandatory        = src.im
WHEN NOT MATCHED THEN
    INSERT (skill_id, base_knowledge_key, override_mode, knowledge_key, label, description,
            anchor_question, rounds_json, validation_sql, priority, is_mandatory)
    VALUES (src.sid, src.bk, src.ov, src.kk, src.lbl, src.descr, src.aq, src.rj, src.vs, src.pri, src.im)
~',
       '', '', 1, 0, 1
  FROM dual;

INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000052',
       'AI — DELETE skill knowledge item',
       'S21 POST: :param1=REQUESTID. JSON values[]: ITEM_ID, SKILL_ID.',
       q'~
DELETE FROM AI_SKILL_KNOWLEDGE_ITEM k
 WHERE EXISTS (
    SELECT 1
      FROM json_table(
             (SELECT r.requestbody
                FROM request_query_body r
               WHERE r.requestid = TO_NUMBER(TRIM(:param1))),
             '$.values[*]'
             COLUMNS (
                item_id  VARCHAR2(40) PATH '$."ITEM_ID"',
                skill_id VARCHAR2(36) PATH '$."SKILL_ID"'
             )
           ) src
     WHERE k.item_id = TO_NUMBER(TRIM(src.item_id))
       AND k.skill_id = TRIM(src.skill_id)
)
~',
       '', '', 1, 0, 1
  FROM dual;

INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000053',
       'AI — MERGE skill playbook step',
       'S21 POST: :param1=REQUESTID. JSON values[]: STEP_ID, SKILL_ID, COMPLAINT_TYPE, STEP_ORDER, STEP_CODE, STEP_LABEL, HYPOTHESIS_TESTED, GOLD_SCHEMA, GOLD_TABLE, KEY_COLUMNS, EVIDENCE_FACT_TYPE, IS_MANDATORY, INSERT_POSITION, INSERT_AFTER_STEP.',
       q'~
MERGE INTO AI_SKILL_PLAYBOOK_STEP t
USING (
    SELECT CASE WHEN NULLIF(TRIM(j.step_id), '') IS NOT NULL THEN TO_NUMBER(TRIM(j.step_id)) END AS sid,
           TRIM(j.skill_id) AS skill_id,
           TRIM(j.complaint_type) AS ct,
           NVL(TO_NUMBER(NULLIF(TRIM(j.step_order), '')), 1) AS so,
           TRIM(j.step_code) AS sc,
           TRIM(j.step_label) AS sl,
           NVL(TRIM(j.hypothesis_tested), '-') AS ht,
           NVL(TRIM(j.gold_schema), '-') AS gs,
           NVL(TRIM(j.gold_table), '-') AS gt,
           NULLIF(TRIM(j.key_columns), '') AS kc,
           NVL(TRIM(j.evidence_fact_type), 'FACT') AS ef,
           NVL(TO_NUMBER(NULLIF(TRIM(j.is_mandatory), '')), 1) AS im,
           NVL(NULLIF(TRIM(j.insert_position), ''), 'APPEND') AS ip,
           NULLIF(TRIM(j.insert_after_step), '') AS ias
      FROM json_table(
             (SELECT r.requestbody
                FROM request_query_body r
               WHERE r.requestid = TO_NUMBER(TRIM(:param1))),
             '$.values[*]'
             COLUMNS (
                step_id           VARCHAR2(40)  PATH '$."STEP_ID"',
                skill_id          VARCHAR2(36)  PATH '$."SKILL_ID"',
                complaint_type    VARCHAR2(40)  PATH '$."COMPLAINT_TYPE"',
                step_order        VARCHAR2(10)  PATH '$."STEP_ORDER"',
                step_code         VARCHAR2(40)  PATH '$."STEP_CODE"',
                step_label        VARCHAR2(100) PATH '$."STEP_LABEL"',
                hypothesis_tested VARCHAR2(200) PATH '$."HYPOTHESIS_TESTED"',
                gold_schema       VARCHAR2(20)  PATH '$."GOLD_SCHEMA"',
                gold_table        VARCHAR2(60)  PATH '$."GOLD_TABLE"',
                key_columns       VARCHAR2(500) PATH '$."KEY_COLUMNS"',
                evidence_fact_type VARCHAR2(40) PATH '$."EVIDENCE_FACT_TYPE"',
                is_mandatory      VARCHAR2(10)  PATH '$."IS_MANDATORY"',
                insert_position   VARCHAR2(20)  PATH '$."INSERT_POSITION"',
                insert_after_step VARCHAR2(40)  PATH '$."INSERT_AFTER_STEP"'
             )
           ) j
) src
ON (src.sid IS NOT NULL AND t.step_id = src.sid AND t.skill_id = src.skill_id)
WHEN MATCHED THEN UPDATE SET
    t.complaint_type      = src.ct,
    t.step_order          = src.so,
    t.step_code           = src.sc,
    t.step_label          = src.sl,
    t.hypothesis_tested   = src.ht,
    t.gold_schema         = src.gs,
    t.gold_table          = src.gt,
    t.key_columns         = src.kc,
    t.evidence_fact_type  = src.ef,
    t.is_mandatory        = src.im,
    t.insert_position     = src.ip,
    t.insert_after_step   = src.ias
WHEN NOT MATCHED THEN
    INSERT (skill_id, complaint_type, step_order, step_code, step_label, hypothesis_tested,
            gold_schema, gold_table, key_columns, evidence_fact_type, is_mandatory,
            insert_position, insert_after_step)
    VALUES (src.skill_id, src.ct, src.so, src.sc, src.sl, src.ht, src.gs, src.gt, src.kc, src.ef, src.im, src.ip, src.ias)
~',
       '', '', 1, 0, 1
  FROM dual;

INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000054',
       'AI — DELETE skill playbook step',
       'S21 POST: :param1=REQUESTID. JSON values[]: STEP_ID, SKILL_ID.',
       q'~
DELETE FROM AI_SKILL_PLAYBOOK_STEP p
 WHERE EXISTS (
    SELECT 1
      FROM json_table(
             (SELECT r.requestbody
                FROM request_query_body r
               WHERE r.requestid = TO_NUMBER(TRIM(:param1))),
             '$.values[*]'
             COLUMNS (
                step_id  VARCHAR2(40) PATH '$."STEP_ID"',
                skill_id VARCHAR2(36) PATH '$."SKILL_ID"'
             )
           ) src
     WHERE p.step_id = TO_NUMBER(TRIM(src.step_id))
       AND p.skill_id = TRIM(src.skill_id)
)
~',
       '', '', 1, 0, 1
  FROM dual;

INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000055',
       'AI — MERGE skill SQL template',
       'S21 POST: :param1=REQUESTID. JSON values[]: TEMPLATE_ID, SKILL_ID, ... SQL_TEXT, PARAMETERS_JSON as CLOB (long templates / param JSON).',
       q'~
MERGE INTO AI_SKILL_SQL_TEMPLATE t
USING (
    SELECT CASE WHEN NULLIF(TRIM(j.template_id), '') IS NOT NULL THEN TO_NUMBER(TRIM(j.template_id)) END AS tid,
           TRIM(j.skill_id) AS skill_id,
           TRIM(j.template_code) AS tc,
           TRIM(j.template_label) AS tl,
           NULLIF(TRIM(j.purpose), '') AS purp,
           CASE
             WHEN j.sql_text IS NULL
                  OR DBMS_LOB.GETLENGTH(j.sql_text) = 0
               THEN TO_CLOB(' ')
             ELSE j.sql_text
           END AS st,
           CASE
             WHEN j.parameters_json IS NULL
                  OR DBMS_LOB.GETLENGTH(j.parameters_json) = 0
               THEN TO_CLOB('[]')
             ELSE j.parameters_json
           END AS pj,
           NULLIF(TRIM(j.tables_referenced), '') AS trf
      FROM json_table(
             (SELECT r.requestbody
                FROM request_query_body r
               WHERE r.requestid = TO_NUMBER(TRIM(:param1))),
             '$.values[*]'
             COLUMNS (
                template_id       VARCHAR2(40)  PATH '$."TEMPLATE_ID"',
                skill_id          VARCHAR2(36)  PATH '$."SKILL_ID"',
                template_code     VARCHAR2(40)  PATH '$."TEMPLATE_CODE"',
                template_label    VARCHAR2(100) PATH '$."TEMPLATE_LABEL"',
                purpose           VARCHAR2(200) PATH '$."PURPOSE"',
                sql_text          CLOB            PATH '$."SQL_TEXT"',
                parameters_json   CLOB            PATH '$."PARAMETERS_JSON"',
                tables_referenced VARCHAR2(500) PATH '$."TABLES_REFERENCED"'
             )
           ) j
) src
ON (src.tid IS NOT NULL AND t.template_id = src.tid AND t.skill_id = src.skill_id)
WHEN MATCHED THEN UPDATE SET
    t.template_code       = src.tc,
    t.template_label      = src.tl,
    t.purpose             = src.purp,
    t.sql_text            = src.st,
    t.parameters_json     = src.pj,
    t.tables_referenced   = src.trf
WHEN NOT MATCHED THEN
    INSERT (skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced)
    VALUES (src.skill_id, src.tc, src.tl, src.purp, src.st, src.pj, src.trf)
~',
       '', '', 1, 0, 1
  FROM dual;

INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000056',
       'AI — DELETE skill SQL template',
       'S21 POST: :param1=REQUESTID. JSON values[]: TEMPLATE_ID, SKILL_ID.',
       q'~
DELETE FROM AI_SKILL_SQL_TEMPLATE x
 WHERE EXISTS (
    SELECT 1
      FROM json_table(
             (SELECT r.requestbody
                FROM request_query_body r
               WHERE r.requestid = TO_NUMBER(TRIM(:param1))),
             '$.values[*]'
             COLUMNS (
                template_id VARCHAR2(40) PATH '$."TEMPLATE_ID"',
                skill_id    VARCHAR2(36) PATH '$."SKILL_ID"'
             )
           ) src
     WHERE x.template_id = TO_NUMBER(TRIM(src.template_id))
       AND x.skill_id = TRIM(src.skill_id)
)
~',
       '', '', 1, 0, 1
  FROM dual;

INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000057',
       'AI — MERGE skill vocabulary row',
       'S21 POST: :param1=REQUESTID. JSON values[]: VOCAB_ID, SKILL_ID, TERM, CANONICAL_CONCEPT, TERM_TYPE, LANGUAGE_CODE, CONFIDENCE_BOOST.',
       q'~
MERGE INTO AI_SKILL_VOCABULARY t
USING (
    SELECT CASE WHEN NULLIF(TRIM(j.vocab_id), '') IS NOT NULL THEN TO_NUMBER(TRIM(j.vocab_id)) END AS vid,
           TRIM(j.skill_id) AS skill_id,
           TRIM(j.term) AS trm,
           TRIM(j.canonical_concept) AS cc,
           NVL(NULLIF(TRIM(j.term_type), ''), 'SYNONYM') AS tt,
           NVL(NULLIF(TRIM(j.language_code), ''), 'EN') AS lc,
           NVL(TO_NUMBER(NULLIF(TRIM(j.confidence_boost), '')), 1) AS cb
      FROM json_table(
             (SELECT r.requestbody
                FROM request_query_body r
               WHERE r.requestid = TO_NUMBER(TRIM(:param1))),
             '$.values[*]'
             COLUMNS (
                vocab_id           VARCHAR2(40)  PATH '$."VOCAB_ID"',
                skill_id           VARCHAR2(36)  PATH '$."SKILL_ID"',
                term               VARCHAR2(100) PATH '$."TERM"',
                canonical_concept  VARCHAR2(100) PATH '$."CANONICAL_CONCEPT"',
                term_type          VARCHAR2(20)  PATH '$."TERM_TYPE"',
                language_code      VARCHAR2(5)   PATH '$."LANGUAGE_CODE"',
                confidence_boost   VARCHAR2(20)  PATH '$."CONFIDENCE_BOOST"'
             )
           ) j
) src
ON (src.vid IS NOT NULL AND t.vocab_id = src.vid AND t.skill_id = src.skill_id)
WHEN MATCHED THEN UPDATE SET
    t.term               = src.trm,
    t.canonical_concept  = src.cc,
    t.term_type          = src.tt,
    t.language_code      = src.lc,
    t.confidence_boost   = src.cb
WHEN NOT MATCHED THEN
    INSERT (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
    VALUES (src.skill_id, src.trm, src.cc, src.tt, src.lc, src.cb)
~',
       '', '', 1, 0, 1
  FROM dual;

INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000058',
       'AI — DELETE skill vocabulary row',
       'S21 POST: :param1=REQUESTID. JSON values[]: VOCAB_ID, SKILL_ID.',
       q'~
DELETE FROM AI_SKILL_VOCABULARY v
 WHERE EXISTS (
    SELECT 1
      FROM json_table(
             (SELECT r.requestbody
                FROM request_query_body r
               WHERE r.requestid = TO_NUMBER(TRIM(:param1))),
             '$.values[*]'
             COLUMNS (
                vocab_id VARCHAR2(40) PATH '$."VOCAB_ID"',
                skill_id VARCHAR2(36) PATH '$."SKILL_ID"'
             )
           ) src
     WHERE v.vocab_id = TO_NUMBER(TRIM(src.vocab_id))
       AND v.skill_id = TRIM(src.skill_id)
)
~',
       '', '', 1, 0, 1
  FROM dual;

INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000059',
       'AI — MERGE skill test case',
       'S21 POST: :param1=REQUESTID. JSON values[]: ... COMPLAINT_TEXT as CLOB (long scenario text).',
       q'~
MERGE INTO AI_SKILL_TEST_CASE t
USING (
    SELECT CASE WHEN NULLIF(TRIM(j.test_id), '') IS NOT NULL THEN TO_NUMBER(TRIM(j.test_id)) END AS tid,
           TRIM(j.skill_id) AS skill_id,
           TRIM(j.test_name) AS tn,
           CASE
             WHEN j.complaint_text IS NULL
                  OR DBMS_LOB.GETLENGTH(j.complaint_text) = 0
               THEN TO_CLOB(' ')
             ELSE j.complaint_text
           END AS ctxt,
           TRIM(j.complaint_type) AS cty,
           TRIM(j.expected_root_cause) AS erc,
           NVL(TRIM(j.expected_confidence), 'PROBABLE') AS ec,
           CASE WHEN NULLIF(TRIM(j.expected_steps_min), '') IS NOT NULL
                THEN TO_NUMBER(TRIM(j.expected_steps_min)) END AS esm
      FROM json_table(
             (SELECT r.requestbody
                FROM request_query_body r
               WHERE r.requestid = TO_NUMBER(TRIM(:param1))),
             '$.values[*]'
             COLUMNS (
                test_id               VARCHAR2(40)  PATH '$."TEST_ID"',
                skill_id              VARCHAR2(36)  PATH '$."SKILL_ID"',
                test_name             VARCHAR2(100) PATH '$."TEST_NAME"',
                complaint_text        CLOB            PATH '$."COMPLAINT_TEXT"',
                complaint_type        VARCHAR2(40)  PATH '$."COMPLAINT_TYPE"',
                expected_root_cause   VARCHAR2(40)  PATH '$."EXPECTED_ROOT_CAUSE"',
                expected_confidence   VARCHAR2(15)  PATH '$."EXPECTED_CONFIDENCE"',
                expected_steps_min    VARCHAR2(10)  PATH '$."EXPECTED_STEPS_MIN"'
             )
           ) j
) src
ON (src.tid IS NOT NULL AND t.test_id = src.tid AND t.skill_id = src.skill_id)
WHEN MATCHED THEN UPDATE SET
    t.test_name              = src.tn,
    t.complaint_text         = src.ctxt,
    t.complaint_type         = src.cty,
    t.expected_root_cause    = src.erc,
    t.expected_confidence    = src.ec,
    t.expected_steps_min     = src.esm
WHEN NOT MATCHED THEN
    INSERT (skill_id, test_name, complaint_text, complaint_type, expected_root_cause,
            expected_confidence, expected_steps_min)
    VALUES (src.skill_id, src.tn, src.ctxt, src.cty, src.erc, src.ec, src.esm)
~',
       '', '', 1, 0, 1
  FROM dual;

INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000060',
       'AI — DELETE skill test case',
       'S21 POST: :param1=REQUESTID. JSON values[]: TEST_ID, SKILL_ID.',
       q'~
DELETE FROM AI_SKILL_TEST_CASE e
 WHERE EXISTS (
    SELECT 1
      FROM json_table(
             (SELECT r.requestbody
                FROM request_query_body r
               WHERE r.requestid = TO_NUMBER(TRIM(:param1))),
             '$.values[*]'
             COLUMNS (
                test_id  VARCHAR2(40) PATH '$."TEST_ID"',
                skill_id VARCHAR2(36) PATH '$."SKILL_ID"'
             )
           ) src
     WHERE e.test_id = TO_NUMBER(TRIM(src.test_id))
       AND e.skill_id = TRIM(src.skill_id)
)
~',
       '', '', 1, 0, 1
  FROM dual;

COMMIT;
*/
