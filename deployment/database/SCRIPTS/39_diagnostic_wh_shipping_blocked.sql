-- =============================================================================
-- Diagnostic Skill: WH_SHIPPING_BLOCKED
-- "Why is item X not being shipped from the warehouse?"
-- Deploy after: 37_diagnostic_chain_tables.sql, 38_diagnostic_chain_libquery.sql
-- Safe to re-run: DELETEs bundle rows first.
--
-- Check SQLs use confirmed column names from existing scripts:
--   STOCOUCH: STCSITE, STCCINR, STCCEXR, STCQTEP (physical qty)
--   ARTREAP:  ARSITE, ARCINR, ARCEXR, ARQTSS (safety stock), ARQTRE (reorder pt)
--   ARTSITE:  ARTCINR, SITSITE — verify SITSITE against your GOLD schema.
--             If ORA-00904, try STSITE or ARSITE depending on GOLD version.
--   CDEENTCDE/CDEDETCDE: ECDCINCDE, ECDDATE, STATUT, ECDCFIN, DCDCINR, DCDCEXCDE
-- =============================================================================

-- ── Skill row ─────────────────────────────────────────────────────────────────
DELETE FROM AI_DIAGNOSTIC_STEP      WHERE SKILL_ID = 'DA000001-D100-4A00-8100-D10000000001';
DELETE FROM AI_SKILL_VOCABULARY     WHERE skill_id = 'DA000001-D100-4A00-8100-D10000000001';
DELETE FROM AI_SKILL_SQL_TEMPLATE   WHERE skill_id = 'DA000001-D100-4A00-8100-D10000000001';
DELETE FROM AI_SKILL_PLAYBOOK_STEP  WHERE skill_id = 'DA000001-D100-4A00-8100-D10000000001';
DELETE FROM AI_SKILL_KNOWLEDGE_ITEM WHERE skill_id = 'DA000001-D100-4A00-8100-D10000000001';
DELETE FROM AI_SKILL_VERSION        WHERE skill_id = 'DA000001-D100-4A00-8100-D10000000001';
DELETE FROM AI_SKILL_RETAILER       WHERE skill_id = 'DA000001-D100-4A00-8100-D10000000001';
DELETE FROM AI_SKILL                WHERE skill_id = 'DA000001-D100-4A00-8100-D10000000001';

INSERT INTO AI_SKILL (
    skill_id, retailer_id, skill_code, skill_name, domain,
    description, version, status, created_by, created_at, updated_at
) VALUES (
    'DA000001-D100-4A00-8100-D10000000001',
    'TEMPLATE',
    'WH_SHIPPING_BLOCKED',
    'Warehouse shipping blocked - root cause',
    'WAREHOUSE',
    'Diagnoses why an item is not being shipped from the warehouse to a store. Checks ranging, DC stock, open PO coverage, and pick order generation.',
    1.0, 'DRAFT', 'SYSTEM', SYSTIMESTAMP, SYSTIMESTAMP
);

-- ── Vocabulary (WHY-intent routing) ───────────────────────────────────────────
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000001-D100-4A00-8100-D10000000001', 'why is item not shipping',       'WH_BLOCKED',     'INTENT_PHRASE', 'EN', 1.9);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000001-D100-4A00-8100-D10000000001', 'item not being shipped',         'WH_BLOCKED',     'INTENT_PHRASE', 'EN', 1.9);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000001-D100-4A00-8100-D10000000001', 'not shipping from warehouse',    'WH_BLOCKED',     'INTENT_PHRASE', 'EN', 1.8);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000001-D100-4A00-8100-D10000000001', 'why not shipped',                'WH_BLOCKED',     'INTENT_PHRASE', 'EN', 1.7);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000001-D100-4A00-8100-D10000000001', 'not delivered to store',         'WH_BLOCKED',     'INTENT_PHRASE', 'EN', 1.6);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000001-D100-4A00-8100-D10000000001', 'warehouse shipping',             'WH_SHIPPING',    'PROCESS_TERM',  'EN', 1.4);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000001-D100-4A00-8100-D10000000001', 'blocked warehouse',              'WH_BLOCKED',     'SYNONYM',       'EN', 1.4);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000001-D100-4A00-8100-D10000000001', 'dc not sending',                 'WH_BLOCKED',     'JARGON',        'EN', 1.5);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000001-D100-4A00-8100-D10000000001', 'distribution center blocked',    'WH_BLOCKED',     'SYNONYM',       'EN', 1.4);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000001-D100-4A00-8100-D10000000001', 'lu_id',                          'lu_id',          'BIND_HINT',     'EN', 1.0);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000001-D100-4A00-8100-D10000000001', 'item',                           'lu_id',          'BIND_HINT',     'EN', 1.0);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000001-D100-4A00-8100-D10000000001', 'for store',                      'site_id',        'BIND_HINT',     'EN', 1.0);

