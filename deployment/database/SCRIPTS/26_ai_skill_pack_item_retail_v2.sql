-- ============================================================================
-- 26_ai_skill_pack_item_retail_v2.sql
-- ----------------------------------------------------------------------------
-- Phase 10 — Item Retail skill: variants, EAN/UPC, active retail with
--           AVESCOPE priority resolution, retail history, and a wide attribute
--           rollup gated by include_* binds.
--
-- Skill (already created by 13_ai_skill_pack_item_retail.sql):
--   ITEM_MASTER_RETAIL  skill_id = 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB'
--
-- IDEMPOTENT
--   This script targets only the SQL templates and vocab rows it owns:
--     * DELETE FROM AI_SKILL_SQL_TEMPLATE keyed on (skill_id, template_code)
--       for the seven codes below — the rest of the bundle (knowledge items,
--       playbook steps, test cases, version, retailer mapping) is preserved.
--     * MERGE INTO AI_SKILL_VOCABULARY keyed on (skill_id, term_type,
--       LOWER(TRIM(term))).
--   Safe to re-run.
--
-- GOLD DATA MODEL USED (Heinens GOLD ERP, confirmed against repo + designer)
--
--     ARTRAC  (item master)
--        ARTCINR  internal article code (CINR)
--        ARTCEXR  external LU code shown to users
--           │ 1
--           │  ARVCINR = ARTCINR
--           ▼
--     ARTUV  (sale variant)
--        ARVCINV  internal variant code (CINV)
--        ARVCEXR  external variant code
--        ARVCEXV  variant suffix (e.g. /001)
--        ARVCINR  FK → ARTRAC.ARTCINR
--        ARVETAT  state
--           │ 1
--           ├──────────► ARTCOCA  (EAN/UPC; N rows per variant)
--           │              ARCCINV    FK → ARVCINV
--           │              ARCCODE    EAN/UPC code
--           │              ARCDDEB / ARCDFIN  validity period
--           │              Helper: pkartcoca.Get_Arccode(1, :cinv)  → primary UPC
--           │
--           │ 1
--           ▼
--     AVEPRIX  (price rows)
--        AVICINV   FK → ARTUV.ARVCINV
--        AVINTAR   FK → AVETAR.AVENTAR
--        AVIPRIX   retail unit price
--        AVIMULTI  multi-buy qty (e.g. 2 means "2 for AVIPRIX")
--        AVIDDEB / AVIDFIN  validity window
--           │
--           │  AVINTAR = AVENTAR
--           ▼
--     AVETAR  (tariff / price-list header)
--        AVENTAR   PK
--        AVESTAT   1 = permanent / regular ; 2 = temporary / promotion
--        AVEDDEB / AVEDFIN  tariff validity window
--           │
--           │  AVENTAR = AVONTAR
--           ▼
--     AVESCOPE  (where the tariff applies, and at what priority)
--        AVONTAR     FK → AVETAR.AVENTAR
--        AVORESCINT  site OR network code (resolved via pkresrel.isSiteBelongToNode)
--        AVOSTRCINT  merchandise structure node — NOT used for filtering in
--                    this pack: per Heinens, scope is driven by site/network +
--                    priority only. AVOSTRCINT is still selected for display.
--        AVOPRIO     priority — closest to 1 wins for the period
--        AVODDEB / AVODFIN  scope validity window
--
-- RESOLUTION RULE
--   For the active retail of variant V at store S on date D:
--     keep tuples (price-line, tariff, scope) where D is inside every period
--     and where scope covers store S (direct or via network membership);
--     order by AVOPRIO ASC, then AVESTAT DESC (promo before regular),
--     then most-recent AVIDDEB DESC; row_number = 1 wins.
--
-- DB LINK / SCHEMA CONVENTION
--   Templates use @HEINENS_CEN_PROD per the convention already in use by
--   12_ / 20_ patches. At deploy time you may keep the link as-is or rewrite
--   it to a retailer-specific link from CORPENV.ENVDBLINK if multi-retailer
--   support is needed for this skill.
-- ============================================================================

-- ─── 1. Replace / add SQL templates ─────────────────────────────────────────

DELETE FROM AI_SKILL_SQL_TEMPLATE
 WHERE skill_id = 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB'
   AND UPPER(template_code) IN (
        'ITM_ARTICLE_HEADER',
        'ITM_VARIANTS',
        'ITM_EAN_FOR_LU',
        'ITM_BARCODE_LOOKUP',
        'ITM_RETAIL_ACTIVE',
        'ITM_RETAIL_HISTORY',
        'ITM_FULL_ATTRIBUTES'
   );

