-- =============================================================================
-- 124_massload_rule_table_libquery.sql
-- ICR mass-load parameter rules (by load type + scope) + LIBQUERY CRUD + menu
--
-- Table: ICR_MASSLOAD_RULE
--   One row per (LOAD_TYPE, RULE_SCOPE).
--   RULE_SCOPE: CONSTANT | STORE | WAREHOUSE
--   RULES_CLOB: JSON — structure varies by target GOLD table, e.g.:
--     {
--       "target_table": "INTDETRET",
--       "soccmag": 10,
--       "fields": { "IRFTMODE": 4, "IRFRPHY": 3, "IRFMOTI": 3, ... }
--     }
--
-- LIBQUERY (admin CRUD):
--   MAS0000100 LIST   (:param1 load_type|-1, :param2 active|-1)
--   MAS0000101 GET    (:param1 RULE_ID)
--   MAS0000102 MERGE  POST body values[0]
--   MAS0000103 DELETE POST body values[0].RULE_ID
--   MAS0000104 Load-type dropdown (TRA_ENTRIES titles for PARAMID=33)
--
-- Screen: /settingmassload  SCR0000000093
-- Menu:   Mass-change box → Mass-load settings (after Journal, SORT 231.5)
-- Runtime: PKMASSCHANGE.LOADRETURN_EXECUTE reads rows for LOAD_TYPE=24
-- =============================================================================

-- ── DDL (run once) ───────────────────────────────────────────────────────────
BEGIN
  EXECUTE IMMEDIATE q'[
    CREATE TABLE ICR_MASSLOAD_RULE (
      RULE_ID      NUMBER         NOT NULL,
      LOAD_TYPE    NUMBER         NOT NULL,
      LOAD_CODE    VARCHAR2(40)   NOT NULL,
      RULE_SCOPE   VARCHAR2(20)   NOT NULL,
      RULE_NAME    VARCHAR2(200),
      TARGET_TABLE VARCHAR2(100),
      RULES_CLOB   CLOB           NOT NULL,
      ACTIVE       NUMBER(1)      DEFAULT 1 NOT NULL,
      NOTES        VARCHAR2(500),
      CREATED_BY   VARCHAR2(50),
      CREATED_AT   TIMESTAMP      DEFAULT SYSTIMESTAMP,
      UPDATED_BY   VARCHAR2(50),
      UPDATED_AT   TIMESTAMP,
      CONSTRAINT pk_icr_massload_rule PRIMARY KEY (RULE_ID),
      CONSTRAINT uk_icr_massload_rule UNIQUE (LOAD_TYPE, RULE_SCOPE),
      CONSTRAINT chk_ml_rule_scope CHECK (RULE_SCOPE IN ('CONSTANT','STORE','WAREHOUSE')),
      CONSTRAINT chk_ml_rule_active CHECK (ACTIVE IN (0, 1))
    )
  ]';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE != -955 THEN RAISE; END IF; -- name already used
END;
/

COMMENT ON TABLE ICR_MASSLOAD_RULE IS
  'Mass-load defaults by tool (LOAD_TYPE) and scope CONSTANT|STORE|WAREHOUSE; field map in RULES_CLOB JSON';

-- ── Seed tool 24 — Load for return (INTDETRET) ───────────────────────────────
MERGE INTO ICR_MASSLOAD_RULE t
USING (
  SELECT 1 AS RULE_ID, 24 AS LOAD_TYPE, 'LOADRETURN' AS LOAD_CODE,
         'CONSTANT' AS RULE_SCOPE,
         'Load return — shared INTDETRET defaults' AS RULE_NAME,
         'INTDETRET' AS TARGET_TABLE,
         q'[{
  "target_table": "INTDETRET",
  "fields": {
    "IRFTMODE": 4,
    "IRFTYPE": 1,
    "IRFDEVI": 840,
    "IRFCONS": 0
  }
}]' AS RULES_CLOB,
         1 AS ACTIVE,
         'Shared across store and warehouse returns' AS NOTES
    FROM dual
) s
ON (t.LOAD_TYPE = s.LOAD_TYPE AND t.RULE_SCOPE = s.RULE_SCOPE)
WHEN MATCHED THEN UPDATE SET
  t.LOAD_CODE    = s.LOAD_CODE,
  t.RULE_NAME    = s.RULE_NAME,
  t.TARGET_TABLE = s.TARGET_TABLE,
  t.RULES_CLOB   = s.RULES_CLOB,
  t.ACTIVE       = s.ACTIVE,
  t.NOTES        = s.NOTES,
  t.UPDATED_BY   = 'ICR',
  t.UPDATED_AT   = SYSTIMESTAMP
