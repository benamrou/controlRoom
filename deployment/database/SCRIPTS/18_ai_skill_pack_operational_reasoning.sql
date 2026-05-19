-- =============================================================================
-- AI Skill Pack: Operational Reasoning
-- Skills: SUPPLIER_HEALTH, STOCK_VARIANCE, DELIVERY_EXCEPTION
-- Deploy after: 08_skill_engine.sql, 12_ai_skill_pack_dsd_vendor_retail.sql
-- =============================================================================

-- ── SKILL 1: Supplier Health ─────────────────────────────────────────────────

INSERT INTO AI_SKILL (
    skill_id, retailer_id, skill_code, skill_name, domain,
    description, version, status, created_by, created_at, updated_at
) VALUES (
    'F1A2B3C4-D5E6-7890-ABCD-111111111101',
    'TEMPLATE',
    'SUPPLIER_HEALTH',
    'Supplier Health Analysis',
    'SUPPLIER',
    'Analyzes supplier delivery reliability, fill rate, and open order exposure for a given retailer context.',
    1.0, 'DRAFT', 'SYSTEM', SYSTIMESTAMP, SYSTIMESTAMP
);

INSERT INTO AI_SKILL_KNOWLEDGE_ITEM (
    skill_id, base_knowledge_key, override_mode, knowledge_key, label, description,
    anchor_question, rounds_json, validation_sql, priority, is_mandatory
) VALUES (
    'F1A2B3C4-D5E6-7890-ABCD-111111111101', NULL, 'EXTEND',
    'SUPP_OPEN_PO', 'Open purchase orders',
    'Supplier open order exposure and status breakdown.',
    'How do you determine if a supplier has outstanding open orders and which status codes signal a delivery risk?',
    NULL, NULL, 1, 1
);

INSERT INTO AI_SKILL_KNOWLEDGE_ITEM (
    skill_id, base_knowledge_key, override_mode, knowledge_key, label, description,
    anchor_question, rounds_json, validation_sql, priority, is_mandatory
) VALUES (
    'F1A2B3C4-D5E6-7890-ABCD-111111111101', NULL, 'EXTEND',
    'SUPP_MOVEMENT', 'Recent receiving activity',
    'Stock movement history for the supplier across sites.',
    'Which movement types in STOMVT represent confirmed supplier receipts, and how do you identify a gap if movements stop for a normally active supplier?',
    NULL, NULL, 1, 1
);

-- Vocabulary
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1A2B3C4-D5E6-7890-ABCD-111111111101', 'supplier performance',  'SUPPLIER_PERFORMANCE', 'PROCESS_TERM', 'EN', 1.6);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1A2B3C4-D5E6-7890-ABCD-111111111101', 'fill rate',             'FILL_RATE',            'PROCESS_TERM', 'EN', 1.5);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1A2B3C4-D5E6-7890-ABCD-111111111101', 'how is supplier',       'SUPPLIER_HEALTH',      'PROCESS_TERM', 'EN', 1.6);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1A2B3C4-D5E6-7890-ABCD-111111111101', 'supplier reliable',     'SUPPLIER_HEALTH',      'SYNONYM',      'EN', 1.4);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1A2B3C4-D5E6-7890-ABCD-111111111101', 'vendor performance',    'SUPPLIER_PERFORMANCE', 'SYNONYM',      'EN', 1.5);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1A2B3C4-D5E6-7890-ABCD-111111111101', 'delivery reliability',  'SUPPLIER_HEALTH',      'PROCESS_TERM', 'EN', 1.4);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1A2B3C4-D5E6-7890-ABCD-111111111101', 'open orders',           'OPEN_PO',              'SYNONYM',      'EN', 1.2);

