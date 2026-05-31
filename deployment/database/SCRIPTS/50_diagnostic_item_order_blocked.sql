-- =============================================================================
-- Diagnostic Skill: ITEM_ORDER_BLOCKED
-- "Store #7 can't order item 100100" / "why can't we order item X at store Y?"
-- Deploy after: 37_diagnostic_chain_tables.sql, 38_diagnostic_chain_libquery.sql
-- Safe to re-run: DELETEs bundle rows first.
--
-- Diagnostic flow (6 sequential checks):
--   1. Item has an active sale variant (ARTRAC + ARTUV)
--   2. Item is ranged at the store (ARTSITE)
--   3. Item has an active principal supplier contract (ARTUC + FOUDGENE)
--   4. Item has a purchase cost on file > 0 (TARPRIX)
--   5. Supplier has a delivery schedule at the store in next 14 days (WSUPPCALDATA)
--   6. Item is in the orderable assortment for the store network (ARTUC site filter)
--
-- Confirmed column names from V_GOLD_ITEM / script 12 / script 39:
--   ARTRAC:   ARTCEXR (LU code), ARTCINR (internal)
--   ARTUV:    ARVCINR → ARTCINR, ARVETAT = 1 (active)
--   ARTSITE:  ARTCINR (join key), SITSITE (site number)
--   ARTUC:    ARACEXR (LU code), ARACFIN (FK→FOUDGENE.FOUCFIN),
--             ARACCIN (FK→FOUCCOM.FCCCCIN), ARADDEB / ARADFIN (contract dates),
--             ARASITE (network node), ARATFOU = 1 (principal supplier)
--   FOUDGENE: FOUCFIN (PK), FOUCNUF (code), FOULIBL (name), FOUTYPE = 1 (DSD)
--   FOUCCOM:  FCCCCIN (PK)
--   TARPRIX:  TAPCFIN → FOUCFIN, TAPCCIN → FCCCCIN, TAPPBRUT (gross cost)
--   WSUPPCALDATA: WSCIDFU (supplier FK), WSCSITE (site), WSCDATE (delivery date)
--                 — verify WSCIDFU links to FOUCFIN vs FOUCNUF on your GOLD version.
-- =============================================================================

-- ── Clean previous run ────────────────────────────────────────────────────────
DELETE FROM AI_DIAGNOSTIC_STEP      WHERE SKILL_ID = 'DA000002-D100-4A00-8200-D20000000002';
DELETE FROM AI_SKILL_VOCABULARY     WHERE skill_id = 'DA000002-D100-4A00-8200-D20000000002';
DELETE FROM AI_SKILL_SQL_TEMPLATE   WHERE skill_id = 'DA000002-D100-4A00-8200-D20000000002';
DELETE FROM AI_SKILL_PLAYBOOK_STEP  WHERE skill_id = 'DA000002-D100-4A00-8200-D20000000002';
DELETE FROM AI_SKILL_KNOWLEDGE_ITEM WHERE skill_id = 'DA000002-D100-4A00-8200-D20000000002';
DELETE FROM AI_SKILL_VERSION        WHERE skill_id = 'DA000002-D100-4A00-8200-D20000000002';
DELETE FROM AI_SKILL_RETAILER       WHERE skill_id = 'DA000002-D100-4A00-8200-D20000000002';
DELETE FROM AI_SKILL               WHERE skill_id = 'DA000002-D100-4A00-8200-D20000000002';

-- ── Skill row ─────────────────────────────────────────────────────────────────
INSERT INTO AI_SKILL (
    skill_id, retailer_id, skill_code, skill_name, domain,
    description, version, status, created_by, created_at, updated_at
) VALUES (
    'DA000002-D100-4A00-8200-D20000000002',
    'TEMPLATE',
    'ITEM_ORDER_BLOCKED',
    'Item cannot be ordered - root cause',
    'PROCUREMENT',
    'Diagnoses why a store cannot place an order for a specific item. Checks item active status, ranging, supplier contract, cost, delivery schedule, and orderable assortment.',
    1.0, 'DRAFT', 'SYSTEM', SYSTIMESTAMP, SYSTIMESTAMP
);

