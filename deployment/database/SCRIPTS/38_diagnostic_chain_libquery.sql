-- =============================================================================
-- Diagnostic Chain — LIBQUERY entries AI0000100–AI0000106
-- Deploy after: 37_diagnostic_chain_tables.sql
-- Range AI0000080–AI0000099 is reserved for S24/S25 Data Health.
-- Diagnostic chain starts at AI0000100.
-- Pattern: DELETE + INSERT with NVL(MAX(QUERYID),0)+1 subquery (no sequence).
-- =============================================================================

DELETE FROM LIBQUERY WHERE QUERYNUM IN (
    'AI0000100','AI0000101','AI0000102',
    'AI0000103','AI0000104','AI0000105','AI0000106'
);

-- ── AI0000100 — GET diagnostic steps for a skill ─────────────────────────────
INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL,
    QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID),0)+1 FROM LIBQUERY),
       'AI0000100',
       'Diagnostic steps by skill',
       'Ordered diagnostic chain steps for a skill_id. :param1=skill_id.',
       q'[SELECT STEP_ORDER, TEMPLATE_CODE, STEP_LABEL,
               STOP_FIELD, STOP_OPERATOR, STOP_VALUE, CONCLUSION_KEY,
               NVL(STEP_TYPE, 'HARD') AS STEP_TYPE
          FROM AI_DIAGNOSTIC_STEP
         WHERE SKILL_ID = :param1
         ORDER BY STEP_ORDER, CONCLUSION_KEY]',
       ':param1=skill_id',
       'STEP_ORDER,TEMPLATE_CODE,STEP_LABEL,STOP_FIELD,STOP_OPERATOR,STOP_VALUE,CONCLUSION_KEY,STEP_TYPE',
       1, 0, 0
  FROM dual;

-- ── AI0000101 — GET conclusion template ──────────────────────────────────────
INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL,
    QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID),0)+1 FROM LIBQUERY),
       'AI0000101',
       'Diagnostic conclusion by key',
       'Conclusion template for a specific conclusion_key + retailer_id. :param1=conclusion_key :param2=retailer_id.',
       q'[SELECT CONCLUSION_KEY, SUMMARY_TEMPLATE, EVIDENCE_TEMPLATE,
               FOLLOW_UP_TEMPLATE, SEVERITY
          FROM AI_DIAGNOSTIC_CONCLUSION
         WHERE CONCLUSION_KEY = :param1
           AND (RETAILER_ID = :param2 OR RETAILER_ID = 'TEMPLATE')
         ORDER BY CASE WHEN RETAILER_ID = :param2 THEN 0 ELSE 1 END
         FETCH FIRST 1 ROWS ONLY]',
       ':param1=conclusion_key:param2=retailer_id',
       'CONCLUSION_KEY,SUMMARY_TEMPLATE,EVIDENCE_TEMPLATE,FOLLOW_UP_TEMPLATE,SEVERITY',
       1, 0, 0
  FROM dual;

-- ── AI0000102 — GET skills that have diagnostic steps (for S14 skill picker) ─
INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL,
    QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID),0)+1 FROM LIBQUERY),
       'AI0000102',
       'Skills with diagnostic chains',
       'Active skills that have at least one AI_DIAGNOSTIC_STEP row. :param1=retailer_id.',
       q'[SELECT DISTINCT s.SKILL_ID, s.SKILL_CODE, s.SKILL_NAME, s.DOMAIN
          FROM AI_SKILL s
          JOIN AI_DIAGNOSTIC_STEP d ON d.SKILL_ID = s.SKILL_ID
         WHERE s.RETAILER_ID IN (:param1, 'TEMPLATE')
           AND s.STATUS IN ('PUBLISHED','DRAFT')
         ORDER BY s.DOMAIN, s.SKILL_NAME]',
       ':param1=retailer_id',
       'SKILL_ID,SKILL_CODE,SKILL_NAME,DOMAIN',
       1, 0, 0
  FROM dual;

