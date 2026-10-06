-- =============================================================================
-- 115_mass_new_item_ppg.sql
-- Mass-load: New Item PPG (tool 23 / ICR_TEMPLATE022 / SCR0000000091)
-- Incremental — safe to re-run on existing ICR DBs.
--
-- Deploy after menu script 35 (or alone on DBs that already have GRP_MASS).
-- Pair with 116_pkmasschange_new_item_ppg.sql (PKMASSCHANGE package patch).
-- Template file: controlRoom_server/server/templates/ICR_TEMPLATE022.xlsx
-- Columns: UPC, PPG_NAME, PPG_ID
-- PPG_ID is used as ARTENTLIST.ELINLIS / ARTDETLIST.DLINLIS (no auto-allocation).
-- =============================================================================

SET DEFINE OFF;

-- ── Menu catalog ─────────────────────────────────────────────────────────────
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

-- ── Journal scope (PARAMETERS param 33 + TRA_ENTRIES) ────────────────────────
MERGE INTO PARAMETERS t
USING (
  SELECT 33 AS PARAMID,
         23 AS PARAMENTRY,
         NVL((SELECT MIN(PARAMAPPLI) FROM PARAMETERS WHERE PARAMID = 33), 1) AS PARAMAPPLI,
         (SELECT MAX(PARAMCORP) FROM PARAMETERS WHERE PARAMID = 33 AND ROWNUM = 1) AS PARAMCORP,
         'New Item PPG' AS PARAMCHAR1
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

MERGE INTO TRA_ENTRIES t
USING (
  SELECT 23 AS TENTRYID,
         l.TENTRYLANG,
         33 AS TENTRYPARAMID,
         CASE l.TENTRYLANG
           WHEN 'fr_FR' THEN 'Nouvel Item PPG'
           ELSE 'New Item PPG'
         END AS TENTRYDESC,
         'Mass change tool 23 — ARTENTLIST/ARTDETLIST / New PPG by PPG_ID' AS TENTRYCOMMENT
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

INSERT INTO TRA_ENTRIES (TENTRYID, TENTRYDESC, TENTRYCOMMENT, TENTRYLANG, TENTRYDCRE, TENTRYDMAJ, TENTRYUTIL, TENTRYPARAMID)
SELECT 23, 'New Item PPG', 'Mass change tool 23 — ARTENTLIST/ARTDETLIST / New PPG by PPG_ID', 'us_US', SYSDATE, SYSDATE, 'ICR', 33
  FROM dual
 WHERE NOT EXISTS (
       SELECT 1 FROM TRA_ENTRIES
        WHERE TENTRYID = 23 AND TENTRYPARAMID = 33 AND TENTRYLANG = 'us_US'
     );

COMMIT;

-- ── TRA_LABELS ───────────────────────────────────────────────────────────────
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
  seed3('S91.TITLE', 'New Item PPG', 'New Item PPG', 'Nouvel Item PPG', 'SCR0000000091');
  seed3('S91.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee', 'SCR0000000091');
  seed3('S91.MU.CA', 'COLUMN A: UPC', 'COLUMN A: UPC', 'COLONNE A : UPC', 'SCR0000000091');
  seed3('S91.MU.CB', 'COLUMN B: PPG_NAME', 'COLUMN B: PPG_NAME', 'COLONNE B : PPG_NAME', 'SCR0000000091');
  seed3('S91.MU.CC', 'COLUMN C: PPG_ID', 'COLUMN C: PPG_ID', 'COLONNE C : PPG_ID', 'SCR0000000091');
  seed3('S91.MU.PURP', 'Purpose:', 'Purpose:', 'Objectif :', 'SCR0000000091');
  seed3('S91.MU.PURP.TXT',
        'This load creates the PPG list (PPG_ID / PPG_NAME) and attaches each corresponding UPC.',
        'This load creates the PPG list (PPG_ID / PPG_NAME) and attaches each corresponding UPC.',
        'Ce chargement cree la liste PPG (PPG_ID / PPG_NAME) et rattache chaque UPC correspondant.',
        'SCR0000000091');
  seed3('S91.MU.CHK', 'Checks (before execute):', 'Checks (before execute):', 'Controles (avant execution) :', 'SCR0000000091');
  seed3('S91.MU.CHK1',
        'UPC must be active.',
        'UPC must be active.',
        'L''UPC doit etre actif.',
        'SCR0000000091');
  seed3('S91.MU.CHK2',
        'PPG_ID must not already exist.',
        'PPG_ID must not already exist.',
        'Le PPG_ID ne doit pas deja exister.',
        'SCR0000000091');
  seed3('S91.MU.CNM',
        'Respect column header names from the template file (see columns above).',
        'Respect column header names from the template file (see columns above).',
        'Respecter les entetes du modele (voir colonnes ci-dessus).',
        'SCR0000000091');
  seed3('S91.MU.SEL',
        'Select your New Item PPG file.',
        'Select your New Item PPG file.',
        'Choisir votre fichier New Item PPG.',
        'SCR0000000091');
  seed3('S91.MU.STP0',
        'Select your New Item PPG file.',
        'Select your New Item PPG file.',
        'Choisir votre fichier New Item PPG.',
        'SCR0000000091');
  seed3('S91.MU.WHEN',
        'When do you want to execute the New Item PPG changes?',
        'When do you want to execute the New Item PPG changes?',
        'Quand souhaitez-vous executer les changements New Item PPG?',
        'SCR0000000091');
  seed3('S91.MU.XLS',
        'The XLS(x) Excel file should contain those three column headers:',
        'The XLS(x) Excel file should contain those three column headers:',
        'Le fichier Excel XLS(x) doit contenir ces trois en-tetes de colonnes:',
        'SCR0000000091');
END;
/
COMMIT;

SET DEFINE ON;

PROMPT 115_mass_new_item_ppg.sql complete — also deploy 116_pkmasschange_new_item_ppg.sql
PROMPT Also run 118_tra_techobj_new_item_ppg.sql for SCR0000000091 page-header helper.
/
