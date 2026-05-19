-- ============================================================
-- SKILL ENGINE
-- Designer-authored, Admin-published intelligence packages.
-- Each skill is scoped to one retailer and bundles five
-- components: knowledge items, playbook steps, SQL templates,
-- vocabulary, and test cases.
--
-- Lifecycle: DRAFT → IN_REVIEW → PUBLISHED → DEPRECATED
-- Designer: create / edit / test / submit
-- Admin:    review / publish / reject / deprecate
-- ============================================================


CREATE TABLE AI_SKILL (
    skill_id            VARCHAR2(36)    DEFAULT SYS_GUID() NOT NULL,
    retailer_id         VARCHAR2(20)    NOT NULL,
    skill_code          VARCHAR2(40)    NOT NULL,   -- machine key e.g. PROMOTION_MGMT
    skill_name          VARCHAR2(100)   NOT NULL,   -- display e.g. "Promotion management"
    domain              VARCHAR2(40)    NOT NULL,   -- PROMOTION / DSD / SCANBACK / WAREHOUSE / etc.
    description         VARCHAR2(1000),
    version             NUMBER(5,2)     DEFAULT 1.0 NOT NULL,
    -- Lifecycle
    status              VARCHAR2(20)    DEFAULT 'DRAFT' NOT NULL,
    created_by          VARCHAR2(50)    NOT NULL,   -- Designer user ID
    created_at          TIMESTAMP       DEFAULT SYSTIMESTAMP NOT NULL,
    submitted_at        TIMESTAMP,                 -- when Designer submitted for review
    reviewed_by         VARCHAR2(50),              -- Admin user ID
    reviewed_at         TIMESTAMP,
    review_notes        VARCHAR2(2000),            -- Admin feedback on reject
    published_by        VARCHAR2(50),
    published_at        TIMESTAMP,
    deprecated_at       TIMESTAMP,
    deprecated_reason   VARCHAR2(500),
    -- Supersession
    superseded_by       VARCHAR2(36),              -- skill_id of newer version
    parent_skill_id     VARCHAR2(36),              -- if forked from another skill
    updated_at          TIMESTAMP       DEFAULT SYSTIMESTAMP,
    CONSTRAINT PK_AI_SKILL          PRIMARY KEY (skill_id),
    CONSTRAINT UQ_AI_SKILL          UNIQUE (retailer_id, skill_code, version),
    CONSTRAINT CHK_SKILL_STATUS     CHECK (
        status IN ('DRAFT','IN_REVIEW','PUBLISHED','REJECTED','DEPRECATED'))
);

CREATE INDEX IDX_SKILL_RETAILER ON AI_SKILL (retailer_id, status, domain);


-- ============================================================
-- Component 1: Knowledge items
-- Custom context learning Q&A for this skill's domain.
-- Can extend (supplement) or override base catalog items.
CREATE TABLE AI_SKILL_KNOWLEDGE_ITEM (
    item_id             NUMBER          GENERATED ALWAYS AS IDENTITY,
    skill_id            VARCHAR2(36)    NOT NULL,
    -- Link to base catalog (null = brand new, not in base catalog)
    base_knowledge_key  VARCHAR2(40),
    -- Override or extend?
    override_mode       VARCHAR2(10)    DEFAULT 'EXTEND' NOT NULL,
    -- The knowledge item definition
    knowledge_key       VARCHAR2(40)    NOT NULL,   -- scoped to this skill
    label               VARCHAR2(100)   NOT NULL,
    description         VARCHAR2(500),
    anchor_question     VARCHAR2(2000)  NOT NULL,   -- Round 1 — always open-ended
    -- Designer-authored follow-up rounds (JSON array of round objects)
    rounds_json         CLOB
        CONSTRAINT CHK_ROUNDS_JSON CHECK (rounds_json IS JSON),
    -- SQL validation query for this knowledge item
    validation_sql      CLOB,
    priority            NUMBER(1,0)     DEFAULT 2 NOT NULL,
    is_mandatory        NUMBER(1,0)     DEFAULT 1,
    created_at          TIMESTAMP       DEFAULT SYSTIMESTAMP,
    CONSTRAINT PK_SKILL_KI  PRIMARY KEY (item_id),
    CONSTRAINT FK_SKI_SKILL FOREIGN KEY (skill_id) REFERENCES AI_SKILL (skill_id),
    CONSTRAINT CHK_OVERRIDE CHECK (override_mode IN ('EXTEND','OVERRIDE'))
);


