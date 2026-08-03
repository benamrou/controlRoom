-- =============================================================================
-- 99_data_health_resolution_batch_fix.sql
-- Fix all (once): BATCH_FIX=1 on AI0000092 skips per-row binds — one SQL run for all issues.
-- Deploy after 98. Re-runnable (CREATE OR REPLACE only).
-- =============================================================================

CREATE OR REPLACE PROCEDURE AI_EXECUTE_CHECK_RESOLUTION_SQL (
    p_request_id IN NUMBER,
    p_dry_run    IN NUMBER DEFAULT 0
) AS
    v_body         CLOB;
    v_check_id     VARCHAR2(36);
    v_retailer_id  VARCHAR2(50);
    v_mode         VARCHAR2(20);
    v_sql          CLOB;
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
           d.RESOLUTION_PARAM_MAP,
           d.ENABLED
      INTO v_mode, v_sql, v_map, v_enabled
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

    IF v_sql IS NULL OR DBMS_LOB.GETLENGTH(v_sql) = 0 THEN
        RAISE_APPLICATION_ERROR(-20096, 'RESOLUTION_SQL is empty on this check.');
    END IF;

    IF NVL(v_batch, 0) != 1 THEN
        IF v_map IS NULL OR TRIM(v_map) IS NULL THEN
            RAISE_APPLICATION_ERROR(-20097, 'RESOLUTION_PARAM_MAP is required for inline SQL resolution.');
        END IF;
    END IF;

    v_sql_chk := UPPER(TRIM(DBMS_LOB.SUBSTR(v_sql, 4000, 1)));
    IF NOT (v_sql_chk LIKE 'UPDATE %' OR v_sql_chk LIKE 'MERGE %') THEN
        RAISE_APPLICATION_ERROR(-20098,
          'RESOLUTION_SQL must start with UPDATE or MERGE (case-insensitive).');
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

COMMIT;
