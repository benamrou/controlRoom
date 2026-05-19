-- ITM_BARCODE_LOOKUP — match EAN with or without leading zeros (12/13-digit UPC/GTIN).
-- Re-run safe. Requires ITEM_MASTER_RETAIL from 26_ai_skill_pack_item_retail_v2.sql.

UPDATE AI_SKILL_SQL_TEMPLATE
   SET sql_text = q'~SELECT c.ARCCODE                                              AS ean_upc,
       v.ARVCINV                                              AS variant_cinv,
       v.ARVCEXR                                              AS variant_code,
       r.ARTCEXR                                              AS item_lu,
       r.ARTCINR                                              AS item_cinr,
       pkstrucobj.get_desc@HEINENS_CEN_PROD(1, r.ARTCINR, 'HN') AS item_desc,
       c.ARCDDEB                                              AS ean_from,
       c.ARCDFIN                                              AS ean_to
  FROM ARTCOCA@HEINENS_CEN_PROD c
  JOIN ARTUV@HEINENS_CEN_PROD   v ON v.ARVCINV = c.ARCCINV
  JOIN ARTRAC@HEINENS_CEN_PROD  r ON r.ARTCINR = v.ARVCINR
 WHERE (c.ARCCODE = TRIM(:ean)
        OR c.ARCCODE = LPAD(TRIM(:ean), 13, '0')
        OR LTRIM(c.ARCCODE, '0') = LTRIM(TRIM(:ean), '0'))
   AND TRUNC(NVL(TO_DATE(:as_of_date,'YYYY-MM-DD'), SYSDATE))
       BETWEEN c.ARCDDEB AND c.ARCDFIN
 FETCH FIRST 20 ROWS ONLY~'
 WHERE skill_id = 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB'
   AND template_code = 'ITM_BARCODE_LOOKUP';

COMMIT;
