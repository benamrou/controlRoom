-- =============================================================================
-- Diagnostic Skill: REPLEN_NOT_TRIGGERED
-- "Why is item X not being replenished / why was no order placed?"
-- Deploy after: 37_diagnostic_chain_tables.sql, 38_diagnostic_chain_libquery.sql
-- =============================================================================

DELETE FROM AI_DIAGNOSTIC_STEP      WHERE SKILL_ID = 'DA000002-D100-4A00-8100-D10000000002';
DELETE FROM AI_SKILL_VOCABULARY     WHERE skill_id = 'DA000002-D100-4A00-8100-D10000000002';
DELETE FROM AI_SKILL_SQL_TEMPLATE   WHERE skill_id = 'DA000002-D100-4A00-8100-D10000000002';
DELETE FROM AI_SKILL_PLAYBOOK_STEP  WHERE skill_id = 'DA000002-D100-4A00-8100-D10000000002';
DELETE FROM AI_SKILL_KNOWLEDGE_ITEM WHERE skill_id = 'DA000002-D100-4A00-8100-D10000000002';
DELETE FROM AI_SKILL_VERSION        WHERE skill_id = 'DA000002-D100-4A00-8100-D10000000002';
DELETE FROM AI_SKILL_RETAILER       WHERE skill_id = 'DA000002-D100-4A00-8100-D10000000002';
DELETE FROM AI_SKILL                WHERE skill_id = 'DA000002-D100-4A00-8100-D10000000002';

INSERT INTO AI_SKILL (
    skill_id, retailer_id, skill_code, skill_name, domain,
    description, version, status, created_by, created_at, updated_at
) VALUES (
    'DA000002-D100-4A00-8100-D10000000002',
    'TEMPLATE',
    'REPLEN_NOT_TRIGGERED',
    'Replenishment not triggered - root cause',
    'REPLENISHMENT',
    'Diagnoses why no purchase order was generated for an item at a store despite low stock.',
    1.0, 'DRAFT', 'SYSTEM', SYSTIMESTAMP, SYSTIMESTAMP
);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000002-D100-4A00-8100-D10000000002', 'why no order placed',          'REPLEN_MISSING', 'INTENT_PHRASE', 'EN', 1.9);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000002-D100-4A00-8100-D10000000002', 'replenishment not triggered',  'REPLEN_MISSING', 'INTENT_PHRASE', 'EN', 1.9);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000002-D100-4A00-8100-D10000000002', 'why wasnt an order placed',    'REPLEN_MISSING', 'INTENT_PHRASE', 'EN', 1.8);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000002-D100-4A00-8100-D10000000002', 'no purchase order',            'REPLEN_MISSING', 'SYNONYM',       'EN', 1.5);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000002-D100-4A00-8100-D10000000002', 'replenishment issue',          'REPLEN_ISSUE',   'PROCESS_TERM',  'EN', 1.4);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000002-D100-4A00-8100-D10000000002', 'not reordering',               'REPLEN_MISSING', 'JARGON',        'EN', 1.5);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000002-D100-4A00-8100-D10000000002', 'item',                         'lu_id',          'BIND_HINT',     'EN', 1.0);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000002-D100-4A00-8100-D10000000002', 'for store',                    'site_id',        'BIND_HINT',     'EN', 1.0);