-- ── ITM_ARTICLE_HEADER ─────────────────────────────────────────────────────
-- Returns the full V_GOLD_ITEM card (item code/desc, cat. mgr, orderable
-- window, current supplier, contract, cost, ord./rec. flag, SV, barcode,
-- pack, flow, creation metadata). One row per (LU, active sale variant) —
-- the analyst gets every header attribute in a single round-trip.
-- See deployment/database/SCRIPTS/28_v_gold_item_view.sql for the view body.
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose,
    sql_text, parameters_json, tables_referenced
) VALUES (
    'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'ITM_ARTICLE_HEADER',
    'Item header card (V_GOLD_ITEM)',
    'V_GOLD_ITEM card per LU+active SV: code, desc, cat mgr, orderable window, supplier, cost, ord/rec, barcode, pack, flow. Default for tell me about item X.',
    q'~SELECT *
  FROM V_GOLD_ITEM r
 WHERE r."Item code" = :lu_id~',
    q'~[{"name":"lu_id","type":"STRING","required":true}]~',
    'V_GOLD_ITEM'
);

-- ── ITM_VARIANTS ───────────────────────────────────────────────────────────
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose,
    sql_text, parameters_json, tables_referenced
) VALUES (
    'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'ITM_VARIANTS',
    'All sale variants for an LU',
    'Lists every ARTUV row (sale variant) for the LU and its description, so the assistant can confirm how many consumer packs/variants exist.',
    q'~SELECT r.ARTCEXR                                              AS item_lu,
       v.ARVCINV                                              AS variant_cinv,
       v.ARVCEXR                                              AS variant_code,
       v.ARVCEXV                                              AS variant_suffix,
       v.ARVETAT                                              AS variant_state,
       pkstrucobj.get_desc@HEINENS_CEN_PROD(1, v.ARVCINR, 'HN') AS variant_desc
  FROM ARTRAC@HEINENS_CEN_PROD r
  JOIN ARTUV@HEINENS_CEN_PROD  v
    ON v.ARVCINR = r.ARTCINR
 WHERE r.ARTCEXR = :lu_id
 ORDER BY v.ARVCEXR, v.ARVCEXV~',
    q'~[{"name":"lu_id","type":"STRING","required":true}]~',
    'ARTRAC, ARTUV'
);

-- ── ITM_EAN_FOR_LU ─────────────────────────────────────────────────────────
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose,
    sql_text, parameters_json, tables_referenced
) VALUES (
    'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'ITM_EAN_FOR_LU',
    'All EAN/UPC codes for every variant of an LU',
    'Walks ARTRAC → ARTUV → ARTCOCA and returns every active EAN/UPC for each variant on :as_of_date (defaults to SYSDATE when not bound).',
    q'~SELECT r.ARTCEXR                                              AS item_lu,
       v.ARVCINV                                              AS variant_cinv,
       v.ARVCEXR                                              AS variant_code,
       c.ARCCODE                                              AS ean_upc,
       c.ARCDDEB                                              AS ean_from,
       c.ARCDFIN                                              AS ean_to,
       pkartcoca.Get_Arccode@HEINENS_CEN_PROD(1, v.ARVCINV)   AS primary_upc
  FROM ARTRAC@HEINENS_CEN_PROD  r
  JOIN ARTUV@HEINENS_CEN_PROD   v ON v.ARVCINR = r.ARTCINR
  JOIN ARTCOCA@HEINENS_CEN_PROD c ON c.ARCCINV = v.ARVCINV
 WHERE r.ARTCEXR = :lu_id
   AND TRUNC(NVL(TO_DATE(:as_of_date,'YYYY-MM-DD'), SYSDATE))
       BETWEEN c.ARCDDEB AND c.ARCDFIN
 ORDER BY v.ARVCEXR, c.ARCCODE~',
    q'~[{"name":"lu_id","type":"STRING","required":true},{"name":"as_of_date","type":"STRING","required":false}]~',
    'ARTRAC, ARTUV, ARTCOCA'
);

