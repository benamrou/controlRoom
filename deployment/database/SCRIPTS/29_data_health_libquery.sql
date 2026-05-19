-- =============================================================================
-- 29_data_health_libquery.sql
-- Supply Chain AI — S24 Data Health Dashboard + S25 Configuration
-- LIBQUERY entries AI0000080 – AI0000089
--
-- Deploy against: ICR application database (same schema as all LIBQUERY entries)
-- Run AFTER: 08_skill_engine.sql (AI tables must exist)
-- Re-runnable: DELETE + INSERT pattern (same as all other AI LIBQUERY scripts)
-- QUERYID: no sequence — each INSERT subqueries MAX(QUERYID)+1 at insert time
-- QUERYSQL literals: use q'~...~' (not q'[...]') — JSON path '$.values[0]' ends with ]'
--   which prematurely closes q'[...]' and causes ORA-01756 / string literal errors.
-- QUERYTYPE   0 = SQL in QUERYSQL (required for CALLQUERY / QueryService)
-- QUERYUPDATE 0 = read (SELECT), 1 = DML
-- =============================================================================

DELETE FROM LIBQUERY WHERE QUERYNUM IN (
    'AI0000080','AI0000081','AI0000082','AI0000083','AI0000084',
    'AI0000085','AI0000086','AI0000087','AI0000088','AI0000089',
    'AI0000090'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- S24  READ QUERIES (QUERYUPDATE = 0)
-- ─────────────────────────────────────────────────────────────────────────────

-- AI0000080 — Active checks joined to latest result for retailer + tier filter
-- :param1 = RETAILER_ID, :param2 = TIER ('ALL' = no tier filter)
INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000080',
       'S24 — checks with latest result',
       'Active check definitions joined to most-recent AI_DATA_CHECK_RESULT. :param1=retailer_id, :param2=tier or ALL.',
       q'~
SELECT
  d.CHECK_ID,
  d.CHECK_CODE,
  d.CHECK_NAME,
  d.CHECK_DESCRIPTION,
  d.QUERY_NUM,
  d.TIER,
  d.SEVERITY,
  d.ENABLED,
  d.SKILL_CODE,
  d.ENTITY_KEY,
  d.DISPLAY_ORDER,
  r.ISSUE_COUNT,
  r.RUN_AT     AS LAST_RUN_AT,
  r.STATUS,
  r.TREND
FROM AI_DATA_CHECK_DEF d
LEFT JOIN (
  SELECT r1.*
  FROM AI_DATA_CHECK_RESULT r1
  WHERE r1.RUN_AT = (
    SELECT MAX(r2.RUN_AT)
    FROM AI_DATA_CHECK_RESULT r2
    WHERE r2.CHECK_ID    = r1.CHECK_ID
      AND r2.RETAILER_ID = r1.RETAILER_ID
  )
) r ON r.CHECK_ID = d.CHECK_ID AND r.RETAILER_ID = :param1
WHERE d.RETAILER_ID = :param1
  AND (:param2 = 'ALL' OR d.TIER = :param2)
ORDER BY d.DISPLAY_ORDER, d.CHECK_CODE
~',
       ':param1=retailer_id, :param2=tier (ALL|REALTIME|HOURLY|NIGHTLY)',
       'CHECK_ID,CHECK_CODE,CHECK_NAME,CHECK_DESCRIPTION,QUERY_NUM,TIER,SEVERITY,ENABLED,SKILL_CODE,ENTITY_KEY,DISPLAY_ORDER,ISSUE_COUNT,LAST_RUN_AT,STATUS,TREND',
       1, 0, 0
  FROM dual;

-- AI0000081 — Dashboard summary (totals by status + last run timestamp)
-- :param1 = RETAILER_ID
INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000081',
       'S24 — dashboard summary',
       'Aggregate counts: total checks, passing, with issues, critical, last run time. :param1=retailer_id.',
       q'~
SELECT
  COUNT(*)                                                                      AS TOTAL_CHECKS,
  SUM(CASE WHEN TRIM(r.STATUS) = 'OK'    THEN 1 ELSE 0 END)                          AS CHECKS_OK,
  SUM(CASE WHEN TRIM(r.STATUS) = 'ISSUE' THEN 1 ELSE 0 END)                          AS CHECKS_WITH_ISSUES,
  SUM(CASE WHEN TRIM(r.STATUS) = 'ISSUE' AND d.SEVERITY = 'CRITICAL' THEN 1 ELSE 0 END) AS CRITICAL_ISSUES,
  MAX(r.RUN_AT)                                                                 AS LAST_RUN_AT
FROM AI_DATA_CHECK_DEF d
LEFT JOIN (
  SELECT r1.*
  FROM AI_DATA_CHECK_RESULT r1
  WHERE r1.RUN_AT = (
    SELECT MAX(r2.RUN_AT)
    FROM AI_DATA_CHECK_RESULT r2
    WHERE r2.CHECK_ID    = r1.CHECK_ID
      AND r2.RETAILER_ID = r1.RETAILER_ID
  )
) r ON r.CHECK_ID = d.CHECK_ID AND r.RETAILER_ID = :param1
WHERE d.RETAILER_ID = :param1
  AND d.ENABLED = 1
~',
       ':param1=retailer_id',
       'TOTAL_CHECKS,CHECKS_OK,CHECKS_WITH_ISSUES,CRITICAL_ISSUES,LAST_RUN_AT',
       1, 0, 0
  FROM dual;

-- AI0000082 — Result history for a single check (trend / sparkline data)
-- :param1 = CHECK_ID, :param2 = RETAILER_ID, :param3 = lookback days (e.g. '7')
INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000082',
       'S24 — result history for check',
       'Last N days of AI_DATA_CHECK_RESULT rows for one check. :param1=check_id, :param2=retailer_id, :param3=days.',
       q'~
SELECT
  r.CHECK_ID,
  r.RETAILER_ID,
  r.RUN_AT,
  r.STATUS,
  r.ISSUE_COUNT,
  r.TREND,
  r.RUN_DURATION_MS
FROM AI_DATA_CHECK_RESULT r
WHERE r.CHECK_ID    = :param1
  AND r.RETAILER_ID = :param2
  AND r.RUN_AT     >= SYSDATE - TO_NUMBER(:param3)
ORDER BY r.RUN_AT DESC
FETCH FIRST 50 ROWS ONLY
~',
       ':param1=check_id, :param2=retailer_id, :param3=lookback days',
       'CHECK_ID,RETAILER_ID,RUN_AT,STATUS,ISSUE_COUNT,TREND,RUN_DURATION_MS',
       1, 0, 0
  FROM dual;

-- AI0000083 — Reserved (drill-down detail rows — placeholder)
INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000083',
       'S24 — drill-down detail (reserved)',
       'Reserved for check-specific affected-row drill-down. Not yet implemented.',
       q'~SELECT 'RESERVED' AS NOTE FROM DUAL WHERE 1=0~',
       '',
       '',
       0, 0, 0
  FROM dual;

-- AI0000084 — "Run now" — calls AI_RUN_DATA_CHECKS stored procedure via CALLQUERY
-- QUERYUPDATE = 1 (executed as DML block by CALLQUERY)
-- Body sent by Angular: { values: [{ RETAILER_ID: '...', TIER: 'ALL' }] }
INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000084',
       'S24 — trigger run now',
       'Calls AI_RUN_DATA_CHECKS(retailer_id, tier) for manual on-demand execution. Body: {values:[{RETAILER_ID,TIER}]}.',
       q'~
DECLARE
  v_retailer VARCHAR2(50);
  v_tier     VARCHAR2(20);
BEGIN
  SELECT jt.RETAILER_ID, jt.TIER
  INTO   v_retailer, v_tier
  FROM   REQUEST_QUERY_BODY rb,
         JSON_TABLE(rb.REQUESTBODY, '$.values[0]'
           COLUMNS (
             RETAILER_ID VARCHAR2(50) PATH '$."RETAILER_ID"',
             TIER        VARCHAR2(20) PATH '$."TIER"'
           )
         ) jt
  WHERE rb.REQUESTID = :param1;

  AI_RUN_DATA_CHECKS(v_retailer, NVL(v_tier, 'ALL'));
  COMMIT;
END;
~',
       ':param1=REQUESTID (auto-bound by CALLQUERY)',
       '',
       1, 0, 1
  FROM dual;

-- AI0000090 — Run a single check only (S24 card "Run" button)
-- Body: { values: [{ RETAILER_ID: '...', CHECK_ID: '...' }] }
INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000090',
       'S24 — run single data check',
       'Calls AI_RUN_DATA_CHECKS(retailer_id, ALL, check_id) for one enabled check. Body: {values:[{RETAILER_ID,CHECK_ID}]}.',
       q'~
DECLARE
  v_retailer VARCHAR2(50);
  v_check_id VARCHAR2(36);
BEGIN
  SELECT jt.RETAILER_ID, jt.CHECK_ID
  INTO   v_retailer, v_check_id
  FROM   REQUEST_QUERY_BODY rb,
         JSON_TABLE(rb.REQUESTBODY, '$.values[0]'
           COLUMNS (
             RETAILER_ID VARCHAR2(50) PATH '$."RETAILER_ID"',
             CHECK_ID    VARCHAR2(36) PATH '$."CHECK_ID"'
           )
         ) jt
  WHERE rb.REQUESTID = :param1;

  AI_RUN_DATA_CHECKS(v_retailer, 'ALL', v_check_id);
  COMMIT;
END;
~',
       ':param1=REQUESTID (auto-bound by CALLQUERY)',
       '',
       1, 0, 1
  FROM dual;

-- ─────────────────────────────────────────────────────────────────────────────
-- S25  CONFIGURATION CRUD (QUERYUPDATE = 0 for reads, 1 for writes)
-- ─────────────────────────────────────────────────────────────────────────────

-- AI0000085 — List all check definitions for a retailer
-- :param1 = RETAILER_ID
INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000085',
       'S25 — check definitions for retailer',
       'All AI_DATA_CHECK_DEF rows for the given retailer (includes disabled). :param1=retailer_id.',
       q'~
SELECT
  CHECK_ID,
  CHECK_CODE,
  CHECK_NAME,
  CHECK_DESCRIPTION,
  QUERY_NUM,
  TIER,
  SEVERITY,
  ENABLED,
  RETAILER_ID,
  SKILL_CODE,
  ENTITY_KEY,
  DISPLAY_ORDER,
  CREATED_AT,
  UPDATED_AT
FROM AI_DATA_CHECK_DEF
WHERE RETAILER_ID = :param1
ORDER BY DISPLAY_ORDER, CHECK_CODE
~',
       ':param1=retailer_id',
       'CHECK_ID,CHECK_CODE,CHECK_NAME,CHECK_DESCRIPTION,QUERY_NUM,TIER,SEVERITY,ENABLED,RETAILER_ID,SKILL_CODE,ENTITY_KEY,DISPLAY_ORDER,CREATED_AT,UPDATED_AT',
       1, 0, 0
  FROM dual;

-- AI0000086 — Single check definition by CHECK_ID
-- :param1 = CHECK_ID
INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000086',
       'S25 — check definition by id',
       'Single AI_DATA_CHECK_DEF row. :param1=check_id.',
       q'~
SELECT
  CHECK_ID, CHECK_CODE, CHECK_NAME, CHECK_DESCRIPTION,
  QUERY_NUM, TIER, SEVERITY, ENABLED,
  RETAILER_ID, SKILL_CODE, ENTITY_KEY, DISPLAY_ORDER
FROM AI_DATA_CHECK_DEF
WHERE CHECK_ID = :param1
~',
       ':param1=check_id',
       'CHECK_ID,CHECK_CODE,CHECK_NAME,CHECK_DESCRIPTION,QUERY_NUM,TIER,SEVERITY,ENABLED,RETAILER_ID,SKILL_CODE,ENTITY_KEY,DISPLAY_ORDER',
       1, 0, 0
  FROM dual;

-- AI0000087 — Upsert check definition (MERGE on CHECK_CODE + RETAILER_ID)
-- Body: { values: [{ CHECK_CODE, CHECK_NAME, CHECK_DESCRIPTION, QUERY_NUM,
--                    TIER, SEVERITY, ENABLED, RETAILER_ID, SKILL_CODE,
--                    ENTITY_KEY, DISPLAY_ORDER }] }
INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000087',
       'S25 — upsert check definition',
       'MERGE into AI_DATA_CHECK_DEF on CHECK_CODE+RETAILER_ID. Body: {values:[{CHECK_CODE,...}]}.',
       q'~
MERGE INTO AI_DATA_CHECK_DEF tgt
USING (
  SELECT
    jt.CHECK_CODE,
    jt.CHECK_NAME,
    jt.CHECK_DESCRIPTION,
    jt.QUERY_NUM,
    jt.TIER,
    jt.SEVERITY,
    jt.ENABLED,
    jt.RETAILER_ID,
    jt.SKILL_CODE,
    jt.ENTITY_KEY,
    jt.DISPLAY_ORDER
  FROM REQUEST_QUERY_BODY rb,
       JSON_TABLE(rb.REQUESTBODY, '$.values[0]'
         COLUMNS (
           CHECK_CODE        VARCHAR2(50)  PATH '$."CHECK_CODE"',
           CHECK_NAME        VARCHAR2(200) PATH '$."CHECK_NAME"',
           CHECK_DESCRIPTION VARCHAR2(500) PATH '$."CHECK_DESCRIPTION"',
           QUERY_NUM         VARCHAR2(20)  PATH '$."QUERY_NUM"',
           TIER              VARCHAR2(20)  PATH '$."TIER"',
           SEVERITY          VARCHAR2(20)  PATH '$."SEVERITY"',
           ENABLED           NUMBER        PATH '$."ENABLED"',
           RETAILER_ID       VARCHAR2(50)  PATH '$."RETAILER_ID"',
           SKILL_CODE        VARCHAR2(100) PATH '$."SKILL_CODE"',
           ENTITY_KEY        VARCHAR2(100) PATH '$."ENTITY_KEY"',
           DISPLAY_ORDER     NUMBER        PATH '$."DISPLAY_ORDER"'
         )
       ) jt
  WHERE rb.REQUESTID = :param1
) src
ON (tgt.CHECK_CODE = src.CHECK_CODE AND tgt.RETAILER_ID = src.RETAILER_ID)
WHEN MATCHED THEN UPDATE SET
  tgt.CHECK_NAME        = src.CHECK_NAME,
  tgt.CHECK_DESCRIPTION = src.CHECK_DESCRIPTION,
  tgt.QUERY_NUM         = src.QUERY_NUM,
  tgt.TIER              = src.TIER,
  tgt.SEVERITY          = src.SEVERITY,
  tgt.ENABLED           = src.ENABLED,
  tgt.SKILL_CODE        = src.SKILL_CODE,
  tgt.ENTITY_KEY        = src.ENTITY_KEY,
  tgt.DISPLAY_ORDER     = src.DISPLAY_ORDER,
  tgt.UPDATED_AT        = SYSDATE
WHEN NOT MATCHED THEN INSERT (
  CHECK_ID, CHECK_CODE, CHECK_NAME, CHECK_DESCRIPTION,
  QUERY_NUM, TIER, SEVERITY, ENABLED,
  RETAILER_ID, SKILL_CODE, ENTITY_KEY, DISPLAY_ORDER,
  CREATED_AT, UPDATED_AT
) VALUES (
  SYS_GUID(),
  src.CHECK_CODE, src.CHECK_NAME, src.CHECK_DESCRIPTION,
  src.QUERY_NUM, src.TIER, src.SEVERITY, src.ENABLED,
  src.RETAILER_ID, src.SKILL_CODE, src.ENTITY_KEY, src.DISPLAY_ORDER,
  SYSDATE, SYSDATE
)
~',
       ':param1=REQUESTID (auto-bound by CALLQUERY)',
       '',
       1, 0, 1
  FROM dual;

-- AI0000088 — Toggle ENABLED on a single check
-- Body: { values: [{ CHECK_ID: '...', ENABLED: 0 or 1 }] }
INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000088',
       'S25 — toggle check enabled',
       'UPDATE AI_DATA_CHECK_DEF.ENABLED for one check. Body: {values:[{CHECK_ID,ENABLED}]}.',
       q'~
UPDATE AI_DATA_CHECK_DEF tgt
SET
  tgt.ENABLED    = (
    SELECT TO_NUMBER(jt.ENABLED)
    FROM REQUEST_QUERY_BODY rb,
         JSON_TABLE(rb.REQUESTBODY, '$.values[0]'
           COLUMNS (ENABLED NUMBER PATH '$."ENABLED"')
         ) jt
    WHERE rb.REQUESTID = :param1
  ),
  tgt.UPDATED_AT = SYSDATE
WHERE tgt.CHECK_ID = (
  SELECT jt.CHECK_ID
  FROM REQUEST_QUERY_BODY rb,
       JSON_TABLE(rb.REQUESTBODY, '$.values[0]'
         COLUMNS (CHECK_ID VARCHAR2(36) PATH '$."CHECK_ID"')
       ) jt
  WHERE rb.REQUESTID = :param1
)
~',
       ':param1=REQUESTID (auto-bound by CALLQUERY)',
       '',
       1, 0, 1
  FROM dual;

-- AI0000089 — Delete a check definition (admin only — QUERYACCESS = 0)
-- Body: { values: [{ CHECK_ID: '...' }] }
INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000089',
       'S25 — delete check definition',
       'DELETE from AI_DATA_CHECK_DEF by CHECK_ID. Admin only. Body: {values:[{CHECK_ID}]}.',
       q'~
DELETE FROM AI_DATA_CHECK_DEF
WHERE CHECK_ID = (
  SELECT jt.CHECK_ID
  FROM REQUEST_QUERY_BODY rb,
       JSON_TABLE(rb.REQUESTBODY, '$.values[0]'
         COLUMNS (CHECK_ID VARCHAR2(36) PATH '$."CHECK_ID"')
       ) jt
  WHERE rb.REQUESTID = :param1
)
~',
       ':param1=REQUESTID (auto-bound by CALLQUERY)',
       '',
       0, 0, 1
  FROM dual;

COMMIT;

-- =============================================================================
-- Supporting DDL — deploy once (not re-runnable without DROP)
-- =============================================================================

/*
-- AI_DATA_CHECK_DEF — one row per configured data check
CREATE TABLE AI_DATA_CHECK_DEF (
  CHECK_ID          VARCHAR2(36)   DEFAULT SYS_GUID() NOT NULL,
  CHECK_CODE        VARCHAR2(50)   NOT NULL,
  CHECK_NAME        VARCHAR2(200)  NOT NULL,
  CHECK_DESCRIPTION VARCHAR2(500),
  QUERY_NUM         VARCHAR2(20)   NOT NULL,
  TIER              VARCHAR2(20)   DEFAULT 'NIGHTLY' NOT NULL,
  SEVERITY          VARCHAR2(20)   DEFAULT 'WARNING' NOT NULL,
  ENABLED           NUMBER(1)      DEFAULT 1 NOT NULL,
  RETAILER_ID       VARCHAR2(50)   NOT NULL,
  SKILL_CODE        VARCHAR2(100),
  ENTITY_KEY        VARCHAR2(100),
  DISPLAY_ORDER     NUMBER(5)      DEFAULT 999,
  CREATED_AT        DATE           DEFAULT SYSDATE,
  UPDATED_AT        DATE           DEFAULT SYSDATE,
  CONSTRAINT PK_AI_DATA_CHECK_DEF  PRIMARY KEY (CHECK_ID),
  CONSTRAINT UQ_AI_CHECK_CODE      UNIQUE (CHECK_CODE, RETAILER_ID),
  CONSTRAINT CK_AI_CHECK_TIER      CHECK (TIER     IN ('REALTIME','HOURLY','NIGHTLY')),
  CONSTRAINT CK_AI_CHECK_SEVERITY  CHECK (SEVERITY IN ('CRITICAL','WARNING','INFO')),
  CONSTRAINT CK_AI_CHECK_ENABLED   CHECK (ENABLED  IN (0, 1))
);

-- AI_DATA_CHECK_RESULT — one row per (check × run)
CREATE TABLE AI_DATA_CHECK_RESULT (
  RESULT_ID         VARCHAR2(36)   DEFAULT SYS_GUID() NOT NULL,
  CHECK_ID          VARCHAR2(36)   NOT NULL,
  RETAILER_ID       VARCHAR2(50)   NOT NULL,
  RUN_AT            DATE           DEFAULT SYSDATE NOT NULL,
  STATUS            VARCHAR2(20)   DEFAULT 'UNKNOWN' NOT NULL,
  ISSUE_COUNT       NUMBER         DEFAULT 0,
  TREND             NUMBER         DEFAULT 0,
  RUN_DURATION_MS   NUMBER,
  ERROR_MSG         VARCHAR2(500),
  CONSTRAINT PK_AI_DATA_CHECK_RESULT  PRIMARY KEY (RESULT_ID),
  CONSTRAINT FK_AI_RESULT_CHECK       FOREIGN KEY (CHECK_ID)
    REFERENCES AI_DATA_CHECK_DEF (CHECK_ID) ON DELETE CASCADE,
  CONSTRAINT CK_AI_RESULT_STATUS      CHECK (STATUS IN ('OK','ISSUE','UNKNOWN','ERROR'))
);

CREATE INDEX IX_AI_RESULT_CHECK_RUN
  ON AI_DATA_CHECK_RESULT (CHECK_ID, RETAILER_ID, RUN_AT DESC);

-- AI_RUN_DATA_CHECKS — called by AI0000084 "Run now" and Oracle scheduler
-- See 06_scheduler.sql for DBMS_SCHEDULER job definitions (REALTIME/HOURLY/NIGHTLY)
CREATE OR REPLACE PROCEDURE AI_RUN_DATA_CHECKS (
  p_retailer_id IN VARCHAR2,
  p_tier        IN VARCHAR2 DEFAULT 'ALL',
  p_check_id    IN VARCHAR2 DEFAULT NULL
) AS
  v_sql       CLOB;
  v_count     NUMBER;
  v_start     DATE;
  v_prev      NUMBER;
  v_err       VARCHAR2(500);   -- must capture SQLERRM into a variable; cannot call it inside SQL VALUES
  TYPE t_checks IS TABLE OF AI_DATA_CHECK_DEF%ROWTYPE;
  l_checks    t_checks;
BEGIN
  SELECT * BULK COLLECT INTO l_checks
  FROM AI_DATA_CHECK_DEF
  WHERE RETAILER_ID = p_retailer_id
    AND ENABLED     = 1
    AND (p_tier = 'ALL' OR TIER = p_tier)
    AND (p_check_id IS NULL OR CHECK_ID = p_check_id);

  FOR i IN 1..l_checks.COUNT LOOP
    v_start := SYSDATE;
    BEGIN
      SELECT QUERYSQL INTO v_sql
      FROM LIBQUERY
      WHERE QUERYNUM = l_checks(i).QUERY_NUM;

      v_sql := REGEXP_REPLACE(v_sql, ':param[12]', '''' || p_retailer_id || '''');
      EXECUTE IMMEDIATE 'SELECT COUNT(*) FROM (' || v_sql || ')' INTO v_count;

      BEGIN
        SELECT ISSUE_COUNT INTO v_prev
        FROM (
          SELECT ISSUE_COUNT FROM AI_DATA_CHECK_RESULT
          WHERE CHECK_ID    = l_checks(i).CHECK_ID
            AND RETAILER_ID = p_retailer_id
          ORDER BY RUN_AT DESC
          FETCH FIRST 1 ROWS ONLY
        );
      EXCEPTION WHEN NO_DATA_FOUND THEN
        v_prev := 0;
      END;

      INSERT INTO AI_DATA_CHECK_RESULT
        (RESULT_ID, CHECK_ID, RETAILER_ID, RUN_AT,
         STATUS, ISSUE_COUNT, TREND, RUN_DURATION_MS)
      VALUES (
        SYS_GUID(),
        l_checks(i).CHECK_ID,
        p_retailer_id,
        SYSDATE,
        CASE WHEN v_count > 0 THEN 'ISSUE' ELSE 'OK' END,
        v_count,
        v_count - v_prev,
        (SYSDATE - v_start) * 86400000
      );

    EXCEPTION WHEN OTHERS THEN
      v_err := SUBSTR(SQLERRM, 1, 500);   -- capture before entering SQL context
      INSERT INTO AI_DATA_CHECK_RESULT
        (RESULT_ID, CHECK_ID, RETAILER_ID, RUN_AT, STATUS, ISSUE_COUNT, ERROR_MSG)
      VALUES (
        SYS_GUID(),
        l_checks(i).CHECK_ID,
        p_retailer_id,
        SYSDATE,
        'ERROR',
        0,
        v_err
      );
    END;
  END LOOP;
  COMMIT;
END AI_RUN_DATA_CHECKS;
/
*/

-- =============================================================================
-- Procedure upgrade (re-runnable) — optional p_check_id for AI0000090 single-run
-- Run after LIBQUERY inserts above. Scheduler / AI0000084 still use 2-arg form.
-- =============================================================================
CREATE OR REPLACE PROCEDURE AI_RUN_DATA_CHECKS (
  p_retailer_id IN VARCHAR2,
  p_tier        IN VARCHAR2 DEFAULT 'ALL',
  p_check_id    IN VARCHAR2 DEFAULT NULL
) AS
  v_sql       CLOB;
  v_count     NUMBER;
  v_start     DATE;
  v_prev      NUMBER;
  v_err       VARCHAR2(500);
  TYPE t_checks IS TABLE OF AI_DATA_CHECK_DEF%ROWTYPE;
  l_checks    t_checks;
BEGIN
  SELECT * BULK COLLECT INTO l_checks
  FROM AI_DATA_CHECK_DEF
  WHERE RETAILER_ID = p_retailer_id
    AND ENABLED     = 1
    AND (p_tier = 'ALL' OR TIER = p_tier)
    AND (p_check_id IS NULL OR CHECK_ID = p_check_id);

  FOR i IN 1..l_checks.COUNT LOOP
    v_start := SYSDATE;
    BEGIN
      SELECT QUERYSQL INTO v_sql
      FROM LIBQUERY
      WHERE QUERYNUM = l_checks(i).QUERY_NUM;

      v_sql := REGEXP_REPLACE(v_sql, ':param[12]', '''' || p_retailer_id || '''');
      EXECUTE IMMEDIATE 'SELECT COUNT(*) FROM (' || v_sql || ')' INTO v_count;

      BEGIN
        SELECT ISSUE_COUNT INTO v_prev
        FROM (
          SELECT ISSUE_COUNT FROM AI_DATA_CHECK_RESULT
          WHERE CHECK_ID    = l_checks(i).CHECK_ID
            AND RETAILER_ID = p_retailer_id
          ORDER BY RUN_AT DESC
          FETCH FIRST 1 ROWS ONLY
        );
      EXCEPTION WHEN NO_DATA_FOUND THEN
        v_prev := 0;
      END;

      INSERT INTO AI_DATA_CHECK_RESULT
        (RESULT_ID, CHECK_ID, RETAILER_ID, RUN_AT,
         STATUS, ISSUE_COUNT, TREND, RUN_DURATION_MS)
      VALUES (
        SYS_GUID(),
        l_checks(i).CHECK_ID,
        p_retailer_id,
        SYSDATE,
        CASE WHEN v_count > 0 THEN 'ISSUE' ELSE 'OK' END,
        v_count,
        v_count - v_prev,
        (SYSDATE - v_start) * 86400000
      );

    EXCEPTION WHEN OTHERS THEN
      v_err := SUBSTR(SQLERRM, 1, 500);
      INSERT INTO AI_DATA_CHECK_RESULT
        (RESULT_ID, CHECK_ID, RETAILER_ID, RUN_AT, STATUS, ISSUE_COUNT, ERROR_MSG)
      VALUES (
        SYS_GUID(),
        l_checks(i).CHECK_ID,
        p_retailer_id,
        SYSDATE,
        'ERROR',
        0,
        v_err
      );
    END;
  END LOOP;
  COMMIT;
END AI_RUN_DATA_CHECKS;
/
