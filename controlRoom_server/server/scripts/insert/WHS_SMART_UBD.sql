
DELETE FROM SMARTUBD WHERE TO_CHAR(SNAPDATE,'WWRRRR')=TO_CHAR(SYSDATE,'WWRRRR');

INSERT INTO SMARTUBD
("SNAPDATE", "Param UBD end",
"Param Closed UBD",
"Whs",
"Item code desc",
"Supplier code desc",
"Category Mgr",
"UBD",
"Status",
"Hypothetical push",
"Shelf life (store/consumer)",
"Inventory (Ship. unit)",
"Case Pack",
"CLE retail",
"Case cost",
"Total cost",
"Weeks of inventory",
"Nb Promo",
"Active since",
"Whs. discontinued on",
"Shipping unit",
"Shipped per week",
"Sold per week",
"Projection per week",
"Trend sales Week-1 (%)",
"Trend sales Week-2 (%)",
"Trend sales Week-3 (%)",
"Trend sales Week-4 (%)",
"Qty sold Week-1 (sku)",
"Qty sold Week-2 (sku)",
"Qty sold Week-3 (sku)",
"Qty sold Week-4 (sku)",
"New in report item",
"Received on",
"Average UBD")
WITH UBD_ITEMS AS
 (SELECT UL_DONORD,
         '[' || LISTAGG(UE_USSCC, ' | ' ON OVERFLOW TRUNCATE) WITHIN GROUP(ORDER BY UE_USSCC) || ']' SSCC_ADDRESS,
         UL_CPROIN,
         UL_ILOGIS,
         UL_ARPROM,
         UT_VALIND,
         SUM(UL_NQTUVC) INV_SKU,
         SUM(UL_NQTEUP) INV_PU,
         AR_LIBPRO,
         AR_FOURN,
         AR_NRSFOU,
         AR_NIV4,
         AR_NUVSPC * AR_NSPCCA PCK,
         AR_NUVSPC IPCK,
         AR_NUVCUP "Shipping qty",
         AR_NCOUPA,
         AR_NCACOU,
         AR_NSPCCA,
         AR_NUVSPC,
         AR_CODEUP, /* 2 : inner, 3: Pck */
         ARLCINLUVC,
         NVL(ARTPOV, 0) ARTPOV,
         NVL(ARTPOC, 0) ARTPOC,
         TRUNC(ue_datrec) "Received on",
         ARLSEQVL
    FROM TB_EUMS@HEINENS_STK_PROD,
         TB_LCUMS@HEINENS_STK_PROD,
         TB_TRAUMS@HEINENS_STK_PROD,
         TB_ART@HEINENS_STK_PROD,
         ARTVL@HEINENS_CEN_PROD,
         ARTRAC@HEINENS_CEN_PROD
   WHERE UT_VALIND IS NOT NULL
     AND UT_TYPIND='DLC'
     AND UL_USSCC = UE_USSCC
     AND UE_INDFIC = '1'
     AND UL_USSCC = UT_USSCC
     AND UL_CSSCC = UT_CSSCC
     AND UL_DONORD IN (90061,91071, 91070)
--    AND UL_DONORD = 91071
     AND UL_NUMLIG = UT_NUMLIG
     AND AR_CPROIN = UL_CPROIN
     AND AR_ILOGIS = UL_ILOGIS
     AND AR_ARPROM = UL_ARPROM
     AND AR_DONORD = UL_DONORD
     AND ARLCINR = ARTCINR
     AND (TRUNC(SYSDATE) + DECODE(ul_donord, 91070, 30, 120) + NVL(ARTPOV, 0) + NVL(ARTPOC, 0)) >= TO_DATE(UT_VALIND, 'RRRRMMDD')
     AND UL_CPROIN = ARLCEXR
     AND ARLCEXVL = TO_NUMBER(UL_ILOGIS)
   GROUP BY UL_DONORD,
            UT_VALIND,
            UL_CPROIN,
            UL_ILOGIS,
            UL_ARPROM,
            AR_NUVSPC,
            AR_CODEUP,
            ARLSEQVL,
            TRUNC(ue_datrec),
            AR_NUVCUP,
            AR_NCOUPA,
            AR_NCACOU,
            AR_NSPCCA,
            AR_NUVSPC,
            AR_LIBPRO,
            AR_FOURN,
            AR_NRSFOU,
            AR_NIV4,
            ARTPOV,
            ARTPOC,
            AR_NUVSPC * AR_NSPCCA,
            ARLCINLUVC),