-- ============================================================
-- Component 2: Playbook steps
-- Custom investigation steps for complaint types in this domain.
-- These are merged with base playbook at investigation time.
CREATE TABLE AI_SKILL_PLAYBOOK_STEP (
    step_id             NUMBER          GENERATED ALWAYS AS IDENTITY,
    skill_id            VARCHAR2(36)    NOT NULL,
    complaint_type      VARCHAR2(40)    NOT NULL,
    step_order          NUMBER(3,0)     NOT NULL,
    step_code           VARCHAR2(40)    NOT NULL,
    step_label          VARCHAR2(100)   NOT NULL,
    hypothesis_tested   VARCHAR2(200)   NOT NULL,
    gold_schema         VARCHAR2(20)    NOT NULL,
    gold_table          VARCHAR2(60)    NOT NULL,
    key_columns         VARCHAR2(500),
    evidence_fact_type  VARCHAR2(40)    NOT NULL,
    is_mandatory        NUMBER(1,0)     DEFAULT 1 NOT NULL,
    -- Where to insert relative to base playbook
    insert_position     VARCHAR2(20)    DEFAULT 'APPEND',
    insert_after_step   VARCHAR2(40),              -- insert after this base step code
    created_at          TIMESTAMP       DEFAULT SYSTIMESTAMP,
    CONSTRAINT PK_SKILL_PS  PRIMARY KEY (step_id),
    CONSTRAINT FK_SPS_SKILL FOREIGN KEY (skill_id) REFERENCES AI_SKILL (skill_id),
    CONSTRAINT CHK_INSERT   CHECK (insert_position IN ('PREPEND','APPEND','AFTER'))
);


-- ============================================================
-- Component 3: SQL templates
-- Parameterized Oracle SQL fragments authored and tested by Designer.
-- Parameters: :lu_id, :site_id, :supplier_id, :date_from, :date_to
CREATE TABLE AI_SKILL_SQL_TEMPLATE (
    template_id         NUMBER          GENERATED ALWAYS AS IDENTITY,
    skill_id            VARCHAR2(36)    NOT NULL,
    template_code       VARCHAR2(40)    NOT NULL,  -- e.g. SCANBACK_CREDIT_EXISTS
    template_label      VARCHAR2(100)   NOT NULL,
    purpose             VARCHAR2(200),             -- what question this SQL answers
    sql_text            CLOB            NOT NULL,
    parameters_json     CLOB                       -- expected parameter list + types
        CONSTRAINT CHK_PARAMS_JSON CHECK (parameters_json IS JSON),
    tables_referenced   VARCHAR2(500),
    -- Test state
    last_tested_at      TIMESTAMP,
    last_test_result    CLOB,
    last_test_passed    NUMBER(1,0),
    tested_by           VARCHAR2(50),
    created_at          TIMESTAMP       DEFAULT SYSTIMESTAMP,
    CONSTRAINT PK_SKILL_SQL FOREIGN KEY (skill_id) REFERENCES AI_SKILL (skill_id),
    CONSTRAINT PK_SQL_TMPL  PRIMARY KEY (template_id)
);


