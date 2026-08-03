-- =============================================================================
-- 96_data_health_resolution_sql_script_modes.sql
-- Data Health — SQL_SCRIPT (inline SQL then GOLD script) and SQL_SCRIPT_JOB
-- Deploy after: 51 (script columns), 52 (inline SQL + AI0000092). Re-runnable.
-- =============================================================================

BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE AI_DATA_CHECK_DEF DROP CONSTRAINT CK_AI_RESOLUTION_MODE';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE NOT IN (-2443) THEN RAISE; END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE q'[
        ALTER TABLE AI_DATA_CHECK_DEF ADD CONSTRAINT CK_AI_RESOLUTION_MODE
        CHECK (RESOLUTION_MODE IN (
          'NONE','LIBQUERY','JOB','LIBQUERY_JOB','SCRIPT','SCRIPT_JOB',
          'SQL','SQL_JOB','SQL_SCRIPT','SQL_SCRIPT_JOB'
        ))
    ]';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE NOT IN (-2264, -2275, -2261) THEN RAISE; END IF;
END;
/

COMMENT ON COLUMN AI_DATA_CHECK_DEF.RESOLUTION_SQL IS
  'Row-level UPDATE/MERGE for SQL / SQL_JOB / SQL_SCRIPT / SQL_SCRIPT_JOB. Use :bind tokens; map via RESOLUTION_PARAM_MAP.';

-- ── AI0000091 — allow SQL_SCRIPT_JOB ─────────────────────────────────────────
DELETE FROM LIBQUERY WHERE QUERYNUM = 'AI0000091';

INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000091',
       'S24 — run data health resolution job',
       'Runs RESOLUTION_JOB_NAME for JOB, LIBQUERY_JOB, SCRIPT_JOB, SQL_JOB, SQL_SCRIPT_JOB. Body: {values:[{CHECK_ID,RETAILER_ID}]}.',
       q'~
DECLARE
  v_check_id    VARCHAR2(36);
  v_retailer_id VARCHAR2(50);
  v_mode        VARCHAR2(20);
  v_job_name    VARCHAR2(128);
  v_enabled     NUMBER;
BEGIN
  SELECT jt.CHECK_ID, jt.RETAILER_ID
    INTO v_check_id, v_retailer_id
    FROM REQUEST_QUERY_BODY rb,
         JSON_TABLE(rb.REQUESTBODY, '$.values[0]'
           COLUMNS (
             CHECK_ID    VARCHAR2(36) PATH '$."CHECK_ID"',
             RETAILER_ID VARCHAR2(50) PATH '$."RETAILER_ID"'
           )
         ) jt
   WHERE rb.REQUESTID = :param1;

  SELECT RESOLUTION_MODE, RESOLUTION_JOB_NAME, ENABLED
    INTO v_mode, v_job_name, v_enabled
    FROM AI_DATA_CHECK_DEF
   WHERE CHECK_ID = v_check_id
     AND RETAILER_ID = v_retailer_id;

  IF NVL(v_enabled, 0) != 1 THEN
    RAISE_APPLICATION_ERROR(-20091, 'Data health check is disabled.');
  END IF;

  IF v_mode NOT IN ('JOB', 'LIBQUERY_JOB', 'SCRIPT_JOB', 'SQL_JOB', 'SQL_SCRIPT_JOB') THEN
    RAISE_APPLICATION_ERROR(-20092, 'Check is not configured for a resolution job (mode=' || NVL(v_mode, 'NULL') || ').');
  END IF;

  IF v_job_name IS NULL OR TRIM(v_job_name) IS NULL THEN
    RAISE_APPLICATION_ERROR(-20093, 'RESOLUTION_JOB_NAME is not set on this check.');
  END IF;

  DBMS_SCHEDULER.RUN_JOB(
    job_name            => TRIM(v_job_name),
    use_current_session => FALSE
  );
  COMMIT;
EXCEPTION
  WHEN OTHERS THEN
    ROLLBACK;
    RAISE;
END;
~',
       '',
       '',
       1, 0, 1
  FROM dual;

COMMIT;