UBD_ITEMS_MULTI_SSCC AS
 (SELECT UL_DONORD,
         SSCC_ADDRESS,
         UL_CPROIN,
         UL_ILOGIS,
         UL_ARPROM,
         UT_VALIND,
         "Received on",
         INV_SKU,
         INV_PU,
         AR_LIBPRO,
         AR_FOURN,
         AR_NRSFOU,
         AR_NIV4,
         PCK,
         IPCK,
         "Shipping qty",
         AR_NCOUPA,
         AR_NCACOU,
         AR_NSPCCA,
         AR_NUVSPC,
         AR_CODEUP, /* 2 : inner, 3: Pck */
         ARLCINLUVC,
         NVL(ARTPOV, 0) ARTPOV,
         NVL(ARTPOC, 0) ARTPOC,
         ARLSEQVL,
         NVL((SELECT MAX(TO_DATE(UT_VALIND, 'RRRRMMDD') - ARTPOV - ARTPOC)
               FROM UBD_ITEMS OTH
              WHERE IT.UL_CPROIN = OTH.UL_CPROIN
                AND IT.ARLSEQVL = OTH.ARLSEQVL
                AND IT.UT_VALIND > OTH.UT_VALIND
                AND IT.UL_DONORD = OTH.UL_DONORD
                AND INV_SKU > 0),
             TRUNC(SYSDATE)) PERIOD_MIN,
         (SELECT COUNT(DISTINCT UT_VALIND)
            FROM UBD_ITEMS OTH
           WHERE IT.UL_CPROIN = OTH.UL_CPROIN
             AND IT.ARLSEQVL = OTH.ARLSEQVL
             AND IT.UL_DONORD = OTH.UL_DONORD
             AND INV_SKU > 0) NB_SSCC
    FROM UBD_ITEMS IT),
