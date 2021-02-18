drop materialized view MV_SALES;

create materialized view MV_SALES
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
             TRUNC(NEXT_DAY(CDATE - 4*7*1 - TO_NUMBER(TO_CHAR(CDATE - 1, 'D')),
                            'MON'))),
SALE_SMALL AS
 (SELECT *
    FROM STOMVT@HEINENS_CUSTOM_PROD, (SELECT MIN(DT) mindt FROM LASTXWEEKS)
   WHERE TRUNC(STMDMVT) > mindt),
SALES AS (
SELECT socsite STORE_NUM, soclmag STORE_DESC, to_char(stmdmvt, 'MM/DD') X_LABEL, 
       dept_code, dept_desc,
       sub_dept_code, sub_dept_desc,
       /* cat_code, cat_desc,
       scat_code, scat_desc,*/
       trunc(stmdmvt) SALE_DAY,
       SUM(stmvpv)*-1 AMOUNT
FROM SALE_SMALL t, sitdgene@Heinens_Custom_Prod, artvl@Heinens_Custom_Prod,
         strucrel@HEINENS_CUSTOM_PROD rel,
         mv_merchstr
WHERE stmtmvt=150
AND socsite=stmsite
AND stmseqvl=arlseqvl
AND soccmag=10
AND objcint=arlcinr
AND objpere=scat_internal_code
AND TRUNC(SYSDATE) BETWEEN objddeb AND objdfin
AND to_char(TRUNC(stmdmvt), 'RRRRIW') >= to_char(TRUNC(SYSDATE-7*8), 'RRRRIW')
GROUP BY socsite, soclmag, stmdmvt,
       dept_code, dept_desc,
       sub_dept_code, sub_dept_desc /*,
       cat_code, cat_desc,
       scat_code, scat_desc*/)
SELECT * 
FROM SALES;