-- ── Vocabulary (diagnostic routing) ──────────────────────────────────────────
-- WHY-intent phrases (multiplier 9× in engine scorer)
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000002-D100-4A00-8200-D20000000002', 'why cant we order',           'ORDER_BLOCKED', 'INTENT_PHRASE', 'EN', 2.0);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000002-D100-4A00-8200-D20000000002', 'why can we not order',        'ORDER_BLOCKED', 'INTENT_PHRASE', 'EN', 2.0);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000002-D100-4A00-8200-D20000000002', 'cant order item',             'ORDER_BLOCKED', 'INTENT_PHRASE', 'EN', 1.9);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000002-D100-4A00-8200-D20000000002', 'cannot order item',           'ORDER_BLOCKED', 'INTENT_PHRASE', 'EN', 1.9);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000002-D100-4A00-8200-D20000000002', 'item not orderable',          'ORDER_BLOCKED', 'INTENT_PHRASE', 'EN', 1.8);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000002-D100-4A00-8200-D20000000002', 'unable to order',             'ORDER_BLOCKED', 'INTENT_PHRASE', 'EN', 1.8);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000002-D100-4A00-8200-D20000000002', 'order blocked',               'ORDER_BLOCKED', 'INTENT_PHRASE', 'EN', 1.8);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000002-D100-4A00-8200-D20000000002', 'blocked ordering',            'ORDER_BLOCKED', 'INTENT_PHRASE', 'EN', 1.7);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000002-D100-4A00-8200-D20000000002', 'not able to order',           'ORDER_BLOCKED', 'INTENT_PHRASE', 'EN', 1.7);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000002-D100-4A00-8200-D20000000002', 'store cant order',            'ORDER_BLOCKED', 'INTENT_PHRASE', 'EN', 1.8);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000002-D100-4A00-8200-D20000000002', 'why is item blocked',         'ORDER_BLOCKED', 'INTENT_PHRASE', 'EN', 1.7);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000002-D100-4A00-8200-D20000000002', 'investigate order issue',     'ORDER_BLOCKED', 'INTENT_PHRASE', 'EN', 1.7);
-- Process terms and synonyms
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000002-D100-4A00-8200-D20000000002', 'orderable',                   'ORDERABILITY',  'PROCESS_TERM',  'EN', 1.3);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000002-D100-4A00-8200-D20000000002', 'order block',                 'ORDER_BLOCKED', 'SYNONYM',       'EN', 1.4);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000002-D100-4A00-8200-D20000000002', 'order issue',                 'ORDER_BLOCKED', 'SYNONYM',       'EN', 1.3);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000002-D100-4A00-8200-D20000000002', 'supplier active',             'SUPPLIER_CHECK', 'PROCESS_TERM', 'EN', 1.2);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000002-D100-4A00-8200-D20000000002', 'cost on file',                'COST_CHECK',    'PROCESS_TERM',  'EN', 1.2);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000002-D100-4A00-8200-D20000000002', 'delivery schedule',           'SCHEDULE_CHECK','PROCESS_TERM',  'EN', 1.2);
-- Bind hints
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000002-D100-4A00-8200-D20000000002', 'item',     'lu_id',   'BIND_HINT', 'EN', 1.0);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000002-D100-4A00-8200-D20000000002', 'lu_id',    'lu_id',   'BIND_HINT', 'EN', 1.0);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000002-D100-4A00-8200-D20000000002', 'for store','site_id', 'BIND_HINT', 'EN', 1.0);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000002-D100-4A00-8200-D20000000002', 'at store', 'site_id', 'BIND_HINT', 'EN', 1.0);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000002-D100-4A00-8200-D20000000002', 'store',    'site_id', 'BIND_HINT', 'EN', 1.0);

-- ── Check SQL templates ────────────────────────────────────────────────────────

