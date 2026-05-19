-- =============================================================================
-- Diagnostic Skill: ITEM_NOT_RANGED
-- "Why is item X not ranged at store Y?" / "Why is item X not available at this store?"
-- Deploy after: 37_diagnostic_chain_tables.sql, 38_diagnostic_chain_libquery.sql
-- =============================================================================

DELETE FROM AI_DIAGNOSTIC_STEP      WHERE SKILL_ID = 'DA000004-D100-4A00-8100-D10000000004';
DELETE FROM AI_SKILL_VOCABULARY     WHERE skill_id = 'DA000004-D100-4A00-8100-D10000000004';
DELETE FROM AI_SKILL_SQL_TEMPLATE   WHERE skill_id = 'DA000004-D100-4A00-8100-D10000000004';
DELETE FROM AI_SKILL_PLAYBOOK_STEP  WHERE skill_id = 'DA000004-D100-4A00-8100-D10000000004';
DELETE FROM AI_SKILL_KNOWLEDGE_ITEM WHERE skill_id = 'DA000004-D100-4A00-8100-D10000000004';
DELETE FROM AI_SKILL_VERSION        WHERE skill_id = 'DA000004-D100-4A00-8100-D10000000004';
DELETE FROM AI_SKILL_RETAILER       WHERE skill_id = 'DA000004-D100-4A00-8100-D10000000004';
DELETE FROM AI_SKILL                WHERE skill_id = 'DA000004-D100-4A00-8100-D10000000004';

INSERT INTO AI_SKILL (
    skill_id, retailer_id, skill_code, skill_name, domain,
    description, version, status, created_by, created_at, updated_at
) VALUES (
    'DA000004-D100-4A00-8100-D10000000004',
    'TEMPLATE',
    'ITEM_NOT_RANGED',
    'Item not ranged at store — root cause',
    'ASSORTMENT',
    'Diagnoses why an item does not appear in the store assortment. Checks item master existence, ARTSITE ranging, and whether item was previously listed.',
    1.0, 'DRAFT', 'SYSTEM', SYSTIMESTAMP, SYSTIMESTAMP
);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000004-D100-4A00-8100-D10000000004', 'why is item not ranged',       'NOT_RANGED', 'INTENT_PHRASE', 'EN', 1.9);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000004-D100-4A00-8100-D10000000004', 'item not available at store',  'NOT_RANGED', 'INTENT_PHRASE', 'EN', 1.8);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000004-D100-4A00-8100-D10000000004', 'why not stocked at store',     'NOT_RANGED', 'INTENT_PHRASE', 'EN', 1.8);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000004-D100-4A00-8100-D10000000004', 'not in assortment',            'NOT_RANGED', 'SYNONYM',       'EN', 1.5);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000004-D100-4A00-8100-D10000000004', 'delisted',                     'DELISTED',   'PROCESS_TERM',  'EN', 1.4);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000004-D100-4A00-8100-D10000000004', 'ranging',                      'RANGING',    'PROCESS_TERM',  'EN', 1.3);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000004-D100-4A00-8100-D10000000004', 'item',                         'lu_id',      'BIND_HINT',     'EN', 1.0);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000004-D100-4A00-8100-D10000000004', 'at store',                     'site_id',    'BIND_HINT',     'EN', 1.0);

-- Step 1: Item master existence + ARTSITE ranging diagnosis
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'DA000004-D100-4A00-8100-D10000000004',
    'RANG_CHK_ITEM_AND_ARTSITE',
    'Item master existence + ARTSITE ranging check',
    'Returns ITEM_EXISTS (Y/N), ARTSITE_COUNT at store, and RANGING_DIAGNOSIS.',
    q'~SELECT NVL(im.ITEM_EXISTS, 'N')  AS ITEM_EXISTS,
       NVL(im.ITEM_DESC, 'UNKNOWN') AS ITEM_DESC,
       NVL(rs.ARTSITE_COUNT, 0)    AS ARTSITE_COUNT,
       CASE
           WHEN NVL(im.ITEM_EXISTS,'N') = 'N'  THEN 'ITEM_UNKNOWN'
           WHEN NVL(rs.ARTSITE_COUNT,0) = 0    THEN 'NOT_IN_ARTSITE'
           ELSE                                     'IS_RANGED'
       END AS RANGING_DIAGNOSIS
  FROM (
       SELECT 'Y' AS ITEM_EXISTS, ARTDESI AS ITEM_DESC
         FROM ARTRAC@HEINENS_CEN_PROD
        WHERE ARTCEXR = :lu_id AND ROWNUM = 1
  ) im,
  (
       SELECT COUNT(*) AS ARTSITE_COUNT
         FROM ARTSITE@HEINENS_CEN_PROD s
         JOIN ARTRAC@HEINENS_CEN_PROD  a ON a.ARTCINR = s.ARTCINR
        WHERE a.ARTCEXR = :lu_id
          AND s.SITSITE = TO_NUMBER(TRIM(:site_id))
  ) rs~',
    '[{"name":"lu_id","type":"STRING","required":true},{"name":"site_id","type":"STRING","required":true}]',
    'ARTRAC@HEINENS_CEN_PROD, ARTSITE@HEINENS_CEN_PROD'
);

