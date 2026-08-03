-- =============================================================================
-- 100_data_health_resolution_batch_fields.sql
-- Separate batch SQL/script for Fix all (once) vs per-row RESOLUTION_SQL/maps.
-- Deploy after 99. Re-runnable.
-- =============================================================================

BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE AI_DATA_CHECK_DEF ADD (RESOLUTION_BATCH_SQL CLOB)';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE NOT IN (-1430, -2261) THEN RAISE; END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE AI_DATA_CHECK_DEF ADD (RESOLUTION_BATCH_SCRIPT_TEMPLATE VARCHAR2(500))';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE NOT IN (-1430, -2261) THEN RAISE; END IF;
END;
/

COMMENT ON COLUMN AI_DATA_CHECK_DEF.RESOLUTION_BATCH_SQL IS
  'Batch UPDATE/MERGE for Fix all (once). No :binds. Used when AI0000092 receives BATCH_FIX=1.';
COMMENT ON COLUMN AI_DATA_CHECK_DEF.RESOLUTION_BATCH_SCRIPT_TEMPLATE IS
  'GOLD script for Fix all (once). Fixed command, no :placeholders. Falls back to RESOLUTION_SCRIPT_TEMPLATE if null.';

CREATE OR REPLACE PROCEDURE AI_EXECUTE_CHECK_RESOLUTION_SQL (
    p_request_id IN NUMBER,
    p_dry_run    IN NUMBER DEFAULT 0
) AS
    v_body         CLOB;
    v_check_id     VARCHAR2(36);
    v_retailer_id  VARCHAR2(50);
    v_mode         VARCHAR2(20);
    v_sql          CLOB;
    v_row_sql      CLOB;
    v_batch_sql    CLOB;
    v_map          VARCHAR2(500);
    v_enabled      NUMBER;
    v_batch        NUMBER;
    v_sql_chk      VARCHAR2(4000);
    v_cur          INTEGER;
    v_rows         INTEGER;
    v_token        VARCHAR2(200);
    v_bind         VARCHAR2(100);
    v_col          VARCHAR2(200);
    v_val          VARCHAR2(4000);
    v_json_path    VARCHAR2(500);
    v_pos          PLS_INTEGER;
    v_rest         VARCHAR2(500);
    v_eq           PLS_INTEGER;

    FUNCTION json_val(p_key VARCHAR2) RETURN VARCHAR2 IS
    BEGIN
        IF p_key IS NULL OR TRIM(p_key) IS NULL THEN
            RETURN NULL;
        END IF;
        v_json_path := '$.values[0]."' || REPLACE(TRIM(p_key), '"', '\"') || '"';
        RETURN JSON_VALUE(v_body, v_json_path RETURNING VARCHAR2(4000) NULL ON ERROR);
    END json_val;

    FUNCTION resolve_bind_val(p_col VARCHAR2, p_bind VARCHAR2) RETURN VARCHAR2 IS
        v_out VARCHAR2(4000);
    BEGIN
        v_out := json_val(p_col);
        IF v_out IS NULL OR TRIM(v_out) IS NULL THEN
            v_out := json_val(p_bind);
        END IF;
        IF v_out IS NULL OR TRIM(v_out) IS NULL THEN
            v_out := json_val(UPPER(p_bind));
        END IF;
        RETURN v_out;
    END resolve_bind_val;

