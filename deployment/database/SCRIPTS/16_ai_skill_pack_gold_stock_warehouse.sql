-- =============================================================================
-- Supply Chain AI — GOLD Stock / Warehouse (STK): DC & logistics file
-- =============================================================================
-- documentation/GOLD/STK510-* — picking, preparation, DC stock, ship to store.
-- STK = Stock/warehouse schema prefix (e.g. HNUSTK). Prerequisite: 08_skill_engine.sql.
--
-- Run from this directory (SQL*Plus / SQLcl): @16_ai_skill_pack_gold_stock_warehouse.sql
-- skill_id F5E2D3C4-B5A6-7890-CDEF-1234567890AB | skill_code GOLD_STOCK_WAREHOUSE
-- Article trace: CEN.ARTRAC (ARTCEXR / ARTCINR) alongside DC tables.
-- =============================================================================

WHENEVER SQLERROR EXIT SQL.SQLCODE

DELETE FROM AI_SKILL_TEST_CASE      WHERE skill_id = 'F5E2D3C4-B5A6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL_VOCABULARY     WHERE skill_id = 'F5E2D3C4-B5A6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL_SQL_TEMPLATE   WHERE skill_id = 'F5E2D3C4-B5A6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL_PLAYBOOK_STEP  WHERE skill_id = 'F5E2D3C4-B5A6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL_KNOWLEDGE_ITEM WHERE skill_id = 'F5E2D3C4-B5A6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL_VERSION        WHERE skill_id = 'F5E2D3C4-B5A6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL_RETAILER       WHERE skill_id = 'F5E2D3C4-B5A6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL                WHERE skill_id = 'F5E2D3C4-B5A6-7890-CDEF-1234567890AB';

INSERT INTO AI_SKILL (
    skill_id, retailer_id, skill_code, skill_name, domain,
    description, version, status, created_by, created_at, updated_at
) VALUES (
    'F5E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'TEMPLATE',
    'GOLD_STOCK_WAREHOUSE',
    'GOLD Stock — warehouse & logistics (STK)',
    'WAREHOUSE',
    'Warehouse GOLD (STK): distribution centre stock, picking & preparation, movements, cross-dock, and reconciliation with central (CEN) and store (MBL) views.',
    1.0,
    'DRAFT',
    'SYSTEM',
    SYSTIMESTAMP,
    SYSTIMESTAMP
);

INSERT INTO AI_SKILL_KNOWLEDGE_ITEM (
    skill_id, base_knowledge_key, override_mode, knowledge_key, label, description,
    anchor_question, rounds_json, validation_sql, priority, is_mandatory
) VALUES (
    'F5E2D3C4-B5A6-7890-CDEF-1234567890AB', NULL, 'EXTEND', 'STK_DC_STOCK_LAYERS',
    'DC stock layers & reservation',
    'How physical and reserved quantities exist in STK before shipment.',
    'Which stock layer or reservation types in the warehouse file explain “available to pick” versus “allocated to shipment” for a wave?',
    q'~[{"round":2,"question":"How does a short pick reverse reservation in STK?"}]~',
    NULL,
    1, 1
);

INSERT INTO AI_SKILL_KNOWLEDGE_ITEM (
    skill_id, base_knowledge_key, override_mode, knowledge_key, label, description,
    anchor_question, rounds_json, validation_sql, priority, is_mandatory
) VALUES (
    'F5E2D3C4-B5A6-7890-CDEF-1234567890AB', NULL, 'EXTEND', 'STK_PICK_PREP',
    'Picking & preparation programmes',
    'Wave, cluster, or voice picking per STK510 functional docs.',
    'What is the minimum data (order, destination site, cut-off) that must be frozen before a pick wave is released to the floor?',
    q'~[{"round":2,"question":"Where is pick confirmation posted to movements?"}]~',
    NULL,
    1, 1
);

INSERT INTO AI_SKILL_KNOWLEDGE_ITEM (
    skill_id, base_knowledge_key, override_mode, knowledge_key, label, description,
    anchor_question, rounds_json, validation_sql, priority, is_mandatory
) VALUES (
    'F5E2D3C4-B5A6-7890-CDEF-1234567890AB', NULL, 'EXTEND', 'STK_SHIP_STORE',
    'Shipment to store',
    'Transfer from DC to retail site and expected arrival.',
    'How do you tie a completed DC shipment in STK to an expected receiving event at the store in MBL/CEN timelines?',
    q'~[{"round":2,"question":"What movement types indicate in-transit vs received?"}]~',
    NULL,
    2, 1
);