-- ── Check SQL templates ────────────────────────────────────────────────────────
-- Step 1: Is item ranged at target store?
-- Returns RANGED (COUNT of ARTSITE rows for this item × site).
-- ARTSITE column SITSITE: verify against your GOLD version (may be STSITE or ARSITE).
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'DA000001-D100-4A00-8100-D10000000001',
    'WH_CHK_RANGING',
    'Ranging check — is item ranged at store?',
    'Returns RANGED=COUNT of ARTSITE rows. 0 = item not ranged here.',
    q'~SELECT COUNT(*) AS RANGED
  FROM ARTSITE@HEINENS_CEN_PROD s
  JOIN ARTRAC@HEINENS_CEN_PROD a ON a.ARTCINR = s.ARTCINR
 WHERE a.ARTCEXR = :lu_id
   AND s.SITSITE = TO_NUMBER(TRIM(:site_id))~',
    '[{"name":"lu_id","type":"STRING","required":true},{"name":"site_id","type":"STRING","required":true}]',
    'ARTSITE@HEINENS_CEN_PROD, ARTRAC@HEINENS_CEN_PROD'
);

-- Step 2: DC stock + open PO combined — returns derived STOCK_DIAGNOSIS.
-- STOCK_DIAGNOSIS values: STOCKOUT_WITH_PO / STOCKOUT_NO_PO / HAS_STOCK
-- STOCOUCH columns from script 18: STCSITE, STCCINR, STCCEXR, STCQTEP
-- CDEENTCDE/CDEDETCDE columns from script 18: ECDCINCDE, ECDDATE, STATUT, DCDCINR
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'DA000001-D100-4A00-8100-D10000000001',
    'WH_CHK_STOCK_AND_PO',
    'DC stock + open PO combined check',
    'Returns STOCK (physical qty across all DC sites), PO_COUNT (open POs), NEXT_PO_DATE, and derived STOCK_DIAGNOSIS.',
    q'~SELECT NVL(st.TOTAL_STOCK, 0)          AS STOCK,
       NVL(po.PO_COUNT, 0)               AS PO_COUNT,
       TO_CHAR(po.NEXT_PO_DATE, 'YYYY-MM-DD') AS NEXT_PO_DATE,
       NVL(po.PO_QTY, 0)                AS PO_QTY,
       CASE
           WHEN NVL(st.TOTAL_STOCK, 0) = 0 AND NVL(po.PO_COUNT, 0) > 0 THEN 'STOCKOUT_WITH_PO'
           WHEN NVL(st.TOTAL_STOCK, 0) = 0                              THEN 'STOCKOUT_NO_PO'
           ELSE                                                               'HAS_STOCK'
       END AS STOCK_DIAGNOSIS
  FROM (
           SELECT NVL(SUM(s.STCQTEP), 0) AS TOTAL_STOCK
             FROM STOCOUCH@HEINENS_CEN_PROD s
             JOIN ARTRAC@HEINENS_CEN_PROD  a ON a.ARTCINR = s.STCCINR
            WHERE a.ARTCEXR = :lu_id
       ) st,
       (
           SELECT COUNT(DISTINCT e.ECDCINCDE) AS PO_COUNT,
                  MIN(e.ECDDATE)              AS NEXT_PO_DATE,
                  SUM(d.DCDQTEC)             AS PO_QTY
             FROM CDEENTCDE@HEINENS_CEN_PROD e
             JOIN CDEDETCDE@HEINENS_CEN_PROD d ON d.DCDCINCDE = e.ECDCINCDE
             JOIN ARTRAC@HEINENS_CEN_PROD    a ON a.ARTCINR   = d.DCDCINR
            WHERE a.ARTCEXR  = :lu_id
              AND e.STATUT  IN ('3', '5')
              AND e.ECDDATE >= TRUNC(SYSDATE)
       ) po~',
    '[{"name":"lu_id","type":"STRING","required":true}]',
    'STOCOUCH@HEINENS_CEN_PROD, CDEENTCDE@HEINENS_CEN_PROD, CDEDETCDE@HEINENS_CEN_PROD, ARTRAC@HEINENS_CEN_PROD'
);

