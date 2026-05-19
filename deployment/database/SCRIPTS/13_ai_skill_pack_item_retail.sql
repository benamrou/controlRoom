-- =============================================================================
-- Supply Chain AI — Loadable skill pack: Item (retail industry)
-- =============================================================================
-- Prerequisite: deployment/database/SCRIPTS/08_skill_engine.sql (tables).
-- Creates one TEMPLATE skill + knowledge, playbook, SQL templates, vocabulary,
-- and test cases. Safe to re-run: deletes bundle rows for this skill_id first.
--
-- Skill library: retailer_id = 'TEMPLATE', skill_code = 'ITEM_MASTER_RETAIL'
-- (distinct from seed rows such as PROMOTION_MGMT / WAREHOUSE_SETUP).
--
-- GOLD references use placeholder schema CEN — replace with CORPENV.ENVGOLDSCHEMA
-- prefix (e.g. HNUCEN) before production use.
-- =============================================================================

DELETE FROM AI_SKILL_TEST_CASE      WHERE skill_id = 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL_VOCABULARY     WHERE skill_id = 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL_SQL_TEMPLATE   WHERE skill_id = 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL_PLAYBOOK_STEP  WHERE skill_id = 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL_KNOWLEDGE_ITEM WHERE skill_id = 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL_VERSION        WHERE skill_id = 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL_RETAILER       WHERE skill_id = 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL                WHERE skill_id = 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB';

INSERT INTO AI_SKILL (
    skill_id, retailer_id, skill_code, skill_name, domain,
    description, version, status, created_by, created_at, updated_at
) VALUES (
    'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'TEMPLATE',
    'ITEM_MASTER_RETAIL',
    'Item master — retail lifecycle',
    'ITEM',
    'Article (LU) master, item-site ranging, stock layers, movements, replenishment signals, and POS sellability for grocery / mass retail.',
    1.0,
    'DRAFT',
    'SYSTEM',
    SYSTIMESTAMP,
    SYSTIMESTAMP
);

-- ---------------------------------------------------------------------------
-- Knowledge items
-- ---------------------------------------------------------------------------
INSERT INTO AI_SKILL_KNOWLEDGE_ITEM (
    skill_id, base_knowledge_key, override_mode, knowledge_key, label, description,
    anchor_question, rounds_json, validation_sql, priority, is_mandatory
) VALUES (
    'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', NULL, 'EXTEND', 'ITEM_ACTIVE_SELLABLE',
    'Active / sellable at store',
    'Business rules tying ARTRAC, ARTSITE, and status flags to POS and replenishment.',
    'For this retailer, what exact combination of article and site attributes must be true before an item is considered active and sellable at the register — and what GOLD tables are authoritative?',
    q'~[{"round":2,"question":"How do we interpret item-site status vs national article status when they disagree?"},{"round":3,"question":"Which codes mean delisted but still physically on hand?"}]~',
    NULL,
    1, 1
);

INSERT INTO AI_SKILL_KNOWLEDGE_ITEM (
    skill_id, base_knowledge_key, override_mode, knowledge_key, label, description,
    anchor_question, rounds_json, validation_sql, priority, is_mandatory
) VALUES (
    'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', NULL, 'EXTEND', 'ITEM_SITE_RANGING',
    'Ranging and assortment',
    'Which sites carry the LU and effective dates.',
    'How is ranging expressed for an article at store level (included / excluded / trial), and what date fields govern when the shelf assortment change takes effect for replenishment?',
    q'~[{"round":2,"question":"Who can override a delist at store vs chain level?"}]~',
    NULL,
    1, 1
);

INSERT INTO AI_SKILL_KNOWLEDGE_ITEM (
    skill_id, base_knowledge_key, override_mode, knowledge_key, label, description,
    anchor_question, rounds_json, validation_sql, priority, is_mandatory
) VALUES (
    'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', NULL, 'EXTEND', 'ITEM_IDENT_ARTUL',
    'Identifiers and ARTUL',
    'Barcodes, consumer units, and LU resolution at POS.',
    'When a cashier scans a barcode that does not match the primary LU on file, what is the resolution order (ARTUL, pack sizes, linked articles) and when should we block the sale?',
    q'~[{"round":2,"question":"How are multipack vs single-unit LUs linked in GOLD?"}]~',
    NULL,
    2, 1
);

