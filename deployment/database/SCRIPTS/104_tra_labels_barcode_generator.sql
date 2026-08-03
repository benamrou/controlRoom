-- S82 Barcode generator — labels (SCR0000000082)
-- Deploy after 103_menu_tools_barcode.sql. Re-login or language switch to reload LAB0000002.

SET DEFINE OFF;
SET SCAN OFF;

DECLARE
  PROCEDURE seed3(p_id VARCHAR2, p_us VARCHAR2, p_gb VARCHAR2, p_fr VARCHAR2, p_screen VARCHAR2) IS
  BEGIN
    MERGE INTO TRA_LABELS t USING (SELECT p_id TLAID, 'us_US' TLALANGUE FROM DUAL) s
    ON (t.TLAID = s.TLAID AND t.TLALANGUE = s.TLALANGUE)
    WHEN MATCHED THEN UPDATE SET t.TLADESC = p_us, t.TLASCREEN = p_screen, t.TLADMAJ = SYSDATE, t.TLAUTIL = 'admin'
    WHEN NOT MATCHED THEN INSERT (TLAID, TLADESC, TLAMENU, TLASCREEN, TLALANGUE, TLADCRE, TLADMAJ, TLAUTIL)
    VALUES (p_id, p_us, 0, p_screen, 'us_US', SYSDATE, SYSDATE, 'admin');
    MERGE INTO TRA_LABELS t USING (SELECT p_id TLAID, 'en_GB' TLALANGUE FROM DUAL) s
    ON (t.TLAID = s.TLAID AND t.TLALANGUE = s.TLALANGUE)
    WHEN MATCHED THEN UPDATE SET t.TLADESC = p_gb, t.TLASCREEN = p_screen, t.TLADMAJ = SYSDATE, t.TLAUTIL = 'admin'
    WHEN NOT MATCHED THEN INSERT (TLAID, TLADESC, TLAMENU, TLASCREEN, TLALANGUE, TLADCRE, TLADMAJ, TLAUTIL)
    VALUES (p_id, p_gb, 0, p_screen, 'en_GB', SYSDATE, SYSDATE, 'admin');
    MERGE INTO TRA_LABELS t USING (SELECT p_id TLAID, 'fr_FR' TLALANGUE FROM DUAL) s
    ON (t.TLAID = s.TLAID AND t.TLALANGUE = s.TLALANGUE)
    WHEN MATCHED THEN UPDATE SET t.TLADESC = p_fr, t.TLASCREEN = p_screen, t.TLADMAJ = SYSDATE, t.TLAUTIL = 'admin'
    WHEN NOT MATCHED THEN INSERT (TLAID, TLADESC, TLAMENU, TLASCREEN, TLALANGUE, TLADCRE, TLADMAJ, TLAUTIL)
    VALUES (p_id, p_fr, 0, p_screen, 'fr_FR', SYSDATE, SYSDATE, 'admin');
  END;
BEGIN
  seed3('S82.TITLE', 'Barcode generator', 'Barcode generator', 'Generateur codes-barres', 'SCR0000000082');
  seed3('S82.SUBTTL', 'Enter codes and generate barcodes instantly for testing and labels.',
        'Enter codes and generate barcodes instantly for testing and labels.',
        'Saisir des codes et generer des codes-barres pour tests et etiquettes.', 'SCR0000000082');
  seed3('S82.LBL.CODE', 'Enter codes', 'Enter codes', 'Saisir codes', 'SCR0000000082');
  seed3('S82.PLH.CODE', 'Paste or type codes — separate by Enter, comma, or tab',
        'Paste or type codes — separate by Enter, comma, or tab',
        'Coller ou saisir — separer par Entree, virgule ou tabulation', 'SCR0000000082');
  seed3('S82.HNT.CODE', 'Codes can be separated by newlines, commas, or tabs. Ctrl+Enter to generate.',
        'Codes can be separated by newlines, commas, or tabs. Ctrl+Enter to generate.',
        'Separer par retour ligne, virgule ou tabulation. Ctrl+Entree pour generer.', 'SCR0000000082');
  seed3('S82.LBL.FMT', 'Format', 'Format', 'Format', 'SCR0000000082');
  seed3('S82.BTN.GEN', 'Generate barcodes', 'Generate barcodes', 'Generer codes-barres', 'SCR0000000082');
  seed3('S82.BTN.PRNT', 'Print', 'Print', 'Imprimer', 'SCR0000000082');
  seed3('S82.MSG.GEN', 'barcode(s) generated', 'barcode(s) generated', 'code(s)-barres genere(s)', 'SCR0000000082');
  seed3('S82.MSG.INV', 'invalid', 'invalid', 'invalide(s)', 'SCR0000000082');
  seed3('S82.LBL.ZOOM', 'Zoom', 'Zoom', 'Zoom', 'SCR0000000082');
  seed3('S82.ZOOM.OUT', 'Zoom out', 'Zoom out', 'Zoom arriere', 'SCR0000000082');
  seed3('S82.ZOOM.IN', 'Zoom in', 'Zoom in', 'Zoom avant', 'SCR0000000082');
  seed3('S82.ZOOM.RST', 'Reset zoom', 'Reset zoom', 'Reinitialiser zoom', 'SCR0000000082');
END;
/

MERGE INTO TRA_TECHOBJ t
USING (
  SELECT 'SCR0000000082' AS TOBID,
         'Tools' AS TOBCAT,
         q'[<div><i class="bbs-keywords">What is it : </i>Barcode generator for testing labels and scanners. Paste multiple codes (newline, comma, or tab separated) and render CODE128, CODE39, EAN, UPC, ITF-14, MSI, or Pharmacode barcodes. No GOLD data access.</div>]' AS TOBDESC,
         q'[<div><i class="bbs-keywords">When to use : </i>Quick test barcodes for warehouse, POS, or Mobility apps without leaving ICR. Use Print for a clean label sheet.</div>]' AS TOBDESC2
    FROM dual
) s ON (t.TOBID = s.TOBID)
WHEN MATCHED THEN UPDATE SET
  TOBCAT = s.TOBCAT, TOBDESC = s.TOBDESC, TOBDESC2 = s.TOBDESC2, TOBDMAJ = SYSDATE, TOBUTIL = 'admin'
WHEN NOT MATCHED THEN INSERT (TOBID, TOBCAT, TOBDESC, TOBDESC2, TOBLANGUE, TOBDCRE, TOBDMAJ, TOBUTIL)
VALUES (s.TOBID, s.TOBCAT, s.TOBDESC, s.TOBDESC2, 'us_US', SYSDATE, SYSDATE, 'admin');

COMMIT;

SET DEFINE ON;
