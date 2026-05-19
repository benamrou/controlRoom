-- =============================================================================
-- Supply Chain AI — GOLD Mobility (MBL): in-store & mobility operations
-- =============================================================================
-- documentation/GOLD/MBL510-* — POS / handheld, sync to CEN.
-- MBL = Mobility schema prefix (e.g. HNUMBL). Prerequisite: 08_skill_engine.sql.
--
-- Run from this directory (SQL*Plus / SQLcl): @15_ai_skill_pack_gold_mobility_store.sql
-- skill_id F4E2D3C4-B5A6-7890-CDEF-1234567890AB | skill_code GOLD_MOBILITY_STORE
-- Article trace at central file: CEN.ARTRAC (ARTCEXR / ARTCINR).
-- =============================================================================

WHENEVER SQLERROR EXIT SQL.SQLCODE

DELETE FROM AI_SKILL_TEST_CASE      WHERE skill_id = 'F4E2D3C4-B5A6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL_VOCABULARY     WHERE skill_id = 'F4E2D3C4-B5A6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL_SQL_TEMPLATE   WHERE skill_id = 'F4E2D3C4-B5A6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL_PLAYBOOK_STEP  WHERE skill_id = 'F4E2D3C4-B5A6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL_KNOWLEDGE_ITEM WHERE skill_id = 'F4E2D3C4-B5A6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL_VERSION        WHERE skill_id = 'F4E2D3C4-B5A6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL_RETAILER       WHERE skill_id = 'F4E2D3C4-B5A6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL                WHERE skill_id = 'F4E2D3C4-B5A6-7890-CDEF-1234567890AB';

INSERT INTO AI_SKILL (
    skill_id, retailer_id, skill_code, skill_name, domain,
    description, version, status, created_by, created_at, updated_at
) VALUES (
    'F4E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'TEMPLATE',
    'GOLD_MOBILITY_STORE',
    'GOLD Mobility — in-store operations (MBL)',
    'SITE',
    'Mobility GOLD (MBL): store-floor execution — POS and handheld workflows, local blocks, receiving at the lane, and data that must sync back to central (CEN) after validation.',
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
    'F4E2D3C4-B5A6-7890-CDEF-1234567890AB', NULL, 'EXTEND', 'MBL_HANDHELD_TRUTH',
    'Handheld vs central truth',
    'What the store device is allowed to assert before central confirms.',
    'When a handheld shows a different on-hand or block than CEN, which system wins during the business day and what audit trail proves the override?',
    q'~[{"round":2,"question":"What is the maximum latency acceptable before a mobility transaction must appear in central stock?"}]~',
    NULL,
    1, 1
);

INSERT INTO AI_SKILL_KNOWLEDGE_ITEM (
    skill_id, base_knowledge_key, override_mode, knowledge_key, label, description,
    anchor_question, rounds_json, validation_sql, priority, is_mandatory
) VALUES (
    'F4E2D3C4-B5A6-7890-CDEF-1234567890AB', NULL, 'EXTEND', 'MBL_POS_BLOCK',
    'POS / mobility block & message',
    'Sell-stop, recall message, or training mode at register.',
    'How does a mobility-layer block at POS translate into GOLD tables, and what user role can lift it without waiting for HQ batch?',
    q'~[{"round":2,"question":"Which error codes map to temporary vs permanent POS blocks?"}]~',
    NULL,
    1, 1
);

INSERT INTO AI_SKILL_KNOWLEDGE_ITEM (
    skill_id, base_knowledge_key, override_mode, knowledge_key, label, description,
    anchor_question, rounds_json, validation_sql, priority, is_mandatory
) VALUES (
    'F4E2D3C4-B5A6-7890-CDEF-1234567890AB', NULL, 'EXTEND', 'MBL_SYNC_CEN',
    'Sync mobility → central',
    'Interfaces or queues from MBL to CEN.',
    'After a successful receiving scan in mobility, what steps must succeed before the same quantity is visible in CEN stock for the store?',
    q'~[{"round":2,"question":"Where do we see a stuck mobility batch ID for support?"}]~',
    NULL,
    2, 1
);

