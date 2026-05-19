-- =============================================================================
-- Supply Chain AI — Phase 11 vocabulary fix
--   Strengthen ITEM_MASTER_RETAIL on free-form item-header queries
-- =============================================================================
-- Why this exists:
--   Questions like "tell me about item 100100 at store 10" were being routed
--   to DSD_VENDOR_RETAIL because *its* INTENT_PHRASEs all contain the token
--   "items" (active items from, authorized items from, buyable items from,
--   …). Each one stems to overlap=1 on "item" and scores 1.5 × 9 × 1 = 13.5
--   per match → ~130 points from partial matches alone.
--
--   ITEM_MASTER_RETAIL had no INTENT_PHRASE that matched "tell me about"
--   so it never competed.
--
-- What this script does:
--   1. Idempotently MERGEs strong INTENT_PHRASEs covering the common
--      free-form item-header phrasings: "tell me about", "what is item",
--      "info on item", "describe item", "lookup item", "show item",
--      "details for item", "find item", plus the article/sku/lu/cinr
--      variants.
--   2. Adds JARGON entries for the Heinens / EU GOLD vocabulary so a bare
--      "codart 100100" or "cinr 100100" anchors ITEM_MASTER_RETAIL strongly.
--   3. Adds BIND_HINT rows for common store phrasings, so the route can
--      capture site_id without depending on script 21.
--   4. Re-affirms the skill is in an active status (DRAFT or ACTIVE) so
--      AI0000061 returns it.
--   5. Prints verification SELECTs so the operator can confirm.
--
-- Pairs with the engine-side dampener (ai.engine.js — needsVendorContext)
-- which prevents vendor-relation INTENT_PHRASEs from anchoring vendor
-- skills when the question has no vendor reference.
--
-- Safe to re-run — uses MERGE keyed on (skill_id, term_type, LOWER(TRIM(term))).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Skill must be eligible (status DRAFT / ACTIVE) for AI0000061 to surface
-- ---------------------------------------------------------------------------
UPDATE AI_SKILL
   SET status     = 'DRAFT',
       updated_at = SYSTIMESTAMP
 WHERE skill_id   = 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB'
   AND status NOT IN ('DRAFT', 'ACTIVE');

-- ---------------------------------------------------------------------------
-- 2. INTENT_PHRASE / SYNONYM / JARGON / BIND_HINT top-up
-- ---------------------------------------------------------------------------
MERGE INTO AI_SKILL_VOCABULARY t
USING (
    -- INTENT_PHRASE — free-form item header queries -----------------------
    -- Boost 1.5 × INTENT_PHRASE 9× × overlap = strong per-match contribution
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB' AS skill_id, 'tell me about item'    AS term, 'ITEM_LU' AS canonical_concept, 'INTENT_PHRASE' AS term_type, 1.6 AS confidence_boost FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'tell me about article',  'ITEM_LU', 'INTENT_PHRASE', 1.6 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'tell me about',          'ITEM_LU', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'what is item',           'ITEM_LU', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'what is article',        'ITEM_LU', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'info on item',           'ITEM_LU', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'info on article',        'ITEM_LU', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'info about item',        'ITEM_LU', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'item info',              'ITEM_LU', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'article info',           'ITEM_LU', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'item details',           'ITEM_LU', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'article details',        'ITEM_LU', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'details for item',       'ITEM_LU', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'describe item',          'ITEM_LU', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'describe article',       'ITEM_LU', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'lookup item',            'ITEM_LU', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'look up item',           'ITEM_LU', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'lookup article',         'ITEM_LU', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'find item',              'ITEM_LU', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'find article',           'ITEM_LU', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'show item',              'ITEM_LU', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'show me item',           'ITEM_LU', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'show me article',        'ITEM_LU', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'sku details',            'ITEM_LU', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'sku info',               'ITEM_LU', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    -- SYNONYM — single-word equivalents to "item" -------------------------
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'article',                'ITEM_LU', 'SYNONYM',       1.1 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'sku',                    'ITEM_LU', 'SYNONYM',       1.1 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'product',                'ITEM_LU', 'SYNONYM',       1.0 FROM dual UNION ALL
    -- JARGON — Heinens / EU GOLD terms anchor strongly --------------------
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'codart',                 'ITEM_LU', 'JARGON',        1.2 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'cinr',                   'ITEM_LU', 'JARGON',        1.3 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'cinv',                   'ITEM_VARIANTS', 'JARGON',  1.3 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'artrac',                 'ITEM_LU', 'JARGON',        1.2 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'lu',                     'ITEM_LU', 'JARGON',        1.1 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'gencod',                 'ITEM_EAN', 'JARGON',       1.2 FROM dual UNION ALL
    -- BIND_HINT — site / store binding phrasings --------------------------
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'at store',               'site_id', 'BIND_HINT',     1.0 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'for store',              'site_id', 'BIND_HINT',     1.0 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'at site',                'site_id', 'BIND_HINT',     1.0 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'for site',               'site_id', 'BIND_HINT',     1.0 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'in store',               'site_id', 'BIND_HINT',     0.9 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'store id',               'site_id', 'BIND_HINT',     1.0 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'site id',                'site_id', 'BIND_HINT',     1.0 FROM dual
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

-- =============================================================================
-- Verification — run these after the MERGE
-- =============================================================================

-- 1. Skill row must exist AND be DRAFT/ACTIVE for AI0000061 to surface it
SELECT skill_id, retailer_id, skill_code, skill_name, domain, status
  FROM AI_SKILL
 WHERE skill_id = 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB';

-- 2. Vocabulary counts per term_type — should show INTENT_PHRASE >= 25
SELECT term_type, COUNT(*) AS row_count
  FROM AI_SKILL_VOCABULARY
 WHERE skill_id = 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB'
 GROUP BY term_type
 ORDER BY term_type;

-- 3. INTENT_PHRASEs that should fire on "tell me about item 100100"
SELECT term, canonical_concept, term_type, confidence_boost
  FROM AI_SKILL_VOCABULARY
 WHERE skill_id = 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB'
   AND ( LOWER(term) LIKE 'tell me about%'
      OR LOWER(term) LIKE 'about item%'
      OR LOWER(term) LIKE 'what is item%'
      OR LOWER(term) LIKE 'info%item%'
      OR LOWER(term) LIKE 'lookup item%'
      OR LOWER(term) LIKE 'describe item%' )
 ORDER BY term_type, term;

-- 4. Sanity — DSD INTENT_PHRASEs that should now be dampened on item-only
--    queries (engine side: needsVendorContext + no vendor_text/supplier_id)
SELECT skill_id, term, canonical_concept, confidence_boost
  FROM AI_SKILL_VOCABULARY
 WHERE term_type = 'INTENT_PHRASE'
   AND ( LOWER(term) LIKE '% from'
      OR LOWER(term) LIKE '% by vendor%'
      OR LOWER(term) LIKE '% by supplier%' )
 ORDER BY skill_id, term;