BEGIN
    SELECT rb.REQUESTBODY
      INTO v_body
      FROM REQUEST_QUERY_BODY rb
     WHERE rb.REQUESTID = p_request_id;

    v_check_id    := JSON_VALUE(v_body, '$.values[0].CHECK_ID'    RETURNING VARCHAR2(36)  NULL ON ERROR);
    v_retailer_id := JSON_VALUE(v_body, '$.values[0].RETAILER_ID' RETURNING VARCHAR2(50)  NULL ON ERROR);
    v_batch       := NVL(JSON_VALUE(v_body, '$.values[0].BATCH_FIX' RETURNING NUMBER NULL ON ERROR), 0);

    IF v_check_id IS NULL OR v_retailer_id IS NULL THEN
        RAISE_APPLICATION_ERROR(-20094, 'CHECK_ID and RETAILER_ID are required in the fix payload.');
    END IF;

    SELECT NVL(d.RESOLUTION_MODE, 'NONE'),
           d.RESOLUTION_SQL,
           d.RESOLUTION_BATCH_SQL,
           d.RESOLUTION_PARAM_MAP,
           d.ENABLED
      INTO v_mode, v_row_sql, v_batch_sql, v_map, v_enabled
      FROM AI_DATA_CHECK_DEF d
     WHERE d.CHECK_ID = v_check_id
       AND d.RETAILER_ID = v_retailer_id;

    IF NVL(v_enabled, 0) != 1 THEN
        RAISE_APPLICATION_ERROR(-20091, 'Data health check is disabled.');
    END IF;

    IF v_mode NOT IN ('SQL', 'SQL_JOB', 'SQL_SCRIPT', 'SQL_SCRIPT_JOB') THEN
        RAISE_APPLICATION_ERROR(-20095,
          'Check is not configured for inline SQL resolution (mode=' || NVL(v_mode, 'NULL') || ').');
    END IF;

    IF NVL(v_batch, 0) = 1 THEN
        IF v_batch_sql IS NOT NULL AND DBMS_LOB.GETLENGTH(v_batch_sql) > 0 THEN
            v_sql := v_batch_sql;
        ELSIF v_row_sql IS NOT NULL AND DBMS_LOB.GETLENGTH(v_row_sql) > 0 THEN
            v_sql := v_row_sql;
        ELSE
            RAISE_APPLICATION_ERROR(-20101,
              'RESOLUTION_BATCH_SQL (or RESOLUTION_SQL fallback) is empty for batch fix.');
        END IF;
    ELSE
        v_sql := v_row_sql;
        IF v_sql IS NULL OR DBMS_LOB.GETLENGTH(v_sql) = 0 THEN
            RAISE_APPLICATION_ERROR(-20096, 'RESOLUTION_SQL is empty on this check.');
        END IF;
        IF v_map IS NULL OR TRIM(v_map) IS NULL THEN
            RAISE_APPLICATION_ERROR(-20097, 'RESOLUTION_PARAM_MAP is required for per-row inline SQL resolution.');
        END IF;
    END IF;

    v_sql_chk := UPPER(TRIM(DBMS_LOB.SUBSTR(v_sql, 4000, 1)));
    IF NOT (v_sql_chk LIKE 'UPDATE %' OR v_sql_chk LIKE 'MERGE %') THEN
        RAISE_APPLICATION_ERROR(-20098,
          'Resolution SQL must start with UPDATE or MERGE (case-insensitive).');
    END IF;

    v_cur := DBMS_SQL.OPEN_CURSOR;
    DBMS_SQL.PARSE(v_cur, v_sql, DBMS_SQL.NATIVE);

    IF NVL(v_batch, 0) != 1 THEN
        v_rest := TRIM(v_map) || ',';
        LOOP
            v_pos := INSTR(v_rest, ',');
            EXIT WHEN v_pos = 0;
            v_token := TRIM(SUBSTR(v_rest, 1, v_pos - 1));
            v_rest  := SUBSTR(v_rest, v_pos + 1);
            EXIT WHEN v_token IS NULL;
            v_eq := INSTR(v_token, '=');
            IF v_eq > 0 THEN
                v_bind := TRIM(SUBSTR(v_token, 1, v_eq - 1));
                v_col  := TRIM(SUBSTR(v_token, v_eq + 1));
            ELSE
                v_bind := v_token;
                v_col  := v_token;
            END IF;
            v_bind := REGEXP_REPLACE(v_bind, '^:', '');
            v_val  := resolve_bind_val(v_col, v_bind);
            IF v_val IS NULL OR TRIM(v_val) IS NULL THEN
                DBMS_SQL.CLOSE_CURSOR(v_cur);
                RAISE_APPLICATION_ERROR(-20099,
                  'Missing bind value for "' || v_col || '" / :' || v_bind ||
                  ' — JSON must include the bind name or column header key.');
            END IF;
            DBMS_SQL.BIND_VARIABLE(v_cur, v_bind, v_val);
        END LOOP;
    END IF;

    IF NVL(p_dry_run, 0) = 1 THEN
        DBMS_SQL.CLOSE_CURSOR(v_cur);
        RETURN;
    END IF;

    v_rows := DBMS_SQL.EXECUTE(v_cur);
    DBMS_SQL.CLOSE_CURSOR(v_cur);

    IF v_rows = 0 THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20100,
          'Resolution SQL matched 0 rows — check WHERE clause, bind values, and @dblink target.');
    END IF;

    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        IF v_cur IS NOT NULL AND DBMS_SQL.IS_OPEN(v_cur) THEN
            DBMS_SQL.CLOSE_CURSOR(v_cur);
        END IF;
        ROLLBACK;
        RAISE;