-- ── ITM_BARCODE_LOOKUP ─────────────────────────────────────────────────────
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose,
    sql_text, parameters_json, tables_referenced
) VALUES (
    'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'ITM_BARCODE_LOOKUP',
    'Reverse lookup: from an EAN/UPC back to LU + variant',
    'Resolves a scanned EAN/UPC against ARTCOCA on :as_of_date and returns the parent variant and LU. Useful when an analyst asks "which item is barcode 0001234567890?".',
    q'~SELECT c.ARCCODE                                              AS ean_upc,
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
 WHERE c.ARCCODE = :ean
   AND TRUNC(NVL(TO_DATE(:as_of_date,'YYYY-MM-DD'), SYSDATE))
       BETWEEN c.ARCDDEB AND c.ARCDFIN
 FETCH FIRST 20 ROWS ONLY~',
    q'~[{"name":"ean","type":"STRING","required":true},{"name":"as_of_date","type":"STRING","required":false}]~',
    'ARTCOCA, ARTUV, ARTRAC'
);

-- ── ITM_RETAIL_ACTIVE ──────────────────────────────────────────────────────
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose,
    sql_text, parameters_json, tables_referenced
) VALUES (
    'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'ITM_RETAIL_ACTIVE',
    'Active retail per variant (priority resolution via AVESCOPE)',
    'For each variant of the LU, returns the best-priority active retail at store :site_id on :as_of_date. AVESCOPE scope is store-direct or via pkresrel.isSiteBelongToNode. Promo beats regular on tie.',
    q'~SELECT *
  FROM (
        SELECT r.ARTCEXR                                              AS item_lu,
               v.ARVCINV                                              AS variant_cinv,
               v.ARVCEXR                                              AS variant_code,
               pkstrucobj.get_desc@HEINENS_CEN_PROD(1, v.ARVCINR, 'HN') AS variant_desc,
               p.AVIPRIX                                              AS retail_amount,
               p.AVIMULTI                                             AS multi_buy_qty,
               CASE WHEN NVL(p.AVIMULTI, 0) IN (0, 1) THEN p.AVIPRIX
                    ELSE p.AVIPRIX / p.AVIMULTI
               END                                                    AS unit_price,
               t.AVENTAR                                              AS tariff_id,
               CASE t.AVESTAT WHEN 2 THEN 'PROMO' ELSE 'REGULAR' END  AS price_kind,
               s.AVOPRIO                                              AS priority,
               s.AVORESCINT                                           AS scope_code,
               s.AVOSTRCINT                                           AS merch_struct_code,
               p.AVIDDEB                                              AS price_from,
               p.AVIDFIN                                              AS price_to,
               s.AVODDEB                                              AS scope_from,
               s.AVODFIN                                              AS scope_to,
               ROW_NUMBER() OVER (
                   PARTITION BY v.ARVCINV
                   ORDER BY s.AVOPRIO ASC,
                            t.AVESTAT DESC,
                            p.AVIDDEB DESC
               ) AS rn
          FROM ARTRAC@HEINENS_CEN_PROD   r
          JOIN ARTUV@HEINENS_CEN_PROD    v ON v.ARVCINR = r.ARTCINR
          JOIN AVEPRIX@HEINENS_CEN_PROD  p ON p.AVICINV = v.ARVCINV
          JOIN AVETAR@HEINENS_CEN_PROD   t ON t.AVENTAR = p.AVINTAR
          JOIN AVESCOPE@HEINENS_CEN_PROD s ON s.AVONTAR = t.AVENTAR
         WHERE r.ARTCEXR = :lu_id
           AND TRUNC(NVL(TO_DATE(:as_of_date,'YYYY-MM-DD'), SYSDATE)) BETWEEN p.AVIDDEB AND p.AVIDFIN
           AND TRUNC(NVL(TO_DATE(:as_of_date,'YYYY-MM-DD'), SYSDATE)) BETWEEN t.AVEDDEB AND t.AVEDFIN
           AND TRUNC(NVL(TO_DATE(:as_of_date,'YYYY-MM-DD'), SYSDATE)) BETWEEN s.AVODDEB AND s.AVODFIN
           AND ( s.AVORESCINT = TO_NUMBER(:site_id)
                 OR pkresrel.isSiteBelongToNode@HEINENS_CEN_PROD(1, TO_NUMBER(:site_id), s.AVORESCINT, '1') = 1
               )
       )
 WHERE rn = 1
 ORDER BY variant_code~',
    q'~[{"name":"lu_id","type":"STRING","required":true},{"name":"site_id","type":"STRING","required":true},{"name":"as_of_date","type":"STRING","required":false}]~',
    'ARTRAC, ARTUV, AVEPRIX, AVETAR, AVESCOPE'
);