-- Step 1: Check replenishment params exist
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'DA000002-D100-4A00-8100-D10000000002',
    'REPLEN_CHK_PARAMS',
    'Replenishment params + safety stock check',
    'Returns REPLEN_PARAMS (row exists Y/N), current STOCK, SAFETY_STOCK, REORDER_PT, and REPLEN_DIAGNOSIS.',
    q'~SELECT NVL(r.REPLEN_PARAMS, 'N')           AS REPLEN_PARAMS,
       NVL(r.SAFETY_STOCK, 0)              AS SAFETY_STOCK,
       NVL(r.REORDER_PT, 0)               AS REORDER_PT,
       NVL(r.MAX_LEVEL, 0)                AS MAX_LEVEL,
       NVL(s.CURRENT_STOCK, 0)            AS CURRENT_STOCK,
       CASE
           WHEN r.REPLEN_PARAMS IS NULL                         THEN 'NO_PARAMS'
           WHEN NVL(s.CURRENT_STOCK, 0) > NVL(r.REORDER_PT, 0) THEN 'ABOVE_REORDER'
           ELSE                                                       'BELOW_REORDER'
       END AS REPLEN_DIAGNOSIS
  FROM (
       SELECT 'Y' AS REPLEN_PARAMS, ARQTSS AS SAFETY_STOCK,
              ARQTRE AS REORDER_PT, ARQTMA AS MAX_LEVEL
         FROM ARTREAP@HEINENS_CEN_PROD
        WHERE ARSITE = TO_NUMBER(TRIM(:site_id))
          AND (ARCEXR = :lu_id
               OR ARCINR = (SELECT ARTCINR FROM ARTRAC@HEINENS_CEN_PROD WHERE ARTCEXR = :lu_id AND ROWNUM = 1))
          AND ROWNUM = 1
  ) r,
  (
       SELECT NVL(SUM(STCQTEP), 0) AS CURRENT_STOCK
         FROM STOCOUCH@HEINENS_CEN_PROD
        WHERE STCSITE = TO_NUMBER(TRIM(:site_id))
          AND (STCCEXR = :lu_id
               OR STCCINR = (SELECT ARTCINR FROM ARTRAC@HEINENS_CEN_PROD WHERE ARTCEXR = :lu_id AND ROWNUM = 1))
  ) s~',
    '[{"name":"lu_id","type":"STRING","required":true},{"name":"site_id","type":"STRING","required":true}]',
    'ARTREAP@HEINENS_CEN_PROD, STOCOUCH@HEINENS_CEN_PROD, ARTRAC@HEINENS_CEN_PROD'
);

-- Step 2: Check for existing open PO
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'DA000002-D100-4A00-8100-D10000000002',
    'REPLEN_CHK_OPEN_PO',
    'Open PO coverage check',
    'Returns PO_COUNT open orders for this item at this site (confirms whether a PO was already placed).',
    q'~SELECT COUNT(DISTINCT e.ECDCINCDE) AS PO_COUNT,
       MIN(e.ECDDATE)              AS EARLIEST_PO_DATE
  FROM CDEENTCDE@HEINENS_CEN_PROD e
  JOIN CDEDETCDE@HEINENS_CEN_PROD d ON d.DCDCINCDE = e.ECDCINCDE
  JOIN ARTRAC@HEINENS_CEN_PROD    a ON a.ARTCINR   = d.DCDCINR
 WHERE a.ARTCEXR  = :lu_id
   AND d.DCDSITE  = TO_NUMBER(TRIM(:site_id))
   AND e.STATUT  IN ('3', '5')
   AND e.ECDDATE >= TRUNC(SYSDATE) - 7~',
    '[{"name":"lu_id","type":"STRING","required":true},{"name":"site_id","type":"STRING","required":true}]',
    'CDEENTCDE@HEINENS_CEN_PROD, CDEDETCDE@HEINENS_CEN_PROD, ARTRAC@HEINENS_CEN_PROD'
);

-- Diagnostic steps
INSERT INTO AI_DIAGNOSTIC_STEP (SKILL_ID, STEP_ORDER, TEMPLATE_CODE, STOP_FIELD, STOP_OPERATOR, STOP_VALUE, CONCLUSION_KEY, STEP_LABEL)
VALUES ('DA000002-D100-4A00-8100-D10000000002', 1, 'REPLEN_CHK_PARAMS', 'REPLEN_DIAGNOSIS', '=', 'NO_PARAMS', 'REPLEN_NO_PARAMS', 'Replenishment params + stock level check');

INSERT INTO AI_DIAGNOSTIC_STEP (SKILL_ID, STEP_ORDER, TEMPLATE_CODE, STOP_FIELD, STOP_OPERATOR, STOP_VALUE, CONCLUSION_KEY, STEP_LABEL)
VALUES ('DA000002-D100-4A00-8100-D10000000002', 1, 'REPLEN_CHK_PARAMS', 'REPLEN_DIAGNOSIS', '=', 'ABOVE_REORDER', 'REPLEN_ABOVE_THRESHOLD', 'Replenishment params + stock level check');

