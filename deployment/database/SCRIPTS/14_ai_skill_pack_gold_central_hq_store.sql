-- =============================================================================
-- Supply Chain AI — GOLD Central (CEN): headquarter + chain store operations
-- =============================================================================
-- documentation/GOLD/CEN510-* — central retail master, interfaces, HQ promo.
-- CEN = Central schema prefix (e.g. HNUCEN from CORPENV.ENVGOLDSCHEMA).
-- Prerequisite: 08_skill_engine.sql.
--
-- Run from this directory (SQL*Plus / SQLcl): @14_ai_skill_pack_gold_central_hq_store.sql
-- skill_id F3E2D3C4-B5A6-7890-CDEF-1234567890AB | skill_code GOLD_CENTRAL_HQ_STORE
-- Article master trace: CEN.ARTRAC (ARTCEXR / ARTCINR), not ARTDEF.
-- =============================================================================

WHENEVER SQLERROR EXIT SQL.SQLCODE

-- reset bundle for GOLD_CENTRAL_HQ_STORE (run before inserts)
DELETE FROM AI_SKILL_TEST_CASE      WHERE skill_id = 'F3E2D3C4-B5A6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL_VOCABULARY     WHERE skill_id = 'F3E2D3C4-B5A6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL_SQL_TEMPLATE   WHERE skill_id = 'F3E2D3C4-B5A6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL_PLAYBOOK_STEP  WHERE skill_id = 'F3E2D3C4-B5A6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL_KNOWLEDGE_ITEM WHERE skill_id = 'F3E2D3C4-B5A6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL_VERSION        WHERE skill_id = 'F3E2D3C4-B5A6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL_RETAILER       WHERE skill_id = 'F3E2D3C4-B5A6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL                WHERE skill_id = 'F3E2D3C4-B5A6-7890-CDEF-1234567890AB';

INSERT INTO AI_SKILL (
    skill_id, retailer_id, skill_code, skill_name, domain,
    description, version, status, created_by, created_at, updated_at
) VALUES (
    'F3E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'TEMPLATE',
    'GOLD_CENTRAL_HQ_STORE',
    'GOLD Central — HQ & chain store operations (CEN)',
    'SITE',
    'Central GOLD (CEN): headquarter retail master — articles, sites, chain assortment, central prices & promotions, supplier parameters, and interfaces that define what every store is expected to sell and at which conditions.',
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
    'F3E2D3C4-B5A6-7890-CDEF-1234567890AB', NULL, 'EXTEND', 'CEN_CHAIN_ARTICLE_TRUTH',
    'National / chain article truth',
    'ARTRAC-level article trace and attributes that apply before store overrides.',
    'Which article attributes are owned exclusively by the central (CEN) file and must never be inferred from a single store row alone?',
    q'~[{"round":2,"question":"How does your banner flag a national stop-sell vs a local delist?"}]~',
    NULL,
    1, 1
);

INSERT INTO AI_SKILL_KNOWLEDGE_ITEM (
    skill_id, base_knowledge_key, override_mode, knowledge_key, label, description,
    anchor_question, rounds_json, validation_sql, priority, is_mandatory
) VALUES (
    'F3E2D3C4-B5A6-7890-CDEF-1234567890AB', NULL, 'EXTEND', 'CEN_SITE_MASTER',
    'Site master & chain store list',
    'Which sites exist, their type, and chain-level receiving rules.',
    'How is a “store” defined in CEN versus a DC or office site, and which columns prove a site participates in chain retail assortment?',
    q'~[{"round":2,"question":"Where is the link between legal entity, banner, and site in GOLD?"}]~',
    NULL,
    1, 1
);

