-- =============================================================================
-- 116_pkmasschange_new_item_ppg.sql
-- Tool 23 — New Item PPG mass load (direct ARTENTLIST + ARTDETLIST)
--
-- Incremental patch — merge into PKMASSCHANGE package SPEC + BODY.
-- Pair with 115_mass_new_item_ppg.sql (menu / PARAMETERS / labels).
--
-- Excel / JSON columns (3):
--   UPC, PPG_NAME, PPG_ID
--   UPC      — active ARTCOCA barcode → ARTUV (item + SV)
--   PPG_NAME — ARTENTLIST.ELILIBL
--   PPG_ID   — ARTENTLIST.ELINLIS / ARTDETLIST.DLINLIS (caller-supplied; not auto-allocated)
--
-- Check:
--   1. UPC / PPG_NAME / PPG_ID required
--   2. UPC maps to an active ARTCOCA → ARTUV row
--   3. PPG_ID must not already exist in ARTENTLIST
--   4. Item (ARVCEXR) is not already on an active PPG% list (ARTDETLIST/ARTENTLIST)
--
-- Execute:
--   INSERT ARTENTLIST@dblink once per distinct PPG_ID (header)
--   INSERT ARTDETLIST@dblink once per UPC (detail; DLICINV = ARVCEXR)
--   GET_NEXT_AVAILABLE_PPG kept in package but not called
--   No INTARTLIST / no psifa09p (package-only, like tool 21)
--
-- Template        : ICR_TEMPLATE022.xlsx
-- Angular route   : /newitemppg  (toolID=23, screen SCR0000000091)
-- GOLD batch      : none (direct DML)
--
-- Deploy steps:
--   1. Add SPEC declarations (block A below) to PACKAGE PKMASSCHANGE.
--   2. Add V_PT33_23_NEW_ITEM_PPG := 23; next to other V_PT33_* constants.
--   3. Add MAIN_CHECK / MAIN_EXECUTE / MAIN_COLLECTERROR IF blocks (block B).
--   4. Add GET_NEXT_AVAILABLE_PPG + NEWITEMPPG_* functions (block C) before END.
--   Or re-run updated 111_pkmasschange_ref_to_order.sql after merge.
-- =============================================================================

SET DEFINE OFF;

/*
-- =============================================================================
-- BLOCK A — PACKAGE SPEC additions (run as ALTER / recreate SPEC)
-- =============================================================================
  FUNCTION NEWITEMPPG_CHECK(IN_NUM_LOG    IN NUMBER,
                            IN_JSONID     IN NUMBER,
                            IN_USERID     IN VARCHAR2,
                            IN_DATABASEID IN VARCHAR2,
                            IN_PARAMETERS IN VARCHAR2,
                            IN_LANGUAGE   IN VARCHAR2) RETURN CLOB;
  FUNCTION NEWITEMPPG_EXECUTE(IN_NUM_LOG    IN NUMBER,
                              IN_JSONID     IN NUMBER,
                              IN_JSONFILE   IN VARCHAR2,
                              IN_STARTDATE  IN VARCHAR2,
                              IN_TRACE      IN VARCHAR2,
                              IN_USERID     IN VARCHAR2,
                              IN_DATABASEID IN VARCHAR2,
                              IN_PARAMETERS IN VARCHAR2,
                              IN_LANGUAGE   IN VARCHAR2) RETURN CLOB;
  FUNCTION NEWITEMPPG_COLLECTERROR(IN_NUM_LOG    IN NUMBER,
                                   IN_JSONID     IN NUMBER,
                                   IN_USERID     IN VARCHAR2,
                                   IN_JSONFILE   IN VARCHAR2,
                                   IN_DATABASEID IN VARCHAR2,
                                   IN_PARAMETERS IN VARCHAR2,
                                   IN_LANGUAGE   IN VARCHAR2) RETURN CLOB;
*/

