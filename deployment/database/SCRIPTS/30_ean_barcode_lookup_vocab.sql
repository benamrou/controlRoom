-- Phase 14 — EAN / barcode lookup routing (ITEM_MASTER_RETAIL)
-- Idempotent MERGE: BIND_HINT extracts :ean; INTENT_PHRASE steers barcode questions.
-- Safe to re-run. Deploy after 26_ai_skill_pack_item_retail_v2.sql.

MERGE INTO AI_SKILL_VOCABULARY t
USING (
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB' AS skill_id, 'ean'                   AS term, 'ean'      AS canonical_concept, 'BIND_HINT'     AS term_type, 1.1  AS confidence_boost FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'upc',                   'ean',      'BIND_HINT',     1.1  FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'gtin',                  'ean',      'BIND_HINT',     1.1  FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'barcode',               'ean',      'BIND_HINT',     1.05 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'gencod',                'ean',      'BIND_HINT',     1.1  FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'tell me about ean',     'ITEM_EAN', 'INTENT_PHRASE', 1.6  FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'more about ean',        'ITEM_EAN', 'INTENT_PHRASE', 1.5  FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'lookup ean',            'ITEM_EAN', 'INTENT_PHRASE', 1.6  FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'which item is ean',     'ITEM_EAN', 'INTENT_PHRASE', 1.6  FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'which item is barcode', 'ITEM_EAN', 'INTENT_PHRASE', 1.55 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'what item is upc',      'ITEM_EAN', 'INTENT_PHRASE', 1.5  FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'show full item card',   'ITEM_LU',  'INTENT_PHRASE', 1.5  FROM dual
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
