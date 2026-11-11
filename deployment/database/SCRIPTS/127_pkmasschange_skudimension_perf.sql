-- =============================================================================
-- 127_pkmasschange_skudimension_perf.sql
-- Tool 7 — SKUDIMENSION_EXECUTE performance rewrite
--
-- Replace FUNCTION SKUDIMENSION_EXECUTE in the live PKMASSCHANGE package body
-- with the block below, then recompile the body.
--
-- Same SID convention as ITEMCTECH_EXECUTE / VARIABLEWEIGHT_EXECUTE:
--   V_QUERY_SID_ARRAY(1) = central (ARTUL / ARTUV / ARTCOCA / ARTRAC / ARTVL)
--   V_QUERY_SID_ARRAY(2) = stock when present (TB_ART), else (1)
--
-- Perf changes:
--   1. JSON_TABLE on d.JSONCONTENT (no nested CLOB SELECT)
--   2. Resolve UPC once (barcode → ARCCINV, else ARTCEXR → ARVCINV list)
--   3. UPDATE ARTUL/ARTUV by ARUCINL/ARVCINV (no OR EXISTS)
--   4. UPDATE TB_ART keyed by AR_CPROIN + AR_ILOGIS (barcode/ARTVL) or AR_CPROIN
-- =============================================================================

SET DEFINE OFF;
SET SCAN OFF;

PROMPT Paste the following FUNCTION into PKMASSCHANGE package body
PROMPT (replace existing SKUDIMENSION_EXECUTE), then SHOW ERRORS.
PROMPT

