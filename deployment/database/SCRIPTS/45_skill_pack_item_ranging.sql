-- =============================================================================
-- Retrieval Skill Pack: ITEM_RANGING_STATUS
-- "Is item 100100 ranged at store 10?" / "Which stores carry item X?"
-- Deploy after: 08_skill_engine.sql
-- =============================================================================

DELETE FROM AI_SKILL_SQL_TEMPLATE   WHERE skill_id = 'RE000003-E100-4A00-8100-E10000000003';
DELETE FROM AI_SKILL_PLAYBOOK_STEP  WHERE skill_id = 'RE000003-E100-4A00-8100-E10000000003';
DELETE FROM AI_SKILL_KNOWLEDGE_ITEM WHERE skill_id = 'RE000003-E100-4A00-8100-E10000000003';
DELETE FROM AI_SKILL_VERSION        WHERE skill_id = 'RE000003-E100-4A00-8100-E10000000003';
DELETE FROM AI_SKILL_VOCABULARY     WHERE skill_id = 'RE000003-E100-4A00-8100-E10000000003';
DELETE FROM AI_SKILL_RETAILER       WHERE skill_id = 'RE000003-E100-4A00-8100-E10000000003';
DELETE FROM AI_SKILL                WHERE skill_id = 'RE000003-E100-4A00-8100-E10000000003';

INSERT INTO AI_SKILL (
    skill_id, retailer_id, skill_code, skill_name, domain,
    description, version, status, created_by, created_at, updated_at
) VALUES (
    'RE000003-E100-4A00-8100-E10000000003',
    'TEMPLATE',
    'ITEM_RANGING_STATUS',
    'Item ranging status across stores',
    'ASSORTMENT',
    'Shows whether an item is ranged at a specific store, or lists all stores that range the item.',
    1.0, 'DRAFT', 'SYSTEM', SYSTIMESTAMP, SYSTIMESTAMP
);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000003-E100-4A00-8100-E10000000003', 'is item ranged at store',         'RANGING',       'INTENT_PHRASE', 'EN', 1.9);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000003-E100-4A00-8100-E10000000003', 'which stores carry item',         'RANGING',       'INTENT_PHRASE', 'EN', 1.9);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000003-E100-4A00-8100-E10000000003', 'item ranging status',             'RANGING',       'INTENT_PHRASE', 'EN', 1.8);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000003-E100-4A00-8100-E10000000003', 'is article available at store',   'RANGING',       'INTENT_PHRASE', 'EN', 1.8);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000003-E100-4A00-8100-E10000000003', 'ranged stores',                   'RANGING',       'SYNONYM',       'EN', 1.5);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000003-E100-4A00-8100-E10000000003', 'artsite',                         'RANGING',       'JARGON',        'EN', 1.6);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000003-E100-4A00-8100-E10000000003', 'item',                            'lu_id',         'BIND_HINT',     'EN', 1.0);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000003-E100-4A00-8100-E10000000003', 'at store',                        'site_id',       'BIND_HINT',     'EN', 1.0);

-- Template 1: Single store ranging check
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'RE000003-E100-4A00-8100-E10000000003',
    'RANG_STORE_CHECK',
    'Item ranging check at specific store',
    'Returns Y/N whether item is ranged at store, plus item description.',
    q'~SELECT a.ARTCEXR                             AS "Item code",
       a.ARTDESI                            AS "Item desc.",
       CASE WHEN COUNT(s.SITSITE) > 0 THEN 'Y' ELSE 'N' END AS "Ranged at store",
       TO_NUMBER(TRIM(:site_id))           AS "Store"
  FROM ARTRAC@HEINENS_CEN_PROD  a
  LEFT JOIN ARTSITE@HEINENS_CEN_PROD s
    ON s.ARTCINR = a.ARTCINR
   AND s.SITSITE = TO_NUMBER(TRIM(:site_id))
 WHERE a.ARTCEXR = :lu_id
 GROUP BY a.ARTCEXR, a.ARTDESI~',
    '[{"name":"lu_id","type":"STRING","required":true},{"name":"site_id","type":"STRING","required":true}]',
    'ARTRAC@HEINENS_CEN_PROD, ARTSITE@HEINENS_CEN_PROD'
);

-- Template 2: Network-wide ranging list
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'RE000003-E100-4A00-8100-E10000000003',
    'RANG_NETWORK_LIST',
    'All stores ranging the item (network-wide)',
    'Lists every store where the item has an ARTSITE row, with store number.',
    q'~SELECT a.ARTCEXR            AS "Item code",
       a.ARTDESI           AS "Item desc.",
       s.SITSITE           AS "Store",
       COUNT(*) OVER ()    AS "Total stores"
  FROM ARTSITE@HEINENS_CEN_PROD s
  JOIN ARTRAC@HEINENS_CEN_PROD  a ON a.ARTCINR = s.ARTCINR
 WHERE a.ARTCEXR = :lu_id
 ORDER BY s.SITSITE
 FETCH FIRST 100 ROWS ONLY~',
    '[{"name":"lu_id","type":"STRING","required":true}]',
    'ARTSITE@HEINENS_CEN_PROD, ARTRAC@HEINENS_CEN_PROD'
);

COMMIT;

SELECT s.SKILL_CODE, t.TEMPLATE_CODE
  FROM AI_SKILL s
  JOIN AI_SKILL_SQL_TEMPLATE t ON t.SKILL_ID = s.SKILL_ID
 WHERE s.SKILL_ID = 'RE000003-E100-4A00-8100-E10000000003'
 ORDER BY t.TEMPLATE_CODE;
