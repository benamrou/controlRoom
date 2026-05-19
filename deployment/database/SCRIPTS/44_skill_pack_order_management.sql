-- =============================================================================
-- Retrieval Skill Pack: ORDER_MANAGEMENT
-- Skills: ORDER_STATUS, OPEN_PO_BY_ITEM
-- "Show me open POs for supplier X" / "What is the status of PO 12345?"
-- Deploy after: 08_skill_engine.sql
-- =============================================================================

-- ── ORDER_STATUS ──────────────────────────────────────────────────────────────

DELETE FROM AI_SKILL_SQL_TEMPLATE   WHERE skill_id = 'RE000001-E100-4A00-8100-E10000000001';
DELETE FROM AI_SKILL_PLAYBOOK_STEP  WHERE skill_id = 'RE000001-E100-4A00-8100-E10000000001';
DELETE FROM AI_SKILL_KNOWLEDGE_ITEM WHERE skill_id = 'RE000001-E100-4A00-8100-E10000000001';
DELETE FROM AI_SKILL_VERSION        WHERE skill_id = 'RE000001-E100-4A00-8100-E10000000001';
DELETE FROM AI_SKILL_VOCABULARY     WHERE skill_id = 'RE000001-E100-4A00-8100-E10000000001';
DELETE FROM AI_SKILL_RETAILER       WHERE skill_id = 'RE000001-E100-4A00-8100-E10000000001';
DELETE FROM AI_SKILL                WHERE skill_id = 'RE000001-E100-4A00-8100-E10000000001';

INSERT INTO AI_SKILL (
    skill_id, retailer_id, skill_code, skill_name, domain,
    description, version, status, created_by, created_at, updated_at
) VALUES (
    'RE000001-E100-4A00-8100-E10000000001',
    'TEMPLATE',
    'ORDER_STATUS',
    'Purchase order status lookup',
    'ORDER_MANAGEMENT',
    'Retrieves open purchase orders for a supplier with status, expected delivery date, and site.',
    1.0, 'DRAFT', 'SYSTEM', SYSTIMESTAMP, SYSTIMESTAMP
);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000001-E100-4A00-8100-E10000000001', 'show me open purchase orders',    'ORDER_LIST',    'INTENT_PHRASE', 'EN', 1.9);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000001-E100-4A00-8100-E10000000001', 'open pos for supplier',           'ORDER_LIST',    'INTENT_PHRASE', 'EN', 1.9);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000001-E100-4A00-8100-E10000000001', 'what orders are open',            'ORDER_LIST',    'INTENT_PHRASE', 'EN', 1.8);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000001-E100-4A00-8100-E10000000001', 'pending orders from',             'ORDER_LIST',    'INTENT_PHRASE', 'EN', 1.8);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000001-E100-4A00-8100-E10000000001', 'purchase order status',           'ORDER_STATUS',  'PROCESS_TERM',  'EN', 1.5);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000001-E100-4A00-8100-E10000000001', 'po status',                       'ORDER_STATUS',  'ABBREVIATION',  'EN', 1.5);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000001-E100-4A00-8100-E10000000001', 'cdeentcde',                       'ORDER_LIST',    'JARGON',        'EN', 1.6);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000001-E100-4A00-8100-E10000000001', 'from supplier',                   'supplier_id',   'BIND_HINT',     'EN', 1.0);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000001-E100-4A00-8100-E10000000001', 'for store',                       'site_id',       'BIND_HINT',     'EN', 1.0);

INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'RE000001-E100-4A00-8100-E10000000001',
    'ORD_OPEN_PO_BY_SUPPLIER',
    'Open POs by supplier (last 30 days)',
    'Lists open POs (statut 3/5) for a supplier. Optionally filters by site.',
    q'~SELECT e.ECDCINCDE                       AS "PO Number",
       TO_CHAR(e.ECDDATE,'YYYY-MM-DD')   AS "Order date",
       e.STATUT                          AS "Status",
       COUNT(d.DCDCINCDE)               AS "Lines",
       SUM(d.DCDQTEC)                   AS "Total qty",
       d.DCDSITE                        AS "Store",
       f.FOUCNUF                        AS "Supplier code",
       f.FOULIB                         AS "Supplier name"
  FROM CDEENTCDE@HEINENS_CEN_PROD  e
  JOIN CDEDETCDE@HEINENS_CEN_PROD  d ON d.DCDCINCDE = e.ECDCINCDE
  JOIN FOUDGENE@HEINENS_CEN_PROD   f ON f.FOUCFIN   = e.ECDCFIN
 WHERE TRIM(f.FOUCNUF) = TRIM(:supplier_id)
   AND e.STATUT IN ('3', '5')
   AND e.ECDDATE >= TRUNC(SYSDATE) - 30
   AND (:site_id = '-1' OR d.DCDSITE = TO_NUMBER(TRIM(:site_id)))
 GROUP BY e.ECDCINCDE, e.ECDDATE, e.STATUT, d.DCDSITE, f.FOUCNUF, f.FOULIB
 ORDER BY e.ECDDATE DESC
 FETCH FIRST 50 ROWS ONLY~',
    '[{"name":"supplier_id","type":"STRING","required":true},{"name":"site_id","type":"STRING","required":false}]',
    'CDEENTCDE@HEINENS_CEN_PROD, CDEDETCDE@HEINENS_CEN_PROD, FOUDGENE@HEINENS_CEN_PROD'
);