-- Step 3: Pick order check — are there open warehouse pick/reservation orders?
-- If stock exists but no pick order, the replenishment trigger is not firing.
-- Using ARTREAP as pick proxy: if item is in ARTREAP for the store, picks should exist.
-- Fallback if STOCKPICK (GWR schema) not yet accessible: check open CDEENTCDE from DC to store.
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'DA000001-D100-4A00-8100-D10000000001',
    'WH_CHK_REPLEN_SETUP',
    'Replenishment parameters check for store',
    'Returns REPLEN_COUNT (ARTREAP rows for item at store), MIN_STOCK, MAX_STOCK. 0 rows = replen not configured.',
    q'~SELECT COUNT(*) AS REPLEN_COUNT,
       MAX(r.ARQTSS) AS MIN_STOCK,
       MAX(r.ARQTMA) AS MAX_STOCK,
       MAX(r.ARQTRE) AS REORDER_PT
  FROM ARTREAP@HEINENS_CEN_PROD r
 WHERE r.ARSITE = TO_NUMBER(TRIM(:site_id))
   AND (r.ARCEXR = :lu_id
        OR r.ARCINR = (SELECT ARTCINR FROM ARTRAC@HEINENS_CEN_PROD WHERE ARTCEXR = :lu_id AND ROWNUM = 1))~',
    '[{"name":"lu_id","type":"STRING","required":true},{"name":"site_id","type":"STRING","required":true}]',
    'ARTREAP@HEINENS_CEN_PROD, ARTRAC@HEINENS_CEN_PROD'
);

-- ── Diagnostic step chain ──────────────────────────────────────────────────────
-- Step 1: Ranging check
INSERT INTO AI_DIAGNOSTIC_STEP (SKILL_ID, STEP_ORDER, TEMPLATE_CODE, STOP_FIELD, STOP_OPERATOR, STOP_VALUE, CONCLUSION_KEY, STEP_LABEL)
VALUES ('DA000001-D100-4A00-8100-D10000000001', 1, 'WH_CHK_RANGING', 'RANGED', '=', '0', 'WH_ITEM_NOT_RANGED', 'Ranging check — is item set up at this store?');

-- Step 2a: Stock + PO combined — stockout with inbound PO
INSERT INTO AI_DIAGNOSTIC_STEP (SKILL_ID, STEP_ORDER, TEMPLATE_CODE, STOP_FIELD, STOP_OPERATOR, STOP_VALUE, CONCLUSION_KEY, STEP_LABEL)
VALUES ('DA000001-D100-4A00-8100-D10000000001', 2, 'WH_CHK_STOCK_AND_PO', 'STOCK_DIAGNOSIS', '=', 'STOCKOUT_WITH_PO', 'WH_STOCKOUT_PO_COMING', 'DC stock + open PO check');

-- Step 2b: Stock + PO combined — stockout with no PO
INSERT INTO AI_DIAGNOSTIC_STEP (SKILL_ID, STEP_ORDER, TEMPLATE_CODE, STOP_FIELD, STOP_OPERATOR, STOP_VALUE, CONCLUSION_KEY, STEP_LABEL)
VALUES ('DA000001-D100-4A00-8100-D10000000001', 2, 'WH_CHK_STOCK_AND_PO', 'STOCK_DIAGNOSIS', '=', 'STOCKOUT_NO_PO', 'WH_STOCKOUT_NO_PO', 'DC stock + open PO check');

-- Step 3: Replenishment params check (stock exists but item not replenishing)
INSERT INTO AI_DIAGNOSTIC_STEP (SKILL_ID, STEP_ORDER, TEMPLATE_CODE, STOP_FIELD, STOP_OPERATOR, STOP_VALUE, CONCLUSION_KEY, STEP_LABEL)
VALUES ('DA000001-D100-4A00-8100-D10000000001', 3, 'WH_CHK_REPLEN_SETUP', 'REPLEN_COUNT', '=', '0', 'WH_REPLEN_NOT_CONFIGURED', 'Replenishment parameters check');

-- ── Conclusion templates (RETAILER_ID = 'TEMPLATE' = applies to all retailers) ─
DELETE FROM AI_DIAGNOSTIC_CONCLUSION WHERE CONCLUSION_KEY IN (
    'WH_ITEM_NOT_RANGED','WH_STOCKOUT_PO_COMING','WH_STOCKOUT_NO_PO','WH_REPLEN_NOT_CONFIGURED'
) AND RETAILER_ID = 'TEMPLATE';

