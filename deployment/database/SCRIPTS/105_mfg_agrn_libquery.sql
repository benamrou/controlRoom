-- =============================================================================
-- 105_mfg_agrn_libquery.sql
-- Manufacturing AGRN — LIBQUERY WHS0000007 (INTCDE lines) + WHS0000008 (existing PO headers)
--
-- Deploy against: ICR application database
-- Step 1 (mfgPlaceOrder): inline sqlplus in mfg.agrn.service.ts buildPlaceOrderScript()
-- Step 2 (psint05p JF_ORDERS): ProcessService (mfg.agrn.service.ts)
-- On open: WHS0000008 (today CDEENTCDE PO for XMF001 @ 93080)
-- Step 3 (results table): WHS0000007 below
--
-- Removes WHS0000006 / WHS00000013 (obsolete — ORA-02064 over DB link).
-- Optional cleanup: run 108_mfg_agrn_icr_functions.sql to DROP ICR_MFG_PLACE_ORDER.
-- =============================================================================

SET DEFINE OFF;

DELETE FROM LIBQUERY WHERE QUERYNUM IN ('WHS0000006', 'WHS0000007', 'WHS0000008', 'WHS00000013');

INSERT INTO LIBQUERY (
  QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'WHS0000007',
       'MFG AGRN — generated PO list',
       'Today JF_ORDERS INTCDE lines (supplier XMF001) @HEINENS_CUSTOM_PROD.',
       q'[
SELECT TO_CHAR(i.INTID) AS "PO #",
       i.INTLCDE                             AS "Line",
       i.INTCODE                             AS "Item",
       pkstrucobj.get_desc@HEINENS_CUSTOM_PROD(1, a.ARTCINR, 'HN') AS "Item desc.",
       i.INTQTEC                             AS "Qty",
       i.INTCNUF                             AS "Supplier",
       NVL(i.INTREFEXT, ' ')                 AS "Ext ref",
       i.INTCOML1                            AS "Prod order",
       i.INTSTAT                             AS "Intf stat",
       NVL(i.INTMESS, ' ')                   AS "Message",
       NVL(TO_CHAR(i.INTSTAT), ' ')          AS "PO status"
  FROM INTCDE@HEINENS_CUSTOM_PROD i
  LEFT JOIN ARTRAC@HEINENS_CUSTOM_PROD a ON a.ARTCEXR = i.INTCODE
 WHERE (TRUNC(i.INTDTRT) = TRUNC(SYSDATE) OR TRUNC(i.INTDCOM) = TRUNC(SYSDATE))
   AND i.INTUTIL = 'JF_ORDERS'
   AND i.INTCNUF = 'XMF001'
 ORDER BY i.INTID, i.INTCODE
]',
       ':param1=unused',
       'PO #,LINE,ITEM,ITEM DESC.,QTY,SUPPLIER,EXT REF,PROD ORDER,INTF STAT,MESSAGE,PO STATUS',
       1, 0, 0
  FROM dual;

INSERT INTO LIBQUERY (
  QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'WHS0000008',
       'MFG AGRN — existing PO headers',
       'Today manufacturing AGRN orders (XMF001, site 93080) @HEINENS_CUSTOM_PROD. :param1=unused.',
       q'[
SELECT e.ECDSITE AS "Whs #",
       e.ECDCEXCDE AS "PO #",
       f.FOUCNUF AS "Vendor code",
       e.ECDDCOM AS "Order date",
       e.ECDDLIV AS "Delivery date",
       (SELECT COUNT(1)
          FROM CDEDETCDE@HEINENS_CUSTOM_PROD d
         WHERE d.DCDCINCDE = e.ECDCINCDE
           AND d.DCDCFIN = e.ECDCFIN) AS "Nb items",
       (SELECT SUM(d.DCDQTEC / d.DCDUAUVC)
          FROM CDEDETCDE@HEINENS_CUSTOM_PROD d
         WHERE d.DCDCINCDE = e.ECDCINCDE
           AND d.DCDCFIN = e.ECDCFIN) AS "Nb case"
  FROM CDEENTCDE@HEINENS_CUSTOM_PROD e
  JOIN FOUDGENE@HEINENS_CUSTOM_PROD f ON e.ECDCFIN = f.FOUCFIN
 WHERE TRUNC(e.ECDDCOM) = TRUNC(SYSDATE)
   AND f.FOUCNUF = 'XMF001'
   AND e.ECDNFILF = 0
   AND e.ECDSITE = 93080
 ORDER BY e.ECDCEXCDE
]',
       ':param1=unused',
       'WHS #,PO #,VENDOR CODE,ORDER DATE,DELIVERY DATE,NB ITEMS,NB CASE',
       1, 0, 0
  FROM dual;

COMMIT;

SET DEFINE ON;