-- Engine vendor resolver (router-only)
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'F1A2B3C4-D5E6-7890-ABCD-111111111101',
    'ENGINE_VENDOR_RESOLVE',
    'Vendor fuzzy resolver (router only)',
    'Router step: map free-text vendor name/code to FOUDGENE candidates. ENGINE_ prefix = never executed by /execute.',
    q'~SELECT supplier_id, supplier_name, score
  FROM (
        SELECT f.FOUCNUF AS supplier_id,
               f.FOULIBL AS supplier_name,
               CASE
                 WHEN UPPER(f.FOUCNUF) = UPPER(TRIM(:vendor_text)) THEN 100
                 WHEN REGEXP_SUBSTR(:vendor_text, '\d{3,}') IS NOT NULL
                      AND UPPER(f.FOUCNUF) = UPPER(REGEXP_SUBSTR(:vendor_text, '\d{3,}'))
                      THEN 98
                 WHEN UPPER(f.FOULIBL) = UPPER(TRIM(:vendor_text)) THEN 95
                 WHEN UPPER(f.FOULIBL) LIKE UPPER(TRIM(:vendor_text)) || '%' THEN 85
                 WHEN LENGTH(TRIM(REGEXP_REPLACE(:vendor_text, '[^A-Za-z ]+', ' '))) >= 3
                      AND UPPER(f.FOULIBL) LIKE '%' || UPPER(TRIM(REGEXP_REPLACE(:vendor_text, '[^A-Za-z ]+', ' '))) || '%'
                      THEN 80
                 WHEN UPPER(f.FOULIBL) LIKE '%' || UPPER(TRIM(:vendor_text)) || '%' THEN 70
                 ELSE 0
               END AS score
          FROM FOUDGENE@HEINENS_CEN_PROD f
         WHERE UPPER(f.FOUCNUF) = UPPER(TRIM(:vendor_text))
            OR UPPER(f.FOULIBL) LIKE '%' || UPPER(TRIM(:vendor_text)) || '%'
            OR (REGEXP_SUBSTR(:vendor_text, '\d{3,}') IS NOT NULL
                AND UPPER(f.FOUCNUF) = UPPER(REGEXP_SUBSTR(:vendor_text, '\d{3,}')))
            OR (LENGTH(TRIM(REGEXP_REPLACE(:vendor_text, '[^A-Za-z ]+', ' '))) >= 3
                AND UPPER(f.FOULIBL) LIKE '%' || UPPER(TRIM(REGEXP_REPLACE(:vendor_text, '[^A-Za-z ]+', ' '))) || '%')
       )
 WHERE score > 0
 ORDER BY score DESC, supplier_name
 FETCH FIRST 10 ROWS ONLY~',
    '[{"name":"vendor_text","type":"STRING","required":true}]',
    'FOUDGENE@HEINENS_CEN_PROD'
);

-- Template: open order exposure
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'F1A2B3C4-D5E6-7890-ABCD-111111111101',
    'SUPPLIER_OPEN_ORDER_EXPOSURE',
    'Open order exposure by supplier',
    'Open PO lines (STATUT 3=ordered, 5=partial-received) with quantity and status breakdown.',
    q'~SELECT e.ECDCINCDE AS po_number,
       d.DCDCEXCDE  AS item_lu,
       d.DCDCINR    AS item_internal,
       d.DCDQTEC    AS ordered_qty,
       d.DCDSITE    AS site,
       d.DCDETAT    AS line_status,
       e.ECDDATE    AS po_date
  FROM CDEENTCDE@HEINENS_CEN_PROD e
  JOIN CDEDETCDE@HEINENS_CEN_PROD d ON d.DCDCINCDE = e.ECDCINCDE
  JOIN FOUDGENE@HEINENS_CEN_PROD  f ON e.ECDCFIN   = f.FOUCFIN
 WHERE TRIM(f.FOUCNUF) = TRIM(:supplier_id)
   AND e.STATUT IN ('3','5')
 ORDER BY e.ECDDATE DESC
 FETCH FIRST 200 ROWS ONLY~',
    '[{"name":"supplier_id","type":"STRING","required":true}]',
    'CDEENTCDE@HEINENS_CEN_PROD, CDEDETCDE@HEINENS_CEN_PROD, FOUDGENE@HEINENS_CEN_PROD'
);

