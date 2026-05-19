-- =============================================================================
-- 29_ai_skill_item_master_enriched.sql
-- -----------------------------------------------------------------------------
-- Phase 12 — Conversational enrichment for the item card.
--
-- Lets the AI Assistant build a single consolidated table when a user starts
-- from V_GOLD_ITEM ("tell me about item 100100") and then asks for extra
-- columns one at a time ("add retail", "and the EAN", "include price history").
-- Instead of opening a new result table per follow-up, the assistant pivots
-- to the wide ITM_FULL_ATTRIBUTES template and turns on the relevant
-- include_* flags. The same SQL is re-run with progressively more columns,
-- so the user sees one growing table grounded in V_GOLD_ITEM.
--
-- Three things this script does (all idempotent):
--   1. V_GOLD_ITEM gains a "Variant CINV" column (the ARVCINV internal id from
--      the existing ARTUV join). The view already had ARTUV in its FROM clause
--      so this is a pure-projection addition — no extra round-trip cost.
--      ITM_FULL_ATTRIBUTES uses it to join AVEPRIX / ARTCOCA / AVEPRIX history
--      at the same grain as the V_GOLD_ITEM row.
--   2. ITM_FULL_ATTRIBUTES is rewritten on top of V_GOLD_ITEM so the wide
--      result contains every header column (Item code, Item desc, Cat. Mgr,
--      Orderable since/until, Supplier code/desc, Contrac, Cost, Ord./Rec.,
--      Ref. to order, SV, Barcode, Pack, Flow, Created on/by) **plus** the
--      optional enrichments (All EANs LISTAGG, Retail amount/multi-buy/kind/
--      priority, Price changes in last 90d).
--   3. Continuation vocabulary is added so phrasings the user types after the
--      first item lookup — "add retail", "and the ean", "include history",
--      "consolidate" — route to ITM_FULL_ATTRIBUTES. The boost is high so it
--      wins over ITM_RETAIL_ACTIVE / ITM_EAN_FOR_LU when an item context is
--      already in scope.
--
-- Safe to re-run: V_GOLD_ITEM uses CREATE OR REPLACE; ITM_FULL_ATTRIBUTES
-- uses UPDATE-then-INSERT idempotent pattern; vocabulary uses MERGE.
-- =============================================================================

-- ─── 1. V_GOLD_ITEM — add "Variant CINV" as the last projection ────────────
-- This is the only change vs script 28. The new column lets ITM_FULL_ATTRIBUTES
-- join GOLD tables that are keyed on ARVCINV (AVEPRIX, ARTCOCA) without
-- re-joining ARTRAC + ARTUV. Analysts can ignore the column; it's a join key.
CREATE OR REPLACE VIEW V_GOLD_ITEM AS
WITH ORDERABLE AS (
    SELECT *
      FROM artuc@HEINENS_CEN_PROD,
           foudgene@HEINENS_CEN_PROD,
           fouccom@HEINENS_CEN_PROD
     WHERE aracfin = foucfin
       AND araccin = fccccin
     ORDER BY aradfin DESC
)
SELECT r.ARTCEXR                                                          AS "Item code",
       pkstrucobj.get_desc@HEINENS_CEN_PROD(1, r.ARTCINR, 'HN')            AS "Item desc.",
       artgest || ' | ' || pkparpostes.get_postlibl@HEINENS_CEN_PROD(1, 10, 1032, artgest, 'HN') "Cat. Mgr",
       (SELECT MIN(araddeb) FROM ORDERABLE)                                AS "Orderable since",
       (SELECT MAX(aradfin) FROM ORDERABLE)                                AS "Orderable until",
       (SELECT foucnuf FROM ORDERABLE
         WHERE TRUNC(SYSDATE) BETWEEN araddeb AND aradfin
           AND foutype = 1 AND aratfou = 1 AND ROWNUM = 1)                 AS "Supplier code",
       (SELECT foulibl FROM ORDERABLE
         WHERE TRUNC(SYSDATE) BETWEEN araddeb AND aradfin
           AND foutype = 1 AND aratfou = 1 AND ROWNUM = 1)                 AS "Supplier desc",
       (SELECT fccnum FROM ORDERABLE
         WHERE TRUNC(SYSDATE) BETWEEN araddeb AND aradfin
           AND foutype = 1 AND aratfou = 1 AND ROWNUM = 1)                 AS "Contrac",
       (SELECT aranfilf FROM ORDERABLE
         WHERE TRUNC(SYSDATE) BETWEEN araddeb AND aradfin
           AND foutype = 1 AND aratfou = 1 AND ROWNUM = 1)                 AS "Addres chain",
       (SELECT tappbrut FROM tarprix@HEINENS_CEN_PROD, ORDERABLE
         WHERE tapcfin = aracfin AND tapccin = araccin
           AND TRUNC(SYSDATE) BETWEEN araddeb AND aradfin
           AND foutype = 1 AND aratfou = 1 AND ROWNUM = 1)                 AS "Cost",
       (SELECT aratcde || ' | ' || pkparpostes.get_postlibl@HEINENS_CEN_PROD(1, 10, 1071, aratcde, 'HN')
          FROM ORDERABLE
         WHERE TRUNC(SYSDATE) BETWEEN araddeb AND aradfin
           AND foutype = 1 AND aratfou = 1 AND ROWNUM = 1)                 AS "Ord./Rec.",
       (SELECT ararefc || ' | ' || pkparpostes.get_postlibl@HEINENS_CEN_PROD(1, 10, 1071, aratcde, 'HN')
          FROM ORDERABLE
         WHERE TRUNC(SYSDATE) BETWEEN araddeb AND aradfin
           AND foutype = 1 AND aratfou = 1 AND ROWNUM = 1)                 AS "Ref. to order",
       arvcexv                                                             AS "SV",
       pkartcoca.Get_Arccode@HEINENS_CEN_PROD(1, arvcinv)                  AS "Barcode",
       (SELECT pkartstock.get_skuunits@HEINENS_CEN_PROD(1, aracinl) FROM ORDERABLE
         WHERE TRUNC(SYSDATE) BETWEEN araddeb AND aradfin
           AND foutype = 1 AND aratfou = 1 AND ROWNUM = 1)                 AS "Pack",
       (SELECT DECODE(foutype,
                      1, 'DSD',
                      DECODE(foucnuf, 'AO%', 'Allotment', 'Warehouse'))
          FROM ORDERABLE
         WHERE TRUNC(SYSDATE) BETWEEN araddeb AND aradfin
           AND foutype = 1 AND aratfou = 1 AND ROWNUM = 1
           AND pkresrel.isSiteBelongToNode@HEINENS_CEN_PROD(1, 7, arasite, '1') = 1
           AND ROWNUM = 1)                                                 AS "Flow",
       r.artdcre                                                           AS "Created on",
       r.artutil                                                           AS "Created by",
       -- New: technical join key used by ITM_FULL_ATTRIBUTES; not for display.
       v.arvcinv                                                           AS "Variant CINV"
  FROM ARTRAC@HEINENS_CEN_PROD r,
       ARTUV@HEINENS_CEN_PROD  v
 WHERE r.artcinr = v.arvcinr
   AND v.arvetat = 1 /* active */;