/*
  -- ****************************************************************************************
  -- This function is executing item - SKUDIMENSION change.
  -- ****************************************************************************************
  FUNCTION SKUDIMENSION_EXECUTE(IN_NUM_LOG    IN NUMBER,
                                IN_JSONID     IN NUMBER,
                                IN_JSONFILE   IN VARCHAR2,
                                IN_STARTDATE  IN VARCHAR2,
                                IN_TRACE      IN VARCHAR2,
                                IN_USERID     IN VARCHAR2,
                                IN_DATABASEID IN VARCHAR2,
                                IN_PARAMETERS IN VARCHAR2,
                                IN_LANGUAGE   IN VARCHAR2) RETURN CLOB IS
    PRAGMA AUTONOMOUS_TRANSACTION;

    V_PROGNAME    VARCHAR2(50);
    V_QUERYSQL    CLOB;
    V_QUERYUPDATE CLOB;
    V_USERID      VARCHAR2(12);

    V_QUERY_SID_ARRAY      PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_PARAM_ARRAY    PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_LANGUAGE_ARRAY PKREQUESTMANAGER.PARAM_ARRAY;

    V_DBLINK_CEN VARCHAR2(128);
    V_DBLINK_STK VARCHAR2(128);

    V_MEASURE_UNIT VARCHAR2(3);
    V_WEIGHT_UNIT  VARCHAR2(3);

    V_UPC     VARCHAR2(50);
    V_CINV    NUMBER;
    V_ARTCEXR VARCHAR2(50);
    V_FOUND   NUMBER; /* 1 = resolved via ARTCOCA barcode */

    CURSOR cur IS
      SELECT TRIM(jt.UPC) AS UPC,
             jt.WEIGHT,
             jt.WEIGHT_UNIT,
             jt.HEIGHT,
             jt.WIDTH,
             jt.DEPTH,
             jt.MEASURE_UNIT
        FROM JSON_INBOUND d,
             JSON_TABLE(d.JSONCONTENT,
                        '$[*]' COLUMNS(
                          UPC          PATH '$.UPC',
                          WEIGHT       PATH '$.WEIGHT',
                          WEIGHT_UNIT  PATH '$.WEIGHT_UNIT',
                          HEIGHT       PATH '$.HEIGHT',
                          WIDTH        PATH '$.WIDTH',
                          DEPTH        PATH '$.DEPTH',
                          MEASURE_UNIT PATH '$.MEASURE_UNIT'
                        )) jt
       WHERE d.JSONSTATUS = 0
         AND d.JSONTOOL = 7
         AND d.JSONID = IN_JSONID;

    TYPE interface_data_type IS TABLE OF cur%ROWTYPE;
    data_tab interface_data_type;

    TYPE t_cinv_rec IS RECORD (
      cinv    NUMBER,
      artcexr VARCHAR2(50)
    );
    TYPE t_cinv_tab IS TABLE OF t_cinv_rec;
    l_cinvs t_cinv_tab;

    TYPE t_lv_rec IS RECORD (
      cexr  VARCHAR2(50),
      cexvl NUMBER
    );
    TYPE t_lv_tab IS TABLE OF t_lv_rec;
    l_lvs t_lv_tab;
    k     PLS_INTEGER;
    j     PLS_INTEGER;

  BEGIN
    V_PROGNAME := 'SKUDIMENSION_EXECUTE';
    BEGIN
      V_QUERY_PARAM_ARRAY    := PKREQUESTMANAGER.STRINGTOARRAY(IN_PARAMETERS, ',');
      V_QUERY_SID_ARRAY      := PKREQUESTMANAGER.STRINGTOARRAY(IN_DATABASEID, ',');
      V_QUERY_LANGUAGE_ARRAY := PKREQUESTMANAGER.STRINGTOARRAY(IN_LANGUAGE, ',');

      /* Same SID split as ITEMCTECH_EXECUTE / VARIABLEWEIGHT_EXECUTE */
      V_DBLINK_CEN := V_QUERY_SID_ARRAY(1);
      IF V_QUERY_SID_ARRAY.COUNT > 1 THEN
        V_DBLINK_STK := V_QUERY_SID_ARRAY(2);
      ELSE
        V_DBLINK_STK := V_QUERY_SID_ARRAY(1);
      END IF;

      OPEN cur;
      FETCH cur BULK COLLECT INTO data_tab;
      CLOSE cur;

      FOR i IN 1 .. data_tab.COUNT LOOP
        V_UPC := data_tab(i).UPC;
        IF V_UPC IS NULL THEN
          CONTINUE;
        END IF;

        V_MEASURE_UNIT := SUBSTR(REGEXP_REPLACE(data_tab(i).MEASURE_UNIT, '\D', ''), 1, 3);
        V_WEIGHT_UNIT  := SUBSTR(REGEXP_REPLACE(data_tab(i).WEIGHT_UNIT, '\D', ''), 1, 3);

        /* Resolve UPC once: barcode first, else article code */
        l_cinvs := t_cinv_tab();
        V_FOUND := 0;
        BEGIN
          V_QUERYUPDATE :=
            'SELECT c.ARCCINV, r.ARTCEXR
               FROM ARTCOCA@' || V_DBLINK_CEN || ' c
               JOIN ARTUV@'   || V_DBLINK_CEN || ' u ON u.ARVCINV = c.ARCCINV
               JOIN ARTRAC@'  || V_DBLINK_CEN || ' r ON r.ARTCINR = u.ARVCINR
              WHERE c.ARCCODE = :1
                AND SYSDATE BETWEEN c.ARCDDEB AND c.ARCDFIN
                AND ROWNUM = 1';
          EXECUTE IMMEDIATE V_QUERYUPDATE INTO V_CINV, V_ARTCEXR USING V_UPC;
          l_cinvs.EXTEND;
          l_cinvs(1).cinv    := V_CINV;
          l_cinvs(1).artcexr := V_ARTCEXR;
          V_FOUND := 1;
        EXCEPTION
          WHEN NO_DATA_FOUND THEN
            V_FOUND := 0;
        END;

        IF V_FOUND = 0 THEN
          BEGIN
            V_QUERYUPDATE :=
              'SELECT u.ARVCINV, r.ARTCEXR
                 FROM ARTRAC@' || V_DBLINK_CEN || ' r
                 JOIN ARTUV@'  || V_DBLINK_CEN || ' u ON u.ARVCINR = r.ARTCINR
                WHERE r.ARTCEXR = :1';
            EXECUTE IMMEDIATE V_QUERYUPDATE BULK COLLECT INTO l_cinvs USING V_UPC;
          EXCEPTION
            WHEN OTHERS THEN
              l_cinvs := t_cinv_tab();
          END;
        END IF;

        IF l_cinvs IS NULL OR l_cinvs.COUNT = 0 THEN
          CONTINUE;
        END IF;

        /* ARTUL + ARTUV by internal CINV */
        FOR j IN 1 .. l_cinvs.COUNT LOOP
          V_CINV    := l_cinvs(j).cinv;
          V_ARTCEXR := l_cinvs(j).artcexr;

          IF data_tab(i).WEIGHT_UNIT IS NULL THEN
            V_QUERYUPDATE :=
              'UPDATE ARTUL@' || V_DBLINK_CEN || '
                  SET ARUHAUT = ROUND(:1,2),
                      ARULONG = ROUND(:2,2),
                      ARULARG = ROUND(:3,2),
                      ARUUMES = :4,
                      ARUDMAJ = (SYSDATE-2),
                      ARUUTIL = :5
                WHERE ARUCINL = :6';
            EXECUTE IMMEDIATE V_QUERYUPDATE
              USING data_tab(i).HEIGHT,
                    data_tab(i).WIDTH,
                    data_tab(i).DEPTH,
                    V_MEASURE_UNIT,
                    IN_USERID,
                    V_CINV;
          ELSE
            V_QUERYUPDATE :=
              'UPDATE ARTUL@' || V_DBLINK_CEN || '
                  SET ARUHAUT = ROUND(:1,2),
                      ARULONG = ROUND(:2,2),
                      ARULARG = ROUND(:3,2),
                      ARUPBRU = :4,
                      ARUUPDS = :5,
                      ARUUMES = :6,
                      ARUDMAJ = (SYSDATE-2),
                      ARUUTIL = :7
                WHERE ARUCINL = :8';
            EXECUTE IMMEDIATE V_QUERYUPDATE
              USING data_tab(i).HEIGHT,
                    data_tab(i).WIDTH,
                    data_tab(i).DEPTH,
                    data_tab(i).WEIGHT,
                    V_WEIGHT_UNIT,
                    V_MEASURE_UNIT,
                    IN_USERID,
                    V_CINV;
          END IF;

          BEGIN
            V_QUERYUPDATE :=
              'UPDATE ARTUV@' || V_DBLINK_CEN || '
                  SET ARVDMAJ = (SYSDATE-2),
                      ARVUTIL = :1
                WHERE ARVCINV = :2';
            EXECUTE IMMEDIATE V_QUERYUPDATE USING IN_USERID, V_CINV;
          EXCEPTION
            WHEN OTHERS THEN
              DBMS_OUTPUT.PUT_LINE('ERROR ' || SQLCODE || ' : ' || SQLERRM);
              RETURN 'ERROR ' || SQLCODE || ' : ' || SQLERRM;
          END;
        END LOOP;

        /* TB_ART on stock SID */
        BEGIN
          IF V_FOUND = 1 THEN
            V_QUERYUPDATE :=
              'SELECT ARLCEXR, ARLCEXVL
                 FROM ARTVL@' || V_DBLINK_CEN || '
                WHERE ARLCINLUVC = :1';
            EXECUTE IMMEDIATE V_QUERYUPDATE BULK COLLECT INTO l_lvs USING l_cinvs(1).cinv;
            FOR k IN 1 .. NVL(l_lvs.COUNT, 0) LOOP
              V_QUERYUPDATE :=
                'UPDATE TB_ART@' || V_DBLINK_STK || '
                    SET AR_UVHA  = ROUND(:1,2),
                        AR_UVLA  = ROUND(:2,2),
                        AR_UVLO  = ROUND(:3,2),
                        AR_DATMOD = (SYSDATE-2),
                        AR_UTIMOD = :4
                  WHERE AR_CPROIN = :5
                    AND TO_NUMBER(AR_ILOGIS) = :6';
              EXECUTE IMMEDIATE V_QUERYUPDATE
                USING data_tab(i).HEIGHT,
                      data_tab(i).WIDTH,
                      data_tab(i).DEPTH,
                      IN_USERID,
                      l_lvs(k).cexr,
                      l_lvs(k).cexvl;
            END LOOP;
          ELSE
            V_ARTCEXR := l_cinvs(1).artcexr;
            V_QUERYUPDATE :=
              'UPDATE TB_ART@' || V_DBLINK_STK || '
                  SET AR_UVHA  = ROUND(:1,2),
                      AR_UVLA  = ROUND(:2,2),
                      AR_UVLO  = ROUND(:3,2),
                      AR_DATMOD = (SYSDATE-2),
                      AR_UTIMOD = :4
                WHERE AR_CPROIN = :5';
            EXECUTE IMMEDIATE V_QUERYUPDATE
              USING data_tab(i).HEIGHT,
                    data_tab(i).WIDTH,
                    data_tab(i).DEPTH,
                    IN_USERID,
                    V_ARTCEXR;
          END IF;
        EXCEPTION
          WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('ERROR ' || SQLCODE || ' : ' || SQLERRM);
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
          DBMS_OUTPUT.PUT_LINE('ERROR ' || SQLCODE || ' : ' || SQLERRM);
          RETURN 'ERROR ' || SQLCODE || ' : ' || SQLERRM;
      END;

      V_QUERYSQL := ' SELECT ''' || V_USERID || ''' RESULT FROM DUAL';
      RETURN V_QUERYSQL;

    EXCEPTION
      WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('ERROR ' || SQLCODE || ' : ' || SQLERRM);
        RETURN 'ERROR ' || SQLCODE || ' : ' || SQLERRM;
    END;
  END SKUDIMENSION_EXECUTE;
*/

PROMPT Optional on stock DB (article-code TB_ART path):
PROMPT   CREATE INDEX TB_ART_CPROIN ON TB_ART (AR_CPROIN);
/