INSERT INTO AI_SKILL_KNOWLEDGE_ITEM (
    skill_id, base_knowledge_key, override_mode, knowledge_key, label, description,
    anchor_question, rounds_json, validation_sql, priority, is_mandatory
) VALUES (
    'F4E2D3C4-B5A6-7890-CDEF-1234567890AB', NULL, 'EXTEND', 'MBL_OFFLINE_MODE',
    'Offline / degraded store',
    'Rules when connectivity to central is lost.',
    'What operations may continue in offline mobility mode and which must hard-stop to protect financial and inventory integrity?',
    q'~[{"round":2,"question":"How are offline baskets reconciled on reconnect?"}]~',
    NULL,
    2, 0
);

INSERT INTO AI_SKILL_PLAYBOOK_STEP (
    skill_id, complaint_type, step_order, step_code, step_label, hypothesis_tested,
    gold_schema, gold_table, key_columns, evidence_fact_type, is_mandatory,
    insert_position, insert_after_step
) VALUES (
    'F4E2D3C4-B5A6-7890-CDEF-1234567890AB', 'POS_BLOCK_MYSTERY', 5, 'MBL_PB_ARTRAC',
    'Article trace (ARTRAC) before ranging',
    'Central article inactive or wrong internal ref at lane',
    'CEN', 'ARTRAC', 'ARTCEXR, ARTCINR', 'ARTICLE_MASTER', 1, 'APPEND', NULL
);

INSERT INTO AI_SKILL_PLAYBOOK_STEP (
    skill_id, complaint_type, step_order, step_code, step_label, hypothesis_tested,
    gold_schema, gold_table, key_columns, evidence_fact_type, is_mandatory,
    insert_position, insert_after_step
) VALUES (
    'F4E2D3C4-B5A6-7890-CDEF-1234567890AB', 'POS_BLOCK_MYSTERY', 10, 'MBL_PB_ARTSITE_LOCAL',
    'Store item-site row (mobility view)',
    'Local ranging or block not yet in central',
    'CEN', 'ARTSITE', 'CODART, CODESIT, TYPSIT', 'SITE_ITEM_FACT', 1, 'APPEND', NULL
);

INSERT INTO AI_SKILL_PLAYBOOK_STEP (
    skill_id, complaint_type, step_order, step_code, step_label, hypothesis_tested,
    gold_schema, gold_table, key_columns, evidence_fact_type, is_mandatory,
    insert_position, insert_after_step
) VALUES (
    'F4E2D3C4-B5A6-7890-CDEF-1234567890AB', 'POS_BLOCK_MYSTERY', 20, 'MBL_PB_ARTUL_SCAN',
    'Scan resolution at lane',
    'Wrong EAN / pack linked at store',
    'CEN', 'ARTUL', 'CODART, CODEAN', 'IDENTIFIER_MAP', 1, 'APPEND', NULL
);

INSERT INTO AI_SKILL_PLAYBOOK_STEP (
    skill_id, complaint_type, step_order, step_code, step_label, hypothesis_tested,
    gold_schema, gold_table, key_columns, evidence_fact_type, is_mandatory,
    insert_position, insert_after_step
) VALUES (
    'F4E2D3C4-B5A6-7890-CDEF-1234567890AB', 'HANDHELD_SYNC_LAG', 10, 'MBL_PB_STOMVT_RECENT',
    'Recent movements at store',
    'Mobility posting delay vs central STO',
    'CEN', 'STOMVT', 'CODART, CODESIT, TYPMVT, DATMVT', 'MOVEMENT_FACT', 1, 'APPEND', NULL
);

INSERT INTO AI_SKILL_PLAYBOOK_STEP (
    skill_id, complaint_type, step_order, step_code, step_label, hypothesis_tested,
    gold_schema, gold_table, key_columns, evidence_fact_type, is_mandatory,
    insert_position, insert_after_step
) VALUES (
    'F4E2D3C4-B5A6-7890-CDEF-1234567890AB', 'HANDHELD_SYNC_LAG', 20, 'MBL_PB_STOCK_LAYER',
    'Sellable layer at store',
    'OH split between sellable and non-sellable at lane',
    'CEN', 'STOCOUCH', 'CODART, CODESIT, TYPCOUCH, QTESAI', 'STOCK_LAYER', 1, 'APPEND', NULL
);

INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'F4E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'MBL_ARTRAC_ROW',
    'Article trace (CEN.ARTRAC) for mobility',
    'Same as CEN.ARTRAC; use central schema from CORPENV; :lu_id = ARTCEXR.',
    q'~SELECT t.ARTCEXR, t.ARTCINR
  FROM CEN.ARTRAC t
 WHERE t.ARTCEXR = :lu_id~',
    q'~[{"name":"lu_id","type":"STRING"}]~',
    'CEN.ARTRAC'
);

INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'F4E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'MBL_ARTSITE_STORE',
    'Item-site (MBL prefix)',
    'Use MBL. when retailer splits mobility schema; else same as CEN with comment.',
    q'~SELECT s.CODART, s.CODESIT, s.TYPSIT
  FROM CEN.ARTSITE s
 WHERE s.CODART = :lu_id
   AND s.CODESIT = :site_id~',
    q'~[{"name":"lu_id","type":"STRING"},{"name":"site_id","type":"STRING"}]~',
    'MBL/CEN.ARTSITE'
);

INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'F4E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'MBL_BARCODE_LANE',
    'EAN → LU at store',
    'ARTUL lookup for lane scan issues.',
    q'~SELECT u.CODART, u.CODEAN
  FROM CEN.ARTUL u
 WHERE u.CODEAN = :ean
   AND ROWNUM <= 25~',
    q'~[{"name":"ean","type":"STRING"}]~',
    'CEN.ARTUL'
);

INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'F4E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'MBL_STORE_MOVEMENTS',
    'Store movements window',
    'STOMVT for mobility sync investigations.',
    q'~SELECT m.TYPMVT, m.DATMVT, m.QTESAI
  FROM CEN.STOMVT m
 WHERE m.CODART = :lu_id
   AND m.CODESIT = :site_id
   AND m.DATMVT >= SYSDATE - :lookback_days
   AND ROWNUM <= 300~',
    q'~[{"name":"lu_id","type":"STRING"},{"name":"site_id","type":"STRING"},{"name":"lookback_days","type":"NUMBER"}]~',
    'CEN.STOMVT'
);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F4E2D3C4-B5A6-7890-CDEF-1234567890AB', 'MBL', 'MBL_SCHEMA', 'ABBREVIATION', 'EN', 1.2);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F4E2D3C4-B5A6-7890-CDEF-1234567890AB', 'mobility', 'MBL_MOBILITY', 'SYNONYM', 'EN', 1.1);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F4E2D3C4-B5A6-7890-CDEF-1234567890AB', 'handheld', 'MBL_HANDHELD_TRUTH', 'SYNONYM', 'EN', 1.1);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F4E2D3C4-B5A6-7890-CDEF-1234567890AB', 'terminal point de vente', 'MBL_POS_BLOCK', 'SYNONYM', 'FR', 1.0);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F4E2D3C4-B5A6-7890-CDEF-1234567890AB', 'caisse', 'MBL_POS_BLOCK', 'SYNONYM', 'FR', 1.0);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F4E2D3C4-B5A6-7890-CDEF-1234567890AB', 'offline store', 'MBL_OFFLINE_MODE', 'SYNONYM', 'EN', 1.05);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F4E2D3C4-B5A6-7890-CDEF-1234567890AB', 'MBL510', 'MBL_DOCS', 'JARGON', 'EN', 1.0);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F4E2D3C4-B5A6-7890-CDEF-1234567890AB', 'lane receiving', 'MBL_HANDHELD_TRUTH', 'PROCESS_TERM', 'EN', 1.0);

INSERT INTO AI_SKILL_TEST_CASE (
    skill_id, test_name, complaint_text, complaint_type,
    expected_root_cause, expected_confidence, expected_steps_min
) VALUES (
    'F4E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'POS block but central shows active',
    'Cashier cannot sell; CEN ARTSITE shows item active for store.',
    'POS_BLOCK_MYSTERY',
    'MBL_PB_ARTSITE_LOCAL',
    'PROBABLE',
    2
);

INSERT INTO AI_SKILL_TEST_CASE (
    skill_id, test_name, complaint_text, complaint_type,
    expected_root_cause, expected_confidence, expected_steps_min
) VALUES (
    'F4E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'Handheld receipt not in central OH',
    'Receiving done on Zebra 2h ago; store manager still sees old OH in HQ dashboard.',
    'HANDHELD_SYNC_LAG',
    'MBL_SYNC_CEN',
    'PROBABLE',
    2
);

COMMIT;
