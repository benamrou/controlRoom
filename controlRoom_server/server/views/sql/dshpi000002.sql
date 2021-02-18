DROP MATERIALIZED VIEW MV_CYCLECOUNT;

create materialized view MV_CYCLECOUNT
NOLOGGING
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
                            'MON')))
 SELECT 
        TO_CHAR(TRUNC(DINDINV), 'MM/DD') COUNTING_DATE,
         TO_CHAR(TRUNC(DINDINV), 'IWRRRR') WK,
         TO_CHAR(TRUNC(DINDINV), 'D') COUNTING_DAY,
         DINSITE STORE_NUM,
         DEPT_CODE,
         DEPT_DESC,
         SUB_DEPT_CODE,
         SUB_DEPT_DESC,
         CAT_CODE,
         CAT_DESC,
         SCAT_CODE,
         SCAT_DESC,
         --foucnuf SUPPLIER_CODE,
         --foulibl SUPPLIER_DESC,
         0 NEG_MORNING,
         0 ZERO_MORNING,
         0 REVIEWED_NEG,
         dinqtin COUNTED_QTY,
        arvcexr ITEM_CODE,
        arvcexv SV,
        pkstrucobj.get_desc@HEINENS_CUSTOM_PROD(1,arvcinr, 'HN') SV_DESC,
        pkartcoca.get_code_caisse@HEINENS_CUSTOM_PROD(1,arvcinv, trunc(dindinv))  UPC,
        DINSINF QTY,
        --foutype FLOW,
        NVL((SELECT 1
                     FROM HEINENS_NEG_INVENTORY@HEINENS_CUSTOM_PROD NEG_INV
                     WHERE neg_inv.item_code=art.arvcexr AND store_num=dinsite AND extract_date=dindinv),0) REPORTED
  FROM  ARTUV@HEINENS_CUSTOM_PROD art,
         mv_merchstr merch,
	 INVDETINV@HEINENS_CUSTOM_PROD, (SELECT MIN(DT) mindt FROM LASTXWEEKS)
   WHERE TRUNC(DINDINV) > mindt
    AND dincinl=art.arvcinv
     AND dinstrcint=merch.scat_internal_code;
\ 