UBD_ITEMS_WITH_PROJECTION AS
 (SELECT UL_DONORD,
         SSCC_ADDRESS,
         UL_CPROIN,
         UL_ILOGIS,
         "Shipping qty",
         UT_VALIND,
         "Received on",
         INV_SKU,
         INV_PU,
         PCK,
         IPCK,
         AR_FOURN,
         AR_NRSFOU,
         AR_LIBPRO,
         ARLCINLUVC,
         AR_CODEUP,
         ARLSEQVL,
         NVL((SELECT ROUND(SUM(PVDREEL) / 4, 2)
               FROM FCTENTPVH@HEINENS_CEN_PROD, FCTDETPVH@HEINENS_CEN_PROD
              WHERE PVDEID = PVEID
                AND PVESITE = UL_DONORD
                AND PVECINL = ARLCINLUVC
                AND PVDNSEM BETWEEN TO_CHAR(SYSDATE - 5 * 7, 'RRRRWW') AND
                    TO_CHAR(SYSDATE - 1 * 7, 'RRRRWW')),
             0) "SKU shipped per week",
         (SELECT AVG(PVDCALC)
            FROM FCTENTPVH@HEINENS_CEN_PROD, FCTDETPVH@HEINENS_CEN_PROD
           WHERE PVDEID = PVEID
             AND PVESITE = UL_DONORD
             AND PVECINL = ARLCINLUVC
             AND PVDNSEM BETWEEN TO_NUMBER(TO_CHAR(PERIOD_MIN, 'RRRRWW')) AND
                 TO_NUMBER(TO_CHAR(TO_DATE(UT_VALIND, 'RRRRMMDD') - ARTPOV -
                                   ARTPOC,
                                   'RRRRWW'))) "Projection",
         (SELECT SUM(PVDCALC)
            FROM FCTENTPVH@HEINENS_CEN_PROD, FCTDETPVH@HEINENS_CEN_PROD
           WHERE PVDEID = PVEID
             AND PVESITE = UL_DONORD
             AND PVECINL = ARLCINLUVC
             AND PVDNSEM BETWEEN TO_NUMBER(TO_CHAR(PERIOD_MIN, 'RRRRWW')) AND
                 TO_NUMBER(TO_CHAR(TO_DATE(UT_VALIND, 'RRRRMMDD') - ARTPOV -
                                   ARTPOC,
                                   'RRRRWW'))) "Projection SKU",
         (SELECT ROUND(SUM(STMVAL) * -1 / 4, 2)
            FROM STOMVT@HEINENS_CEN_PROD
           WHERE STMTMVT = 150
             AND TRUNC(STMDMVT) BETWEEN TRUNC(SYSDATE - 5 * 7) AND
                 TRUNC(SYSDATE - 1)
             AND STMCINL = ARLCINLUVC) "SKU sold per week",
         (SELECT ROUND(SUM(SMSSAIU - SMSCRIU), 2)
            FROM STOMVSEMAINE@HEINENS_CEN_PROD
           WHERE SMSTPOS = 0
             AND SMSSEMAINE = TO_CHAR(SYSDATE - 7, 'RRRRWW')
             AND SMSTTVA = 0
             AND SMSNPOS = 0
             AND SMSCINL = ARLCINLUVC
             AND 50 > SMSSITE) "SKU sold week_1",
         (SELECT ROUND(SUM(SMSSAIU - SMSCRIU), 2)
            FROM STOMVSEMAINE@HEINENS_CEN_PROD
           WHERE SMSTPOS = 0
             AND SMSSEMAINE = TO_CHAR(SYSDATE - 2 * 7, 'RRRRWW')
             AND SMSTTVA = 0
             AND SMSNPOS = 0
             AND SMSCINL = ARLCINLUVC
             AND 50 > SMSSITE) "SKU sold week_2",
         (SELECT ROUND(SUM(SMSSAIU - SMSCRIU), 2)
            FROM STOMVSEMAINE@HEINENS_CEN_PROD
           WHERE SMSTPOS = 0
             AND SMSSEMAINE = TO_CHAR(SYSDATE - 3 * 7, 'RRRRWW')
             AND SMSTTVA = 0
             AND SMSNPOS = 0
             AND SMSCINL = ARLCINLUVC
             AND 50 > SMSSITE) "SKU sold week_3",
         (SELECT ROUND(SUM(SMSSAIU - SMSCRIU), 2)
            FROM STOMVSEMAINE@HEINENS_CEN_PROD
           WHERE SMSTPOS = 0
             AND SMSSEMAINE = TO_CHAR(SYSDATE - 4 * 7, 'RRRRWW')
             AND SMSTTVA = 0
             AND SMSNPOS = 0
             AND SMSCINL = ARLCINLUVC
             AND 50 > SMSSITE) "SKU sold week_4",
         (SELECT ROUND(SUM(SMSSAIU - SMSCRIU), 2)
            FROM STOMVSEMAINE@HEINENS_CEN_PROD
           WHERE SMSTPOS = 0
             AND SMSSEMAINE = TO_CHAR(SYSDATE - 5 * 7, 'RRRRWW')
             AND SMSTTVA = 0
             AND SMSNPOS = 0
             AND SMSCINL = ARLCINLUVC
             AND 50 > SMSSITE) "SKU sold week_5",
         (SELECT ROUND(TAPPBRUT, 2) * 1
            FROM TARPRIX@HEINENS_CEN_PROD, FOUDGENE@HEINENS_CEN_PROD
           WHERE FOUCFIN = TAPCFIN
             AND TAPSITE = UL_DONORD
             AND TAPSEQVL = ARLSEQVL
             AND TRUNC(SYSDATE) BETWEEN TAPDDEB AND TAPDFIN
             AND FOUCNUF = AR_FOURN
             AND ROWNUM = 1) "Case cost",
         (SELECT DECODE(TAPUAPP,
                        1,
                        1,
                        21,
                        AR_NUVSPC,
                        41,
                        AR_NUVSPC * AR_NSPCCA,
                        61,
                        AR_NUVSPC * AR_NSPCCA * AR_NCACOU,
                        81,
                        AR_NUVSPC * AR_NSPCCA * AR_NCACOU * AR_NCOUPA)
            FROM TARPRIX@HEINENS_CEN_PROD, FOUDGENE@HEINENS_CEN_PROD
           WHERE FOUCFIN = TAPCFIN
             AND TAPSITE = UL_DONORD
             AND TAPSEQVL = ARLSEQVL
             AND TRUNC(SYSDATE) BETWEEN TAPDDEB AND TAPDFIN
             AND FOUCNUF = AR_FOURN
             AND ROWNUM = 1) "Cost unit",
         ARTPOC + ARTPOV ARTPOVARTPOC,
         NB_SSCC
    FROM UBD_ITEMS_MULTI_SSCC
   WHERE INV_SKU > 0),
