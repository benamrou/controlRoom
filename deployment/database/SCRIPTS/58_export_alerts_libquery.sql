-- =============================================================================
-- Export Alerts management LIBQUERY rows from ICR app DB to a SQL file.
--
-- Target QUERYNUMs (Alerts management + related reads):
--   ALT0000001  GET  search alerts          (/api/alerts/1/)
--   ALT0000002  GET  distribution          (/api/alerts/2/)
--   ALT0000003  GET  schedules             (/api/alerts/3/)
--   ALT0000010  POST MERGE ALERTS
--   ALT0000012  POST delete alert
--   ALT0000020  POST MERGE ALERTDIST
--   ALT0000022  POST delete distribution
--   ALT0000030  POST MERGE ALERTSCHEDULE
--   ALT0000032  POST delete schedule
--
-- How to run (SQL*Plus or SQL Developer as script):
--   1. Connect to ICR app DB schema that owns LIBQUERY.
--   2. Edit SPOOL path below if needed (default: libquery_exports/alerts_libquery_export.sql
--      relative to your client working directory).
--   3. Execute this entire script (F5 in SQL Developer, or @58_export_alerts_libquery.sql).
--   4. Turn off SPOOL when done (included at end).
--
-- Output: idempotent DELETE + INSERT bundle (same pattern as 35_menu_access_libquery.sql).
-- =============================================================================

SET DEFINE OFF;
SET ECHO OFF;
SET FEEDBACK OFF;
SET HEADING OFF;
SET PAGESIZE 0;
SET LINESIZE 32767;
SET LONG 1000000;
SET LONGCHUNKSIZE 1000000;
SET TRIMSPOOL ON;
SET SERVEROUTPUT ON SIZE UNLIMITED FORMAT WRAPPED;

-- Change path as needed (SQL*Plus/SQL Developer SPOOL is relative to client CWD)
SPOOL alerts_libquery_export.sql

PROMPT -- =============================================================================
PROMPT -- Alerts LIBQUERY export
PROMPT -- Generated:
SELECT '-- Generated: ' || TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS') || ' from ' || SYS_CONTEXT('USERENV', 'DB_NAME') FROM dual;
PROMPT -- Source: LIBQUERY (ICR app DB)
PROMPT -- =============================================================================
PROMPT
PROMPT SET DEFINE OFF;
PROMPT