INSERT INTO AI_SKILL_KNOWLEDGE_ITEM (
    skill_id, base_knowledge_key, override_mode, knowledge_key, label, description,
    anchor_question, rounds_json, validation_sql, priority, is_mandatory
) VALUES (
    'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', NULL, 'EXTEND', 'ITEM_REPLEN_ARTREAP',
    'Replenishment parameters',
    'ARTREAP and store ordering signals.',
    'Which replenishment parameters on ARTREAP most often explain chronic phantom inventory or chronic outs for a slow mover in retail — and how do we distinguish system min from vendor pack rounding?',
    q'~[{"round":2,"question":"Where is safety stock or presentation stock held for this banner?"}]~',
    NULL,
    2, 0
);

INSERT INTO AI_SKILL_KNOWLEDGE_ITEM (
    skill_id, base_knowledge_key, override_mode, knowledge_key, label, description,
    anchor_question, rounds_json, validation_sql, priority, is_mandatory
) VALUES (
    'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', NULL, 'EXTEND', 'ITEM_RECALL_STORE',
    'Recall and withdrawal',
    'Store action on recalled LUs.',
    'When HQ publishes a recall affecting an LU, what store-facing statuses and movement types must appear before the item is blocked at POS and removed from shelf?',
    q'~[{"round":2,"question":"How does a partial lot withdrawal differ from a full SKU stop-sell?"}]~',
    NULL,
    2, 0
);

-- ---------------------------------------------------------------------------
-- Playbook steps
-- ---------------------------------------------------------------------------
INSERT INTO AI_SKILL_PLAYBOOK_STEP (
    skill_id, complaint_type, step_order, step_code, step_label, hypothesis_tested,
    gold_schema, gold_table, key_columns, evidence_fact_type, is_mandatory,
    insert_position, insert_after_step
) VALUES (
    'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'NOT_FOUND_POS', 10, 'ITM_PB_ARTRAC',
    'Confirm article trace (ARTRAC) exists and status',
    'Article inactive nationally or wrong LU',
    'CEN', 'ARTRAC', 'ARTCEXR, ARTCINR', 'ARTICLE_MASTER', 1, 'APPEND', NULL
);

INSERT INTO AI_SKILL_PLAYBOOK_STEP (
    skill_id, complaint_type, step_order, step_code, step_label, hypothesis_tested,
    gold_schema, gold_table, key_columns, evidence_fact_type, is_mandatory,
    insert_position, insert_after_step
) VALUES (
    'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'NOT_FOUND_POS', 20, 'ITM_PB_ARTSITE',
    'Item-site ranged and dates',
    'Not ranged or effective window excludes today',
    'CEN', 'ARTSITE', 'CODART, CODESIT, DATDEB, DATFIN, TYPSIT', 'SITE_ITEM_FACT', 1, 'APPEND', NULL
);

INSERT INTO AI_SKILL_PLAYBOOK_STEP (
    skill_id, complaint_type, step_order, step_code, step_label, hypothesis_tested,
    gold_schema, gold_table, key_columns, evidence_fact_type, is_mandatory,
    insert_position, insert_after_step
) VALUES (
    'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'NOT_FOUND_POS', 30, 'ITM_PB_ARTUL',
    'Barcode / alternate LU mapping',
    'Scanned GTIN maps to different or blocked LU',
    'CEN', 'ARTUL', 'CODART, CODEAN', 'IDENTIFIER_MAP', 1, 'APPEND', NULL
);

INSERT INTO AI_SKILL_PLAYBOOK_STEP (
    skill_id, complaint_type, step_order, step_code, step_label, hypothesis_tested,
    gold_schema, gold_table, key_columns, evidence_fact_type, is_mandatory,
    insert_position, insert_after_step
) VALUES (
    'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'ZERO_STOCK_OOS', 10, 'ITM_PB_STOCK_LAYER',
    'On-hand by stock layer',
    'Stock exists in non-sellable layer or wrong site',
    'CEN', 'STOCOUCH', 'CODART, CODESIT, QTESAI, TYPCOUCH', 'STOCK_LAYER', 1, 'APPEND', NULL
);

