-- =============================================================================
-- Retrieval Skill Pack: PROMOTION_ACTIVE
-- "What promotions are running at store 10?" / "Is item X on promo this week?"
-- Deploy after: 08_skill_engine.sql
-- =============================================================================

DELETE FROM AI_SKILL_SQL_TEMPLATE   WHERE skill_id = 'RE000005-E100-4A00-8100-E10000000005';
DELETE FROM AI_SKILL_PLAYBOOK_STEP  WHERE skill_id = 'RE000005-E100-4A00-8100-E10000000005';
DELETE FROM AI_SKILL_KNOWLEDGE_ITEM WHERE skill_id = 'RE000005-E100-4A00-8100-E10000000005';
DELETE FROM AI_SKILL_VERSION        WHERE skill_id = 'RE000005-E100-4A00-8100-E10000000005';
DELETE FROM AI_SKILL_VOCABULARY     WHERE skill_id = 'RE000005-E100-4A00-8100-E10000000005';
DELETE FROM AI_SKILL_RETAILER       WHERE skill_id = 'RE000005-E100-4A00-8100-E10000000005';
DELETE FROM AI_SKILL                WHERE skill_id = 'RE000005-E100-4A00-8100-E10000000005';

INSERT INTO AI_SKILL (
    skill_id, retailer_id, skill_code, skill_name, domain,
    description, version, status, created_by, created_at, updated_at
) VALUES (
    'RE000005-E100-4A00-8100-E10000000005',
    'TEMPLATE',
    'PROMOTION_ACTIVE',
    'Active promotions at store or for item',
    'PROMOTIONS',
    'Lists currently active promotions from OPRARTSIT. Supports filtering by store or by item.',
    1.0, 'DRAFT', 'SYSTEM', SYSTIMESTAMP, SYSTIMESTAMP
);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000005-E100-4A00-8100-E10000000005', 'what promotions are running',     'PROMO_ACTIVE',  'INTENT_PHRASE', 'EN', 1.9);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000005-E100-4A00-8100-E10000000005', 'active promotions at store',      'PROMO_ACTIVE',  'INTENT_PHRASE', 'EN', 1.9);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000005-E100-4A00-8100-E10000000005', 'is item on promotion',            'PROMO_ITEM',    'INTENT_PHRASE', 'EN', 1.8);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000005-E100-4A00-8100-E10000000005', 'show me current promos',          'PROMO_ACTIVE',  'INTENT_PHRASE', 'EN', 1.8);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000005-E100-4A00-8100-E10000000005', 'promo this week',                 'PROMO_ACTIVE',  'INTENT_PHRASE', 'EN', 1.7);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000005-E100-4A00-8100-E10000000005', 'promotional items',               'PROMO_ACTIVE',  'SYNONYM',       'EN', 1.5);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000005-E100-4A00-8100-E10000000005', 'tpr',                             'PROMO_ACTIVE',  'ABBREVIATION',  'EN', 1.4);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000005-E100-4A00-8100-E10000000005', 'oprartsit',                       'PROMO_ACTIVE',  'JARGON',        'EN', 1.6);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000005-E100-4A00-8100-E10000000005', 'item',                            'lu_id',         'BIND_HINT',     'EN', 1.0);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000005-E100-4A00-8100-E10000000005', 'at store',                        'site_id',       'BIND_HINT',     'EN', 1.0);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000005-E100-4A00-8100-E10000000005', 'as of',                           'as_of_date',    'BIND_HINT',     'EN', 1.0);

-- Template 1: Active promos at a store (today)
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'RE000005-E100-4A00-8100-E10000000005',
    'PROMO_ACTIVE_AT_STORE',
    'Active promotions at a store today',
    'Lists OPRARTSIT promo rows active today at a site. Max 100 rows.',
    q'~SELECT a.ARTCEXR                          AS "Item code",
       a.ARTDESI                         AS "Item desc.",
       p.OPASTE                          AS "Store",
       TO_CHAR(p.OPADTDE,'YYYY-MM-DD')  AS "Promo start",
       TO_CHAR(p.OPADTFI,'YYYY-MM-DD')  AS "Promo end",
       p.OPACOUPRO                       AS "Promo code",
       p.OPAPRIXPRO                      AS "Promo price"
  FROM OPRARTSIT@HEINENS_CEN_PROD  p
  JOIN ARTRAC@HEINENS_CEN_PROD     a ON a.ARTCINR = p.OPACINR
 WHERE p.OPASTE  = TO_NUMBER(TRIM(:site_id))
   AND p.OPADTDE <= TRUNC(NVL(TO_DATE(:as_of_date,'YYYY-MM-DD'), SYSDATE))
   AND p.OPADTFI >= TRUNC(NVL(TO_DATE(:as_of_date,'YYYY-MM-DD'), SYSDATE))
 ORDER BY a.ARTDESI
 FETCH FIRST 100 ROWS ONLY~',
    '[{"name":"site_id","type":"STRING","required":true},{"name":"as_of_date","type":"STRING","required":false}]',
    'OPRARTSIT@HEINENS_CEN_PROD, ARTRAC@HEINENS_CEN_PROD'
);

-- Template 2: Promo check for specific item
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'RE000005-E100-4A00-8100-E10000000005',
    'PROMO_ITEM_CHECK',
    'Is item on promotion at store?',
    'Returns current OPRARTSIT row for item at store, or empty if no active promo.',
    q'~SELECT a.ARTCEXR                          AS "Item code",
       a.ARTDESI                         AS "Item desc.",
       p.OPASTE                          AS "Store",
       TO_CHAR(p.OPADTDE,'YYYY-MM-DD')  AS "Promo start",
       TO_CHAR(p.OPADTFI,'YYYY-MM-DD')  AS "Promo end",
       p.OPACOUPRO                       AS "Promo code",
       p.OPAPRIXPRO                      AS "Promo price"
  FROM OPRARTSIT@HEINENS_CEN_PROD  p
  JOIN ARTRAC@HEINENS_CEN_PROD     a ON a.ARTCINR = p.OPACINR
 WHERE a.ARTCEXR = :lu_id
   AND (:site_id = '-1' OR p.OPASTE = TO_NUMBER(TRIM(:site_id)))
   AND p.OPADTDE <= TRUNC(NVL(TO_DATE(:as_of_date,'YYYY-MM-DD'), SYSDATE))
   AND p.OPADTFI >= TRUNC(NVL(TO_DATE(:as_of_date,'YYYY-MM-DD'), SYSDATE))
 ORDER BY p.OPASTE~',
    '[{"name":"lu_id","type":"STRING","required":true},{"name":"site_id","type":"STRING","required":false},{"name":"as_of_date","type":"STRING","required":false}]',
    'OPRARTSIT@HEINENS_CEN_PROD, ARTRAC@HEINENS_CEN_PROD'
);

COMMIT;

SELECT s.SKILL_CODE, t.TEMPLATE_CODE
  FROM AI_SKILL s
  JOIN AI_SKILL_SQL_TEMPLATE t ON t.SKILL_ID = s.SKILL_ID
 WHERE s.SKILL_ID = 'RE000005-E100-4A00-8100-E10000000005'
 ORDER BY t.TEMPLATE_CODE;
