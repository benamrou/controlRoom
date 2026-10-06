-- =============================================================================
-- 119_mas_journal_file_payload.sql
-- Mass Journal — Data file / Error file download payload
-- QUERYNUM: MAS0000006  (QUERYTYPE 0 — stored SQL, not PKQUERYMANAGER)
-- Idempotent DELETE+INSERT — safe to re-run.
--
-- Why this exists:
--   MAS0000003 (GETQUERY_MAS0000003) already selects JSONCONTENT / JSONERROR, but it
--   UNION ALLs JSON_INBOUND and JSON_CHECK. Oracle + node-oracledb often return
--   those CLOB columns empty after a UNION, while JSONNBRECORD / JSONNBERROR still
--   populate. Journal Excel then has only the banner.
--
--   This query reads ONE table (no UNION) via scalar subquery, so the CLOB is
--   fetched as a string (sqlquery.js fetchAsString).
--
-- :param1 = JSONID
-- :param2 = JSONSTEP  ('EXECUTION' → JSON_INBOUND, 'CHECK' → JSON_CHECK)
--
-- Optional package patch (GETQUERY_MAS0000003) if you also want the list query
-- itself to return file payloads — convert CLOB to VARCHAR2 BEFORE the UNION:
--   DBMS_LOB.SUBSTR(JSONCONTENT, 32767, 1) JSONCONTENT
--   DBMS_LOB.SUBSTR(JSONERROR,   32767, 1) JSONERROR
-- instead of TO_CLOB(...) in both CONFIRMED_DATA and CHECK_DATA.
-- =============================================================================

SET DEFINE OFF;
SET SCAN OFF;

DELETE FROM LIBQUERY WHERE QUERYNUM = 'MAS0000006';

INSERT INTO LIBQUERY (
  QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT,
  QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'MAS0000006',
       'Mass journal file payload',
       'JSONCONTENT + JSONERROR for one journal row. :param1=jsonid :param2=jsonstep (EXECUTION|CHECK).',
       q'[
WITH p AS (
  SELECT TO_NUMBER(:param1) AS id,
         UPPER(NVL(:param2, 'EXECUTION')) AS step
    FROM dual
)
SELECT CASE
         WHEN p.step = 'CHECK'
           THEN (SELECT c.JSONCONTENT FROM JSON_CHECK c WHERE c.JSONID = p.id)
         ELSE (SELECT i.JSONCONTENT FROM JSON_INBOUND i WHERE i.JSONID = p.id)
       END AS JSONCONTENT,
       CASE
         WHEN p.step = 'CHECK'
           THEN (SELECT c.JSONERROR FROM JSON_CHECK c WHERE c.JSONID = p.id)
         ELSE (SELECT i.JSONERROR FROM JSON_INBOUND i WHERE i.JSONID = p.id)
       END AS JSONERROR
  FROM p
]',
       ':param1=jsonid :param2=jsonstep',
       'JSONCONTENT,JSONERROR',
       1, 0, 0
  FROM dual;

COMMIT;

SET DEFINE ON;
SET SCAN ON;

PROMPT 119_mas_journal_file_payload.sql complete — MAS0000006
/