-- =============================================================================
-- Supply Chain AI — Loadable skill pack: DSD vendor (retail industry)
-- =============================================================================
-- Prerequisite: deployment/database/SCRIPTS/08_skill_engine.sql (tables).
-- Creates one TEMPLATE skill + knowledge, playbook, SQL templates, vocabulary,
-- and test cases. Safe to re-run: deletes bundle rows for this skill_id first.
--
-- Skill library: filter retailer_id = 'TEMPLATE', skill_code = 'DSD_VENDOR_RETAIL'
-- (distinct from seed row DSD_VENDOR so UQ_RETAILER_CODE_VERSION is not violated).
--
-- GOLD data in sql_text: use TABLE@<DB_LINK> only (e.g. ARTUC@HEINENS_CEN_PROD).
-- Do not use CEN.TABLE@link — ICR runs on the app DB; GOLD is reached only via the link.
-- Replace HEINENS_CEN_PROD with the link name from retailer CORPENV when deploying.
-- =============================================================================

DELETE FROM AI_SKILL_TEST_CASE      WHERE skill_id = 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL_VOCABULARY     WHERE skill_id = 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL_SQL_TEMPLATE   WHERE skill_id = 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL_PLAYBOOK_STEP  WHERE skill_id = 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL_KNOWLEDGE_ITEM WHERE skill_id = 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL_VERSION        WHERE skill_id = 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL_RETAILER       WHERE skill_id = 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB';
DELETE FROM AI_SKILL                WHERE skill_id = 'E1D2C3B4-A5B6-7890-CDEF-1234567890AB';

INSERT INTO AI_SKILL (
    skill_id, retailer_id, skill_code, skill_name, domain,
    description, version, status, created_by, created_at, updated_at
) VALUES (
    'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',
    'TEMPLATE',
    'DSD_VENDOR_RETAIL',
    'DSD vendor — retail operations',
    'DSD',
    'Direct store delivery: route compliance, delivery windows, invoice vs receipt, short/overage, vendor master, and site receiving for grocery retail.',
    1.0,
    'DRAFT',
    'SYSTEM',
    SYSTIMESTAMP,
    SYSTIMESTAMP
);

-- ---------------------------------------------------------------------------
-- Knowledge items (Q&A / context learning anchors)
-- ---------------------------------------------------------------------------
INSERT INTO AI_SKILL_KNOWLEDGE_ITEM (
    skill_id, base_knowledge_key, override_mode, knowledge_key, label, description,
    anchor_question, rounds_json, validation_sql, priority, is_mandatory
) VALUES (
    'E1D2C3B4-A5B6-7890-CDEF-1234567890AB', NULL, 'EXTEND', 'DSD_ROUTE_WINDOW',
    'Scheduled delivery window',
    'How the retailer defines on-time DSD arrival vs grace minutes.',
    'Walk me through how this banner defines an on-time DSD delivery versus late — including grace time, cut-off, and who owns the exception (store vs vendor vs transportation).',
    q'~[{"round":2,"question":"Where is the route stop sequence stored and who can override it same-day?"},{"round":3,"question":"What GOLD evidence proves the truck checked in at the dock?"}]~',
    NULL,
    1, 1
);

INSERT INTO AI_SKILL_KNOWLEDGE_ITEM (
    skill_id, base_knowledge_key, override_mode, knowledge_key, label, description,
    anchor_question, rounds_json, validation_sql, priority, is_mandatory
) VALUES (
    'E1D2C3B4-A5B6-7890-CDEF-1234567890AB', NULL, 'EXTEND', 'DSD_INVOICE_MATCH',
    'Invoice vs physical receipt',
    'Three-way style match for DSD: PO, receipt, invoice.',
    'When a store says the DSD invoice does not match what was received, what is the authoritative sequence of documents in GOLD and which status codes mean we should pay, hold, or dispute?',
    q'~[{"round":2,"question":"Which movement types post DSD receipt and reversal?"},{"round":3,"question":"How is a vendor credit expected to appear if quantity was short?"}]~',
    NULL,
    1, 1
);