UBD_ITEMS_DATA_PREP AS
 (SELECT UL_DONORD "Whs",
         "Shipping qty",
         UL_CPROIN "Article",
         UL_ILOGIS "LV",
         "Received on",
         ROUND((SELECT AVG(TO_DATE(ht_valind,'RRRRMMDD') - TRUNC(he_datrec))
                FROM tb_heums@HEINENS_STK_PROD t , tb_hlcums@HEINENS_STK_PROD, tb_htraums@HEINENS_STK_PROD
                WHERE he_usscc = hl_usscc
                AND he_codtsu = '1'
                AND ul_cproin=hl_cproin
                AND ul_ilogis=hl_ilogis
                AND ul_donord=hl_donord
                AND ht_usscc=hl_usscc AND ht_typind='DLC'
                AND TRUNC("Received on") > TRUNC(he_datrec)),0)  "Average UBD",
         AR_LIBPRO "Description",
         UL_CPROIN || '/' || TO_NUMBER(UL_ILOGIS) || ' ' || AR_LIBPRO "Item code desc",
         AR_FOURN || ' | ' || AR_NRSFOU "Supplier code desc",
         (SELECT TO_CHAR(MIN(ARADDEB), 'MM/DD/RR')
            FROM ARTUC@HEINENS_CEN_PROD
           WHERE ARACEXR = UL_CPROIN
             AND ARASITE = UL_DONORD) "Active since",
         (SELECT TO_CHAR(MAX(ARADFIN), 'MM/DD/RR')
            FROM ARTUC@HEINENS_CEN_PROD
           WHERE ARACEXR = UL_CPROIN
             AND ARASITE = UL_DONORD) "Whs. discontinued on",
         (SELECT TATTLIBL
            FROM ARTATTRI@HEINENS_CEN_PROD,
                 ARTRAC@HEINENS_CEN_PROD,
                 TRA_ATTRIVAL@HEINENS_CEN_PROD
           WHERE ARTCEXR = UL_CPROIN
             AND ARTCINR = AATCINR
             AND AATCCLA = 'SSNL'
             AND TATTCCLA = AATCCLA
             AND TATTCODE = AATCATT
             AND LANGUE = 'HN'
             AND TRUNC(SYSDATE) BETWEEN AATDDEB AND AATDFIN
             AND ROWNUM = 1) "Seasonal",
         (SELECT TPARLIBL
            FROM ARTRAC@HEINENS_CEN_PROD, TRA_PARPOSTES@HEINENS_CEN_PROD
           WHERE ARTCEXR = UL_CPROIN
             AND ARTGEST = TPARPOST
             AND TPARCMAG = 0
             AND TPARTABL = 1032
             AND LANGUE = 'HN'
             AND ROWNUM = 1) "Categ",
         (SELECT TO_CHAR(AVIPRIX, '999G999G999G999G999G999G990D99') || '/' ||
                 AVIMULTI
            FROM AVEPRIX@HEINENS_CEN_PROD
           WHERE AVICINV = ARLCINLUVC
             AND TRUNC(SYSDATE) BETWEEN AVIDDEB AND AVIDFIN
             AND AVINTAR = 2
             AND ROWNUM = 1) "CLE retail",
         (SELECT AVIMULTI
            FROM AVEPRIX@HEINENS_CEN_PROD
           WHERE AVICINV = ARLCINLUVC
             AND TRUNC(SYSDATE) BETWEEN AVIDDEB AND AVIDFIN
             AND AVINTAR = 2
             AND ROWNUM = 1) "CLE multiple",
         (SELECT '[' ||
                 LISTAGG(AVINTAR || ' - $' || AVIPRIX || ' / ' || AVIMULTI,
                         ' | ' ON OVERFLOW TRUNCATE) WITHIN GROUP(ORDER BY AVINTAR) || ']'
            FROM AVEPRIX@HEINENS_CEN_PROD, AVETAR@HEINENS_CEN_PROD
           WHERE AVICINV = ARLCINLUVC
             AND AVINTAR = AVENTAR
             AND AVESTAT = 2 /* Temporary */
             AND UT_VALIND >= TO_NUMBER(TO_CHAR(AVIDDEB, 'RRRRWW'))
             AND AVIDDEB >= TRUNC(SYSDATE)) "On Promo",
         (SELECT COUNT(DISTINCT(AVIDDEB))
            FROM AVEPRIX@HEINENS_CEN_PROD, AVETAR@HEINENS_CEN_PROD
           WHERE AVICINV = ARLCINLUVC
             AND AVINTAR = AVENTAR
             AND AVESTAT = 2 /* Temporary */
             AND UT_VALIND >= TO_NUMBER(TO_CHAR(AVIDDEB, 'RRRRWW')) 
             AND AVIDDEB >= TRUNC(SYSDATE)) "Nb Promo",
         TO_DATE(UT_VALIND, 'RRRRMMDD') "UBD",
         SSCC_ADDRESS "SSCC",
         CEIL(INV_SKU / "Shipping qty") "Inventory (Ship. unit)",
         "Shipping qty" "Case Pack",
         ROUND("Projection" / "Shipping qty") "Projection per week",
         DECODE(AR_CODEUP, 2, 'Inner pack', 3, 'Pck', AR_CODEUP) "Shipping unit",
         ROUND("Case cost", 2) "Case cost",
         ROUND("Case cost" / "Cost unit", 2) "Unit cost",
         ROUND(INV_SKU * "Case cost" / "Cost unit", 2) "Total cost",
         ROUND(CEIL(INV_SKU / DECODE("SKU shipped per week",
                                     0,
                                     "SKU sold per week",
                                     "SKU shipped per week")),
               1) "Weeks of inventory",
         (CASE
           WHEN 0.8 > "Projection SKU" / INV_SKU THEN
            'High'
           WHEN "Projection SKU" / INV_SKU BETWEEN 0.8 AND 1 THEN
            'Medium'
           WHEN "Projection SKU" / INV_SKU BETWEEN 1 AND 1.2 THEN
            'Low'
           WHEN "Projection SKU" / INV_SKU > 1.2 AND
                TRUNC(SYSDATE + DECODE(ul_donord, 91070, 20, 60)) >= TO_DATE(UT_VALIND, 'RRRRMMDD') THEN
            'Closed'
           WHEN "Projection SKU" / INV_SKU > 1.2 AND
                TO_DATE(UT_VALIND, 'RRRRMMDD') > TRUNC(SYSDATE + DECODE(ul_donord, 91070, 20, 60)) AND
                NB_SSCC > 1 THEN
            'Linked'
           ELSE
            '----'
         END) "PreStatus",
         (CASE
           WHEN 0.8 > "Projection SKU" / INV_SKU THEN
            '1'
           WHEN "Projection SKU" / INV_SKU BETWEEN 0.8 AND 1 THEN
            '2'
           WHEN "Projection SKU" / INV_SKU BETWEEN 1 AND 1.2 THEN
            '3'
           WHEN "Projection SKU" / INV_SKU > 1.2 AND
                TRUNC(SYSDATE + DECODE(ul_donord, 91070, 20, 30)) >= TO_DATE(UT_VALIND, 'RRRRMMDD') THEN
            '4'
           WHEN "Projection SKU" / INV_SKU > 1.2 AND
                TO_DATE(UT_VALIND, 'RRRRMMDD') > TRUNC(SYSDATE + DECODE(ul_donord, 91070, 20, 30)) AND
                NB_SSCC > 1 THEN
            '5'
           ELSE
            '6'
         END) "StatusNumber",
         ROUND("SKU shipped per week" / "Shipping qty", 2) "Shipped per week",
         ROUND("SKU sold per week" / "Shipping qty", 2) "Sold per week",
         "Projection",
         ARLCINLUVC,
         ARLSEQVL,
         SSCC_ADDRESS,
         GREATEST(CEIL((INV_SKU - "Projection SKU") / "Shipping qty"), 0) "Hypothetical push",
         ARTPOVARTPOC "In Store",
         "SKU sold week_5",
         "SKU sold week_4",
         "SKU sold week_3",
         "SKU sold week_2",
         "SKU sold week_1",
         ROUND(("SKU sold week_4" - "SKU sold week_5") /
               DECODE("SKU sold week_5", 0, 1, "SKU sold week_5"),
               2) "SKU sold trend_4",
         ROUND(("SKU sold week_3" - "SKU sold week_4") /
               DECODE("SKU sold week_4", 0, 1, "SKU sold week_4"),
               2) "SKU sold trend_3",
         ROUND(("SKU sold week_2" - "SKU sold week_3") /
               DECODE("SKU sold week_3", 0, 1, "SKU sold week_3"),
               2) "SKU sold trend_2",
         ROUND(("SKU sold week_1" - "SKU sold week_2") /
               DECODE("SKU sold week_2", 0, 1, "SKU sold week_2"),
               2) "SKU sold trend_1"
    FROM UBD_ITEMS_WITH_PROJECTION),