-- Step 1: Item active — does it exist in ARTRAC with an active sale variant?
-- ARTUV.ARVETAT = 1 is the active flag (confirmed from V_GOLD_ITEM / script 26).
-- Returns ACTIVE_VARIANT_COUNT (0 = item not found or all variants inactive).
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'DA000002-D100-4A00-8200-D20000000002',
    'IOB_CHK_ITEM_ACTIVE',
    'Item active check — ARTRAC + ARTUV',
    'Count active sale variants (ARVETAT=1). 0 = item unknown or fully deactivated.',
    q'~SELECT COUNT(v.ARVCINV) AS ACTIVE_VARIANT_COUNT,
       MAX(r.ARTCEXR) AS LU_CODE
  FROM ARTRAC@HEINENS_CEN_PROD r
  JOIN ARTUV@HEINENS_CEN_PROD v ON v.ARVCINR = r.ARTCINR
 WHERE r.ARTCEXR = :lu_id
   AND v.ARVETAT = 1~',
    '[{"name":"lu_id","type":"STRING","required":true}]',
    'ARTRAC@HEINENS_CEN_PROD, ARTUV@HEINENS_CEN_PROD'
);

-- Step 2: Ranging — is item ranged at this store?
-- ARTSITE column SITSITE: confirmed from script 39.
-- Returns RANGED (0 = not ranged at this store).
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'DA000002-D100-4A00-8200-D20000000002',
    'IOB_CHK_RANGING',
    'Ranging check — ARTSITE',
    'Count ARTSITE rows for item × store. 0 = item not ranged here.',
    q'~SELECT COUNT(*) AS RANGED
  FROM ARTSITE@HEINENS_CEN_PROD s
  JOIN ARTRAC@HEINENS_CEN_PROD a ON a.ARTCINR = s.ARTCINR
 WHERE a.ARTCEXR = :lu_id
   AND s.SITSITE = TO_NUMBER(TRIM(:site_id))~',
    '[{"name":"lu_id","type":"STRING","required":true},{"name":"site_id","type":"STRING","required":true}]',
    'ARTSITE@HEINENS_CEN_PROD, ARTRAC@HEINENS_CEN_PROD'
);

-- Step 3: Supplier contract — does the item have an active principal supplier today?
-- ARTUC.ARATFOU = 1 (principal supplier), FOUDGENE.FOUTYPE = 1 (DSD).
-- Returns ACTIVE_SUPPLIER_COUNT, SUPPLIER_CODE, SUPPLIER_NAME for context in conclusion.
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'DA000002-D100-4A00-8200-D20000000002',
    'IOB_CHK_SUPPLIER',
    'Active supplier contract check — ARTUC + FOUDGENE',
    'Count active principal supplier contracts (ARATFOU=1, dates bracket SYSDATE). 0 = no active supplier.',
    q'~SELECT COUNT(*)          AS ACTIVE_SUPPLIER_COUNT,
       MAX(g.FOUCNUF)       AS SUPPLIER_CODE,
       MAX(g.FOULIBL)       AS SUPPLIER_NAME,
       MIN(u.ARADDEB)       AS CONTRACT_FROM,
       MAX(u.ARADFIN)       AS CONTRACT_TO
  FROM ARTUC@HEINENS_CEN_PROD u
  JOIN FOUDGENE@HEINENS_CEN_PROD g ON g.FOUCFIN = u.ARACFIN
 WHERE u.ARACEXR = :lu_id
   AND TRUNC(SYSDATE) BETWEEN TRUNC(u.ARADDEB) AND TRUNC(u.ARADFIN)
   AND u.ARATFOU = 1
   AND g.FOUTYPE  = 1~',
    '[{"name":"lu_id","type":"STRING","required":true}]',
    'ARTUC@HEINENS_CEN_PROD, FOUDGENE@HEINENS_CEN_PROD'
);