INSERT INTO AI_SKILL_KNOWLEDGE_ITEM (
    skill_id, base_knowledge_key, override_mode, knowledge_key, label, description,
    anchor_question, rounds_json, validation_sql, priority, is_mandatory
) VALUES (
    'E1D2C3B4-A5B6-7890-CDEF-1234567890AB', NULL, 'EXTEND', 'DSD_SITE_RECEIVING',
    'Site receiving profile',
    'Which sites accept DSD and cross-dock rules.',
    'How do we know if a site is allowed to receive this vendor direct (DSD eligible) versus warehouse-only, and what happens to an ASN if the site profile is wrong?',
    q'~[{"round":2,"question":"Which tables tie vendor to site for DSD eligibility?"}]~',
    NULL,
    2, 1
);

INSERT INTO AI_SKILL_KNOWLEDGE_ITEM (
    skill_id, base_knowledge_key, override_mode, knowledge_key, label, description,
    anchor_question, rounds_json, validation_sql, priority, is_mandatory
) VALUES (
    'E1D2C3B4-A5B6-7890-CDEF-1234567890AB', NULL, 'EXTEND', 'DSD_TEMP_CHAIN',
    'Temperature-sensitive DSD',
    'Chilled / frozen compliance.',
    'For temperature-controlled DSD categories, what evidence do we require when the store reports a warm chain break, and what is the maximum acceptable delay at dock?',
    q'~[{"round":2,"question":"Is there a separate receiving workflow for chill vs ambient for this vendor?"}]~',
    NULL,
    2, 0
);

-- ---------------------------------------------------------------------------
-- Playbook steps (investigation order by complaint_type)
-- ---------------------------------------------------------------------------
INSERT INTO AI_SKILL_PLAYBOOK_STEP (
    skill_id, complaint_type, step_order, step_code, step_label, hypothesis_tested,
    gold_schema, gold_table, key_columns, evidence_fact_type, is_mandatory,
    insert_position, insert_after_step
) VALUES (
    'E1D2C3B4-A5B6-7890-CDEF-1234567890AB', 'MISSED_DROPOFF', 10, 'DSD_PB_SITE_VENDOR',
    'Confirm site–vendor DSD eligibility',
    'Site not configured for DSD or vendor blocked for site',
    'GOLD@LINK', 'ARTSITE', 'CODESIT, TYPSIT', 'SITE_MASTER', 1, 'APPEND', NULL
);

INSERT INTO AI_SKILL_PLAYBOOK_STEP (
    skill_id, complaint_type, step_order, step_code, step_label, hypothesis_tested,
    gold_schema, gold_table, key_columns, evidence_fact_type, is_mandatory,
    insert_position, insert_after_step
) VALUES (
    'E1D2C3B4-A5B6-7890-CDEF-1234567890AB', 'MISSED_DROPOFF', 20, 'DSD_PB_RECEIPT',
    'Look for posted receipt without invoice',
    'Receipt posted but invoice missing or held',
    'GOLD@LINK', 'STOMVT', 'CODESIT, DATMVT, TYPMVT', 'MOVEMENT_FACT', 1, 'APPEND', NULL
);

INSERT INTO AI_SKILL_PLAYBOOK_STEP (
    skill_id, complaint_type, step_order, step_code, step_label, hypothesis_tested,
    gold_schema, gold_table, key_columns, evidence_fact_type, is_mandatory,
    insert_position, insert_after_step
) VALUES (
    'E1D2C3B4-A5B6-7890-CDEF-1234567890AB', 'SHORT_SHIPMENT', 10, 'DSD_PB_PO_LINE',
    'Compare ordered vs received quantities',
    'Short pick at vendor or partial delivery',
    'GOLD@LINK', 'CDEDETCDE', 'DCDCINCDE, DCDCEXCDE, DCDCINR, DCDQTEC', 'PO_LINE_FACT', 1, 'APPEND', NULL
);