-- ── ITM_RETAIL_HISTORY ─────────────────────────────────────────────────────
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose,
    sql_text, parameters_json, tables_referenced
) VALUES (
    'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'ITM_RETAIL_HISTORY',
    'All retail rows for an LU between two dates (audit trail)',
    'Raw AVEPRIX/AVETAR/AVESCOPE rows for an LU between :date_from and :date_to (default SYSDATE-90/SYSDATE+30). Every candidate row, no priority resolution. Optional :site_id narrows scope.',
    q'~SELECT r.ARTCEXR                                              AS item_lu,
       v.ARVCINV                                              AS variant_cinv,
       v.ARVCEXR                                              AS variant_code,
       p.AVIPRIX                                              AS retail_amount,
       p.AVIMULTI                                             AS multi_buy_qty,
       t.AVENTAR                                              AS tariff_id,
       CASE t.AVESTAT WHEN 2 THEN 'PROMO' ELSE 'REGULAR' END  AS price_kind,
       s.AVOPRIO                                              AS priority,
       s.AVORESCINT                                           AS scope_code,
       s.AVOSTRCINT                                           AS merch_struct_code,
       p.AVIDDEB                                              AS price_from,
       p.AVIDFIN                                              AS price_to,
       s.AVODDEB                                              AS scope_from,
       s.AVODFIN                                              AS scope_to
  FROM ARTRAC@HEINENS_CEN_PROD   r
  JOIN ARTUV@HEINENS_CEN_PROD    v ON v.ARVCINR = r.ARTCINR
  JOIN AVEPRIX@HEINENS_CEN_PROD  p ON p.AVICINV = v.ARVCINV
  JOIN AVETAR@HEINENS_CEN_PROD   t ON t.AVENTAR = p.AVINTAR
  JOIN AVESCOPE@HEINENS_CEN_PROD s ON s.AVONTAR = t.AVENTAR
 WHERE r.ARTCEXR = :lu_id
   AND p.AVIDFIN >= NVL(TO_DATE(:date_from,'YYYY-MM-DD'), SYSDATE - 90)
   AND p.AVIDDEB <= NVL(TO_DATE(:date_to,  'YYYY-MM-DD'), SYSDATE + 30)
   AND ( :site_id IS NULL
         OR s.AVORESCINT = TO_NUMBER(:site_id)
         OR pkresrel.isSiteBelongToNode@HEINENS_CEN_PROD(1, TO_NUMBER(:site_id), s.AVORESCINT, '1') = 1
       )
 ORDER BY variant_code, p.AVIDDEB DESC, s.AVOPRIO ASC~',
    q'~[{"name":"lu_id","type":"STRING","required":true},{"name":"date_from","type":"STRING","required":false},{"name":"date_to","type":"STRING","required":false},{"name":"site_id","type":"STRING","required":false}]~',
    'ARTRAC, ARTUV, AVEPRIX, AVETAR, AVESCOPE'
);

