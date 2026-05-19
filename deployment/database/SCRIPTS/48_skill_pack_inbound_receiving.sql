-- =============================================================================
-- Retrieval Skill Pack: INBOUND_RECEIVING
-- "Show me recent receipts from Lipari" / "What was received at store 10 today?"
-- Deploy after: 08_skill_engine.sql
-- =============================================================================

DELETE FROM AI_SKILL_SQL_TEMPLATE   WHERE skill_id = 'RE000006-E100-4A00-8100-E10000000006';
DELETE FROM AI_SKILL_PLAYBOOK_STEP  WHERE skill_id = 'RE000006-E100-4A00-8100-E10000000006';
DELETE FROM AI_SKILL_KNOWLEDGE_ITEM WHERE skill_id = 'RE000006-E100-4A00-8100-E10000000006';
DELETE FROM AI_SKILL_VERSION        WHERE skill_id = 'RE000006-E100-4A00-8100-E10000000006';
DELETE FROM AI_SKILL_VOCABULARY     WHERE skill_id = 'RE000006-E100-4A00-8100-E10000000006';
DELETE FROM AI_SKILL_RETAILER       WHERE skill_id = 'RE000006-E100-4A00-8100-E10000000006';
DELETE FROM AI_SKILL                WHERE skill_id = 'RE000006-E100-4A00-8100-E10000000006';

INSERT INTO AI_SKILL (
    skill_id, retailer_id, skill_code, skill_name, domain,
    description, version, status, created_by, created_at, updated_at
) VALUES (
    'RE000006-E100-4A00-8100-E10000000006',
    'TEMPLATE',
    'INBOUND_RECEIVING',
    'Inbound receiving movements lookup',
    'RECEIVING',
    'Retrieves recent receipt movements from STOMVT (type 1/10). Supports filtering by supplier or store.',
    1.0, 'DRAFT', 'SYSTEM', SYSTIMESTAMP, SYSTIMESTAMP
);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000006-E100-4A00-8100-E10000000006', 'show me recent receipts',         'RECEIPTS',      'INTENT_PHRASE', 'EN', 1.9);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000006-E100-4A00-8100-E10000000006', 'what was received at store',      'RECEIPTS',      'INTENT_PHRASE', 'EN', 1.9);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000006-E100-4A00-8100-E10000000006', 'deliveries received from',        'RECEIPTS',      'INTENT_PHRASE', 'EN', 1.8);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000006-E100-4A00-8100-E10000000006', 'inbound receipts from supplier',  'RECEIPTS',      'INTENT_PHRASE', 'EN', 1.8);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000006-E100-4A00-8100-E10000000006', 'goods received',                  'RECEIPTS',      'SYNONYM',       'EN', 1.5);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000006-E100-4A00-8100-E10000000006', 'stomvt',                          'RECEIPTS',      'JARGON',        'EN', 1.6);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000006-E100-4A00-8100-E10000000006', 'receipt movement',                'RECEIPTS',      'PROCESS_TERM',  'EN', 1.4);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000006-E100-4A00-8100-E10000000006', 'from supplier',                   'supplier_id',   'BIND_HINT',     'EN', 1.0);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000006-E100-4A00-8100-E10000000006', 'at store',                        'site_id',       'BIND_HINT',     'EN', 1.0);

-- Template 1: Receipts by supplier (last 14 days)
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'RE000006-E100-4A00-8100-E10000000006',
    'RCPT_BY_SUPPLIER',
    'Receipt movements by supplier (last 14 days)',
    'Lists STOMVT type-1/10 movements for supplier. Groups by date + item.',
    q'~SELECT TO_CHAR(m.DATMVT,'YYYY-MM-DD')   AS "Receipt date",
       a.ARTCEXR                        AS "Item code",
       a.ARTDESI                        AS "Item desc.",
       m.STMSITE                        AS "Store",
       SUM(m.STMDMVT)                  AS "Qty received",
       f.FOUCNUF                        AS "Supplier code",
       f.FOULIB                         AS "Supplier name"
  FROM STOMVT@HEINENS_CEN_PROD    m
  JOIN ARTUC@HEINENS_CEN_PROD     u ON u.ARACINR  = m.CODART
  JOIN ARTRAC@HEINENS_CEN_PROD    a ON a.ARTCINR  = u.ARACINR
  JOIN FOUDGENE@HEINENS_CEN_PROD  f ON f.FOUCFIN  = u.ARACFIN
 WHERE TRIM(f.FOUCNUF) = TRIM(:supplier_id)
   AND m.TYPMVT IN ('1', '10')
   AND m.DATMVT >= TRUNC(SYSDATE) - 14
   AND (:site_id = '-1' OR m.STMSITE = TO_NUMBER(TRIM(:site_id)))
 GROUP BY m.DATMVT, a.ARTCEXR, a.ARTDESI, m.STMSITE, f.FOUCNUF, f.FOULIB
 ORDER BY m.DATMVT DESC, a.ARTDESI
 FETCH FIRST 100 ROWS ONLY~',
    '[{"name":"supplier_id","type":"STRING","required":true},{"name":"site_id","type":"STRING","required":false}]',
    'STOMVT@HEINENS_CEN_PROD, ARTUC@HEINENS_CEN_PROD, ARTRAC@HEINENS_CEN_PROD, FOUDGENE@HEINENS_CEN_PROD'
);

-- Template 2: All receipts at a store (last 7 days)
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'RE000006-E100-4A00-8100-E10000000006',
    'RCPT_AT_STORE',
    'All receipt movements at a store (last 7 days)',
    'Lists all STOMVT type-1/10 movements at a store. Groups by date + item.',
    q'~SELECT TO_CHAR(m.DATMVT,'YYYY-MM-DD')   AS "Receipt date",
       a.ARTCEXR                        AS "Item code",
       a.ARTDESI                        AS "Item desc.",
       SUM(m.STMDMVT)                  AS "Qty received",
       f.FOUCNUF                        AS "Supplier code",
       f.FOULIB                         AS "Supplier name"
  FROM STOMVT@HEINENS_CEN_PROD    m
  JOIN ARTUC@HEINENS_CEN_PROD     u ON u.ARACINR  = m.CODART
  JOIN ARTRAC@HEINENS_CEN_PROD    a ON a.ARTCINR  = u.ARACINR
  JOIN FOUDGENE@HEINENS_CEN_PROD  f ON f.FOUCFIN  = u.ARACFIN
 WHERE m.STMSITE = TO_NUMBER(TRIM(:site_id))
   AND m.TYPMVT IN ('1', '10')
   AND m.DATMVT >= TRUNC(SYSDATE) - 7
 GROUP BY m.DATMVT, a.ARTCEXR, a.ARTDESI, f.FOUCNUF, f.FOULIB
 ORDER BY m.DATMVT DESC, a.ARTDESI
 FETCH FIRST 200 ROWS ONLY~',
    '[{"name":"site_id","type":"STRING","required":true}]',
    'STOMVT@HEINENS_CEN_PROD, ARTUC@HEINENS_CEN_PROD, ARTRAC@HEINENS_CEN_PROD, FOUDGENE@HEINENS_CEN_PROD'
);

COMMIT;

SELECT s.SKILL_CODE, t.TEMPLATE_CODE
  FROM AI_SKILL s
  JOIN AI_SKILL_SQL_TEMPLATE t ON t.SKILL_ID = s.SKILL_ID
 WHERE s.SKILL_ID = 'RE000006-E100-4A00-8100-E10000000006'
 ORDER BY t.TEMPLATE_CODE;