WHEN NOT MATCHED THEN INSERT (
  RULE_ID, LOAD_TYPE, LOAD_CODE, RULE_SCOPE, RULE_NAME, TARGET_TABLE,
  RULES_CLOB, ACTIVE, NOTES, CREATED_BY, CREATED_AT
) VALUES (
  NVL((SELECT MAX(RULE_ID) FROM ICR_MASSLOAD_RULE), 0) + 1,
  s.LOAD_TYPE, s.LOAD_CODE, s.RULE_SCOPE, s.RULE_NAME, s.TARGET_TABLE,
  s.RULES_CLOB, s.ACTIVE, s.NOTES, 'ICR', SYSTIMESTAMP
);

MERGE INTO ICR_MASSLOAD_RULE t
USING (
  SELECT 24 AS LOAD_TYPE, 'LOADRETURN' AS LOAD_CODE,
         'STORE' AS RULE_SCOPE,
         'Load return — store (SOCCMAG=10)' AS RULE_NAME,
         'INTDETRET' AS TARGET_TABLE,
         q'[{
  "target_table": "INTDETRET",
  "soccmag": 10,
  "fields": {
    "IRFRPHY": 3,
    "IRFMOTI": 3
  }
}]' AS RULES_CLOB,
         1 AS ACTIVE,
         'Physical indicator + warehouse-return reason for stores' AS NOTES
    FROM dual
) s
ON (t.LOAD_TYPE = s.LOAD_TYPE AND t.RULE_SCOPE = s.RULE_SCOPE)
WHEN MATCHED THEN UPDATE SET
  t.LOAD_CODE    = s.LOAD_CODE,
  t.RULE_NAME    = s.RULE_NAME,
  t.TARGET_TABLE = s.TARGET_TABLE,
  t.RULES_CLOB   = s.RULES_CLOB,
  t.ACTIVE       = s.ACTIVE,
  t.NOTES        = s.NOTES,
  t.UPDATED_BY   = 'ICR',
  t.UPDATED_AT   = SYSTIMESTAMP
WHEN NOT MATCHED THEN INSERT (
  RULE_ID, LOAD_TYPE, LOAD_CODE, RULE_SCOPE, RULE_NAME, TARGET_TABLE,
  RULES_CLOB, ACTIVE, NOTES, CREATED_BY, CREATED_AT
) VALUES (
  NVL((SELECT MAX(RULE_ID) FROM ICR_MASSLOAD_RULE), 0) + 1,
  s.LOAD_TYPE, s.LOAD_CODE, s.RULE_SCOPE, s.RULE_NAME, s.TARGET_TABLE,
  s.RULES_CLOB, s.ACTIVE, s.NOTES, 'ICR', SYSTIMESTAMP
);

MERGE INTO ICR_MASSLOAD_RULE t
USING (
  SELECT 24 AS LOAD_TYPE, 'LOADRETURN' AS LOAD_CODE,
         'WAREHOUSE' AS RULE_SCOPE,
         'Load return — warehouse (SOCCMAG=0)' AS RULE_NAME,
         'INTDETRET' AS TARGET_TABLE,
         q'[{
  "target_table": "INTDETRET",
  "soccmag": 0,
  "fields": {
    "IRFRPHY": 2,
    "IRFMOTI": 703
  }
}]' AS RULES_CLOB,
         1 AS ACTIVE,
         'Physical indicator + line-item reason for warehouses' AS NOTES
    FROM dual
) s
ON (t.LOAD_TYPE = s.LOAD_TYPE AND t.RULE_SCOPE = s.RULE_SCOPE)
WHEN MATCHED THEN UPDATE SET
  t.LOAD_CODE    = s.LOAD_CODE,
  t.RULE_NAME    = s.RULE_NAME,
  t.TARGET_TABLE = s.TARGET_TABLE,
  t.RULES_CLOB   = s.RULES_CLOB,
  t.ACTIVE       = s.ACTIVE,
  t.NOTES        = s.NOTES,
  t.UPDATED_BY   = 'ICR',
  t.UPDATED_AT   = SYSTIMESTAMP
