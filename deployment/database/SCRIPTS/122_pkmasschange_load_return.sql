-- =============================================================================
-- 122_pkmasschange_load_return.sql
-- Tool 24 — Load for return (INTDETRET + psint41p class 10 / 0)
--
-- Incremental patch — merge into PKMASSCHANGE package SPEC + BODY.
-- Pair with 121_mass_load_return.sql (menu / PARAMETERS / labels).
-- Canonical body also updated in 111_pkmasschange_ref_to_order.sql.
--
-- Excel / JSON columns (5):
--   SITE, VENDOR_CODE, ITEM_CODE, LV, QTY
--
-- Check:
--   1. Site exists in SITDGENE
--   2. Vendor exists in FOUDGENE (vendor code as entered — no AO rewrite)
--   3. Item + LV exists in ARTVL
--   4. Qty is numeric and > 0
--   5. Item/LV is or was orderable for that site→vendor
--      (ARTUC + pkresrel.isSiteBelongToNode — no date window)
--
-- Execute:
--   INSERT INTDETRET@dblink
--   IRFCEXRET ← PKDSD.generateBL(1)@dblink — one BL per SITE+VENDOR group
--   IRFCNUM / IRFNFILF ← latest ARTUC OA (lookup once per row into locals)
--   Store constants by SITDGENE.SOCCMAG:
--     10 store     → IRFTMODE=4, IRFRPHY=3, IRFMOTI=3,   IRFTYPE=1
--      0 warehouse → IRFTMODE=4, IRFRPHY=2, IRFMOTI=703, IRFTYPE=1
--   Angular executePlan runs:
--     psint41p … 10 -1 -u… HN 1
--     psint41p … 0  -1 -u… HN 1
--
-- Template        : ICR_TEMPLATE023.xlsx
-- Angular route   : /loadreturn  (toolID=24, screen SCR0000000092)
-- GOLD batch      : psint41p (class 10 then 0)
-- =============================================================================

SET DEFINE OFF;

/*
-- =============================================================================
-- BLOCK A — PACKAGE SPEC additions
-- =============================================================================
  FUNCTION LOADRETURN_CHECK(IN_NUM_LOG    IN NUMBER,
                            IN_JSONID     IN NUMBER,
                            IN_USERID     IN VARCHAR2,
                            IN_DATABASEID IN VARCHAR2,
                            IN_PARAMETERS IN VARCHAR2,
                            IN_LANGUAGE   IN VARCHAR2) RETURN CLOB;
  FUNCTION LOADRETURN_EXECUTE(IN_NUM_LOG    IN NUMBER,
                              IN_JSONID     IN NUMBER,
                              IN_JSONFILE   IN VARCHAR2,
                              IN_STARTDATE  IN VARCHAR2,
                              IN_TRACE      IN VARCHAR2,
                              IN_USERID     IN VARCHAR2,
                              IN_DATABASEID IN VARCHAR2,
                              IN_PARAMETERS IN VARCHAR2,
                              IN_LANGUAGE   IN VARCHAR2) RETURN CLOB;
  FUNCTION LOADRETURN_COLLECTERROR(IN_NUM_LOG    IN NUMBER,
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
  V_PT33_24_LOAD_RETURN           NUMBER := 24;

-- MAIN_CHECK (after NEWITEMPPG):
      IF (v_jsontool = V_PT33_24_LOAD_RETURN) THEN
        v_return := PKMASSCHANGE.LOADRETURN_CHECK(IN_NUM_LOG,
                                                  IN_JSONID,
                                                  IN_USERID,
                                                  IN_DATABASEID,
                                                  IN_PARAMETERS,
                                                  IN_LANGUAGE);
        RETURN v_return;
      END IF;

-- MAIN_EXECUTE:
      IF (v_jsontool = V_PT33_24_LOAD_RETURN) THEN
        v_return := PKMASSCHANGE.LOADRETURN_EXECUTE(IN_NUM_LOG,
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

-- MAIN_COLLECTERROR:
      IF (v_jsontool = V_PT33_24_LOAD_RETURN) THEN
        v_return := PKMASSCHANGE.LOADRETURN_COLLECTERROR(IN_NUM_LOG,
                                                         IN_JSONID,
                                                         IN_USERID,
                                                         IN_JSONFILE,
                                                         IN_DATABASEID,
                                                         IN_PARAMETERS,
                                                         IN_LANGUAGE);
        RETURN v_return;
      END IF;
*/