INSERT INTO AI_SKILL_KNOWLEDGE_ITEM (
    skill_id, base_knowledge_key, override_mode, knowledge_key, label, description,
    anchor_question, rounds_json, validation_sql, priority, is_mandatory
) VALUES (
    'F5E2D3C4-B5A6-7890-CDEF-1234567890AB', NULL, 'EXTEND', 'STK_INV_ADJ',
    'DC inventory adjustments',
    'Shrink, damage, recount postings in warehouse.',
    'When a DC cycle count posts an adjustment, how does that flow to central article-site stock for stores supplied from that DC?',
    q'~[{"round":2,"question":"Which approval level is required for high-value DC adjustments?"}]~',
    NULL,
    2, 0
);

INSERT INTO AI_SKILL_PLAYBOOK_STEP (
    skill_id, complaint_type, step_order, step_code, step_label, hypothesis_tested,
    gold_schema, gold_table, key_columns, evidence_fact_type, is_mandatory,
    insert_position, insert_after_step
) VALUES (
    'F5E2D3C4-B5A6-7890-CDEF-1234567890AB', 'SHORT_PICK', 5, 'STK_PB_ARTRAC',
    'Article trace before DC stock',
    'Article inactive or wrong internal ref blocks pick',
    'CEN', 'ARTRAC', 'ARTCEXR, ARTCINR', 'ARTICLE_MASTER', 1, 'APPEND', NULL
);

INSERT INTO AI_SKILL_PLAYBOOK_STEP (
    skill_id, complaint_type, step_order, step_code, step_label, hypothesis_tested,
    gold_schema, gold_table, key_columns, evidence_fact_type, is_mandatory,
    insert_position, insert_after_step
) VALUES (
    'F5E2D3C4-B5A6-7890-CDEF-1234567890AB', 'SHORT_PICK', 10, 'STK_PB_STOCK_DC',
    'DC on-hand & reservation',
    'Insufficient OH or locked layer in STK',
    'CEN', 'STOCOUCH', 'CODART, CODESIT, TYPCOUCH, QTESAI', 'STOCK_LAYER', 1, 'APPEND', NULL
);

INSERT INTO AI_SKILL_PLAYBOOK_STEP (
    skill_id, complaint_type, step_order, step_code, step_label, hypothesis_tested,
    gold_schema, gold_table, key_columns, evidence_fact_type, is_mandatory,
    insert_position, insert_after_step
) VALUES (
    'F5E2D3C4-B5A6-7890-CDEF-1234567890AB', 'SHORT_PICK', 20, 'STK_PB_MOVEMENT',
    'Pick / ship movements',
    'Pick confirmed but ship movement missing or reversed',
    'CEN', 'STOMVT', 'CODART, CODESIT, TYPMVT, DATMVT', 'MOVEMENT_FACT', 1, 'APPEND', NULL
);

INSERT INTO AI_SKILL_PLAYBOOK_STEP (
    skill_id, complaint_type, step_order, step_code, step_label, hypothesis_tested,
    gold_schema, gold_table, key_columns, evidence_fact_type, is_mandatory,
    insert_position, insert_after_step
) VALUES (
    'F5E2D3C4-B5A6-7890-CDEF-1234567890AB', 'DC_STORE_MISMATCH', 10, 'STK_PB_SITE_LINK',
    'DC–store supply link',
    'Wrong supplying site or route',
    'CEN', 'ARTSITE', 'CODESIT, CODART', 'SITE_ITEM_FACT', 1, 'APPEND', NULL
);

INSERT INTO AI_SKILL_PLAYBOOK_STEP (
    skill_id, complaint_type, step_order, step_code, step_label, hypothesis_tested,
    gold_schema, gold_table, key_columns, evidence_fact_type, is_mandatory,
    insert_position, insert_after_step
) VALUES (
    'F5E2D3C4-B5A6-7890-CDEF-1234567890AB', 'DC_STORE_MISMATCH', 20, 'STK_PB_PO_LINE',
    'Open distribution orders',
    'PO / dist order line qty vs picked qty',
    'CEN', 'CDEDETCDE', 'NUMCDE, NUMLIG, CODART, QTESAI', 'PO_LINE_FACT', 1, 'APPEND', NULL
);

INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'F5E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'STK_ARTRAC_ROW',
    'Article trace (CEN.ARTRAC) for DC',
    'Replace CEN with retailer central schema; :lu_id = ARTCEXR.',
    q'~SELECT t.ARTCEXR, t.ARTCINR
  FROM CEN.ARTRAC t
 WHERE t.ARTCEXR = :lu_id~',
    q'~[{"name":"lu_id","type":"STRING"}]~',
    'CEN.ARTRAC'
);

INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'F5E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'STK_STOCK_SUM_DC',
    'Sum stock layers at DC site',
    'Replace CEN with STK owner if DC tables live under STK schema.',
    q'~SELECT k.CODART, k.CODESIT, SUM(k.QTESAI) AS qty_total
  FROM CEN.STOCOUCH k
 WHERE k.CODART = :lu_id
   AND k.CODESIT = :dc_site_id
 GROUP BY k.CODART, k.CODESIT~',
    q'~[{"name":"lu_id","type":"STRING"},{"name":"dc_site_id","type":"STRING"}]~',
    'CEN.STOCOUCH'
);

INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'F5E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'STK_MOVEMENTS_DC',
    'DC movement window',
    'STOMVT for warehouse investigations.',
    q'~SELECT m.TYPMVT, m.DATMVT, m.QTESAI
  FROM CEN.STOMVT m
 WHERE m.CODART = :lu_id
   AND m.CODESIT = :dc_site_id
   AND m.DATMVT >= SYSDATE - :lookback_days
   AND ROWNUM <= 500~',
    q'~[{"name":"lu_id","type":"STRING"},{"name":"dc_site_id","type":"STRING"},{"name":"lookback_days","type":"NUMBER"}]~',
    'CEN.STOMVT'
);

INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'F5E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'STK_OPEN_DIST_LINES',
    'Open distribution lines for LU',
    'CDEDETCDE filtered — validate column names per retailer.',
    q'~SELECT d.NUMCDE, d.NUMLIG, d.CODART, d.QTESAI
  FROM CEN.CDEDETCDE d
 WHERE d.CODART = :lu_id
   AND ROWNUM <= 200~',
    q'~[{"name":"lu_id","type":"STRING"}]~',
    'CEN.CDEDETCDE'
);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F5E2D3C4-B5A6-7890-CDEF-1234567890AB', 'STK', 'STK_SCHEMA', 'ABBREVIATION', 'EN', 1.2);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F5E2D3C4-B5A6-7890-CDEF-1234567890AB', 'warehouse', 'STK_DC', 'SYNONYM', 'EN', 1.1);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F5E2D3C4-B5A6-7890-CDEF-1234567890AB', 'entrepôt', 'STK_DC', 'SYNONYM', 'FR', 1.1);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F5E2D3C4-B5A6-7890-CDEF-1234567890AB', 'picking', 'STK_PICK_PREP', 'PROCESS_TERM', 'EN', 1.15);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F5E2D3C4-B5A6-7890-CDEF-1234567890AB', 'préparation', 'STK_PICK_PREP', 'SYNONYM', 'FR', 1.05);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F5E2D3C4-B5A6-7890-CDEF-1234567890AB', 'short pick', 'SHORT_PICK', 'SYNONYM', 'EN', 1.1);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F5E2D3C4-B5A6-7890-CDEF-1234567890AB', 'cross dock', 'STK_SHIP_STORE', 'PROCESS_TERM', 'EN', 1.0);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F5E2D3C4-B5A6-7890-CDEF-1234567890AB', 'STK510', 'STK_DOCS', 'JARGON', 'EN', 1.0);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F5E2D3C4-B5A6-7890-CDEF-1234567890AB', 'DC', 'STK_DC', 'ABBREVIATION', 'EN', 1.05);

INSERT INTO AI_SKILL_TEST_CASE (
    skill_id, test_name, complaint_text, complaint_type,
    expected_root_cause, expected_confidence, expected_steps_min
) VALUES (
    'F5E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'Wave short pick cascade',
    'Picker reports short on wave 4412; store shipment now incomplete for tomorrow.',
    'SHORT_PICK',
    'STK_PB_MOVEMENT',
    'PROBABLE',
    2
);

INSERT INTO AI_SKILL_TEST_CASE (
    skill_id, test_name, complaint_text, complaint_type,
    expected_root_cause, expected_confidence, expected_steps_min
) VALUES (
    'F5E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'DC shipped but store never received',
    'STK shows shipment closed; MBL receiving has no matching ASN line.',
    'DC_STORE_MISMATCH',
    'STK_SHIP_STORE',
    'PROBABLE',
    2
);

COMMIT;