END AI_EXECUTE_CHECK_RESOLUTION_SQL;
/

DELETE FROM LIBQUERY WHERE QUERYNUM IN ('AI0000080', 'AI0000085', 'AI0000086', 'AI0000087');

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
  NVL(d.RESOLUTION_MODE, 'NONE') AS RESOLUTION_MODE,
  d.RESOLUTION_QUERY_NUM,
  d.RESOLUTION_PARAM_MAP,
  d.RESOLUTION_JOB_NAME,
  d.RESOLUTION_SCRIPT_TEMPLATE,
  d.RESOLUTION_SCRIPT_PARAM_MAP,
  DBMS_LOB.SUBSTR(d.RESOLUTION_SQL, 4000, 1) AS RESOLUTION_SQL,
  DBMS_LOB.SUBSTR(d.RESOLUTION_BATCH_SQL, 4000, 1) AS RESOLUTION_BATCH_SQL,
  d.RESOLUTION_BATCH_SCRIPT_TEMPLATE,
  d.FIXABLE_STATUS_COLUMN,
  d.FIXABLE_STATUS_VALUE,
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
       'CHECK_ID,CHECK_CODE,CHECK_NAME,CHECK_DESCRIPTION,QUERY_NUM,TIER,SEVERITY,ENABLED,SKILL_CODE,ENTITY_KEY,DISPLAY_ORDER,RESOLUTION_MODE,RESOLUTION_QUERY_NUM,RESOLUTION_PARAM_MAP,RESOLUTION_JOB_NAME,RESOLUTION_SCRIPT_TEMPLATE,RESOLUTION_SCRIPT_PARAM_MAP,RESOLUTION_SQL,RESOLUTION_BATCH_SQL,RESOLUTION_BATCH_SCRIPT_TEMPLATE,FIXABLE_STATUS_COLUMN,FIXABLE_STATUS_VALUE,ISSUE_COUNT,LAST_RUN_AT,STATUS,TREND',
       1, 0, 0
  FROM dual;

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
  NVL(RESOLUTION_MODE, 'NONE') AS RESOLUTION_MODE,
  RESOLUTION_QUERY_NUM,
  RESOLUTION_PARAM_MAP,
  RESOLUTION_JOB_NAME,
  RESOLUTION_SCRIPT_TEMPLATE,
  RESOLUTION_SCRIPT_PARAM_MAP,
  DBMS_LOB.SUBSTR(RESOLUTION_SQL, 4000, 1) AS RESOLUTION_SQL,
  DBMS_LOB.SUBSTR(RESOLUTION_BATCH_SQL, 4000, 1) AS RESOLUTION_BATCH_SQL,
  RESOLUTION_BATCH_SCRIPT_TEMPLATE,
  FIXABLE_STATUS_COLUMN,
  FIXABLE_STATUS_VALUE,
  CREATED_AT,
  UPDATED_AT
FROM AI_DATA_CHECK_DEF
WHERE RETAILER_ID = :param1
ORDER BY DISPLAY_ORDER, CHECK_CODE
~',
       ':param1=retailer_id',
       'CHECK_ID,CHECK_CODE,CHECK_NAME,CHECK_DESCRIPTION,QUERY_NUM,TIER,SEVERITY,ENABLED,RETAILER_ID,SKILL_CODE,ENTITY_KEY,DISPLAY_ORDER,RESOLUTION_MODE,RESOLUTION_QUERY_NUM,RESOLUTION_PARAM_MAP,RESOLUTION_JOB_NAME,RESOLUTION_SCRIPT_TEMPLATE,RESOLUTION_SCRIPT_PARAM_MAP,RESOLUTION_SQL,RESOLUTION_BATCH_SQL,RESOLUTION_BATCH_SCRIPT_TEMPLATE,FIXABLE_STATUS_COLUMN,FIXABLE_STATUS_VALUE,CREATED_AT,UPDATED_AT',
       1, 0, 0
  FROM dual;

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
  RETAILER_ID, SKILL_CODE, ENTITY_KEY, DISPLAY_ORDER,
  NVL(RESOLUTION_MODE, 'NONE') AS RESOLUTION_MODE,
  RESOLUTION_QUERY_NUM, RESOLUTION_PARAM_MAP, RESOLUTION_JOB_NAME,
  RESOLUTION_SCRIPT_TEMPLATE, RESOLUTION_SCRIPT_PARAM_MAP,
  DBMS_LOB.SUBSTR(RESOLUTION_SQL, 4000, 1) AS RESOLUTION_SQL,
  DBMS_LOB.SUBSTR(RESOLUTION_BATCH_SQL, 4000, 1) AS RESOLUTION_BATCH_SQL,
  RESOLUTION_BATCH_SCRIPT_TEMPLATE,
  FIXABLE_STATUS_COLUMN, FIXABLE_STATUS_VALUE