/*
-- =============================================================================
-- BLOCK B — MAIN_* wiring (paste into package body)
-- =============================================================================
-- Constant (with other V_PT33_*):
  V_PT33_23_NEW_ITEM_PPG          NUMBER := 23;

-- MAIN_CHECK (after REFTOORDER):
      IF (v_jsontool = V_PT33_23_NEW_ITEM_PPG) THEN
        v_return := PKMASSCHANGE.NEWITEMPPG_CHECK(IN_NUM_LOG,
                                                  IN_JSONID,
                                                  IN_USERID,
                                                  IN_DATABASEID,
                                                  IN_PARAMETERS,
                                                  IN_LANGUAGE);
        RETURN v_return;
      END IF;

-- MAIN_EXECUTE (after REFTOORDER):
      IF (v_jsontool = V_PT33_23_NEW_ITEM_PPG) THEN
        v_return := PKMASSCHANGE.NEWITEMPPG_EXECUTE(IN_NUM_LOG,
                                                    IN_JSONID,
                                                    V_JSONFILE,
                                                    v_query_PARAM_ARRAY(3),
                                                    v_query_PARAM_ARRAY(4),
                                                    v_jsonuserid,
                                                    '{' || V_JSONSID || '}',
                                                    v_jsonparam,
                                                    '{' || V_JSONLANG || '}');
        RETURN v_return;
      END IF;

-- MAIN_COLLECTERROR (after REFTOORDER):
      IF (v_jsontool = V_PT33_23_NEW_ITEM_PPG) THEN
        v_return := PKMASSCHANGE.NEWITEMPPG_COLLECTERROR(IN_NUM_LOG,
                                                         IN_JSONID,
                                                         IN_USERID,
                                                         IN_JSONFILE,
                                                         IN_DATABASEID,
                                                         IN_PARAMETERS,
                                                         IN_LANGUAGE);
        RETURN v_return;
      END IF;
*/