INSERT INTO AI_SKILL_PLAYBOOK_STEP (
    skill_id, complaint_type, step_order, step_code, step_label, hypothesis_tested,
    gold_schema, gold_table, key_columns, evidence_fact_type, is_mandatory,
    insert_position, insert_after_step
) VALUES (
    'E1D2C3B4-A5B6-7890-CDEF-1234567890AB', 'SHORT_SHIPMENT', 20, 'DSD_PB_LAYER',
    'Stock layer / last movement before claim',
    'Inventory layer shows shrink before delivery',
    'GOLD@LINK', 'STOCOUCH', 'CODESIT, CODART, QTESAI', 'STOCK_LAYER', 1, 'APPEND', NULL
);

INSERT INTO AI_SKILL_PLAYBOOK_STEP (
    skill_id, complaint_type, step_order, step_code, step_label, hypothesis_tested,
    gold_schema, gold_table, key_columns, evidence_fact_type, is_mandatory,
    insert_position, insert_after_step
) VALUES (
    'E1D2C3B4-A5B6-7890-CDEF-1234567890AB', 'WRONG_ITEM_DSD', 10, 'DSD_PB_ARTICLE',
    'Validate delivered article vs ordered',
    'Wrong LU shipped on same vendor route',
    'GOLD@LINK', 'ARTRAC', 'ARTCEXR, ARTCINR', 'ARTICLE_MASTER', 1, 'APPEND', NULL
);

INSERT INTO AI_SKILL_PLAYBOOK_STEP (
    skill_id, complaint_type, step_order, step_code, step_label, hypothesis_tested,
    gold_schema, gold_table, key_columns, evidence_fact_type, is_mandatory,
    insert_position, insert_after_step
) VALUES (
    'E1D2C3B4-A5B6-7890-CDEF-1234567890AB', 'INVOICE_DISPUTE', 10, 'DSD_PB_INVOICE_HEADER',
    'Invoice header status vs receipt date',
    'Invoice dated before physical receipt window',
    'GOLD@LINK', 'CDEENTCDE', 'NUMCDE, DATCDE, STATUT', 'PO_HEADER_FACT', 1, 'APPEND', NULL
);

-- ---------------------------------------------------------------------------
-- Engine routing — entity resolution (skill-owned; executed from /engine/route)
-- ---------------------------------------------------------------------------
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',
    'ENGINE_VENDOR_RESOLVE',
    'Resolve vendor text to supplier candidates',
    'Router step: map free-text vendor name/code to FOUDGENE rows. Handles "lipari 06966" / "06966 lipari" / pure code / pure name. Not used for /engine/execute listing.',
    q'~SELECT supplier_id,
       supplier_name,
       score
  FROM (
        SELECT f.FOUCNUF AS supplier_id,
               f.FOULIBL AS supplier_name,
               CASE
                 -- Exact code match (digits-only input)
                 WHEN UPPER(f.FOUCNUF) = UPPER(TRIM(:vendor_text)) THEN 100
                 -- Embedded code match: "lipari 06966" or "06966 lipari"
                 WHEN REGEXP_SUBSTR(:vendor_text, '\d{3,}') IS NOT NULL
                      AND UPPER(f.FOUCNUF) = UPPER(REGEXP_SUBSTR(:vendor_text, '\d{3,}'))
                      THEN 98
                 -- Exact name match
                 WHEN UPPER(f.FOULIBL) = UPPER(TRIM(:vendor_text)) THEN 95
                 -- Name prefix match
                 WHEN UPPER(f.FOULIBL) LIKE UPPER(TRIM(:vendor_text)) || '%' THEN 85
                 -- Alpha-only portion of input matches name (e.g. strips "06966" from "lipari 06966")
                 WHEN LENGTH(TRIM(REGEXP_REPLACE(:vendor_text, '[^A-Za-z ]+', ' '))) >= 3
                      AND UPPER(f.FOULIBL) LIKE '%' || UPPER(TRIM(REGEXP_REPLACE(:vendor_text, '[^A-Za-z ]+', ' '))) || '%'
                      THEN 80
                 -- Raw substring fallback
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
    q'~[{"name":"vendor_text","type":"STRING"},{"name":"retailer_id","type":"STRING"}]~',
    'FOUDGENE'
);

