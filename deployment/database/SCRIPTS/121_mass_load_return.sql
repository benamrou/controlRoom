-- =============================================================================
-- 121_mass_load_return.sql
-- Mass-load: Load for return (tool 24 / ICR_TEMPLATE023 / SCR0000000092)
-- Incremental — safe to re-run on existing ICR DBs.
--
-- Deploy after menu script 35 (or alone on DBs that already have GRP_MASS).
-- Pair with 122_pkmasschange_load_return.sql (PKMASSCHANGE package patch).
-- Template file: controlRoom_server/server/templates/ICR_TEMPLATE023.xlsx
-- Columns: SITE, VENDOR_CODE, ITEM_CODE, LV, QTY
-- GOLD batch: psint41p twice (class 10 then class 0)
-- =============================================================================

SET DEFINE OFF;

-- ── Menu catalog ─────────────────────────────────────────────────────────────
MERGE INTO ICR_MENU_ENTRY t
USING (
  SELECT 'ROUTE_LOADRETURN' AS MENU_CODE,
         'GRP_MASS'         AS PARENT_CODE,
         'ROUTE'            AS MENU_TYPE,
         'STANDARD'         AS MENU_MODE,
         '/loadreturn'      AS ROUTE_PATH,
         'fas fa-undo'      AS ICON_CLASS,
         'Load for return'  AS LABEL_TEXT,
         252                AS SORT_ORDER,
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
SELECT 'ROUTE_LOADRETURN', 'DATAINTEGRITY' FROM dual
 WHERE NOT EXISTS (
       SELECT 1 FROM ICR_MENU_ACCESS_RULE r
        WHERE r.MENU_CODE = 'ROUTE_LOADRETURN' AND r.FLAG_NAME = 'DATAINTEGRITY'
     );

INSERT INTO ICR_MENU_ACCESS_RULE (MENU_CODE, FLAG_NAME)
SELECT 'ROUTE_LOADRETURN', 'BUYER' FROM dual
 WHERE NOT EXISTS (
       SELECT 1 FROM ICR_MENU_ACCESS_RULE r
        WHERE r.MENU_CODE = 'ROUTE_LOADRETURN' AND r.FLAG_NAME = 'BUYER'
     );

INSERT INTO ICR_PROFILE_MENU (PROFILE_ID, MENU_CODE, GRANTED)
SELECT 8, 'ROUTE_LOADRETURN', 1 FROM dual
 WHERE NOT EXISTS (
       SELECT 1 FROM ICR_PROFILE_MENU pm
        WHERE pm.PROFILE_ID = 8 AND pm.MENU_CODE = 'ROUTE_LOADRETURN'
     );

INSERT INTO ICR_PROFILE_MENU (PROFILE_ID, MENU_CODE, GRANTED)
SELECT 2, 'ROUTE_LOADRETURN', 1 FROM dual
 WHERE NOT EXISTS (
       SELECT 1 FROM ICR_PROFILE_MENU pm
        WHERE pm.PROFILE_ID = 2 AND pm.MENU_CODE = 'ROUTE_LOADRETURN'
     );

MERGE INTO ICR_MENU_LABEL t
USING (
  SELECT 'ROUTE_LOADRETURN' AS MENU_CODE, 'us_US' AS MLLANGUE, 'Load for return' AS LABEL_TEXT FROM dual
  UNION ALL
  SELECT 'ROUTE_LOADRETURN', 'en_GB', 'Load for return' FROM dual
  UNION ALL
  SELECT 'ROUTE_LOADRETURN', 'fr_FR', 'Chargement retours' FROM dual
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
         24 AS PARAMENTRY,
         NVL((SELECT MIN(PARAMAPPLI) FROM PARAMETERS WHERE PARAMID = 33), 1) AS PARAMAPPLI,
         (SELECT MAX(PARAMCORP) FROM PARAMETERS WHERE PARAMID = 33 AND ROWNUM = 1) AS PARAMCORP,
         'Load for return' AS PARAMCHAR1
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
  SELECT 24 AS TENTRYID,
         l.TENTRYLANG,
         33 AS TENTRYPARAMID,
         CASE l.TENTRYLANG
           WHEN 'fr_FR' THEN 'Chargement retours'
           ELSE 'Load for return'
         END AS TENTRYDESC,
         'Mass change tool 24 — INTDETRET / psint41p class 10+0' AS TENTRYCOMMENT
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
SELECT 24, 'Load for return', 'Mass change tool 24 — INTDETRET / psint41p class 10+0', 'us_US', SYSDATE, SYSDATE, 'ICR', 33
  FROM dual
 WHERE NOT EXISTS (
       SELECT 1 FROM TRA_ENTRIES
        WHERE TENTRYID = 24 AND TENTRYPARAMID = 33 AND TENTRYLANG = 'us_US'
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
  seed3('S92.TITLE', 'Load for return', 'Load for return', 'Chargement retours', 'SCR0000000092');
  seed3('S92.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee', 'SCR0000000092');
  seed3('S92.MU.CA', 'COLUMN A: SITE — store or warehouse', 'COLUMN A: SITE — store or warehouse', 'COLONNE A : SITE — magasin ou entrepot', 'SCR0000000092');
  seed3('S92.MU.CB', 'COLUMN B: VENDOR_CODE — supplier', 'COLUMN B: VENDOR_CODE — supplier', 'COLONNE B : VENDOR_CODE — fournisseur', 'SCR0000000092');
  seed3('S92.MU.CC', 'COLUMN C: ITEM_CODE — item', 'COLUMN C: ITEM_CODE — item', 'COLONNE C : ITEM_CODE — article', 'SCR0000000092');
  seed3('S92.MU.CD', 'COLUMN D: LV — pack / logistic variant', 'COLUMN D: LV — pack / logistic variant', 'COLONNE D : LV — conditionnement', 'SCR0000000092');
  seed3('S92.MU.CE', 'COLUMN E: QTY — quantity in SKU', 'COLUMN E: QTY — quantity in SKU', 'COLONNE E : QTY — quantite en SKU', 'SCR0000000092');
  seed3('S92.MU.PURP', 'Purpose:', 'Purpose:', 'Objectif :', 'SCR0000000092');
  seed3('S92.MU.PURP.TXT',
        'Create supplier returns in bulk from your Excel file. The system validates each line, then creates and processes the returns for store and warehouse.',
        'Create supplier returns in bulk from your Excel file. The system validates each line, then creates and processes the returns for store and warehouse.',
        'Creer des retours fournisseur en masse a partir de votre fichier Excel. Le systeme controle chaque ligne, puis cree et traite les retours magasin et entrepot.',
        'SCR0000000092');
  seed3('S92.MU.CHK', 'Checks (before execute):', 'Checks (before execute):', 'Controles (avant execution) :', 'SCR0000000092');
  seed3('S92.MU.CHK1',
        'Store/warehouse, supplier, and item + pack must be valid.',
        'Store/warehouse, supplier, and item + pack must be valid.',
        'Le magasin/entrepot, le fournisseur et l''article + conditionnement doivent etre valides.',
        'SCR0000000092');
  seed3('S92.MU.CHK2',
        'Quantity must be greater than 0 (expressed in SKU).',
        'Quantity must be greater than 0 (expressed in SKU).',
        'La quantite doit etre superieure a 0 (exprimee en SKU).',
        'SCR0000000092');
  seed3('S92.MU.CHK3',
        'The item/pack must be (or have been) orderable for that site from that supplier.',
        'The item/pack must be (or have been) orderable for that site from that supplier.',
        'L''article/conditionnement doit etre (ou avoir ete) commandable pour ce site chez ce fournisseur.',
        'SCR0000000092');
  seed3('S92.MU.CNM',
        'Use the exact column headers from the template (SITE, VENDOR_CODE, ITEM_CODE, LV, QTY).',
        'Use the exact column headers from the template (SITE, VENDOR_CODE, ITEM_CODE, LV, QTY).',
        'Utiliser exactement les en-tetes du modele (SITE, VENDOR_CODE, ITEM_CODE, LV, QTY).',
        'SCR0000000092');
  seed3('S92.MU.SEL',
        'Select your return file.',
        'Select your return file.',
        'Choisir votre fichier de retours.',
        'SCR0000000092');
  seed3('S92.MU.STP0',
        'Select your return file.',
        'Select your return file.',
        'Choisir votre fichier de retours.',
        'SCR0000000092');
  seed3('S92.MU.WHEN',
        'When do you want to create the returns?',
        'When do you want to create the returns?',
        'Quand souhaitez-vous creer les retours?',
        'SCR0000000092');
  seed3('S92.MU.XLS',
        'Your Excel file must include these five column headers:',
        'Your Excel file must include these five column headers:',
        'Votre fichier Excel doit contenir ces cinq en-tetes de colonnes:',
        'SCR0000000092');
  seed3('S92.MU.CFG',
        'No extra options are required — continue to create the returns.',
        'No extra options are required — continue to create the returns.',
        'Aucune option supplementaire — continuer pour creer les retours.',
        'SCR0000000092');
END;
/
COMMIT;

SET DEFINE ON;

PROMPT 121_mass_load_return.sql complete — also deploy 122_pkmasschange_load_return.sql
PROMPT Also run 123_tra_techobj_load_return.sql for SCR0000000092 page-header helper.
/