-- =============================================================================
-- BLOCK C — Body functions (paste before END PKMASSCHANGE)
-- =============================================================================

  -- ****************************************************************************************
  -- Next available PPG code: PPG + 5-digit sequence (matches MDM Next PPG "Next sequence").
  -- Seeds from MAX(ARTENTLIST.ELINLIS) and pending INTARTLIST.ILANLIS (ILATRT in 0,2).
  -- Kept for reuse / diagnostics — NEWITEMPPG_EXECUTE does not call this.
  -- IO_SEQ: NULL on first call → seed; thereafter caller increments.
  -- ****************************************************************************************
  FUNCTION GET_NEXT_AVAILABLE_PPG(IN_DBLINK IN VARCHAR2,
                                  IO_SEQ    IN OUT NUMBER) RETURN VARCHAR2 IS
    V_MAX_ENT NUMBER;
    V_MAX_INT NUMBER;
    V_NEXT    NUMBER;
  BEGIN
    IF IO_SEQ IS NULL THEN
      BEGIN
        EXECUTE IMMEDIATE
          'SELECT NVL(MAX(TO_NUMBER(REGEXP_REPLACE(elinlis, ''[^0-9]'', ''''))), 0)
             FROM artentlist@' || IN_DBLINK || '
            WHERE elinlis LIKE ''PPG%''
              AND REGEXP_LIKE(elinlis, ''^PPG[0-9]+$'')'
          INTO V_MAX_ENT;
      EXCEPTION
        WHEN OTHERS THEN
          V_MAX_ENT := 0;
      END;
      BEGIN
        EXECUTE IMMEDIATE
          'SELECT NVL(MAX(TO_NUMBER(REGEXP_REPLACE(ilanlis, ''[^0-9]'', ''''))), 0)
             FROM intartlist@' || IN_DBLINK || '
            WHERE ilanlis LIKE ''PPG%''
              AND REGEXP_LIKE(ilanlis, ''^PPG[0-9]+$'')
              AND ilatrt IN (0, 2)'
          INTO V_MAX_INT;
      EXCEPTION
        WHEN OTHERS THEN
          V_MAX_INT := 0;
      END;
      IO_SEQ := GREATEST(NVL(V_MAX_ENT, 0), NVL(V_MAX_INT, 0));
    END IF;
    V_NEXT := NVL(IO_SEQ, 0) + 1;
    IO_SEQ := V_NEXT;
    RETURN 'PPG' || LPAD(TO_CHAR(V_NEXT), 5, '0');
  END GET_NEXT_AVAILABLE_PPG;

  -- ****************************************************************************************
  -- New Item PPG — check (tool 23)
  -- ****************************************************************************************
  FUNCTION NEWITEMPPG_CHECK(IN_NUM_LOG    IN NUMBER,
                            IN_JSONID     IN NUMBER,
                            IN_USERID     IN VARCHAR2,
                            IN_DATABASEID IN VARCHAR2,
                            IN_PARAMETERS IN VARCHAR2,
                            IN_LANGUAGE   IN VARCHAR2) RETURN CLOB IS
    PRAGMA AUTONOMOUS_TRANSACTION;
    V_PROGNAME    VARCHAR2(50);
    V_QUERYSQL    CLOB;
    V_QUERYUPDATE CLOB;
    V_OUT         CLOB;
    V_ERR         VARCHAR2(4000);

    V_QUERY_SID_ARRAY      PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_PARAM_ARRAY    PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_LANGUAGE_ARRAY PKREQUESTMANAGER.PARAM_ARRAY;
  BEGIN
    V_PROGNAME := 'NEWITEMPPG_CHECK';
    BEGIN
      V_QUERY_PARAM_ARRAY    := PKREQUESTMANAGER.STRINGTOARRAY(IN_PARAMETERS, ',');
      V_QUERY_SID_ARRAY      := PKREQUESTMANAGER.STRINGTOARRAY(IN_DATABASEID, ',');
      V_QUERY_LANGUAGE_ARRAY := PKREQUESTMANAGER.STRINGTOARRAY(IN_LANGUAGE, ',');

      V_QUERYSQL :=
        ' WITH ITEM_DATA AS ( ' ||
        '   SELECT TRIM(upc) upc, TRIM(ppg_name) ppg_name, TRIM(ppg_id) ppg_id ' ||
        '   FROM json_table((SELECT JSONCONTENT FROM JSON_CHECK WHERE JSONID= ' || IN_JSONID || '), ''$[*]'' ' ||
        '                   COLUMNS ( upc      PATH ''$.UPC'' ' ||
        '                           , ppg_name PATH ''$.PPG_NAME'' ' ||
        '                           , ppg_id   PATH ''$.PPG_ID'' ' ||
        '                           )) ), ' ||
        '   CHECK_RESULT AS ( ' ||
        '   SELECT upc, ppg_name, ppg_id, ' ||
        '     CASE ' ||
        '       WHEN NVL(LENGTH(upc), 0) = 0 THEN ''UPC is required'' ' ||
        '       WHEN NVL(LENGTH(ppg_name), 0) = 0 THEN ''PPG_NAME is required'' ' ||
        '       WHEN NVL(LENGTH(ppg_id), 0) = 0 THEN ''PPG_ID is required'' ' ||
        '       WHEN NOT EXISTS ( ' ||
        '            SELECT 1 FROM artcoca@' || V_QUERY_SID_ARRAY(1) || ' c ' ||
        '             WHERE REGEXP_REPLACE(upc, ''^0+'', '''') = REGEXP_REPLACE(c.arccode, ''^0+'', '''') ' ||
        '               AND TRUNC(SYSDATE) BETWEEN c.arcddeb AND c.arcdfin) ' ||
        '         THEN ''Unknown or inactive UPC'' ' ||
        '       WHEN EXISTS ( ' ||
        '            SELECT 1 FROM artentlist@' || V_QUERY_SID_ARRAY(1) || ' e ' ||
        '             WHERE e.elinlis = ppg_id) ' ||
        '         THEN ''PPG_ID already exists'' ' ||
        '       WHEN EXISTS ( ' ||
        '            SELECT 1 ' ||
        '              FROM artcoca@' || V_QUERY_SID_ARRAY(1) || ' c, ' ||
        '                   artuv@' || V_QUERY_SID_ARRAY(1) || ' u, ' ||
        '                   artdetlist@' || V_QUERY_SID_ARRAY(1) || ' d, ' ||
        '                   artentlist@' || V_QUERY_SID_ARRAY(1) || ' e ' ||
        '             WHERE REGEXP_REPLACE(upc, ''^0+'', '''') = REGEXP_REPLACE(c.arccode, ''^0+'', '''') ' ||
        '               AND TRUNC(SYSDATE) BETWEEN c.arcddeb AND c.arcdfin ' ||
        '               AND c.arccinv = u.arvcinv ' ||
        '               AND d.dlicinv = u.arvcexr ' ||
        '               AND d.dlinlis = e.elinlis ' ||
        '               AND e.elinlis LIKE ''PPG%'' ' ||
        '               AND TRUNC(SYSDATE) <= NVL(d.dlidfin, TO_DATE(''12/31/49'',''MM/DD/RR'')) ' ||
        '               AND TRUNC(SYSDATE) >= NVL(d.dliddeb, TRUNC(SYSDATE))) ' ||
        '         THEN ''Item already on an active PPG list'' ' ||
        '       ELSE '''' ' ||
        '     END AS COMMENTS ' ||
        '   FROM ITEM_DATA )';

      V_QUERYUPDATE :=
        'MERGE INTO json_check ' ||
        ' USING ( ' || V_QUERYSQL ||
        ' SELECT (SELECT listagg_clob (json_object(''UPC'' VALUE upc FORMAT JSON, ' ||
        '                      ''PPG_NAME'' VALUE ppg_name FORMAT JSON, ' ||
        '                      ''PPG_ID'' VALUE ppg_id FORMAT JSON, ' ||
        '                      ''COMMENTS'' VALUE comments FORMAT JSON)) ' ||
        ' FROM CHECK_RESULT E) FINAL_JSON, ' ||
        ' (SELECT COUNT(1) FROM CHECK_RESULT T WHERE LENGTH(T.COMMENTS) > 0) FINAL_NBERROR, ' ||
        ' (SELECT COUNT(1) FROM CHECK_RESULT T ) FINAL_NBRECORD ' ||
        ' FROM DUAL) ' ||
        ' ON (JSONID= ' || IN_JSONID || ')' ||
        ' WHEN MATCHED THEN ' ||
        ' UPDATE SET JSONERROR= ''['' || FINAL_JSON || '']'', ' ||
        '            JSONNBERROR= FINAL_NBERROR, ' ||
        '            JSONNBRECORD= FINAL_NBRECORD, ' ||
        '            JSONUTIL=''' || IN_USERID || ''',' ||
        '            JSONDMAJ=SYSDATE, ' ||
        '            JSONSTATUS=1 ';

      BEGIN
        EXECUTE IMMEDIATE V_QUERYUPDATE;
        COMMIT;
      EXCEPTION
        WHEN OTHERS THEN
          V_ERR := SQLERRM;
          DBMS_OUTPUT.PUT_LINE('NEWITEMPPG_CHECK MERGE ERROR ' || SQLCODE || ' : ' || V_ERR);
          V_OUT := TO_CLOB(
            'SELECT NULL UPC, NULL PPG_NAME, NULL PPG_ID, ''' ||
            REPLACE(V_ERR, '''', '''''') || ''' COMMENTS FROM DUAL');
          ROLLBACK;
          RETURN V_OUT;
      END;

      V_QUERYSQL := V_QUERYSQL || ' SELECT * FROM CHECK_RESULT';
      COMMIT;
      RETURN V_QUERYSQL;
    EXCEPTION
      WHEN OTHERS THEN
        V_ERR := SQLERRM;
        V_OUT := TO_CLOB(
          'SELECT NULL UPC, NULL PPG_NAME, NULL PPG_ID, ''' ||
          REPLACE(V_ERR, '''', '''''') || ''' COMMENTS FROM DUAL');
        ROLLBACK;
        RETURN V_OUT;
    END;
  END NEWITEMPPG_CHECK;

  -- ****************************************************************************************
  -- New Item PPG — execute (tool 23) → direct ARTENTLIST + ARTDETLIST@dblink
  -- One header insert per distinct PPG_ID; one detail insert per UPC row.
  -- GET_NEXT_AVAILABLE_PPG is not called. No INTARTLIST / psifa09p.
  -- ****************************************************************************************
  FUNCTION NEWITEMPPG_EXECUTE(IN_NUM_LOG    IN NUMBER,
                              IN_JSONID     IN NUMBER,
                              IN_JSONFILE   IN VARCHAR2,
                              IN_STARTDATE  IN VARCHAR2,
                              IN_TRACE      IN VARCHAR2,
                              IN_USERID     IN VARCHAR2,
                              IN_DATABASEID IN VARCHAR2,
                              IN_PARAMETERS IN VARCHAR2,
                              IN_LANGUAGE   IN VARCHAR2) RETURN CLOB IS
    PRAGMA AUTONOMOUS_TRANSACTION;
    V_PROGNAME VARCHAR2(50);
    V_QUERYSQL CLOB;
    V_QUERYUPDATE CLOB;
    V_USERID   VARCHAR2(12);
    V_DBLINK   VARCHAR2(128);
    V_PPG      VARCHAR2(13);
    V_ITEM     VARCHAR2(13);
    V_DESC     VARCHAR2(50);

    V_QUERY_SID_ARRAY      PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_PARAM_ARRAY    PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_LANGUAGE_ARRAY PKREQUESTMANAGER.PARAM_ARRAY;

    TYPE t_ppg_seen IS TABLE OF PLS_INTEGER INDEX BY VARCHAR2(13);
    l_ppg_hdr t_ppg_seen;

    CURSOR cur IS
      SELECT TRIM(jt.UPC) UPC,
             TRIM(jt.PPG_NAME) PPG_NAME,
             TRIM(jt.PPG_ID) PPG_ID,
             SUBSTR(JSONUSERID, 1, 12 - LENGTH(IN_JSONID)) || IN_JSONID AS ROWUTIL,
             ROWNUM LINENO
        FROM JSON_INBOUND D,
             JSON_TABLE((SELECT JSONCONTENT
                          FROM JSON_INBOUND C
                         WHERE C.JSONFILE = D.JSONFILE
                           AND C.JSONID = D.JSONID),
                        '$[*]' COLUMNS(UPC PATH '$.UPC',
                                PPG_NAME PATH '$.PPG_NAME',
                                PPG_ID PATH '$.PPG_ID'))
       WHERE JSONSTATUS = 0
         AND JSONTOOL = 23
         AND JSONID = IN_JSONID
       ORDER BY PPG_ID, ROWNUM;

    TYPE interface_data_type IS TABLE OF cur%ROWTYPE;
    data_tab interface_data_type;

  BEGIN
    V_PROGNAME := 'NEWITEMPPG_EXECUTE';
    BEGIN
      V_QUERY_PARAM_ARRAY    := PKREQUESTMANAGER.STRINGTOARRAY(IN_PARAMETERS, ',');
      V_QUERY_SID_ARRAY      := PKREQUESTMANAGER.STRINGTOARRAY(IN_DATABASEID, ',');
      V_QUERY_LANGUAGE_ARRAY := PKREQUESTMANAGER.STRINGTOARRAY(IN_LANGUAGE, ',');
      V_DBLINK := V_QUERY_SID_ARRAY(1);

      OPEN cur;
      FETCH cur BULK COLLECT INTO data_tab;
      CLOSE cur;

      FOR i IN 1 .. data_tab.COUNT LOOP
        V_USERID := data_tab(i).ROWUTIL;
        V_PPG    := SUBSTR(data_tab(i).PPG_ID, 1, 13);
        V_DESC   := SUBSTR(NVL(data_tab(i).PPG_NAME, V_PPG), 1, 50);

        BEGIN
          EXECUTE IMMEDIATE
            'SELECT u.arvcexr
               FROM artcoca@' || V_DBLINK || ' c,
                    artuv@' || V_DBLINK || ' u
              WHERE REGEXP_REPLACE(:b1, ''^0+'', '''') = REGEXP_REPLACE(c.arccode, ''^0+'', '''')
                AND TRUNC(SYSDATE) BETWEEN c.arcddeb AND c.arcdfin
                AND c.arccinv = u.arvcinv
                AND ROWNUM = 1'
            INTO V_ITEM
            USING data_tab(i).UPC;
        EXCEPTION
          WHEN NO_DATA_FOUND THEN
            RETURN 'ERROR: Unknown UPC ' || data_tab(i).UPC;
          WHEN OTHERS THEN
            RETURN 'ERROR ' || SQLCODE || ' : ' || SQLERRM;
        END;

        /* Header once per PPG_ID */
        IF NOT l_ppg_hdr.EXISTS(V_PPG) THEN
          V_QUERYUPDATE :=
            'INSERT INTO artentlist@' || V_DBLINK || ' (' ||
            ' elinlis, elilibl, eliutil, elidcre, elidmaj, eliddeb, elidfin, ' ||
            ' eliusage, eliauto, elinmod, elitrace, eliprofile, ' ||
            ' eliattr, elinass, elitlst, elispst) ' ||
            'VALUES (' ||
            '''' || REPLACE(V_PPG, '''', '''''') || ''', ' ||
            '''' || REPLACE(V_DESC, '''', '''''') || ''', ' ||
            '''' || REPLACE(V_USERID, '''', '''''') || ''', ' ||
            'SYSDATE, SYSDATE, TRUNC(SYSDATE), TO_DATE(''12/31/49'',''MM/DD/RR''), ' ||
            '6, 0, 0, 0, 0, ' ||
            '0, 0, 0, 0)';
          BEGIN
            EXECUTE IMMEDIATE V_QUERYUPDATE;
            COMMIT;
            l_ppg_hdr(V_PPG) := 1;
          EXCEPTION
            WHEN OTHERS THEN
              DBMS_OUTPUT.PUT_LINE('NEWITEMPPG_EXECUTE ARTENTLIST ERROR: ' || V_QUERYUPDATE);
              RETURN 'ERROR ' || SQLCODE || ' : ' || SQLERRM;
          END;
        END IF;

        /* Detail — one row per UPC */
        V_QUERYUPDATE :=
          'INSERT INTO artdetlist@' || V_DBLINK || ' (' ||
          ' dlinlis, dlidcre, dlidmaj, dliddeb, dlidfin, dlicinv, dliutil, ' ||
          ' dliorig, dlidefart, dlitrt, dlinmod) ' ||
          'VALUES (' ||
          '''' || REPLACE(V_PPG, '''', '''''') || ''', ' ||
          'SYSDATE, SYSDATE, TRUNC(SYSDATE), TO_DATE(''12/31/49'',''MM/DD/RR''), ' ||
          '''' || REPLACE(V_ITEM, '''', '''''') || ''', ' ||
          '''' || REPLACE(V_USERID, '''', '''''') || ''', ' ||
          '1, 1, 0, 0)';
        BEGIN
          EXECUTE IMMEDIATE V_QUERYUPDATE;
          COMMIT;
        EXCEPTION
          WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('NEWITEMPPG_EXECUTE ARTDETLIST ERROR: ' || V_QUERYUPDATE);
            RETURN 'ERROR ' || SQLCODE || ' : ' || SQLERRM;
        END;
      END LOOP;

      BEGIN
        UPDATE JSON_INBOUND
           SET JSONSTATUS   = 1,
               JSONDPROCESS = SYSDATE,
               JSONDMAJ     = SYSDATE,
               JSONUTIL     = IN_USERID
         WHERE JSONID = IN_JSONID;
        COMMIT;
      EXCEPTION
        WHEN OTHERS THEN
          RETURN 'ERROR ' || SQLCODE || ' : ' || SQLERRM;
      END;

      V_QUERYSQL := ' SELECT ''' || V_USERID || ''' RESULT FROM DUAL';
      RETURN V_QUERYSQL;
    END;
  END NEWITEMPPG_EXECUTE;

  -- ****************************************************************************************
  -- New Item PPG — collect errors: file rows missing ARTENTLIST / ARTDETLIST after load
  -- ****************************************************************************************
  FUNCTION NEWITEMPPG_COLLECTERROR(IN_NUM_LOG    IN NUMBER,
                                   IN_JSONID     IN NUMBER,
                                   IN_USERID     IN VARCHAR2,
                                   IN_JSONFILE   IN VARCHAR2,
                                   IN_DATABASEID IN VARCHAR2,
                                   IN_PARAMETERS IN VARCHAR2,
                                   IN_LANGUAGE   IN VARCHAR2) RETURN CLOB IS
    PRAGMA AUTONOMOUS_TRANSACTION;
    V_PROGNAME    VARCHAR2(50);
    V_QUERYSQL    CLOB;
    V_QUERYUPDATE CLOB;

    V_QUERY_SID_ARRAY      PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_PARAM_ARRAY    PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_LANGUAGE_ARRAY PKREQUESTMANAGER.PARAM_ARRAY;
  BEGIN
    V_PROGNAME := 'NEWITEMPPG_COLLECTERROR';
    BEGIN
      V_QUERY_PARAM_ARRAY    := PKREQUESTMANAGER.STRINGTOARRAY(IN_PARAMETERS, ',');
      V_QUERY_SID_ARRAY      := PKREQUESTMANAGER.STRINGTOARRAY(IN_DATABASEID, ',');
      V_QUERY_LANGUAGE_ARRAY := PKREQUESTMANAGER.STRINGTOARRAY(IN_LANGUAGE, ',');

      V_QUERYSQL :=
        ' WITH FILE_ROWS AS ( ' ||
        '   SELECT TRIM(jt.upc) upc, TRIM(jt.ppg_name) ppg_name, TRIM(jt.ppg_id) ppg_id ' ||
        '   FROM JSON_INBOUND ji, ' ||
        '        JSON_TABLE(ji.JSONCONTENT, ''$[*]'' ' ||
        '          COLUMNS ( upc PATH ''$.UPC'', ppg_name PATH ''$.PPG_NAME'', ' ||
        '                    ppg_id PATH ''$.PPG_ID'')) jt ' ||
        '   WHERE ji.JSONID = ' || IN_JSONID ||
        ' ), ' ||
        ' CHECK_RESULT AS ( ' ||
        '   SELECT f.upc UPC, f.ppg_name PPG_NAME, f.ppg_id PPG_ID, ' ||
        '     CASE ' ||
        '       WHEN NOT EXISTS ( ' ||
        '            SELECT 1 FROM artentlist@' || V_QUERY_SID_ARRAY(1) || ' e ' ||
        '             WHERE e.elinlis = f.ppg_id) ' ||
        '         THEN ''PPG header missing after load'' ' ||
        '       WHEN NOT EXISTS ( ' ||
        '            SELECT 1 ' ||
        '              FROM artcoca@' || V_QUERY_SID_ARRAY(1) || ' c, ' ||
        '                   artuv@' || V_QUERY_SID_ARRAY(1) || ' u, ' ||
        '                   artdetlist@' || V_QUERY_SID_ARRAY(1) || ' d ' ||
        '             WHERE REGEXP_REPLACE(f.upc, ''^0+'', '''') = REGEXP_REPLACE(c.arccode, ''^0+'', '''') ' ||
        '               AND TRUNC(SYSDATE) BETWEEN c.arcddeb AND c.arcdfin ' ||
        '               AND c.arccinv = u.arvcinv ' ||
        '               AND d.dlinlis = f.ppg_id ' ||
        '               AND d.dlicinv = u.arvcexr ' ||
        '               AND TRUNC(SYSDATE) <= NVL(d.dlidfin, TO_DATE(''12/31/49'',''MM/DD/RR'')) ' ||
        '               AND TRUNC(SYSDATE) >= NVL(d.dliddeb, TRUNC(SYSDATE))) ' ||
        '         THEN ''PPG detail missing after load'' ' ||
        '       ELSE '''' ' ||
        '     END AS COMMENTS ' ||
        '   FROM FILE_ROWS f ' ||
        '   WHERE NOT EXISTS ( ' ||
        '            SELECT 1 FROM artentlist@' || V_QUERY_SID_ARRAY(1) || ' e ' ||
        '             WHERE e.elinlis = f.ppg_id) ' ||
        '      OR NOT EXISTS ( ' ||
        '            SELECT 1 ' ||
        '              FROM artcoca@' || V_QUERY_SID_ARRAY(1) || ' c, ' ||
        '                   artuv@' || V_QUERY_SID_ARRAY(1) || ' u, ' ||
        '                   artdetlist@' || V_QUERY_SID_ARRAY(1) || ' d ' ||
        '             WHERE REGEXP_REPLACE(f.upc, ''^0+'', '''') = REGEXP_REPLACE(c.arccode, ''^0+'', '''') ' ||
        '               AND TRUNC(SYSDATE) BETWEEN c.arcddeb AND c.arcdfin ' ||
        '               AND c.arccinv = u.arvcinv ' ||
        '               AND d.dlinlis = f.ppg_id ' ||
        '               AND d.dlicinv = u.arvcexr ' ||
        '               AND TRUNC(SYSDATE) <= NVL(d.dlidfin, TO_DATE(''12/31/49'',''MM/DD/RR'')) ' ||
        '               AND TRUNC(SYSDATE) >= NVL(d.dliddeb, TRUNC(SYSDATE))) ' ||
        '   )';

      V_QUERYUPDATE :=
        'MERGE INTO json_inbound ' ||
        ' USING ( ' || V_QUERYSQL ||
        ' SELECT (SELECT listagg_clob (json_object(''UPC'' VALUE upc FORMAT JSON, ' ||
        '                      ''PPG_NAME'' VALUE ppg_name FORMAT JSON, ' ||
        '                      ''PPG_ID'' VALUE ppg_id FORMAT JSON, ' ||
        '                      ''COMMENTS'' VALUE comments FORMAT JSON)) ' ||
        ' FROM CHECK_RESULT E) FINAL_JSON, ' ||
        ' (SELECT COUNT(1) FROM CHECK_RESULT T) FINAL_NBERROR ' ||
        ' FROM DUAL) ' ||
        ' ON (JSONID= ' || IN_JSONID || ')' ||
        ' WHEN MATCHED THEN ' ||
        ' UPDATE SET JSONERROR= NVL2(FINAL_JSON, ''['' || FINAL_JSON || '']'', ''[]''), ' ||
        '            JSONNBERROR= NVL(FINAL_NBERROR, 0), ' ||
        '            JSONUTIL=''' || IN_USERID || ''',' ||
        '            JSONNBRECORD=(SELECT REGEXP_COUNT(JSONCONTENT,''UPC'') FROM JSON_INBOUND WHERE JSONID=' ||
        IN_JSONID || '), ' ||
        '            JSONDMAJ=SYSDATE ';

      BEGIN
        EXECUTE IMMEDIATE V_QUERYUPDATE;
        COMMIT;
      EXCEPTION
        WHEN OTHERS THEN
          DBMS_OUTPUT.PUT_LINE('NEWITEMPPG_COLLECTERROR ERROR ' || SQLCODE || ' : ' || SQLERRM);
          RETURN TO_CLOB(-2);
      END;

      V_QUERYSQL := V_QUERYSQL || ' SELECT * FROM CHECK_RESULT';
      RETURN V_QUERYSQL;
    END;
  END NEWITEMPPG_COLLECTERROR;


-- End of Block C — after pasting, package body must close with: END PKMASSCHANGE;