WHEN NOT MATCHED THEN INSERT (
  RULE_ID, LOAD_TYPE, LOAD_CODE, RULE_SCOPE, RULE_NAME, TARGET_TABLE,
  RULES_CLOB, ACTIVE, NOTES, CREATED_BY, CREATED_AT
) VALUES (
  NVL((SELECT MAX(RULE_ID) FROM ICR_MASSLOAD_RULE), 0) + 1,
  s.LOAD_TYPE, s.LOAD_CODE, s.RULE_SCOPE, s.RULE_NAME, s.TARGET_TABLE,
  s.RULES_CLOB, s.ACTIVE, s.NOTES, 'ICR', SYSTIMESTAMP
);

COMMIT;

-- ── LIBQUERY ─────────────────────────────────────────────────────────────────
DELETE FROM LIBQUERY WHERE QUERYNUM IN (
  'MAS0000100', 'MAS0000101', 'MAS0000102', 'MAS0000103', 'MAS0000104'
);

-- MAS0000100 — list rules
INSERT INTO LIBQUERY (
  QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT,
  QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'MAS0000100',
       'Mass-load rules — list',
       'List ICR_MASSLOAD_RULE. :param1=LOAD_TYPE or -1, :param2=ACTIVE or -1.',
       q'[
SELECT RULE_ID,
       LOAD_TYPE,
       LOAD_CODE,
       RULE_SCOPE,
       RULE_NAME,
       TARGET_TABLE,
       RULES_CLOB,
       ACTIVE,
       NOTES,
       CREATED_BY,
       TO_CHAR(CREATED_AT, 'YYYY-MM-DD HH24:MI:SS') AS CREATED_AT,
       UPDATED_BY,
       TO_CHAR(UPDATED_AT, 'YYYY-MM-DD HH24:MI:SS') AS UPDATED_AT
  FROM ICR_MASSLOAD_RULE
 WHERE (:param1 = '-1' OR LOAD_TYPE = TO_NUMBER(:param1))
   AND (:param2 = '-1' OR ACTIVE = TO_NUMBER(:param2))
 ORDER BY LOAD_TYPE, CASE RULE_SCOPE
                       WHEN 'CONSTANT' THEN 1
                       WHEN 'STORE' THEN 2
                       WHEN 'WAREHOUSE' THEN 3
                       ELSE 9 END
]',
       ':param1=load_type|-1,:param2=active|-1',
       'RULE_ID,LOAD_TYPE,LOAD_CODE,RULE_SCOPE,RULE_NAME,TARGET_TABLE,RULES_CLOB,ACTIVE,NOTES,CREATED_BY,CREATED_AT,UPDATED_BY,UPDATED_AT',
       0, 0, 0
  FROM dual;

-- MAS0000101 — get by id
INSERT INTO LIBQUERY (
  QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT,
  QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'MAS0000101',
       'Mass-load rules — get',
       'Single ICR_MASSLOAD_RULE by RULE_ID. :param1=RULE_ID.',
       q'[
SELECT RULE_ID,
       LOAD_TYPE,
       LOAD_CODE,
       RULE_SCOPE,
       RULE_NAME,
       TARGET_TABLE,
       RULES_CLOB,
       ACTIVE,
       NOTES,
       CREATED_BY,
       TO_CHAR(CREATED_AT, 'YYYY-MM-DD HH24:MI:SS') AS CREATED_AT,
       UPDATED_BY,
       TO_CHAR(UPDATED_AT, 'YYYY-MM-DD HH24:MI:SS') AS UPDATED_AT
  FROM ICR_MASSLOAD_RULE
 WHERE RULE_ID = TO_NUMBER(:param1)
]',
       ':param1=RULE_ID',
       'RULE_ID,LOAD_TYPE,LOAD_CODE,RULE_SCOPE,RULE_NAME,TARGET_TABLE,RULES_CLOB,ACTIVE,NOTES,CREATED_BY,CREATED_AT,UPDATED_BY,UPDATED_AT',
       0, 0, 0
  FROM dual;

