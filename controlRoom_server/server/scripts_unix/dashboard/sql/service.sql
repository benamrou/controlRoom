set echo off
set feedback off
set linesize 2000
set longchunksize 200000
set long 200000
set pagesize 50000
set newpage none
set colsep ,
set term off
set verify off
set heading on
rem set headsep "|"
set trim on
set trimspool on
set underline off
set wrap on
set arraysize 5000

COLUMN SUPPLIER_CODE  FORMAT a13

show wrap

spool report/serviceRate_Heinens.csv

WITH STODETRE_REMOTE AS (SELECT /*+ DRIVING_SITE(rbt) */ * FROM STODETRE@heinens_custom_prod WHERE TRUNC(sdrsdrc)>=to_date('01/01/2019','MM/DD/RRRR')),
RECEIPT AS (SELECT foucnuf SUPPLIER_CODE, 
       foulibl SUPPLIER_DESC, 
       ord.sdrsite WHS,
       --sdrcode, pkstrucobj.get_desc(1, sdrcinr,'HN') ITEM_DESC, 
       to_char(ord.sdrsdrc, 'RRRRMM') "MONTH",
       to_char(ord.sdrsdrc, 'MM') || '/01/' || to_char(ord.sdrsdrc, 'RRRR')  "FIRST_DAY",
       SUM(ord.sdrqteo/ord.sdruauvc) "ORDERED", 
       SUM(rec.sdrqtea/rec.sdruauvc) RECEIVED, 
       SUM(rec.sdrmtfa) "PURCHASE"
FROM STODETRE_REMOTE ord , foudgene@heinens_custom_prod, STODETRE_REMOTE rec 
WHERE ord.sdrcfin=foucfin
AND TRUNC(ord.sdrsdrc)>=to_date('01/01/2019','MM/DD/RRRR')
AND ord.sdrsite >= 90000
AND ord.sdrcincde=rec.sdrcincde
AND ord.sdrcinr=rec.sdrcinr
-- AND foucnuf='16350'
GROUP BY foucnuf, foulibl, ord.sdrsite, to_char(ord.sdrsdrc, 'RRRRMM'),
       to_char(ord.sdrsdrc, 'MM') || '/01/' || to_char(ord.sdrsdrc, 'RRRR'))
SELECT SUPPLIER_CODE, SUPPLIER_DESC, WHS, rcp.MONTH,
       to_date(FIRST_DAY, 'MM/DD/RRRR') FIRST_DAY, 
       rcp.ORDERED, rcp.RECEIVED, PURCHASE,
       AVG(DECODE(rcp.RECEIVED,0, 0, rcp.RECEIVED/rcp.ORDERED)) SERVICE_RATE
FROM RECEIPT rcp
GROUP BY SUPPLIER_CODE, SUPPLIER_DESC, WHS, rcp.MONTH, to_date(FIRST_DAY, 'MM/DD/RRRR'),
       rcp.ORDERED, rcp.RECEIVED, PURCHASE;

spool off;

exit;
