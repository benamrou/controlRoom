-- Phase 15 — Ord./Rec. + Ref. to order as enrichable columns (like EAN / retail)
-- Idempotent. Deploy after 28_v_gold_item_view.sql and 29_ai_skill_item_master_enriched.sql.
--
-- ITM_ARTICLE_HEADER: base V_GOLD_ITEM card WITHOUT Ord./Rec. or Ref. to order.
-- ITM_FULL_ATTRIBUTES: same base + include_order_ref gates those two columns.

UPDATE AI_SKILL_SQL_TEMPLATE
   SET template_label = 'Item header card (V_GOLD_ITEM, no order ref)',
       purpose        = 'V_GOLD_ITEM header without Ord./Rec. or Ref. to order; use include_order_ref on ITM_FULL_ATTRIBUTES to add them.',
       sql_text       = q'~SELECT g."Item code",
       g."Item desc.",
       g."Cat. Mgr",
       g."Orderable since",
       g."Orderable until",
       g."Supplier code",
       g."Supplier desc",
       g."Contrac",
       g."Addres chain",
       g."Cost",
       g."SV",
       g."Barcode",
       g."Pack",
       g."Flow",
       g."Created on",
       g."Created by",
       g."Variant CINV"
  FROM V_GOLD_ITEM g
 WHERE g."Item code" = :lu_id~'
 WHERE skill_id      = 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB'
   AND template_code = 'ITM_ARTICLE_HEADER';

UPDATE AI_SKILL_SQL_TEMPLATE
   SET template_label = 'Wide item card: V_GOLD_ITEM + optional enrichments',
       purpose        = 'V_GOLD_ITEM base plus optional Ord./Rec., Ref. to order, EAN LISTAGG, retail at :site_id, 90d price-change count via include_* flags.',
       sql_text       = q'~SELECT g."Item code",
       g."Item desc.",
       g."Cat. Mgr",
       g."Orderable since",
       g."Orderable until",
       g."Supplier code",
       g."Supplier desc",
       g."Contrac",
       g."Addres chain",
       g."Cost",
       g."SV",
       g."Barcode",
       g."Pack",
       g."Flow",
       g."Created on",
       g."Created by",
       g."Variant CINV",
       CASE WHEN UPPER(NVL(:include_order_ref,'N')) = 'Y' THEN g."Ord./Rec." END     AS "Ord./Rec.",
       CASE WHEN UPPER(NVL(:include_order_ref,'N')) = 'Y' THEN g."Ref. to order" END AS "Ref. to order",
       CASE WHEN UPPER(NVL(:include_ean,'N')) = 'Y' THEN (
            SELECT LISTAGG(c.ARCCODE, ', ') WITHIN GROUP (ORDER BY c.ARCCODE)
              FROM ARTCOCA@HEINENS_CEN_PROD c
             WHERE c.ARCCINV = g."Variant CINV"
               AND TRUNC(SYSDATE) BETWEEN c.ARCDDEB AND c.ARCDFIN
       ) END                                                AS "All EANs",
       CASE WHEN UPPER(NVL(:include_retail,'N')) = 'Y' THEN ar.retail_amount END  AS "Retail amount",
       CASE WHEN UPPER(NVL(:include_retail,'N')) = 'Y' THEN ar.multi_buy_qty END  AS "Retail multi-buy",
       CASE WHEN UPPER(NVL(:include_retail,'N')) = 'Y' THEN ar.price_kind END     AS "Retail kind",
       CASE WHEN UPPER(NVL(:include_retail,'N')) = 'Y' THEN ar.priority END       AS "Retail priority",
       CASE WHEN UPPER(NVL(:include_history,'N')) = 'Y' THEN (
            SELECT COUNT(*)
              FROM AVEPRIX@HEINENS_CEN_PROD ph
             WHERE ph.AVICINV = g."Variant CINV"
               AND ph.AVIDDEB >= SYSDATE - 90
       ) END                                                AS "Price changes (90d)"
  FROM V_GOLD_ITEM g
  OUTER APPLY (
        SELECT *
          FROM (
                SELECT p.AVIPRIX                                            AS retail_amount,
                       p.AVIMULTI                                           AS multi_buy_qty,
                       CASE t.AVESTAT WHEN 2 THEN 'PROMO' ELSE 'REGULAR' END AS price_kind,
                       s.AVOPRIO                                            AS priority,
                       ROW_NUMBER() OVER (
                           ORDER BY s.AVOPRIO ASC,
                                    t.AVESTAT DESC,
                                    p.AVIDDEB DESC
                       ) AS rn
                  FROM AVEPRIX@HEINENS_CEN_PROD  p
                  JOIN AVETAR@HEINENS_CEN_PROD   t ON t.AVENTAR = p.AVINTAR
                  JOIN AVESCOPE@HEINENS_CEN_PROD s ON s.AVONTAR = t.AVENTAR
                 WHERE p.AVICINV = g."Variant CINV"
                   AND UPPER(NVL(:include_retail,'N')) = 'Y'
                   AND :site_id IS NOT NULL
                   AND TRUNC(SYSDATE) BETWEEN p.AVIDDEB AND p.AVIDFIN
                   AND TRUNC(SYSDATE) BETWEEN t.AVEDDEB AND t.AVEDFIN
                   AND TRUNC(SYSDATE) BETWEEN s.AVODDEB AND s.AVODFIN
                   AND ( s.AVORESCINT = TO_NUMBER(:site_id)
                         OR pkresrel.isSiteBelongToNode@HEINENS_CEN_PROD(1, TO_NUMBER(:site_id), s.AVORESCINT, '1') = 1
                       )
               )
         WHERE rn = 1
  ) ar
 WHERE g."Item code" = :lu_id
 ORDER BY g."SV"~',
       parameters_json = q'~[{"name":"lu_id","type":"STRING","required":true},{"name":"site_id","type":"STRING","required":false},{"name":"include_order_ref","type":"STRING","required":false},{"name":"include_ean","type":"STRING","required":false},{"name":"include_retail","type":"STRING","required":false},{"name":"include_history","type":"STRING","required":false}]~'
 WHERE skill_id      = 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB'
   AND template_code = 'ITM_FULL_ATTRIBUTES';

