-- =============================================================================
-- Supply Chain AI — V_GOLD_ITEM canonical item-card view
-- =============================================================================
-- Purpose:
--   One row per (LU, active sale variant) joining ARTRAC + ARTUV with current
--   orderable supplier context (artuc + foudgene + fouccom). Returns the full
--   "Item card" shape used by skill SQL templates:
--     code, desc, category manager, orderable window, current supplier code +
--     name, contract, address chain, cost, ord./rec. flag, ref. to order,
--     sale variant code, barcode, pack, flow (DSD / Allotment / Warehouse),
--     creation metadata.
--
--   Skill templates can read from this view instead of repeating the join
--   pyramid in every query — e.g.
--     SELECT * FROM V_GOLD_ITEM WHERE "Item code" = :lu_id
--
-- Where this view lives:
--   ICR app DB. All GOLD reads are routed through the DB link
--   @HEINENS_CEN_PROD (must match CORPENV.ENVDBLINK for the retailer).
--
-- Re-runnability:
--   CREATE OR REPLACE — safe to re-deploy. Compilation errors will surface
--   immediately at deploy time (the package + DB-link references must resolve).
--
-- Smoke test after deploy:
--   SELECT * FROM V_GOLD_ITEM WHERE "Item code" = '100100';
-- =============================================================================

CREATE OR REPLACE VIEW V_GOLD_ITEM AS
WITH ORDERABLE AS (
SELECT *
FROM artuc@HEINENS_CEN_PROD, foudgene@HEINENS_CEN_PROD, fouccom@HEINENS_CEN_PROD
WHERE aracfin=foucfin
AND araccin=fccccin
ORDER BY aradfin DESC)
SELECT r.ARTCEXR                                              AS "Item code",
       pkstrucobj.get_desc@HEINENS_CEN_PROD(1, r.ARTCINR, 'HN') AS "Item desc.",
       artgest || ' | ' || pkparpostes.get_postlibl@HEINENS_CEN_PROD(1,10, 1032, artgest,'HN') "Cat. Mgr",
       (SELECT MIN (araddeb) FROM ORDERABLE ) "Orderable since",
       (SELECT MAX (aradfin) FROM ORDERABLE ) "Orderable until",
       (SELECT foucnuf FROM ORDERABLE  WHERE TRUNC(SYSDATE) BETWEEN araddeb AND aradfin AND foutype=1 AND aratfou=1 AND ROWNUM=1) "Supplier code",
       (SELECT foulibl FROM ORDERABLE  WHERE TRUNC(SYSDATE) BETWEEN araddeb AND aradfin AND foutype=1 AND aratfou=1 AND ROWNUM=1) "Supplier desc",
       (SELECT fccnum FROM ORDERABLE  WHERE TRUNC(SYSDATE) BETWEEN araddeb AND aradfin AND foutype=1 AND aratfou=1 AND ROWNUM=1) "Contrac",
       (SELECT aranfilf FROM ORDERABLE  WHERE TRUNC(SYSDATE) BETWEEN araddeb AND aradfin AND foutype=1 AND aratfou=1 AND ROWNUM=1) "Addres chain",
       (SELECT tappbrut FROM tarprix@HEINENS_CEN_PROD, ORDERABLE WHERE tapcfin=aracfin AND tapccin=araccin AND TRUNC(SYSDATE) BETWEEN araddeb AND aradfin AND foutype=1 AND aratfou=1 AND ROWNUM=1) "Cost",
       (SELECT aratcde || ' | ' || pkparpostes.get_postlibl@HEINENS_CEN_PROD(1,10, 1071, aratcde,'HN') FROM ORDERABLE  WHERE TRUNC(SYSDATE) BETWEEN araddeb AND aradfin AND foutype=1 AND aratfou=1 AND ROWNUM=1) "Ord./Rec.",
       (SELECT ararefc || ' | ' || pkparpostes.get_postlibl@HEINENS_CEN_PROD(1,10, 1071, aratcde,'HN') FROM ORDERABLE  WHERE TRUNC(SYSDATE) BETWEEN araddeb AND aradfin AND foutype=1 AND aratfou=1 AND ROWNUM=1) "Ref. to order",
       arvcexv "SV",
       pkartcoca.Get_Arccode@HEINENS_CEN_PROD(1,arvcinv) "Barcode",
       (SELECT pkartstock.get_skuunits@HEINENS_CEN_PROD(1,aracinl) FROM ORDERABLE  WHERE TRUNC(SYSDATE) BETWEEN araddeb AND aradfin AND foutype=1 AND aratfou=1 AND ROWNUM=1) "Pack",
       (SELECT DECODE (foutype, 1, 'DSD', DECODE(foucnuf, 'AO%', 'Allotment','Warehouse')) FROM ORDERABLE  WHERE TRUNC(SYSDATE) BETWEEN araddeb AND aradfin AND foutype=1 AND aratfou=1 AND ROWNUM=1 AND pkresrel.isSiteBelongToNode@HEINENS_CEN_PROD(1,7, arasite,'1')=1 AND ROWNUM=1) "Flow",
       r.artdcre "Created on",
       r.artutil "Created by"
  FROM ARTRAC@HEINENS_CEN_PROD r, ARTUV@HEINENS_CEN_PROD v
 WHERE r.artcinr=v.arvcinr
 AND v.arvetat =1 /* active */
;

-- =============================================================================
-- Verification
-- =============================================================================

-- 1. View compiles (no INVALID status)
SELECT object_name, status
  FROM USER_OBJECTS
 WHERE object_type = 'VIEW'
   AND object_name = 'V_GOLD_ITEM';

-- 2. Column list / aliases
SELECT column_name, data_type, data_length
  FROM USER_TAB_COLUMNS
 WHERE table_name = 'V_GOLD_ITEM'
 ORDER BY column_id;

-- 3. Sample row (replace 100100 with any LU known to Heinens preprod)
-- SELECT * FROM V_GOLD_ITEM WHERE "Item code" = '100100';
