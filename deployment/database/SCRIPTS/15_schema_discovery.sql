-- ============================================================
-- S02 — SCHEMA DISCOVERY
-- Stores the physical GOLD table/column catalog per retailer
-- Scanned via ALL_TABLES@dblink + ALL_TAB_COLUMNS@dblink
-- ============================================================
 DROP TABLE AI_SCHEMA_VALUE;
 DROP TABLE AI_SCHEMA_COLUMN;
 DROP TABLE AI_SCHEMA_SCAN_LOG;
 DROP TABLE AI_SCHEMA_TABLE;
 -- ============================================================
-- S02 — SCHEMA DISCOVERY
-- Stores the physical GOLD table/column catalog per retailer
-- Scanned via ALL_TABLES@dblink + ALL_TAB_COLUMNS@dblink
-- ============================================================

-- ── Table catalog ─────────────────────────────────────────────
CREATE TABLE AI_SCHEMA_TABLE (
    TABLE_ID         NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    RETAILER_ID      VARCHAR2(30)   NOT NULL,
    SCHEMA_OWNER     VARCHAR2(30)   NOT NULL,   -- HNUCEN, HNUGWR, HNUSTK
    TABLE_NAME       VARCHAR2(128)  NOT NULL,
    ROW_COUNT        NUMBER,                    -- approximate, from ALL_TABLES
    TABLE_TYPE       VARCHAR2(10)   DEFAULT 'TABLE', -- TABLE / VIEW
    IS_KEY_TABLE     NUMBER(1)      DEFAULT 0,  -- admin-marked as important
    DOMAIN_TAG       VARCHAR2(30),              -- ITEM / STOCK / SUPPLIER / etc
    description      VARCHAR2(500),  
    ADMIN_DESCRIPTION      VARCHAR2(500),             -- admin annotation
    ora_comment   VARCHAR2(4000),
    DISCOVERED_AT    TIMESTAMP      DEFAULT SYSTIMESTAMP,
    UPDATED_AT       TIMESTAMP      DEFAULT SYSTIMESTAMP,
    CONSTRAINT UQ_AI_SCHEMA_TABLE UNIQUE (RETAILER_ID, SCHEMA_OWNER, TABLE_NAME)
);

-- ── Column catalog ─────────────────────────────────────────────
CREATE TABLE AI_SCHEMA_COLUMN (
    COLUMN_ID        NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    TABLE_ID         NUMBER         NOT NULL REFERENCES AI_SCHEMA_TABLE(TABLE_ID) ON DELETE CASCADE,
    RETAILER_ID      VARCHAR2(30)   NOT NULL,
    SCHEMA_OWNER     VARCHAR2(30)   NOT NULL,
    TABLE_NAME       VARCHAR2(128)  NOT NULL,
    COLUMN_NAME      VARCHAR2(128)  NOT NULL,
    DATA_TYPE        VARCHAR2(50)   NOT NULL,
    DATA_LENGTH      NUMBER,
    NULLABLE         VARCHAR2(1),
    COLUMN_ID_SEQ    NUMBER,                    -- position in table
    IS_KEY_COLUMN    NUMBER(1)      DEFAULT 0,  -- admin-marked
    description      VARCHAR2(500),  
    ADMIN_DESCRIPTION      VARCHAR2(500),
    CONSTRAINT UQ_AI_SCHEMA_COLUMN UNIQUE (RETAILER_ID, SCHEMA_OWNER, TABLE_NAME, COLUMN_NAME)
);

-- ── Sample values for code/enum columns ───────────────────────
CREATE TABLE AI_SCHEMA_VALUE (
    VALUE_ID         NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    TABLE_ID         NUMBER         NOT NULL REFERENCES AI_SCHEMA_TABLE(TABLE_ID) ON DELETE CASCADE,
    RETAILER_ID      VARCHAR2(30)   NOT NULL,
    SCHEMA_OWNER     VARCHAR2(30)   NOT NULL,
    TABLE_NAME       VARCHAR2(128)  NOT NULL,
    COLUMN_NAME      VARCHAR2(128)  NOT NULL,
    SAMPLE_VALUE     VARCHAR2(200),
    VALUE_LABEL      VARCHAR2(200),             -- admin-added description
    DISCOVERED_AT    TIMESTAMP      DEFAULT SYSTIMESTAMP
);

-- ── Scan log ───────────────────────────────────────────────────
CREATE TABLE AI_SCHEMA_SCAN_LOG (
    SCAN_ID          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    RETAILER_ID      VARCHAR2(30)   NOT NULL,
    SCAN_STARTED_AT  TIMESTAMP      DEFAULT SYSTIMESTAMP,
    SCAN_ENDED_AT    TIMESTAMP,
    STATUS           VARCHAR2(20)   DEFAULT 'RUNNING',  -- RUNNING / COMPLETE / ERROR
    TABLES_SCANNED   NUMBER         DEFAULT 0,
    COLUMNS_SCANNED  NUMBER         DEFAULT 0,
    ERROR_MESSAGE    VARCHAR2(2000),
    TRIGGERED_BY     VARCHAR2(50)
);

COMMIT;