-- ---------------------------------------------------------------------------
-- SQL templates (parameterized fragments — adapt schema prefix per retailer)
-- ---------------------------------------------------------------------------
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',
    'DSD_SITE_VENDOR_ACTIVE',
    'Site–vendor DSD context row',
    'Returns bind echo plus SYSDATE for wiring test; replace FROM clause with ARTSITE / vendor join when schema is bound.',
    q'~SELECT :site_id AS site_id,
       :supplier_id AS supplier_id,
       SYSDATE AS checked_at
  FROM dual~',
    q'~[{"name":"site_id","type":"STRING"},{"name":"supplier_id","type":"STRING"}]~',
    'ARTSITE (intent)'
);

INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',
    'DSD_VENDOR_CODE_LOOKUP',
    'Vendor code lookup by free-text name',
    'Returns supplier code/name by parsing vendor text from question_text, without requiring pre-resolved supplier_id.',
    q'~WITH q AS (
       SELECT TRIM(
                  REGEXP_REPLACE(
                      REGEXP_REPLACE(LOWER(:question_text), '.*\b(vendor|supplier)\s+code\s+(for|of)\s*', ''),
                      '\?', ''
                  )
              ) AS vendor_guess
         FROM dual
)
SELECT f.FOUCNUF AS supplier_id,
       f.FOULIBL AS supplier_name,
       'Vendor code for ' || f.FOULIBL || ' is ' || f.FOUCNUF AS answer_text
  FROM FOUDGENE@HEINENS_CEN_PROD f, q
 WHERE q.vendor_guess IS NOT NULL
   AND q.vendor_guess <> ''
   AND (UPPER(f.FOULIBL) LIKE '%' || UPPER(q.vendor_guess) || '%'
        OR UPPER(f.FOUCNUF) = UPPER(q.vendor_guess))
 ORDER BY CASE WHEN UPPER(f.FOUCNUF) = UPPER(q.vendor_guess) THEN 0 ELSE 1 END,
          LENGTH(f.FOULIBL)
 FETCH FIRST 20 ROWS ONLY~',
    q'~[{"name":"question_text","type":"STRING","required":true}]~',
    'FOUDGENE'
);

INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',
    'DSD_PO_OPEN_LINES',
    'Open PO lines for supplier',
    'Open PO detail lines: CDEDETCDE ↔ CDEENTCDE on DCDCINCDE = ECDCINCDE; supplier via FOUDGENE (ECDCFIN = FOUCFIN). Columns match GOLD DET (not NUMCDE/NUMLIG).',
    q'~SELECT d.DCDCINCDE,
       d.DCDCEXCDE,
       d.DCDCINR,
       d.DCDQTEC,
       d.DCDSITE,
       d.DCDETAT
  FROM CDEDETCDE@HEINENS_CEN_PROD d
 WHERE d.DCDCINCDE IN (
       SELECT e.ECDCINCDE
         FROM CDEENTCDE@HEINENS_CEN_PROD e
         JOIN FOUDGENE@HEINENS_CEN_PROD f
           ON e.ECDCFIN = f.FOUCFIN
        WHERE TRIM(f.FOUCNUF) = TRIM(:supplier_id)
          AND e.STATUT IN ('3','5')
    )
   AND ROWNUM <= 200~',
    q'~[{"name":"supplier_id","type":"STRING"}]~',
    'CDEENTCDE, CDEDETCDE'
);

INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',
    'DSD_RECENT_MOVEMENTS',
    'Recent stock movements at site',
    'Narrow window on STOMVT for receiving anomalies — bind dates from app.',
    q'~SELECT m.CODART, m.TYPMVT, m.DATMVT, m.QTESAI
  FROM STOMVT@HEINENS_CEN_PROD m
 WHERE m.STMSITE = :site_id
   AND m.STMDMVT BETWEEN TO_DATE(:date_from, 'YYYY-MM-DD')
                    AND TO_DATE(:date_to, 'YYYY-MM-DD')
   AND ROWNUM <= 500~',
    q'~[{"name":"site_id","type":"STRING"},{"name":"date_from","type":"STRING"},{"name":"date_to","type":"STRING"}]~',
    'STOMVT'
);

INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',
    'DSD_ARTICLE_SITE_STATUS',
    'Article–site ranged / active flags',
    'Uses ARTSITE for item-site status — adjust schema.',
    q'~SELECT t.ARVCEXR, s.SITSITE, t.ARVETAT /* if link then active, s.DATDEB, s.DATFIN */
  FROM ARTSITE@HEINENS_CEN_PROD s, ARTUV@HEINENS_CEN_PROD t
 WHERE s.SITCINV = :lu_id
   AND s.SITCINV = t.ARVCINV
   AND s.SITSITE = :site_id~',
    q'~[{"name":"lu_id","type":"STRING"},{"name":"site_id","type":"STRING"}]~',
    'ARTSITE'
);

-- ---------------------------------------------------------------------------
-- Phase 4 inquiry artifact — "items I can buy from vendor"
-- ---------------------------------------------------------------------------
INSERT INTO AI_SKILL_KNOWLEDGE_ITEM (
    skill_id, base_knowledge_key, override_mode, knowledge_key, label, description,
    anchor_question, rounds_json, validation_sql, priority, is_mandatory
) VALUES (
    'E1D2C3B4-A5B6-7890-CDEF-1234567890AB', NULL, 'EXTEND', 'DSD_BUYABLE_ITEMS_VENDOR',
    'Buyable items by vendor',
    'Business definition of buyable assortment by supplier (active/ranged/orderable filters).',
    'When a user asks "Which items can I buy from vendor X?", what exact filters define buyable for this retailer (active, ranged, supplier-site eligibility, status exclusions)?',
    q'~[{"round":2,"question":"Is buyable global or site-specific by default?"},{"round":3,"question":"Which statuses must be excluded (hold/recall/delist)?"}]~',
    NULL,
    1, 1
);

INSERT INTO AI_SKILL_PLAYBOOK_STEP (
    skill_id, complaint_type, step_order, step_code, step_label, hypothesis_tested,
    gold_schema, gold_table, key_columns, evidence_fact_type, is_mandatory,
    insert_position, insert_after_step
) VALUES (
    'E1D2C3B4-A5B6-7890-CDEF-1234567890AB', 'VENDOR_BUYABLE_ITEMS', 10, 'DSD_PB_VENDOR_RESOLVE',
    'Resolve vendor identity',
    'Input vendor name/code maps to canonical supplier id',
    'GOLD@LINK', 'FOUFILIE', 'CODFOU, LIBFOU', 'SUPPLIER_MASTER', 1, 'APPEND', NULL
);

INSERT INTO AI_SKILL_PLAYBOOK_STEP (
    skill_id, complaint_type, step_order, step_code, step_label, hypothesis_tested,
    gold_schema, gold_table, key_columns, evidence_fact_type, is_mandatory,
    insert_position, insert_after_step
) VALUES (
    'E1D2C3B4-A5B6-7890-CDEF-1234567890AB', 'VENDOR_BUYABLE_ITEMS', 20, 'DSD_PB_BUYABLE_FILTER',
    'Apply buyable filters and return list',
    'Item list matches active/ranged/orderable policy for vendor',
    'GOLD@LINK', 'ARTRAC', 'ARTCEXR, ARTCINR', 'ITEM_LIST_RESULT', 1, 'APPEND', NULL
);

INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',
    'DSD_VENDOR_BUYABLE_ITEMS',
    'Buyable items list by vendor (optional site filter)',
    'ARTUC+FOUDGENE buyable list. Store filter: pkresrel.isSiteBelongToNode(1,:site_id,ARASITE,''1''). NULL :site_id returns all networks.',
    q'~SELECT DISTINCT
       u.ARACEXR     AS item_lu,
       u.ARACINR     AS item_internal,
       u.ARASITE     AS network_node,
       g.FOUCNUF     AS supplier_id,
       g.FOULIBL     AS supplier_name
  FROM ARTUC@HEINENS_CEN_PROD u
  JOIN FOUDGENE@HEINENS_CEN_PROD g
    ON g.FOUCFIN = u.ARACFIN
 WHERE TRIM(g.FOUCNUF) = TRIM(:supplier_id)
   AND TO_DATE(:as_of_date, 'YYYY-MM-DD') BETWEEN u.ARADDEB AND u.ARADFIN
   AND ( :site_id IS NULL
         OR pkresrel.isSiteBelongToNode@HEINENS_CEN_PROD(
                1,
                TO_NUMBER(TRIM(:site_id)),
                u.ARASITE,
                '1'
            ) = 1
       )
 ORDER BY u.ARASITE, u.ARACEXR~',
    q'~[{"name":"supplier_id","type":"STRING","required":true},{"name":"site_id","type":"STRING","required":false},{"name":"as_of_date","type":"STRING","required":true}]~',
    'ARTUC, FOUDGENE'
);

-- ---------------------------------------------------------------------------
-- Vocabulary (routing / retail DSD language)
-- ---------------------------------------------------------------------------
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('E1D2C3B4-A5B6-7890-CDEF-1234567890AB', 'direct store delivery', 'DSD_ROUTE', 'SYNONYM', 'EN', 1.1);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('E1D2C3B4-A5B6-7890-CDEF-1234567890AB', 'DSD', 'DSD_ROUTE', 'ABBREVIATION', 'EN', 1.2);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('E1D2C3B4-A5B6-7890-CDEF-1234567890AB', 'vendor route', 'DSD_ROUTE', 'SYNONYM', 'EN', 1.05);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('E1D2C3B4-A5B6-7890-CDEF-1234567890AB', 'broker', 'DSD_VENDOR_CLASS', 'SYNONYM', 'EN', 1.1);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('E1D2C3B4-A5B6-7890-CDEF-1234567890AB', 'distributor', 'DSD_VENDOR_CLASS', 'SYNONYM', 'EN', 1.1);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('E1D2C3B4-A5B6-7890-CDEF-1234567890AB', 'manufacturer', 'DSD_VENDOR_CLASS', 'SYNONYM', 'EN', 1.05);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('E1D2C3B4-A5B6-7890-CDEF-1234567890AB', 'backhaul', 'DSD_TRANSPORT', 'JARGON', 'EN', 1.0);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('E1D2C3B4-A5B6-7890-CDEF-1234567890AB', 'drop trailer', 'DSD_DOCK', 'PROCESS_TERM', 'EN', 1.0);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('E1D2C3B4-A5B6-7890-CDEF-1234567890AB', 'short delivery', 'SHORT_SHIPMENT', 'SYNONYM', 'EN', 1.15);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('E1D2C3B4-A5B6-7890-CDEF-1234567890AB', 'invoice mismatch', 'INVOICE_DISPUTE', 'SYNONYM', 'EN', 1.1);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('E1D2C3B4-A5B6-7890-CDEF-1234567890AB', 'ASN', 'DSD_ASN', 'ABBREVIATION', 'EN', 1.0);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('E1D2C3B4-A5B6-7890-CDEF-1234567890AB', 'proof of delivery', 'DSD_POD', 'PROCESS_TERM', 'EN', 1.0);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('E1D2C3B4-A5B6-7890-CDEF-1234567890AB', 'bread vendor', 'DSD_VENDOR_CLASS', 'BRAND_TERM', 'EN', 0.95);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('E1D2C3B4-A5B6-7890-CDEF-1234567890AB', 'milk delivery', 'DSD_TEMP_CHAIN', 'SYNONYM', 'EN', 1.05);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('E1D2C3B4-A5B6-7890-CDEF-1234567890AB', 'receiving window', 'DSD_ROUTE_WINDOW', 'SYNONYM', 'EN', 1.1);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('E1D2C3B4-A5B6-7890-CDEF-1234567890AB', 'which items can i buy from', 'VENDOR_BUYABLE_ITEMS', 'PROCESS_TERM', 'EN', 1.4);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('E1D2C3B4-A5B6-7890-CDEF-1234567890AB', 'items by vendor', 'VENDOR_BUYABLE_ITEMS', 'PROCESS_TERM', 'EN', 1.3);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('E1D2C3B4-A5B6-7890-CDEF-1234567890AB', 'vendor code', 'VENDOR_CODE_LOOKUP', 'PROCESS_TERM', 'EN', 1.4);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('E1D2C3B4-A5B6-7890-CDEF-1234567890AB', 'supplier code', 'VENDOR_CODE_LOOKUP', 'SYNONYM', 'EN', 1.3);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('E1D2C3B4-A5B6-7890-CDEF-1234567890AB', 'code for vendor', 'VENDOR_CODE_LOOKUP', 'PROCESS_TERM', 'EN', 1.25);