-- ── ITM_FULL_ATTRIBUTES ────────────────────────────────────────────────────
-- "Give me everything about this item" — one row per variant, with optional
-- include_* binds gating the join cost. When include_ean='Y' we join ARTCOCA
-- (LISTAGG of distinct EANs). When include_retail='Y' we left-join the active
-- retail row computed inline. include_history='Y' returns the *count* of
-- AVEPRIX rows in the last 90 days (cheap signal; full history is its own
-- template). All include_* default to 'N' so the skinny version costs nothing.
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose,
    sql_text, parameters_json, tables_referenced
) VALUES (
    'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'ITM_FULL_ATTRIBUTES',
    'Wide rollup: header + variants + optional EAN + optional active retail',
    'One row per sale variant. include_ean / include_retail / include_history binds (Y/N) gate the joins so unused projections cost nothing. include_retail needs :site_id; otherwise use ITM_VARIANTS.',
    q'~SELECT r.ARTCEXR                                              AS item_lu,
       r.ARTCINR                                              AS item_cinr,
       v.ARVCINV                                              AS variant_cinv,
       v.ARVCEXR                                              AS variant_code,
       v.ARVCEXV                                              AS variant_suffix,
       pkstrucobj.get_desc@HEINENS_CEN_PROD(1, v.ARVCINR, 'HN') AS variant_desc,
       CASE WHEN UPPER(NVL(:include_ean,'N')) = 'Y' THEN (
            SELECT LISTAGG(c.ARCCODE, ', ') WITHIN GROUP (ORDER BY c.ARCCODE)
              FROM ARTCOCA@HEINENS_CEN_PROD c
             WHERE c.ARCCINV = v.ARVCINV
               AND TRUNC(SYSDATE) BETWEEN c.ARCDDEB AND c.ARCDFIN
       ) END                                                  AS ean_codes,
       CASE WHEN UPPER(NVL(:include_ean,'N')) = 'Y' THEN
            pkartcoca.Get_Arccode@HEINENS_CEN_PROD(1, v.ARVCINV)
       END                                                    AS primary_upc,
       CASE WHEN UPPER(NVL(:include_retail,'N')) = 'Y' THEN ar.retail_amount END AS retail_amount,
       CASE WHEN UPPER(NVL(:include_retail,'N')) = 'Y' THEN ar.multi_buy_qty END AS multi_buy_qty,
       CASE WHEN UPPER(NVL(:include_retail,'N')) = 'Y' THEN ar.price_kind END    AS price_kind,
       CASE WHEN UPPER(NVL(:include_retail,'N')) = 'Y' THEN ar.tariff_id END     AS tariff_id,
       CASE WHEN UPPER(NVL(:include_retail,'N')) = 'Y' THEN ar.priority END      AS retail_priority,
       CASE WHEN UPPER(NVL(:include_history,'N')) = 'Y' THEN (
            SELECT COUNT(*)
              FROM AVEPRIX@HEINENS_CEN_PROD ph
             WHERE ph.AVICINV = v.ARVCINV
               AND ph.AVIDDEB >= SYSDATE - 90
       ) END                                                  AS price_changes_last_90d
  FROM ARTRAC@HEINENS_CEN_PROD r
  JOIN ARTUV@HEINENS_CEN_PROD  v ON v.ARVCINR = r.ARTCINR
  OUTER APPLY (
        SELECT *
          FROM (
                SELECT p.AVIPRIX                                                 AS retail_amount,
                       p.AVIMULTI                                                AS multi_buy_qty,
                       CASE t.AVESTAT WHEN 2 THEN 'PROMO' ELSE 'REGULAR' END     AS price_kind,
                       t.AVENTAR                                                 AS tariff_id,
                       s.AVOPRIO                                                 AS priority,
                       ROW_NUMBER() OVER (
                           ORDER BY s.AVOPRIO ASC,
                                    t.AVESTAT DESC,
                                    p.AVIDDEB DESC
                       ) AS rn
                  FROM AVEPRIX@HEINENS_CEN_PROD  p
                  JOIN AVETAR@HEINENS_CEN_PROD   t ON t.AVENTAR = p.AVINTAR
                  JOIN AVESCOPE@HEINENS_CEN_PROD s ON s.AVONTAR = t.AVENTAR
                 WHERE p.AVICINV = v.ARVCINV
                   AND UPPER(NVL(:include_retail,'N')) = 'Y'
                   AND TRUNC(SYSDATE) BETWEEN p.AVIDDEB AND p.AVIDFIN
                   AND TRUNC(SYSDATE) BETWEEN t.AVEDDEB AND t.AVEDFIN
                   AND TRUNC(SYSDATE) BETWEEN s.AVODDEB AND s.AVODFIN
                   AND ( :site_id IS NULL
                         OR s.AVORESCINT = TO_NUMBER(:site_id)
                         OR pkresrel.isSiteBelongToNode@HEINENS_CEN_PROD(1, TO_NUMBER(:site_id), s.AVORESCINT, '1') = 1
                       )
               )
         WHERE rn = 1
  ) ar
 WHERE r.ARTCEXR = :lu_id
 ORDER BY v.ARVCEXR, v.ARVCEXV~',
    q'~[{"name":"lu_id","type":"STRING","required":true},{"name":"site_id","type":"STRING","required":false},{"name":"include_ean","type":"STRING","required":false},{"name":"include_retail","type":"STRING","required":false},{"name":"include_history","type":"STRING","required":false}]~',
    'ARTRAC, ARTUV, ARTCOCA, AVEPRIX, AVETAR, AVESCOPE'
);

-- ─── 2. Vocabulary: phrasing that targets the new templates ────────────────
--
--   Engine scorer multipliers:
--     INTENT_PHRASE = 9x | JARGON = 5x | SYNONYM = 4x | BIND_HINT = 2x
--   Keyed on (skill_id, term_type, LOWER(TRIM(term))) → idempotent MERGE.

