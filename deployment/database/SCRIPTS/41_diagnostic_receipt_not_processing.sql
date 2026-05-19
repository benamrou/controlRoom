-- =============================================================================
-- Diagnostic Skill: RECEIPT_NOT_PROCESSING
-- "Why is the delivery from Lipari not being processed / confirmed?"
-- Deploy after: 37_diagnostic_chain_tables.sql, 38_diagnostic_chain_libquery.sql
-- Requires: supplier_id in entities (vendor resolution must have run)
-- =============================================================================

DELETE FROM AI_DIAGNOSTIC_STEP      WHERE SKILL_ID = 'DA000003-D100-4A00-8100-D10000000003';
DELETE FROM AI_SKILL_VOCABULARY     WHERE skill_id = 'DA000003-D100-4A00-8100-D10000000003';
DELETE FROM AI_SKILL_SQL_TEMPLATE   WHERE skill_id = 'DA000003-D100-4A00-8100-D10000000003';
DELETE FROM AI_SKILL_PLAYBOOK_STEP  WHERE skill_id = 'DA000003-D100-4A00-8100-D10000000003';
DELETE FROM AI_SKILL_KNOWLEDGE_ITEM WHERE skill_id = 'DA000003-D100-4A00-8100-D10000000003';
DELETE FROM AI_SKILL_VERSION        WHERE skill_id = 'DA000003-D100-4A00-8100-D10000000003';
DELETE FROM AI_SKILL_RETAILER       WHERE skill_id = 'DA000003-D100-4A00-8100-D10000000003';
DELETE FROM AI_SKILL                WHERE skill_id = 'DA000003-D100-4A00-8100-D10000000003';

INSERT INTO AI_SKILL (
    skill_id, retailer_id, skill_code, skill_name, domain,
    description, version, status, created_by, created_at, updated_at
) VALUES (
    'DA000003-D100-4A00-8100-D10000000003',
    'TEMPLATE',
    'RECEIPT_NOT_PROCESSING',
    'Delivery receipt not processing — root cause',
    'RECEIVING',
    'Diagnoses why a supplier delivery is not being confirmed or posted in GOLD. Checks PO existence, PO status, and STOMVT receipt movements.',
    1.0, 'DRAFT', 'SYSTEM', SYSTIMESTAMP, SYSTIMESTAMP
);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000003-D100-4A00-8100-D10000000003', 'delivery not confirmed',       'RECEIPT_BLOCKED', 'INTENT_PHRASE', 'EN', 1.9);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000003-D100-4A00-8100-D10000000003', 'receipt not processing',       'RECEIPT_BLOCKED', 'INTENT_PHRASE', 'EN', 1.9);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000003-D100-4A00-8100-D10000000003', 'why is delivery not confirmed','RECEIPT_BLOCKED', 'INTENT_PHRASE', 'EN', 1.8);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000003-D100-4A00-8100-D10000000003', 'goods not received',           'RECEIPT_BLOCKED', 'SYNONYM',       'EN', 1.5);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000003-D100-4A00-8100-D10000000003', 'unconfirmed delivery',         'RECEIPT_BLOCKED', 'PROCESS_TERM',  'EN', 1.5);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000003-D100-4A00-8100-D10000000003', 'receipt blocked',              'RECEIPT_BLOCKED', 'JARGON',        'EN', 1.4);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000003-D100-4A00-8100-D10000000003', 'from supplier',                'supplier_id',     'BIND_HINT',     'EN', 1.0);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000003-D100-4A00-8100-D10000000003', 'for store',                    'site_id',         'BIND_HINT',     'EN', 1.0);