-- ─── 2. ITM_FULL_ATTRIBUTES — rebase on V_GOLD_ITEM with optional enrichments
-- Returns one row per (LU × active sale variant). Header columns come from
-- V_GOLD_ITEM; enrichment columns are gated by Y/N flags so the skinny
-- version costs the same as ITM_ARTICLE_HEADER.
--
-- Binds:
--   :lu_id           STRING required — V_GOLD_ITEM."Item code"
--   :site_id         STRING optional — only used when :include_retail='Y'
--   :include_ean     STRING optional (Y/N, default N)
--   :include_retail  STRING optional (Y/N, default N) — needs :site_id when Y
--   :include_history STRING optional (Y/N, default N)
--
-- IMPORTANT: ITM_ARTICLE_HEADER stays as `SELECT * FROM V_GOLD_ITEM`. After
-- this script, "Variant CINV" appears as the last column there too. That's
-- intentional — the client can column-filter if needed, but exposing it
-- keeps the two templates aligned and lets the assistant join them.

UPDATE AI_SKILL_SQL_TEMPLATE
   SET template_label = 'Wide item card: V_GOLD_ITEM + optional retail / EAN / history',
       purpose        = 'Wide V_GOLD_ITEM card per (LU x active SV) plus optional All EANs (LISTAGG), retail at :site_id (best AVESCOPE priority) and 90d price-change count. include_ean/retail/history flags gate joins.',
       sql_text       = q'~SELECT g.*,
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
       parameters_json = q'~[{"name":"lu_id","type":"STRING","required":true},{"name":"site_id","type":"STRING","required":false},{"name":"include_ean","type":"STRING","required":false},{"name":"include_retail","type":"STRING","required":false},{"name":"include_history","type":"STRING","required":false}]~',
       tables_referenced = 'V_GOLD_ITEM, ARTCOCA, AVEPRIX, AVETAR, AVESCOPE'
 WHERE skill_id      = 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB'
   AND template_code = 'ITM_FULL_ATTRIBUTES';

-- Insert if it didn't exist yet (deploys 26 then 29 in fresh envs hit this).
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose,
    sql_text, parameters_json, tables_referenced
)
SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',
       'ITM_FULL_ATTRIBUTES',
       'Wide item card: V_GOLD_ITEM + optional retail / EAN / history',
       'Wide V_GOLD_ITEM card per (LU x active SV) plus optional All EANs (LISTAGG), retail at :site_id (best AVESCOPE priority) and 90d price-change count. include_ean/retail/history flags gate joins.',
       q'~SELECT g.*,
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
       q'~[{"name":"lu_id","type":"STRING","required":true},{"name":"site_id","type":"STRING","required":false},{"name":"include_ean","type":"STRING","required":false},{"name":"include_retail","type":"STRING","required":false},{"name":"include_history","type":"STRING","required":false}]~',
       'V_GOLD_ITEM, ARTCOCA, AVEPRIX, AVETAR, AVESCOPE'
  FROM dual
 WHERE NOT EXISTS (
    SELECT 1
      FROM AI_SKILL_SQL_TEMPLATE
     WHERE skill_id      = 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB'
       AND template_code = 'ITM_FULL_ATTRIBUTES'
);


