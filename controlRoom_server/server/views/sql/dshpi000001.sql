DROP MATERIALIZED VIEW MV_DSHPI000001;

create materialized view MV_DSHPI000001
refresh force on demand
as
WITH DATE_CHECK AS
 (SELECT TRUNC(SYSDATE) + 2 CDATE FROM DUAL),
LASTXWEEKS AS
 (SELECT TRUNC(TRUNC(CDATE) - LEVEL - 1) AS DT,
         TO_CHAR(TRUNC(TRUNC(CDATE) - LEVEL - 1), 'MM/DD') DT_DATE,
         TO_CHAR(TRUNC(TRUNC(CDATE) - LEVEL - 1), 'D') DT_DAY,
         TO_CHAR(TRUNC(TRUNC(CDATE) - LEVEL - 1), 'IWRRRR') WK
    FROM DUAL, DATE_CHECK
   WHERE TO_CHAR(TRUNC(TRUNC(TRUNC(CDATE) - LEVEL - 1), 'iw'), 'RRRR') =
         TO_CHAR(TRUNC(CDATE), 'RRRR')
  CONNECT BY LEVEL <
             TRUNC(CDATE) -
             TRUNC(NEXT_DAY(CDATE - 28 - TO_NUMBER(TO_CHAR(CDATE - 1, 'D')),
                            'MON'))),
INVDETINV_SMALL AS
 (SELECT *
    FROM INVDETINV@HEINENS_CUSTOM_PROD, (SELECT MIN(DT) mindt FROM LASTXWEEKS)
   WHERE TRUNC(DINDCRE) > mindt),
PI_NEG AS (
SELECT TO_CHAR(TRUNC(NEG_INV.EXTRACT_DATE), 'MM/DD') COUNTING_DATE,
         TO_CHAR(TRUNC(NEG_INV.EXTRACT_DATE), 'IWRRRR') WK,
         TO_CHAR(TRUNC(NEG_INV.EXTRACT_DATE), 'D') COUNTING_DAY,
         NEG_INV.SALE_LOAD,
         NEG_INV.STORE_NUM,
         NEG_INV.DEPT_CODE,
         NEG_INV.DEPT_DESC,
         NEG_INV.SUB_DEPT_CODE,
         NEG_INV.SUB_DEPT_DESC,
         NEG_INV.CAT_CODE,
         obj.sobcext SCAT_CODE,
         strl.tsobdesc SCAT_DESC,
	 SUPPLIER_CODE,
	 SUPPLIER_DESC,
         CASE WHEN QTY < 0 THEN 1 ELSE 0 END NEG_MORNING,
         CASE WHEN QTY = 0 THEN 1 ELSE 0 END ZERO_MORNING,
         NVL((SELECT 0 FROM INVDETINV@HEINENS_CUSTOM_PROD, ARTRAC@HEINENS_CUSTOM_PROD
                      WHERE DINSITE = NEG_INV.STORE_NUM
                        AND ARTCEXR = NEG_INV.ITEM_CODE
                        AND DINCINR = ARTCINR
                        AND TRUNC(DINDCRE) = TRUNC(EXTRACT_DATE)
                        AND QTY < 0
                        AND ROWNUM = 1), 1) REVIEWED_NEG,
         NVL((SELECT 1
                       FROM INVDETINV_SMALL, ARTRAC@HEINENS_CUSTOM_PROD
                      WHERE DINSITE = STORE_NUM
                        AND ARTCEXR = ITEM_CODE
                        AND DINCINR = ARTCINR
                        AND TRUNC(DINDCRE) = TRUNC(EXTRACT_DATE)
                        AND QTY = 0
                        AND DINQTIN = 0
                        AND ROWNUM = 1), 0 ) CONFIRMED_ZERO,
        NEG_INV.ITEM_CODE,
        NEG_INV.SV,
        NEG_INV.SV_DESC,
        NEG_INV.UPC,
	NEG_INV.QTY,
        foutype FLOW
    FROM HEINENS_NEG_INVENTORY@HEINENS_CUSTOM_PROD NEG_INV,
         --reseau@HEINENS_CUSTOM_PROD NEG_INV,
         --TRA_RESOBJ@HEINENS_CUSTOM_PROD resl,
         ARTRAC@HEINENS_CUSTOM_PROD art,
         strucrel@HEINENS_CUSTOM_PROD rel,
         strucobj@HEINENS_CUSTOM_PROD obj,
         tra_strucobj@HEINENS_CUSTOM_PROD strl,
         foudgene@HEINENS_CUSTOM_PROD
   WHERE TRUNC(EXTRACT_DATE) >= (SELECT MIN(DT) FROM LASTXWEEKS)
     AND TRUNC(EXTRACT_DATE) <= (SELECT MAX(DT) FROM LASTXWEEKS)
     --AND store_num=ressite
     AND artcexr=item_code
     --AND TRUNC(extract_date) BETWEEN resddeb AND resdfin
     --AND trobid=respere
     AND objcint=artcinr
     AND objpere=sobcint
     AND foucnuf=supplier_code
     AND TRUNC(extract_date) BETWEEN objddeb AND objdfin
     AND tsobcint=objpere
     AND strl.langue='HN')
 SELECT * FROM PI_NEG;

/