PRE_FORMAT AS (
SELECT SYSDATE SNAPDATE,
       DECODE("Whs", 91070, 30, 120) "Param UBD end",
       DECODE("Whs", 91070, 20, 60) "Param Closed UBD",
       "Whs", "Item code desc",
       "Supplier code desc",
       "Categ" "Category Mgr",
       "UBD",
       NVL((SELECT 'Linked'
             FROM UBD_ITEMS_DATA_PREP OTH
            WHERE it."Whs" = oth."Whs"
              AND it."Article" = oth."Article"
              AND IT.ARLSEQVL = OTH.ARLSEQVL
              AND it."UBD" != oth."UBD"
              AND "PreStatus" IN ('Linked', '----')
              AND ROWNUM = 1
              AND "Hypothetical push" > 0),
           "PreStatus") "Status",
           "Hypothetical push",
           "In Store" "Shelf life (store/consumer)", 
           "Inventory (Ship. unit)",
           "Case Pack",
           "CLE retail",  
           "Case cost",
           "Total cost", 
           "Weeks of inventory" ,
           "Nb Promo",  
           "Active since",  
           "Whs. discontinued on",
           "Shipping unit", 
           "Shipped per week",
           "Sold per week", 
           "Projection per week",
           "SKU sold trend_1"*100 "Trend sales Week-1 (%)",  
           "SKU sold trend_2"*100 "Trend sales Week-2 (%)",  
           "SKU sold trend_3"*100 "Trend sales Week-3 (%)",  
           "SKU sold trend_4"*100 "Trend sales Week-4 (%)",  
           "SKU sold week_1" "Qty sold Week-1 (sku)", 
           "SKU sold week_2" "Qty sold Week-2 (sku)", 
           "SKU sold week_3" "Qty sold Week-3 (sku)",
           "SKU sold week_4" "Qty sold Week-4 (sku)",
           0 "New in report item",
           "Received on",
           "Average UBD"
  FROM UBD_ITEMS_DATA_PREP IT
  ORDER BY "StatusNumber" ASC)
  SELECT * 
  FROM PRE_FORMAT t
  WHERE ("Status" IN ('High', 'Medium', 'Closed')
	OR ("Status"='Linked' AND EXISTS (SELECT 1 
                                          FROM PRE_FORMAT p 
                                          WHERE p."Status" IN ('High', 'Medium') 
                                          AND p."Item code desc"=t."Item code desc"
                                          AND p."UBD" != t."UBD")))
  OR (0 > "Trend sales Week-1 (%)" AND 0 > "Trend sales Week-2 (%)");

commit;

exit;
/
