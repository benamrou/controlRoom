-- =============================================================================
-- 110_pallet_sscc_trace_libquery.sql
-- Pallet/SSCC traceability (S87) — LIBQUERY WHS0000009–WHS0000011
--
-- Deploy against: ICR application database
-- Data: GOLD STOCK via @HEINENS_STK_PROD
--
-- Quote delimiter: q'!...!' (avoid q'[...]' — JSON [*] breaks it)
-- Long QUERYSQL: TO_CLOB(q'!...!') || TO_CLOB(q'!...!') to avoid ORA-01704
-- Writes use PL/SQL UPDATE/INSERT/DELETE (MERGE@dblink often raises ORA-00900)
-- =============================================================================

SET DEFINE OFF;
SET SQLBLANKLINES ON;

DELETE FROM LIBQUERY WHERE QUERYNUM IN ('WHS0000009', 'WHS0000010', 'WHS0000011');

-- WHS0000009 — Search SSCC lines + pivoted DLC/LOF (live UNION archive)
-- QUERYSQL split with TO_CLOB to avoid ORA-01704 (literal > 4000 bytes)
INSERT INTO LIBQUERY (
  QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'WHS0000009',
       'Pallet/SSCC trace - search',
       'Live+archive SSCC. Flow: OE/HO_TYPEOR else UL/HL_TYPCDE. Shipped store/PO: UL/HL_NUMORL+DONORD → TB_ECDE/TB_HECDE. :param1=SSCC,:param2=item,:param3=PO,:param4=flow,:param5=missing,:param6=whs,:param7=vendor.',
       TO_CLOB(q'!
SELECT q."Whs #",
       q."Store #",
       q."SSCC",
       q."Pkg SSCC",
       q."Line",
       q."Item",
       q."Item desc.",
       q."PO #",
       q."Flow",
       q."Flow code",
       q."Received on",
       q."UBD",
       q."Prod lot",
       q."Has UBD",
       q."Has LOF",
       q."SV",
       q."LV",
       q."OR #",
       q."OL #",
       q."Source"
  FROM (
    /* ---- LIVE (current stock) ---- */
    SELECT l.UL_DONORD AS "Whs #",
           NVL(c.CD_REFCLI, ' ') AS "Store #",
           e.UE_USSCC AS "SSCC",
           l.UL_CSSCC AS "Pkg SSCC",
           l.UL_NUMLIG AS "Line",
           l.UL_CPROIN AS "Item",
           NVL(a.AR_LIBPRO, ' ') AS "Item desc.",
           /* Receipt PO, else shipment PO from delivery order */
           NVL(r.OE_NCDEFO, NVL(c.CD_NCDEFO, ' ')) AS "PO #",
           CASE TRIM(NVL(r.OE_TYPEOR, l.UL_TYPCDE))
             WHEN '8' THEN 'Allotment'
             WHEN '1' THEN 'In-stock'
             ELSE NVL(TRIM(NVL(r.OE_TYPEOR, l.UL_TYPCDE)), ' ')
           END AS "Flow",
           NVL(r.OE_TYPEOR, l.UL_TYPCDE) AS "Flow code",
           TO_CHAR(TRUNC(e.UE_DATREC), 'MM/DD/YYYY') AS "Received on",
           NVL(dlc.UT_VALIND, ' ') AS "UBD",
           NVL(lof.UT_VALIND, ' ') AS "Prod lot",
           CASE WHEN dlc.UT_USSCC IS NULL THEN 0 ELSE 1 END AS "Has UBD",
           CASE WHEN lof.UT_USSCC IS NULL THEN 0 ELSE 1 END AS "Has LOF",
           l.UL_ARPROM AS "SV",
           l.UL_ILOGIS AS "LV",
           NVL(l.UL_NUMORC, 0) AS "OR #",
           NVL(l.UL_NUMORL, 0) AS "OL #",
           'LIVE' AS "Source",
           e.UE_DATREC AS sort_dat
      FROM TB_EUMS@HEINENS_STK_PROD e
      JOIN TB_LCUMS@HEINENS_STK_PROD l
        ON l.UL_USSCC = e.UE_USSCC
      LEFT JOIN TB_EREC@HEINENS_STK_PROD r
        ON NVL(l.UL_NUMORC, 0) <> 0
       AND r.OE_NUMORC = l.UL_NUMORC
      /* Shipped pallet: delivery order → store + shipment PO */
      LEFT JOIN TB_ECDE@HEINENS_STK_PROD c
        ON NVL(l.UL_NUMORL, 0) <> 0
       AND c.CD_NUMORL = l.UL_NUMORL
       AND c.CD_DONORD = l.UL_DONORD
      LEFT JOIN TB_TRAUMS@HEINENS_STK_PROD dlc
        ON dlc.UT_USSCC = l.UL_USSCC
       AND dlc.UT_CSSCC = l.UL_CSSCC
       AND dlc.UT_NUMLIG = l.UL_NUMLIG
       AND dlc.UT_TYPIND = 'DLC'
      LEFT JOIN TB_TRAUMS@HEINENS_STK_PROD lof
        ON lof.UT_USSCC = l.UL_USSCC
       AND lof.UT_CSSCC = l.UL_CSSCC
       AND lof.UT_NUMLIG = l.UL_NUMLIG
       AND lof.UT_TYPIND = 'LOF'
      LEFT JOIN TB_ART@HEINENS_STK_PROD a
        ON a.AR_CPROIN = l.UL_CPROIN
       AND a.AR_ILOGIS = l.UL_ILOGIS
       AND a.AR_ARPROM = l.UL_ARPROM
       AND a.AR_DONORD = l.UL_DONORD
     WHERE (:param1 = '-1' OR e.UE_USSCC LIKE :param1 || '%')
       AND (:param2 = '-1' OR l.UL_CPROIN = :param2)
       AND (:param3 = '-1'
            OR r.OE_NCDEFO = :param3
            OR c.CD_NCDEFO = :param3)
       AND (:param4 = '-1'
            OR (:param4 = 'A' AND TRIM(NVL(r.OE_TYPEOR, l.UL_TYPCDE)) = '8')
            OR (:param4 = 'I' AND TRIM(NVL(r.OE_TYPEOR, l.UL_TYPCDE)) = '1'))
       AND (:param5 = '-1'
            OR (:param5 = 'BOTH' AND dlc.UT_USSCC IS NULL AND lof.UT_USSCC IS NULL)
            OR (:param5 = 'DLC'  AND dlc.UT_USSCC IS NULL)
            OR (:param5 = 'LOF'  AND lof.UT_USSCC IS NULL))
       AND (:param6 = '-1' OR TO_CHAR(l.UL_DONORD) = TO_CHAR(:param6))
       AND (:param7 = '-1'
            OR TO_CHAR(NVL(r.OE_FOURN, a.AR_FOURN)) = TO_CHAR(:param7))
!') || TO_CLOB(q'!
    UNION ALL

    /* ---- ARCHIVE (daily historized) ---- */
    SELECT hl.HL_DONORD AS "Whs #",
           NVL(hc.HD_REFCLI, ' ') AS "Store #",
           he.HE_USSCC AS "SSCC",
           hl.HL_CSSCC AS "Pkg SSCC",
           hl.HL_NUMLIG AS "Line",
           hl.HL_CPROIN AS "Item",
           NVL(a.AR_LIBPRO, ' ') AS "Item desc.",
           NVL(hr.HO_NCDEFO, NVL(hc.HD_NCDEFO, ' ')) AS "PO #",
           CASE TRIM(NVL(hr.HO_TYPEOR, hl.HL_TYPCDE))
             WHEN '8' THEN 'Allotment'
             WHEN '1' THEN 'In-stock'
             ELSE NVL(TRIM(NVL(hr.HO_TYPEOR, hl.HL_TYPCDE)), ' ')
           END AS "Flow",
           NVL(hr.HO_TYPEOR, hl.HL_TYPCDE) AS "Flow code",
           TO_CHAR(TRUNC(he.HE_DATREC), 'MM/DD/YYYY') AS "Received on",
           NVL(hdlc.HT_VALIND, ' ') AS "UBD",
           NVL(hlof.HT_VALIND, ' ') AS "Prod lot",
           CASE WHEN hdlc.HT_USSCC IS NULL THEN 0 ELSE 1 END AS "Has UBD",
           CASE WHEN hlof.HT_USSCC IS NULL THEN 0 ELSE 1 END AS "Has LOF",
           hl.HL_ARPROM AS "SV",
           hl.HL_ILOGIS AS "LV",
           NVL(hl.HL_NUMORC, 0) AS "OR #",
           NVL(hl.HL_NUMORL, 0) AS "OL #",
           'ARCHIVE' AS "Source",
           he.HE_DATREC AS sort_dat
      FROM TB_HEUMS@HEINENS_STK_PROD he
      JOIN TB_HLCUMS@HEINENS_STK_PROD hl
        ON hl.HL_USSCC = he.HE_USSCC
      LEFT JOIN TB_HEREC@HEINENS_STK_PROD hr
        ON NVL(hl.HL_NUMORC, 0) <> 0
       AND hr.HO_NUMORC = hl.HL_NUMORC
      LEFT JOIN TB_HECDE@HEINENS_STK_PROD hc
        ON NVL(hl.HL_NUMORL, 0) <> 0
       AND hc.HD_NUMORL = hl.HL_NUMORL
       AND hc.HD_DONORD = hl.HL_DONORD
      LEFT JOIN TB_HTRAUMS@HEINENS_STK_PROD hdlc
        ON hdlc.HT_USSCC = hl.HL_USSCC
       AND hdlc.HT_CSSCC = hl.HL_CSSCC
       AND hdlc.HT_NUMLIG = hl.HL_NUMLIG
       AND hdlc.HT_TYPIND = 'DLC'
      LEFT JOIN TB_HTRAUMS@HEINENS_STK_PROD hlof
        ON hlof.HT_USSCC = hl.HL_USSCC
       AND hlof.HT_CSSCC = hl.HL_CSSCC
       AND hlof.HT_NUMLIG = hl.HL_NUMLIG
       AND hlof.HT_TYPIND = 'LOF'
      LEFT JOIN TB_ART@HEINENS_STK_PROD a
        ON a.AR_CPROIN = hl.HL_CPROIN
       AND a.AR_ILOGIS = hl.HL_ILOGIS
       AND a.AR_ARPROM = hl.HL_ARPROM
       AND a.AR_DONORD = hl.HL_DONORD
     WHERE (:param1 = '-1' OR he.HE_USSCC LIKE :param1 || '%')
       AND (:param2 = '-1' OR hl.HL_CPROIN = :param2)
       AND (:param3 = '-1'
            OR hr.HO_NCDEFO = :param3
            OR hc.HD_NCDEFO = :param3)
       AND (:param4 = '-1'
            OR (:param4 = 'A' AND TRIM(NVL(hr.HO_TYPEOR, hl.HL_TYPCDE)) = '8')
            OR (:param4 = 'I' AND TRIM(NVL(hr.HO_TYPEOR, hl.HL_TYPCDE)) = '1'))
       AND (:param5 = '-1'
            OR (:param5 = 'BOTH' AND hdlc.HT_USSCC IS NULL AND hlof.HT_USSCC IS NULL)
            OR (:param5 = 'DLC'  AND hdlc.HT_USSCC IS NULL)
            OR (:param5 = 'LOF'  AND hlof.HT_USSCC IS NULL))
       AND (:param6 = '-1' OR TO_CHAR(hl.HL_DONORD) = TO_CHAR(:param6))
       AND (:param7 = '-1'
            OR TO_CHAR(NVL(hr.HO_FOURN, a.AR_FOURN)) = TO_CHAR(:param7))
  ) q
 ORDER BY q.sort_dat DESC NULLS LAST, q."SSCC", q."Line"
!'),
       ':param1=sscc,:param2=item,:param3=po,:param4=flow,:param5=missing,:param6=whs,:param7=vendor',
       'WHS #,STORE #,SSCC,PKG SSCC,LINE,ITEM,ITEM DESC.,PO #,FLOW,FLOW CODE,RECEIVED ON,UBD,PROD LOT,HAS UBD,HAS LOF,SV,LV,OR #,OL #,SOURCE',
       1, 0, 0
  FROM dual;

-- WHS0000010 — add/edit TB_TRAUMS or TB_HTRAUMS (UPDATE then INSERT; no MERGE@dblink)
INSERT INTO LIBQUERY (
  QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'WHS0000010',
       'Pallet/SSCC trace - save indicator',
       'UPDATE/INSERT live TB_TRAUMS or archive TB_HTRAUMS. Body: USSCC,CSSCC,NUMLIG,TYPIND,VALIND,USERID,SOURCE(LIVE|ARCHIVE).',
       q'!
DECLARE
  v_ok     NUMBER;
  v_source VARCHAR2(10);
  CURSOR c_rows IS
    SELECT TRIM(j.USSCC) AS USSCC,
           TRIM(j.CSSCC) AS CSSCC,
           TO_NUMBER(j.NUMLIG) AS NUMLIG,
           UPPER(TRIM(j.TYPIND)) AS TYPIND,
           TRIM(j.VALIND) AS VALIND,
           SUBSTR(TRIM(j.USERID), 1, 35) AS USERID,
           NVL(UPPER(TRIM(j.SOURCE)), 'LIVE') AS SOURCE
      FROM REQUEST_QUERY_BODY rb,
           JSON_TABLE(rb.REQUESTBODY, '$.values[*]'
             COLUMNS (
               USSCC  VARCHAR2(18) PATH '$."USSCC"',
               CSSCC  VARCHAR2(18) PATH '$."CSSCC"',
               NUMLIG VARCHAR2(10) PATH '$."NUMLIG"',
               TYPIND VARCHAR2(5)  PATH '$."TYPIND"',
               VALIND VARCHAR2(30) PATH '$."VALIND"',
               USERID VARCHAR2(35) PATH '$."USERID"',
               SOURCE VARCHAR2(10) PATH '$."SOURCE"'
             )
           ) j
     WHERE rb.REQUESTID = :param1
       AND TRIM(j.USSCC) IS NOT NULL
       AND UPPER(TRIM(j.TYPIND)) IN ('DLC', 'LOF')
       AND TRIM(j.VALIND) IS NOT NULL;
BEGIN
  FOR r IN c_rows LOOP
    v_source := CASE WHEN r.SOURCE = 'ARCHIVE' THEN 'ARCHIVE' ELSE 'LIVE' END;

    IF v_source = 'ARCHIVE' THEN
      SELECT COUNT(*)
        INTO v_ok
        FROM TB_HEUMS@HEINENS_STK_PROD he
        JOIN TB_HLCUMS@HEINENS_STK_PROD hl
          ON hl.HL_USSCC = he.HE_USSCC
       WHERE he.HE_USSCC = r.USSCC
         AND hl.HL_CSSCC = r.CSSCC
         AND hl.HL_NUMLIG = r.NUMLIG;
      IF v_ok = 0 THEN
        RAISE_APPLICATION_ERROR(-20087,
          'Archived SSCC line not found on HEUMS/HLCUMS. Traceability cannot be changed.');
      END IF;

      UPDATE TB_HTRAUMS@HEINENS_STK_PROD t
         SET t.HT_VALIND = r.VALIND,
             t.HT_DATMOD = SYSDATE,
             t.HT_UTIMOD = r.USERID
       WHERE t.HT_USSCC  = r.USSCC
         AND t.HT_CSSCC  = r.CSSCC
         AND t.HT_NUMLIG = r.NUMLIG
         AND t.HT_TYPIND = r.TYPIND;
      IF SQL%ROWCOUNT = 0 THEN
        INSERT INTO TB_HTRAUMS@HEINENS_STK_PROD (
          HT_USSCC, HT_CSSCC, HT_NUMLIG, HT_TYPIND, HT_VALIND,
          HT_VALGST, HT_DATCRE, HT_DATMOD, HT_UTIMOD
        ) VALUES (
          r.USSCC, r.CSSCC, r.NUMLIG, r.TYPIND, r.VALIND,
          1, SYSDATE, SYSDATE, r.USERID
        );
      END IF;
    ELSE
      SELECT COUNT(*)
        INTO v_ok
        FROM TB_EUMS@HEINENS_STK_PROD e
        JOIN TB_LCUMS@HEINENS_STK_PROD l
          ON l.UL_USSCC = e.UE_USSCC
       WHERE e.UE_USSCC = r.USSCC
         AND l.UL_CSSCC = r.CSSCC
         AND l.UL_NUMLIG = r.NUMLIG;
      IF v_ok = 0 THEN
        RAISE_APPLICATION_ERROR(-20087,
          'SSCC line not found on EUMS/LCUMS. Traceability cannot be changed without a pallet line.');
      END IF;

      UPDATE TB_TRAUMS@HEINENS_STK_PROD t
         SET t.UT_VALIND = r.VALIND,
             t.UT_DATMOD = SYSDATE,
             t.UT_UTIMOD = r.USERID
       WHERE t.UT_USSCC  = r.USSCC
         AND t.UT_CSSCC  = r.CSSCC
         AND t.UT_NUMLIG = r.NUMLIG
         AND t.UT_TYPIND = r.TYPIND;
      IF SQL%ROWCOUNT = 0 THEN
        INSERT INTO TB_TRAUMS@HEINENS_STK_PROD (
          UT_USSCC, UT_CSSCC, UT_NUMLIG, UT_TYPIND, UT_VALIND,
          UT_VALGST, UT_DATCRE, UT_DATMOD, UT_UTIMOD
        ) VALUES (
          r.USSCC, r.CSSCC, r.NUMLIG, r.TYPIND, r.VALIND,
          1, SYSDATE, SYSDATE, r.USERID
        );
      END IF;
    END IF;
  END LOOP;
  COMMIT;
END;
!',
       ':param1=REQUESTID',
       '',
       1, 0, 1
  FROM dual;

-- WHS0000011 — hard DELETE TB_TRAUMS or TB_HTRAUMS
INSERT INTO LIBQUERY (
  QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'WHS0000011',
       'Pallet/SSCC trace - DELETE indicator',
       'Hard DELETE from live TB_TRAUMS or archive TB_HTRAUMS. Body: USSCC,CSSCC,NUMLIG,TYPIND,SOURCE(LIVE|ARCHIVE).',
       q'!
DECLARE
  v_ok     NUMBER;
  v_source VARCHAR2(10);
  CURSOR c_rows IS
    SELECT TRIM(j.USSCC) AS USSCC,
           TRIM(j.CSSCC) AS CSSCC,
           TO_NUMBER(j.NUMLIG) AS NUMLIG,
           UPPER(TRIM(j.TYPIND)) AS TYPIND,
           NVL(UPPER(TRIM(j.SOURCE)), 'LIVE') AS SOURCE
      FROM REQUEST_QUERY_BODY rb,
           JSON_TABLE(rb.REQUESTBODY, '$.values[*]'
             COLUMNS (
               USSCC  VARCHAR2(18) PATH '$."USSCC"',
               CSSCC  VARCHAR2(18) PATH '$."CSSCC"',
               NUMLIG VARCHAR2(10) PATH '$."NUMLIG"',
               TYPIND VARCHAR2(5)  PATH '$."TYPIND"',
               SOURCE VARCHAR2(10) PATH '$."SOURCE"'
             )
           ) j
     WHERE rb.REQUESTID = :param1
       AND TRIM(j.USSCC) IS NOT NULL
       AND UPPER(TRIM(j.TYPIND)) IN ('DLC', 'LOF');
BEGIN
  FOR r IN c_rows LOOP
    v_source := CASE WHEN r.SOURCE = 'ARCHIVE' THEN 'ARCHIVE' ELSE 'LIVE' END;

    IF v_source = 'ARCHIVE' THEN
      SELECT COUNT(*)
        INTO v_ok
        FROM TB_HEUMS@HEINENS_STK_PROD he
        JOIN TB_HLCUMS@HEINENS_STK_PROD hl
          ON hl.HL_USSCC = he.HE_USSCC
       WHERE he.HE_USSCC = r.USSCC
         AND hl.HL_CSSCC = r.CSSCC
         AND hl.HL_NUMLIG = r.NUMLIG;
      IF v_ok = 0 THEN
        RAISE_APPLICATION_ERROR(-20087,
          'Archived SSCC line not found on HEUMS/HLCUMS. Traceability cannot be changed.');
      END IF;

      DELETE FROM TB_HTRAUMS@HEINENS_STK_PROD t
       WHERE t.HT_USSCC  = r.USSCC
         AND t.HT_CSSCC  = r.CSSCC
         AND t.HT_NUMLIG = r.NUMLIG
         AND t.HT_TYPIND = r.TYPIND;
    ELSE
      SELECT COUNT(*)
        INTO v_ok
        FROM TB_EUMS@HEINENS_STK_PROD e
        JOIN TB_LCUMS@HEINENS_STK_PROD l
          ON l.UL_USSCC = e.UE_USSCC
       WHERE e.UE_USSCC = r.USSCC
         AND l.UL_CSSCC = r.CSSCC
         AND l.UL_NUMLIG = r.NUMLIG;
      IF v_ok = 0 THEN
        RAISE_APPLICATION_ERROR(-20087,
          'SSCC line not found on EUMS/LCUMS. Traceability cannot be changed without a pallet line.');
      END IF;

      DELETE FROM TB_TRAUMS@HEINENS_STK_PROD t
       WHERE t.UT_USSCC  = r.USSCC
         AND t.UT_CSSCC  = r.CSSCC
         AND t.UT_NUMLIG = r.NUMLIG
         AND t.UT_TYPIND = r.TYPIND;
    END IF;
  END LOOP;
  COMMIT;
END;
!',
       ':param1=REQUESTID',
       '',
       1, 0, 1
  FROM dual;

COMMIT;

SET DEFINE ON;