-- Step 4: Purchase cost — is there a cost > 0 on file for the active contract?
-- Uses the same ORDERABLE CTE pattern as V_GOLD_ITEM (tapcfin=aracfin, tapccin=araccin).
-- Returns HAS_COST (0 = no cost row or cost is zero), COST_AMOUNT for context.
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'DA000002-D100-4A00-8200-D20000000002',
    'IOB_CHK_COST',
    'Purchase cost check — TARPRIX via ARTUC',
    'Count TARPRIX rows with TAPPBRUT > 0 for active supplier contract. 0 = missing or zero cost.',
    q'~SELECT COUNT(*)             AS HAS_COST,
       MAX(p.TAPPBRUT)         AS COST_AMOUNT,
       MAX(g.FOUCNUF)          AS SUPPLIER_CODE
  FROM ARTUC@HEINENS_CEN_PROD     u
  JOIN FOUDGENE@HEINENS_CEN_PROD  g ON g.FOUCFIN  = u.ARACFIN
  JOIN FOUCCOM@HEINENS_CEN_PROD   c ON c.FCCCCIN  = u.ARACCIN
  JOIN TARPRIX@HEINENS_CEN_PROD   p ON p.TAPCFIN  = u.ARACFIN
                                   AND p.TAPCCIN  = u.ARACCIN
 WHERE u.ARACEXR = :lu_id
   AND TRUNC(SYSDATE) BETWEEN TRUNC(u.ARADDEB) AND TRUNC(u.ARADFIN)
   AND u.ARATFOU = 1
   AND g.FOUTYPE  = 1
   AND p.TAPPBRUT > 0~',
    '[{"name":"lu_id","type":"STRING","required":true}]',
    'ARTUC@HEINENS_CEN_PROD, FOUDGENE@HEINENS_CEN_PROD, FOUCCOM@HEINENS_CEN_PROD, TARPRIX@HEINENS_CEN_PROD'
);

-- Step 5: Vendor delivery schedule — does the supplier have a delivery slot
-- at this store in the next 14 days?
-- WSUPPCALDATA: WSCIDFU (FK to FOUCFIN), WSCSITE (store), WSCDATE (delivery date).
-- If WSCIDFU links to FOUCNUF instead of FOUCFIN, swap the join accordingly.
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'DA000002-D100-4A00-8200-D20000000002',
    'IOB_CHK_SCHEDULE',
    'Vendor delivery schedule — WSUPPCALDATA',
    'Count WSUPPCALDATA slots for item supplier at store in next 14 days. 0 = no delivery window.',
    q'~SELECT COUNT(*)            AS SCHEDULE_SLOTS,
       MIN(w.WSCDATE)         AS NEXT_DELIVERY,
       MAX(g.FOUCNUF)         AS SUPPLIER_CODE
  FROM ARTUC@HEINENS_CEN_PROD        u
  JOIN FOUDGENE@HEINENS_CEN_PROD     g ON g.FOUCFIN  = u.ARACFIN
  JOIN WSUPPCALDATA@HEINENS_CEN_PROD w ON w.WSCIDFU  = u.ARACFIN
 WHERE u.ARACEXR    = :lu_id
   AND TRUNC(SYSDATE) BETWEEN TRUNC(u.ARADDEB) AND TRUNC(u.ARADFIN)
   AND u.ARATFOU    = 1
   AND g.FOUTYPE    = 1
   AND w.WSCSITE    = TO_NUMBER(TRIM(:site_id))
   AND w.WSCDATE   >= TRUNC(SYSDATE)
   AND w.WSCDATE   <= TRUNC(SYSDATE) + 14~',
    '[{"name":"lu_id","type":"STRING","required":true},{"name":"site_id","type":"STRING","required":true}]',
    'ARTUC@HEINENS_CEN_PROD, FOUDGENE@HEINENS_CEN_PROD, WSUPPCALDATA@HEINENS_CEN_PROD'
);