INSERT INTO AI_SKILL_KNOWLEDGE_ITEM (
    skill_id, base_knowledge_key, override_mode, knowledge_key, label, description,
    anchor_question, rounds_json, validation_sql, priority, is_mandatory
) VALUES (
    'F3E2D3C4-B5A6-7890-CDEF-1234567890AB', NULL, 'EXTEND', 'CEN_PRICE_PROMO_HEAD',
    'Central price & promotion head',
    'Chain-wide promo windows and reference prices before store execution.',
    'When HQ runs a national promotion, what is the order of precedence between list price, promo price, and store-local exceptions in CEN?',
    q'~[{"round":2,"question":"Which table holds site-level promo exceptions fed from central?"}]~',
    NULL,
    2, 1
);

INSERT INTO AI_SKILL_KNOWLEDGE_ITEM (
    skill_id, base_knowledge_key, override_mode, knowledge_key, label, description,
    anchor_question, rounds_json, validation_sql, priority, is_mandatory
) VALUES (
    'F3E2D3C4-B5A6-7890-CDEF-1234567890AB', NULL, 'EXTEND', 'CEN_INTERFACE_OUTBOUND',
    'Interfaces from central',
    'Batch / real-time exports that push central truth to MBL/STK.',
    'Which outbound interfaces in the CEN510 documentation must complete before a new article is visible for ordering at the DC?',
    q'~[{"round":2,"question":"What is the retry / alert path when an interface fails overnight?"}]~',
    NULL,
    2, 0
);

INSERT INTO AI_SKILL_PLAYBOOK_STEP (
    skill_id, complaint_type, step_order, step_code, step_label, hypothesis_tested,
    gold_schema, gold_table, key_columns, evidence_fact_type, is_mandatory,
    insert_position, insert_after_step
) VALUES (
    'F3E2D3C4-B5A6-7890-CDEF-1234567890AB', 'CHAIN_PRICE_WRONG', 10, 'CEN_PB_ARTRAC',
    'Central article trace (ARTRAC)',
    'Article inactive or wrong LU at chain level',
    'CEN', 'ARTRAC', 'ARTCEXR, ARTCINR', 'ARTICLE_MASTER', 1, 'APPEND', NULL
);

INSERT INTO AI_SKILL_PLAYBOOK_STEP (
    skill_id, complaint_type, step_order, step_code, step_label, hypothesis_tested,
    gold_schema, gold_table, key_columns, evidence_fact_type, is_mandatory,
    insert_position, insert_after_step
) VALUES (
    'F3E2D3C4-B5A6-7890-CDEF-1234567890AB', 'CHAIN_PRICE_WRONG', 20, 'CEN_PB_ARTSITE',
    'Chain item-site ranging',
    'Site excluded or wrong effective dates centrally',
    'CEN', 'ARTSITE', 'CODART, CODESIT, DATDEB, DATFIN, TYPSIT', 'SITE_ITEM_FACT', 1, 'APPEND', NULL
);

INSERT INTO AI_SKILL_PLAYBOOK_STEP (
    skill_id, complaint_type, step_order, step_code, step_label, hypothesis_tested,
    gold_schema, gold_table, key_columns, evidence_fact_type, is_mandatory,
    insert_position, insert_after_step
) VALUES (
    'F3E2D3C4-B5A6-7890-CDEF-1234567890AB', 'CHAIN_PRICE_WRONG', 30, 'CEN_PB_OPRARTSIT',
    'Central promo at site',
    'Promo row missing or wrong window in central promo table',
    'CEN', 'OPRARTSIT', 'CODART, CODESIT, DATDEB, DATFIN', 'PROMO_SITE_FACT', 1, 'APPEND', NULL
);

INSERT INTO AI_SKILL_PLAYBOOK_STEP (
    skill_id, complaint_type, step_order, step_code, step_label, hypothesis_tested,
    gold_schema, gold_table, key_columns, evidence_fact_type, is_mandatory,
    insert_position, insert_after_step
) VALUES (
    'F3E2D3C4-B5A6-7890-CDEF-1234567890AB', 'NEW_STORE_NOT_ASSORTED', 10, 'CEN_PB_SITE_OPEN',
    'Site open in chain master',
    'New store not yet in central site table or wrong TYPSIT',
    'CEN', 'ARTSITE', 'CODESIT, TYPSIT', 'SITE_MASTER', 1, 'APPEND', NULL
);

INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'F3E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'CEN_ARTRAC_ROW',
    'Central article trace (CEN.ARTRAC)',
    'Replace CEN with retailer central schema from CORPENV; :lu_id = ARTCEXR.',
    q'~SELECT t.ARTCEXR, t.ARTCINR
  FROM CEN.ARTRAC t
 WHERE t.ARTCEXR = :lu_id~',
    q'~[{"name":"lu_id","type":"STRING"}]~',
    'CEN.ARTRAC'
);

INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'F3E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'CEN_ARTSITE_CHAIN',
    'Item-site in central file',
    'Chain ranging / eligibility at site.',
    q'~SELECT s.CODART, s.CODESIT, s.TYPSIT, s.DATDEB, s.DATFIN
  FROM CEN.ARTSITE s
 WHERE s.CODART = :lu_id
   AND s.CODESIT = :site_id~',
    q'~[{"name":"lu_id","type":"STRING"},{"name":"site_id","type":"STRING"}]~',
    'CEN.ARTSITE'
);

INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'F3E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'CEN_PROMO_SITE',
    'Central promo at site',
    'OPRARTSIT-style site promo row.',
    q'~SELECT p.CODART, p.CODESIT, p.DATDEB, p.DATFIN
  FROM CEN.OPRARTSIT p
 WHERE p.CODART = :lu_id
   AND p.CODESIT = :site_id
   AND ROWNUM <= 50~',
    q'~[{"name":"lu_id","type":"STRING"},{"name":"site_id","type":"STRING"}]~',
    'CEN.OPRARTSIT'
);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F3E2D3C4-B5A6-7890-CDEF-1234567890AB', 'CEN', 'CEN_SCHEMA', 'ABBREVIATION', 'EN', 1.2);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F3E2D3C4-B5A6-7890-CDEF-1234567890AB', 'central', 'CEN_CHAIN', 'SYNONYM', 'EN', 1.1);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F3E2D3C4-B5A6-7890-CDEF-1234567890AB', 'headquarters', 'CEN_HQ', 'SYNONYM', 'EN', 1.05);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F3E2D3C4-B5A6-7890-CDEF-1234567890AB', 'siège', 'CEN_HQ', 'SYNONYM', 'FR', 1.05);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F3E2D3C4-B5A6-7890-CDEF-1234567890AB', 'chain price', 'CEN_PRICE_PROMO_HEAD', 'PROCESS_TERM', 'EN', 1.05);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F3E2D3C4-B5A6-7890-CDEF-1234567890AB', 'national promo', 'CEN_PRICE_PROMO_HEAD', 'SYNONYM', 'EN', 1.1);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F3E2D3C4-B5A6-7890-CDEF-1234567890AB', 'assortment', 'CEN_SITE_MASTER', 'SYNONYM', 'EN', 1.0);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F3E2D3C4-B5A6-7890-CDEF-1234567890AB', 'CEN510', 'CEN_DOCS', 'JARGON', 'EN', 1.0);

INSERT INTO AI_SKILL_TEST_CASE (
    skill_id, test_name, complaint_text, complaint_type,
    expected_root_cause, expected_confidence, expected_steps_min
) VALUES (
    'F3E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'National promo missing at one store',
    'Stores 01–09 show promo; store 10 does not. HQ insists promo is national.',
    'CHAIN_PRICE_WRONG',
    'CEN_PB_OPRARTSIT',
    'PROBABLE',
    2
);

INSERT INTO AI_SKILL_TEST_CASE (
    skill_id, test_name, complaint_text, complaint_type,
    expected_root_cause, expected_confidence, expected_steps_min
) VALUES (
    'F3E2D3C4-B5A6-7890-CDEF-1234567890AB',
    'New store not in assortment',
    'Grand opening Monday; no ARTSITE rows for new banner store code.',
    'NEW_STORE_NOT_ASSORTED',
    'CEN_PB_SITE_OPEN',
    'CONFIRMED',
    1
);

COMMIT;