-- ---------------------------------------------------------------------------
-- Test suite (simulated store / AP complaints)
-- ---------------------------------------------------------------------------
INSERT INTO AI_SKILL_TEST_CASE (
    skill_id, test_name, complaint_text, complaint_type,
    expected_root_cause, expected_confidence, expected_steps_min
) VALUES (
    'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',
    'Missed Tuesday bread drop',
    'Store 1042 reports the Tuesday bread vendor never showed; shelf empty by 2pm. Need to know if it is a route skip vs site block.',
    'MISSED_DROPOFF',
    'DSD_ROUTE',
    'PROBABLE',
    2
);

INSERT INTO AI_SKILL_TEST_CASE (
    skill_id, test_name, complaint_text, complaint_type,
    expected_root_cause, expected_confidence, expected_steps_min
) VALUES (
    'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',
    'Invoice higher than received cases',
    'AP holding payment: invoice shows 24 cases, receiving signed for 20 on same PO line.',
    'INVOICE_DISPUTE',
    'DSD_INVOICE_MATCH',
    'PROBABLE',
    1
);

INSERT INTO AI_SKILL_TEST_CASE (
    skill_id, test_name, complaint_text, complaint_type,
    expected_root_cause, expected_confidence, expected_steps_min
) VALUES (
    'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',
    'Wrong SKU on DSD pallet',
    'Receiving scanned vendor pallet; inner packs are a different LU than ordered on the DSD PO.',
    'WRONG_ITEM_DSD',
    'WRONG_ITEM_DSD',
    'CONFIRMED',
    1
);

INSERT INTO AI_SKILL_TEST_CASE (
    skill_id, test_name, complaint_text, complaint_type,
    expected_root_cause, expected_confidence, expected_steps_min
) VALUES (
    'E1D2C3B4-A5B6-7890-CDEF-1234567890AB',
    'Items buyable from Lipari',
    'Which items can I buy from LIPARI for site 1042 this week?',
    'VENDOR_BUYABLE_ITEMS',
    'DSD_BUYABLE_ITEMS_VENDOR',
    'PROBABLE',
    2
);

COMMIT;

-- =============================================================================
-- After load: open Skill library in ICR (S20) — template **DSD_VENDOR_RETAIL**
-- skill_id for API/LIBQUERY: E1D2C3B4-A5B6-7890-CDEF-1234567890AB
-- =============================================================================