-- Template: receiving activity
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'F1A2B3C4-D5E6-7890-ABCD-111111111101',
    'SUPPLIER_RECEIVING_ACTIVITY',
    'Recent receiving activity',
    'Stock movements for the supplier across all sites in a date window.',
    q'~SELECT m.STMSITE  AS site,
       m.CODART   AS item_internal,
       m.TYPMVT   AS movement_type,
       m.DATMVT   AS movement_date,
       m.QTESAI   AS quantity
  FROM STOMVT@HEINENS_CEN_PROD   m
  JOIN ARTUC@HEINENS_CEN_PROD    u ON u.ARACINR = m.CODART
  JOIN FOUDGENE@HEINENS_CEN_PROD f ON f.FOUCFIN = u.ARACFIN
 WHERE TRIM(f.FOUCNUF) = TRIM(:supplier_id)
   AND m.STMDMVT BETWEEN TO_DATE(:date_from, 'YYYY-MM-DD')
                      AND TO_DATE(:date_to,   'YYYY-MM-DD')
 ORDER BY m.DATMVT DESC
 FETCH FIRST 500 ROWS ONLY~',
    '[{"name":"supplier_id","type":"STRING","required":true},{"name":"date_from","type":"STRING","required":true},{"name":"date_to","type":"STRING","required":true}]',
    'STOMVT@HEINENS_CEN_PROD, ARTUC@HEINENS_CEN_PROD, FOUDGENE@HEINENS_CEN_PROD'
);


-- ── SKILL 2: Stock Variance Reasoning ────────────────────────────────────────

INSERT INTO AI_SKILL (
    skill_id, retailer_id, skill_code, skill_name, domain,
    description, version, status, created_by, created_at, updated_at
) VALUES (
    'F1A2B3C4-D5E6-7890-ABCD-111111111102',
    'TEMPLATE',
    'STOCK_VARIANCE',
    'Stock Variance Reasoning',
    'STOCK',
    'Diagnoses stock shortages, negative stocks, and variance between expected and physical stock at site level.',
    1.0, 'DRAFT', 'SYSTEM', SYSTIMESTAMP, SYSTIMESTAMP
);

INSERT INTO AI_SKILL_KNOWLEDGE_ITEM (
    skill_id, base_knowledge_key, override_mode, knowledge_key, label, description,
    anchor_question, rounds_json, validation_sql, priority, is_mandatory
) VALUES (
    'F1A2B3C4-D5E6-7890-ABCD-111111111102', NULL, 'EXTEND',
    'STOCK_LAYERS', 'Current stock layers (STOCOUCH)',
    'Physical stock, reserved, and available quantities at site level.',
    'How does STOCOUCH represent stock for an item at a site — which columns give physical quantity, reserved, and net available?',
    NULL, NULL, 1, 1
);

INSERT INTO AI_SKILL_KNOWLEDGE_ITEM (
    skill_id, base_knowledge_key, override_mode, knowledge_key, label, description,
    anchor_question, rounds_json, validation_sql, priority, is_mandatory
) VALUES (
    'F1A2B3C4-D5E6-7890-ABCD-111111111102', NULL, 'EXTEND',
    'STOCK_REPLEN', 'Replenishment parameters (ARTREAP)',
    'Safety stock, reorder point, and max level per site.',
    'In ARTREAP, which columns hold the safety stock, reorder point, and maximum order level for an item at a site?',
    NULL, NULL, 1, 1
);

-- Vocabulary
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1A2B3C4-D5E6-7890-ABCD-111111111102', 'out of stock',        'STOCK_SHORTAGE',  'PROCESS_TERM', 'EN', 1.7);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1A2B3C4-D5E6-7890-ABCD-111111111102', 'stock shortage',      'STOCK_SHORTAGE',  'SYNONYM',      'EN', 1.6);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1A2B3C4-D5E6-7890-ABCD-111111111102', 'negative stock',      'STOCK_NEGATIVE',  'PROCESS_TERM', 'EN', 1.6);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1A2B3C4-D5E6-7890-ABCD-111111111102', 'stock variance',      'STOCK_VARIANCE',  'PROCESS_TERM', 'EN', 1.5);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1A2B3C4-D5E6-7890-ABCD-111111111102', 'why short',           'STOCK_SHORTAGE',  'JARGON',       'EN', 1.4);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1A2B3C4-D5E6-7890-ABCD-111111111102', 'replenishment issue', 'REPLEN_ISSUE',    'PROCESS_TERM', 'EN', 1.3);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1A2B3C4-D5E6-7890-ABCD-111111111102', 'stock level',         'STOCK_LEVEL',     'SYNONYM',      'EN', 1.2);