MERGE INTO AI_SKILL_VOCABULARY t
USING (
    -- INTENT_PHRASE — whole-question patterns ---------------------------------
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB' AS skill_id, 'retail price'        AS term, 'ITEM_RETAIL_AMOUNT'  AS canonical_concept, 'INTENT_PHRASE' AS term_type, 1.2 AS confidence_boost FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'current retail',                'ITEM_RETAIL_AMOUNT',                            'INTENT_PHRASE',                1.2                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'current price',                 'ITEM_RETAIL_AMOUNT',                            'INTENT_PHRASE',                1.1                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'shelf price',                   'ITEM_RETAIL_AMOUNT',                            'INTENT_PHRASE',                1.1                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'sale price',                    'ITEM_RETAIL_AMOUNT',                            'INTENT_PHRASE',                1.1                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'promo price',                   'ITEM_PROMO_RETAIL',                             'INTENT_PHRASE',                1.2                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'promotion price',               'ITEM_PROMO_RETAIL',                             'INTENT_PHRASE',                1.1                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'price history',                 'ITEM_RETAIL_HISTORY',                           'INTENT_PHRASE',                1.2                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'retail history',                'ITEM_RETAIL_HISTORY',                           'INTENT_PHRASE',                1.2                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'price changes',                 'ITEM_RETAIL_HISTORY',                           'INTENT_PHRASE',                1.1                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'ean code',                      'ITEM_EAN',                                      'INTENT_PHRASE',                1.2                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'upc code',                      'ITEM_EAN',                                      'INTENT_PHRASE',                1.2                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'barcode for',                   'ITEM_EAN',                                      'INTENT_PHRASE',                1.1                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'all variants',                  'ITEM_VARIANTS',                                 'INTENT_PHRASE',                1.1                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'sale variants',                 'ITEM_VARIANTS',                                 'INTENT_PHRASE',                1.1                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'everything about',              'ITEM_FULL_ATTRIBUTES',                          'INTENT_PHRASE',                1.0                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'full attributes',               'ITEM_FULL_ATTRIBUTES',                          'INTENT_PHRASE',                1.1                       FROM dual UNION ALL

    -- SYNONYM — single-word substitutions -------------------------------------
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'retail',                        'ITEM_RETAIL_AMOUNT',                            'SYNONYM',                      1.05                      FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'price',                         'ITEM_RETAIL_AMOUNT',                            'SYNONYM',                      1.0                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'promo',                         'ITEM_PROMO_RETAIL',                             'SYNONYM',                      1.05                      FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'ean',                           'ITEM_EAN',                                      'SYNONYM',                      1.1                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'upc',                           'ITEM_EAN',                                      'SYNONYM',                      1.1                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'gtin',                          'ITEM_EAN',                                      'SYNONYM',                      1.05                      FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'barcode',                       'ITEM_EAN',                                      'SYNONYM',                      1.05                      FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'variant',                       'ITEM_VARIANTS',                                 'SYNONYM',                      1.0                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'cinv',                          'ITEM_VARIANTS',                                 'SYNONYM',                      1.1                       FROM dual UNION ALL

    -- BIND_HINT — phrases that hint at a bind value ---------------------------
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'as of',                         'as_of_date',                                    'BIND_HINT',                    1.0                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'on date',                       'as_of_date',                                    'BIND_HINT',                    1.0                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'between',                       'date_from',                                     'BIND_HINT',                    0.8                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'with ean',                      'include_ean',                                   'BIND_HINT',                    1.0                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'with upc',                      'include_ean',                                   'BIND_HINT',                    1.0                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'with retail',                   'include_retail',                                'BIND_HINT',                    1.0                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'with price',                    'include_retail',                                'BIND_HINT',                    1.0                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'with history',                  'include_history',                               'BIND_HINT',                    1.0                       FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',                'with all',                      'include_full',                                  'BIND_HINT',                    0.9                       FROM dual
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

-- ─── 3. Sanity checks (visible in deploy log) ──────────────────────────────
SELECT template_code,
       DBMS_LOB.GETLENGTH(sql_text)        AS sql_len,
       DBMS_LOB.GETLENGTH(parameters_json) AS params_len
  FROM AI_SKILL_SQL_TEMPLATE
 WHERE skill_id = 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB'
 ORDER BY template_code;

SELECT term_type, COUNT(*) AS row_count
  FROM AI_SKILL_VOCABULARY
 WHERE skill_id = 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB'
 GROUP BY term_type
 ORDER BY term_type;
