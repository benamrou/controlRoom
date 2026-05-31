-- =============================================================================
-- Diagnostic Skill: PRICE_NOT_LOADING
-- "Why is item X showing no price at store Y?" / "Why is retail missing?"
-- Deploy after: 37_diagnostic_chain_tables.sql, 38_diagnostic_chain_libquery.sql
-- =============================================================================

DELETE FROM AI_DIAGNOSTIC_STEP      WHERE SKILL_ID = 'DA000005-D100-4A00-8100-D10000000005';
DELETE FROM AI_SKILL_VOCABULARY     WHERE skill_id = 'DA000005-D100-4A00-8100-D10000000005';
DELETE FROM AI_SKILL_SQL_TEMPLATE   WHERE skill_id = 'DA000005-D100-4A00-8100-D10000000005';
DELETE FROM AI_SKILL_PLAYBOOK_STEP  WHERE skill_id = 'DA000005-D100-4A00-8100-D10000000005';
DELETE FROM AI_SKILL_KNOWLEDGE_ITEM WHERE skill_id = 'DA000005-D100-4A00-8100-D10000000005';
DELETE FROM AI_SKILL_VERSION        WHERE skill_id = 'DA000005-D100-4A00-8100-D10000000005';
DELETE FROM AI_SKILL_RETAILER       WHERE skill_id = 'DA000005-D100-4A00-8100-D10000000005';
DELETE FROM AI_SKILL                WHERE skill_id = 'DA000005-D100-4A00-8100-D10000000005';

INSERT INTO AI_SKILL (
    skill_id, retailer_id, skill_code, skill_name, domain,
    description, version, status, created_by, created_at, updated_at
) VALUES (
    'DA000005-D100-4A00-8100-D10000000005',
    'TEMPLATE',
    'PRICE_NOT_LOADING',
    'Retail price not loading - root cause',
    'PRICING',
    'Diagnoses why no retail price appears for an item at a store. Checks variant existence, active AVEPRIX rows, tariff validity, and AVESCOPE site coverage.',
    1.0, 'DRAFT', 'SYSTEM', SYSTIMESTAMP, SYSTIMESTAMP
);

INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000005-D100-4A00-8100-D10000000005', 'why is price missing',           'PRICE_MISSING', 'INTENT_PHRASE', 'EN', 1.9);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000005-D100-4A00-8100-D10000000005', 'retail not loading',             'PRICE_MISSING', 'INTENT_PHRASE', 'EN', 1.9);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000005-D100-4A00-8100-D10000000005', 'why no price at store',          'PRICE_MISSING', 'INTENT_PHRASE', 'EN', 1.8);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000005-D100-4A00-8100-D10000000005', 'item shows no retail',           'PRICE_MISSING', 'INTENT_PHRASE', 'EN', 1.8);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000005-D100-4A00-8100-D10000000005', 'price not set',                  'PRICE_MISSING', 'SYNONYM',       'EN', 1.5);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000005-D100-4A00-8100-D10000000005', 'tariff expired',                 'TARIFF_EXPIRED', 'PROCESS_TERM', 'EN', 1.4);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000005-D100-4A00-8100-D10000000005', 'aveprix',                        'PRICE_MISSING', 'JARGON',        'EN', 1.6);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000005-D100-4A00-8100-D10000000005', 'avetar',                         'PRICE_MISSING', 'JARGON',        'EN', 1.4);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000005-D100-4A00-8100-D10000000005', 'item',                           'lu_id',         'BIND_HINT',     'EN', 1.0);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('DA000005-D100-4A00-8100-D10000000005', 'at store',                       'site_id',       'BIND_HINT',     'EN', 1.0);

