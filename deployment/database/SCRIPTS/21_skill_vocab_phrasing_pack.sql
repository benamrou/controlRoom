-- ============================================================================
-- 21_skill_vocab_phrasing_pack.sql
-- ----------------------------------------------------------------------------
-- Phase 3 of the rules-only routing plan: enrich AI_SKILL_VOCABULARY with the
-- phrasings real analysts use, classified by term_type so the engine scorer
-- can weight them correctly:
--
--   - INTENT_PHRASE  whole-question patterns ("what items can we buy from")
--   - SYNONYM        single-word substitutions ("purchase" -> BUYABLE_ITEMS)
--   - BIND_HINT      phrases that hint at a bind value ("for store" -> site_id)
--
-- Engine scorer multipliers (ai.engine.js):
--   INTENT_PHRASE = 9x | JARGON / BRAND_TERM = 5x | SYNONYM = 4x | BIND_HINT = 2x
--
-- IDEMPOTENCY:
--   This script uses MERGE keyed on (skill_id, LOWER(term), term_type) so it
--   can be re-run safely.  A leading IDENTITY-resync fixes the PK_VOCAB
--   collisions reported on partial-rerun environments where the
--   GENERATED ALWAYS AS IDENTITY sequence drifted behind MAX(vocab_id).
--
-- Skills covered:
--   E1D2C3B4-A5B6-7890-CDEF-1234567890AB  DSD_VENDOR_RETAIL
--   F1E2D3C4-B5A6-7890-CDEF-1234567890AB  ITEM_RETAIL
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Expand the CHK_TERM_TYPE constraint so INTENT_PHRASE / BIND_HINT are legal
-- ----------------------------------------------------------------------------
DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count
      FROM USER_CONSTRAINTS
     WHERE table_name = 'AI_SKILL_VOCABULARY'
       AND constraint_name = 'CHK_TERM_TYPE';
    IF v_count > 0 THEN
        EXECUTE IMMEDIATE 'ALTER TABLE AI_SKILL_VOCABULARY DROP CONSTRAINT CHK_TERM_TYPE';
    END IF;
END;
/

ALTER TABLE AI_SKILL_VOCABULARY ADD CONSTRAINT CHK_TERM_TYPE CHECK (
    term_type IN (
        'SYNONYM',
        'ABBREVIATION',
        'JARGON',
        'BRAND_TERM',
        'PROCESS_TERM',
        'INTENT_PHRASE',
        'BIND_HINT'
    )
);

-- ----------------------------------------------------------------------------
-- 2. Resync the IDENTITY sequence on vocab_id.
--    Prevents ORA-00001 (PK_VOCAB violated) when the sequence has drifted
--    behind the actual MAX(vocab_id) — typical after manual inserts or partial
--    runs of an older version of this script.
-- ----------------------------------------------------------------------------
DECLARE
    v_next NUMBER;
BEGIN
    SELECT NVL(MAX(vocab_id), 0) + 1 INTO v_next FROM AI_SKILL_VOCABULARY;
    EXECUTE IMMEDIATE
        'ALTER TABLE AI_SKILL_VOCABULARY MODIFY (vocab_id GENERATED ALWAYS AS IDENTITY (START WITH ' || v_next || '))';
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('IDENTITY resync skipped: ' || SQLERRM);
END;
/