DECLARE
  TYPE t_querynums IS TABLE OF VARCHAR2(20);
  v_nums t_querynums := t_querynums(
    'ALT0000001', 'ALT0000002', 'ALT0000003',
    'ALT0000010', 'ALT0000012',
    'ALT0000020', 'ALT0000022',
    'ALT0000030', 'ALT0000032'
  );

  CURSOR c_export(p_num VARCHAR2) IS
    SELECT QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL,
           QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
      FROM LIBQUERY
     WHERE QUERYNUM = p_num;

  v_delim        VARCHAR2(5);
  v_sql_clob     CLOB;
  v_chunk        VARCHAR2(32767);
  v_offset       INTEGER;
  v_chunk_len    INTEGER := 32000;
  v_len          INTEGER;

  FUNCTION esc_sq(p_val VARCHAR2) RETURN VARCHAR2 IS
  BEGIN
    IF p_val IS NULL THEN
      RETURN NULL;
    END IF;
    RETURN REPLACE(p_val, '''', '''''');
  END esc_sq;

  FUNCTION pick_q_delim(p_clob CLOB) RETURN VARCHAR2 IS
    TYPE t_delims IS TABLE OF VARCHAR2(1);
    v_delims t_delims := t_delims('~', '!', '$', '@', '#', '%', '^');
  BEGIN
    IF p_clob IS NULL THEN
      RETURN '~';
    END IF;
    FOR i IN 1 .. v_delims.COUNT LOOP
      IF DBMS_LOB.INSTR(p_clob, ']' || v_delims(i)) = 0 THEN
        RETURN v_delims(i);
      END IF;
    END LOOP;
    RETURN CHR(1);
  END pick_q_delim;

  PROCEDURE put_line(p_line VARCHAR2) IS
  BEGIN
    DBMS_OUTPUT.PUT_LINE(p_line);
  END put_line;

  PROCEDURE put_clob_lines(p_prefix VARCHAR2, p_clob CLOB, p_delim VARCHAR2) IS
    v_pos INTEGER := 1;
    v_n   INTEGER;
  BEGIN
    IF p_clob IS NULL THEN
      put_line(p_prefix || 'NULL');
      RETURN;
    END IF;
    v_len := DBMS_LOB.GETLENGTH(p_clob);
    WHILE v_pos <= v_len LOOP
      v_n := LEAST(v_chunk_len, v_len - v_pos + 1);
      v_chunk := DBMS_LOB.SUBSTR(p_clob, v_n, v_pos);
      put_line(p_prefix || v_chunk);
      v_pos := v_pos + v_n;
    END LOOP;
  END put_clob_lines;

  PROCEDURE export_row(p_num VARCHAR2) IS
    v_found BOOLEAN := FALSE;
    r c_export%ROWTYPE;
  BEGIN
    OPEN c_export(p_num);
    FETCH c_export INTO r;
    v_found := c_export%FOUND;
    CLOSE c_export;

    IF NOT v_found THEN
      put_line('-- *** MISSING IN LIBQUERY: ' || p_num || ' ***');
      put_line('');
      RETURN;
    END IF;

    put_line('-- ' || r.QUERYNUM || ' | ' || r.QUERYTITLE || ' | QUERYID=' || r.QUERYID ||
             ' | TYPE=' || r.QUERYTYPE || ' | UPDATE=' || r.QUERYUPDATE);
    put_line('DELETE FROM LIBQUERY WHERE QUERYNUM = ''' || esc_sq(r.QUERYNUM) || ''';');
    put_line('');
    put_line('INSERT INTO LIBQUERY (');
    put_line('  QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL,');
    put_line('  QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE');
    put_line(')');
    put_line('SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),');

    put_line('       ''' || esc_sq(r.QUERYNUM) || ''',');
    put_line('       ''' || esc_sq(r.QUERYTITLE) || ''',');
    put_line('       ''' || esc_sq(r.QUERYDESC) || ''',');

    v_delim := pick_q_delim(r.QUERYSQL);
    put_line('       q''' || v_delim);
    put_clob_lines('', r.QUERYSQL, v_delim);
    put_line(v_delim || ''',');

    put_line('       ''' || esc_sq(r.QUERYPARAM) || ''',');
    put_line('       ''' || esc_sq(r.QUERYRESULT) || ''',');
    put_line('       ' || NVL(TO_CHAR(r.QUERYACCESS), 'NULL') || ',');
    put_line('       ' || NVL(TO_CHAR(r.QUERYTYPE), 'NULL') || ',');
    put_line('       ' || NVL(TO_CHAR(r.QUERYUPDATE), 'NULL'));
    put_line('  FROM dual;');
    put_line('');
  END export_row;

BEGIN
  put_line('DELETE FROM LIBQUERY WHERE QUERYNUM IN (');
  put_line('  ''ALT0000001'', ''ALT0000002'', ''ALT0000003'',');
  put_line('  ''ALT0000010'', ''ALT0000012'',');
  put_line('  ''ALT0000020'', ''ALT0000022'',');
  put_line('  ''ALT0000030'', ''ALT0000032''');
  put_line(');');
  put_line('');

  FOR i IN 1 .. v_nums.COUNT LOOP
    export_row(v_nums(i));
  END LOOP;

  put_line('COMMIT;');
  put_line('');
  put_line('SET DEFINE ON;');
END;
/

PROMPT
PROMPT -- =============================================================================
PROMPT -- Row count check (should be 9 rows):
SELECT '-- Found ' || COUNT(*) || ' / 9 expected rows'
  FROM LIBQUERY
 WHERE QUERYNUM IN (
       'ALT0000001', 'ALT0000002', 'ALT0000003',
       'ALT0000010', 'ALT0000012',
       'ALT0000020', 'ALT0000022',
       'ALT0000030', 'ALT0000032'
       );
PROMPT -- =============================================================================

SPOOL OFF
SET FEEDBACK ON;
SET HEADING ON;

PROMPT
PROMPT Done. Open libquery_exports/alerts_libquery_export.sql (relative to SQL client CWD).
PROMPT If SPOOL path is wrong, search for alerts_libquery_export.sql or re-run with absolute SPOOL path.