/*
-- =============================================================================
-- BLOCK C — Function bodies (paste before END PKMASSCHANGE in package body)
-- =============================================================================
  -- ****************************************************************************************
  -- Load for return (tool 24) — check
  -- Validates SITE (SITDGENE), VENDOR (FOUDGENE, vendor code as entered), ITEM+LV (ARTVL),
  -- QTY > 0, and item/LV is or was orderable for that site→vendor (ARTUC +
  -- pkresrel.isSiteBelongToNode — no date window, so expired OA still qualifies).
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
        '          TRIM(qty) QTY ' ||
        '   FROM json_table((SELECT JSONCONTENT FROM JSON_CHECK WHERE JSONID= ' || IN_JSONID || '), ''$[*]'' ' ||
        '                   COLUMNS ( site        PATH ''$.SITE'' ' ||
        '                           , vendor_code PATH ''$.VENDOR_CODE'' ' ||
        '                           , item_code   PATH ''$.ITEM_CODE'' ' ||
        '                           , lv          PATH ''$.LV'' ' ||
        '                           , qty         PATH ''$.QTY'' ' ||
        '                           )) ), ' ||
        '   CHECK_RESULT AS ( ' ||
        '   SELECT SITE, VENDOR_CODE, ITEM_CODE, LV, QTY, ' ||
        '     CASE ' ||
        '       WHEN NVL(LENGTH(SITE), 0) = 0 THEN ''SITE is required'' ' ||
        '       WHEN NVL(LENGTH(VENDOR_CODE), 0) = 0 THEN ''VENDOR_CODE is required'' ' ||
        '       WHEN NVL(LENGTH(ITEM_CODE), 0) = 0 THEN ''ITEM_CODE is required'' ' ||
        '       WHEN NVL(LENGTH(LV), 0) = 0 THEN ''LV is required'' ' ||
        '       WHEN NVL(LENGTH(QTY), 0) = 0 THEN ''QTY is required'' ' ||
        '       WHEN NOT REGEXP_LIKE(QTY, ''^[0-9]+([\.,][0-9]+)?$'') THEN ''QTY must be numeric'' ' ||
        /* Avoid TO_NUMBER in CASE (NLS / short-circuit risk) — reject zero / empty decimals */
        '       WHEN REGEXP_LIKE(REPLACE(QTY, '','', ''.''), ''^0+(\.0+)?$'') THEN ''QTY must be greater than 0'' ' ||
        '       WHEN NOT EXISTS (SELECT 1 FROM sitdgene@' || V_QUERY_SID_ARRAY(1) ||
        '                        WHERE TO_CHAR(socsite) = SITE) THEN ''Unknown store or warehouse'' ' ||
        '       WHEN NOT EXISTS (SELECT 1 FROM foudgene@' || V_QUERY_SID_ARRAY(1) ||
        '                        WHERE TO_CHAR(foucnuf) = VENDOR_CODE) THEN ''Unknown supplier'' ' ||
        '       WHEN NOT EXISTS (SELECT 1 FROM artvl@' || V_QUERY_SID_ARRAY(1) ||
        '                        WHERE arlcexr = ITEM_CODE AND TO_CHAR(arlcexvl) = LV) ' ||
        '         THEN ''Unknown item or pack (LV)'' ' ||
        /* Item/LV is or was orderable at SITE from VENDOR (any ARTUC period) */
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
        ' SELECT (SELECT listagg_clob (json_object(''SITE'' VALUE site FORMAT JSON, ' ||
        '                      ''VENDOR_CODE'' VALUE vendor_code FORMAT JSON, ' ||
        '                      ''ITEM_CODE'' VALUE item_code FORMAT JSON, ' ||
        '                      ''LV'' VALUE lv FORMAT JSON, ' ||
        '                      ''QTY'' VALUE qty FORMAT JSON, ' ||
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
          DBMS_OUTPUT.PUT_LINE('LOADRETURN_CHECK MERGE ERROR ' || SQLCODE || ' : ' || V_ERR);
          V_OUT := TO_CLOB(
            'SELECT NULL SITE, NULL VENDOR_CODE, NULL ITEM_CODE, NULL LV, NULL QTY, ''' ||
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
          'SELECT NULL SITE, NULL VENDOR_CODE, NULL ITEM_CODE, NULL LV, NULL QTY, ''' ||
          REPLACE(V_ERR, '''', '''''') || ''' COMMENTS FROM DUAL');
        ROLLBACK;
        RETURN V_OUT;
    END;
  END LOADRETURN_CHECK;

  -- ****************************************************************************************
  -- Load for return — execute (tool 24) → INTDETRET@dblink
  -- IRFCEXRET = PKDSD.generateBL(1)@dblink — one BL per SITE+VENDOR group.
  -- IRFCNUM / IRFNFILF from latest ARTUC OA (looked up once per row into locals).
  -- INTDETRET defaults ALWAYS from ICR_MASSLOAD_RULE (LOAD_TYPE=24):
  --   CONSTANT  → IRFTMODE / IRFTYPE / IRFDEVI / IRFCONS  (required)
  --   STORE     → IRFRPHY / IRFMOTI when SOCCMAG=10       (required)
  --   WAREHOUSE → IRFRPHY / IRFMOTI when SOCCMAG=0        (required)
  -- Angular then runs psint41p for class 10 and 0.
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
    C_LOAD_TYPE CONSTANT NUMBER := 24;

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
    V_SOCCMAG  NUMBER;
    V_IRFRPHY  NUMBER;
    V_IRFMOTI  NUMBER;
    V_IRFTMODE NUMBER;
    V_IRFTYPE  NUMBER;
    V_IRFDEVI  NUMBER;
    V_IRFCONS  NUMBER;
    V_CLOB_CONST CLOB;
    V_CLOB_STORE CLOB;
    V_CLOB_WH    CLOB;
    V_RULE_ERR   VARCHAR2(400);

    TYPE t_file_rec IS RECORD (
      site        VARCHAR2(20),
      vendor_code VARCHAR2(30),
      item_code   VARCHAR2(30),
      lv          VARCHAR2(20),
      qty         NUMBER
    );
    TYPE t_file_tab IS TABLE OF t_file_rec;
    TYPE t_num_by_key IS TABLE OF NUMBER INDEX BY VARCHAR2(80);

    l_files           t_file_tab;
    l_bl_by_sv        t_num_by_key;
    l_nolig_by_sv     t_num_by_key;
    l_soccmag_by_site t_num_by_key;

    CURSOR cur_file IS
      SELECT TRIM(jt.site) SITE,
             TRIM(jt.vendor_code) VENDOR_CODE,
             TRIM(jt.item_code) ITEM_CODE,
             TRIM(jt.lv) LV,
             TO_NUMBER(REPLACE(TRIM(jt.qty), ',', '.')) QTY
        FROM JSON_INBOUND ji,
             JSON_TABLE(ji.JSONCONTENT, '$[*]'
               COLUMNS (
                 site        PATH '$.SITE',
                 vendor_code PATH '$.VENDOR_CODE',
                 item_code   PATH '$.ITEM_CODE',
                 lv          PATH '$.LV',
                 qty         PATH '$.QTY'
               )) jt
       WHERE ji.JSONID = IN_JSONID;

    V_QUERY_SID_ARRAY      PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_PARAM_ARRAY    PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_LANGUAGE_ARRAY PKREQUESTMANAGER.PARAM_ARRAY;

    PROCEDURE load_rule_clob(p_scope VARCHAR2, p_clob OUT CLOB) IS
    BEGIN
      SELECT RULES_CLOB
        INTO p_clob
        FROM ICR_MASSLOAD_RULE
       WHERE LOAD_TYPE = C_LOAD_TYPE
         AND RULE_SCOPE = p_scope
         AND ACTIVE = 1
         AND ROWNUM = 1;
    EXCEPTION
      WHEN NO_DATA_FOUND THEN
        p_clob := NULL;
      WHEN OTHERS THEN
        p_clob := NULL;
    END load_rule_clob;

    /* Read a required numeric field from RULES_CLOB $.fields.<name> */
    FUNCTION rule_num(p_clob  CLOB,
                      p_scope VARCHAR2,
                      p_field VARCHAR2,
                      p_err   OUT VARCHAR2) RETURN NUMBER IS
      v_n NUMBER;
    BEGIN
      p_err := NULL;
      IF p_clob IS NULL THEN
        p_err := 'Missing active ICR_MASSLOAD_RULE for LOAD_TYPE=' ||
                 TO_CHAR(C_LOAD_TYPE) || ' RULE_SCOPE=' || p_scope ||
                 ' (Mass-load settings)';
        RETURN NULL;
      END IF;
      BEGIN
        CASE UPPER(p_field)
          WHEN 'IRFTMODE' THEN
            v_n := TO_NUMBER(JSON_VALUE(p_clob, '$.fields.IRFTMODE'));
          WHEN 'IRFTYPE' THEN
            v_n := TO_NUMBER(JSON_VALUE(p_clob, '$.fields.IRFTYPE'));
          WHEN 'IRFDEVI' THEN
            v_n := TO_NUMBER(JSON_VALUE(p_clob, '$.fields.IRFDEVI'));
          WHEN 'IRFCONS' THEN
            v_n := TO_NUMBER(JSON_VALUE(p_clob, '$.fields.IRFCONS'));
          WHEN 'IRFRPHY' THEN
            v_n := TO_NUMBER(JSON_VALUE(p_clob, '$.fields.IRFRPHY'));
          WHEN 'IRFMOTI' THEN
            v_n := TO_NUMBER(JSON_VALUE(p_clob, '$.fields.IRFMOTI'));
          ELSE
            p_err := 'Unsupported rule field ' || p_field;
            RETURN NULL;
        END CASE;
      EXCEPTION
        WHEN OTHERS THEN
          p_err := 'Invalid JSON field $.fields.' || p_field ||
                   ' in ICR_MASSLOAD_RULE RULE_SCOPE=' || p_scope;
          RETURN NULL;
      END;
      IF v_n IS NULL THEN
        p_err := 'ICR_MASSLOAD_RULE RULE_SCOPE=' || p_scope ||
                 ' missing $.fields.' || p_field;
        RETURN NULL;
      END IF;
      RETURN v_n;
    END rule_num;

  BEGIN
    V_PROGNAME := 'LOADRETURN_EXECUTE';
    BEGIN
      V_QUERY_PARAM_ARRAY    := PKREQUESTMANAGER.STRINGTOARRAY(IN_PARAMETERS, ',');
      V_QUERY_SID_ARRAY      := PKREQUESTMANAGER.STRINGTOARRAY(IN_DATABASEID, ',');
      V_QUERY_LANGUAGE_ARRAY := PKREQUESTMANAGER.STRINGTOARRAY(IN_LANGUAGE, ',');
      V_DBLINK := V_QUERY_SID_ARRAY(1);

      /* ICR_MASSLOAD_RULE — CONSTANT is mandatory */
      load_rule_clob('CONSTANT', V_CLOB_CONST);
      load_rule_clob('STORE', V_CLOB_STORE);
      load_rule_clob('WAREHOUSE', V_CLOB_WH);

      V_IRFTMODE := rule_num(V_CLOB_CONST, 'CONSTANT', 'IRFTMODE', V_RULE_ERR);
      IF V_RULE_ERR IS NOT NULL THEN RETURN 'ERROR: ' || V_RULE_ERR; END IF;
      V_IRFTYPE := rule_num(V_CLOB_CONST, 'CONSTANT', 'IRFTYPE', V_RULE_ERR);
      IF V_RULE_ERR IS NOT NULL THEN RETURN 'ERROR: ' || V_RULE_ERR; END IF;
      V_IRFDEVI := rule_num(V_CLOB_CONST, 'CONSTANT', 'IRFDEVI', V_RULE_ERR);
      IF V_RULE_ERR IS NOT NULL THEN RETURN 'ERROR: ' || V_RULE_ERR; END IF;
      V_IRFCONS := rule_num(V_CLOB_CONST, 'CONSTANT', 'IRFCONS', V_RULE_ERR);
      IF V_RULE_ERR IS NOT NULL THEN RETURN 'ERROR: ' || V_RULE_ERR; END IF;

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
          RETURN 'ERROR ' || SQLCODE || ' : ' || SQLERRM;
      END;

      OPEN cur_file;
      FETCH cur_file BULK COLLECT INTO l_files;
      CLOSE cur_file;

      FOR i IN 1 .. l_files.COUNT LOOP
        V_KEY := l_files(i).site || '|' || l_files(i).vendor_code;

        /* Site class — SITDGENE.SOCCMAG (10=store, 0=warehouse) */
        IF NOT l_soccmag_by_site.EXISTS(l_files(i).site) THEN
          BEGIN
            EXECUTE IMMEDIATE
              'SELECT NVL(soccmag, -1) FROM sitdgene@' || V_DBLINK ||
              ' WHERE TO_CHAR(socsite) = :b_site AND ROWNUM = 1'
              INTO V_SOCCMAG
              USING l_files(i).site;
          EXCEPTION
            WHEN NO_DATA_FOUND THEN
              RETURN 'ERROR: Unknown site ' || l_files(i).site;
            WHEN OTHERS THEN
              DBMS_OUTPUT.PUT_LINE('LOADRETURN_EXECUTE SOCCMAG ERROR ' || SQLCODE || ' : ' || SQLERRM);
              RETURN 'ERROR ' || SQLCODE || ' : ' || SQLERRM;
          END;
          l_soccmag_by_site(l_files(i).site) := V_SOCCMAG;
        END IF;
        V_SOCCMAG := l_soccmag_by_site(l_files(i).site);

        IF V_SOCCMAG = 10 THEN
          V_IRFRPHY := rule_num(V_CLOB_STORE, 'STORE', 'IRFRPHY', V_RULE_ERR);
          IF V_RULE_ERR IS NOT NULL THEN RETURN 'ERROR: ' || V_RULE_ERR; END IF;
          V_IRFMOTI := rule_num(V_CLOB_STORE, 'STORE', 'IRFMOTI', V_RULE_ERR);
          IF V_RULE_ERR IS NOT NULL THEN RETURN 'ERROR: ' || V_RULE_ERR; END IF;
        ELSIF V_SOCCMAG = 0 THEN
          V_IRFRPHY := rule_num(V_CLOB_WH, 'WAREHOUSE', 'IRFRPHY', V_RULE_ERR);
          IF V_RULE_ERR IS NOT NULL THEN RETURN 'ERROR: ' || V_RULE_ERR; END IF;
          V_IRFMOTI := rule_num(V_CLOB_WH, 'WAREHOUSE', 'IRFMOTI', V_RULE_ERR);
          IF V_RULE_ERR IS NOT NULL THEN RETURN 'ERROR: ' || V_RULE_ERR; END IF;
        ELSE
          RETURN 'ERROR: Site ' || l_files(i).site ||
                 ' has unsupported SOCCMAG=' || TO_CHAR(V_SOCCMAG) ||
                 ' (expected 10=store or 0=warehouse)';
        END IF;

        IF NOT l_bl_by_sv.EXISTS(V_KEY) THEN
          BEGIN
            EXECUTE IMMEDIATE
              'SELECT PKDSD.generateBL@' || V_DBLINK || '(1) FROM DUAL'
              INTO V_BL;
          EXCEPTION
            WHEN OTHERS THEN
              DBMS_OUTPUT.PUT_LINE('LOADRETURN_EXECUTE generateBL ERROR ' || SQLCODE || ' : ' || SQLERRM);
              RETURN 'ERROR ' || SQLCODE || ' : ' || SQLERRM;
          END;
          l_bl_by_sv(V_KEY)    := V_BL;
          l_nolig_by_sv(V_KEY) := 0;
        END IF;

        l_nolig_by_sv(V_KEY) := l_nolig_by_sv(V_KEY) + 1;
        V_NOLIGN := l_nolig_by_sv(V_KEY);
        V_BL     := l_bl_by_sv(V_KEY);

        /* Latest OA once — IRFCNUM (FCCNUM) + IRFNFILF (ARANFILF) */
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
            RETURN 'ERROR ' || SQLCODE || ' : ' || SQLERRM;
        END;

        V_FCCNUM   := NVL(V_FCCNUM, SUBSTR(l_files(i).vendor_code || 'CC', 1, 8));
        V_ARANFILF := NVL(V_ARANFILF, 0);

        /*
         * INTDETRET defaults from ICR_MASSLOAD_RULE (LOAD_TYPE=24):
         *   CONSTANT → IRFTMODE / IRFTYPE / IRFDEVI / IRFCONS
         *   STORE/WH → IRFRPHY / IRFMOTI
         *   IRFQRET = qty (SKU)
         */
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
                  V_IRFTMODE,
                  V_IRFDEVI,
                  V_IRFCONS,
                  TO_CHAR(V_NOLIGN),
                  l_files(i).item_code,
                  TO_NUMBER(l_files(i).lv),
                  l_files(i).qty,
                  V_IRFRPHY,
                  V_IRFMOTI,
                  V_USERID,
                  V_FICH,
                  V_LOGIN,
                  V_IRFTYPE;
        EXCEPTION
          WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('LOADRETURN_EXECUTE INSERT ERROR ' || SQLCODE || ' : ' || SQLERRM);
            RETURN 'ERROR ' || SQLCODE || ' : ' || SQLERRM;
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
        '          NVL(REPLACE(IRFMESS,'''''''','' ''), ''Return line not processed'') COMMENTS ' ||
        '   FROM INTDETRET@' || V_QUERY_SID_ARRAY(1) ||
        '   WHERE IRFFICH=''' || REPLACE(V_FICH, '''', '''''') || ''' ' ||
        '   AND (IRFTRT IN (0, 2) OR IRFNERR IS NOT NULL) ' ||
        '   )';

      V_QUERYUPDATE :=
        'MERGE INTO json_inbound ' ||
        ' USING ( ' || V_QUERYSQL ||
        ' SELECT (SELECT listagg_clob (json_object(''SITE'' VALUE site FORMAT JSON, ' ||
        '                      ''VENDOR_CODE'' VALUE vendor_code FORMAT JSON, ' ||
        '                      ''ITEM_CODE'' VALUE item_code FORMAT JSON, ' ||
        '                      ''LV'' VALUE lv FORMAT JSON, ' ||
        '                      ''QTY'' VALUE qty FORMAT JSON, ' ||
        '                      ''COMMENTS'' VALUE comments FORMAT JSON)) ' ||
        ' FROM CHECK_RESULT E) FINAL_JSON, ' ||
        ' (SELECT COUNT(1) FROM CHECK_RESULT T) FINAL_NBERROR ' ||
        ' FROM DUAL) ' ||
        ' ON (JSONID= ' || IN_JSONID || ')' ||
        ' WHEN MATCHED THEN ' ||
        ' UPDATE SET JSONERROR= NVL2(FINAL_JSON, ''['' || FINAL_JSON || '']'', ''[]''), ' ||
        '            JSONNBERROR= NVL(FINAL_NBERROR, 0), ' ||
        '            JSONUTIL=''' || IN_USERID || ''',' ||
        '            JSONNBRECORD=(SELECT REGEXP_COUNT(JSONCONTENT,''ITEM_CODE'') FROM JSON_INBOUND WHERE JSONID=' ||
        IN_JSONID || '), ' ||
        '            JSONDMAJ=SYSDATE ';

      BEGIN
        EXECUTE IMMEDIATE V_QUERYUPDATE;
        COMMIT;
      EXCEPTION
        WHEN OTHERS THEN
          DBMS_OUTPUT.PUT_LINE('LOADRETURN_COLLECTERROR ERROR ' || SQLCODE || ' : ' || SQLERRM);
          RETURN TO_CLOB(-2);
      END;

      V_QUERYSQL := V_QUERYSQL || ' SELECT * FROM CHECK_RESULT';
      RETURN V_QUERYSQL;
    END;
  END LOADRETURN_COLLECTERROR;


*/

PROMPT 122_pkmasschange_load_return.sql — apply BLOCK A/B/C into SPEC + BODY, or re-run updated 111.
PROMPT Also add LOADRETURN_* declarations to PACKAGE SPEC (BLOCK A).

SET DEFINE ON;
/