-- Step 1: Check open PO + status diagnosis
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'DA000003-D100-4A00-8100-D10000000003',
    'RCPT_CHK_PO_STATUS',
    'Open PO + status diagnosis',
    'Returns PO_COUNT, latest PO STATUT, and RECEIPT_DIAGNOSIS. NO_PO=no open PO; PO_BLOCKED=wrong status; PO_OPEN=waiting receipt.',
    q'~SELECT NVL(x.PO_COUNT, 0)    AS PO_COUNT,
       x.LATEST_STATUT         AS LATEST_STATUT,
       x.LATEST_PO_DATE        AS LATEST_PO_DATE,
       CASE
           WHEN NVL(x.PO_COUNT, 0) = 0                     THEN 'NO_PO'
           WHEN x.LATEST_STATUT NOT IN ('3','5')           THEN 'PO_WRONG_STATUS'
           ELSE                                                  'PO_OPEN_AWAITING'
       END AS RECEIPT_DIAGNOSIS
  FROM (
       SELECT COUNT(DISTINCT e.ECDCINCDE) AS PO_COUNT,
              MAX(e.STATUT)               AS LATEST_STATUT,
              TO_CHAR(MAX(e.ECDDATE),'YYYY-MM-DD') AS LATEST_PO_DATE
         FROM CDEENTCDE@HEINENS_CEN_PROD e
         JOIN FOUDGENE@HEINENS_CEN_PROD  f ON f.FOUCFIN = e.ECDCFIN
        WHERE TRIM(f.FOUCNUF) = TRIM(:supplier_id)
          AND e.ECDDATE BETWEEN TRUNC(SYSDATE) - 14 AND TRUNC(SYSDATE) + 7
  ) x~',
    '[{"name":"supplier_id","type":"STRING","required":true}]',
    'CDEENTCDE@HEINENS_CEN_PROD, FOUDGENE@HEINENS_CEN_PROD'
);

-- Step 2: Check for recent STOMVT receipt movements
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'DA000003-D100-4A00-8100-D10000000003',
    'RCPT_CHK_STOMVT',
    'STOMVT receipt movement check',
    'Returns MVT_COUNT of type-1/10 movements for this supplier in last 14 days. 0 = no physical receipt posted.',
    q'~SELECT COUNT(*) AS MVT_COUNT,
       MAX(TO_CHAR(m.DATMVT,'YYYY-MM-DD')) AS LAST_MVT_DATE
  FROM STOMVT@HEINENS_CEN_PROD   m
  JOIN ARTUC@HEINENS_CEN_PROD    u ON u.ARACINR = m.CODART
  JOIN FOUDGENE@HEINENS_CEN_PROD f ON f.FOUCFIN = u.ARACFIN
 WHERE TRIM(f.FOUCNUF) = TRIM(:supplier_id)
   AND m.TYPMVT IN ('1', '10')
   AND m.DATMVT >= TRUNC(SYSDATE) - 14~',
    '[{"name":"supplier_id","type":"STRING","required":true}]',
    'STOMVT@HEINENS_CEN_PROD, ARTUC@HEINENS_CEN_PROD, FOUDGENE@HEINENS_CEN_PROD'
);

-- Diagnostic steps
INSERT INTO AI_DIAGNOSTIC_STEP (SKILL_ID, STEP_ORDER, TEMPLATE_CODE, STOP_FIELD, STOP_OPERATOR, STOP_VALUE, CONCLUSION_KEY, STEP_LABEL)
VALUES ('DA000003-D100-4A00-8100-D10000000003', 1, 'RCPT_CHK_PO_STATUS', 'RECEIPT_DIAGNOSIS', '=', 'NO_PO', 'RCPT_NO_PO', 'PO existence + status check');

INSERT INTO AI_DIAGNOSTIC_STEP (SKILL_ID, STEP_ORDER, TEMPLATE_CODE, STOP_FIELD, STOP_OPERATOR, STOP_VALUE, CONCLUSION_KEY, STEP_LABEL)
VALUES ('DA000003-D100-4A00-8100-D10000000003', 1, 'RCPT_CHK_PO_STATUS', 'RECEIPT_DIAGNOSIS', '=', 'PO_WRONG_STATUS', 'RCPT_PO_WRONG_STATUS', 'PO existence + status check');