MERGE INTO AI_SKILL_VOCABULARY t
USING (
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB' AS skill_id, 'add reference to order' AS term, 'ITEM_FULL_ATTRIBUTES' AS canonical_concept, 'INTENT_PHRASE' AS term_type, 1.6 AS confidence_boost FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'add ref to order',         'ITEM_FULL_ATTRIBUTES', 'INTENT_PHRASE', 1.6 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'and the ref to order',     'ITEM_FULL_ATTRIBUTES', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'include ref to order',     'ITEM_FULL_ATTRIBUTES', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'with reference to order',  'ITEM_FULL_ATTRIBUTES', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'show ref to order',        'ITEM_FULL_ATTRIBUTES', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'add ord rec',              'ITEM_FULL_ATTRIBUTES', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'with ord rec',             'ITEM_FULL_ATTRIBUTES', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'with ref to order',        'include_order_ref',    'BIND_HINT',     1.0 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'reference to order',       'include_order_ref',    'BIND_HINT',     1.0 FROM dual
) src
ON (    t.skill_id  = src.skill_id
    AND t.term_type = src.term_type
    AND LOWER(TRIM(t.term)) = LOWER(TRIM(src.term)))
WHEN MATCHED THEN UPDATE SET
    t.canonical_concept = src.canonical_concept,
    t.confidence_boost  = src.confidence_boost,
    t.language_code     = 'EN'
WHEN NOT MATCHED THEN
    INSERT (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
    VALUES (src.skill_id, LOWER(src.term), src.canonical_concept, src.term_type, 'EN', src.confidence_boost);

COMMIT;