-- ── OPEN_PO_BY_ITEM ───────────────────────────────────────────────────────────

DELETE FROM AI_SKILL_SQL_TEMPLATE   WHERE skill_id = 'RE000002-E100-4A00-8100-E10000000002';
DELETE FROM AI_SKILL_PLAYBOOK_STEP  WHERE skill_id = 'RE000002-E100-4A00-8100-E10000000002';
DELETE FROM AI_SKILL_KNOWLEDGE_ITEM WHERE skill_id = 'RE000002-E100-4A00-8100-E10000000002';
DELETE FROM AI_SKILL_VERSION        WHERE skill_id = 'RE000002-E100-4A00-8100-E10000000002';
DELETE FROM AI_SKILL_VOCABULARY     WHERE skill_id = 'RE000002-E100-4A00-8100-E10000000002';
DELETE FROM AI_SKILL_RETAILER       WHERE skill_id = 'RE000002-E100-4A00-8100-E10000000002';
DELETE FROM AI_SKILL                WHERE skill_id = 'RE000002-E100-4A00-8100-E10000000002';

INSERT INTO AI_SKILL (
    skill_id, retailer_id, skill_code, skill_name, domain,
    description, version, status, created_by, created_at, updated_at
) VALUES (
    'RE000002-E100-4A00-8100-E10000000002',
    'TEMPLATE',
    'OPEN_PO_BY_ITEM',
    'Open purchase orders for a specific item',
    'ORDER_MANAGEMENT',
    'Shows all open purchase orders for an item across stores, with quantities and expected delivery dates.',
    1.0, 'DRAFT', 'SYSTEM', SYSTIMESTAMP, SYSTIMESTAMP
);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000002-E100-4A00-8100-E10000000002', 'show open orders for item',       'PO_BY_ITEM', 'INTENT_PHRASE', 'EN', 1.9);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000002-E100-4A00-8100-E10000000002', 'what orders exist for item',      'PO_BY_ITEM', 'INTENT_PHRASE', 'EN', 1.9);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000002-E100-4A00-8100-E10000000002', 'is item on order',                'PO_BY_ITEM', 'INTENT_PHRASE', 'EN', 1.8);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000002-E100-4A00-8100-E10000000002', 'pending orders for article',      'PO_BY_ITEM', 'INTENT_PHRASE', 'EN', 1.7);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000002-E100-4A00-8100-E10000000002', 'open po for item',                'PO_BY_ITEM', 'ABBREVIATION',  'EN', 1.5);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000002-E100-4A00-8100-E10000000002', 'item',                            'lu_id',      'BIND_HINT',     'EN', 1.0);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('RE000002-E100-4A00-8100-E10000000002', 'at store',                        'site_id',    'BIND_HINT',     'EN', 1.0);

INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'RE000002-E100-4A00-8100-E10000000002',
    'ORD_OPEN_PO_FOR_ITEM',
    'Open POs for specific item (last 14 days)',
    'Lists open POs for a given LU code. Optionally filters by store.',
    q'~SELECT e.ECDCINCDE                        AS "PO Number",
       TO_CHAR(e.ECDDATE,'YYYY-MM-DD')    AS "Order date",
       e.STATUT                           AS "Status",
       d.DCDSITE                          AS "Store",
       d.DCDQTEC                          AS "Qty ordered",
       NVL(d.DCDETAT, '-')               AS "Line status",
       f.FOUCNUF                          AS "Supplier code",
       f.FOULIB                           AS "Supplier name",
       a.ARTDESI                          AS "Item desc."
  FROM CDEENTCDE@HEINENS_CEN_PROD  e
  JOIN CDEDETCDE@HEINENS_CEN_PROD  d ON d.DCDCINCDE = e.ECDCINCDE
  JOIN ARTRAC@HEINENS_CEN_PROD     a ON a.ARTCINR   = d.DCDCINR
  JOIN FOUDGENE@HEINENS_CEN_PROD   f ON f.FOUCFIN   = e.ECDCFIN
 WHERE a.ARTCEXR = :lu_id
   AND e.STATUT IN ('3', '5')
   AND e.ECDDATE >= TRUNC(SYSDATE) - 14
   AND (:site_id = '-1' OR d.DCDSITE = TO_NUMBER(TRIM(:site_id)))
 ORDER BY e.ECDDATE DESC, d.DCDSITE
 FETCH FIRST 50 ROWS ONLY~',
    '[{"name":"lu_id","type":"STRING","required":true},{"name":"site_id","type":"STRING","required":false}]',
    'CDEENTCDE@HEINENS_CEN_PROD, CDEDETCDE@HEINENS_CEN_PROD, ARTRAC@HEINENS_CEN_PROD, FOUDGENE@HEINENS_CEN_PROD'
);

COMMIT;

SELECT s.SKILL_CODE, t.TEMPLATE_CODE
  FROM AI_SKILL s
  JOIN AI_SKILL_SQL_TEMPLATE t ON t.SKILL_ID = s.SKILL_ID
 WHERE s.SKILL_ID IN ('RE000001-E100-4A00-8100-E10000000001','RE000002-E100-4A00-8100-E10000000002')
 ORDER BY s.SKILL_CODE, t.TEMPLATE_CODE;
