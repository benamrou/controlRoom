-- =============================================================================
-- 117_menu_route_newitemppg.sql
-- Incremental menu only — ROUTE_NEWITEMPPG (no catalog wipe, no LIBQUERY).
-- Requires GRP_MASS already present (script 35 or prior deploy).
-- Safe to re-run. Users must re-login for SET0000040 to pick up the grant.
-- Also covered by 115_mass_new_item_ppg.sql (menu + journal + labels).
-- =============================================================================

SET DEFINE OFF;

MERGE INTO ICR_MENU_ENTRY t
USING (
  SELECT 'ROUTE_NEWITEMPPG' AS MENU_CODE,
         'GRP_MASS'         AS PARENT_CODE,
         'ROUTE'            AS MENU_TYPE,
         'STANDARD'         AS MENU_MODE,
         '/newitemppg'      AS ROUTE_PATH,
         'fas fa-tags'      AS ICON_CLASS,
         'New Item PPG'     AS LABEL_TEXT,
         251                AS SORT_ORDER,
         CAST(NULL AS VARCHAR2(50)) AS EXPAND_KEY,
         1                  AS ACTIVE
    FROM dual
) s ON (t.MENU_CODE = s.MENU_CODE)
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

INSERT INTO ICR_MENU_ACCESS_RULE (MENU_CODE, FLAG_NAME)
SELECT 'ROUTE_NEWITEMPPG', 'DATAINTEGRITY' FROM dual
 WHERE NOT EXISTS (
       SELECT 1 FROM ICR_MENU_ACCESS_RULE r
        WHERE r.MENU_CODE = 'ROUTE_NEWITEMPPG' AND r.FLAG_NAME = 'DATAINTEGRITY'
     );

INSERT INTO ICR_PROFILE_MENU (PROFILE_ID, MENU_CODE, GRANTED)
SELECT 8, 'ROUTE_NEWITEMPPG', 1 FROM dual
 WHERE NOT EXISTS (
       SELECT 1 FROM ICR_PROFILE_MENU pm
        WHERE pm.PROFILE_ID = 8 AND pm.MENU_CODE = 'ROUTE_NEWITEMPPG'
     );

MERGE INTO ICR_MENU_LABEL t
USING (
  SELECT 'ROUTE_NEWITEMPPG' AS MENU_CODE, 'us_US' AS MLLANGUE, 'New Item PPG' AS LABEL_TEXT FROM dual
  UNION ALL
  SELECT 'ROUTE_NEWITEMPPG', 'en_GB', 'New Item PPG' FROM dual
  UNION ALL
  SELECT 'ROUTE_NEWITEMPPG', 'fr_FR', 'Nouvel Item PPG' FROM dual
) s ON (t.MENU_CODE = s.MENU_CODE AND t.MLLANGUE = s.MLLANGUE)
WHEN MATCHED THEN UPDATE SET
  t.LABEL_TEXT = s.LABEL_TEXT,
  t.MLDMAJ     = SYSDATE,
  t.MLUTIL     = 'ICR'
WHEN NOT MATCHED THEN INSERT (MENU_CODE, MLLANGUE, LABEL_TEXT, MLDCRE, MLDMAJ, MLUTIL)
VALUES (s.MENU_CODE, s.MLLANGUE, s.LABEL_TEXT, SYSDATE, SYSDATE, 'ICR');

COMMIT;

PROMPT 117_menu_route_newitemppg.sql complete — re-login required for sidebar
/