-- ─── 3. Vocabulary — continuation phrases that force ITM_FULL_ATTRIBUTES ───
-- These INTENT_PHRASEs are tuned for the "I'm already looking at item X,
-- now add Y" follow-up pattern. Boost is 1.4–1.6 so they outrank the
-- single-template phrasings ("retail price" → ITM_RETAIL_ACTIVE @ 1.2) when
-- the user is enriching the existing card. The frontend also forces
-- template_code='ITM_FULL_ATTRIBUTES' whenever a session lu_id is present
-- and the question contains an include_* keyword — see ai.assistant.component.ts.
--
-- The chip-text in ai.assistant.component.ts ("Add retail price",
-- "Add EAN codes", "Add price history") matches phrases in this list so
-- chip clicks route deterministically.

MERGE INTO AI_SKILL_VOCABULARY t
USING (
    -- Enrichment trigger phrases (route to ITM_FULL_ATTRIBUTES) ----------
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB' AS skill_id,
           'add retail price'         AS term,
           'ITEM_FULL_ATTRIBUTES'     AS canonical_concept,
           'INTENT_PHRASE'            AS term_type,
           1.6                        AS confidence_boost
      FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'add the retail',          'ITEM_FULL_ATTRIBUTES', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'and the retail',          'ITEM_FULL_ATTRIBUTES', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'include retail',          'ITEM_FULL_ATTRIBUTES', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'with retail price',       'ITEM_FULL_ATTRIBUTES', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'plus retail',             'ITEM_FULL_ATTRIBUTES', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'add ean codes',           'ITEM_FULL_ATTRIBUTES', 'INTENT_PHRASE', 1.6 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'add the ean',             'ITEM_FULL_ATTRIBUTES', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'and the ean',             'ITEM_FULL_ATTRIBUTES', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'include ean',             'ITEM_FULL_ATTRIBUTES', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'with ean codes',          'ITEM_FULL_ATTRIBUTES', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'plus the ean',            'ITEM_FULL_ATTRIBUTES', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'add price history',       'ITEM_FULL_ATTRIBUTES', 'INTENT_PHRASE', 1.6 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'include history',         'ITEM_FULL_ATTRIBUTES', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'and price changes',       'ITEM_FULL_ATTRIBUTES', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'with price changes',      'ITEM_FULL_ATTRIBUTES', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'consolidate the result',  'ITEM_FULL_ATTRIBUTES', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'consolidate everything',  'ITEM_FULL_ATTRIBUTES', 'INTENT_PHRASE', 1.5 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'show everything for',     'ITEM_FULL_ATTRIBUTES', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'full item card',          'ITEM_FULL_ATTRIBUTES', 'INTENT_PHRASE', 1.4 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'all the details',         'ITEM_FULL_ATTRIBUTES', 'INTENT_PHRASE', 1.3 FROM dual UNION ALL

    -- SYNONYM — short verbs that often appear in continuations -----------
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'enrich',                  'ITEM_FULL_ATTRIBUTES', 'SYNONYM',       1.1 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'consolidate',             'ITEM_FULL_ATTRIBUTES', 'SYNONYM',       1.1 FROM dual UNION ALL
    SELECT 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'merge',                   'ITEM_FULL_ATTRIBUTES', 'SYNONYM',       1.0 FROM dual
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


-- ─── 4. Sanity checks (visible in deploy log) ──────────────────────────────
PROMPT === V_GOLD_ITEM column count (expect 19 incl. Variant CINV) ===
SELECT COUNT(*) AS col_count
  FROM ALL_TAB_COLUMNS
 WHERE OWNER     = USER
   AND TABLE_NAME = 'V_GOLD_ITEM';

PROMPT === ITM_FULL_ATTRIBUTES — bind list and SQL size ===
SELECT template_code,
       DBMS_LOB.GETLENGTH(sql_text)        AS sql_len,
       DBMS_LOB.GETLENGTH(parameters_json) AS params_len,
       tables_referenced
  FROM AI_SKILL_SQL_TEMPLATE
 WHERE skill_id      = 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB'
   AND template_code = 'ITM_FULL_ATTRIBUTES';

PROMPT === New enrichment vocab on ITEM_MASTER_RETAIL ===
SELECT term_type, COUNT(*) AS row_count
  FROM AI_SKILL_VOCABULARY
 WHERE skill_id          = 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB'
   AND canonical_concept = 'ITEM_FULL_ATTRIBUTES'
 GROUP BY term_type
 ORDER BY term_type;