-- ============================================================
-- Component 4: Vocabulary
-- Term → skill domain mappings for the natural language Q&A layer.
-- When user says any synonym, AI routes to this skill.
CREATE TABLE AI_SKILL_VOCABULARY (
    vocab_id            NUMBER          GENERATED ALWAYS AS IDENTITY,
    skill_id            VARCHAR2(36)    NOT NULL,
    term                VARCHAR2(100)   NOT NULL,  -- the word/phrase user might say
    canonical_concept   VARCHAR2(100)   NOT NULL,  -- what it maps to internally
    term_type           VARCHAR2(20)    DEFAULT 'SYNONYM' NOT NULL,
    -- Examples for context:
    -- term="scan deal" → canonical_concept="SCANBACK_CREDIT"
    -- term="vendor allowance" → canonical_concept="SCANBACK_CREDIT"
    -- term="activation" → canonical_concept="PROMOTION_ACTIVE"
    language_code       VARCHAR2(5)     DEFAULT 'EN',
    confidence_boost    NUMBER(3,2)     DEFAULT 1.0,  -- weight when routing to this skill
    created_at          TIMESTAMP       DEFAULT SYSTIMESTAMP,
    CONSTRAINT PK_SKILL_VOCAB FOREIGN KEY (skill_id) REFERENCES AI_SKILL (skill_id),
    CONSTRAINT PK_VOCAB       PRIMARY KEY (vocab_id),
    CONSTRAINT CHK_TERM_TYPE  CHECK (
        term_type IN ('SYNONYM','ABBREVIATION','JARGON','BRAND_TERM','PROCESS_TERM'))
);

CREATE INDEX IDX_VOCAB_TERM ON AI_SKILL_VOCABULARY (term, skill_id);


-- ============================================================
-- Component 5: Test suite
-- Designer-authored test cases for end-to-end skill validation.
-- Run before submitting for Admin review.
CREATE TABLE AI_SKILL_TEST_CASE (
    test_id             NUMBER          GENERATED ALWAYS AS IDENTITY,
    skill_id            VARCHAR2(36)    NOT NULL,
    test_name           VARCHAR2(100)   NOT NULL,
    -- Simulated input
    complaint_text      CLOB            NOT NULL,  -- example user complaint / email
    complaint_type      VARCHAR2(40)    NOT NULL,
    expected_root_cause VARCHAR2(40)    NOT NULL,  -- what the AI should conclude
    expected_confidence VARCHAR2(15)    NOT NULL,  -- CONFIRMED / PROBABLE / etc.
    expected_steps_min  NUMBER(3,0),               -- minimum steps that should fire
    -- Execution results (populated when test is run)
    last_run_at         TIMESTAMP,
    last_run_by         VARCHAR2(50),
    actual_root_cause   VARCHAR2(40),
    actual_confidence   VARCHAR2(15),
    actual_steps_fired  NUMBER(3,0),
    passed              NUMBER(1,0),
    failure_reason      VARCHAR2(500),
    created_at          TIMESTAMP       DEFAULT SYSTIMESTAMP,
    CONSTRAINT PK_TEST_CASE FOREIGN KEY (skill_id) REFERENCES AI_SKILL (skill_id),
    CONSTRAINT PK_SKILL_TC  PRIMARY KEY (test_id)
);


-- ============================================================
-- Skill version history
-- Every time a Designer edits a PUBLISHED skill, a new DRAFT
-- version is created. The old published version remains active
-- until Admin publishes the new one.
CREATE TABLE AI_SKILL_VERSION (
    version_id          NUMBER          GENERATED ALWAYS AS IDENTITY,
    skill_id            VARCHAR2(36)    NOT NULL,
    version             NUMBER(5,2)     NOT NULL,
    status              VARCHAR2(20)    NOT NULL,
    change_summary      VARCHAR2(1000),
    snapshot_json       CLOB                       -- full skill bundle at this version
        CONSTRAINT CHK_SNAPSHOT_JSON CHECK (snapshot_json IS JSON),
    created_by          VARCHAR2(50),
    created_at          TIMESTAMP       DEFAULT SYSTIMESTAMP,
    CONSTRAINT PK_SKILL_VERSION PRIMARY KEY (version_id),
    CONSTRAINT FK_SV_SKILL FOREIGN KEY (skill_id) REFERENCES AI_SKILL (skill_id)
);