-- ── AI0000103 — POST MERGE diagnostic step (Skill Studio authoring) ──────────
INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL,
    QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID),0)+1 FROM LIBQUERY),
       'AI0000103',
       'Merge diagnostic step',
       'Insert or update a diagnostic chain step row. POST body keys: SKILL_ID,STEP_ORDER,TEMPLATE_CODE,STOP_FIELD,STOP_OPERATOR,STOP_VALUE,CONCLUSION_KEY,STEP_LABEL,STEP_TYPE.',
       q'~MERGE INTO AI_DIAGNOSTIC_STEP t
         USING (
             SELECT r."SKILL_ID"       AS SKILL_ID,
                    TO_NUMBER(r."STEP_ORDER") AS STEP_ORDER,
                    r."TEMPLATE_CODE"  AS TEMPLATE_CODE,
                    r."STOP_FIELD"     AS STOP_FIELD,
                    r."STOP_OPERATOR"  AS STOP_OPERATOR,
                    r."STOP_VALUE"     AS STOP_VALUE,
                    r."CONCLUSION_KEY" AS CONCLUSION_KEY,
                    r."STEP_LABEL"     AS STEP_LABEL,
                    NVL(r."STEP_TYPE", 'HARD') AS STEP_TYPE
             FROM REQUEST_QUERY_BODY b,
                  JSON_TABLE(b.REQUESTBODY, '$.values[0]' COLUMNS (
                      "SKILL_ID"       VARCHAR2(100) PATH '$."SKILL_ID"',
                      "STEP_ORDER"     VARCHAR2(10)  PATH '$."STEP_ORDER"',
                      "TEMPLATE_CODE"  VARCHAR2(100) PATH '$."TEMPLATE_CODE"',
                      "STOP_FIELD"     VARCHAR2(100) PATH '$."STOP_FIELD"',
                      "STOP_OPERATOR"  VARCHAR2(20)  PATH '$."STOP_OPERATOR"',
                      "STOP_VALUE"     VARCHAR2(200) PATH '$."STOP_VALUE"',
                      "CONCLUSION_KEY" VARCHAR2(100) PATH '$."CONCLUSION_KEY"',
                      "STEP_LABEL"     VARCHAR2(200) PATH '$."STEP_LABEL"',
                      "STEP_TYPE"      VARCHAR2(10)  PATH '$."STEP_TYPE"'
                  )) r
             WHERE b.REQUESTID = :param1
         ) s
         ON (t.SKILL_ID = s.SKILL_ID AND t.STEP_ORDER = s.STEP_ORDER AND t.CONCLUSION_KEY = s.CONCLUSION_KEY)
         WHEN MATCHED THEN UPDATE SET
             t.TEMPLATE_CODE = s.TEMPLATE_CODE, t.STOP_FIELD = s.STOP_FIELD,
             t.STOP_OPERATOR = s.STOP_OPERATOR, t.STOP_VALUE = s.STOP_VALUE,
             t.STEP_LABEL = s.STEP_LABEL, t.STEP_TYPE = s.STEP_TYPE
         WHEN NOT MATCHED THEN INSERT
             (SKILL_ID,STEP_ORDER,TEMPLATE_CODE,STOP_FIELD,STOP_OPERATOR,STOP_VALUE,CONCLUSION_KEY,STEP_LABEL,STEP_TYPE)
         VALUES
             (s.SKILL_ID,s.STEP_ORDER,s.TEMPLATE_CODE,s.STOP_FIELD,s.STOP_OPERATOR,s.STOP_VALUE,s.CONCLUSION_KEY,s.STEP_LABEL,s.STEP_TYPE)~',
       ':param1=REQUESTID',
       'MERGED',
       0, 0, 1
  FROM dual;

-- ── AI0000104 — POST MERGE conclusion template ───────────────────────────────
INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL,
    QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID),0)+1 FROM LIBQUERY),
       'AI0000104',
       'Merge diagnostic conclusion',
       'Insert or update a conclusion template. POST body: CONCLUSION_KEY,RETAILER_ID,SUMMARY_TEMPLATE,EVIDENCE_TEMPLATE,FOLLOW_UP_TEMPLATE,SEVERITY.',
       q'~MERGE INTO AI_DIAGNOSTIC_CONCLUSION t
         USING (
             SELECT r."CONCLUSION_KEY"     AS CONCLUSION_KEY,
                    r."RETAILER_ID"        AS RETAILER_ID,
                    r."SUMMARY_TEMPLATE"   AS SUMMARY_TEMPLATE,
                    r."EVIDENCE_TEMPLATE"  AS EVIDENCE_TEMPLATE,
                    r."FOLLOW_UP_TEMPLATE" AS FOLLOW_UP_TEMPLATE,
                    r."SEVERITY"           AS SEVERITY
             FROM REQUEST_QUERY_BODY b,
                  JSON_TABLE(b.REQUESTBODY, '$.values[0]' COLUMNS (
                      "CONCLUSION_KEY"     VARCHAR2(100)  PATH '$."CONCLUSION_KEY"',
                      "RETAILER_ID"        VARCHAR2(50)   PATH '$."RETAILER_ID"',
                      "SUMMARY_TEMPLATE"   VARCHAR2(2000) PATH '$."SUMMARY_TEMPLATE"',
                      "EVIDENCE_TEMPLATE"  VARCHAR2(4000) PATH '$."EVIDENCE_TEMPLATE"',
                      "FOLLOW_UP_TEMPLATE" VARCHAR2(500)  PATH '$."FOLLOW_UP_TEMPLATE"',
                      "SEVERITY"           VARCHAR2(10)   PATH '$."SEVERITY"'
                  )) r
             WHERE b.REQUESTID = :param1
         ) s
         ON (t.CONCLUSION_KEY = s.CONCLUSION_KEY AND t.RETAILER_ID = s.RETAILER_ID)
         WHEN MATCHED THEN UPDATE SET
             t.SUMMARY_TEMPLATE = s.SUMMARY_TEMPLATE, t.EVIDENCE_TEMPLATE = s.EVIDENCE_TEMPLATE,
             t.FOLLOW_UP_TEMPLATE = s.FOLLOW_UP_TEMPLATE, t.SEVERITY = s.SEVERITY
         WHEN NOT MATCHED THEN INSERT
             (CONCLUSION_KEY,RETAILER_ID,SUMMARY_TEMPLATE,EVIDENCE_TEMPLATE,FOLLOW_UP_TEMPLATE,SEVERITY)
         VALUES
             (s.CONCLUSION_KEY,s.RETAILER_ID,s.SUMMARY_TEMPLATE,s.EVIDENCE_TEMPLATE,s.FOLLOW_UP_TEMPLATE,s.SEVERITY)~',
       ':param1=REQUESTID',
       'MERGED',
       0, 0, 1
  FROM dual;