-- MAS0000102 — MERGE upsert
INSERT INTO LIBQUERY (
  QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT,
  QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'MAS0000102',
       'Mass-load rules — merge',
       'MERGE ICR_MASSLOAD_RULE on LOAD_TYPE+RULE_SCOPE. Body values[0]: RULE_ID?, LOAD_TYPE, LOAD_CODE, RULE_SCOPE, RULE_NAME, TARGET_TABLE, RULES_CLOB, ACTIVE, NOTES, UPDATED_BY.',
       q'~
MERGE INTO ICR_MASSLOAD_RULE tgt
USING (
  SELECT
    NVL(jt.RULE_ID, 0) AS RULE_ID,
    jt.LOAD_TYPE,
    jt.LOAD_CODE,
    jt.RULE_SCOPE,
    jt.RULE_NAME,
    jt.TARGET_TABLE,
    jt.RULES_CLOB,
    NVL(jt.ACTIVE, 1) AS ACTIVE,
    jt.NOTES,
    NVL(jt.UPDATED_BY, 'ICR') AS UPDATED_BY
  FROM REQUEST_QUERY_BODY rb,
       JSON_TABLE(rb.REQUESTBODY, '$.values[0]'
         COLUMNS (
           RULE_ID      NUMBER         PATH '$."RULE_ID"',
           LOAD_TYPE    NUMBER         PATH '$."LOAD_TYPE"',
           LOAD_CODE    VARCHAR2(40)   PATH '$."LOAD_CODE"',
           RULE_SCOPE   VARCHAR2(20)   PATH '$."RULE_SCOPE"',
           RULE_NAME    VARCHAR2(200)  PATH '$."RULE_NAME"',
           TARGET_TABLE VARCHAR2(100)  PATH '$."TARGET_TABLE"',
           RULES_CLOB   CLOB           PATH '$."RULES_CLOB"',
           ACTIVE       NUMBER         PATH '$."ACTIVE"',
           NOTES        VARCHAR2(500)  PATH '$."NOTES"',
           UPDATED_BY   VARCHAR2(50)   PATH '$."UPDATED_BY"'
         )
       ) jt
  WHERE rb.REQUESTID = :param1
) src
ON (tgt.LOAD_TYPE = src.LOAD_TYPE AND tgt.RULE_SCOPE = src.RULE_SCOPE)
WHEN MATCHED THEN UPDATE SET
  tgt.LOAD_CODE    = src.LOAD_CODE,
  tgt.RULE_NAME    = src.RULE_NAME,
  tgt.TARGET_TABLE = src.TARGET_TABLE,
  tgt.RULES_CLOB   = src.RULES_CLOB,
  tgt.ACTIVE       = src.ACTIVE,
  tgt.NOTES        = src.NOTES,
  tgt.UPDATED_BY   = src.UPDATED_BY,
  tgt.UPDATED_AT   = SYSTIMESTAMP
WHEN NOT MATCHED THEN INSERT (
  RULE_ID, LOAD_TYPE, LOAD_CODE, RULE_SCOPE, RULE_NAME, TARGET_TABLE,
  RULES_CLOB, ACTIVE, NOTES, CREATED_BY, CREATED_AT
) VALUES (
  NVL((SELECT MAX(RULE_ID) FROM ICR_MASSLOAD_RULE), 0) + 1,
  src.LOAD_TYPE, src.LOAD_CODE, src.RULE_SCOPE, src.RULE_NAME, src.TARGET_TABLE,
  src.RULES_CLOB, src.ACTIVE, src.NOTES, src.UPDATED_BY, SYSTIMESTAMP
)
~',
       ':param1=REQUESTID (auto-bound by CALLQUERY)',
       '',
       0, 0, 1
  FROM dual;

-- MAS0000103 — delete
INSERT INTO LIBQUERY (
  QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT,
  QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'MAS0000103',
       'Mass-load rules — delete',
       'DELETE ICR_MASSLOAD_RULE by RULE_ID. Body values[0].RULE_ID.',
       q'~
DELETE FROM ICR_MASSLOAD_RULE
 WHERE RULE_ID = (
   SELECT jt.RULE_ID
     FROM REQUEST_QUERY_BODY rb,
          JSON_TABLE(rb.REQUESTBODY, '$.values[0]'
            COLUMNS (RULE_ID NUMBER PATH '$."RULE_ID"')
          ) jt
    WHERE rb.REQUESTID = :param1
 )
~',
       ':param1=REQUESTID (auto-bound by CALLQUERY)',
       '',
       0, 0, 1
  FROM dual;

-- MAS0000104 — load-type dropdown (business titles from TRA_ENTRIES)
INSERT INTO LIBQUERY (
  QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT,
  QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'MAS0000104',
       'Mass-load rules — load types',
       'Mass tools PARAMID=33 with TRA_ENTRIES business title. :param1=lang (us_US/en_GB/fr_FR) or -1 → us_US.',
       q'[
SELECT p.PARAMENTRY AS LOAD_TYPE,
       NVL(
         NVL(e.TENTRYDESC, e_us.TENTRYDESC),
         'Tool ' || TO_CHAR(p.PARAMENTRY)
       ) AS LOAD_LABEL
  FROM (
         SELECT DISTINCT PARAMENTRY
           FROM PARAMETERS
          WHERE PARAMID = 33
       ) p
  LEFT JOIN TRA_ENTRIES e
    ON e.TENTRYID = p.PARAMENTRY
   AND e.TENTRYPARAMID = 33
   AND e.TENTRYLANG = NVL(NULLIF(:param1, '-1'), 'us_US')
  LEFT JOIN TRA_ENTRIES e_us
    ON e_us.TENTRYID = p.PARAMENTRY
   AND e_us.TENTRYPARAMID = 33
   AND e_us.TENTRYLANG = 'us_US'
 ORDER BY p.PARAMENTRY
]',
       ':param1=lang|-1',
       'LOAD_TYPE,LOAD_LABEL',
       0, 0, 0
  FROM dual;

COMMIT;

-- ── Menu + labels (Mass-change box, right after Journal) ─────────────────────
-- If previously seeded under General Settings / ADMIN, MERGE relocates it.
MERGE INTO ICR_MENU_ENTRY t
USING (
  SELECT 'ROUTE_SET_MASSLOAD' AS MENU_CODE,
         'GRP_MASS' AS PARENT_CODE,
         'ROUTE' AS MENU_TYPE,
         'STANDARD' AS MENU_MODE,
         '/settingmassload' AS ROUTE_PATH,
         'fas fa-sliders-h' AS ICON_CLASS,
         'Mass-load settings' AS LABEL_TEXT,
         231.5 AS SORT_ORDER,
         CAST(NULL AS VARCHAR2(50)) AS EXPAND_KEY,
         1 AS ACTIVE
    FROM dual
) s
ON (t.MENU_CODE = s.MENU_CODE)
WHEN MATCHED THEN UPDATE SET
  t.PARENT_CODE = s.PARENT_CODE,
  t.MENU_TYPE   = s.MENU_TYPE,
  t.MENU_MODE   = s.MENU_MODE,
  t.ROUTE_PATH  = s.ROUTE_PATH,
  t.ICON_CLASS  = s.ICON_CLASS,
  t.LABEL_TEXT  = s.LABEL_TEXT,
  t.SORT_ORDER  = s.SORT_ORDER,
  t.ACTIVE      = s.ACTIVE
WHEN NOT MATCHED THEN INSERT (
  MENU_CODE, PARENT_CODE, MENU_TYPE, MENU_MODE, ROUTE_PATH,
  ICON_CLASS, LABEL_TEXT, SORT_ORDER, EXPAND_KEY, ACTIVE
) VALUES (
  s.MENU_CODE, s.PARENT_CODE, s.MENU_TYPE, s.MENU_MODE, s.ROUTE_PATH,
  s.ICON_CLASS, s.LABEL_TEXT, s.SORT_ORDER, s.EXPAND_KEY, s.ACTIVE
);

-- Drop prior ADMIN-only grant (General Settings placement)
DELETE FROM ICR_MENU_ACCESS_RULE
 WHERE MENU_CODE = 'ROUTE_SET_MASSLOAD' AND FLAG_NAME = 'ADMIN';

INSERT INTO ICR_MENU_ACCESS_RULE (MENU_CODE, FLAG_NAME)
SELECT 'ROUTE_SET_MASSLOAD', 'DATAINTEGRITY' FROM dual
 WHERE NOT EXISTS (
       SELECT 1 FROM ICR_MENU_ACCESS_RULE r
        WHERE r.MENU_CODE = 'ROUTE_SET_MASSLOAD' AND r.FLAG_NAME = 'DATAINTEGRITY'
     );

INSERT INTO ICR_MENU_ACCESS_RULE (MENU_CODE, FLAG_NAME)
SELECT 'ROUTE_SET_MASSLOAD', 'IT' FROM dual
 WHERE NOT EXISTS (
       SELECT 1 FROM ICR_MENU_ACCESS_RULE r
        WHERE r.MENU_CODE = 'ROUTE_SET_MASSLOAD' AND r.FLAG_NAME = 'IT'
     );

INSERT INTO ICR_PROFILE_MENU (PROFILE_ID, MENU_CODE, GRANTED)
SELECT 8, 'ROUTE_SET_MASSLOAD', 1 FROM dual
 WHERE NOT EXISTS (
       SELECT 1 FROM ICR_PROFILE_MENU pm
        WHERE pm.PROFILE_ID = 8 AND pm.MENU_CODE = 'ROUTE_SET_MASSLOAD'
     );

INSERT INTO ICR_PROFILE_MENU (PROFILE_ID, MENU_CODE, GRANTED)
SELECT 1, 'ROUTE_SET_MASSLOAD', 1 FROM dual
 WHERE NOT EXISTS (
       SELECT 1 FROM ICR_PROFILE_MENU pm
        WHERE pm.PROFILE_ID = 1 AND pm.MENU_CODE = 'ROUTE_SET_MASSLOAD'
     );

MERGE INTO ICR_MENU_LABEL t
USING (
  SELECT 'ROUTE_SET_MASSLOAD' AS MENU_CODE, 'us_US' AS MLLANGUE, 'Mass-load settings' AS LABEL_TEXT FROM dual
  UNION ALL
  SELECT 'ROUTE_SET_MASSLOAD', 'en_GB', 'Mass-load settings' FROM dual
  UNION ALL
  SELECT 'ROUTE_SET_MASSLOAD', 'fr_FR', 'Parametres mass-load' FROM dual
) s
ON (t.MENU_CODE = s.MENU_CODE AND t.MLLANGUE = s.MLLANGUE)
WHEN MATCHED THEN UPDATE SET
  t.LABEL_TEXT = s.LABEL_TEXT,
  t.MLDMAJ     = SYSDATE,
  t.MLUTIL     = 'ICR'
WHEN NOT MATCHED THEN INSERT (MENU_CODE, MLLANGUE, LABEL_TEXT, MLDCRE, MLDMAJ, MLUTIL)
VALUES (s.MENU_CODE, s.MLLANGUE, s.LABEL_TEXT, SYSDATE, SYSDATE, 'ICR');

DECLARE
  PROCEDURE seed3(p_id VARCHAR2, p_us VARCHAR2, p_gb VARCHAR2, p_fr VARCHAR2, p_screen VARCHAR2) IS
  BEGIN
    MERGE INTO TRA_LABELS t USING (SELECT p_id TLAID, 'us_US' TLALANGUE FROM DUAL) s
    ON (t.TLAID = s.TLAID AND t.TLALANGUE = s.TLALANGUE)
    WHEN MATCHED THEN UPDATE SET t.TLADESC = p_us, t.TLASCREEN = p_screen, t.TLADMAJ = SYSDATE
    WHEN NOT MATCHED THEN INSERT (TLAID, TLADESC, TLAMENU, TLASCREEN, TLALANGUE, TLADCRE, TLADMAJ, TLAUTIL)
    VALUES (p_id, p_us, 0, p_screen, 'us_US', SYSDATE, SYSDATE, 'admin');
    MERGE INTO TRA_LABELS t USING (SELECT p_id TLAID, 'en_GB' TLALANGUE FROM DUAL) s
    ON (t.TLAID = s.TLAID AND t.TLALANGUE = s.TLALANGUE)
    WHEN MATCHED THEN UPDATE SET t.TLADESC = p_gb, t.TLASCREEN = p_screen, t.TLADMAJ = SYSDATE
    WHEN NOT MATCHED THEN INSERT (TLAID, TLADESC, TLAMENU, TLASCREEN, TLALANGUE, TLADCRE, TLADMAJ, TLAUTIL)
    VALUES (p_id, p_gb, 0, p_screen, 'en_GB', SYSDATE, SYSDATE, 'admin');
    MERGE INTO TRA_LABELS t USING (SELECT p_id TLAID, 'fr_FR' TLALANGUE FROM DUAL) s
    ON (t.TLAID = s.TLAID AND t.TLALANGUE = s.TLALANGUE)
    WHEN MATCHED THEN UPDATE SET t.TLADESC = p_fr, t.TLASCREEN = p_screen, t.TLADMAJ = SYSDATE
    WHEN NOT MATCHED THEN INSERT (TLAID, TLADESC, TLAMENU, TLASCREEN, TLALANGUE, TLADCRE, TLADMAJ, TLAUTIL)
    VALUES (p_id, p_fr, 0, p_screen, 'fr_FR', SYSDATE, SYSDATE, 'admin');
  END;
BEGIN
  seed3('S93.TITLE', 'Mass-load settings', 'Mass-load settings', 'Parametres mass-load', 'SCR0000000093');
  seed3('S93.BTN.ADD', 'Add rule', 'Add rule', 'Ajouter une regle', 'SCR0000000093');
  seed3('S93.COL.TYPE', 'Load type', 'Load type', 'Type de chargement', 'SCR0000000093');
  seed3('S93.COL.SCOPE', 'Scope', 'Scope', 'Portee', 'SCR0000000093');
  seed3('S93.COL.NAME', 'Name', 'Name', 'Nom', 'SCR0000000093');
  seed3('S93.COL.TABLE', 'Target table', 'Target table', 'Table cible', 'SCR0000000093');
  seed3('S93.COL.ACTIVE', 'Active', 'Active', 'Actif', 'SCR0000000093');
  seed3('S93.DLG.EDIT', 'Edit mass-load rule', 'Edit mass-load rule', 'Modifier la regle mass-load', 'SCR0000000093');
  seed3('S93.DLG.NEW', 'New mass-load rule', 'New mass-load rule', 'Nouvelle regle mass-load', 'SCR0000000093');
  seed3('S93.FLD.CODE', 'Load code', 'Load code', 'Code chargement', 'SCR0000000093');
  seed3('S93.FLD.RULES', 'Rules JSON (CLOB)', 'Rules JSON (CLOB)', 'JSON des regles (CLOB)', 'SCR0000000093');
  seed3('S93.FLD.NOTES', 'Notes', 'Notes', 'Notes', 'SCR0000000093');
  seed3('S93.HINT.RULES',
        'JSON object with target_table and fields map. Structure depends on the GOLD interface table for this load type.',
        'JSON object with target_table and fields map. Structure depends on the GOLD interface table for this load type.',
        'Objet JSON avec target_table et map fields. La structure depend de la table interface GOLD du type de chargement.',
        'SCR0000000093');
  seed3('S93.MSG.JSON', 'Rules JSON is invalid', 'Rules JSON is invalid', 'JSON des regles invalide', 'SCR0000000093');
  seed3('S93.MSG.SAVED', 'Rule saved', 'Rule saved', 'Regle enregistree', 'SCR0000000093');
  seed3('S93.MSG.DEL', 'Delete this rule?', 'Delete this rule?', 'Supprimer cette regle ?', 'SCR0000000093');
END;
/

COMMIT;