-- Step 1: Check variant existence + AVEPRIX row count
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'DA000005-D100-4A00-8100-D10000000005',
    'PRICE_CHK_AVEPRIX',
    'Variant + AVEPRIX row check',
    'Returns VARIANT_COUNT (sale variants for LU), PRICE_ROWS (any AVEPRIX), ACTIVE_PRICE_ROWS (today), PRICE_DIAGNOSIS.',
    q'~SELECT NVL(v.VARIANT_COUNT, 0) AS VARIANT_COUNT,
       NVL(p.PRICE_ROWS, 0)       AS PRICE_ROWS,
       NVL(p.ACTIVE_ROWS, 0)      AS ACTIVE_ROWS,
       CASE
           WHEN NVL(v.VARIANT_COUNT, 0) = 0 THEN 'NO_VARIANT'
           WHEN NVL(p.PRICE_ROWS, 0) = 0    THEN 'NO_PRICE_ROW'
           WHEN NVL(p.ACTIVE_ROWS, 0) = 0   THEN 'PRICE_EXPIRED'
           ELSE                                  'PRICE_EXISTS'
       END AS PRICE_DIAGNOSIS
  FROM (
       SELECT COUNT(*) AS VARIANT_COUNT
         FROM ARTUV@HEINENS_CEN_PROD uv
         JOIN ARTRAC@HEINENS_CEN_PROD ar ON ar.ARTCINR = uv.ARVCINR
        WHERE ar.ARTCEXR = :lu_id
  ) v,
  (
       SELECT COUNT(*)                                          AS PRICE_ROWS,
              SUM(CASE WHEN t.AVEDDEB <= TRUNC(SYSDATE)
                        AND t.AVEDFIN >= TRUNC(SYSDATE) THEN 1 ELSE 0 END) AS ACTIVE_ROWS
         FROM AVEPRIX@HEINENS_CEN_PROD  px
         JOIN ARTUV@HEINENS_CEN_PROD    uv ON uv.ARVCINV = px.AVICINV
         JOIN ARTRAC@HEINENS_CEN_PROD   ar ON ar.ARTCINR = uv.ARVCINR
         JOIN AVETAR@HEINENS_CEN_PROD   t  ON t.AVENTAR = px.AVINTAR
        WHERE ar.ARTCEXR = :lu_id
  ) p~',
    '[{"name":"lu_id","type":"STRING","required":true}]',
    'ARTUV@HEINENS_CEN_PROD, ARTRAC@HEINENS_CEN_PROD, AVEPRIX@HEINENS_CEN_PROD, AVETAR@HEINENS_CEN_PROD'
);

-- Step 2: Check AVESCOPE site coverage for active tariffs
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'DA000005-D100-4A00-8100-D10000000005',
    'PRICE_CHK_SCOPE',
    'AVESCOPE site coverage check',
    'Returns SCOPE_ROWS covering this site for active tariffs. 0 = tariff exists but site not in scope.',
    q'~SELECT COUNT(*) AS SCOPE_ROWS,
       MAX(TO_CHAR(t.AVEDFIN,'YYYY-MM-DD')) AS TARIFF_EXPIRES
  FROM AVEPRIX@HEINENS_CEN_PROD  px
  JOIN ARTUV@HEINENS_CEN_PROD    uv ON uv.ARVCINV = px.AVICINV
  JOIN ARTRAC@HEINENS_CEN_PROD   ar ON ar.ARTCINR  = uv.ARVCINR
  JOIN AVETAR@HEINENS_CEN_PROD   t  ON t.AVENTAR   = px.AVINTAR
  JOIN AVESCOPE@HEINENS_CEN_PROD sc ON sc.AVONTAR   = t.AVENTAR
 WHERE ar.ARTCEXR  = :lu_id
   AND t.AVEDDEB  <= TRUNC(SYSDATE)
   AND t.AVEDFIN  >= TRUNC(SYSDATE)
   AND px.AVIDDEB <= TRUNC(SYSDATE)
   AND px.AVIDFIN >= TRUNC(SYSDATE)
   AND sc.AVODDEB <= TRUNC(SYSDATE)
   AND sc.AVODFIN >= TRUNC(SYSDATE)
   AND (sc.AVORESCINT = TO_NUMBER(TRIM(:site_id))
        OR pkresrel.isSiteBelongToNode@HEINENS_CEN_PROD(1, TO_NUMBER(TRIM(:site_id)), sc.AVORESCINT, '1') = 1)~',
    '[{"name":"lu_id","type":"STRING","required":true},{"name":"site_id","type":"STRING","required":true}]',
    'AVEPRIX@HEINENS_CEN_PROD, ARTUV@HEINENS_CEN_PROD, ARTRAC@HEINENS_CEN_PROD, AVETAR@HEINENS_CEN_PROD, AVESCOPE@HEINENS_CEN_PROD'
);

-- Diagnostic steps
INSERT INTO AI_DIAGNOSTIC_STEP (SKILL_ID, STEP_ORDER, TEMPLATE_CODE, STOP_FIELD, STOP_OPERATOR, STOP_VALUE, CONCLUSION_KEY, STEP_LABEL)
VALUES ('DA000005-D100-4A00-8100-D10000000005', 1, 'PRICE_CHK_AVEPRIX', 'PRICE_DIAGNOSIS', '=', 'NO_VARIANT', 'PRICE_NO_VARIANT', 'Variant + AVEPRIX existence check');

INSERT INTO AI_DIAGNOSTIC_STEP (SKILL_ID, STEP_ORDER, TEMPLATE_CODE, STOP_FIELD, STOP_OPERATOR, STOP_VALUE, CONCLUSION_KEY, STEP_LABEL)
VALUES ('DA000005-D100-4A00-8100-D10000000005', 1, 'PRICE_CHK_AVEPRIX', 'PRICE_DIAGNOSIS', '=', 'NO_PRICE_ROW', 'PRICE_NO_AVEPRIX', 'Variant + AVEPRIX existence check');