-- Template: current stock layers for a specific item + site
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'F1A2B3C4-D5E6-7890-ABCD-111111111102',
    'STOCK_CURRENT_LAYERS',
    'Current stock layers at site',
    'STOCOUCH physical/reserved/available for a specific item and site.',
    q'~SELECT s.STCSITE             AS site,
       s.STCCINR             AS item_internal,
       s.STCCEXR             AS item_lu,
       s.STCQTEP             AS physical_qty,
       s.STCQTER             AS reserved_qty,
       s.STCQTEP - s.STCQTER AS available_qty,
       s.STCDATE             AS last_movement_date
  FROM STOCOUCH@HEINENS_CEN_PROD s
 WHERE s.STCSITE = :site_id
   AND (s.STCCINR = :lu_id OR s.STCCEXR = :lu_id)
 ORDER BY s.STCDATE DESC~',
    '[{"name":"site_id","type":"STRING","required":true},{"name":"lu_id","type":"STRING","required":true}]',
    'STOCOUCH@HEINENS_CEN_PROD'
);

-- Template: items with negative stock at a site
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'F1A2B3C4-D5E6-7890-ABCD-111111111102',
    'STOCK_NEGATIVE_ITEMS',
    'Items with negative stock at site',
    'Items where physical stock < 0 — indicates unconfirmed receipts, shrinkage, or data issue.',
    q'~SELECT s.STCSITE  AS site,
       s.STCCEXR  AS item_lu,
       s.STCCINR  AS item_internal,
       s.STCQTEP  AS physical_qty,
       s.STCQTER  AS reserved_qty,
       s.STCDATE  AS last_movement_date
  FROM STOCOUCH@HEINENS_CEN_PROD s
 WHERE s.STCSITE = :site_id
   AND s.STCQTEP < 0
 ORDER BY s.STCQTEP ASC
 FETCH FIRST 100 ROWS ONLY~',
    '[{"name":"site_id","type":"STRING","required":true}]',
    'STOCOUCH@HEINENS_CEN_PROD'
);

-- Template: replenishment parameters for item at site
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'F1A2B3C4-D5E6-7890-ABCD-111111111102',
    'STOCK_REPLEN_PARAMS',
    'Replenishment parameters for item at site',
    'ARTREAP safety stock, reorder point, max level — diagnose why an item did not replenish.',
    q'~SELECT r.ARSITE   AS site,
       r.ARCEXR   AS item_lu,
       r.ARCINR   AS item_internal,
       r.ARQTSS   AS safety_stock,
       r.ARQTRE   AS reorder_point,
       r.ARQTMA   AS max_level,
       r.ARDELAI  AS shelf_fill_days
  FROM ARTREAP@HEINENS_CEN_PROD r
 WHERE r.ARSITE = :site_id
   AND (r.ARCINR = :lu_id OR r.ARCEXR = :lu_id)~',
    '[{"name":"site_id","type":"STRING","required":true},{"name":"lu_id","type":"STRING","required":true}]',
    'ARTREAP@HEINENS_CEN_PROD'
);


-- ── SKILL 3: Delivery Exception Analysis ─────────────────────────────────────

INSERT INTO AI_SKILL (
    skill_id, retailer_id, skill_code, skill_name, domain,
    description, version, status, created_by, created_at, updated_at
) VALUES (
    'F1A2B3C4-D5E6-7890-ABCD-111111111103',
    'TEMPLATE',
    'DELIVERY_EXCEPTION',
    'Delivery Exception Analysis',
    'RECEIVING',
    'Identifies unconfirmed deliveries, short shipments, and invoice mismatches for a supplier and site combination.',
    1.0, 'DRAFT', 'SYSTEM', SYSTIMESTAMP, SYSTIMESTAMP
);

INSERT INTO AI_SKILL_KNOWLEDGE_ITEM (
    skill_id, base_knowledge_key, override_mode, knowledge_key, label, description,
    anchor_question, rounds_json, validation_sql, priority, is_mandatory
) VALUES (
    'F1A2B3C4-D5E6-7890-ABCD-111111111103', NULL, 'EXTEND',
    'DELIVERY_RECEIPT', 'Goods receipt records',
    'PO lines pending confirmation and their status codes.',
    'Which CDEENTCDE status values mean the order was placed but not yet fully received, and which mean partially received?',
    NULL, NULL, 1, 1
);