INSERT INTO AI_DIAGNOSTIC_STEP (SKILL_ID, STEP_ORDER, TEMPLATE_CODE, STOP_FIELD, STOP_OPERATOR, STOP_VALUE, CONCLUSION_KEY, STEP_LABEL)
VALUES ('DA000002-D100-4A00-8100-D10000000002', 2, 'REPLEN_CHK_OPEN_PO', 'PO_COUNT', '>', '0', 'REPLEN_PO_ALREADY_PLACED', 'Open PO coverage check');

-- Conclusions
DELETE FROM AI_DIAGNOSTIC_CONCLUSION WHERE CONCLUSION_KEY IN (
    'REPLEN_NO_PARAMS','REPLEN_ABOVE_THRESHOLD','REPLEN_PO_ALREADY_PLACED'
) AND RETAILER_ID = 'TEMPLATE';

INSERT INTO AI_DIAGNOSTIC_CONCLUSION (CONCLUSION_KEY, RETAILER_ID, SUMMARY_TEMPLATE, EVIDENCE_TEMPLATE, FOLLOW_UP_TEMPLATE, SEVERITY)
VALUES (
    'REPLEN_NO_PARAMS', 'TEMPLATE',
    'No replenishment parameters are configured for item {lu_id} at store {site_id}. ARTREAP has no row for this combination, so the GOLD replenishment engine has no trigger point and will never generate a purchase order automatically.',
    'ARTREAP check: no row found for item {lu_id} at store {site_id}|Without min/max/reorder parameters the replenishment engine is blind to this item|Current stock: {CURRENT_STOCK} units (unreliable without a configured floor)',
    'Would you like me to check if this item has replenishment parameters at other stores for comparison?',
    'CRITICAL'
);

INSERT INTO AI_DIAGNOSTIC_CONCLUSION (CONCLUSION_KEY, RETAILER_ID, SUMMARY_TEMPLATE, EVIDENCE_TEMPLATE, FOLLOW_UP_TEMPLATE, SEVERITY)
VALUES (
    'REPLEN_ABOVE_THRESHOLD', 'TEMPLATE',
    'Item {lu_id} has not triggered replenishment at store {site_id} because stock is currently above the reorder point. Current stock is {CURRENT_STOCK} units; reorder triggers at {REORDER_PT} units. No order is needed at this time.',
    'Current stock: {CURRENT_STOCK} units|Reorder point: {REORDER_PT} units|Safety stock: {SAFETY_STOCK} units|Replenishment will trigger automatically when stock falls to {REORDER_PT}',
    'Want me to check the sales velocity for item {lu_id} to estimate when stock will reach the reorder point?',
    'INFO'
);

INSERT INTO AI_DIAGNOSTIC_CONCLUSION (CONCLUSION_KEY, RETAILER_ID, SUMMARY_TEMPLATE, EVIDENCE_TEMPLATE, FOLLOW_UP_TEMPLATE, SEVERITY)
VALUES (
    'REPLEN_PO_ALREADY_PLACED', 'TEMPLATE',
    'A purchase order has already been placed for item {lu_id} at store {site_id}. {PO_COUNT} open PO(s) found, earliest due {EARLIEST_PO_DATE}. Replenishment was triggered correctly — the order is in transit or awaiting confirmation.',
    'Open POs found: {PO_COUNT} orders in statut 3 or 5|Earliest expected delivery: {EARLIEST_PO_DATE}|Replenishment was triggered — stock will arrive when the PO is received',
    'Want me to check the status of the open POs in detail to confirm they are on track?',
    'INFO'
);

COMMIT;

SELECT d.STEP_ORDER, d.CONCLUSION_KEY, d.STOP_FIELD, d.STOP_OPERATOR, d.STOP_VALUE
  FROM AI_DIAGNOSTIC_STEP d
 WHERE d.SKILL_ID = 'DA000002-D100-4A00-8100-D10000000002'
 ORDER BY d.STEP_ORDER, d.CONCLUSION_KEY;