FROM AI_DATA_CHECK_DEF
WHERE CHECK_ID = :param1
~',
       ':param1=check_id',
       'CHECK_ID,CHECK_CODE,CHECK_NAME,CHECK_DESCRIPTION,QUERY_NUM,TIER,SEVERITY,ENABLED,RETAILER_ID,SKILL_CODE,ENTITY_KEY,DISPLAY_ORDER,RESOLUTION_MODE,RESOLUTION_QUERY_NUM,RESOLUTION_PARAM_MAP,RESOLUTION_JOB_NAME,RESOLUTION_SCRIPT_TEMPLATE,RESOLUTION_SCRIPT_PARAM_MAP,RESOLUTION_SQL,RESOLUTION_BATCH_SQL,RESOLUTION_BATCH_SCRIPT_TEMPLATE,FIXABLE_STATUS_COLUMN,FIXABLE_STATUS_VALUE',
       1, 0, 0
  FROM dual;

INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000087',
       'S25 — upsert check definition',
       'MERGE AI_DATA_CHECK_DEF: match CHECK_ID when sent (edit), else CHECK_CODE+RETAILER_ID (insert). Body: {values:[{CHECK_ID?,CHECK_CODE,...}]}.',
       TO_CLOB(q'~
DECLARE
  v_req NUMBER := :param1;
  v_payload_rows NUMBER;
BEGIN
  SELECT COUNT(*)
    INTO v_payload_rows
    FROM REQUEST_QUERY_BODY rb
   WHERE rb.REQUESTID = v_req;

  IF v_payload_rows = 0 THEN
    RAISE_APPLICATION_ERROR(-20088, 'Request body not found for REQUESTID=' || v_req);
  END IF;

  SELECT COUNT(*)
    INTO v_payload_rows
    FROM REQUEST_QUERY_BODY rb,
         JSON_TABLE(rb.REQUESTBODY, '$.values[0]'
           COLUMNS (CHECK_CODE VARCHAR2(50) PATH '$."CHECK_CODE"')
         ) jt
   WHERE rb.REQUESTID = v_req
     AND jt.CHECK_CODE IS NOT NULL;

  IF v_payload_rows = 0 THEN
    RAISE_APPLICATION_ERROR(-20089, 'JSON payload missing values[0] or CHECK_CODE.');
  END IF;

  MERGE INTO AI_DATA_CHECK_DEF tgt
  USING (
    SELECT
      NULLIF(TRIM(jt.CHECK_ID), '') AS CHECK_ID,
      TRIM(jt.CHECK_CODE)            AS CHECK_CODE,
      jt.CHECK_NAME,
      jt.CHECK_DESCRIPTION,
      jt.QUERY_NUM,
      jt.TIER,
      jt.SEVERITY,
      jt.ENABLED,
      TRIM(jt.RETAILER_ID)           AS RETAILER_ID,
      jt.SKILL_CODE,
      jt.ENTITY_KEY,
      jt.DISPLAY_ORDER,
      NVL(NULLIF(TRIM(jt.RESOLUTION_MODE), ''), 'NONE') AS RESOLUTION_MODE,
      NULLIF(TRIM(jt.RESOLUTION_QUERY_NUM), '')         AS RESOLUTION_QUERY_NUM,
      NULLIF(TRIM(jt.RESOLUTION_PARAM_MAP), '')       AS RESOLUTION_PARAM_MAP,
      NULLIF(TRIM(jt.RESOLUTION_JOB_NAME), '')        AS RESOLUTION_JOB_NAME,
      NULLIF(TRIM(jt.RESOLUTION_SCRIPT_TEMPLATE), '') AS RESOLUTION_SCRIPT_TEMPLATE,
      NULLIF(TRIM(jt.RESOLUTION_SCRIPT_PARAM_MAP), '') AS RESOLUTION_SCRIPT_PARAM_MAP,
~') || q'~
      jt.RESOLUTION_SQL,
      jt.RESOLUTION_BATCH_SQL,
      NULLIF(TRIM(jt.RESOLUTION_BATCH_SCRIPT_TEMPLATE), '') AS RESOLUTION_BATCH_SCRIPT_TEMPLATE,
      NULLIF(TRIM(jt.FIXABLE_STATUS_COLUMN), '')      AS FIXABLE_STATUS_COLUMN,
      NULLIF(TRIM(jt.FIXABLE_STATUS_VALUE), '')       AS FIXABLE_STATUS_VALUE
    FROM REQUEST_QUERY_BODY rb,
         JSON_TABLE(rb.REQUESTBODY, '$.values[0]'
           COLUMNS (
             CHECK_ID                     VARCHAR2(36)   PATH '$."CHECK_ID"',
             CHECK_CODE                   VARCHAR2(50)   PATH '$."CHECK_CODE"',
             CHECK_NAME                   VARCHAR2(200)  PATH '$."CHECK_NAME"',
             CHECK_DESCRIPTION            VARCHAR2(500)  PATH '$."CHECK_DESCRIPTION"',
             QUERY_NUM                    VARCHAR2(20)   PATH '$."QUERY_NUM"',
             TIER                         VARCHAR2(20)   PATH '$."TIER"',
             SEVERITY                     VARCHAR2(20)   PATH '$."SEVERITY"',
             ENABLED                      NUMBER         PATH '$."ENABLED"',
             RETAILER_ID                  VARCHAR2(50)   PATH '$."RETAILER_ID"',
             SKILL_CODE                   VARCHAR2(100)  PATH '$."SKILL_CODE"',
             ENTITY_KEY                   VARCHAR2(100)  PATH '$."ENTITY_KEY"',
             DISPLAY_ORDER                NUMBER         PATH '$."DISPLAY_ORDER"',
             RESOLUTION_MODE              VARCHAR2(20)   PATH '$."RESOLUTION_MODE"',
             RESOLUTION_QUERY_NUM         VARCHAR2(20)   PATH '$."RESOLUTION_QUERY_NUM"',
             RESOLUTION_PARAM_MAP         VARCHAR2(500)  PATH '$."RESOLUTION_PARAM_MAP"',
             RESOLUTION_JOB_NAME          VARCHAR2(128)  PATH '$."RESOLUTION_JOB_NAME"',
             RESOLUTION_SCRIPT_TEMPLATE   VARCHAR2(500)  PATH '$."RESOLUTION_SCRIPT_TEMPLATE"',
             RESOLUTION_SCRIPT_PARAM_MAP  VARCHAR2(500)  PATH '$."RESOLUTION_SCRIPT_PARAM_MAP"',
             RESOLUTION_SQL               CLOB           PATH '$."RESOLUTION_SQL"',
             RESOLUTION_BATCH_SQL         CLOB           PATH '$."RESOLUTION_BATCH_SQL"',
             RESOLUTION_BATCH_SCRIPT_TEMPLATE VARCHAR2(500) PATH '$."RESOLUTION_BATCH_SCRIPT_TEMPLATE"',
             FIXABLE_STATUS_COLUMN        VARCHAR2(100)  PATH '$."FIXABLE_STATUS_COLUMN"',
             FIXABLE_STATUS_VALUE         VARCHAR2(200)  PATH '$."FIXABLE_STATUS_VALUE"'
           )
         ) jt
    WHERE rb.REQUESTID = v_req
  ) src
~' || q'~
  ON (
    (src.CHECK_ID IS NOT NULL AND tgt.CHECK_ID = src.CHECK_ID)
    OR (src.CHECK_ID IS NULL AND tgt.CHECK_CODE = src.CHECK_CODE AND tgt.RETAILER_ID = src.RETAILER_ID)
  )
  WHEN MATCHED THEN UPDATE SET
    tgt.CHECK_NAME                         = src.CHECK_NAME,
    tgt.CHECK_DESCRIPTION                  = src.CHECK_DESCRIPTION,
    tgt.QUERY_NUM                          = src.QUERY_NUM,
    tgt.TIER                               = src.TIER,
    tgt.SEVERITY                           = src.SEVERITY,
    tgt.ENABLED                            = src.ENABLED,
    tgt.SKILL_CODE                         = src.SKILL_CODE,
    tgt.ENTITY_KEY                         = src.ENTITY_KEY,
    tgt.DISPLAY_ORDER                      = src.DISPLAY_ORDER,
    tgt.RESOLUTION_MODE                    = src.RESOLUTION_MODE,
    tgt.RESOLUTION_QUERY_NUM               = src.RESOLUTION_QUERY_NUM,
    tgt.RESOLUTION_PARAM_MAP               = src.RESOLUTION_PARAM_MAP,
    tgt.RESOLUTION_JOB_NAME                = src.RESOLUTION_JOB_NAME,
    tgt.RESOLUTION_SCRIPT_TEMPLATE         = src.RESOLUTION_SCRIPT_TEMPLATE,
    tgt.RESOLUTION_SCRIPT_PARAM_MAP        = src.RESOLUTION_SCRIPT_PARAM_MAP,
    tgt.RESOLUTION_SQL                     = src.RESOLUTION_SQL,
    tgt.RESOLUTION_BATCH_SQL               = src.RESOLUTION_BATCH_SQL,
    tgt.RESOLUTION_BATCH_SCRIPT_TEMPLATE   = src.RESOLUTION_BATCH_SCRIPT_TEMPLATE,
    tgt.FIXABLE_STATUS_COLUMN              = src.FIXABLE_STATUS_COLUMN,
    tgt.FIXABLE_STATUS_VALUE               = src.FIXABLE_STATUS_VALUE,
    tgt.UPDATED_AT                         = SYSDATE
  WHEN NOT MATCHED THEN INSERT (
    CHECK_ID, CHECK_CODE, CHECK_NAME, CHECK_DESCRIPTION,
    QUERY_NUM, TIER, SEVERITY, ENABLED,
    RETAILER_ID, SKILL_CODE, ENTITY_KEY, DISPLAY_ORDER,
    RESOLUTION_MODE, RESOLUTION_QUERY_NUM, RESOLUTION_PARAM_MAP, RESOLUTION_JOB_NAME,
    RESOLUTION_SCRIPT_TEMPLATE, RESOLUTION_SCRIPT_PARAM_MAP,
    RESOLUTION_SQL, RESOLUTION_BATCH_SQL, RESOLUTION_BATCH_SCRIPT_TEMPLATE,
    FIXABLE_STATUS_COLUMN, FIXABLE_STATUS_VALUE,
    CREATED_AT, UPDATED_AT
  ) VALUES (
    NVL(src.CHECK_ID, SYS_GUID()),
    src.CHECK_CODE, src.CHECK_NAME, src.CHECK_DESCRIPTION,
    src.QUERY_NUM, src.TIER, src.SEVERITY, src.ENABLED,
    src.RETAILER_ID, src.SKILL_CODE, src.ENTITY_KEY, src.DISPLAY_ORDER,
    src.RESOLUTION_MODE, src.RESOLUTION_QUERY_NUM, src.RESOLUTION_PARAM_MAP, src.RESOLUTION_JOB_NAME,
    src.RESOLUTION_SCRIPT_TEMPLATE, src.RESOLUTION_SCRIPT_PARAM_MAP,
    src.RESOLUTION_SQL, src.RESOLUTION_BATCH_SQL, src.RESOLUTION_BATCH_SCRIPT_TEMPLATE,
    src.FIXABLE_STATUS_COLUMN, src.FIXABLE_STATUS_VALUE,
    SYSDATE, SYSDATE
  );

  IF SQL%ROWCOUNT = 0 THEN
    RAISE_APPLICATION_ERROR(-20090,
      'No row merged — verify CHECK_ID or CHECK_CODE + RETAILER_ID match an existing definition.');
  END IF;
END;
~',
       ':param1=REQUESTID (auto-bound by CALLQUERY)',
       '',
       1, 0, 1
  FROM dual;

COMMIT;
