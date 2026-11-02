-- =============================================================================
-- 125_pkmasschange_load_return_excel.sql
-- Tool 24 — Load for return: Excel carries COMPENSATION / PHYSICAL / REASON
--
-- Replaces LOADRETURN_CHECK / LOADRETURN_EXECUTE / LOADRETURN_COLLECTERROR
-- in PKMASSCHANGE body (also mirrored in 111 + 122).
--
-- ORA-06561 fix: CALLQUERY runs the function return via DBMS_SQL.PARSE, which
-- only accepts statements starting with SELECT/INSERT/UPDATE/DELETE/….
--   - CHECK/COLLECTERROR return SELECT * FROM ( WITH … ) — never bare WITH
--   - EXECUTE/COLLECTERROR never return 'ERROR …' or -2
--   - MERGE stays on EXECUTE IMMEDIATE (DBMS_SQL does not support MERGE)
--
-- Excel / JSON columns (8):
--   SITE, VENDOR_CODE, ITEM_CODE, LV, QTY, COMPENSATION, PHYSICAL, REASON
--
-- Mapping → INTDETRET:
--   COMPENSATION → IRFTMODE
--   PHYSICAL     → IRFRPHY
--   REASON       → IRFMOTI
-- Package constants (not in Excel):
--   IRFTYPE = 1, IRFDEVI = 840, IRFCONS = 0
--
-- No longer reads ICR_MASSLOAD_RULE — see 126_drop_icr_massload_rule.sql
-- Template: ICR_TEMPLATE023.xlsx
-- =============================================================================

SET DEFINE OFF;