-- ── AI0000105 — POST DELETE diagnostic step ──────────────────────────────────
INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL,
    QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID),0)+1 FROM LIBQUERY),
       'AI0000105',
       'Delete diagnostic step',
       'Delete a step row. POST body: SKILL_ID, STEP_ORDER, CONCLUSION_KEY.',
       q'~DELETE FROM AI_DIAGNOSTIC_STEP
         WHERE (SKILL_ID, STEP_ORDER, CONCLUSION_KEY) IN (
             SELECT r."SKILL_ID", TO_NUMBER(r."STEP_ORDER"), r."CONCLUSION_KEY"
             FROM REQUEST_QUERY_BODY b,
                  JSON_TABLE(b.REQUESTBODY, '$.values[0]' COLUMNS (
                      "SKILL_ID"       VARCHAR2(100) PATH '$."SKILL_ID"',
                      "STEP_ORDER"     VARCHAR2(10)  PATH '$."STEP_ORDER"',
                      "CONCLUSION_KEY" VARCHAR2(100) PATH '$."CONCLUSION_KEY"'
                  )) r
             WHERE b.REQUESTID = :param1
         )~',
       ':param1=REQUESTID',
       'DELETED',
       0, 0, 1
  FROM dual;

-- ── AI0000106 — POST log diagnostic chain run to interaction log ──────────────
INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL,
    QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID),0)+1 FROM LIBQUERY),
       'AI0000106',
       'Log diagnostic chain run',
       'Append a diagnostic chain execution to AI_ENGINE_INTERACTION_LOG. POST body: RETAILER_ID,SKILL_ID,QUESTION_TEXT,CONCLUSION_KEY,FEEDBACK.',
       q'~INSERT INTO AI_ENGINE_INTERACTION_LOG
             (LOG_ID, RETAILER_ID, SKILL_ID, QUESTION_TEXT, RESPONSE_SUMMARY, FEEDBACK, LOGGED_AT)
         SELECT SYS_GUID(),
                r."RETAILER_ID",
                r."SKILL_ID",
                r."QUESTION_TEXT",
                r."CONCLUSION_KEY",
                NVL(r."FEEDBACK",'DIAGNOSTIC'),
                SYSTIMESTAMP
           FROM REQUEST_QUERY_BODY b,
                JSON_TABLE(b.REQUESTBODY, '$.values[0]' COLUMNS (
                    "RETAILER_ID"    VARCHAR2(50)   PATH '$."RETAILER_ID"',
                    "SKILL_ID"       VARCHAR2(100)  PATH '$."SKILL_ID"',
                    "QUESTION_TEXT"  VARCHAR2(2000) PATH '$."QUESTION_TEXT"',
                    "CONCLUSION_KEY" VARCHAR2(100)  PATH '$."CONCLUSION_KEY"',
                    "FEEDBACK"       VARCHAR2(20)   PATH '$."FEEDBACK"'
                )) r
          WHERE b.REQUESTID = :param1~',
       ':param1=REQUESTID',
       'LOGGED',
       1, 0, 1
  FROM dual;

COMMIT;

-- Verify
SELECT QUERYNUM, QUERYTITLE, QUERYTYPE, QUERYUPDATE
  FROM LIBQUERY
 WHERE QUERYNUM IN ('AI0000100','AI0000101','AI0000102','AI0000103','AI0000104','AI0000105','AI0000106')
 ORDER BY QUERYNUM;