-- ----------------------------------------------------------------------------
-- 3. DSD_VENDOR_RETAIL phrasing pack (idempotent MERGE)
-- ----------------------------------------------------------------------------
MERGE INTO AI_SKILL_VOCABULARY t
USING (
    -- INTENT_PHRASE — full-question patterns
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB' AS skill_id, 'what items can we buy from'      AS term, 'BUYABLE_ITEMS' AS canonical_concept, 'INTENT_PHRASE' AS term_type, 1.6 AS confidence_boost FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'what item can we buy from',          'BUYABLE_ITEMS',                          'INTENT_PHRASE',                1.5                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'what can we buy from',               'BUYABLE_ITEMS',                          'INTENT_PHRASE',                1.4                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'what can i buy from',                'BUYABLE_ITEMS',                          'INTENT_PHRASE',                1.4                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'what items can i buy from',          'BUYABLE_ITEMS',                          'INTENT_PHRASE',                1.6                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'what items can i order from',        'BUYABLE_ITEMS',                          'INTENT_PHRASE',                1.6                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'what can we order from',             'BUYABLE_ITEMS',                          'INTENT_PHRASE',                1.4                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'list items from',                    'BUYABLE_ITEMS',                          'INTENT_PHRASE',                1.4                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'list the items from',                'BUYABLE_ITEMS',                          'INTENT_PHRASE',                1.4                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'list of items from',                 'BUYABLE_ITEMS',                          'INTENT_PHRASE',                1.5                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'show me items from',                 'BUYABLE_ITEMS',                          'INTENT_PHRASE',                1.4                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'show items from',                    'BUYABLE_ITEMS',                          'INTENT_PHRASE',                1.3                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'give me items from',                 'BUYABLE_ITEMS',                          'INTENT_PHRASE',                1.3                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'orderable items from',               'BUYABLE_ITEMS',                          'INTENT_PHRASE',                1.5                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'buyable items from',                 'BUYABLE_ITEMS',                          'INTENT_PHRASE',                1.5                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'assortment from',                    'BUYABLE_ITEMS',                          'INTENT_PHRASE',                1.3                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'catalog from',                       'BUYABLE_ITEMS',                          'INTENT_PHRASE',                1.2                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'catalogue from',                     'BUYABLE_ITEMS',                          'INTENT_PHRASE',                1.2                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'catalog of items from',              'BUYABLE_ITEMS',                          'INTENT_PHRASE',                1.4                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'items we can buy from',              'BUYABLE_ITEMS',                          'INTENT_PHRASE',                1.5                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'items we can order from',            'BUYABLE_ITEMS',                          'INTENT_PHRASE',                1.5                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'items we can purchase from',         'BUYABLE_ITEMS',                          'INTENT_PHRASE',                1.5                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'items i can buy from',               'BUYABLE_ITEMS',                          'INTENT_PHRASE',                1.5                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'items i can order from',             'BUYABLE_ITEMS',                          'INTENT_PHRASE',                1.5                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'what assortment do we carry from',   'BUYABLE_ITEMS',                          'INTENT_PHRASE',                1.4                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'what do we carry from',              'BUYABLE_ITEMS',                          'INTENT_PHRASE',                1.3                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'what skus can we buy from',          'BUYABLE_ITEMS',                          'INTENT_PHRASE',                1.5                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'what products can we buy from',      'BUYABLE_ITEMS',                          'INTENT_PHRASE',                1.5                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'what articles can we buy from',      'BUYABLE_ITEMS',                          'INTENT_PHRASE',                1.5                       FROM dual UNION ALL

    -- BIND_HINT — phrase indicates a bind name, used by the picker / extractor
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'for store',          'site_id',         'BIND_HINT', 1.0 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'at store',           'site_id',         'BIND_HINT', 1.0 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'at site',            'site_id',         'BIND_HINT', 1.0 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'for site',           'site_id',         'BIND_HINT', 1.0 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'for warehouse',      'site_id',         'BIND_HINT', 1.0 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'at warehouse',       'site_id',         'BIND_HINT', 1.0 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'in store',           'site_id',         'BIND_HINT', 1.0 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'in warehouse',       'site_id',         'BIND_HINT', 1.0 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'from supplier',      'supplier_id',     'BIND_HINT', 1.0 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'from vendor',        'supplier_id',     'BIND_HINT', 1.0 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'from the supplier',  'supplier_id',     'BIND_HINT', 1.0 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'from the vendor',    'supplier_id',     'BIND_HINT', 1.0 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'as of',              'as_of_date',      'BIND_HINT', 0.9 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'as of date',         'as_of_date',      'BIND_HINT', 1.0 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'for date',           'as_of_date',      'BIND_HINT', 0.9 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'on date',            'as_of_date',      'BIND_HINT', 0.9 FROM dual UNION ALL

    -- SYNONYM top-up — single-word triggers that map to BUYABLE_ITEMS
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'orderable',          'BUYABLE_ITEMS',   'SYNONYM',   1.4 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'buyable',            'BUYABLE_ITEMS',   'SYNONYM',   1.4 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'assortment',         'BUYABLE_ITEMS',   'SYNONYM',   1.2 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'catalog',            'BUYABLE_ITEMS',   'SYNONYM',   1.1 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'catalogue',          'BUYABLE_ITEMS',   'SYNONYM',   1.1 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'purchase',           'BUYABLE_ITEMS',   'SYNONYM',   1.2 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'purchaseable',       'BUYABLE_ITEMS',   'SYNONYM',   1.2 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'order',              'BUYABLE_ITEMS',   'SYNONYM',   1.0 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'to buy',             'BUYABLE_ITEMS',   'SYNONYM',   1.1 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'to order',           'BUYABLE_ITEMS',   'SYNONYM',   1.1 FROM dual UNION ALL

    -- ITEM_RETAIL phrasing pack
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'tell me about item',     'ITEM_DETAILS', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'tell me about article',  'ITEM_DETAILS', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'show me article',        'ITEM_DETAILS', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'show me item',           'ITEM_DETAILS', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'item details for',       'ITEM_DETAILS', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'article details for',    'ITEM_DETAILS', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'what is item',           'ITEM_DETAILS', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'what is article',        'ITEM_DETAILS', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'lookup item',            'ITEM_DETAILS', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'lookup article',         'ITEM_DETAILS', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'find item',              'ITEM_DETAILS', 'INTENT_PHRASE', 1.3 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'find article',           'ITEM_DETAILS', 'INTENT_PHRASE', 1.3 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'sku details',            'ITEM_DETAILS', 'INTENT_PHRASE', 1.3 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'sku info',               'ITEM_DETAILS', 'INTENT_PHRASE', 1.3 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'article info',           'ITEM_DETAILS', 'INTENT_PHRASE', 1.3 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'item info',              'ITEM_DETAILS', 'INTENT_PHRASE', 1.3 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'for store',              'site_id',      'BIND_HINT',     1.0 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'at store',               'site_id',      'BIND_HINT',     1.0 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'for site',               'site_id',      'BIND_HINT',     1.0 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'at site',                'site_id',      'BIND_HINT',     1.0 FROM dual
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

-- ----------------------------------------------------------------------------
-- 4. Sanity check — counts per skill and term_type after the merge
-- ----------------------------------------------------------------------------
SELECT skill_id, term_type, COUNT(*) AS row_count
  FROM AI_SKILL_VOCABULARY
 WHERE skill_id IN ('E1D2C3B4-A5B6-7890-CDEF-1234567890AB',
                    'F1E2D3C4-B5A6-7890-CDEF-1234567890AB')
 GROUP BY skill_id, term_type
 ORDER BY skill_id, term_type;