-- Step 2: Network-wide ranging check (how many stores carry this item?)
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'DA000004-D100-4A00-8100-D10000000004',
    'RANG_CHK_NETWORK',
    'Network-wide ranging check',
    'Returns STORES_WITH_ITEM (how many stores range this item) and TOTAL_ARTSITE_ROWS.',
    q'~SELECT COUNT(DISTINCT s.SITSITE) AS STORES_WITH_ITEM,
       COUNT(*)                    AS TOTAL_ARTSITE_ROWS
  FROM ARTSITE@HEINENS_CEN_PROD s
  JOIN ARTRAC@HEINENS_CEN_PROD  a ON a.ARTCINR = s.ARTCINR
 WHERE a.ARTCEXR = :lu_id~',
    '[{"name":"lu_id","type":"STRING","required":true}]',
    'ARTSITE@HEINENS_CEN_PROD, ARTRAC@HEINENS_CEN_PROD'
);

-- Diagnostic steps
INSERT INTO AI_DIAGNOSTIC_STEP (SKILL_ID, STEP_ORDER, TEMPLATE_CODE, STOP_FIELD, STOP_OPERATOR, STOP_VALUE, CONCLUSION_KEY, STEP_LABEL)
VALUES ('DA000004-D100-4A00-8100-D10000000004', 1, 'RANG_CHK_ITEM_AND_ARTSITE', 'RANGING_DIAGNOSIS', '=', 'ITEM_UNKNOWN', 'RANG_ITEM_UNKNOWN', 'Item master existence + ARTSITE check');

INSERT INTO AI_DIAGNOSTIC_STEP (SKILL_ID, STEP_ORDER, TEMPLATE_CODE, STOP_FIELD, STOP_OPERATOR, STOP_VALUE, CONCLUSION_KEY, STEP_LABEL)
VALUES ('DA000004-D100-4A00-8100-D10000000004', 1, 'RANG_CHK_ITEM_AND_ARTSITE', 'RANGING_DIAGNOSIS', '=', 'NOT_IN_ARTSITE', 'RANG_NOT_IN_ARTSITE', 'Item master existence + ARTSITE check');

INSERT INTO AI_DIAGNOSTIC_STEP (SKILL_ID, STEP_ORDER, TEMPLATE_CODE, STOP_FIELD, STOP_OPERATOR, STOP_VALUE, CONCLUSION_KEY, STEP_LABEL)
VALUES ('DA000004-D100-4A00-8100-D10000000004', 2, 'RANG_CHK_NETWORK', 'STORES_WITH_ITEM', '=', '0', 'RANG_NOT_RANGED_ANYWHERE', 'Network-wide ranging check');

-- Conclusions
DELETE FROM AI_DIAGNOSTIC_CONCLUSION WHERE CONCLUSION_KEY IN (
    'RANG_ITEM_UNKNOWN','RANG_NOT_IN_ARTSITE','RANG_NOT_RANGED_ANYWHERE'
) AND RETAILER_ID = 'TEMPLATE';

INSERT INTO AI_DIAGNOSTIC_CONCLUSION (CONCLUSION_KEY, RETAILER_ID, SUMMARY_TEMPLATE, EVIDENCE_TEMPLATE, FOLLOW_UP_TEMPLATE, SEVERITY)
VALUES (
    'RANG_ITEM_UNKNOWN', 'TEMPLATE',
    'Item {lu_id} does not exist in the GOLD item master (ARTRAC). It cannot be ranged at any store because it has no item record. This may be a typo in the item code or a new item that has not been created yet.',
    'ARTRAC check: no row found for item code {lu_id}|Item cannot be ranged without an item master record|Verify the item code or check if the item is pending creation',
    NULL,
    'CRITICAL'
);

INSERT INTO AI_DIAGNOSTIC_CONCLUSION (CONCLUSION_KEY, RETAILER_ID, SUMMARY_TEMPLATE, EVIDENCE_TEMPLATE, FOLLOW_UP_TEMPLATE, SEVERITY)
VALUES (
    'RANG_NOT_IN_ARTSITE', 'TEMPLATE',
    'Item {lu_id} ({ITEM_DESC}) exists in the item master but is not ranged at store {site_id}. There is no ARTSITE row for this item-store combination. The item may never have been ranged here, or it may have been delisted.',
    'ARTRAC: item {lu_id} found — {ITEM_DESC}|ARTSITE check: 0 rows for store {site_id}|Item is known to GOLD but not set up for this location',
    'Want me to check how many stores do range item {lu_id} across the network?',
    'WARNING'
);

INSERT INTO AI_DIAGNOSTIC_CONCLUSION (CONCLUSION_KEY, RETAILER_ID, SUMMARY_TEMPLATE, EVIDENCE_TEMPLATE, FOLLOW_UP_TEMPLATE, SEVERITY)
VALUES (
    'RANG_NOT_RANGED_ANYWHERE', 'TEMPLATE',
    'Item {lu_id} ({ITEM_DESC}) is not ranged at any store in the network. ARTSITE has no rows for this item across all sites. This item may be newly created and pending ranging, or it may have been fully delisted network-wide.',
    'ARTRAC: item {lu_id} found|ARTSITE (all stores): 0 rows — item not ranged anywhere in the network|Item exists in master data but has no ranging assignment anywhere',
    NULL,
    'WARNING'
);

COMMIT;

SELECT d.STEP_ORDER, d.CONCLUSION_KEY FROM AI_DIAGNOSTIC_STEP d
WHERE d.SKILL_ID = 'DA000004-D100-4A00-8100-D10000000004' ORDER BY 1, 2;
