-- =============================================================================
-- 114_pkmasschange_stock_layer_init.sql
-- Tool 20 — Stock layer initialization in cost (upgrade existing /stocklayer screen)
--
-- Excel / JSON columns (6):
--   SITE_CODE, ITEM_CODE, LV_CODE, POSITION, QTY, UNIT_COST
--   SITE_CODE  — blank/ALL → all stores (SITDGENE) except 0 HQ / 30 test; numeric → one store (0/30 skipped)
--                warehouse sites (SITDGENE.SOCCMAG=0): QTY must be 0 (WAC-only; no qty adjustment)
--   LV_CODE    — required from file; exact ARTVL match (arlcexr+arlcexvl) — never defaulted/guessed
--   POSITION   — blank/ALL → positions 0–11; numeric → one position type
--   UNIT_COST  — posted as-is to SKFPURP / IMSNPRE (no get_skuunits conversion)
--
-- Execute path:
--   No STOCOUCH layer → INSERT ITFSTOCK  → psitf03p
--   Layer exists, on-hand > 0 → INTMVTSTO: IMSMOTF=903 (cost) + IMSMOTF=906 (purchase price) → pssti06p
--   Layer exists, on-hand = 0 → INTMVTSTO sandwich (same IMSNMVT / site):
--     on-hand = SUM(NVL(storeai,0)+NVL(storeal,0)-NVL(storeav,0)+NVL(storeae,0)+NVL(storeac,0)-NVL(storear,0))
--       1) IMSTMVT=101 IMSMOTF=2   IMSEQTE=+1  (qty adj up)
--       2) IMSTMVT=100 IMSMOTF=903 IMSEQTE=0   (cost, IMSNPRE=UNIT_COST)
--       3) IMSTMVT=100 IMSMOTF=906 IMSEQTE=0   (purchase price, IMSNPRE=UNIT_COST)
--       4) IMSTMVT=101 IMSMOTF=2   IMSEQTE=-1  (qty adj back)
--
-- Deploy: merge the three STOCKLAYER_* functions below into PKMASSCHANGE package body
--         immediately BEFORE REFTOORDER_CHECK (or run full 111 after merge).
-- Template ICR_TEMPLATE018: add POSITION column D; shift QTY→E, UNIT_COST→F.
--
-- CHECK note (MAS0000001 / ORA-00900): PRAGMA AUTONOMOUS_TRANSACTION requires
-- ROLLBACK before any error RETURN. Returning a SELECT without ROLLBACK exits
-- with ORA-06519; CALLQUERY surfaces that as ORA-00900.
-- After MERGE, return SELECT from local JSONERROR (not re-run @dblink CHECK_RESULT).
-- Validation is one CASE per file row so every line is always returned.
-- =============================================================================

  -- ****************************************************************************************
  -- Stock layer init in cost — check (tool 20)
  -- Validates SITDGENE + exact ITEM_CODE/LV_CODE on ARTVL (LV_CODE required from file — no default/guess).
  -- ****************************************************************************************
  FUNCTION STOCKLAYER_CHECK(IN_NUM_LOG    IN NUMBER,
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
    V_PROGNAME := 'STOCKLAYER_CHECK';
    BEGIN
      V_QUERY_PARAM_ARRAY    := PKREQUESTMANAGER.STRINGTOARRAY(IN_PARAMETERS, ',');
      V_QUERY_SID_ARRAY      := PKREQUESTMANAGER.STRINGTOARRAY(IN_DATABASEID, ',');
      V_QUERY_LANGUAGE_ARRAY := PKREQUESTMANAGER.STRINGTOARRAY(IN_LANGUAGE, ',');

      V_QUERYSQL :=
        ' WITH ITEM_DATA AS ( ' ||
        '   SELECT TRIM(site_code) site_code, TRIM(item_code) item_code, TRIM(lv_code) lv_code, ' ||
        '          TRIM(position) position, TRIM(qty) qty, TRIM(unit_cost) unit_cost ' ||
        '   FROM json_table((SELECT JSONCONTENT FROM JSON_CHECK WHERE JSONID= ' || IN_JSONID || '), ''$[*]'' ' ||
        '                   COLUMNS ( site_code  PATH ''$.SITE_CODE'' ' ||
        '                           , item_code  PATH ''$.ITEM_CODE'' ' ||
        '                           , lv_code    PATH ''$.LV_CODE'' ' ||
        '                           , position   PATH ''$.POSITION'' ' ||
        '                           , qty        PATH ''$.QTY'' ' ||
        '                           , unit_cost  PATH ''$.UNIT_COST'' ' ||
        '                           )) ), ' ||
        /* One output row per file line — CASE so gaps cannot drop rows (UNION hole → 0 records) */
        '   CHECK_RESULT AS ( ' ||
        '   SELECT site_code, item_code, lv_code, position, qty, unit_cost, ' ||
        '     CASE ' ||
        '       WHEN NVL(LENGTH(lv_code), 0) = 0 THEN ''LV_CODE is required'' ' ||
        '       WHEN NOT EXISTS (SELECT 1 FROM artvl@' || V_QUERY_SID_ARRAY(1) ||
        '                        WHERE arlcexr=item_code AND TO_CHAR(arlcexvl)=lv_code) ' ||
        '         THEN ''Unknown item code or LV_CODE'' ' ||
        '       WHEN UPPER(NVL(site_code,''ALL'')) NOT IN (''ALL'','''') ' ||
        '        AND NOT EXISTS (SELECT 1 FROM sitdgene@' || V_QUERY_SID_ARRAY(1) ||
        '                        WHERE site_code=TO_CHAR(socsite)) ' ||
        '         THEN ''Unknown site code'' ' ||
        '       WHEN UPPER(NVL(position,''ALL'')) NOT IN (''ALL'','''') ' ||
        '        AND (NOT REGEXP_LIKE(position, ''^[0-9]+$'') OR TO_NUMBER(position) NOT BETWEEN 0 AND 11) ' ||
        '         THEN ''Invalid position (use 0-11 or ALL)'' ' ||
        '       WHEN NVL(LENGTH(qty), 0) = 0 OR NOT REGEXP_LIKE(qty, ''^-?[0-9]+([.,][0-9]+)?$'') ' ||
        '         THEN ''Invalid quantity'' ' ||
        '       WHEN NVL(LENGTH(unit_cost), 0) = 0 OR LTRIM(unit_cost, ''-'') <> unit_cost ' ||
        '         THEN ''Invalid unit cost'' ' ||
        /* Warehouse: block only when numeric QTY <> 0 (WAC-only QTY=0 is allowed) */
        '       WHEN UPPER(NVL(site_code,''ALL'')) NOT IN (''ALL'','''') ' ||
        '        AND EXISTS (SELECT 1 FROM sitdgene@' || V_QUERY_SID_ARRAY(1) ||
        '                    WHERE site_code=TO_CHAR(socsite) AND NVL(soccmag, 10) = 0) ' ||
        '        AND TO_NUMBER(REPLACE(qty, '','', ''.'')) <> 0 ' ||
        '         THEN ''QTY adjustment not allowed on warehouse site (SOCCMAG=0); set QTY to 0 for WAC-only'' ' ||
        '       WHEN UPPER(NVL(site_code,''ALL'')) IN (''ALL'','''') ' ||
        '        AND TO_NUMBER(REPLACE(qty, '','', ''.'')) <> 0 ' ||
        '         THEN ''QTY not allowed when SITE_CODE is ALL (includes warehouses); use a store site or set QTY to 0'' ' ||
        '       ELSE '''' ' ||
        '     END COMMENTS ' ||
        '   FROM ITEM_DATA ' ||
        '   )';
      V_QUERYUPDATE :=
        'MERGE INTO json_check ' ||
        ' USING ( ' || V_QUERYSQL ||
        ' SELECT (SELECT listagg_clob (json_object(''SITE_CODE'' VALUE site_code FORMAT JSON, ' ||
        '                      ''ITEM_CODE'' VALUE item_code FORMAT JSON, ' ||
        '                      ''LV_CODE'' VALUE lv_code FORMAT JSON, ' ||
        '                      ''POSITION'' VALUE position FORMAT JSON, ' ||
        '                      ''QTY'' VALUE qty FORMAT JSON, ' ||
        '                      ''UNIT_COST'' VALUE unit_cost FORMAT JSON, ' ||
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
          /* Autonomous txn: ROLLBACK before RETURN or CALLQUERY sees ORA-00900/06519 */
          V_ERR := SQLERRM;
          DBMS_OUTPUT.PUT_LINE('STOCKLAYER_CHECK MERGE ERROR ' || SQLCODE || ' : ' || V_ERR);
          V_OUT := TO_CLOB(
            'SELECT NULL SITE_CODE, NULL ITEM_CODE, NULL LV_CODE, NULL POSITION, NULL QTY, NULL UNIT_COST, ''' ||
            REPLACE(V_ERR, '''', '''''') || ''' COMMENTS FROM DUAL');
          ROLLBACK;
          RETURN V_OUT;
      END;

      /* Return local JSONERROR only — do not re-run @dblink CHECK_RESULT (0 rows / ORA-02046) */
      V_OUT := TO_CLOB(
        'SELECT site_code SITE_CODE, item_code ITEM_CODE, lv_code LV_CODE, position POSITION, ' ||
        '       qty QTY, unit_cost UNIT_COST, comments COMMENTS ' ||
        '  FROM JSON_TABLE((SELECT JSONERROR FROM JSON_CHECK WHERE JSONID=' || IN_JSONID || '), ''$[*]'' ' ||
        '       COLUMNS ( site_code PATH ''$.SITE_CODE'', item_code PATH ''$.ITEM_CODE'', ' ||
        '                 lv_code PATH ''$.LV_CODE'', position PATH ''$.POSITION'', ' ||
        '                 qty PATH ''$.QTY'', unit_cost PATH ''$.UNIT_COST'', ' ||
        '                 comments PATH ''$.COMMENTS'' ))');
      COMMIT;
      RETURN V_OUT;
    EXCEPTION
      WHEN OTHERS THEN
        V_ERR := SQLERRM;
        DBMS_OUTPUT.PUT_LINE('STOCKLAYER_CHECK ERROR ' || SQLCODE || ' : ' || V_ERR);
        V_OUT := TO_CLOB(
          'SELECT NULL SITE_CODE, NULL ITEM_CODE, NULL LV_CODE, NULL POSITION, NULL QTY, NULL UNIT_COST, ''' ||
          REPLACE(V_ERR, '''', '''''') || ''' COMMENTS FROM DUAL');
        ROLLBACK;
        RETURN V_OUT;
    END;
  END STOCKLAYER_CHECK;

  -- ****************************************************************************************
  -- Stock layer init in cost — execute (tool 20)
  -- Local JSON read + remote inserts (avoids ORA-22992 LOB@dblink).
  -- Expands ALL/null SITE_CODE and POSITION; routes to ITFSTOCK or INTMVTSTO.
  -- ****************************************************************************************
  FUNCTION STOCKLAYER_EXECUTE(IN_NUM_LOG    IN NUMBER,
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
    V_USERID   VARCHAR2(12);
    V_FICH     VARCHAR2(50);
    V_DBLINK   VARCHAR2(128);

    V_QUERY_SID_ARRAY      PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_PARAM_ARRAY    PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_LANGUAGE_ARRAY PKREQUESTMANAGER.PARAM_ARRAY;

    TYPE t_file_rec IS RECORD (
      site_code VARCHAR2(50),
      item_code VARCHAR2(50),
      lv_code   VARCHAR2(20),
      position  VARCHAR2(20),
      qty       NUMBER,
      unit_cost NUMBER
    );
    TYPE t_file_tab IS TABLE OF t_file_rec;
    TYPE t_num_tab IS TABLE OF NUMBER;

    l_files     t_file_tab;
    l_sites     t_num_tab;
    l_line      NUMBER := 0;
    l_cinl       NUMBER;
    l_seqvl      NUMBER;
    l_layer_cnt  NUMBER;
    l_layer_qty  NUMBER;
    l_pos_from   NUMBER;
    l_pos_to     NUMBER;
    l_s          PLS_INTEGER;
    l_p          PLS_INTEGER;
    l_nmvt       NUMBER;
    l_ims_line   NUMBER;
    l_ims_flig   NUMBER := 0;
    l_nmvt_csv   CLOB;
    l_idx        PLS_INTEGER;
    TYPE t_nmvt_map IS TABLE OF NUMBER INDEX BY PLS_INTEGER; /* site → IMSNMVT */
    TYPE t_line_map IS TABLE OF NUMBER INDEX BY PLS_INTEGER; /* site → IMSNLIG */
    TYPE t_vc_tab IS TABLE OF VARCHAR2(80);
    l_nmvt_by_site t_nmvt_map;
    l_line_by_site t_line_map;
    l_pairs        t_vc_tab;
    l_out          CLOB;

    /* Local only — no @dblink (JSONCONTENT is CLOB) */
    CURSOR cur_file IS
      SELECT TRIM(jt.site_code) site_code,
             TRIM(jt.item_code) item_code,
             TRIM(jt.lv_code)   lv_code,
             TRIM(jt.position)  position,
             NVL(TO_NUMBER(NULLIF(TRIM(jt.qty), '')), 0) qty,
             TO_NUMBER(REPLACE(REPLACE(TRIM(jt.unit_cost), ',', '.'), ' ', ''),
                       '999999999999D999999999',
                       'NLS_NUMERIC_CHARACTERS=''.,''') unit_cost
        FROM JSON_INBOUND d,
             JSON_TABLE(d.JSONCONTENT,
                        '$[*]' COLUMNS(site_code PATH '$.SITE_CODE',
                                       item_code PATH '$.ITEM_CODE',
                                       lv_code   PATH '$.LV_CODE',
                                       position  PATH '$.POSITION',
                                       qty       PATH '$.QTY',
                                       unit_cost PATH '$.UNIT_COST')) jt
       WHERE d.JSONID = IN_JSONID
         AND d.JSONTOOL = 20
         AND d.JSONSTATUS = 0
         AND LENGTH(TRIM(jt.lv_code)) > 0;

    PROCEDURE dump_sql_on_error(p_label IN VARCHAR2, p_sql IN CLOB) IS
      l_pos   PLS_INTEGER := 1;
      l_len   PLS_INTEGER;
      l_chunk VARCHAR2(32000);
    BEGIN
      DBMS_OUTPUT.PUT_LINE(p_label || ' ERROR ' || SQLCODE || ' : ' || SQLERRM);
      IF p_sql IS NULL THEN
        DBMS_OUTPUT.PUT_LINE(p_label || ' SQL: (null)');
        RETURN;
      END IF;
      l_len := NVL(DBMS_LOB.GETLENGTH(p_sql), 0);
      DBMS_OUTPUT.PUT_LINE(p_label || ' SQL length=' || l_len);
      WHILE l_pos <= l_len LOOP
        l_chunk := DBMS_LOB.SUBSTR(p_sql, 30000, l_pos);
        DBMS_OUTPUT.PUT_LINE(p_label || ' SQL[' || l_pos || ']: ' || l_chunk);
        l_pos := l_pos + 30000;
      END LOOP;
    END dump_sql_on_error;

    /* CALLQUERY executes the returned CLOB as SQL — must always be a SELECT, never a bare message */
    FUNCTION build_result_sql(p_result IN VARCHAR2, p_nmvt IN CLOB DEFAULT NULL) RETURN CLOB IS
    BEGIN
      IF p_nmvt IS NULL OR NVL(DBMS_LOB.GETLENGTH(p_nmvt), 0) = 0 THEN
        RETURN TO_CLOB(
          'SELECT ''' || REPLACE(NVL(p_result, 'ERROR'), '''', '''''') ||
          ''' RESULT, TO_CHAR(NULL) NMVT FROM DUAL');
      END IF;
      RETURN TO_CLOB(
        'SELECT ''' || REPLACE(NVL(p_result, 'ERROR'), '''', '''''') ||
        ''' RESULT, ''' || REPLACE(p_nmvt, '''', '''''') || ''' NMVT FROM DUAL');
    END build_result_sql;

    /* One INTMVTSTO line — pass site/item/pos (FOR-loop indexes are not visible in nested procs). */
    PROCEDURE insert_intmvt_line(p_site    IN NUMBER,
                                 p_item    IN VARCHAR2,
                                 p_lv      IN VARCHAR2,
                                 p_cinl    IN NUMBER,
                                 p_seqvl   IN NUMBER,
                                 p_pos     IN NUMBER,
                                 p_tmvt    IN NUMBER, /* 100=cost, 101=qty adj */
                                 p_motf    IN NUMBER,
                                 p_eqte    IN NUMBER,
                                 p_npre    IN NUMBER) IS
    BEGIN
      IF NOT l_nmvt_by_site.EXISTS(p_site) THEN
        EXECUTE IMMEDIATE
          'SELECT seq_stomvt.NEXTVAL@' || V_DBLINK || ' FROM dual'
          INTO l_nmvt;
        l_nmvt_by_site(p_site) := l_nmvt;
        l_line_by_site(p_site) := 0;
      END IF;
      l_line_by_site(p_site) := l_line_by_site(p_site) + 1;
      l_nmvt     := l_nmvt_by_site(p_site);
      l_ims_line := l_line_by_site(p_site);
      l_ims_flig := l_ims_flig + 1; /* INTMVTSTO_PK = (IMSFICH, IMSFLIG) */
      V_QUERYSQL :=
        'INSERT INTO INTMVTSTO@' || V_DBLINK ||
        '(IMSSITE, IMSTMVT, IMSNLIG, IMSNMVT, IMSDMVT, IMSCEXR, IMSCEXVL, IMSSEQVL, IMSCINL, ' ||
        ' IMSTPOS, IMSNPOS, IMSMOTF, IMSTTVA, IMSIMPU, IMSCTPT, IMSEQTE, IMSNQTE,  ' ||
        ' IMSNPDS, IMSEPAC, IMSEPRE, IMSVARE,IMSVAVE, IMSEPDS, IMSCORR, IMSPPRG, ' ||
        ' IMSNPRE, ' ||
        ' IMSITRT, IMSDTRT, IMSFICH, IMSFLIG, ' ||
        ' IMSDCRE, IMSDMAJ, IMSUTIL) ' ||
        'SELECT ' || p_site || ', ' || p_tmvt || ', ' || l_ims_line ||
        ', ' || l_nmvt || ', TRUNC(SYSDATE), ''' ||
        REPLACE(p_item, '''', '''''') || ''', ' ||
        TO_NUMBER(p_lv) || ', ' || p_seqvl || ', ' || p_cinl || ', ' ||
        p_pos || ', 0, ' || p_motf || ', -1, 0, -1,  ' || p_eqte || ', 0,  ' ||
        '0, 0, 0, 0, 0, 0, ''' || V_USERID || ''', ''' || V_USERID || ''', ' ||
        NVL(p_npre, 0) || ', 0, trunc(SYSDATE), ''' || V_FICH || ''', ' || l_ims_flig ||
        ', SYSDATE, SYSDATE, ''' || V_USERID || ''' FROM dual';
      EXECUTE IMMEDIATE V_QUERYSQL;
      COMMIT;
    END insert_intmvt_line;

  BEGIN
    V_PROGNAME := 'STOCKLAYER_EXECUTE';
    BEGIN
      V_QUERY_PARAM_ARRAY    := PKREQUESTMANAGER.STRINGTOARRAY(IN_PARAMETERS, ',');
      V_QUERY_SID_ARRAY      := PKREQUESTMANAGER.STRINGTOARRAY(IN_DATABASEID, ',');
      V_QUERY_LANGUAGE_ARRAY := PKREQUESTMANAGER.STRINGTOARRAY(IN_LANGUAGE, ',');
      V_DBLINK := V_QUERY_SID_ARRAY(1);

      V_FICH   := SUBSTR(IN_JSONFILE, 1, 50 - LENGTH(TO_CHAR(IN_JSONID)) - 1) || '_' || IN_JSONID;
      V_USERID := SUBSTR(IN_USERID, 1, 12 - LENGTH(TO_CHAR(IN_JSONID))) || IN_JSONID;

      BEGIN
        V_QUERYSQL := 'DELETE FROM ITFSTOCK@' || V_DBLINK || ' WHERE SKFFICH=''' || V_FICH || '''';
        EXECUTE IMMEDIATE V_QUERYSQL;
        V_QUERYSQL := 'DELETE FROM INTMVTSTO@' || V_DBLINK || ' WHERE IMSFICH=''' || V_FICH || '''';
        EXECUTE IMMEDIATE V_QUERYSQL;
        COMMIT;
      EXCEPTION
        WHEN OTHERS THEN
          dump_sql_on_error('STOCKLAYER_EXECUTE DELETE', V_QUERYSQL);
          l_out := build_result_sql('ERROR ' || SQLCODE || ' : ' || SQLERRM);
          ROLLBACK;
          RETURN l_out;
      END;

      OPEN cur_file;
      FETCH cur_file BULK COLLECT INTO l_files;
      CLOSE cur_file;

      FOR i IN 1 .. l_files.COUNT LOOP
        /* Site expansion — skip HQ (0) and test store (30) */
        IF UPPER(NVL(l_files(i).site_code, 'ALL')) IN ('ALL', '') THEN
          EXECUTE IMMEDIATE
            'SELECT socsite FROM sitdgene@' || V_DBLINK ||
            ' WHERE socsite NOT IN (0, 30)'
            BULK COLLECT INTO l_sites;
        ELSIF TO_NUMBER(l_files(i).site_code) IN (0, 30) THEN
          l_sites := t_num_tab();
        ELSE
          l_sites := t_num_tab();
          l_sites.EXTEND;
          l_sites(1) := TO_NUMBER(l_files(i).site_code);
        END IF;

        /* Position expansion 0–11 or single */
        IF UPPER(NVL(l_files(i).position, 'ALL')) IN ('ALL', '') THEN
          l_pos_from := 0;
          l_pos_to   := 11;
        ELSE
          l_pos_from := TO_NUMBER(l_files(i).position);
          l_pos_to   := l_pos_from;
        END IF;

        /* Exact ITEM_CODE + LV_CODE on ARTVL */
        BEGIN
          EXECUTE IMMEDIATE
            'SELECT arlcinluvc, arlseqvl FROM artvl@' || V_DBLINK ||
            ' WHERE arlcexr=:b1 AND TO_CHAR(arlcexvl)=:b2 AND ROWNUM=1'
            INTO l_cinl, l_seqvl
            USING l_files(i).item_code, l_files(i).lv_code;
        EXCEPTION
          WHEN NO_DATA_FOUND THEN
            l_out := build_result_sql(
              'ERROR: Unknown item/LV ' || l_files(i).item_code || '/' || l_files(i).lv_code);
            ROLLBACK;
            RETURN l_out;
          WHEN OTHERS THEN
            dump_sql_on_error('STOCKLAYER_EXECUTE ARTVL', TO_CLOB(SQLERRM));
            l_out := build_result_sql('ERROR ' || SQLCODE || ' : ' || SQLERRM);
            ROLLBACK;
            RETURN l_out;
        END;

        FOR l_s IN 1 .. l_sites.COUNT LOOP
          FOR l_p IN l_pos_from .. l_pos_to LOOP
            l_line := l_line + 1;

            EXECUTE IMMEDIATE
              'SELECT COUNT(1) FROM stocouch@' || V_DBLINK ||
              ' WHERE stosite=:b1 AND stocinl=:b2 AND stotpos=:b3 AND stonpos=0'
              INTO l_layer_cnt
              USING l_sites(l_s), l_cinl, l_p;

            IF l_layer_cnt = 0 THEN
              /* Scenario #1 — no layer → ITFSTOCK */
              V_QUERYSQL :=
                'INSERT INTO ITFSTOCK@' || V_DBLINK ||
                '(SKFCEXR, SKFCEXVL, SKFSITE, SKFTPOS, SKFNPOS, SKFDMVT, SKFQST, SKFPURP, SKFTRT, ' ||
                ' SKFDTRT, SKFDCRE, SKFDMAJ, SKFUTIL, SKFNLIG, SKFFICH, SKFERR, SKFMESS) ' ||
                'SELECT ''' || REPLACE(l_files(i).item_code, '''', '''''') || ''', ' ||
                TO_NUMBER(l_files(i).lv_code) || ', ' || l_sites(l_s) || ', ' || l_p ||
                ', 0, TRUNC(SYSDATE), ' ||                 l_files(i).qty || ', ' ||
                l_files(i).unit_cost || ', 0, TRUNC(SYSDATE), SYSDATE, SYSDATE, ''' || V_USERID || ''', ' || l_line ||
                ', ''' || V_FICH || ''', NULL, NULL FROM dual';
              BEGIN
                EXECUTE IMMEDIATE V_QUERYSQL;
                COMMIT;
              EXCEPTION
                WHEN OTHERS THEN
                  dump_sql_on_error('STOCKLAYER_EXECUTE INSERT', V_QUERYSQL);
                  l_out := build_result_sql('ERROR ' || SQLCODE || ' : ' || SQLERRM);
                  ROLLBACK;
                  RETURN l_out;
              END;
            ELSE
              /* Scenario #2 — layer exists → INTMVTSTO.
                 Cost (903) + purchase price (906), both IMSTMVT=100 / IMSNPRE=UNIT_COST.
                 If on-hand=0, sandwich with qty adj IMSTMVT=101 IMSMOTF=2 EQTE +1 / −1. */
              BEGIN
                EXECUTE IMMEDIATE
                  'SELECT NVL(SUM(NVL(storeai, 0) + NVL(storeal, 0) - NVL(storeav, 0) + ' ||
                  '               NVL(storeae, 0) + NVL(storeac, 0) - NVL(storear, 0)), 0) ' ||
                  '  FROM stocouch@' || V_DBLINK ||
                  ' WHERE stosite=:b1 AND stocinl=:b2 AND stotpos=:b3 AND stonpos=0'
                  INTO l_layer_qty
                  USING l_sites(l_s), l_cinl, l_p;
              EXCEPTION
                WHEN OTHERS THEN
                  l_layer_qty := 0;
              END;

              BEGIN
                IF NVL(l_layer_qty, 0) = 0 THEN
                  insert_intmvt_line(l_sites(l_s), l_files(i).item_code, l_files(i).lv_code,
                                    l_cinl, l_seqvl, l_p, 101, 2, 1, 0);
                END IF;
                /* Cost price */
                insert_intmvt_line(l_sites(l_s), l_files(i).item_code, l_files(i).lv_code,
                                  l_cinl, l_seqvl, l_p, 100, 903, 0, l_files(i).unit_cost);
                /* Purchase price */
                insert_intmvt_line(l_sites(l_s), l_files(i).item_code, l_files(i).lv_code,
                                  l_cinl, l_seqvl, l_p, 100, 906, 0, l_files(i).unit_cost);
                IF NVL(l_layer_qty, 0) = 0 THEN
                  insert_intmvt_line(l_sites(l_s), l_files(i).item_code, l_files(i).lv_code,
                                    l_cinl, l_seqvl, l_p, 101, 2, -1, 0);
                END IF;
              EXCEPTION
                WHEN OTHERS THEN
                  dump_sql_on_error('STOCKLAYER_EXECUTE INSERT', V_QUERYSQL);
                  l_out := build_result_sql('ERROR ' || SQLCODE || ' : ' || SQLERRM);
                  ROLLBACK;
                  RETURN l_out;
              END;
            END IF;
          END LOOP;
        END LOOP;
      END LOOP;

      UPDATE JSON_INBOUND
         SET JSONSTATUS   = 1,
             JSONDPROCESS = SYSDATE,
             JSONDMAJ     = SYSDATE,
             JSONUTIL     = IN_USERID
       WHERE JSONID = IN_JSONID;
      COMMIT;

      /* Source of truth for pssti06p: class:site:nmvt
         class = SITDGENE.SOCCMAG (0=warehouse, 10=store) */
      BEGIN
        EXECUTE IMMEDIATE
          'SELECT TO_CHAR(NVL(s.soccmag, 10)) || '':'' || TO_CHAR(i.imssite) || '':'' || TO_CHAR(i.imsnmvt)
             FROM (SELECT DISTINCT imssite, imsnmvt
                     FROM INTMVTSTO@' || V_DBLINK || '
                    WHERE imsfich = :b1) i
             JOIN sitdgene@' || V_DBLINK || ' s ON s.socsite = i.imssite
            ORDER BY i.imssite'
          BULK COLLECT INTO l_pairs
          USING V_FICH;
      EXCEPTION
        WHEN OTHERS THEN
          dump_sql_on_error('STOCKLAYER_EXECUTE NMVT LIST', TO_CLOB(SQLERRM));
          l_pairs := t_vc_tab();
      END;

      l_nmvt_csv := NULL;
      IF l_pairs IS NOT NULL THEN
        FOR l_idx IN 1 .. l_pairs.COUNT LOOP
          IF l_nmvt_csv IS NOT NULL THEN
            l_nmvt_csv := l_nmvt_csv || ',';
          END IF;
          l_nmvt_csv := l_nmvt_csv || l_pairs(l_idx);
        END LOOP;
      END IF;

      l_out := build_result_sql(V_USERID, l_nmvt_csv);
      COMMIT; /* ensure AT is idle before RETURN */
      RETURN l_out;
    EXCEPTION
      WHEN OTHERS THEN
        dump_sql_on_error('STOCKLAYER_EXECUTE', TO_CLOB(SQLERRM));
        l_out := build_result_sql('ERROR ' || SQLCODE || ' : ' || SQLERRM);
        ROLLBACK;
        RETURN l_out;
    END;
  END STOCKLAYER_EXECUTE;

  -- ****************************************************************************************
  -- Stock layer init in cost — collect errors (ITFSTOCK + INTMVTSTO)
  -- ****************************************************************************************
  FUNCTION STOCKLAYER_COLLECTERROR(IN_NUM_LOG    IN NUMBER,
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
    V_PROGNAME := 'STOCKLAYER_COLLECTERROR';
    BEGIN
      V_QUERY_PARAM_ARRAY    := PKREQUESTMANAGER.STRINGTOARRAY(IN_PARAMETERS, ',');
      V_QUERY_SID_ARRAY      := PKREQUESTMANAGER.STRINGTOARRAY(IN_DATABASEID, ',');
      V_QUERY_LANGUAGE_ARRAY := PKREQUESTMANAGER.STRINGTOARRAY(IN_LANGUAGE, ',');

      V_QUERYSQL :=
        ' WITH CHECK_RESULT AS ( ' ||
        '   SELECT TO_CHAR(SKFSITE) SITE_CODE, SKFCEXR ITEM_CODE, TO_CHAR(SKFCEXVL) LV_CODE, ' ||
        '          TO_CHAR(SKFTPOS) POSITION, TO_CHAR(SKFQST) QTY, ' ||
        '          TO_CHAR(SKFPURP) UNIT_COST, ' ||
        '          REPLACE(SKFMESS,'''''''','' '') COMMENTS ' ||
        '   FROM ITFSTOCK@' || V_QUERY_SID_ARRAY(1) ||
        '   WHERE SKFTRT IN (0,2) ' ||
        '   AND SKFFICH=SUBSTR(''' || IN_JSONFILE || ''',1,50-LENGTH(TO_CHAR(' || IN_JSONID ||
        '))-1) || ''_'' || ' || IN_JSONID ||
        '   UNION ALL ' ||
        '   SELECT TO_CHAR(IMSSITE) SITE_CODE, IMSCEXR ITEM_CODE, TO_CHAR(IMSCEXVL) LV_CODE, ' ||
        '          TO_CHAR(IMSTPOS) POSITION, TO_CHAR(IMSEQTE) QTY, ' ||
        '          TO_CHAR(IMSNPRE) UNIT_COST, ' ||
        '          REPLACE(IMSMESS,'''''''','' '') COMMENTS ' ||
        '   FROM INTMVTSTO@' || V_QUERY_SID_ARRAY(1) ||
        '   WHERE IMSITRT IN (0,2) ' ||
        '   AND IMSFICH=SUBSTR(''' || IN_JSONFILE || ''',1,50-LENGTH(TO_CHAR(' || IN_JSONID ||
        '))-1) || ''_'' || ' || IN_JSONID ||
        '   )';

      V_QUERYUPDATE :=
        'MERGE INTO json_inbound ' ||
        ' USING ( ' || V_QUERYSQL ||
        ' SELECT (SELECT listagg_clob (json_object(''SITE_CODE'' VALUE site_code FORMAT JSON, ' ||
        '                      ''ITEM_CODE'' VALUE item_code FORMAT JSON, ' ||
        '                      ''LV_CODE'' VALUE lv_code FORMAT JSON, ' ||
        '                      ''POSITION'' VALUE position FORMAT JSON, ' ||
        '                      ''QTY'' VALUE qty FORMAT JSON, ' ||
        '                      ''UNIT_COST'' VALUE unit_cost FORMAT JSON, ' ||
        '                      ''COMMENTS'' VALUE comments FORMAT JSON)) ' ||
        ' FROM CHECK_RESULT E) FINAL_JSON, ' ||
        ' (SELECT COUNT(1) FROM CHECK_RESULT T) FINAL_NBERROR ' ||
        ' FROM DUAL) ' ||
        ' ON (JSONID= ' || IN_JSONID || ')' ||
        ' WHEN MATCHED THEN ' ||
        ' UPDATE SET JSONERROR= ''['' || FINAL_JSON || '']'', ' ||
        '            JSONNBERROR= FINAL_NBERROR, ' ||
        '            JSONUTIL=''' || IN_USERID || ''',' ||
        '            JSONNBRECORD=(SELECT REGEXP_COUNT(JSONCONTENT,''ITEM_CODE'') FROM JSON_INBOUND WHERE JSONID=' ||
        IN_JSONID || '), ' ||
        '            JSONDMAJ=SYSDATE ';

      BEGIN
        EXECUTE IMMEDIATE V_QUERYUPDATE;
        COMMIT;
      EXCEPTION
        WHEN OTHERS THEN
          RETURN TO_CLOB(-2);
      END;

      V_QUERYSQL := V_QUERYSQL || ' SELECT * FROM CHECK_RESULT';
      RETURN V_QUERYSQL;
    END;
  END STOCKLAYER_COLLECTERROR;

-- =============================================================================
-- TRA_LABELS patch (run on DBs that already deployed 91_tra_labels_mass_update_screens.sql)
-- =============================================================================
-- See 91_tra_labels_mass_update_screens.sql S50.* block for full seed; re-run MERGE
-- for S50.TITLE, S50.MU.CD/CE/CF, S50.MU.SEL/STP0/WHEN/XLS after package deploy.
-- Update ICR_TEMPLATE018.xlsx: add POSITION column D; shift QTY→E, UNIT_COST→F.