-- ============================================================
-- Skill installer: which skills are active for a retailer
-- A retailer can have multiple published skills installed.
-- Skills can be enabled / disabled without deprecating them.
CREATE TABLE AI_SKILL_RETAILER (
    install_id          NUMBER          GENERATED ALWAYS AS IDENTITY,
    retailer_id         VARCHAR2(20)    NOT NULL,
    skill_id            VARCHAR2(36)    NOT NULL,
    installed_at        TIMESTAMP       DEFAULT SYSTIMESTAMP,
    installed_by        VARCHAR2(50),
    is_enabled          NUMBER(1,0)     DEFAULT 1,
    disabled_at         TIMESTAMP,
    disabled_reason     VARCHAR2(200),
    CONSTRAINT PK_SKILL_RETAILER PRIMARY KEY (install_id),
    CONSTRAINT UQ_SKILL_INSTALL  UNIQUE (retailer_id, skill_id),
    CONSTRAINT FK_SR_SKILL       FOREIGN KEY (skill_id) REFERENCES AI_SKILL (skill_id)
);

CREATE INDEX IDX_SKILL_INST ON AI_SKILL_RETAILER (retailer_id, is_enabled);


-- ============================================================
-- Runtime view: what skills are active for a retailer right now?
CREATE OR REPLACE VIEW V_ACTIVE_SKILLS AS
SELECT
    sr.retailer_id,
    s.skill_id,
    s.skill_code,
    s.skill_name,
    s.domain,
    s.version,
    s.published_at,
    sr.installed_at
FROM AI_SKILL_RETAILER sr
JOIN AI_SKILL s
    ON  s.skill_id  = sr.skill_id
    AND s.status    = 'PUBLISHED'
WHERE sr.is_enabled = 1;


-- ============================================================
-- Runtime view: merged vocabulary across all active skills
-- Used by the Q&A layer to route user input to the right skill
CREATE OR REPLACE VIEW V_ACTIVE_VOCABULARY AS
SELECT
    sv.term,
    sv.canonical_concept,
    sv.term_type,
    sv.confidence_boost,
    s.skill_id,
    s.skill_code,
    s.domain,
    sr.retailer_id
FROM AI_SKILL_VOCABULARY sv
JOIN AI_SKILL s
    ON  s.skill_id = sv.skill_id
    AND s.status   = 'PUBLISHED'
JOIN AI_SKILL_RETAILER sr
    ON  sr.skill_id    = s.skill_id
    AND sr.is_enabled  = 1;


-- ============================================================
-- Seed: base skills that most GOLD retailers will need
-- These are DRAFT — Designer must complete and Admin must publish per retailer
INSERT INTO AI_SKILL (skill_id, retailer_id, skill_code, skill_name, domain,
    description, status, created_by)
VALUES (SYS_GUID(), 'TEMPLATE', 'PROMOTION_MGMT', 'Promotion management', 'PROMOTION',
    'Detects active and upcoming promotions, investigates promo cap issues, pre-positioning.',
    'DRAFT', 'SYSTEM');

-- Stub only (no AI_SKILL_SQL_TEMPLATE rows). For S14 routing use the loadable pack
-- DSD_VENDOR_RETAIL in 12_ai_skill_pack_dsd_vendor_retail.sql — engine prefers skills that have templates.
INSERT INTO AI_SKILL (skill_id, retailer_id, skill_code, skill_name, domain,
    description, status, created_by)
VALUES (SYS_GUID(), 'TEMPLATE', 'DSD_VENDOR', 'DSD vendor', 'DSD',
    'Direct Store Delivery detection, route schedules, vendor-specific delivery investigations.',
    'DRAFT', 'SYSTEM');

INSERT INTO AI_SKILL (skill_id, retailer_id, skill_code, skill_name, domain,
    description, status, created_by)
VALUES (SYS_GUID(), 'TEMPLATE', 'WAREHOUSE_SETUP', 'Warehouse item setup', 'WAREHOUSE',
    'Warehouse item configuration, slot assignment, pick-face replenishment logic.',
    'DRAFT', 'SYSTEM');

INSERT INTO AI_SKILL (skill_id, retailer_id, skill_code, skill_name, domain,
    description, status, created_by)
VALUES (SYS_GUID(), 'TEMPLATE', 'SCANBACK', 'Scanback', 'FINANCE',
    'Scanback credit recording, reconciliation, vendor allowance dispute investigation.',
    'DRAFT', 'SYSTEM');

COMMIT;