/*
-- Paste these three functions into PKMASSCHANGE package body (replace existing
-- LOADRETURN_CHECK / LOADRETURN_EXECUTE / LOADRETURN_COLLECTERROR).

  -- ****************************************************************************************
  -- Load for return (tool 24) — check
  -- ****************************************************************************************
  FUNCTION LOADRETURN_CHECK(IN_NUM_LOG    IN NUMBER,
                            IN_JSONID     IN NUMBER,
                            IN_USERID     IN VARCHAR2,
                            IN_DATABASEID IN VARCHAR2,
                            IN_PARAMETERS IN VARCHAR2,
                            IN_LANGUAGE   IN VARCHAR2) RETURN CLOB IS
    PRAGMA AUTONOMOUS_TRANSACTION;
    V_PROGNAME    VARCHAR2(50);
    V_QUERYSQL    CLOB;
    V_QUERYUPDATE CLOB;
    V_ERR         VARCHAR2(4000);
    V_OUT         CLOB;

    V_QUERY_SID_ARRAY      PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_PARAM_ARRAY    PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_LANGUAGE_ARRAY PKREQUESTMANAGER.PARAM_ARRAY;
  BEGIN
    V_PROGNAME := 'LOADRETURN_CHECK';
    BEGIN
      V_QUERY_PARAM_ARRAY    := PKREQUESTMANAGER.STRINGTOARRAY(IN_PARAMETERS, ',');
      V_QUERY_SID_ARRAY      := PKREQUESTMANAGER.STRINGTOARRAY(IN_DATABASEID, ',');
      V_QUERY_LANGUAGE_ARRAY := PKREQUESTMANAGER.STRINGTOARRAY(IN_LANGUAGE, ',');

      V_QUERYSQL :=
        ' WITH ITEM_DATA AS ( ' ||
        '   SELECT TRIM(site) SITE, ' ||
        '          TRIM(vendor_code) VENDOR_CODE, ' ||
        '          TRIM(item_code) ITEM_CODE, ' ||
        '          TRIM(lv) LV, ' ||
        '          TRIM(qty) QTY, ' ||
        '          TRIM(compensation) COMPENSATION, ' ||
        '          TRIM(physical) PHYSICAL, ' ||
        '          TRIM(reason) REASON ' ||
        '   FROM json_table((SELECT JSONCONTENT FROM JSON_CHECK WHERE JSONID=TO_NUMBER(''' ||
        TO_CHAR(IN_JSONID) || ''')), ''$[*]'' ' ||
        '                   COLUMNS ( site         VARCHAR2(40)   PATH ''$.SITE'' ' ||
        '                           , vendor_code  VARCHAR2(40)   PATH ''$.VENDOR_CODE'' ' ||
        '                           , item_code    VARCHAR2(40)   PATH ''$.ITEM_CODE'' ' ||
        '                           , lv           VARCHAR2(20)   PATH ''$.LV'' ' ||
        '                           , qty          VARCHAR2(40)   PATH ''$.QTY'' ' ||
        '                           , compensation VARCHAR2(40)   PATH ''$.COMPENSATION'' ' ||
        '                           , physical     VARCHAR2(40)   PATH ''$.PHYSICAL'' ' ||
        '                           , reason       VARCHAR2(40)   PATH ''$.REASON'' ' ||
        '                           )) jt ' ||
        '   WHERE NVL(LENGTH(TRIM(jt.site)), 0) ' ||
        '       + NVL(LENGTH(TRIM(jt.vendor_code)), 0) ' ||
        '       + NVL(LENGTH(TRIM(jt.item_code)), 0) > 0 ), ' ||
        '   CHECK_RESULT AS ( ' ||
        '   SELECT SITE, VENDOR_CODE, ITEM_CODE, LV, QTY, COMPENSATION, PHYSICAL, REASON, ' ||
        '     CASE ' ||
        '       WHEN NVL(LENGTH(SITE), 0) = 0 THEN ''SITE is required'' ' ||
        '       WHEN NVL(LENGTH(VENDOR_CODE), 0) = 0 THEN ''VENDOR_CODE is required'' ' ||
        '       WHEN NVL(LENGTH(ITEM_CODE), 0) = 0 THEN ''ITEM_CODE is required'' ' ||
        '       WHEN NVL(LENGTH(LV), 0) = 0 THEN ''LV is required'' ' ||
        '       WHEN NVL(LENGTH(QTY), 0) = 0 THEN ''QTY is required'' ' ||
        '       WHEN NVL(LENGTH(COMPENSATION), 0) = 0 THEN ''Compensation is required'' ' ||
        '       WHEN NVL(LENGTH(PHYSICAL), 0) = 0 THEN ''Physical is required'' ' ||
        '       WHEN NVL(LENGTH(REASON), 0) = 0 THEN ''Reason is required'' ' ||
        '       WHEN NOT REGEXP_LIKE(SITE, ''^[0-9]+$'') THEN ''SITE must be a whole number'' ' ||
        '       WHEN NOT REGEXP_LIKE(QTY, ''^[0-9]+([\.,][0-9]+)?$'') THEN ''Quantity must be a number'' ' ||
        '       WHEN REGEXP_LIKE(REPLACE(QTY, '','', ''.''), ''^0+(\.0+)?$'') THEN ''Quantity must be greater than 0'' ' ||
        '       WHEN NOT REGEXP_LIKE(COMPENSATION, ''^[0-9]+$'') THEN ''Compensation must be a whole number'' ' ||
        '       WHEN NOT REGEXP_LIKE(PHYSICAL, ''^[0-9]+$'') THEN ''Physical must be a whole number'' ' ||
        '       WHEN NOT REGEXP_LIKE(REASON, ''^[0-9]+$'') THEN ''Reason must be a whole number'' ' ||
        '       WHEN NOT EXISTS (SELECT 1 FROM sitdgene@' || V_QUERY_SID_ARRAY(1) ||
        '                        WHERE TO_CHAR(socsite) = SITE) THEN ''Unknown store or warehouse'' ' ||
        '       WHEN NOT EXISTS (SELECT 1 FROM foudgene@' || V_QUERY_SID_ARRAY(1) ||
        '                        WHERE TO_CHAR(foucnuf) = VENDOR_CODE) THEN ''Unknown supplier'' ' ||
        '       WHEN NOT EXISTS (SELECT 1 FROM artvl@' || V_QUERY_SID_ARRAY(1) ||
        '                        WHERE arlcexr = ITEM_CODE AND TO_CHAR(arlcexvl) = LV) ' ||
        '         THEN ''Unknown item or pack (LV)'' ' ||
        '       WHEN NOT EXISTS ( ' ||
        '              SELECT 1 ' ||
        '                FROM artuc@' || V_QUERY_SID_ARRAY(1) || ' u, ' ||
        '                     foudgene@' || V_QUERY_SID_ARRAY(1) || ' g ' ||
        '               WHERE u.aracfin = g.foucfin ' ||
        '                 AND u.aracexr = ITEM_CODE ' ||
        '                 AND TO_CHAR(u.aracexvl) = LV ' ||
        '                 AND TO_CHAR(g.foucnuf) = VENDOR_CODE ' ||
        '                 AND pkresrel.isSiteBelongToNode@' || V_QUERY_SID_ARRAY(1) ||
        '                       (1, TO_NUMBER(SITE), u.arasite, ''1'') = 1) ' ||
        '         THEN ''Item/pack was never orderable for this site/supplier'' ' ||
        '       ELSE '''' ' ||
        '     END AS COMMENTS ' ||
        '   FROM ITEM_DATA ) ';

      V_QUERYUPDATE :=
        'MERGE INTO json_check ' ||
        ' USING ( ' || V_QUERYSQL ||
        ' SELECT (SELECT listagg_clob (json_object(''SITE'' VALUE site, ' ||
        '                      ''VENDOR_CODE'' VALUE vendor_code, ' ||
        '                      ''ITEM_CODE'' VALUE item_code, ' ||
        '                      ''LV'' VALUE lv, ' ||
        '                      ''QTY'' VALUE qty, ' ||
        '                      ''COMPENSATION'' VALUE compensation, ' ||
        '                      ''PHYSICAL'' VALUE physical, ' ||
        '                      ''REASON'' VALUE reason, ' ||
        '                      ''COMMENTS'' VALUE comments)) ' ||
        ' FROM CHECK_RESULT E) FINAL_JSON, ' ||
        ' (SELECT COUNT(1) FROM CHECK_RESULT T WHERE LENGTH(T.COMMENTS) > 0) FINAL_NBERROR, ' ||
        ' (SELECT COUNT(1) FROM CHECK_RESULT T ) FINAL_NBRECORD ' ||
        ' FROM DUAL) ' ||
        ' ON (JSONID=TO_NUMBER(''' || TO_CHAR(IN_JSONID) || '''))' ||
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
          V_OUT := TO_CLOB(
            'SELECT NULL SITE, NULL VENDOR_CODE, NULL ITEM_CODE, NULL LV, NULL QTY, ' ||
            'NULL COMPENSATION, NULL PHYSICAL, NULL REASON, ''' ||
            REPLACE(V_ERR, '''', '''''') || ''' COMMENTS FROM DUAL');
          ROLLBACK;
          RETURN V_OUT;
      END;

      /* Return local JSONERROR — short SELECT for CALLQUERY (STOCKLAYER pattern) */
      V_OUT := TO_CLOB(
        'SELECT CAST(site AS VARCHAR2(40)) SITE, ' ||
        '       CAST(vendor_code AS VARCHAR2(40)) VENDOR_CODE, ' ||
        '       CAST(item_code AS VARCHAR2(40)) ITEM_CODE, ' ||
        '       CAST(lv AS VARCHAR2(20)) LV, ' ||
        '       CAST(qty AS VARCHAR2(40)) QTY, ' ||
        '       CAST(compensation AS VARCHAR2(40)) COMPENSATION, ' ||
        '       CAST(physical AS VARCHAR2(40)) PHYSICAL, ' ||
        '       CAST(reason AS VARCHAR2(40)) REASON, ' ||
        '       CAST(comments AS VARCHAR2(4000)) COMMENTS ' ||
        '  FROM JSON_TABLE((SELECT JSONERROR FROM JSON_CHECK WHERE JSONID=TO_NUMBER(''' ||
        TO_CHAR(IN_JSONID) || ''')), ''$[*]'' ' ||
        '       COLUMNS ( site         VARCHAR2(40) PATH ''$.SITE'', ' ||
        '                 vendor_code  VARCHAR2(40) PATH ''$.VENDOR_CODE'', ' ||
        '                 item_code    VARCHAR2(40) PATH ''$.ITEM_CODE'', ' ||
        '                 lv           VARCHAR2(20) PATH ''$.LV'', ' ||
        '                 qty          VARCHAR2(40) PATH ''$.QTY'', ' ||
        '                 compensation VARCHAR2(40) PATH ''$.COMPENSATION'', ' ||
        '                 physical     VARCHAR2(40) PATH ''$.PHYSICAL'', ' ||
        '                 reason       VARCHAR2(40) PATH ''$.REASON'', ' ||
        '                 comments     VARCHAR2(4000) PATH ''$.COMMENTS'' ))');
      RETURN V_OUT;
    EXCEPTION
      WHEN OTHERS THEN
        V_ERR := SQLERRM;
        V_OUT := TO_CLOB(
          'SELECT NULL SITE, NULL VENDOR_CODE, NULL ITEM_CODE, NULL LV, NULL QTY, ' ||
          'NULL COMPENSATION, NULL PHYSICAL, NULL REASON, ''' ||
          REPLACE(V_ERR, '''', '''''') || ''' COMMENTS FROM DUAL');
        ROLLBACK;
        RETURN V_OUT;
    END;
  END LOADRETURN_CHECK;

  -- ****************************************************************************************
  -- Load for return — execute (tool 24) → INTDETRET@dblink
  -- COMPENSATION→IRFTMODE, PHYSICAL→IRFRPHY, REASON→IRFMOTI (from Excel).
  -- Package constants: IRFTYPE=1, IRFDEVI=840, IRFCONS=0.
  -- ****************************************************************************************
  FUNCTION LOADRETURN_EXECUTE(IN_NUM_LOG    IN NUMBER,
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
    V_FICH     VARCHAR2(50);
    V_USERID   VARCHAR2(12);
    V_LOGIN    VARCHAR2(30);
    V_DBLINK   VARCHAR2(128);
    V_KEY      VARCHAR2(80);
    V_BL       NUMBER;
    V_NOLIGN   NUMBER;
    V_FCCNUM   VARCHAR2(8);
    V_ARANFILF NUMBER;
    /* Fixed INTDETRET constants (not from Excel / not from ICR_MASSLOAD_RULE) */
    V_IRFTYPE  CONSTANT NUMBER := 1;
    V_IRFDEVI  CONSTANT NUMBER := 840;
    V_IRFCONS  CONSTANT NUMBER := 0;

    TYPE t_file_rec IS RECORD (
      site         VARCHAR2(20),
      vendor_code  VARCHAR2(30),
      item_code    VARCHAR2(30),
      lv           VARCHAR2(20),
      qty          NUMBER,
      compensation NUMBER,
      physical     NUMBER,
      reason       NUMBER
    );
    TYPE t_file_tab IS TABLE OF t_file_rec;
    TYPE t_num_by_key IS TABLE OF NUMBER INDEX BY VARCHAR2(80);

    l_files       t_file_tab;
    l_bl_by_sv    t_num_by_key;
    l_nolig_by_sv t_num_by_key;

    CURSOR cur_file IS
      SELECT TRIM(jt.site) SITE,
             TRIM(jt.vendor_code) VENDOR_CODE,
             TRIM(jt.item_code) ITEM_CODE,
             TRIM(jt.lv) LV,
             TO_NUMBER(REPLACE(TRIM(jt.qty), ',', '.')) QTY,
             TO_NUMBER(TRIM(jt.compensation)) COMPENSATION,
             TO_NUMBER(TRIM(jt.physical)) PHYSICAL,
             TO_NUMBER(TRIM(jt.reason)) REASON
        FROM JSON_INBOUND ji,
             JSON_TABLE(ji.JSONCONTENT, '$[*]'
               COLUMNS (
                 site         VARCHAR2(40) PATH '$.SITE',
                 vendor_code  VARCHAR2(40) PATH '$.VENDOR_CODE',
                 item_code    VARCHAR2(40) PATH '$.ITEM_CODE',
                 lv           VARCHAR2(20) PATH '$.LV',
                 qty          VARCHAR2(40) PATH '$.QTY',
                 compensation VARCHAR2(40) PATH '$.COMPENSATION',
                 physical     VARCHAR2(40) PATH '$.PHYSICAL',
                 reason       VARCHAR2(40) PATH '$.REASON'
               )) jt
       WHERE ji.JSONID = IN_JSONID;

    V_QUERY_SID_ARRAY      PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_PARAM_ARRAY    PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_LANGUAGE_ARRAY PKREQUESTMANAGER.PARAM_ARRAY;

  BEGIN
    V_PROGNAME := 'LOADRETURN_EXECUTE';
    BEGIN
      V_QUERY_PARAM_ARRAY    := PKREQUESTMANAGER.STRINGTOARRAY(IN_PARAMETERS, ',');
      V_QUERY_SID_ARRAY      := PKREQUESTMANAGER.STRINGTOARRAY(IN_DATABASEID, ',');
      V_QUERY_LANGUAGE_ARRAY := PKREQUESTMANAGER.STRINGTOARRAY(IN_LANGUAGE, ',');
      V_DBLINK := V_QUERY_SID_ARRAY(1);

      V_FICH   := SUBSTR(IN_JSONFILE, 1, 50 - LENGTH(TO_CHAR(IN_JSONID)) - 1) || '_' || IN_JSONID;
      V_USERID := SUBSTR(IN_USERID, 1, 12 - LENGTH(TO_CHAR(IN_JSONID))) || IN_JSONID;
      V_LOGIN  := SUBSTR(IN_USERID, 1, 30);

      BEGIN
        V_QUERYSQL := 'DELETE FROM INTDETRET@' || V_DBLINK || ' WHERE IRFFICH=''' ||
                      REPLACE(V_FICH, '''', '''''') || '''';
        EXECUTE IMMEDIATE V_QUERYSQL;
        COMMIT;
      EXCEPTION
        WHEN OTHERS THEN
          DBMS_OUTPUT.PUT_LINE('LOADRETURN_EXECUTE DELETE ERROR ' || SQLCODE || ' : ' || SQLERRM);
          /* Bare ERROR… is not valid for DBMS_SQL.PARSE → ORA-06561 */
          RETURN 'SELECT ''ERROR ' || SQLCODE || ' : ' ||
                 REPLACE(SQLERRM, '''', '''''') || ''' COMMENTS FROM DUAL';
      END;

      OPEN cur_file;
      FETCH cur_file BULK COLLECT INTO l_files;
      CLOSE cur_file;

      FOR i IN 1 .. l_files.COUNT LOOP
        V_KEY := l_files(i).site || '|' || l_files(i).vendor_code;

        IF NOT l_bl_by_sv.EXISTS(V_KEY) THEN
          BEGIN
            EXECUTE IMMEDIATE
              'SELECT PKDSD.generateBL@' || V_DBLINK || '(1) FROM DUAL'
              INTO V_BL;
          EXCEPTION
            WHEN OTHERS THEN
              DBMS_OUTPUT.PUT_LINE('LOADRETURN_EXECUTE generateBL ERROR ' || SQLCODE || ' : ' || SQLERRM);
              RETURN 'SELECT ''ERROR ' || SQLCODE || ' : ' ||
                     REPLACE(SQLERRM, '''', '''''') || ''' COMMENTS FROM DUAL';
          END;
          l_bl_by_sv(V_KEY)    := V_BL;
          l_nolig_by_sv(V_KEY) := 0;
        END IF;

        l_nolig_by_sv(V_KEY) := l_nolig_by_sv(V_KEY) + 1;
        V_NOLIGN := l_nolig_by_sv(V_KEY);
        V_BL     := l_bl_by_sv(V_KEY);

        V_FCCNUM   := NULL;
        V_ARANFILF := NULL;
        BEGIN
          EXECUTE IMMEDIATE
            'SELECT fccnum, aranfilf FROM ( ' ||
            '  SELECT c.fccnum, u.aranfilf ' ||
            '    FROM artuc@' || V_DBLINK || ' u, ' ||
            '         foudgene@' || V_DBLINK || ' g, ' ||
            '         fouccom@' || V_DBLINK || ' c ' ||
            '   WHERE u.aracfin = g.foucfin ' ||
            '     AND u.araccin = c.fccccin ' ||
            '     AND u.aracfin = c.foucfin ' ||
            '     AND u.aracexr = :b_item ' ||
            '     AND TO_CHAR(u.aracexvl) = :b_lv ' ||
            '     AND TO_CHAR(g.foucnuf) = :b_vendor ' ||
            '     AND pkresrel.isSiteBelongToNode@' || V_DBLINK ||
            '           (1, TO_NUMBER(:b_site), u.arasite, ''1'') = 1 ' ||
            '   ORDER BY u.araddeb DESC NULLS LAST, u.aradfin DESC NULLS LAST) ' ||
            ' WHERE ROWNUM = 1'
            INTO V_FCCNUM, V_ARANFILF
            USING l_files(i).item_code,
                  l_files(i).lv,
                  l_files(i).vendor_code,
                  l_files(i).site;
        EXCEPTION
          WHEN NO_DATA_FOUND THEN
            V_FCCNUM   := NULL;
            V_ARANFILF := NULL;
          WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('LOADRETURN_EXECUTE OA LOOKUP ERROR ' || SQLCODE || ' : ' || SQLERRM);
            RETURN 'SELECT ''ERROR ' || SQLCODE || ' : ' ||
                   REPLACE(SQLERRM, '''', '''''') || ''' COMMENTS FROM DUAL';
        END;

        V_FCCNUM   := NVL(V_FCCNUM, SUBSTR(l_files(i).vendor_code || 'CC', 1, 8));
        V_ARANFILF := NVL(V_ARANFILF, 0);

        V_QUERYSQL :=
          'INSERT INTO INTDETRET@' || V_DBLINK || ' ( ' ||
          '  IRFCEXRET, IRFSITE, IRFDRET, IRFCNUF, IRFCNUM, IRFNFILF, IRFNFILC, ' ||
          '  IRFTMODE, IRFDEVI, IRFCONS, IRFNOLIGN, IRFCEXR, IRFCEXVL, IRFCTVA, ' ||
          '  IRFPREPD, IRFPVTE, IRFPRETI, IRFQRET, IRFPRET, IRFRPHY, IRFMOTI, IRFTYPMVT, ' ||
          '  IRFTRT, IRFDTRT, IRFDCRE, IRFDMAJ, IRFUTIL, IRFFICH, IRFLGFI, IRFNLIG, ' ||
          '  IRFUAPP, IRFTYPUL, IRFUSER, IRFETAT, IRFDSAI, IRFIENLEV, IRFTYPE ) ' ||
          'VALUES ( ' ||
          '  :b_bl, :b_site, SYSDATE, :b_vendor, :b_fccnum, :b_nfilf, 1, ' ||
          '  :b_tmode, :b_devi, :b_cons, :b_nolign, :b_item, :b_lv, 1, ' ||
          '  0, 0, 0, :b_qty, 0, :b_rphy, :b_moti, 1, ' ||
          '  0, TRUNC(SYSDATE), SYSDATE, SYSDATE, :b_util, :b_fich, 1, 1, ' ||
          '  1, 1, :b_login, 0, TRUNC(SYSDATE), 0, :b_rtype )';

        BEGIN
          EXECUTE IMMEDIATE V_QUERYSQL
            USING TO_CHAR(V_BL),
                  TO_NUMBER(l_files(i).site),
                  l_files(i).vendor_code,
                  V_FCCNUM,
                  V_ARANFILF,
                  l_files(i).compensation,
                  V_IRFDEVI,
                  V_IRFCONS,
                  TO_CHAR(V_NOLIGN),
                  l_files(i).item_code,
                  TO_NUMBER(l_files(i).lv),
                  l_files(i).qty,
                  l_files(i).physical,
                  l_files(i).reason,
                  V_USERID,
                  V_FICH,
                  V_LOGIN,
                  V_IRFTYPE;
        EXCEPTION
          WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('LOADRETURN_EXECUTE INSERT ERROR ' || SQLCODE || ' : ' || SQLERRM);
            RETURN 'SELECT ''ERROR ' || SQLCODE || ' : ' ||
                   REPLACE(SQLERRM, '''', '''''') || ''' COMMENTS FROM DUAL';
        END;
      END LOOP;

      COMMIT;

      UPDATE JSON_INBOUND
         SET JSONSTATUS   = 1,
             JSONDPROCESS = SYSDATE,
             JSONDMAJ     = SYSDATE,
             JSONUTIL     = IN_USERID
       WHERE JSONID = IN_JSONID;
      COMMIT;

      RETURN 'SELECT ''' || REPLACE(V_USERID, '''', '''''') || ''' RESULT FROM DUAL';
    END;
  END LOADRETURN_EXECUTE;

  -- ****************************************************************************************
  -- Load for return — collect errors (INTDETRET after psint41p)
  -- ****************************************************************************************
  FUNCTION LOADRETURN_COLLECTERROR(IN_NUM_LOG    IN NUMBER,
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
    V_FICH        VARCHAR2(50);

    V_QUERY_SID_ARRAY      PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_PARAM_ARRAY    PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_LANGUAGE_ARRAY PKREQUESTMANAGER.PARAM_ARRAY;
  BEGIN
    V_PROGNAME := 'LOADRETURN_COLLECTERROR';
    BEGIN
      V_QUERY_PARAM_ARRAY    := PKREQUESTMANAGER.STRINGTOARRAY(IN_PARAMETERS, ',');
      V_QUERY_SID_ARRAY      := PKREQUESTMANAGER.STRINGTOARRAY(IN_DATABASEID, ',');
      V_QUERY_LANGUAGE_ARRAY := PKREQUESTMANAGER.STRINGTOARRAY(IN_LANGUAGE, ',');

      V_FICH := SUBSTR(IN_JSONFILE, 1, 50 - LENGTH(TO_CHAR(IN_JSONID)) - 1) || '_' || IN_JSONID;

      V_QUERYSQL :=
        ' WITH CHECK_RESULT AS ( ' ||
        '   SELECT TO_CHAR(IRFSITE) SITE, TO_CHAR(IRFCNUF) VENDOR_CODE, ' ||
        '          IRFCEXR ITEM_CODE, TO_CHAR(IRFCEXVL) LV, TO_CHAR(IRFQRET) QTY, ' ||
        '          TO_CHAR(IRFTMODE) COMPENSATION, TO_CHAR(IRFRPHY) PHYSICAL, ' ||
        '          TO_CHAR(IRFMOTI) REASON, ' ||
        '          NVL(REPLACE(IRFMESS,'''''''','' ''), ''Return line not processed'') COMMENTS ' ||
        '   FROM INTDETRET@' || V_QUERY_SID_ARRAY(1) ||
        '   WHERE IRFFICH=''' || REPLACE(V_FICH, '''', '''''') || ''' ' ||
        '   AND (IRFTRT IN (0, 2) OR IRFNERR IS NOT NULL) ' ||
        '   )';

      V_QUERYUPDATE :=
        'MERGE INTO json_inbound ' ||
        ' USING ( ' || V_QUERYSQL ||
        ' SELECT (SELECT listagg_clob (json_object(''SITE'' VALUE site, ' ||
        '                      ''VENDOR_CODE'' VALUE vendor_code, ' ||
        '                      ''ITEM_CODE'' VALUE item_code, ' ||
        '                      ''LV'' VALUE lv, ' ||
        '                      ''QTY'' VALUE qty, ' ||
        '                      ''COMPENSATION'' VALUE compensation, ' ||
        '                      ''PHYSICAL'' VALUE physical, ' ||
        '                      ''REASON'' VALUE reason, ' ||
        '                      ''COMMENTS'' VALUE comments)) ' ||
        ' FROM CHECK_RESULT E) FINAL_JSON, ' ||
        ' (SELECT COUNT(1) FROM CHECK_RESULT T) FINAL_NBERROR ' ||
        ' FROM DUAL) ' ||
        ' ON (JSONID=TO_NUMBER(''' || TO_CHAR(IN_JSONID) || '''))' ||
        ' WHEN MATCHED THEN ' ||
        ' UPDATE SET JSONERROR= NVL2(FINAL_JSON, ''['' || FINAL_JSON || '']'', ''[]''), ' ||
        '            JSONNBERROR= NVL(FINAL_NBERROR, 0), ' ||
        '            JSONUTIL=''' || IN_USERID || ''',' ||
        '            JSONNBRECORD=(SELECT REGEXP_COUNT(JSONCONTENT,''ITEM_CODE'') FROM JSON_INBOUND WHERE JSONID=TO_NUMBER(''' ||
        TO_CHAR(IN_JSONID) || ''')), ' ||
        '            JSONDMAJ=SYSDATE ';

      BEGIN
        EXECUTE IMMEDIATE V_QUERYUPDATE;
        COMMIT;
      EXCEPTION
        WHEN OTHERS THEN
          DBMS_OUTPUT.PUT_LINE('LOADRETURN_COLLECTERROR ERROR ' || SQLCODE || ' : ' || SQLERRM);
          /* Bare -2 → ORA-00900; ERROR text → ORA-06561 — always return SELECT */
          RETURN 'SELECT ''' || REPLACE(SQLERRM, '''', '''''') || ''' COMMENTS FROM DUAL';
      END;

      /* Wrap WITH… so DBMS_SQL.PARSE sees SELECT; CAST keeps codes as VARCHAR2 for clients */
      RETURN
        'SELECT CAST(SITE AS VARCHAR2(40)) SITE, ' ||
        '       CAST(VENDOR_CODE AS VARCHAR2(40)) VENDOR_CODE, ' ||
        '       CAST(ITEM_CODE AS VARCHAR2(40)) ITEM_CODE, ' ||
        '       CAST(LV AS VARCHAR2(20)) LV, ' ||
        '       CAST(QTY AS VARCHAR2(40)) QTY, ' ||
        '       CAST(COMPENSATION AS VARCHAR2(40)) COMPENSATION, ' ||
        '       CAST(PHYSICAL AS VARCHAR2(40)) PHYSICAL, ' ||
        '       CAST(REASON AS VARCHAR2(40)) REASON, ' ||
        '       CAST(COMMENTS AS VARCHAR2(4000)) COMMENTS ' ||
        'FROM (' || V_QUERYSQL ||
        ' SELECT SITE, VENDOR_CODE, ITEM_CODE, LV, QTY, COMPENSATION, PHYSICAL, REASON, COMMENTS FROM CHECK_RESULT)';
    END;
  END LOADRETURN_COLLECTERROR;

*/

PROMPT 125 — replace LOADRETURN_* bodies in PKMASSCHANGE from the commented block above
PROMPT     (or re-deploy updated 111_pkmasschange_ref_to_order.sql).
PROMPT Then run 126_drop_icr_massload_rule.sql if retiring ICR_MASSLOAD_RULE.

SET DEFINE ON;
/