INSERT INTO AI_SKILL_PLAYBOOK_STEP (
    skill_id, complaint_type, step_order, step_code, step_label, hypothesis_tested,
    gold_schema, gold_table, key_columns, evidence_fact_type, is_mandatory,
    insert_position, insert_after_step
) VALUES (
    'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'ZERO_STOCK_OOS', 20, 'ITM_PB_MOVEMENTS',
    'Last movements affecting OH',
    'Shrink, adjustment, or transfer not reflected in expectation',
    'CEN', 'STOMVT', 'CODART, CODESIT, TYPMVT, DATMVT', 'MOVEMENT_FACT', 1, 'APPEND', NULL
);

INSERT INTO AI_SKILL_PLAYBOOK_STEP (
    skill_id, complaint_type, step_order, step_code, step_label, hypothesis_tested,
    gold_schema, gold_table, key_columns, evidence_fact_type, is_mandatory,
    insert_position, insert_after_step
) VALUES (
    'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'WRONG_SHELF_PRICE', 10, 'ITM_PB_PROMO',
    'Promo / price list linkage',
    'Promo active but shelf label not updated',
    'CEN', 'OPRARTSIT', 'CODART, CODESIT, DATDEB, DATFIN', 'PROMO_SITE_FACT', 1, 'APPEND', NULL
);

INSERT INTO AI_SKILL_PLAYBOOK_STEP (
    skill_id, complaint_type, step_order, step_code, step_label, hypothesis_tested,
    gold_schema, gold_table, key_columns, evidence_fact_type, is_mandatory,
    insert_position, insert_after_step
) VALUES (
    'F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'NEW_ITEM_SETUP', 10, 'ITM_PB_REAP',
    'Replenishment profile for new item',
    'ARTREAP missing or default min wrong for category',
    'CEN', 'ARTREAP', 'CODART, CODESIT, MIN, MAX', 'REPLEN_PARAM', 1, 'APPEND', NULL
);

-- ---------------------------------------------------------------------------
-- SQL templates
-- ---------------------------------------------------------------------------
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'ITM_ARTICLE_HEADER',
    'Article trace row (ARTRAC)',
    'Core ARTRAC row for LU — replace CEN with retailer GOLD schema; :lu_id = ARTCEXR.',
    q'~SELECT t.ARTCEXR, t.ARTCINR
  FROM CEN.ARTRAC t
 WHERE t.ARTCEXR = :lu_id~',
    q'~[{"name":"lu_id","type":"STRING"}]~',
    'ARTRAC'
);

INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'ITM_ITEM_SITE_ROW',
    'Item-site status',
    'ARTSITE for one LU and store — adjust column list to your model.',
    q'~SELECT s.CODART, s.CODESIT, s.TYPSIT, s.DATDEB, s.DATFIN
  FROM CEN.ARTSITE s
 WHERE s.CODART = :lu_id
   AND s.CODESIT = :site_id~',
    q'~[{"name":"lu_id","type":"STRING"},{"name":"site_id","type":"STRING"}]~',
    'ARTSITE'
);

INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'ITM_STOCK_LAYERS_SUM',
    'Sum on-hand by article-site',
    'STOCOUCH aggregate — template; validate TYPCOUCH codes locally.',
    q'~SELECT k.CODART, k.CODESIT, SUM(k.QTESAI) AS qty_total
  FROM CEN.STOCOUCH k
 WHERE k.CODART = :lu_id
   AND k.CODESIT = :site_id
 GROUP BY k.CODART, k.CODESIT~',
    q'~[{"name":"lu_id","type":"STRING"},{"name":"site_id","type":"STRING"}]~',
    'STOCOUCH'
);

INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'ITM_RECENT_MOVEMENTS',
    'Recent movements for LU at site',
    'STOMVT window for investigations.',
    q'~SELECT m.TYPMVT, m.DATMVT, m.QTESAI
  FROM CEN.STOMVT m
 WHERE m.CODART = :lu_id
   AND m.CODESIT = :site_id
   AND m.DATMVT >= SYSDATE - :lookback_days
   AND ROWNUM <= 300~',
    q'~[{"name":"lu_id","type":"STRING"},{"name":"site_id","type":"STRING"},{"name":"lookback_days","type":"NUMBER"}]~',
    'STOMVT'
);

INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'ITM_BARCODE_LOOKUP',
    'Resolve scanned EAN to LU',
    'ARTUL lookup — column names may vary; validate before use.',
    q'~SELECT u.CODART, u.CODEAN
  FROM CEN.ARTUL u
 WHERE u.CODEAN = :ean
   AND ROWNUM <= 20~',
    q'~[{"name":"ean","type":"STRING"}]~',
    'ARTUL'
);

-- ---------------------------------------------------------------------------
-- Vocabulary
-- ---------------------------------------------------------------------------
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'SKU', 'ITEM_LU', 'ABBREVIATION', 'EN', 1.1);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'article', 'ITEM_LU', 'SYNONYM', 'EN', 1.05);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'LU', 'ITEM_LU', 'ABBREVIATION', 'EN', 1.15);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'PLU', 'ITEM_PLU', 'ABBREVIATION', 'EN', 1.0);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'not on file', 'NOT_FOUND_POS', 'JARGON', 'EN', 1.1);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'holes on shelf', 'ZERO_STOCK_OOS', 'SYNONYM', 'EN', 1.05);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'out of stock', 'ZERO_STOCK_OOS', 'SYNONYM', 'EN', 1.1);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'shelf label wrong', 'WRONG_SHELF_PRICE', 'SYNONYM', 'EN', 1.05);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'planogram', 'ITEM_SITE_RANGING', 'PROCESS_TERM', 'EN', 1.0);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'private label', 'ITEM_OWN_BRAND', 'BRAND_TERM', 'EN', 0.95);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'sell by date', 'ITEM_DATING', 'PROCESS_TERM', 'EN', 1.0);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'mod', 'ITEM_MODIFIER', 'JARGON', 'EN', 1.0);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1E2D3C4-B5A6-7890-CDEF-1234567890AB', 'new item cut-in', 'NEW_ITEM_SETUP', 'PROCESS_TERM', 'EN', 1.05);

-- ---------------------------------------------------------------------------
-- Test suite
-- ---------------------------------------------------------------------------
INSERT INTO AI_SKILL_TEST_CASE (
    skill_id, test_name, complaint_text, complaint_type,
    expected_root_cause, expected_confidence, expected_steps_min
) VALUES (
    'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'POS not on file for known cereal',
    'Store 2211: cashier scans UPC for our private-label cereal; POS says item not found. Warehouse shows stock on hand.',
    'NOT_FOUND_POS',
    'ITEM_IDENT_ARTUL',
    'PROBABLE',
    2
);

INSERT INTO AI_SKILL_TEST_CASE (
    skill_id, test_name, complaint_text, complaint_type,
    expected_root_cause, expected_confidence, expected_steps_min
) VALUES (
    'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'Chronic empty shelf fast mover',
    'Department manager reports facing empty every morning for LU 123456 though system shows 12 units on hand.',
    'ZERO_STOCK_OOS',
    'ITEM_REPLEN_ARTREAP',
    'PROBABLE',
    2
);

INSERT INTO AI_SKILL_TEST_CASE (
    skill_id, test_name, complaint_text, complaint_type,
    expected_root_cause, expected_confidence, expected_steps_min
) VALUES (
    'F1E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'Shelf tag shows old promo price',
    'Customer complaint: shelf tag $2.99 but rings $3.49; competitor ad not involved.',
    'WRONG_SHELF_PRICE',
    'WRONG_SHELF_PRICE',
    'PROBABLE',
    1
);

COMMIT;

-- =============================================================================
-- After load: Skill library — template **ITEM_MASTER_RETAIL**
-- skill_id: F1E2D3C4-B5A6-7890-CDEF-1234567890AB
-- =============================================================================
