-- ============================================================================
-- 24_bind_hint_pack_upgrade.sql
-- ----------------------------------------------------------------------------
-- Phase 8 — drive entity extraction from BIND_HINT vocab rows.
--
-- The engine (ai.engine.js + ai.lexical.js) now calls
-- lex.extractBindsFromHints() against every BIND_HINT row. The captured value
-- after the hint phrase is stored in entities[canonical_concept] and feeds
-- both the route response and template feasibility scoring in /diagnose.
--
-- This script tops up the seed pack from 21_skill_vocab_phrasing_pack.sql
-- with a few extra phrasings analysts use in the wild:
--
--   * lone-word triggers ("supplier", "vendor", "store", "site", "warehouse")
--     so "from <code>" near them resolves; the hardcoded extractors still win
--     when present
--   * numeric variants for the supplier slot ("supplier code", "supplier number",
--     "vendor #", "vendor id", "vendor no")
--   * date phrasings beyond what 21 ships ("on", "since", "before", "after")
--
-- Idempotent: MERGE keyed on (skill_id, term_type, LOWER(TRIM(term))).
-- Re-runnable.
--
-- Skills:
--   E1D2C3B4-A5B6-7890-CDEF-1234567890AB  DSD_VENDOR_RETAIL
--   F1E2D3C4-B5A6-7890-CDEF-1234567890AB  ITEM_RETAIL
-- ============================================================================

MERGE INTO AI_SKILL_VOCABULARY t
USING (
    -- ── DSD_VENDOR_RETAIL ──────────────────────────────────────────────
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB' AS skill_id, 'supplier code'   AS term, 'supplier_id'  AS canonical_concept, 'BIND_HINT' AS term_type, 1.0 AS confidence_boost FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'supplier number',     'supplier_id',                          'BIND_HINT',                1.0                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'supplier id',         'supplier_id',                          'BIND_HINT',                1.0                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'supplier no',         'supplier_id',                          'BIND_HINT',                1.0                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'vendor code',         'supplier_id',                          'BIND_HINT',                1.0                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'vendor number',       'supplier_id',                          'BIND_HINT',                1.0                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'vendor id',           'supplier_id',                          'BIND_HINT',                1.0                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'vendor no',           'supplier_id',                          'BIND_HINT',                1.0                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'store id',            'site_id',                              'BIND_HINT',                1.0                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'store number',        'site_id',                              'BIND_HINT',                1.0                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'store no',            'site_id',                              'BIND_HINT',                1.0                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'site id',             'site_id',                              'BIND_HINT',                1.0                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'warehouse id',        'site_id',                              'BIND_HINT',                1.0                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'on',                  'as_of_date',                           'BIND_HINT',                0.7                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'since',               'date_from',                            'BIND_HINT',                0.9                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'before',              'date_to',                              'BIND_HINT',                0.9                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'after',               'date_from',                            'BIND_HINT',                0.9                       FROM dual UNION ALL

    -- ── ITEM_RETAIL ───────────────────────────────────────────────────
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'item',                'lu_id',                                'BIND_HINT',                0.9                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'item id',             'lu_id',                                'BIND_HINT',                1.0                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'item code',           'lu_id',                                'BIND_HINT',                1.0                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'article',             'lu_id',                                'BIND_HINT',                0.9                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'article id',          'lu_id',                                'BIND_HINT',                1.0                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'codart',              'lu_id',                                'BIND_HINT',                1.1                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'sku',                 'lu_id',                                'BIND_HINT',                0.9                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'lu',                  'lu_id',                                'BIND_HINT',                1.0                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'store id',            'site_id',                              'BIND_HINT',                1.0                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'store number',        'site_id',                              'BIND_HINT',                1.0                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'site id',             'site_id',                              'BIND_HINT',                1.0                       FROM dual
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

-- Sanity check
SELECT skill_id,
       term_type,
       COUNT(*) AS row_count
  FROM AI_SKILL_VOCABULARY
 WHERE skill_id IN ('E1D2C3B4-A5B6-7890-CDEF-1234567890AB',
                    'F1E2D3C4-B5A6-7890-CDEF-1234567890AB')
   AND term_type = 'BIND_HINT'
 GROUP BY skill_id, term_type
 ORDER BY skill_id;