INSERT INTO AI_DIAGNOSTIC_STEP (SKILL_ID, STEP_ORDER, TEMPLATE_CODE, STOP_FIELD, STOP_OPERATOR, STOP_VALUE, CONCLUSION_KEY, STEP_LABEL)
VALUES ('DA000005-D100-4A00-8100-D10000000005', 1, 'PRICE_CHK_AVEPRIX', 'PRICE_DIAGNOSIS', '=', 'PRICE_EXPIRED', 'PRICE_TARIFF_EXPIRED', 'Variant + AVEPRIX existence check');

INSERT INTO AI_DIAGNOSTIC_STEP (SKILL_ID, STEP_ORDER, TEMPLATE_CODE, STOP_FIELD, STOP_OPERATOR, STOP_VALUE, CONCLUSION_KEY, STEP_LABEL)
VALUES ('DA000005-D100-4A00-8100-D10000000005', 2, 'PRICE_CHK_SCOPE', 'SCOPE_ROWS', '=', '0', 'PRICE_SCOPE_GAP', 'AVESCOPE site coverage check');

-- Conclusions
DELETE FROM AI_DIAGNOSTIC_CONCLUSION WHERE CONCLUSION_KEY IN (
    'PRICE_NO_VARIANT','PRICE_NO_AVEPRIX','PRICE_TARIFF_EXPIRED','PRICE_SCOPE_GAP'
) AND RETAILER_ID = 'TEMPLATE';

INSERT INTO AI_DIAGNOSTIC_CONCLUSION (CONCLUSION_KEY, RETAILER_ID, SUMMARY_TEMPLATE, EVIDENCE_TEMPLATE, FOLLOW_UP_TEMPLATE, SEVERITY)
VALUES (
    'PRICE_NO_VARIANT', 'TEMPLATE',
    'Item {lu_id} has no sale variant (ARTUV) in GOLD. Without a variant (CINV), no AVEPRIX price row can exist — GOLD requires the variant as the link between the item master and the price list.',
    'ARTRAC check: item {lu_id} found|ARTUV: 0 variants (CINVs) for this LU|No variant = no price possible — create the sale variant first',
    NULL,
    'CRITICAL'
);

INSERT INTO AI_DIAGNOSTIC_CONCLUSION (CONCLUSION_KEY, RETAILER_ID, SUMMARY_TEMPLATE, EVIDENCE_TEMPLATE, FOLLOW_UP_TEMPLATE, SEVERITY)
VALUES (
    'PRICE_NO_AVEPRIX', 'TEMPLATE',
    'Item {lu_id} has {VARIANT_COUNT} sale variant(s) but no AVEPRIX price row exists for any of them. The item has never been priced in GOLD — a price line must be created and assigned to a tariff before retail will show at any store.',
    'ARTUV: {VARIANT_COUNT} variant(s) found|AVEPRIX: 0 rows across all variants|Item has a variant but no price has ever been entered|Retail cannot display without at least one AVEPRIX row',
    'Would you like me to check if other items in the same category have active prices, as a benchmark?',
    'CRITICAL'
);

INSERT INTO AI_DIAGNOSTIC_CONCLUSION (CONCLUSION_KEY, RETAILER_ID, SUMMARY_TEMPLATE, EVIDENCE_TEMPLATE, FOLLOW_UP_TEMPLATE, SEVERITY)
VALUES (
    'PRICE_TARIFF_EXPIRED', 'TEMPLATE',
    'Item {lu_id} has {PRICE_ROWS} AVEPRIX row(s) but all associated tariffs (AVETAR) have expired as of today. No active price period covers the current date, so retail cannot be resolved at any store.',
    'AVEPRIX rows: {PRICE_ROWS} total|Active price rows (tariff valid today): 0|All price tariffs are expired — a current-period price line must be created|Without an active tariff GOLD cannot resolve retail at any date',
    'Do you want me to show the most recently expired price for this item so you can see what the last known retail was?',
    'WARNING'
);

INSERT INTO AI_DIAGNOSTIC_CONCLUSION (CONCLUSION_KEY, RETAILER_ID, SUMMARY_TEMPLATE, EVIDENCE_TEMPLATE, FOLLOW_UP_TEMPLATE, SEVERITY)
VALUES (
    'PRICE_SCOPE_GAP', 'TEMPLATE',
    'Item {lu_id} has active AVEPRIX rows with valid tariffs but the tariff scope (AVESCOPE) does not cover store {site_id}. The price exists in GOLD but is not assigned to this location — either the store is not in the tariff scope or a store-level scope override is missing.',
    'AVEPRIX: active price rows exist|AVETAR: tariff valid today (expires {TARIFF_EXPIRES})|AVESCOPE: 0 rows covering store {site_id} for this tariff|Price exists but site is out of scope — add store {site_id} to the tariff scope',
    'Want me to check which stores ARE covered by the active tariff for item {lu_id}?',
    'WARNING'
);

COMMIT;

SELECT d.STEP_ORDER, d.CONCLUSION_KEY FROM AI_DIAGNOSTIC_STEP d
WHERE d.SKILL_ID = 'DA000005-D100-4A00-8100-D10000000005' ORDER BY 1, 2;