INSERT INTO AI_SKILL_KNOWLEDGE_ITEM (
    skill_id, base_knowledge_key, override_mode, knowledge_key, label, description,
    anchor_question, rounds_json, validation_sql, priority, is_mandatory
) VALUES (
    'F1A2B3C4-D5E6-7890-ABCD-111111111103', NULL, 'EXTEND',
    'DELIVERY_INVOICE', 'Invoice vs receipt match',
    'How to confirm what was actually received vs what the invoice claims.',
    'Which STOMVT movement types confirm a physical receipt from a supplier, and what does it look like when a delivery is posted but not confirmed?',
    NULL, NULL, 1, 1
);

-- Vocabulary
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1A2B3C4-D5E6-7890-ABCD-111111111103', 'short shipment',        'SHORT_SHIPMENT',    'PROCESS_TERM', 'EN', 1.7);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1A2B3C4-D5E6-7890-ABCD-111111111103', 'delivery exception',    'DELIVERY_EXCEPTION','PROCESS_TERM', 'EN', 1.6);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1A2B3C4-D5E6-7890-ABCD-111111111103', 'unconfirmed delivery',  'DELIVERY_EXCEPTION','SYNONYM',      'EN', 1.5);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1A2B3C4-D5E6-7890-ABCD-111111111103', 'invoice mismatch',      'INVOICE_MISMATCH',  'PROCESS_TERM', 'EN', 1.6);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1A2B3C4-D5E6-7890-ABCD-111111111103', 'receiving exception',   'DELIVERY_EXCEPTION','PROCESS_TERM', 'EN', 1.5);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1A2B3C4-D5E6-7890-ABCD-111111111103', 'goods not received',    'MISSING_RECEIPT',   'JARGON',       'EN', 1.4);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1A2B3C4-D5E6-7890-ABCD-111111111103', 'delivery not confirmed','DELIVERY_EXCEPTION','SYNONYM',      'EN', 1.4);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('F1A2B3C4-D5E6-7890-ABCD-111111111103', 'missing delivery',      'MISSING_RECEIPT',   'SYNONYM',      'EN', 1.3);

-- Engine vendor resolver
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'F1A2B3C4-D5E6-7890-ABCD-111111111103',
    'ENGINE_VENDOR_RESOLVE',
    'Vendor fuzzy resolver (router only)',
    'Router step: map free-text vendor name/code to FOUDGENE candidates. ENGINE_ prefix = never executed by /execute.',
    q'~SELECT supplier_id, supplier_name, score
  FROM (
        SELECT f.FOUCNUF AS supplier_id,
               f.FOULIBL AS supplier_name,
               CASE
                 WHEN UPPER(f.FOUCNUF) = UPPER(TRIM(:vendor_text)) THEN 100
                 WHEN REGEXP_SUBSTR(:vendor_text, '\d{3,}') IS NOT NULL
                      AND UPPER(f.FOUCNUF) = UPPER(REGEXP_SUBSTR(:vendor_text, '\d{3,}'))
                      THEN 98
                 WHEN UPPER(f.FOULIBL) = UPPER(TRIM(:vendor_text)) THEN 95
                 WHEN UPPER(f.FOULIBL) LIKE UPPER(TRIM(:vendor_text)) || '%' THEN 85
                 WHEN LENGTH(TRIM(REGEXP_REPLACE(:vendor_text, '[^A-Za-z ]+', ' '))) >= 3
                      AND UPPER(f.FOULIBL) LIKE '%' || UPPER(TRIM(REGEXP_REPLACE(:vendor_text, '[^A-Za-z ]+', ' '))) || '%'
                      THEN 80
                 WHEN UPPER(f.FOULIBL) LIKE '%' || UPPER(TRIM(:vendor_text)) || '%' THEN 70
                 ELSE 0
               END AS score
          FROM FOUDGENE@HEINENS_CEN_PROD f
         WHERE UPPER(f.FOUCNUF) = UPPER(TRIM(:vendor_text))
            OR UPPER(f.FOULIBL) LIKE '%' || UPPER(TRIM(:vendor_text)) || '%'
            OR (REGEXP_SUBSTR(:vendor_text, '\d{3,}') IS NOT NULL
                AND UPPER(f.FOUCNUF) = UPPER(REGEXP_SUBSTR(:vendor_text, '\d{3,}')))
            OR (LENGTH(TRIM(REGEXP_REPLACE(:vendor_text, '[^A-Za-z ]+', ' '))) >= 3
                AND UPPER(f.FOULIBL) LIKE '%' || UPPER(TRIM(REGEXP_REPLACE(:vendor_text, '[^A-Za-z ]+', ' '))) || '%')
       )
 WHERE score > 0
 ORDER BY score DESC, supplier_name
 FETCH FIRST 10 ROWS ONLY~',
    '[{"name":"vendor_text","type":"STRING","required":true}]',
    'FOUDGENE@HEINENS_CEN_PROD'
);

