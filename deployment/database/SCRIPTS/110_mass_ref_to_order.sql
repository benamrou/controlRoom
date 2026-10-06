-- =============================================================================
-- 110_mass_ref_to_order.sql
-- Mass-load: Reference to order (tool 22 / ICR_TEMPLATE021 / SCR0000000090)
-- Incremental — safe to re-run on existing ICR DBs.
--
-- Deploy after menu script 35 (or alone on DBs that already have GRP_MASS).
-- Pair with 111_pkmasschange_ref_to_order.sql (PKMASSCHANGE package patch).
-- Template file: controlRoom_server/server/templates/ICR_TEMPLATE021.xlsx
-- =============================================================================

SET DEFINE OFF;

-- ── Menu catalog ─────────────────────────────────────────────────────────────
MERGE INTO ICR_MENU_ENTRY t
USING (
  SELECT 'ROUTE_REFORDER' AS MENU_CODE,
         'GRP_MASS'       AS PARENT_CODE,
         'ROUTE'          AS MENU_TYPE,
         'STANDARD'       AS MENU_MODE,
         '/referencetoorder' AS ROUTE_PATH,
         'fas fa-link'    AS ICON_CLASS,
         'Reference to order' AS LABEL_TEXT,
         250              AS SORT_ORDER,
         CAST(NULL AS VARCHAR2(50)) AS EXPAND_KEY,
         1                AS ACTIVE
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

-- Flag rule: DATAINTEGRITY (same as other mass-load screens)
INSERT INTO ICR_MENU_ACCESS_RULE (MENU_CODE, FLAG_NAME)
SELECT 'ROUTE_REFORDER', 'DATAINTEGRITY' FROM dual
 WHERE NOT EXISTS (
       SELECT 1 FROM ICR_MENU_ACCESS_RULE r
        WHERE r.MENU_CODE = 'ROUTE_REFORDER' AND r.FLAG_NAME = 'DATAINTEGRITY'
     );

-- Profile DATA_INTEGRITY (PROFILE_ID = 8)
INSERT INTO ICR_PROFILE_MENU (PROFILE_ID, MENU_CODE, GRANTED)
SELECT 8, 'ROUTE_REFORDER', 1 FROM dual
 WHERE NOT EXISTS (
       SELECT 1 FROM ICR_PROFILE_MENU pm
        WHERE pm.PROFILE_ID = 8 AND pm.MENU_CODE = 'ROUTE_REFORDER'
     );

-- Menu i18n (ICR_MENU_LABEL — FK to ICR_MENU_ENTRY)
MERGE INTO ICR_MENU_LABEL t
USING (
  SELECT 'ROUTE_REFORDER' AS MENU_CODE, 'us_US' AS MLLANGUE, 'Reference to order' AS LABEL_TEXT FROM dual
  UNION ALL
  SELECT 'ROUTE_REFORDER', 'en_GB', 'Reference to order' FROM dual
  UNION ALL
  SELECT 'ROUTE_REFORDER', 'fr_FR', 'Reference a la commande' FROM dual
) s ON (t.MENU_CODE = s.MENU_CODE AND t.MLLANGUE = s.MLLANGUE)
WHEN MATCHED THEN UPDATE SET
  t.LABEL_TEXT = s.LABEL_TEXT,
  t.MLDMAJ     = SYSDATE,
  t.MLUTIL     = 'ICR'
WHEN NOT MATCHED THEN INSERT (MENU_CODE, MLLANGUE, LABEL_TEXT, MLDCRE, MLDMAJ, MLUTIL)
VALUES (s.MENU_CODE, s.MLLANGUE, s.LABEL_TEXT, SYSDATE, SYSDATE, 'ICR');

-- ── Journal scope (PARAMETERS param 33 + TRA_ENTRIES) ────────────────────────
-- Clone PARAMAPPLI / PARAMCORP from an existing mass tool entry when present.
MERGE INTO PARAMETERS t
USING (
  SELECT 33 AS PARAMID,
         22 AS PARAMENTRY,
         NVL((SELECT MIN(PARAMAPPLI) FROM PARAMETERS WHERE PARAMID = 33), 1) AS PARAMAPPLI,
         (SELECT MAX(PARAMCORP) FROM PARAMETERS WHERE PARAMID = 33 AND ROWNUM = 1) AS PARAMCORP,
         'Reference to order' AS PARAMCHAR1
    FROM dual
) s
ON (t.PARAMID = s.PARAMID AND t.PARAMAPPLI = s.PARAMAPPLI AND t.PARAMENTRY = s.PARAMENTRY)
WHEN MATCHED THEN UPDATE SET
  t.PARAMCHAR1 = s.PARAMCHAR1,
  t.PARAMDMAJ  = SYSDATE,
  t.PARAMUTIL  = 'ICR'
WHEN NOT MATCHED THEN INSERT (
  PARAMID, PARAMENTRY, PARAMAPPLI, PARAMCORP, PARAMCHAR1, PARAMDCRE, PARAMDMAJ, PARAMUTIL
) VALUES (
  s.PARAMID, s.PARAMENTRY, s.PARAMAPPLI, s.PARAMCORP, s.PARAMCHAR1, SYSDATE, SYSDATE, 'ICR'
);

-- Localized journal labels (all languages already used for param 33)
MERGE INTO TRA_ENTRIES t
USING (
  SELECT 22 AS TENTRYID,
         l.TENTRYLANG,
         33 AS TENTRYPARAMID,
         CASE l.TENTRYLANG
           WHEN 'fr_FR' THEN 'Reference a la commande'
           ELSE 'Reference to order'
         END AS TENTRYDESC,
         'Mass change tool 22 — ARTUC.ARAREFC' AS TENTRYCOMMENT
    FROM (SELECT DISTINCT TENTRYLANG FROM TRA_ENTRIES WHERE TENTRYPARAMID = 33) l
) s
ON (t.TENTRYID = s.TENTRYID AND t.TENTRYLANG = s.TENTRYLANG AND t.TENTRYPARAMID = s.TENTRYPARAMID)
WHEN MATCHED THEN UPDATE SET
  t.TENTRYDESC    = s.TENTRYDESC,
  t.TENTRYCOMMENT = s.TENTRYCOMMENT,
  t.TENTRYDMAJ    = SYSDATE,
  t.TENTRYUTIL    = 'ICR'
WHEN NOT MATCHED THEN INSERT (
  TENTRYID, TENTRYDESC, TENTRYCOMMENT, TENTRYLANG, TENTRYDCRE, TENTRYDMAJ, TENTRYUTIL, TENTRYPARAMID
) VALUES (
  s.TENTRYID, s.TENTRYDESC, s.TENTRYCOMMENT, s.TENTRYLANG, SYSDATE, SYSDATE, 'ICR', s.TENTRYPARAMID
);

-- Fallback if TRA_ENTRIES has no param-33 rows yet
INSERT INTO TRA_ENTRIES (TENTRYID, TENTRYDESC, TENTRYCOMMENT, TENTRYLANG, TENTRYDCRE, TENTRYDMAJ, TENTRYUTIL, TENTRYPARAMID)
SELECT 22, 'Reference to order', 'Mass change tool 22 — ARTUC.ARAREFC', 'us_US', SYSDATE, SYSDATE, 'ICR', 33
  FROM dual
 WHERE NOT EXISTS (
       SELECT 1 FROM TRA_ENTRIES
        WHERE TENTRYID = 22 AND TENTRYPARAMID = 33 AND TENTRYLANG = 'us_US'
     );

COMMIT;

-- ── TRA_LABELS (screen title + MU columns) — same seed pattern as scripts 80/89/91
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
  seed3('S90.TITLE', 'Reference to order', 'Reference to order', 'Reference a la commande', 'SCR0000000090');
  seed3('S90.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee', 'SCR0000000090');
  seed3('S90.MU.CA', 'COLUMN A: VENDOR', 'COLUMN A: VENDOR', 'COLONNE A : VENDOR', 'SCR0000000090');
  seed3('S90.MU.CB', 'COLUMN B: ITEM_NUMBER', 'COLUMN B: ITEM_NUMBER', 'COLONNE B : ITEM_NUMBER', 'SCR0000000090');
  seed3('S90.MU.CC', 'COLUMN C: LV', 'COLUMN C: LV', 'COLONNE C : LV', 'SCR0000000090');
  seed3('S90.MU.CD', 'COLUMN D: REF_TO_ORDER', 'COLUMN D: REF_TO_ORDER', 'COLONNE D : REF_TO_ORDER', 'SCR0000000090');
  seed3('S90.MU.CNM',
        'Respect column header names from the template file (see columns above).',
        'Respect column header names from the template file (see columns above).',
        'Respecter les entetes du modele (voir colonnes ci-dessus).',
        'SCR0000000090');
  seed3('S90.MU.SEL',
        'Select your Reference to order file change.',
        'Select your Reference to order file change.',
        'Choisir votre fichier Reference to order.',
        'SCR0000000090');
  seed3('S90.MU.STP0',
        'Select your Reference to order file change.',
        'Select your Reference to order file change.',
        'Choisir votre fichier Reference to order.',
        'SCR0000000090');
  seed3('S90.MU.WHEN',
        'When do you want to execute the Reference to order changes?',
        'When do you want to execute the Reference to order changes?',
        'Quand souhaitez-vous executer les changements Reference to order?',
        'SCR0000000090');
  seed3('S90.MU.XLS',
        'The XLS(x) Excel file should contain those four column headers:',
        'The XLS(x) Excel file should contain those four column headers:',
        'Le fichier Excel XLS(x) doit contenir ces quatre en-tetes de colonnes:',
        'SCR0000000090');
END;
/
COMMIT;

PROMPT Also run 113_tra_techobj_ref_to_order.sql for SCR0000000090 page-header helper (UNFI / check digit).

SET DEFINE ON;

PROMPT 110_mass_ref_to_order.sql complete — also deploy 111_pkmasschange_ref_to_order.sql and 113_tra_techobj_ref_to_order.sql
/