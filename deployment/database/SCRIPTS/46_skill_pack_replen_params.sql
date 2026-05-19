-- =============================================================================
-- Retrieval Skill Pack: REPLEN_PARAMS
-- "Show replenishment params for item X at store Y" / "What is the min/max for item X?"
-- Deploy after: 08_skill_engine.sql
-- =============================================================================

DELETE FROM AI_SKILL_SQL_TEMPLATE   WHERE skill_id = 'RE000004-E100-4A00-8100-E10000000004';
DELETE FROM AI_SKILL_PLAYBOOK_STEP  WHERE skill_id = 'RE000004-E100-4A00-8100-E10000000004';
DELETE FROM AI_SKILL_KNOWLEDGE_ITEM WHERE skill_id = 'RE000004-E100-4A00-8100-E10000000004';
DELETE FROM AI_SKILL_VERSION        WHERE skill_id = 'RE000004-E100-4A00-8100-E10000000004';
DELETE FROM AI_SKILL_VOCABULARY     WHERE skill_id = 'RE000004-E100-4A00-8100-E10000000004';
DELETE FROM AI_SKILL_RETAILER       WHERE skill_id = 'RE000004-E100-4A00-8100-E10000000004';
DELETE FROM AI_SKILL                WHERE skill_id = 'RE000004-E100-4A00-8100-E10000000004';

INSERT INTO AI_SKILL (
    skill_id, retailer_id, skill_code, skill_name, domain,
    description, version, status, created_by, created_at, updated_at
) VALUES (
    'RE000004-E100-4A00-8100-E10000000004',
    'TEMPLATE',
    'REPLEN_PARAMS',
    'Replenishment parameters for item at store',
    'REPLENISHMENT',
    'Retrieves ARTREAP min/max/reorder/safety-stock parameters for an item-store combination.',
    1.0, 'DRAFT', 'SYSTEM', SYSTIMESTAMP, SYSTIMESTAMP
);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000004-E100-4A00-8100-E10000000004', 'show replenishment parameters',   'REPLEN_PARAMS', 'INTENT_PHRASE', 'EN', 1.9);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000004-E100-4A00-8100-E10000000004', 'what is the min max for item',    'REPLEN_PARAMS', 'INTENT_PHRASE', 'EN', 1.9);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000004-E100-4A00-8100-E10000000004', 'replen params for item at store', 'REPLEN_PARAMS', 'INTENT_PHRASE', 'EN', 1.8);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000004-E100-4A00-8100-E10000000004', 'reorder point for item',          'REPLEN_PARAMS', 'INTENT_PHRASE', 'EN', 1.8);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000004-E100-4A00-8100-E10000000004', 'safety stock',                    'SAFETY_STOCK',  'PROCESS_TERM',  'EN', 1.5);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000004-E100-4A00-8100-E10000000004', 'min max',                         'REPLEN_PARAMS', 'ABBREVIATION',  'EN', 1.4);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000004-E100-4A00-8100-E10000000004', 'artreap',                         'REPLEN_PARAMS', 'JARGON',        'EN', 1.6);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000004-E100-4A00-8100-E10000000004', 'item',                            'lu_id',         'BIND_HINT',     'EN', 1.0);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000004-E100-4A00-8100-E10000000004', 'at store',                        'site_id',       'BIND_HINT',     'EN', 1.0);

-- Template 1: Single store replen params
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'RE000004-E100-4A00-8100-E10000000004',
    'REPLEN_PARAMS_STORE',
    'Replenishment params for item at store',
    'Returns ARTREAP row: safety stock, reorder point, max level, lead time.',
    q'~SELECT a.ARTCEXR             AS "Item code",
       a.ARTDESI            AS "Item desc.",
       r.ARSITE             AS "Store",
       r.ARQTSS             AS "Safety stock",
       r.ARQTRE             AS "Reorder point",
       r.ARQTMA             AS "Max level",
       NVL(r.ARDELAI, 0)   AS "Lead time (days)"
  FROM ARTREAP@HEINENS_CEN_PROD r
  JOIN ARTRAC@HEINENS_CEN_PROD  a
    ON (a.ARTCINR = r.ARCINR OR a.ARTCEXR = r.ARCEXR)
 WHERE a.ARTCEXR = :lu_id
   AND r.ARSITE  = TO_NUMBER(TRIM(:site_id))
   AND ROWNUM = 1~',
    '[{"name":"lu_id","type":"STRING","required":true},{"name":"site_id","type":"STRING","required":true}]',
    'ARTREAP@HEINENS_CEN_PROD, ARTRAC@HEINENS_CEN_PROD'
);

-- Template 2: Multi-store replen params overview
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'RE000004-E100-4A00-8100-E10000000004',
    'REPLEN_PARAMS_NETWORK',
    'Replenishment params across all stores (network view)',
    'Returns ARTREAP rows for all stores, showing min/max/reorder for comparison.',
    q'~SELECT a.ARTCEXR             AS "Item code",
       a.ARTDESI            AS "Item desc.",
       r.ARSITE             AS "Store",
       r.ARQTSS             AS "Safety stock",
       r.ARQTRE             AS "Reorder point",
       r.ARQTMA             AS "Max level",
       NVL(r.ARDELAI, 0)   AS "Lead time (days)"
  FROM ARTREAP@HEINENS_CEN_PROD r
  JOIN ARTRAC@HEINENS_CEN_PROD  a
    ON (a.ARTCINR = r.ARCINR OR a.ARTCEXR = r.ARCEXR)
 WHERE a.ARTCEXR = :lu_id
 ORDER BY r.ARSITE
 FETCH FIRST 100 ROWS ONLY~',
    '[{"name":"lu_id","type":"STRING","required":true}]',
    'ARTREAP@HEINENS_CEN_PROD, ARTRAC@HEINENS_CEN_PROD'
);

COMMIT;

SELECT s.SKILL_CODE, t.TEMPLATE_CODE
  FROM AI_SKILL s
  JOIN AI_SKILL_SQL_TEMPLATE t ON t.SKILL_ID = s.SKILL_ID
 WHERE s.SKILL_ID = 'RE000004-E100-4A00-8100-E10000000004'
 ORDER BY t.TEMPLATE_CODE;