-- Step 6: Orderable assortment — is the item in the ARTUC orderable network
-- that covers this store? Uses pkresrel.isSiteBelongToNode (same as DSD buyable items).
-- Returns ORDERABLE_COUNT (0 = item not set up for ordering at this store's network).
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'DA000002-D100-4A00-8200-D20000000002',
    'IOB_CHK_ORDERABLE',
    'Orderable assortment at site — ARTUC network filter',
    'Check ARTUC with isSiteBelongToNode filter. 0 = item not in orderable assortment for this store.',
    q'~SELECT COUNT(*) AS ORDERABLE_COUNT
  FROM ARTUC@HEINENS_CEN_PROD u
  JOIN FOUDGENE@HEINENS_CEN_PROD g ON g.FOUCFIN = u.ARACFIN
 WHERE u.ARACEXR = :lu_id
   AND TRUNC(SYSDATE) BETWEEN TRUNC(u.ARADDEB) AND TRUNC(u.ARADFIN)
   AND u.ARATFOU = 1
   AND g.FOUTYPE  = 1
   AND pkresrel.isSiteBelongToNode@HEINENS_CEN_PROD(
           1,
           TO_NUMBER(TRIM(:site_id)),
           u.ARASITE,
           '1'
       ) = 1~',
    '[{"name":"lu_id","type":"STRING","required":true},{"name":"site_id","type":"STRING","required":true}]',
    'ARTUC@HEINENS_CEN_PROD, FOUDGENE@HEINENS_CEN_PROD'
);