INSERT INTO AI_DIAGNOSTIC_STEP (SKILL_ID, STEP_ORDER, TEMPLATE_CODE, STOP_FIELD, STOP_OPERATOR, STOP_VALUE, CONCLUSION_KEY, STEP_LABEL)
VALUES ('DA000003-D100-4A00-8100-D10000000003', 2, 'RCPT_CHK_STOMVT', 'MVT_COUNT', '=', '0', 'RCPT_NO_MOVEMENT', 'STOMVT receipt movement check');

-- Conclusions
DELETE FROM AI_DIAGNOSTIC_CONCLUSION WHERE CONCLUSION_KEY IN (
    'RCPT_NO_PO','RCPT_PO_WRONG_STATUS','RCPT_NO_MOVEMENT'
) AND RETAILER_ID = 'TEMPLATE';

INSERT INTO AI_DIAGNOSTIC_CONCLUSION (CONCLUSION_KEY, RETAILER_ID, SUMMARY_TEMPLATE, EVIDENCE_TEMPLATE, FOLLOW_UP_TEMPLATE, SEVERITY)
VALUES (
    'RCPT_NO_PO', 'TEMPLATE',
    'No open purchase order found for supplier {supplier_id} in the last 14 days. Without a PO in statut 3 or 5, GOLD has nothing to receive against. Either no order was placed, or all recent orders are already closed.',
    'PO count (statut 3/5, last 14 days): 0|No open PO = no receipt possible in GOLD|Check if the order was placed under a different supplier code or site',
    'Should I check historical POs for this supplier to see if orders were placed and already closed?',
    'WARNING'
);

INSERT INTO AI_DIAGNOSTIC_CONCLUSION (CONCLUSION_KEY, RETAILER_ID, SUMMARY_TEMPLATE, EVIDENCE_TEMPLATE, FOLLOW_UP_TEMPLATE, SEVERITY)
VALUES (
    'RCPT_PO_WRONG_STATUS', 'TEMPLATE',
    'A purchase order exists for supplier {supplier_id} but it is in status {LATEST_STATUT}, which is not a valid receiving status. GOLD can only post receipts against POs in statut 3 (ordered) or 5 (partially received). The PO may have been cancelled or is in an error state.',
    'PO found: {PO_COUNT} order(s) found for this supplier|PO status: {LATEST_STATUT} — not in (3, 5)|Invalid status blocks receipt confirmation in GOLD',
    'Do you want me to show the full PO detail including all line statuses?',
    'CRITICAL'
);

INSERT INTO AI_DIAGNOSTIC_CONCLUSION (CONCLUSION_KEY, RETAILER_ID, SUMMARY_TEMPLATE, EVIDENCE_TEMPLATE, FOLLOW_UP_TEMPLATE, SEVERITY)
VALUES (
    'RCPT_NO_MOVEMENT', 'TEMPLATE',
    'A valid open PO exists for supplier {supplier_id} but no type-1 or type-10 STOMVT movements have been posted in the last 14 days. The physical delivery may have arrived at the dock but the receiving transaction was not completed in GOLD.',
    'Open PO: present and in valid status (statut 3/5)|STOMVT receipt movements (type 1/10, last 14 days): 0|Delivery likely at dock awaiting physical confirmation or system entry',
    'Want me to check DOCKPLAN for any pending dock entries from this supplier that have not been processed?',
    'CRITICAL'
);

COMMIT;

SELECT d.STEP_ORDER, d.CONCLUSION_KEY, d.STOP_FIELD, d.STOP_VALUE
  FROM AI_DIAGNOSTIC_STEP d
 WHERE d.SKILL_ID = 'DA000003-D100-4A00-8100-D10000000003'
 ORDER BY d.STEP_ORDER, d.CONCLUSION_KEY;
