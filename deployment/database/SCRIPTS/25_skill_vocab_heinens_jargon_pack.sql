-- ============================================================================
-- 25_skill_vocab_heinens_jargon_pack.sql
-- ----------------------------------------------------------------------------
-- Phase 9 — Heinens & grocery / DSD jargon pack.
--
-- Seeds JARGON / BRAND_TERM / PROCESS_TERM / SYNONYM / INTENT_PHRASE rows so
-- the engine recognises the language Heinens analysts actually type:
--
--   DSD vocab:    DSD, scanback / scan back / SBK, TPR, OI / off-invoice,
--                 billback / bill back, slotting / slot fee
--   Reliability:  OTIF, fill rate, service level, lead time, on-time
--   Assortment:   ranging, delisting, authorisation, planogram / POG, ranged,
--                 delisted, listed, carry, sell
--   GOLD jargon:  LU, CODART, ARTRAC, ARTUL, filière, ARTSITE, ARTUC
--   Item ids:     EAN, UPC, GTIN, barcode
--
-- Idempotent: MERGE keyed on (skill_id, term_type, LOWER(TRIM(term))).
--
-- Skills:
--   E1D2C3B4-A5B6-7890-CDEF-1234567890AB  DSD_VENDOR_RETAIL
--   F1E2D3C4-B5A6-7890-CDEF-1234567890AB  ITEM_RETAIL
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. DSD_VENDOR_RETAIL — DSD + reliability + assortment jargon
-- ----------------------------------------------------------------------------
MERGE INTO AI_SKILL_VOCABULARY t
USING (
    -- ── JARGON: DSD billing models & supplier terminology (×5 multiplier) ──
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB' AS skill_id, 'dsd'             AS term, 'BUYABLE_ITEMS'      AS canonical_concept, 'JARGON'        AS term_type, 1.4 AS confidence_boost FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'direct store delivery', 'BUYABLE_ITEMS',                                  'JARGON',                       1.4                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'direct delivery',       'BUYABLE_ITEMS',                                  'JARGON',                       1.2                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'scanback',              'SCANBACK',                                       'JARGON',                       1.4                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'scan back',             'SCANBACK',                                       'JARGON',                       1.4                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'sbk',                   'SCANBACK',                                       'ABBREVIATION',                 1.3                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'tpr',                   'PROMOTION',                                      'ABBREVIATION',                 1.2                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'off invoice',           'ALLOWANCE',                                      'JARGON',                       1.2                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'off-invoice',           'ALLOWANCE',                                      'JARGON',                       1.2                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'oi',                    'ALLOWANCE',                                      'ABBREVIATION',                 1.0                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'billback',              'ALLOWANCE',                                      'JARGON',                       1.2                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'bill back',             'ALLOWANCE',                                      'JARGON',                       1.2                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'slotting fee',          'SLOTTING',                                       'JARGON',                       1.1                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'slot fee',              'SLOTTING',                                       'JARGON',                       1.1                       FROM dual UNION ALL

    -- ── JARGON: assortment / planogram / range ──
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'planogram',             'ASSORTMENT',                                     'JARGON',                       1.2                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'pog',                   'ASSORTMENT',                                     'ABBREVIATION',                 1.1                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'ranged',                'BUYABLE_ITEMS',                                  'PROCESS_TERM',                 1.3                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'ranging',               'BUYABLE_ITEMS',                                  'PROCESS_TERM',                 1.3                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'delisted',              'ITEM_INACTIVE',                                  'PROCESS_TERM',                 1.3                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'delisting',             'ITEM_INACTIVE',                                  'PROCESS_TERM',                 1.3                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'listed',                'BUYABLE_ITEMS',                                  'PROCESS_TERM',                 1.0                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'authorized',            'BUYABLE_ITEMS',                                  'PROCESS_TERM',                 1.2                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'authorised',            'BUYABLE_ITEMS',                                  'PROCESS_TERM',                 1.2                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'authorisation',         'BUYABLE_ITEMS',                                  'PROCESS_TERM',                 1.2                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'authorization',         'BUYABLE_ITEMS',                                  'PROCESS_TERM',                 1.2                       FROM dual UNION ALL

    -- ── JARGON: vendor reliability (kept on DSD skill until a dedicated one ships) ──
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'otif',                  'VENDOR_RELIABILITY',                             'ABBREVIATION',                 1.3                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'on time in full',       'VENDOR_RELIABILITY',                             'JARGON',                       1.3                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'fill rate',             'VENDOR_RELIABILITY',                             'JARGON',                       1.3                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'service level',         'VENDOR_RELIABILITY',                             'JARGON',                       1.2                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'on time',               'VENDOR_RELIABILITY',                             'JARGON',                       1.0                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'lead time',             'VENDOR_RELIABILITY',                             'JARGON',                       1.0                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'cuts',                  'VENDOR_RELIABILITY',                             'JARGON',                       0.9                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'shorts',                'VENDOR_RELIABILITY',                             'JARGON',                       0.9                       FROM dual UNION ALL

    -- ── GOLD ERP jargon ──
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'foudgene',              'SUPPLIER_MASTER',                                'JARGON',                       1.0                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'foucnuf',               'SUPPLIER_CODE',                                  'JARGON',                       1.0                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'filiere',               'CATEGORY',                                       'JARGON',                       0.9                       FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'filière',               'CATEGORY',                                       'JARGON',                       0.9                       FROM dual UNION ALL

    -- ── INTENT_PHRASE: Heinens-flavoured BUYABLE_ITEMS phrasings (×9) ──
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'do we still range',                       'BUYABLE_ITEMS', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'are we still ranging',                    'BUYABLE_ITEMS', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'are we still buying from',                'BUYABLE_ITEMS', 'INTENT_PHRASE', 1.6 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'do we authorize',                         'BUYABLE_ITEMS', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'do we authorise',                         'BUYABLE_ITEMS', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'authorized items from',                   'BUYABLE_ITEMS', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'ranged items from',                       'BUYABLE_ITEMS', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'active items from',                       'BUYABLE_ITEMS', 'INTENT_PHRASE', 1.6 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'active assortment from',                  'BUYABLE_ITEMS', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'dsd items from',                          'BUYABLE_ITEMS', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'dsd authorized items',                    'BUYABLE_ITEMS', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'scanback items from',                     'SCANBACK',      'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'tpr items from',                          'PROMOTION',     'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'what does',                               'BUYABLE_ITEMS', 'INTENT_PHRASE', 1.0 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'what does the supplier',                  'BUYABLE_ITEMS', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'what does the vendor',                    'BUYABLE_ITEMS', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'what is in the catalog from',             'BUYABLE_ITEMS', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'whats in the catalog from',               'BUYABLE_ITEMS', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'pull the assortment from',                'BUYABLE_ITEMS', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'pull the catalog from',                   'BUYABLE_ITEMS', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL

    -- ── INTENT_PHRASE: vendor reliability questions (still on DSD skill) ──
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'how reliable is',                         'VENDOR_RELIABILITY', 'INTENT_PHRASE', 1.3 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'how is the fill rate for',                'VENDOR_RELIABILITY', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'whats the fill rate for',                 'VENDOR_RELIABILITY', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'otif for',                                'VENDOR_RELIABILITY', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'service level for supplier',              'VENDOR_RELIABILITY', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL

    -- ── SYNONYM top-up ──
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'carry',                                   'BUYABLE_ITEMS', 'SYNONYM', 1.0 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'carrying',                                'BUYABLE_ITEMS', 'SYNONYM', 1.0 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'sell',                                    'BUYABLE_ITEMS', 'SYNONYM', 0.9 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'sells',                                   'BUYABLE_ITEMS', 'SYNONYM', 0.9 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'stock',                                   'BUYABLE_ITEMS', 'SYNONYM', 0.9 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'stocking',                                'BUYABLE_ITEMS', 'SYNONYM', 0.9 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'authorize',                               'BUYABLE_ITEMS', 'SYNONYM', 1.1 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'authorise',                               'BUYABLE_ITEMS', 'SYNONYM', 1.1 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'range',                                   'BUYABLE_ITEMS', 'SYNONYM', 1.0 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'list',                                    'BUYABLE_ITEMS', 'SYNONYM', 0.8 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'delist',                                  'ITEM_INACTIVE', 'SYNONYM', 1.0 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'active',                                  'BUYABLE_ITEMS', 'SYNONYM', 0.9 FROM dual UNION ALL
    SELECT 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',                'inactive',                                'ITEM_INACTIVE', 'SYNONYM', 0.9 FROM dual UNION ALL

    -- ── ITEM_RETAIL — GOLD jargon + item identifiers ──
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'lu',                                      'ITEM_DETAILS', 'JARGON',       1.2 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'logical unit',                            'ITEM_DETAILS', 'JARGON',       1.3 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'codart',                                  'ITEM_DETAILS', 'JARGON',       1.3 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'artrac',                                  'ITEM_DETAILS', 'JARGON',       1.2 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'artul',                                   'ITEM_DETAILS', 'JARGON',       1.2 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'artuc',                                   'ITEM_DETAILS', 'JARGON',       1.0 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'artsite',                                 'ITEM_DETAILS', 'JARGON',       1.0 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'ean',                                     'ITEM_DETAILS', 'ABBREVIATION', 1.2 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'upc',                                     'ITEM_DETAILS', 'ABBREVIATION', 1.2 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'gtin',                                    'ITEM_DETAILS', 'ABBREVIATION', 1.2 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'barcode',                                 'ITEM_DETAILS', 'JARGON',       1.0 FROM dual UNION ALL

    -- ── ITEM_RETAIL — INTENT_PHRASE ──
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'lookup lu',                               'ITEM_DETAILS', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'lookup codart',                           'ITEM_DETAILS', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'who supplies item',                       'ITEM_DETAILS', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'who is the supplier of item',             'ITEM_DETAILS', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'where do we buy item',                    'ITEM_DETAILS', 'INTENT_PHRASE', 1.3 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'is item ranged',                          'ITEM_DETAILS', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'is item active',                          'ITEM_DETAILS', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'is item delisted',                        'ITEM_DETAILS', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'is article ranged',                       'ITEM_DETAILS', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'is article active',                       'ITEM_DETAILS', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'casepack for',                            'ITEM_DETAILS', 'INTENT_PHRASE', 1.2 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'case pack for',                           'ITEM_DETAILS', 'INTENT_PHRASE', 1.2 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'inner pack for',                          'ITEM_DETAILS', 'INTENT_PHRASE', 1.2 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'specs for item',                          'ITEM_DETAILS', 'INTENT_PHRASE', 1.2 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'attributes of item',                      'ITEM_DETAILS', 'INTENT_PHRASE', 1.2 FROM dual UNION ALL

    -- ── ITEM_RETAIL — SYNONYM top-up ──
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'specs',                                   'ITEM_DETAILS', 'SYNONYM', 1.0 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'attributes',                              'ITEM_DETAILS', 'SYNONYM', 1.0 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'description',                             'ITEM_DETAILS', 'SYNONYM', 0.9 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'casepack',                                'ITEM_DETAILS', 'SYNONYM', 1.0 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'case pack',                               'ITEM_DETAILS', 'SYNONYM', 1.0 FROM dual
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
-- 2. Sanity check — distribution per skill / term_type after the merge
-- ----------------------------------------------------------------------------
SELECT s.skill_code,
       v.term_type,
       COUNT(*) AS row_count
  FROM AI_SKILL_VOCABULARY v
  JOIN AI_SKILL s ON s.skill_id = v.skill_id
 WHERE v.skill_id IN ('E1D2C3B4-A5B6-7890-CDEF-1234567890AB',
                      'F1E2D3C4-B5A6-7890-CDEF-1234567890AB')
 GROUP BY s.skill_code, v.term_type
 ORDER BY s.skill_code, v.term_type;