-- Template: open orders pending receipt confirmation
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'F1A2B3C4-D5E6-7890-ABCD-111111111103',
    'DELIVERY_OPEN_RECEIPTS',
    'Open orders pending receipt confirmation',
    'PO lines still open (STATUT 3 or 5) for supplier at site — candidate unconfirmed deliveries.',
    q'~SELECT e.ECDCINCDE AS po_number,
       e.ECDDATE   AS po_date,
       d.DCDSITE   AS site,
       d.DCDCEXCDE AS item_lu,
       d.DCDCINR   AS item_internal,
       d.DCDQTEC   AS ordered_qty,
       d.DCDETAT   AS line_status
  FROM CDEENTCDE@HEINENS_CEN_PROD e
  JOIN CDEDETCDE@HEINENS_CEN_PROD d ON d.DCDCINCDE = e.ECDCINCDE
  JOIN FOUDGENE@HEINENS_CEN_PROD  f ON e.ECDCFIN   = f.FOUCFIN
 WHERE TRIM(f.FOUCNUF) = TRIM(:supplier_id)
   AND d.DCDSITE = :site_id
   AND e.STATUT  IN ('3','5')
   AND e.ECDDATE BETWEEN TO_DATE(:date_from, 'YYYY-MM-DD')
                     AND TO_DATE(:date_to,   'YYYY-MM-DD')
 ORDER BY e.ECDDATE DESC
 FETCH FIRST 200 ROWS ONLY~',
    '[{"name":"supplier_id","type":"STRING","required":true},{"name":"site_id","type":"STRING","required":true},{"name":"date_from","type":"STRING","required":true},{"name":"date_to","type":"STRING","required":true}]',
    'CDEENTCDE@HEINENS_CEN_PROD, CDEDETCDE@HEINENS_CEN_PROD, FOUDGENE@HEINENS_CEN_PROD'
);

-- Template: recent receipt movements at site
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'F1A2B3C4-D5E6-7890-ABCD-111111111103',
    'DELIVERY_RECENT_MOVEMENTS',
    'Recent receipt movements at site',
    'STOMVT movements for supplier at site — confirms what was actually received vs what was ordered.',
    q'~SELECT m.STMSITE  AS site,
       m.CODART   AS item_internal,
       m.TYPMVT   AS movement_type,
       m.DATMVT   AS received_date,
       m.QTESAI   AS received_qty
  FROM STOMVT@HEINENS_CEN_PROD   m
  JOIN ARTUC@HEINENS_CEN_PROD    u ON u.ARACINR = m.CODART
  JOIN FOUDGENE@HEINENS_CEN_PROD f ON f.FOUCFIN = u.ARACFIN
 WHERE TRIM(f.FOUCNUF) = TRIM(:supplier_id)
   AND m.STMSITE = :site_id
   AND m.STMDMVT BETWEEN TO_DATE(:date_from, 'YYYY-MM-DD')
                     AND TO_DATE(:date_to,   'YYYY-MM-DD')
 ORDER BY m.DATMVT DESC
 FETCH FIRST 500 ROWS ONLY~',
    '[{"name":"supplier_id","type":"STRING","required":true},{"name":"site_id","type":"STRING","required":true},{"name":"date_from","type":"STRING","required":true},{"name":"date_to","type":"STRING","required":true}]',
    'STOMVT@HEINENS_CEN_PROD, ARTUC@HEINENS_CEN_PROD, FOUDGENE@HEINENS_CEN_PROD'
);

COMMIT;
