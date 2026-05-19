-- Phase 2 upgrade — DSD_VENDOR_BUYABLE_ITEMS
-- Changes vs script 12:
--   1. as_of_date changed to required:false; SQL defaults to TRUNC(SYSDATE) when absent/empty.
--      NULLIF guard prevents ORA-01858 when the engine passes an empty string.
--   2. Added ARTRAC join to surface item description alongside the LU code.
--   3. FETCH FIRST 100 ROWS ONLY to cap wide-assortment suppliers.

UPDATE AI_SKILL_SQL_TEMPLATE
SET sql_text = q'~SELECT DISTINCT
       u.ARACEXR     AS "Item Code",
       a.ARTDESI     AS "Description",
       u.ARASITE     AS "Network Node",
       g.FOUCNUF     AS "Supplier Code",
       g.FOULIBL     AS "Supplier Name",
       u.ARADDEB     AS "Valid From",
       u.ARADFIN     AS "Valid Until"
  FROM ARTUC@HEINENS_CEN_PROD u
  JOIN FOUDGENE@HEINENS_CEN_PROD g
    ON g.FOUCFIN = u.ARACFIN
  JOIN ARTRAC@HEINENS_CEN_PROD a
    ON a.ARTCINR = u.ARACINR
 WHERE TRIM(g.FOUCNUF) = TRIM(:supplier_id)
   AND NVL(TO_DATE(NULLIF(TRIM(:as_of_date), ''), 'YYYY-MM-DD'), TRUNC(SYSDATE))
       BETWEEN u.ARADDEB AND u.ARADFIN
   AND ( :site_id IS NULL
         OR pkresrel.isSiteBelongToNode@HEINENS_CEN_PROD(
                1,
                TO_NUMBER(TRIM(:site_id)),
                u.ARASITE,
                '1'
            ) = 1
       )
 ORDER BY u.ARASITE, a.ARTDESI
 FETCH FIRST 100 ROWS ONLY~',
    parameters_json = q'~[{"name":"supplier_id","type":"STRING","required":true},{"name":"site_id","type":"STRING","required":false},{"name":"as_of_date","type":"STRING","required":false}]~',
    template_label = 'Buyable items list by vendor (optional site filter)',
    purpose = 'ARTUC+FOUDGENE+ARTRAC buyable list. :as_of_date defaults to today. :site_id filters via pkresrel.isSiteBelongToNode; NULL returns all networks.',
    tables_referenced = 'ARTUC, FOUDGENE, ARTRAC'
WHERE UPPER(template_code) = 'DSD_VENDOR_BUYABLE_ITEMS';

COMMIT;

SELECT skill_id, template_code,
       DBMS_LOB.GETLENGTH(sql_text)        AS sql_len,
       DBMS_LOB.GETLENGTH(parameters_json) AS params_len
  FROM AI_SKILL_SQL_TEMPLATE
 WHERE UPPER(template_code) = 'DSD_VENDOR_BUYABLE_ITEMS';
