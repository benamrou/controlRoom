-- =============================================================================
-- 110_pallet_sscc_trace_libquery.sql
-- Pallet/SSCC traceability (S87) — LIBQUERY WHS0000009–WHS0000011
--
-- AGRN: NUMORL -> ECDE/HECDE.NCDEFO -> EREC (prefer) / HEREC
-- Receipt NLIGMV: MVTRE / HMVTRE -> TMVTR / HTMVTR (DATREC = MR/HR_DATREC)
-- Shipment NLIGME: MVTEX / HMVTEX by USSCC+NUMORL+CPROIN
--   -> TMVTE / HTMVTE (DATEXP = ME/HT_DATEXP, CODITR = DLC|LOTFAB)
-- =============================================================================

SET DEFINE OFF;
SET SQLBLANKLINES ON;

DELETE FROM LIBQUERY WHERE QUERYNUM IN ('WHS0000009', 'WHS0000010', 'WHS0000011');

INSERT INTO LIBQUERY (
  QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'WHS0000009', 'Pallet/SSCC trace - search', 'Live+archive SSCC. UBD/LOF from TRAUMS then TMVTR via MVTRE. :param1=SSCC through :param9=created_until.',
       TO_CLOB(q'!SELECT q."Whs #",
       q."Store #",
       q."SSCC",
       q."Pkg SSCC",
       q."Line",
       q."Item",
       q."Item desc.",
       q."PO #",
       q."Flow",
       q."Flow code",
       q."Created on",
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
    /* ---- LIVE ---- */
    SELECT l.UL_DONORD AS "Whs #",
           NVL(c.CD_REFCLI, ' ') AS "Store #",
           e.UE_USSCC AS "SSCC",
           l.UL_CSSCC AS "Pkg SSCC",
           l.UL_NUMLIG AS "Line",
           l.UL_CPROIN AS "Item",
           NVL(a.AR_LIBPRO, ' ') AS "Item desc.",
           NVL(r.OE_NCDEFO, NVL(c.CD_NCDEFO, ' ')) AS "PO #",
           CASE TRIM(NVL(r.OE_TYPEOR, l.UL_TYPCDE))
             WHEN '8' THEN 'Allotment'
             WHEN '1' THEN 'In-stock'
             ELSE NVL(TRIM(NVL(r.OE_TYPEOR, l.UL_TYPCDE)), ' ')
           END AS "Flow",
           NVL(r.OE_TYPEOR, l.UL_TYPCDE) AS "Flow code",
           TO_CHAR(TRUNC(e.UE_DATCRE), 'MM/DD/YYYY') AS "Created on",
           TO_CHAR(TRUNC(e.UE_DATREC), 'MM/DD/YYYY') AS "Received on",
           NVL(NVL(dlc.UT_VALIND, mv.DLC_VAL), ' ') AS "UBD",
           NVL(NVL(lof.UT_VALIND, mv.LOF_VAL), ' ') AS "Prod lot",
           CASE WHEN dlc.UT_USSCC IS NOT NULL OR mv.DLC_VAL IS NOT NULL THEN 1 ELSE 0 END AS "Has UBD",
           CASE WHEN lof.UT_USSCC IS NOT NULL OR mv.LOF_VAL IS NOT NULL THEN 1 ELSE 0 END AS "Has LOF",
           l.UL_ARPROM AS "SV",
           l.UL_ILOGIS AS "LV",
           NVL(l.UL_NUMORC, 0) AS "OR #",
           NVL(l.UL_NUMORL, 0) AS "OL #",
           'LIVE' AS "Source",
           e.UE_DATCRE AS sort_dat
      FROM TB_EUMS@HEINENS_STK_PROD e
      JOIN TB_LCUMS@HEINENS_STK_PROD l
        ON l.UL_USSCC = e.UE_USSCC
      LEFT JOIN TB_EREC@HEINENS_STK_PROD r
        ON NVL(l.UL_NUMORC, 0) <> 0
       AND r.OE_NUMORC = l.UL_NUMORC
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
      LEFT JOIN (
            SELECT m.MR_USSCC AS USSCC,
                   MAX(CASE WHEN t.TR_TYPIND = 'DLC' THEN t.TR_VALIND END) AS DLC_VAL,
                   MAX(CASE WHEN t.TR_TYPIND = 'LOF' THEN t.TR_VALIND END) AS LOF_VAL
              FROM TB_MVTRE@HEINENS_STK_PROD m
              JOIN TB_TMVTR@HEINENS_STK_PROD t
                ON t.TR_NLIGMV = m.MR_NLIGMV
               AND t.TR_TYPIND IN ('DLC', 'LOF')
             GROUP BY m.MR_USSCC
          ) mv
        ON mv.USSCC = e.UE_USSCC
!') ||
       TO_CLOB(q'!      LEFT JOIN TB_ART@HEINENS_STK_PROD a
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
            OR (:param5 = 'BOTH'
                AND dlc.UT_USSCC IS NULL AND lof.UT_USSCC IS NULL
                AND mv.DLC_VAL IS NULL AND mv.LOF_VAL IS NULL)
            OR (:param5 = 'DLC'
                AND dlc.UT_USSCC IS NULL AND mv.DLC_VAL IS NULL)
            OR (:param5 = 'LOF'
                AND lof.UT_USSCC IS NULL AND mv.LOF_VAL IS NULL))
       AND (:param6 = '-1' OR TO_CHAR(l.UL_DONORD) = TO_CHAR(:param6))
       AND (:param7 = '-1'
            OR TO_CHAR(NVL(r.OE_FOURN, a.AR_FOURN)) = TO_CHAR(:param7))
       AND (:param8 = '-1'
            OR TRUNC(e.UE_DATCRE) >= TO_DATE(:param8, 'YYYY-MM-DD'))
       AND (:param9 = '-1'
            OR TRUNC(e.UE_DATCRE) <= TO_DATE(:param9, 'YYYY-MM-DD'))

    UNION ALL

    /* ---- ARCHIVE ---- */
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
           TO_CHAR(TRUNC(he.HE_DATCRE), 'MM/DD/YYYY') AS "Created on",
           TO_CHAR(TRUNC(he.HE_DATREC), 'MM/DD/YYYY') AS "Received on",
           NVL(NVL(hdlc.HT_VALIND, hmv.DLC_VAL), ' ') AS "UBD",
           NVL(NVL(hlof.HT_VALIND, hmv.LOF_VAL), ' ') AS "Prod lot",
           CASE WHEN hdlc.HT_USSCC IS NOT NULL OR hmv.DLC_VAL IS NOT NULL THEN 1 ELSE 0 END AS "Has UBD",
           CASE WHEN hlof.HT_USSCC IS NOT NULL OR hmv.LOF_VAL IS NOT NULL THEN 1 ELSE 0 END AS "Has LOF",
           hl.HL_ARPROM AS "SV",
           hl.HL_ILOGIS AS "LV",
           NVL(hl.HL_NUMORC, 0) AS "OR #",
           NVL(hl.HL_NUMORL, 0) AS "OL #",
           'ARCHIVE' AS "Source",
           he.HE_DATCRE AS sort_dat
      FROM TB_HEUMS@HEINENS_STK_PROD he
      JOIN TB_HLCUMS@HEINENS_STK_PROD hl
        ON hl.HL_USSCC = he.HE_USSCC
      LEFT JOIN TB_HEREC@HEINENS_STK_PROD hr
        ON NVL(hl.HL_NUMORC, 0) <> 0
       AND hr.HO_NUMORC = hl.HL_NUMORC
      LEFT JOIN TB_HECDE@HEINENS_STK_PROD hc
!') ||
       TO_CLOB(q'!        ON NVL(hl.HL_NUMORL, 0) <> 0
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
      LEFT JOIN (
            SELECT m.HR_USSCC AS USSCC,
                   MAX(CASE WHEN t.HT_TYPIND = 'DLC' THEN t.HT_VALIND END) AS DLC_VAL,
                   MAX(CASE WHEN t.HT_TYPIND = 'LOF' THEN t.HT_VALIND END) AS LOF_VAL
              FROM TB_HMVTRE@HEINENS_STK_PROD m
              JOIN TB_HTMVTR@HEINENS_STK_PROD t
                ON t.HT_NLIGMV = m.HR_NLIGMV
               AND t.HT_TYPIND IN ('DLC', 'LOF')
             GROUP BY m.HR_USSCC
          ) hmv
        ON hmv.USSCC = he.HE_USSCC
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
            OR (:param5 = 'BOTH'
                AND hdlc.HT_USSCC IS NULL AND hlof.HT_USSCC IS NULL
                AND hmv.DLC_VAL IS NULL AND hmv.LOF_VAL IS NULL)
            OR (:param5 = 'DLC'
                AND hdlc.HT_USSCC IS NULL AND hmv.DLC_VAL IS NULL)
            OR (:param5 = 'LOF'
                AND hlof.HT_USSCC IS NULL AND hmv.LOF_VAL IS NULL))
       AND (:param6 = '-1' OR TO_CHAR(hl.HL_DONORD) = TO_CHAR(:param6))
       AND (:param7 = '-1'
            OR TO_CHAR(NVL(hr.HO_FOURN, a.AR_FOURN)) = TO_CHAR(:param7))
       AND (:param8 = '-1'
            OR TRUNC(he.HE_DATCRE) >= TO_DATE(:param8, 'YYYY-MM-DD'))
       AND (:param9 = '-1'
            OR TRUNC(he.HE_DATCRE) <= TO_DATE(:param9, 'YYYY-MM-DD'))
  ) q
 ORDER BY q.sort_dat DESC NULLS LAST, q."SSCC", q."Line"
!'),
       ':param1=sscc,:param2=item,:param3=po,:param4=flow,:param5=missing,:param6=whs,:param7=vendor,:param8=created_from,:param9=created_until', 'WHS #,STORE #,SSCC,PKG SSCC,LINE,ITEM,ITEM DESC.,PO #,FLOW,FLOW CODE,CREATED ON,RECEIVED ON,UBD,PROD LOT,HAS UBD,HAS LOF,SV,LV,OR #,OL #,SOURCE', 1, 0, 0
  FROM dual;

INSERT INTO LIBQUERY (
  QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'WHS0000010', 'Pallet/SSCC trace - save indicator', 'TMVTR/HTMVTR + TMVTE/HTMVTE. DATREC=MR/HR_DATREC, DATEXP=ME/HT_DATEXP, CODITR=DLC|LOTFAB. Body: USSCC,CSSCC,NUMLIG,TYPIND,VALIND,USERID,SOURCE.',
       TO_CLOB(q'!DECLARE
  v_source     VARCHAR2(10);
  v_ok         NUMBER;
  v_nligmv     NUMBER(18);
  v_nligme     NUMBER(18);
  v_numorc     NUMBER(6);
  v_numorl     NUMBER(6);
  v_donord     VARCHAR2(5);
  v_cproin     VARCHAR2(15);
  v_arprom     VARCHAR2(5);
  v_ilogis     VARCHAR2(5);
  v_typcde     VARCHAR2(5);
  v_flow8      NUMBER;
  v_catind     VARCHAR2(2);
  v_recv_usscc VARCHAR2(18);
  v_csscc      VARCHAR2(18);
  v_rcpt_hist  NUMBER; /* 0=EREC prefer live, 1=HEREC prefer hist */
  v_mvt_hist   NUMBER; /* 0=MVTRE/TMVTR, 1=HMVTRE/HTMVTR */
  v_ship_hist  NUMBER; /* 0=MVTEX/TMVTE, 1=HMVTEX/HTMVTE */
  v_datrec     DATE;   /* MR_DATREC / HR_DATREC */
  v_datexp     DATE;   /* ME_DATEXP / HT_DATEXP */

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

  PROCEDURE upsert_traums(
    p_usscc VARCHAR2, p_csscc VARCHAR2, p_numlig NUMBER,
    p_typind VARCHAR2, p_valind VARCHAR2, p_userid VARCHAR2
  ) IS
  BEGIN
    UPDATE TB_TRAUMS@HEINENS_STK_PROD t
       SET t.UT_VALIND = p_valind, t.UT_DATMOD = SYSDATE, t.UT_UTIMOD = p_userid
     WHERE t.UT_USSCC = p_usscc
       AND TO_CHAR(NVL(t.UT_CSSCC, 0)) = TO_CHAR(NVL(p_csscc, '0'))
       AND t.UT_NUMLIG = p_numlig AND t.UT_TYPIND = p_typind;
    IF SQL%ROWCOUNT = 0 THEN
      INSERT INTO TB_TRAUMS@HEINENS_STK_PROD (
        UT_USSCC, UT_CSSCC, UT_NUMLIG, UT_TYPIND, UT_VALIND,
        UT_VALGST, UT_DATCRE, UT_DATMOD, UT_UTIMOD
      ) VALUES (
        p_usscc, p_csscc, p_numlig, p_typind, p_valind,
        1, SYSDATE, SYSDATE, p_userid
      );
    END IF;
  END upsert_traums;

  PROCEDURE upsert_htraums(
    p_usscc VARCHAR2, p_csscc VARCHAR2, p_numlig NUMBER,
    p_typind VARCHAR2, p_valind VARCHAR2, p_userid VARCHAR2
  ) IS
  BEGIN
    UPDATE TB_HTRAUMS@HEINENS_STK_PROD t
       SET t.HT_VALIND = p_valind, t.HT_DATMOD = SYSDATE, t.HT_UTIMOD = p_userid
     WHERE t.HT_USSCC = p_usscc
       AND TO_CHAR(NVL(t.HT_CSSCC, 0)) = TO_CHAR(NVL(p_csscc, '0'))
       AND t.HT_NUMLIG = p_numlig AND t.HT_TYPIND = p_typind;
    IF SQL%ROWCOUNT = 0 THEN
      INSERT INTO TB_HTRAUMS@HEINENS_STK_PROD (
        HT_USSCC, HT_CSSCC, HT_NUMLIG, HT_TYPIND, HT_VALIND,
        HT_VALGST, HT_DATCRE, HT_DATMOD, HT_UTIMOD
      ) VALUES (
        p_usscc, p_csscc, p_numlig, p_typind, p_valind,
        1, SYSDATE, SYSDATE, p_userid
      );
    END IF;
  END upsert_htraums;

  PROCEDURE upsert_tmvtr(
    p_nligmv NUMBER, p_typind VARCHAR2, p_valind VARCHAR2,
    p_catind VARCHAR2, p_userid VARCHAR2, p_datrec DATE
  ) IS
    v_coditr VARCHAR2(10);
  BEGIN
!') ||
       TO_CLOB(q'!    v_coditr := CASE WHEN p_typind = 'DLC' THEN 'DLC' ELSE 'LOTFAB' END;
    UPDATE TB_TMVTR@HEINENS_STK_PROD t
       SET t.TR_VALIND = p_valind,
           t.TR_CODITR = v_coditr,
           t.TR_DATREC = p_datrec,
           t.TR_DATMOD = SYSDATE,
           t.TR_UTIMOD = p_userid
     WHERE t.TR_NLIGMV = p_nligmv AND t.TR_TYPIND = p_typind;
    IF SQL%ROWCOUNT = 0 THEN
      INSERT INTO TB_TMVTR@HEINENS_STK_PROD (
        TR_NLIGMV, TR_TYPIND, TR_VALIND, TR_VALGST,
        TR_DATCRE, TR_DATMOD, TR_UTIMOD, TR_CATIND, TR_DATREC, TR_CODITR
      ) VALUES (
        p_nligmv, p_typind, p_valind, 1,
        SYSDATE, SYSDATE, p_userid, p_catind, p_datrec, v_coditr
      );
    END IF;
  END upsert_tmvtr;

  PROCEDURE upsert_htmvtr(
    p_nligmv NUMBER, p_typind VARCHAR2, p_valind VARCHAR2,
    p_catind VARCHAR2, p_userid VARCHAR2, p_datrec DATE
  ) IS
    v_coditr VARCHAR2(10);
  BEGIN
    v_coditr := CASE WHEN p_typind = 'DLC' THEN 'DLC' ELSE 'LOTFAB' END;
    UPDATE TB_HTMVTR@HEINENS_STK_PROD t
       SET t.HT_VALIND = p_valind,
           t.HT_CODITR = v_coditr,
           t.HT_DATREC = p_datrec,
           t.HT_DATMOD = SYSDATE,
           t.HT_UTIMOD = p_userid
     WHERE t.HT_NLIGMV = p_nligmv AND t.HT_TYPIND = p_typind;
    IF SQL%ROWCOUNT = 0 THEN
      INSERT INTO TB_HTMVTR@HEINENS_STK_PROD (
        HT_NLIGMV, HT_TYPIND, HT_VALIND, HT_VALGST,
        HT_DATCRE, HT_DATMOD, HT_UTIMOD, HT_CATIND,
        HT_DATHIS, HT_UTIHIS, HT_DATREC, HT_CODITR
      ) VALUES (
        p_nligmv, p_typind, p_valind, 1,
        SYSDATE, SYSDATE, p_userid, p_catind,
        SYSDATE, p_userid, p_datrec, v_coditr
      );
    END IF;
  END upsert_htmvtr;

  PROCEDURE upsert_tmvte(
    p_nligme NUMBER, p_usscc VARCHAR2, p_csscc VARCHAR2, p_numlig NUMBER,
    p_typind VARCHAR2, p_valind VARCHAR2, p_catind VARCHAR2,
    p_userid VARCHAR2, p_datexp DATE
  ) IS
    v_coditr VARCHAR2(10);
  BEGIN
    v_coditr := CASE WHEN p_typind = 'DLC' THEN 'DLC' ELSE 'LOTFAB' END;
    UPDATE TB_TMVTE@HEINENS_STK_PROD t
       SET t.MT_VALIND = p_valind,
           t.MT_CODITR = v_coditr,
           t.MT_DATEXP = p_datexp,
           t.MT_USSCC  = p_usscc,
           t.MT_CSSCC  = p_csscc,
           t.MT_NUMLIG = p_numlig,
           t.MT_DATMOD = SYSDATE,
           t.MT_UTIMOD = p_userid
     WHERE t.MT_NLIGME = p_nligme AND t.MT_TYPIND = p_typind;
    IF SQL%ROWCOUNT = 0 THEN
      INSERT INTO TB_TMVTE@HEINENS_STK_PROD (
        MT_NLIGME, MT_USSCC, MT_CSSCC, MT_NUMLIG, MT_TYPIND, MT_VALIND,
        MT_VALGST, MT_CODITR, MT_DATCRE, MT_DATMOD, MT_UTIMOD,
        MT_CATIND, MT_DATEXP
      ) VALUES (
        p_nligme, p_usscc, p_csscc, p_numlig, p_typind, p_valind,
        1, v_coditr, SYSDATE, SYSDATE, p_userid,
        p_catind, p_datexp
      );
    END IF;
  END upsert_tmvte;

  PROCEDURE upsert_htmvte(
    p_nligme NUMBER, p_usscc VARCHAR2, p_csscc VARCHAR2, p_numlig NUMBER,
    p_typind VARCHAR2, p_valind VARCHAR2, p_catind VARCHAR2,
    p_userid VARCHAR2, p_datexp DATE
  ) IS
    v_coditr VARCHAR2(10);
  BEGIN
    v_coditr := CASE WHEN p_typind = 'DLC' THEN 'DLC' ELSE 'LOTFAB' END;
    UPDATE TB_HTMVTE@HEINENS_STK_PROD t
       SET t.HT_VALIND = p_valind,
           t.HT_CODITR = v_coditr,
           t.HT_DATEXP = p_datexp,
           t.HT_USSCC  = p_usscc,
           t.HT_CSSCC  = p_csscc,
           t.HT_NUMLIG = p_numlig,
           t.HT_DATMOD = SYSDATE,
           t.HT_UTIMOD = p_userid
     WHERE t.HT_NLIGME = p_nligme AND t.HT_TYPIND = p_typind;
!') ||
       TO_CLOB(q'!    IF SQL%ROWCOUNT = 0 THEN
      INSERT INTO TB_HTMVTE@HEINENS_STK_PROD (
        HT_NLIGME, HT_USSCC, HT_CSSCC, HT_NUMLIG, HT_TYPIND, HT_VALIND,
        HT_VALGST, HT_CODITR, HT_DATCRE, HT_DATMOD, HT_UTIMOD, HT_CATIND,
        HT_DATHIS, HT_UTIHIS, HT_DATEXP
      ) VALUES (
        p_nligme, p_usscc, p_csscc, p_numlig, p_typind, p_valind,
        1, v_coditr, SYSDATE, SYSDATE, p_userid, p_catind,
        SYSDATE, p_userid, p_datexp
      );
    END IF;
  END upsert_htmvte;

  /* Classify receipt: EREC => live (TMVTR), HEREC => archived (HTMVTR) */
  PROCEDURE classify_receipt(
    p_numorc IN NUMBER,
    p_rcpt_hist IN OUT NUMBER
  ) IS
    v_cnt NUMBER;
  BEGIN
    IF NVL(p_numorc, 0) = 0 THEN RETURN; END IF;
    SELECT COUNT(*) INTO v_cnt FROM TB_EREC@HEINENS_STK_PROD oe
     WHERE oe.OE_NUMORC = p_numorc AND ROWNUM = 1;
    IF v_cnt > 0 THEN p_rcpt_hist := 0; RETURN; END IF;
    SELECT COUNT(*) INTO v_cnt FROM TB_HEREC@HEINENS_STK_PROD hr
     WHERE hr.HO_NUMORC = p_numorc AND ROWNUM = 1;
    IF v_cnt > 0 THEN p_rcpt_hist := 1; RETURN; END IF;
  END classify_receipt;

  /* NUMORL -> PO -> EREC (live/TMVTR) first, else HEREC (archived/HTMVTR) */
  PROCEDURE resolve_agrn_from_shipment(
    p_numorl IN NUMBER,
    p_donord IN VARCHAR2,
    p_typcde IN VARCHAR2,
    p_numorc IN OUT NUMBER,
    p_rcpt_hist IN OUT NUMBER
  ) IS
    v_po VARCHAR2(35);
  BEGIN
    IF NVL(p_numorc, 0) <> 0 THEN
      classify_receipt(p_numorc, p_rcpt_hist);
      RETURN;
    END IF;
    IF NVL(p_numorl, 0) = 0 THEN RETURN; END IF;
    v_po := NULL;
    BEGIN
      SELECT TRIM(hc.HD_NCDEFO) INTO v_po
        FROM TB_HECDE@HEINENS_STK_PROD hc
       WHERE hc.HD_NUMORL = p_numorl AND hc.HD_DONORD = p_donord
         AND TRIM(hc.HD_NCDEFO) IS NOT NULL AND ROWNUM = 1;
    EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
    IF v_po IS NULL THEN
      BEGIN
        SELECT TRIM(c.CD_NCDEFO) INTO v_po
          FROM TB_ECDE@HEINENS_STK_PROD c
         WHERE c.CD_NUMORL = p_numorl AND c.CD_DONORD = p_donord
           AND TRIM(c.CD_NCDEFO) IS NOT NULL AND ROWNUM = 1;
      EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
    END IF;
    IF v_po IS NULL THEN RETURN; END IF;

    BEGIN
      SELECT oe.OE_NUMORC INTO p_numorc
        FROM TB_EREC@HEINENS_STK_PROD oe
       WHERE TRIM(oe.OE_NCDEFO) = v_po AND ROWNUM = 1;
      p_rcpt_hist := 0;
      RETURN;
    EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;

    BEGIN
      SELECT hr.HO_NUMORC INTO p_numorc
        FROM TB_HEREC@HEINENS_STK_PROD hr
       WHERE TRIM(hr.HO_NCDEFO) = v_po AND ROWNUM = 1;
      p_rcpt_hist := 1;
    EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
  END resolve_agrn_from_shipment;

  /* Find NLIGMV in the movement table matching receipt historization */
  PROCEDURE resolve_nligmv(
    p_usscc VARCHAR2,
    p_prefer_hist NUMBER,
    p_numorc IN OUT NUMBER,
    p_cproin VARCHAR2,
    p_arprom VARCHAR2,
    p_ilogis VARCHAR2,
    p_donord VARCHAR2,
    p_nligmv OUT NUMBER,
    p_recv_usscc OUT VARCHAR2,
    p_mvt_hist OUT NUMBER
  ) IS
    PROCEDURE try_hist IS
    BEGIN
      BEGIN
        SELECT m.HR_NLIGMV, m.HR_USSCC, NVL(m.HR_NUMORC, p_numorc)
          INTO p_nligmv, p_recv_usscc, p_numorc
          FROM TB_HMVTRE@HEINENS_STK_PROD m
         WHERE m.HR_USSCC = p_usscc AND ROWNUM = 1;
        p_mvt_hist := 1; RETURN;
      EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
      IF NVL(p_numorc, 0) = 0 THEN RETURN; END IF;
      BEGIN
        SELECT m.HR_NLIGMV, m.HR_USSCC, NVL(m.HR_NUMORC, p_numorc)
!') ||
       TO_CLOB(q'!          INTO p_nligmv, p_recv_usscc, p_numorc
          FROM TB_HMVTRE@HEINENS_STK_PROD m
         WHERE m.HR_NUMORC = p_numorc
           AND TRIM(m.HR_CPROIN) = TRIM(p_cproin)
           AND TO_CHAR(m.HR_DONORD) = TO_CHAR(p_donord)
           AND NVL(TRIM(m.HR_ARPROM), TRIM(p_arprom)) = TRIM(p_arprom)
           AND NVL(TRIM(m.HR_ILOGIS), TRIM(p_ilogis)) = TRIM(p_ilogis)
           AND ROWNUM = 1;
        p_mvt_hist := 1; RETURN;
      EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
      BEGIN
        SELECT m.HR_NLIGMV, m.HR_USSCC, NVL(m.HR_NUMORC, p_numorc)
          INTO p_nligmv, p_recv_usscc, p_numorc
          FROM TB_HMVTRE@HEINENS_STK_PROD m
         WHERE m.HR_NUMORC = p_numorc
           AND TRIM(m.HR_CPROIN) = TRIM(p_cproin)
           AND TO_CHAR(m.HR_DONORD) = TO_CHAR(p_donord)
           AND ROWNUM = 1;
        p_mvt_hist := 1; RETURN;
      EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
      BEGIN
        SELECT m.HR_NLIGMV, m.HR_USSCC, NVL(m.HR_NUMORC, p_numorc)
          INTO p_nligmv, p_recv_usscc, p_numorc
          FROM TB_HMVTRE@HEINENS_STK_PROD m
         WHERE m.HR_NUMORC = p_numorc
           AND TRIM(m.HR_CPROIN) = TRIM(p_cproin)
           AND ROWNUM = 1;
        p_mvt_hist := 1; RETURN;
      EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
      BEGIN
        SELECT m.HR_NLIGMV, m.HR_USSCC, NVL(m.HR_NUMORC, p_numorc)
          INTO p_nligmv, p_recv_usscc, p_numorc
          FROM TB_HMVTRE@HEINENS_STK_PROD m
         WHERE m.HR_NUMORC = p_numorc AND ROWNUM = 1;
        p_mvt_hist := 1;
      EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
    END try_hist;

    PROCEDURE try_live IS
    BEGIN
      BEGIN
        SELECT m.MR_NLIGMV, m.MR_USSCC, NVL(m.MR_NUMORC, p_numorc)
          INTO p_nligmv, p_recv_usscc, p_numorc
          FROM TB_MVTRE@HEINENS_STK_PROD m
         WHERE m.MR_USSCC = p_usscc AND ROWNUM = 1;
        p_mvt_hist := 0; RETURN;
      EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
      IF NVL(p_numorc, 0) = 0 THEN RETURN; END IF;
      BEGIN
        SELECT m.MR_NLIGMV, m.MR_USSCC, NVL(m.MR_NUMORC, p_numorc)
          INTO p_nligmv, p_recv_usscc, p_numorc
          FROM TB_MVTRE@HEINENS_STK_PROD m
         WHERE m.MR_NUMORC = p_numorc
           AND TRIM(m.MR_CPROIN) = TRIM(p_cproin)
           AND TO_CHAR(m.MR_DONORD) = TO_CHAR(p_donord)
           AND NVL(TRIM(m.MR_ARPROM), TRIM(p_arprom)) = TRIM(p_arprom)
           AND NVL(TRIM(m.MR_ILOGIS), TRIM(p_ilogis)) = TRIM(p_ilogis)
           AND ROWNUM = 1;
        p_mvt_hist := 0; RETURN;
      EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
      BEGIN
        SELECT m.MR_NLIGMV, m.MR_USSCC, NVL(m.MR_NUMORC, p_numorc)
          INTO p_nligmv, p_recv_usscc, p_numorc
          FROM TB_MVTRE@HEINENS_STK_PROD m
         WHERE m.MR_NUMORC = p_numorc
           AND TRIM(m.MR_CPROIN) = TRIM(p_cproin)
           AND TO_CHAR(m.MR_DONORD) = TO_CHAR(p_donord)
           AND ROWNUM = 1;
        p_mvt_hist := 0; RETURN;
      EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
      BEGIN
        SELECT m.MR_NLIGMV, m.MR_USSCC, NVL(m.MR_NUMORC, p_numorc)
          INTO p_nligmv, p_recv_usscc, p_numorc
          FROM TB_MVTRE@HEINENS_STK_PROD m
         WHERE m.MR_NUMORC = p_numorc
           AND TRIM(m.MR_CPROIN) = TRIM(p_cproin)
           AND ROWNUM = 1;
        p_mvt_hist := 0; RETURN;
      EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
      BEGIN
        SELECT m.MR_NLIGMV, m.MR_USSCC, NVL(m.MR_NUMORC, p_numorc)
          INTO p_nligmv, p_recv_usscc, p_numorc
!') ||
       TO_CLOB(q'!          FROM TB_MVTRE@HEINENS_STK_PROD m
         WHERE m.MR_NUMORC = p_numorc AND ROWNUM = 1;
        p_mvt_hist := 0;
      EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
    END try_live;
  BEGIN
    p_nligmv := NULL;
    p_recv_usscc := NULL;
    p_mvt_hist := p_prefer_hist;
    IF p_prefer_hist = 1 THEN
      try_hist;
      IF p_nligmv IS NULL THEN try_live; END IF;
    ELSE
      try_live;
      IF p_nligmv IS NULL THEN try_hist; END IF;
    END IF;
  END resolve_nligmv;

  /* Shipment movement: USSCC + NUMORL + CPROIN -> MVTEX / HMVTEX */
  PROCEDURE resolve_nligme(
    p_usscc VARCHAR2,
    p_numorl NUMBER,
    p_cproin VARCHAR2,
    p_prefer_hist NUMBER,
    p_nligme OUT NUMBER,
    p_datexp OUT DATE,
    p_ship_hist OUT NUMBER
  ) IS
    PROCEDURE try_live IS
    BEGIN
      IF NVL(p_numorl, 0) = 0 THEN RETURN; END IF;
      BEGIN
        SELECT m.ME_NLIGME, m.ME_DATEXP
          INTO p_nligme, p_datexp
          FROM TB_MVTEX@HEINENS_STK_PROD m
         WHERE m.ME_USSCC = p_usscc
           AND m.ME_NUMORL = p_numorl
           AND TRIM(m.ME_CPROIN) = TRIM(p_cproin)
           AND ROWNUM = 1;
        p_ship_hist := 0; RETURN;
      EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
      BEGIN
        SELECT m.ME_NLIGME, m.ME_DATEXP
          INTO p_nligme, p_datexp
          FROM TB_MVTEX@HEINENS_STK_PROD m
         WHERE m.ME_USSCC = p_usscc
           AND m.ME_NUMORL = p_numorl
           AND ROWNUM = 1;
        p_ship_hist := 0;
      EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
    END try_live;

    PROCEDURE try_hist IS
    BEGIN
      IF NVL(p_numorl, 0) = 0 THEN RETURN; END IF;
      BEGIN
        SELECT m.HT_NLIGME, m.HT_DATEXP
          INTO p_nligme, p_datexp
          FROM TB_HMVTEX@HEINENS_STK_PROD m
         WHERE m.HT_USSCC = p_usscc
           AND m.HT_NUMORL = p_numorl
           AND TRIM(m.HT_CPROIN) = TRIM(p_cproin)
           AND ROWNUM = 1;
        p_ship_hist := 1; RETURN;
      EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
      BEGIN
        SELECT m.HT_NLIGME, m.HT_DATEXP
          INTO p_nligme, p_datexp
          FROM TB_HMVTEX@HEINENS_STK_PROD m
         WHERE m.HT_USSCC = p_usscc
           AND m.HT_NUMORL = p_numorl
           AND ROWNUM = 1;
        p_ship_hist := 1;
      EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
    END try_hist;
  BEGIN
    p_nligme := NULL;
    p_datexp := NULL;
    p_ship_hist := p_prefer_hist;
    IF p_prefer_hist = 1 THEN
      try_hist;
      IF p_nligme IS NULL THEN try_live; END IF;
    ELSE
      try_live;
      IF p_nligme IS NULL THEN try_hist; END IF;
    END IF;
  END resolve_nligme;

  PROCEDURE write_movement_ind(
    p_mvt_hist NUMBER, p_nligmv NUMBER,
    p_typind VARCHAR2, p_valind VARCHAR2, p_catind VARCHAR2, p_userid VARCHAR2,
    p_datrec DATE
  ) IS
  BEGIN
    IF p_mvt_hist = 1 THEN
      upsert_htmvtr(p_nligmv, p_typind, p_valind, p_catind, p_userid, p_datrec);
    ELSE
      upsert_tmvtr(p_nligmv, p_typind, p_valind, p_catind, p_userid, p_datrec);
    END IF;
  END write_movement_ind;

  PROCEDURE write_shipment_ind(
    p_usscc VARCHAR2, p_csscc VARCHAR2, p_numlig NUMBER, p_numorl NUMBER,
    p_cproin VARCHAR2, p_prefer_hist NUMBER,
    p_typind VARCHAR2, p_valind VARCHAR2, p_catind VARCHAR2, p_userid VARCHAR2
  ) IS
    v_nlig NUMBER(18);
    v_dx   DATE;
    v_sh   NUMBER;
  BEGIN
    IF NVL(p_numorl, 0) = 0 THEN RETURN; END IF;
    resolve_nligme(p_usscc, p_numorl, p_cproin, p_prefer_hist, v_nlig, v_dx, v_sh);
!') ||
       TO_CLOB(q'!    IF v_nlig IS NULL THEN RETURN; END IF;
    IF v_sh = 1 THEN
      upsert_htmvte(v_nlig, p_usscc, p_csscc, p_numlig, p_typind, p_valind, p_catind, p_userid, v_dx);
    ELSE
      upsert_tmvte(v_nlig, p_usscc, p_csscc, p_numlig, p_typind, p_valind, p_catind, p_userid, v_dx);
    END IF;
  END write_shipment_ind;

BEGIN
  FOR r IN c_rows LOOP
    v_source := CASE WHEN r.SOURCE = 'ARCHIVE' THEN 'ARCHIVE' ELSE 'LIVE' END;
    v_catind := CASE WHEN r.TYPIND = 'DLC' THEN '1' ELSE '2' END;
    v_nligmv := NULL; v_nligme := NULL; v_numorc := NULL; v_numorl := NULL;
    v_datrec := NULL; v_datexp := NULL;
    v_recv_usscc := NULL; v_flow8 := 0;
    v_rcpt_hist := CASE WHEN v_source = 'ARCHIVE' THEN 1 ELSE 0 END;
    v_mvt_hist := v_rcpt_hist;
    v_ship_hist := v_rcpt_hist;
    v_csscc := NVL(NULLIF(TRIM(r.CSSCC), ''), '0');

    IF v_source = 'ARCHIVE' THEN
      SELECT COUNT(*) INTO v_ok
        FROM TB_HEUMS@HEINENS_STK_PROD he
        JOIN TB_HLCUMS@HEINENS_STK_PROD hl ON hl.HL_USSCC = he.HE_USSCC
       WHERE he.HE_USSCC = r.USSCC
         AND TO_CHAR(NVL(hl.HL_CSSCC, 0)) = TO_CHAR(v_csscc)
         AND hl.HL_NUMLIG = r.NUMLIG;
      IF v_ok = 0 THEN
        RAISE_APPLICATION_ERROR(-20087,
          'Archived SSCC '||r.USSCC||' line not found on HEUMS/HLCUMS.');
      END IF;

      SELECT NVL(hl.HL_NUMORC, 0), NVL(hl.HL_NUMORL, 0), hl.HL_DONORD,
             hl.HL_CPROIN, hl.HL_ARPROM, hl.HL_ILOGIS, hl.HL_TYPCDE,
             TO_CHAR(NVL(hl.HL_CSSCC, 0))
        INTO v_numorc, v_numorl, v_donord, v_cproin, v_arprom, v_ilogis, v_typcde, v_csscc
        FROM TB_HLCUMS@HEINENS_STK_PROD hl
       WHERE hl.HL_USSCC = r.USSCC
         AND TO_CHAR(NVL(hl.HL_CSSCC, 0)) = TO_CHAR(NVL(NULLIF(TRIM(r.CSSCC), ''), '0'))
         AND hl.HL_NUMLIG = r.NUMLIG AND ROWNUM = 1;

      resolve_agrn_from_shipment(v_numorl, v_donord, v_typcde, v_numorc, v_rcpt_hist);

      BEGIN
        IF v_rcpt_hist = 0 THEN
          SELECT NVL(TRIM(oe.OE_TYPEOR), v_typcde) INTO v_typcde
            FROM TB_EREC@HEINENS_STK_PROD oe
           WHERE oe.OE_NUMORC = v_numorc AND NVL(v_numorc, 0) <> 0 AND ROWNUM = 1;
        ELSE
          SELECT NVL(TRIM(hr.HO_TYPEOR), v_typcde) INTO v_typcde
            FROM TB_HEREC@HEINENS_STK_PROD hr
           WHERE hr.HO_NUMORC = v_numorc AND NVL(v_numorc, 0) <> 0 AND ROWNUM = 1;
        END IF;
      EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
      v_flow8 := CASE WHEN TRIM(NVL(v_typcde, ' ')) = '8' THEN 1 ELSE 0 END;

      resolve_nligmv(r.USSCC, v_rcpt_hist, v_numorc, v_cproin, v_arprom, v_ilogis, v_donord,
                     v_nligmv, v_recv_usscc, v_mvt_hist);
      IF v_nligmv IS NULL THEN
        RAISE_APPLICATION_ERROR(-20087,
          'Reception movement not found for archived SSCC '||r.USSCC||
          ' (OR#='||NVL(TO_CHAR(NULLIF(v_numorc,0)),'null')||
          ', OL#='||NVL(TO_CHAR(NULLIF(v_numorl,0)),'null')||
          ', receiptPrefer='||CASE WHEN v_rcpt_hist=1 THEN 'HEREC' ELSE 'EREC' END||').');
      END IF;

      v_datrec := NULL;
      BEGIN
        IF v_mvt_hist = 1 THEN
          SELECT m.HR_DATREC INTO v_datrec
            FROM TB_HMVTRE@HEINENS_STK_PROD m
           WHERE m.HR_NLIGMV = v_nligmv AND ROWNUM = 1;
        ELSE
          SELECT m.MR_DATREC INTO v_datrec
            FROM TB_MVTRE@HEINENS_STK_PROD m
           WHERE m.MR_NLIGMV = v_nligmv AND ROWNUM = 1;
        END IF;
      EXCEPTION WHEN NO_DATA_FOUND THEN v_datrec := NULL; END;

!') ||
       TO_CLOB(q'!      write_movement_ind(v_mvt_hist, v_nligmv, r.TYPIND, r.VALIND, v_catind, r.USERID, v_datrec);

      IF NVL(v_numorc, 0) <> 0 THEN
        FOR s IN (
          SELECT hl.HL_USSCC AS USSCC, TO_CHAR(NVL(hl.HL_CSSCC, 0)) AS CSSCC,
                 hl.HL_NUMLIG AS NUMLIG, NVL(hl.HL_NUMORL, 0) AS NUMORL,
                 hl.HL_CPROIN AS CPROIN
            FROM TB_HLCUMS@HEINENS_STK_PROD hl
           WHERE hl.HL_NUMORC = v_numorc AND hl.HL_CPROIN = v_cproin
             AND hl.HL_ARPROM = v_arprom AND hl.HL_ILOGIS = v_ilogis
             AND hl.HL_DONORD = v_donord
        ) LOOP
          IF s.NUMORL <> 0 OR v_flow8 = 0 THEN
            upsert_htraums(s.USSCC, s.CSSCC, s.NUMLIG, r.TYPIND, r.VALIND, r.USERID);
          END IF;
          IF s.NUMORL <> 0 THEN
            write_shipment_ind(s.USSCC, s.CSSCC, s.NUMLIG, s.NUMORL, s.CPROIN, 1,
                               r.TYPIND, r.VALIND, v_catind, r.USERID);
          END IF;
        END LOOP;
        FOR s IN (
          SELECT l.UL_USSCC AS USSCC, TO_CHAR(NVL(l.UL_CSSCC, 0)) AS CSSCC,
                 l.UL_NUMLIG AS NUMLIG, NVL(l.UL_NUMORL, 0) AS NUMORL,
                 l.UL_CPROIN AS CPROIN
            FROM TB_LCUMS@HEINENS_STK_PROD l
           WHERE l.UL_NUMORC = v_numorc AND l.UL_CPROIN = v_cproin
             AND l.UL_ARPROM = v_arprom AND l.UL_ILOGIS = v_ilogis
             AND l.UL_DONORD = v_donord
        ) LOOP
          IF s.NUMORL <> 0 OR v_flow8 = 0 THEN
            upsert_traums(s.USSCC, s.CSSCC, s.NUMLIG, r.TYPIND, r.VALIND, r.USERID);
          END IF;
          IF s.NUMORL <> 0 THEN
            write_shipment_ind(s.USSCC, s.CSSCC, s.NUMLIG, s.NUMORL, s.CPROIN, 0,
                               r.TYPIND, r.VALIND, v_catind, r.USERID);
          END IF;
        END LOOP;
      END IF;
      IF v_numorl <> 0 OR v_flow8 = 0 THEN
        upsert_htraums(r.USSCC, v_csscc, r.NUMLIG, r.TYPIND, r.VALIND, r.USERID);
      END IF;
      IF v_numorl <> 0 THEN
        write_shipment_ind(r.USSCC, v_csscc, r.NUMLIG, v_numorl, v_cproin, 1,
                           r.TYPIND, r.VALIND, v_catind, r.USERID);
      END IF;

    ELSE
      SELECT COUNT(*) INTO v_ok
        FROM TB_EUMS@HEINENS_STK_PROD e
        JOIN TB_LCUMS@HEINENS_STK_PROD l ON l.UL_USSCC = e.UE_USSCC
       WHERE e.UE_USSCC = r.USSCC
         AND TO_CHAR(NVL(l.UL_CSSCC, 0)) = TO_CHAR(v_csscc)
         AND l.UL_NUMLIG = r.NUMLIG;
      IF v_ok = 0 THEN
        RAISE_APPLICATION_ERROR(-20087, 'SSCC '||r.USSCC||' line not found on EUMS/LCUMS.');
      END IF;

      SELECT NVL(l.UL_NUMORC, 0), NVL(l.UL_NUMORL, 0), l.UL_DONORD,
             l.UL_CPROIN, l.UL_ARPROM, l.UL_ILOGIS, l.UL_TYPCDE,
             TO_CHAR(NVL(l.UL_CSSCC, 0))
        INTO v_numorc, v_numorl, v_donord, v_cproin, v_arprom, v_ilogis, v_typcde, v_csscc
        FROM TB_LCUMS@HEINENS_STK_PROD l
       WHERE l.UL_USSCC = r.USSCC
         AND TO_CHAR(NVL(l.UL_CSSCC, 0)) = TO_CHAR(NVL(NULLIF(TRIM(r.CSSCC), ''), '0'))
         AND l.UL_NUMLIG = r.NUMLIG AND ROWNUM = 1;

      resolve_agrn_from_shipment(v_numorl, v_donord, v_typcde, v_numorc, v_rcpt_hist);

      BEGIN
        IF v_rcpt_hist = 0 THEN
          SELECT NVL(TRIM(oe.OE_TYPEOR), v_typcde) INTO v_typcde
            FROM TB_EREC@HEINENS_STK_PROD oe
           WHERE oe.OE_NUMORC = v_numorc AND NVL(v_numorc, 0) <> 0 AND ROWNUM = 1;
        ELSE
          SELECT NVL(TRIM(hr.HO_TYPEOR), v_typcde) INTO v_typcde
            FROM TB_HEREC@HEINENS_STK_PROD hr
!') ||
       TO_CLOB(q'!           WHERE hr.HO_NUMORC = v_numorc AND NVL(v_numorc, 0) <> 0 AND ROWNUM = 1;
        END IF;
      EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
      v_flow8 := CASE WHEN TRIM(NVL(v_typcde, ' ')) = '8' THEN 1 ELSE 0 END;

      resolve_nligmv(r.USSCC, v_rcpt_hist, v_numorc, v_cproin, v_arprom, v_ilogis, v_donord,
                     v_nligmv, v_recv_usscc, v_mvt_hist);
      IF v_nligmv IS NULL THEN
        RAISE_APPLICATION_ERROR(-20087,
          'Reception movement not found for SSCC '||r.USSCC||
          ' (OR#='||NVL(TO_CHAR(NULLIF(v_numorc,0)),'null')||
          ', OL#='||NVL(TO_CHAR(NULLIF(v_numorl,0)),'null')||
          ', receiptPrefer='||CASE WHEN v_rcpt_hist=1 THEN 'HEREC' ELSE 'EREC' END||').');
      END IF;

      v_datrec := NULL;
      BEGIN
        IF v_mvt_hist = 1 THEN
          SELECT m.HR_DATREC INTO v_datrec
            FROM TB_HMVTRE@HEINENS_STK_PROD m
           WHERE m.HR_NLIGMV = v_nligmv AND ROWNUM = 1;
        ELSE
          SELECT m.MR_DATREC INTO v_datrec
            FROM TB_MVTRE@HEINENS_STK_PROD m
           WHERE m.MR_NLIGMV = v_nligmv AND ROWNUM = 1;
        END IF;
      EXCEPTION WHEN NO_DATA_FOUND THEN v_datrec := NULL; END;

      write_movement_ind(v_mvt_hist, v_nligmv, r.TYPIND, r.VALIND, v_catind, r.USERID, v_datrec);

      IF NVL(v_numorc, 0) <> 0 THEN
        FOR s IN (
          SELECT l.UL_USSCC AS USSCC, TO_CHAR(NVL(l.UL_CSSCC, 0)) AS CSSCC,
                 l.UL_NUMLIG AS NUMLIG, NVL(l.UL_NUMORL, 0) AS NUMORL,
                 l.UL_CPROIN AS CPROIN
            FROM TB_LCUMS@HEINENS_STK_PROD l
           WHERE l.UL_NUMORC = v_numorc AND l.UL_CPROIN = v_cproin
             AND l.UL_ARPROM = v_arprom AND l.UL_ILOGIS = v_ilogis
             AND l.UL_DONORD = v_donord
        ) LOOP
          IF s.NUMORL <> 0 OR v_flow8 = 0 THEN
            upsert_traums(s.USSCC, s.CSSCC, s.NUMLIG, r.TYPIND, r.VALIND, r.USERID);
          END IF;
          IF s.NUMORL <> 0 THEN
            write_shipment_ind(s.USSCC, s.CSSCC, s.NUMLIG, s.NUMORL, s.CPROIN, 0,
                               r.TYPIND, r.VALIND, v_catind, r.USERID);
          END IF;
        END LOOP;
        FOR s IN (
          SELECT hl.HL_USSCC AS USSCC, TO_CHAR(NVL(hl.HL_CSSCC, 0)) AS CSSCC,
                 hl.HL_NUMLIG AS NUMLIG, NVL(hl.HL_NUMORL, 0) AS NUMORL,
                 hl.HL_CPROIN AS CPROIN
            FROM TB_HLCUMS@HEINENS_STK_PROD hl
           WHERE hl.HL_NUMORC = v_numorc AND hl.HL_CPROIN = v_cproin
             AND hl.HL_ARPROM = v_arprom AND hl.HL_ILOGIS = v_ilogis
             AND hl.HL_DONORD = v_donord
        ) LOOP
          IF s.NUMORL <> 0 OR v_flow8 = 0 THEN
            upsert_htraums(s.USSCC, s.CSSCC, s.NUMLIG, r.TYPIND, r.VALIND, r.USERID);
          END IF;
          IF s.NUMORL <> 0 THEN
            write_shipment_ind(s.USSCC, s.CSSCC, s.NUMLIG, s.NUMORL, s.CPROIN, 1,
                               r.TYPIND, r.VALIND, v_catind, r.USERID);
          END IF;
        END LOOP;
      END IF;
      IF v_numorl <> 0 OR v_flow8 = 0 THEN
        upsert_traums(r.USSCC, v_csscc, r.NUMLIG, r.TYPIND, r.VALIND, r.USERID);
      END IF;
      IF v_numorl <> 0 THEN
        write_shipment_ind(r.USSCC, v_csscc, r.NUMLIG, v_numorl, v_cproin, 0,
                           r.TYPIND, r.VALIND, v_catind, r.USERID);
      END IF;
    END IF;
  END LOOP;
  COMMIT;
END;
!'),
       ':param1=REQUESTID', '', 1, 0, 1
  FROM dual;

INSERT INTO LIBQUERY (
  QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'WHS0000011', 'Pallet/SSCC trace - DELETE indicator', 'Delete TMVTR/HTMVTR and TMVTE/HTMVTE for receipt/shipment NLIG. Body: USSCC,CSSCC,NUMLIG,TYPIND,SOURCE.',
       TO_CLOB(q'!DECLARE
  v_source     VARCHAR2(10);
  v_ok         NUMBER;
  v_nligmv     NUMBER(18);
  v_numorc     NUMBER(6);
  v_numorl     NUMBER(6);
  v_donord     VARCHAR2(5);
  v_cproin     VARCHAR2(15);
  v_arprom     VARCHAR2(5);
  v_ilogis     VARCHAR2(5);
  v_typcde     VARCHAR2(5);
  v_flow8      NUMBER;
  v_recv_usscc VARCHAR2(18);
  v_csscc      VARCHAR2(18);
  v_rcpt_hist  NUMBER;
  v_mvt_hist   NUMBER;

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

  PROCEDURE classify_receipt(p_numorc IN NUMBER, p_rcpt_hist IN OUT NUMBER) IS
    v_cnt NUMBER;
  BEGIN
    IF NVL(p_numorc, 0) = 0 THEN RETURN; END IF;
    SELECT COUNT(*) INTO v_cnt FROM TB_EREC@HEINENS_STK_PROD oe
     WHERE oe.OE_NUMORC = p_numorc AND ROWNUM = 1;
    IF v_cnt > 0 THEN p_rcpt_hist := 0; RETURN; END IF;
    SELECT COUNT(*) INTO v_cnt FROM TB_HEREC@HEINENS_STK_PROD hr
     WHERE hr.HO_NUMORC = p_numorc AND ROWNUM = 1;
    IF v_cnt > 0 THEN p_rcpt_hist := 1; END IF;
  END classify_receipt;

  PROCEDURE resolve_agrn_from_shipment(
    p_numorl IN NUMBER, p_donord IN VARCHAR2, p_typcde IN VARCHAR2,
    p_numorc IN OUT NUMBER, p_rcpt_hist IN OUT NUMBER
  ) IS
    v_po VARCHAR2(35);
  BEGIN
    IF NVL(p_numorc, 0) <> 0 THEN
      classify_receipt(p_numorc, p_rcpt_hist); RETURN;
    END IF;
    IF NVL(p_numorl, 0) = 0 THEN RETURN; END IF;
    BEGIN
      SELECT TRIM(hc.HD_NCDEFO) INTO v_po FROM TB_HECDE@HEINENS_STK_PROD hc
       WHERE hc.HD_NUMORL = p_numorl AND hc.HD_DONORD = p_donord
         AND TRIM(hc.HD_NCDEFO) IS NOT NULL AND ROWNUM = 1;
    EXCEPTION WHEN NO_DATA_FOUND THEN
      BEGIN
        SELECT TRIM(c.CD_NCDEFO) INTO v_po FROM TB_ECDE@HEINENS_STK_PROD c
         WHERE c.CD_NUMORL = p_numorl AND c.CD_DONORD = p_donord
           AND TRIM(c.CD_NCDEFO) IS NOT NULL AND ROWNUM = 1;
      EXCEPTION WHEN NO_DATA_FOUND THEN v_po := NULL; END;
    END;
    IF v_po IS NULL THEN RETURN; END IF;
    BEGIN
      SELECT oe.OE_NUMORC INTO p_numorc FROM TB_EREC@HEINENS_STK_PROD oe
       WHERE TRIM(oe.OE_NCDEFO) = v_po AND ROWNUM = 1;
      p_rcpt_hist := 0; RETURN;
    EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
    BEGIN
      SELECT hr.HO_NUMORC INTO p_numorc FROM TB_HEREC@HEINENS_STK_PROD hr
       WHERE TRIM(hr.HO_NCDEFO) = v_po AND ROWNUM = 1;
      p_rcpt_hist := 1;
    EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
  END resolve_agrn_from_shipment;

  PROCEDURE resolve_nligmv(
    p_usscc VARCHAR2,
    p_prefer_hist NUMBER,
    p_numorc IN OUT NUMBER,
    p_cproin VARCHAR2,
    p_arprom VARCHAR2,
    p_ilogis VARCHAR2,
    p_donord VARCHAR2,
    p_nligmv OUT NUMBER,
    p_recv_usscc OUT VARCHAR2,
    p_mvt_hist OUT NUMBER
  ) IS
    PROCEDURE try_hist IS
    BEGIN
      BEGIN
        SELECT m.HR_NLIGMV, m.HR_USSCC, NVL(m.HR_NUMORC, p_numorc)
!') ||
       TO_CLOB(q'!          INTO p_nligmv, p_recv_usscc, p_numorc
          FROM TB_HMVTRE@HEINENS_STK_PROD m
         WHERE m.HR_USSCC = p_usscc AND ROWNUM = 1;
        p_mvt_hist := 1; RETURN;
      EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
      IF NVL(p_numorc, 0) = 0 THEN RETURN; END IF;
      BEGIN
        SELECT m.HR_NLIGMV, m.HR_USSCC, NVL(m.HR_NUMORC, p_numorc)
          INTO p_nligmv, p_recv_usscc, p_numorc
          FROM TB_HMVTRE@HEINENS_STK_PROD m
         WHERE m.HR_NUMORC = p_numorc
           AND TRIM(m.HR_CPROIN) = TRIM(p_cproin)
           AND TO_CHAR(m.HR_DONORD) = TO_CHAR(p_donord)
           AND NVL(TRIM(m.HR_ARPROM), TRIM(p_arprom)) = TRIM(p_arprom)
           AND NVL(TRIM(m.HR_ILOGIS), TRIM(p_ilogis)) = TRIM(p_ilogis)
           AND ROWNUM = 1;
        p_mvt_hist := 1; RETURN;
      EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
      BEGIN
        SELECT m.HR_NLIGMV, m.HR_USSCC, NVL(m.HR_NUMORC, p_numorc)
          INTO p_nligmv, p_recv_usscc, p_numorc
          FROM TB_HMVTRE@HEINENS_STK_PROD m
         WHERE m.HR_NUMORC = p_numorc
           AND TRIM(m.HR_CPROIN) = TRIM(p_cproin)
           AND TO_CHAR(m.HR_DONORD) = TO_CHAR(p_donord)
           AND ROWNUM = 1;
        p_mvt_hist := 1; RETURN;
      EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
      BEGIN
        SELECT m.HR_NLIGMV, m.HR_USSCC, NVL(m.HR_NUMORC, p_numorc)
          INTO p_nligmv, p_recv_usscc, p_numorc
          FROM TB_HMVTRE@HEINENS_STK_PROD m
         WHERE m.HR_NUMORC = p_numorc
           AND TRIM(m.HR_CPROIN) = TRIM(p_cproin)
           AND ROWNUM = 1;
        p_mvt_hist := 1; RETURN;
      EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
      BEGIN
        SELECT m.HR_NLIGMV, m.HR_USSCC, NVL(m.HR_NUMORC, p_numorc)
          INTO p_nligmv, p_recv_usscc, p_numorc
          FROM TB_HMVTRE@HEINENS_STK_PROD m
         WHERE m.HR_NUMORC = p_numorc AND ROWNUM = 1;
        p_mvt_hist := 1;
      EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
    END try_hist;

    PROCEDURE try_live IS
    BEGIN
      BEGIN
        SELECT m.MR_NLIGMV, m.MR_USSCC, NVL(m.MR_NUMORC, p_numorc)
          INTO p_nligmv, p_recv_usscc, p_numorc
          FROM TB_MVTRE@HEINENS_STK_PROD m
         WHERE m.MR_USSCC = p_usscc AND ROWNUM = 1;
        p_mvt_hist := 0; RETURN;
      EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
      IF NVL(p_numorc, 0) = 0 THEN RETURN; END IF;
      BEGIN
        SELECT m.MR_NLIGMV, m.MR_USSCC, NVL(m.MR_NUMORC, p_numorc)
          INTO p_nligmv, p_recv_usscc, p_numorc
          FROM TB_MVTRE@HEINENS_STK_PROD m
         WHERE m.MR_NUMORC = p_numorc
           AND TRIM(m.MR_CPROIN) = TRIM(p_cproin)
           AND TO_CHAR(m.MR_DONORD) = TO_CHAR(p_donord)
           AND NVL(TRIM(m.MR_ARPROM), TRIM(p_arprom)) = TRIM(p_arprom)
           AND NVL(TRIM(m.MR_ILOGIS), TRIM(p_ilogis)) = TRIM(p_ilogis)
           AND ROWNUM = 1;
        p_mvt_hist := 0; RETURN;
      EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
      BEGIN
        SELECT m.MR_NLIGMV, m.MR_USSCC, NVL(m.MR_NUMORC, p_numorc)
          INTO p_nligmv, p_recv_usscc, p_numorc
          FROM TB_MVTRE@HEINENS_STK_PROD m
         WHERE m.MR_NUMORC = p_numorc
           AND TRIM(m.MR_CPROIN) = TRIM(p_cproin)
           AND TO_CHAR(m.MR_DONORD) = TO_CHAR(p_donord)
           AND ROWNUM = 1;
        p_mvt_hist := 0; RETURN;
      EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
      BEGIN
        SELECT m.MR_NLIGMV, m.MR_USSCC, NVL(m.MR_NUMORC, p_numorc)
          INTO p_nligmv, p_recv_usscc, p_numorc
!') ||
       TO_CLOB(q'!          FROM TB_MVTRE@HEINENS_STK_PROD m
         WHERE m.MR_NUMORC = p_numorc
           AND TRIM(m.MR_CPROIN) = TRIM(p_cproin)
           AND ROWNUM = 1;
        p_mvt_hist := 0; RETURN;
      EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
      BEGIN
        SELECT m.MR_NLIGMV, m.MR_USSCC, NVL(m.MR_NUMORC, p_numorc)
          INTO p_nligmv, p_recv_usscc, p_numorc
          FROM TB_MVTRE@HEINENS_STK_PROD m
         WHERE m.MR_NUMORC = p_numorc AND ROWNUM = 1;
        p_mvt_hist := 0;
      EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
    END try_live;
  BEGIN
    p_nligmv := NULL;
    p_recv_usscc := NULL;
    p_mvt_hist := p_prefer_hist;
    IF p_prefer_hist = 1 THEN
      try_hist;
      IF p_nligmv IS NULL THEN try_live; END IF;
    ELSE
      try_live;
      IF p_nligmv IS NULL THEN try_hist; END IF;
    END IF;
  END resolve_nligmv;

  PROCEDURE resolve_nligme(
    p_usscc VARCHAR2, p_numorl NUMBER, p_cproin VARCHAR2, p_prefer_hist NUMBER,
    p_nligme OUT NUMBER, p_ship_hist OUT NUMBER
  ) IS
    v_dx DATE;
    PROCEDURE try_live IS
    BEGIN
      IF NVL(p_numorl, 0) = 0 THEN RETURN; END IF;
      BEGIN
        SELECT m.ME_NLIGME INTO p_nligme
          FROM TB_MVTEX@HEINENS_STK_PROD m
         WHERE m.ME_USSCC = p_usscc AND m.ME_NUMORL = p_numorl
           AND TRIM(m.ME_CPROIN) = TRIM(p_cproin) AND ROWNUM = 1;
        p_ship_hist := 0; RETURN;
      EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
      BEGIN
        SELECT m.ME_NLIGME INTO p_nligme
          FROM TB_MVTEX@HEINENS_STK_PROD m
         WHERE m.ME_USSCC = p_usscc AND m.ME_NUMORL = p_numorl AND ROWNUM = 1;
        p_ship_hist := 0;
      EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
    END try_live;
    PROCEDURE try_hist IS
    BEGIN
      IF NVL(p_numorl, 0) = 0 THEN RETURN; END IF;
      BEGIN
        SELECT m.HT_NLIGME INTO p_nligme
          FROM TB_HMVTEX@HEINENS_STK_PROD m
         WHERE m.HT_USSCC = p_usscc AND m.HT_NUMORL = p_numorl
           AND TRIM(m.HT_CPROIN) = TRIM(p_cproin) AND ROWNUM = 1;
        p_ship_hist := 1; RETURN;
      EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
      BEGIN
        SELECT m.HT_NLIGME INTO p_nligme
          FROM TB_HMVTEX@HEINENS_STK_PROD m
         WHERE m.HT_USSCC = p_usscc AND m.HT_NUMORL = p_numorl AND ROWNUM = 1;
        p_ship_hist := 1;
      EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
    END try_hist;
  BEGIN
    p_nligme := NULL; p_ship_hist := p_prefer_hist;
    IF p_prefer_hist = 1 THEN
      try_hist; IF p_nligme IS NULL THEN try_live; END IF;
    ELSE
      try_live; IF p_nligme IS NULL THEN try_hist; END IF;
    END IF;
  END resolve_nligme;

  PROCEDURE delete_shipment_ind(
    p_usscc VARCHAR2, p_numorl NUMBER, p_cproin VARCHAR2,
    p_prefer_hist NUMBER, p_typind VARCHAR2
  ) IS
    v_nlig NUMBER(18);
    v_sh   NUMBER;
  BEGIN
    IF NVL(p_numorl, 0) = 0 THEN RETURN; END IF;
    resolve_nligme(p_usscc, p_numorl, p_cproin, p_prefer_hist, v_nlig, v_sh);
    IF v_nlig IS NULL THEN RETURN; END IF;
    IF v_sh = 1 THEN
      DELETE FROM TB_HTMVTE@HEINENS_STK_PROD t
       WHERE t.HT_NLIGME = v_nlig AND t.HT_TYPIND = p_typind;
    ELSE
      DELETE FROM TB_TMVTE@HEINENS_STK_PROD t
       WHERE t.MT_NLIGME = v_nlig AND t.MT_TYPIND = p_typind;
    END IF;
  END delete_shipment_ind;

BEGIN
  FOR r IN c_rows LOOP
    v_source := CASE WHEN r.SOURCE = 'ARCHIVE' THEN 'ARCHIVE' ELSE 'LIVE' END;
    v_nligmv := NULL; v_numorc := NULL; v_numorl := NULL; v_flow8 := 0;
!') ||
       TO_CLOB(q'!    v_rcpt_hist := CASE WHEN v_source = 'ARCHIVE' THEN 1 ELSE 0 END;
    v_mvt_hist := v_rcpt_hist;
    v_csscc := NVL(NULLIF(TRIM(r.CSSCC), ''), '0');

    IF v_source = 'ARCHIVE' THEN
      SELECT COUNT(*) INTO v_ok FROM TB_HEUMS@HEINENS_STK_PROD he
        JOIN TB_HLCUMS@HEINENS_STK_PROD hl ON hl.HL_USSCC = he.HE_USSCC
       WHERE he.HE_USSCC = r.USSCC AND TO_CHAR(NVL(hl.HL_CSSCC, 0)) = TO_CHAR(v_csscc)
         AND hl.HL_NUMLIG = r.NUMLIG;
      IF v_ok = 0 THEN
        RAISE_APPLICATION_ERROR(-20087, 'Archived SSCC '||r.USSCC||' line not found.');
      END IF;
      SELECT NVL(hl.HL_NUMORC,0), NVL(hl.HL_NUMORL,0), hl.HL_DONORD, hl.HL_CPROIN,
             hl.HL_ARPROM, hl.HL_ILOGIS, hl.HL_TYPCDE, TO_CHAR(NVL(hl.HL_CSSCC,0))
        INTO v_numorc, v_numorl, v_donord, v_cproin, v_arprom, v_ilogis, v_typcde, v_csscc
        FROM TB_HLCUMS@HEINENS_STK_PROD hl
       WHERE hl.HL_USSCC = r.USSCC AND TO_CHAR(NVL(hl.HL_CSSCC,0)) = TO_CHAR(NVL(NULLIF(TRIM(r.CSSCC),''),'0'))
         AND hl.HL_NUMLIG = r.NUMLIG AND ROWNUM = 1;
      resolve_agrn_from_shipment(v_numorl, v_donord, v_typcde, v_numorc, v_rcpt_hist);
      v_flow8 := CASE WHEN TRIM(NVL(v_typcde,' ')) = '8' THEN 1 ELSE 0 END;
      resolve_nligmv(r.USSCC, v_rcpt_hist, v_numorc, v_cproin, v_arprom, v_ilogis, v_donord,
                     v_nligmv, v_recv_usscc, v_mvt_hist);
      IF v_nligmv IS NOT NULL THEN
        IF v_mvt_hist = 1 THEN
          DELETE FROM TB_HTMVTR@HEINENS_STK_PROD t
           WHERE t.HT_NLIGMV = v_nligmv AND t.HT_TYPIND = r.TYPIND;
        ELSE
          DELETE FROM TB_TMVTR@HEINENS_STK_PROD t
           WHERE t.TR_NLIGMV = v_nligmv AND t.TR_TYPIND = r.TYPIND;
        END IF;
      END IF;
      IF NVL(v_numorc,0) <> 0 THEN
        FOR s IN (
          SELECT hl.HL_USSCC u, TO_CHAR(NVL(hl.HL_CSSCC,0)) c, hl.HL_NUMLIG n,
                 NVL(hl.HL_NUMORL,0) o, hl.HL_CPROIN p
            FROM TB_HLCUMS@HEINENS_STK_PROD hl
           WHERE hl.HL_NUMORC = v_numorc AND hl.HL_CPROIN = v_cproin
             AND hl.HL_ARPROM = v_arprom AND hl.HL_ILOGIS = v_ilogis AND hl.HL_DONORD = v_donord
        ) LOOP
          IF s.o <> 0 OR v_flow8 = 0 THEN
            DELETE FROM TB_HTRAUMS@HEINENS_STK_PROD t
             WHERE t.HT_USSCC = s.u AND TO_CHAR(NVL(t.HT_CSSCC,0)) = s.c
               AND t.HT_NUMLIG = s.n AND t.HT_TYPIND = r.TYPIND;
          END IF;
          IF s.o <> 0 THEN
            delete_shipment_ind(s.u, s.o, s.p, 1, r.TYPIND);
          END IF;
        END LOOP;
        FOR s IN (
          SELECT l.UL_USSCC u, TO_CHAR(NVL(l.UL_CSSCC,0)) c, l.UL_NUMLIG n,
                 NVL(l.UL_NUMORL,0) o, l.UL_CPROIN p
            FROM TB_LCUMS@HEINENS_STK_PROD l
           WHERE l.UL_NUMORC = v_numorc AND l.UL_CPROIN = v_cproin
             AND l.UL_ARPROM = v_arprom AND l.UL_ILOGIS = v_ilogis AND l.UL_DONORD = v_donord
        ) LOOP
          IF s.o <> 0 OR v_flow8 = 0 THEN
            DELETE FROM TB_TRAUMS@HEINENS_STK_PROD t
             WHERE t.UT_USSCC = s.u AND TO_CHAR(NVL(t.UT_CSSCC,0)) = s.c
               AND t.UT_NUMLIG = s.n AND t.UT_TYPIND = r.TYPIND;
          END IF;
          IF s.o <> 0 THEN
            delete_shipment_ind(s.u, s.o, s.p, 0, r.TYPIND);
          END IF;
        END LOOP;
      END IF;
      IF v_numorl <> 0 OR v_flow8 = 0 THEN
        DELETE FROM TB_HTRAUMS@HEINENS_STK_PROD t
         WHERE t.HT_USSCC = r.USSCC AND TO_CHAR(NVL(t.HT_CSSCC,0)) = TO_CHAR(v_csscc)
           AND t.HT_NUMLIG = r.NUMLIG AND t.HT_TYPIND = r.TYPIND;
!') ||
       TO_CLOB(q'!      END IF;
      IF v_numorl <> 0 THEN
        delete_shipment_ind(r.USSCC, v_numorl, v_cproin, 1, r.TYPIND);
      END IF;
    ELSE
      SELECT COUNT(*) INTO v_ok FROM TB_EUMS@HEINENS_STK_PROD e
        JOIN TB_LCUMS@HEINENS_STK_PROD l ON l.UL_USSCC = e.UE_USSCC
       WHERE e.UE_USSCC = r.USSCC AND TO_CHAR(NVL(l.UL_CSSCC,0)) = TO_CHAR(v_csscc)
         AND l.UL_NUMLIG = r.NUMLIG;
      IF v_ok = 0 THEN
        RAISE_APPLICATION_ERROR(-20087, 'SSCC '||r.USSCC||' line not found on EUMS/LCUMS.');
      END IF;
      SELECT NVL(l.UL_NUMORC,0), NVL(l.UL_NUMORL,0), l.UL_DONORD, l.UL_CPROIN,
             l.UL_ARPROM, l.UL_ILOGIS, l.UL_TYPCDE, TO_CHAR(NVL(l.UL_CSSCC,0))
        INTO v_numorc, v_numorl, v_donord, v_cproin, v_arprom, v_ilogis, v_typcde, v_csscc
        FROM TB_LCUMS@HEINENS_STK_PROD l
       WHERE l.UL_USSCC = r.USSCC AND TO_CHAR(NVL(l.UL_CSSCC,0)) = TO_CHAR(NVL(NULLIF(TRIM(r.CSSCC),''),'0'))
         AND l.UL_NUMLIG = r.NUMLIG AND ROWNUM = 1;
      resolve_agrn_from_shipment(v_numorl, v_donord, v_typcde, v_numorc, v_rcpt_hist);
      v_flow8 := CASE WHEN TRIM(NVL(v_typcde,' ')) = '8' THEN 1 ELSE 0 END;
      resolve_nligmv(r.USSCC, v_rcpt_hist, v_numorc, v_cproin, v_arprom, v_ilogis, v_donord,
                     v_nligmv, v_recv_usscc, v_mvt_hist);
      IF v_nligmv IS NOT NULL THEN
        IF v_mvt_hist = 1 THEN
          DELETE FROM TB_HTMVTR@HEINENS_STK_PROD t
           WHERE t.HT_NLIGMV = v_nligmv AND t.HT_TYPIND = r.TYPIND;
        ELSE
          DELETE FROM TB_TMVTR@HEINENS_STK_PROD t
           WHERE t.TR_NLIGMV = v_nligmv AND t.TR_TYPIND = r.TYPIND;
        END IF;
      END IF;
      IF NVL(v_numorc,0) <> 0 THEN
        FOR s IN (
          SELECT l.UL_USSCC u, TO_CHAR(NVL(l.UL_CSSCC,0)) c, l.UL_NUMLIG n,
                 NVL(l.UL_NUMORL,0) o, l.UL_CPROIN p
            FROM TB_LCUMS@HEINENS_STK_PROD l
           WHERE l.UL_NUMORC = v_numorc AND l.UL_CPROIN = v_cproin
             AND l.UL_ARPROM = v_arprom AND l.UL_ILOGIS = v_ilogis AND l.UL_DONORD = v_donord
        ) LOOP
          IF s.o <> 0 OR v_flow8 = 0 THEN
            DELETE FROM TB_TRAUMS@HEINENS_STK_PROD t
             WHERE t.UT_USSCC = s.u AND TO_CHAR(NVL(t.UT_CSSCC,0)) = s.c
               AND t.UT_NUMLIG = s.n AND t.UT_TYPIND = r.TYPIND;
          END IF;
          IF s.o <> 0 THEN
            delete_shipment_ind(s.u, s.o, s.p, 0, r.TYPIND);
          END IF;
        END LOOP;
        FOR s IN (
          SELECT hl.HL_USSCC u, TO_CHAR(NVL(hl.HL_CSSCC,0)) c, hl.HL_NUMLIG n,
                 NVL(hl.HL_NUMORL,0) o, hl.HL_CPROIN p
            FROM TB_HLCUMS@HEINENS_STK_PROD hl
           WHERE hl.HL_NUMORC = v_numorc AND hl.HL_CPROIN = v_cproin
             AND hl.HL_ARPROM = v_arprom AND hl.HL_ILOGIS = v_ilogis AND hl.HL_DONORD = v_donord
        ) LOOP
          IF s.o <> 0 OR v_flow8 = 0 THEN
            DELETE FROM TB_HTRAUMS@HEINENS_STK_PROD t
             WHERE t.HT_USSCC = s.u AND TO_CHAR(NVL(t.HT_CSSCC,0)) = s.c
               AND t.HT_NUMLIG = s.n AND t.HT_TYPIND = r.TYPIND;
          END IF;
          IF s.o <> 0 THEN
            delete_shipment_ind(s.u, s.o, s.p, 1, r.TYPIND);
          END IF;
        END LOOP;
      END IF;
      IF v_numorl <> 0 OR v_flow8 = 0 THEN
        DELETE FROM TB_TRAUMS@HEINENS_STK_PROD t
         WHERE t.UT_USSCC = r.USSCC AND TO_CHAR(NVL(t.UT_CSSCC,0)) = TO_CHAR(v_csscc)
           AND t.UT_NUMLIG = r.NUMLIG AND t.UT_TYPIND = r.TYPIND;
      END IF;
      IF v_numorl <> 0 THEN
!') ||
       TO_CLOB(q'!        delete_shipment_ind(r.USSCC, v_numorl, v_cproin, 0, r.TYPIND);
      END IF;
    END IF;
  END LOOP;
  COMMIT;
END;
!'),
       ':param1=REQUESTID', '', 1, 0, 1
  FROM dual;

COMMIT;

SET DEFINE ON;
