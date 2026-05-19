-- Phase 16 — Reverse lookup: supplier "Ref. to order" (ARTUC.ARAREFC) → item LU
-- Idempotent. Deploy after 26_ai_skill_pack_item_retail_v2.sql and 32_item_order_ref_enrichment.sql.
--
-- Fixes: "tell me more about ref to order 857068004057" must resolve to an LU and
-- open the V_GOLD_ITEM card — not ITM_BARCODE_LOOKUP / :ean parameter gaps.

DELETE FROM AI_SKILL_SQL_TEMPLATE
 WHERE skill_id = 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB'
   AND template_code = 'ITM_ORDER_REF_LOOKUP';

INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose,
    sql_text, parameters_json, tables_referenced
) VALUES (
    'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'ITM_ORDER_REF_LOOKUP',
    'Reverse lookup: ref. to order → LU',
    'Resolves ARTUC.ARAREFC (Ref. to order) to item LU + variant. Use when analyst asks about a supplier order reference, not a barcode.',
    q'~SELECT DISTINCT
       r.ARTCEXR                                              AS item_lu,
       r.ARTCINR                                              AS item_cinr,
       pkstrucobj.get_desc@HEINENS_CEN_PROD(1, r.ARTCINR, 'HN') AS item_desc,
       TRIM(TO_CHAR(u.ARAREFC))                              AS order_ref,
       u.ARATCDE                                              AS ord_rec_code,
       u.ARADDEB                                              AS orderable_from,
       u.ARADFIN                                              AS orderable_to
  FROM artuc@HEINENS_CEN_PROD u
  JOIN ARTRAC@HEINENS_CEN_PROD r ON r.ARTCINR = u.ARACINR
 WHERE TRIM(TO_CHAR(u.ARAREFC)) = TRIM(:order_ref)
   AND TRUNC(SYSDATE) BETWEEN u.ARADDEB AND u.ARADFIN
   AND u.ARATFOU = 1
 FETCH FIRST 20 ROWS ONLY~',
    q'~[{"name":"order_ref","type":"STRING","required":true},{"name":"as_of_date","type":"STRING","required":false}]~',
    'ARTUC, ARTRAC'
);

-- Wrong BIND_HINT rows from 32 captured digits into include_order_ref (Y/N flag).
DELETE FROM AI_SKILL_VOCABULARY
 WHERE skill_id = 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB'
   AND term_type = 'BIND_HINT'
   AND canonical_concept = 'include_order_ref';

MERGE INTO AI_SKILL_VOCABULARY t
USING (
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB' AS skill_id, 'ref to order'              AS term, 'order_ref'      AS canonical_concept, 'BIND_HINT'     AS term_type, 1.15 AS confidence_boost FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'reference to order',        'order_ref',      'BIND_HINT',     1.15 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'ref. to order',             'order_ref',      'BIND_HINT',     1.1  FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'tell me about ref to order','ITEM_ORDER_REF', 'INTENT_PHRASE', 1.65 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'tell me more about ref to order', 'ITEM_ORDER_REF', 'INTENT_PHRASE', 1.7 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'more about ref to order',   'ITEM_ORDER_REF', 'INTENT_PHRASE', 1.65 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'lookup ref to order',       'ITEM_ORDER_REF', 'INTENT_PHRASE', 1.6  FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'which item is ref to order','ITEM_ORDER_REF', 'INTENT_PHRASE', 1.6  FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'what item is ref to order', 'ITEM_ORDER_REF', 'INTENT_PHRASE', 1.55 FROM dual
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