-- ── Diagnostic step chain (execution order + stop conditions) ─────────────────
-- STEP_TYPE: HARD = abort chain immediately (item doesn't exist → nothing else is meaningful)
--            SOFT = record issue and continue (multiple issues can coexist simultaneously)
--
-- Step 1 — item active? (HARD: if item doesn't exist, all remaining checks are meaningless)
INSERT INTO AI_DIAGNOSTIC_STEP (SKILL_ID, STEP_ORDER, TEMPLATE_CODE, STOP_FIELD, STOP_OPERATOR, STOP_VALUE, CONCLUSION_KEY, STEP_LABEL, STEP_TYPE)
VALUES ('DA000002-D100-4A00-8200-D20000000002', 1, 'IOB_CHK_ITEM_ACTIVE', 'ACTIVE_VARIANT_COUNT', '=', '0', 'IOB_ITEM_INACTIVE', 'Item active check — is item known and active?', 'HARD');

-- Step 2 — ranged at store? (SOFT: independent of supplier/cost/schedule — all can be wrong together)
INSERT INTO AI_DIAGNOSTIC_STEP (SKILL_ID, STEP_ORDER, TEMPLATE_CODE, STOP_FIELD, STOP_OPERATOR, STOP_VALUE, CONCLUSION_KEY, STEP_LABEL, STEP_TYPE)
VALUES ('DA000002-D100-4A00-8200-D20000000002', 2, 'IOB_CHK_RANGING', 'RANGED', '=', '0', 'IOB_NOT_RANGED', 'Ranging check — is item set up at this store?', 'SOFT');

-- Step 3 — active supplier? (SOFT: may be missing independently of ranging issue)
INSERT INTO AI_DIAGNOSTIC_STEP (SKILL_ID, STEP_ORDER, TEMPLATE_CODE, STOP_FIELD, STOP_OPERATOR, STOP_VALUE, CONCLUSION_KEY, STEP_LABEL, STEP_TYPE)
VALUES ('DA000002-D100-4A00-8200-D20000000002', 3, 'IOB_CHK_SUPPLIER', 'ACTIVE_SUPPLIER_COUNT', '=', '0', 'IOB_NO_ACTIVE_SUPPLIER', 'Supplier contract check — is there an active principal supplier?', 'SOFT');

-- Step 4 — cost on file? (SOFT: may be missing even when supplier is active)
INSERT INTO AI_DIAGNOSTIC_STEP (SKILL_ID, STEP_ORDER, TEMPLATE_CODE, STOP_FIELD, STOP_OPERATOR, STOP_VALUE, CONCLUSION_KEY, STEP_LABEL, STEP_TYPE)
VALUES ('DA000002-D100-4A00-8200-D20000000002', 4, 'IOB_CHK_COST', 'HAS_COST', '=', '0', 'IOB_NO_COST', 'Cost check — does the item have a purchase cost > 0?', 'SOFT');

-- Step 5 — delivery schedule? (SOFT: schedule gap is independent of other issues)
INSERT INTO AI_DIAGNOSTIC_STEP (SKILL_ID, STEP_ORDER, TEMPLATE_CODE, STOP_FIELD, STOP_OPERATOR, STOP_VALUE, CONCLUSION_KEY, STEP_LABEL, STEP_TYPE)
VALUES ('DA000002-D100-4A00-8200-D20000000002', 5, 'IOB_CHK_SCHEDULE', 'SCHEDULE_SLOTS', '=', '0', 'IOB_NO_DELIVERY_SLOT', 'Delivery schedule — does supplier deliver to this store in next 14 days?', 'SOFT');

-- Step 6 — in orderable assortment for store network? (SOFT: network scope issue is independent)
INSERT INTO AI_DIAGNOSTIC_STEP (SKILL_ID, STEP_ORDER, TEMPLATE_CODE, STOP_FIELD, STOP_OPERATOR, STOP_VALUE, CONCLUSION_KEY, STEP_LABEL, STEP_TYPE)
VALUES ('DA000002-D100-4A00-8200-D20000000002', 6, 'IOB_CHK_ORDERABLE', 'ORDERABLE_COUNT', '=', '0', 'IOB_NOT_IN_ORDERABLE', 'Orderable assortment — is item in ordering assortment for this store?', 'SOFT');

-- ── Conclusion templates ──────────────────────────────────────────────────────
DELETE FROM AI_DIAGNOSTIC_CONCLUSION
 WHERE CONCLUSION_KEY IN (
    'IOB_ITEM_INACTIVE', 'IOB_NOT_RANGED', 'IOB_NO_ACTIVE_SUPPLIER',
    'IOB_NO_COST', 'IOB_NO_DELIVERY_SLOT', 'IOB_NOT_IN_ORDERABLE'
 )
   AND RETAILER_ID = 'TEMPLATE';

-- 1 — Item not active
INSERT INTO AI_DIAGNOSTIC_CONCLUSION (CONCLUSION_KEY, RETAILER_ID, SUMMARY_TEMPLATE, EVIDENCE_TEMPLATE, FOLLOW_UP_TEMPLATE, SEVERITY)
VALUES (
    'IOB_ITEM_INACTIVE', 'TEMPLATE',
    'Item {lu_id} has no active sale variant in ARTUV. The item cannot be ordered because it is either unknown to the system or all its sale variants have been deactivated.',
    'ARTRAC + ARTUV check: 0 active variants found for item {lu_id}|Active sale variant requires ARTUV.ARVETAT = 1|Contact the category manager to reactivate the item or verify the item code',
    'Would you like me to look up item {lu_id} in ARTRAC to check if it was ever created in GOLD?',
    'CRITICAL'
);

-- 2 — Item not ranged at store
INSERT INTO AI_DIAGNOSTIC_CONCLUSION (CONCLUSION_KEY, RETAILER_ID, SUMMARY_TEMPLATE, EVIDENCE_TEMPLATE, FOLLOW_UP_TEMPLATE, SEVERITY)
VALUES (
    'IOB_NOT_RANGED', 'TEMPLATE',
    'Item {lu_id} is not ranged at store {site_id}. There is no ARTSITE entry for this item-store combination. Ranging must be set up before any order can be placed.',
    'ARTSITE check: 0 rows found for item {lu_id} at store {site_id}|Item is active (ARTUV check passed)|Request ranging from the category manager — they control ARTSITE entries',
    'Want me to check which stores currently have item {lu_id} ranged?',
    'WARNING'
);

-- 3 — No active supplier
INSERT INTO AI_DIAGNOSTIC_CONCLUSION (CONCLUSION_KEY, RETAILER_ID, SUMMARY_TEMPLATE, EVIDENCE_TEMPLATE, FOLLOW_UP_TEMPLATE, SEVERITY)
VALUES (
    'IOB_NO_ACTIVE_SUPPLIER', 'TEMPLATE',
    'Item {lu_id} has no active principal supplier contract today. ARTUC has no row with ARATFOU=1 and current dates. Orders require an active supplier before a PO can be generated.',
    'ARTUC check: 0 rows with ARATFOU=1 and ARADDEB <= SYSDATE <= ARADFIN for item {lu_id}|Item is active and ranged (checks 1+2 passed)|Supplier contract may have expired — contact the buyer to renew or assign a new supplier',
    'Would you like me to show the full ARTUC history for item {lu_id} including expired contracts?',
    'CRITICAL'
);

-- 4 — No purchase cost
INSERT INTO AI_DIAGNOSTIC_CONCLUSION (CONCLUSION_KEY, RETAILER_ID, SUMMARY_TEMPLATE, EVIDENCE_TEMPLATE, FOLLOW_UP_TEMPLATE, SEVERITY)
VALUES (
    'IOB_NO_COST', 'TEMPLATE',
    'Item {lu_id} has no purchase cost on file. TARPRIX has no row with TAPPBRUT > 0 for the active supplier contract. GOLD will not generate a PO for an item with zero or missing cost.',
    'TARPRIX check: no row found with cost > 0 for item {lu_id} (active supplier: {SUPPLIER_CODE})|Item is active, ranged, and has an active supplier (checks 1–3 passed)|Ask the supplier {SUPPLIER_CODE} to send an updated price list, or enter the cost manually in TARPRIX',
    'Would you like me to show the full cost history for item {lu_id} to see when the cost disappeared?',
    'CRITICAL'
);

-- 5 — No delivery schedule
INSERT INTO AI_DIAGNOSTIC_CONCLUSION (CONCLUSION_KEY, RETAILER_ID, SUMMARY_TEMPLATE, EVIDENCE_TEMPLATE, FOLLOW_UP_TEMPLATE, SEVERITY)
VALUES (
    'IOB_NO_DELIVERY_SLOT', 'TEMPLATE',
    'Supplier {SUPPLIER_CODE} has no delivery schedule at store {site_id} in the next 14 days. WSUPPCALDATA has no open slots, so the ordering window is closed even though the item and contract are in order.',
    'WSUPPCALDATA check: 0 delivery slots found for supplier {SUPPLIER_CODE} at store {site_id} in next 14 days|Item, ranging, supplier contract, and cost all check out (checks 1–4 passed)|Contact logistics or the supplier to add a delivery slot for store {site_id}',
    'Want me to check when the next available delivery from supplier {SUPPLIER_CODE} is at any store?',
    'WARNING'
);

-- 6 — Not in orderable assortment for store network
INSERT INTO AI_DIAGNOSTIC_CONCLUSION (CONCLUSION_KEY, RETAILER_ID, SUMMARY_TEMPLATE, EVIDENCE_TEMPLATE, FOLLOW_UP_TEMPLATE, SEVERITY)
VALUES (
    'IOB_NOT_IN_ORDERABLE', 'TEMPLATE',
    'Item {lu_id} is not in the orderable assortment for store {site_id}. The ARTUC network node (ARASITE) does not cover this store — pkresrel.isSiteBelongToNode returns 0 for this combination.',
    'Orderable assortment check: no ARTUC row covers store {site_id} via network node for item {lu_id}|Item, ranging, supplier, cost, and schedule all check out (checks 1–5 passed)|The network allocation (ARASITE) needs to be extended to cover store {site_id} — contact the category or supply chain team',
    'Would you like me to show which stores ARE in the orderable assortment for item {lu_id}?',
    'WARNING'
);

COMMIT;

-- ── Verification ──────────────────────────────────────────────────────────────
SELECT d.STEP_ORDER, d.TEMPLATE_CODE, d.STOP_FIELD, d.STOP_VALUE, d.CONCLUSION_KEY
  FROM AI_DIAGNOSTIC_STEP d
 WHERE d.SKILL_ID = 'DA000002-D100-4A00-8200-D20000000002'
 ORDER BY d.STEP_ORDER;

SELECT c.CONCLUSION_KEY, c.SEVERITY, SUBSTR(c.SUMMARY_TEMPLATE, 1, 70) AS SUMMARY_PREVIEW
  FROM AI_DIAGNOSTIC_CONCLUSION c
 WHERE c.CONCLUSION_KEY IN (
    'IOB_ITEM_INACTIVE', 'IOB_NOT_RANGED', 'IOB_NO_ACTIVE_SUPPLIER',
    'IOB_NO_COST', 'IOB_NO_DELIVERY_SLOT', 'IOB_NOT_IN_ORDERABLE'
 )
 ORDER BY c.CONCLUSION_KEY;