INSERT INTO AI_DIAGNOSTIC_CONCLUSION (CONCLUSION_KEY, RETAILER_ID, SUMMARY_TEMPLATE, EVIDENCE_TEMPLATE, FOLLOW_UP_TEMPLATE, SEVERITY)
VALUES (
    'WH_ITEM_NOT_RANGED', 'TEMPLATE',
    'Item {lu_id} is not ranged at store {site_id}. There is no ARTSITE entry for this item-store combination. The item cannot be shipped somewhere it is not set up.',
    'ARTSITE check: 0 rows found for item {lu_id} at store {site_id}|Ranging must be set up before warehouse replenishment can occur',
    'Would you like me to check which stores this item IS ranged at across the network?',
    'WARNING'
);

INSERT INTO AI_DIAGNOSTIC_CONCLUSION (CONCLUSION_KEY, RETAILER_ID, SUMMARY_TEMPLATE, EVIDENCE_TEMPLATE, FOLLOW_UP_TEMPLATE, SEVERITY)
VALUES (
    'WH_STOCKOUT_PO_COMING', 'TEMPLATE',
    'DC stock for item {lu_id} is currently zero. A purchase order ({PO_COUNT} PO open) is expected on {NEXT_PO_DATE} for {PO_QTY} units. No emergency action is needed — stock will arrive and trigger replenishment automatically.',
    'DC on-hand: 0 units (STOCOUCH)|Inbound PO due: {NEXT_PO_DATE} — {PO_QTY} units ordered|Replenishment will resume once the PO is received and processed',
    'Want me to check which stores are critically low on item {lu_id} and might need a lateral transfer before the PO arrives?',
    'INFO'
);

INSERT INTO AI_DIAGNOSTIC_CONCLUSION (CONCLUSION_KEY, RETAILER_ID, SUMMARY_TEMPLATE, EVIDENCE_TEMPLATE, FOLLOW_UP_TEMPLATE, SEVERITY)
VALUES (
    'WH_STOCKOUT_NO_PO', 'TEMPLATE',
    'DC stock for item {lu_id} is zero and there are no open purchase orders. The item cannot ship because there is nothing to ship. A replenishment order needs to be placed immediately.',
    'DC on-hand: 0 units (STOCOUCH)|No open PO found in CDEENTCDE (statut 3 or 5)|Replenishment trigger may not have fired — check ARTREAP parameters and safety stock',
    'Do you want me to check the replenishment parameters for item {lu_id} to understand why no PO was generated?',
    'CRITICAL'
);

INSERT INTO AI_DIAGNOSTIC_CONCLUSION (CONCLUSION_KEY, RETAILER_ID, SUMMARY_TEMPLATE, EVIDENCE_TEMPLATE, FOLLOW_UP_TEMPLATE, SEVERITY)
VALUES (
    'WH_REPLEN_NOT_CONFIGURED', 'TEMPLATE',
    'Item {lu_id} has DC stock available but replenishment to store {site_id} is not configured. There are no ARTREAP rows for this item at this store, so the warehouse replenishment engine has no parameters to generate a pick order.',
    'DC stock: available (STOCOUCH check passed)|ARTREAP check: 0 rows for item {lu_id} at store {site_id}|Without min/max parameters the replenishment engine cannot generate a store order',
    'Would you like me to show the replenishment parameters for other stores that DO have item {lu_id} configured, to use as a reference?',
    'WARNING'
);

COMMIT;

-- Verify
SELECT d.STEP_ORDER, d.TEMPLATE_CODE, d.STOP_FIELD, d.STOP_OPERATOR, d.STOP_VALUE, d.CONCLUSION_KEY
  FROM AI_DIAGNOSTIC_STEP d
 WHERE d.SKILL_ID = 'DA000001-D100-4A00-8100-D10000000001'
 ORDER BY d.STEP_ORDER, d.CONCLUSION_KEY;

SELECT c.CONCLUSION_KEY, c.SEVERITY, SUBSTR(c.SUMMARY_TEMPLATE, 1, 60) AS SUMMARY_PREVIEW
  FROM AI_DIAGNOSTIC_CONCLUSION c
 WHERE c.CONCLUSION_KEY IN ('WH_ITEM_NOT_RANGED','WH_STOCKOUT_PO_COMING','WH_STOCKOUT_NO_PO','WH_REPLEN_NOT_CONFIGURED')
 ORDER BY c.CONCLUSION_KEY;
