-- Screen SCR0000000071 — Space Planning POS exclude UPC
-- TLAID VARCHAR2(15) max; TLADESC VARCHAR2(100) max. Menu text: ICR_MENU_LABEL (script 93).
-- Do not use MENU_CODE or SCR* as TLAID.

DELETE FROM TRA_LABELS WHERE TLAID = 'ROUTE_SYNDIGOEXCLUDEPOS';

DECLARE
  PROCEDURE upsert_lbl(p_id VARCHAR2, p_desc VARCHAR2, p_screen VARCHAR2, p_lang VARCHAR2) IS
  BEGIN
    MERGE INTO TRA_LABELS t
    USING (SELECT p_id TLAID, p_lang TLALANGUE FROM dual) s
    ON (t.TLAID = s.TLAID AND t.TLALANGUE = s.TLALANGUE)
    WHEN MATCHED THEN UPDATE SET
      t.TLADESC = p_desc, t.TLAMENU = 1, t.TLASCREEN = p_screen, t.TLADMAJ = SYSDATE
    WHEN NOT MATCHED THEN INSERT (TLAID, TLADESC, TLAMENU, TLASCREEN, TLALANGUE, TLADCRE, TLADMAJ)
    VALUES (p_id, p_desc, 1, p_screen, p_lang, SYSDATE, SYSDATE);
  END;
BEGIN
  upsert_lbl('S71.TITLE', 'POS exclude from Space Planning', 'SCR0000000071', 'us_US');
  upsert_lbl('S71.HINT', 'Exclude UPCs from the POS extract. See (i) in the header for context.', 'SCR0000000071', 'us_US');
  upsert_lbl('S71.LBL.UPC', 'UPC', 'SCR0000000071', 'us_US');
  upsert_lbl('S71.LBL.CMT', 'Comment', 'SCR0000000071', 'us_US');
  upsert_lbl('S71.BTN.ADD', 'Add exclusion', 'SCR0000000071', 'us_US');

  upsert_lbl('S71.TITLE', 'POS exclude from Space Planning', 'SCR0000000071', 'en_GB');
  upsert_lbl('S71.HINT', 'Exclude UPCs from the POS extract. See (i) in the header for context.', 'SCR0000000071', 'en_GB');
  upsert_lbl('S71.LBL.UPC', 'UPC', 'SCR0000000071', 'en_GB');
  upsert_lbl('S71.LBL.CMT', 'Comment', 'SCR0000000071', 'en_GB');
  upsert_lbl('S71.BTN.ADD', 'Add exclusion', 'SCR0000000071', 'en_GB');

  upsert_lbl('S71.TITLE', 'Exclusion UPC POS', 'SCR0000000071', 'fr_FR');
  upsert_lbl('S71.HINT', 'Exclure des UPC de l''extract POS. Voir (i) dans l''en-tete.', 'SCR0000000071', 'fr_FR');
  upsert_lbl('S71.LBL.UPC', 'UPC', 'SCR0000000071', 'fr_FR');
  upsert_lbl('S71.LBL.CMT', 'Commentaire', 'SCR0000000071', 'fr_FR');
  upsert_lbl('S71.BTN.ADD', 'Ajouter exclusion', 'SCR0000000071', 'fr_FR');
END;
/

COMMIT;

-- TRA_TECHOBJ — breadcrumb info icon (app-page-header / ScreenService SCR0000001)
MERGE INTO TRA_TECHOBJ t
USING (
  SELECT 'SCR0000000071' AS TOBID,
         'Space Planning' AS TOBCAT,
         'us_US' AS TOBLANGUE,
         q'[<div><i class="bbs-keywords">What is it : </i>Maintains UPC/barcode values excluded from the Space Planning feed to POS (<code>SPACEPLANNING_EXCLUDEPOS@HEINENS_CUSTOM_PROD</code>). That feed is part of the GOLD Central to Space planning POS path. For Space Planning, the design team removes leading zeroes from barcodes in the extract - the digits sent to Space Planning may not match how the barcode appears in GOLD.</div>]' AS TOBDESC,
         q'[<div><i class="bbs-keywords">GOLD barcode rules : </i><ul><li>In GOLD Central, a barcode with leading zeroes and the same digits without leading zeroes are treated as different barcodes.</li><li>They are assigned different barcode types (typically EAN, UPC, or GTIN-14).</li><li>The same numeric code can therefore exist on different items when the type differs.</li></ul></div><div><i class="bbs-keywords">When to use : </i>Add a row when a barcode must not flow to Space Planning (raising issue) after leading-zero normalization, or when Space planning POS ambiguity should be avoided. Enter the value as used in the POS / Space Planning extract (often without leading zeroes), not necessarily the GOLD display format.</div>]' AS TOBDESC2
    FROM dual
) s
ON (t.TOBID = s.TOBID AND t.TOBLANGUE = s.TOBLANGUE)
WHEN MATCHED THEN UPDATE SET
  t.TOBCAT = s.TOBCAT, t.TOBDESC = s.TOBDESC, t.TOBDESC2 = s.TOBDESC2, t.TOBDMAJ = SYSDATE, t.TOBUTIL = 'admin'
WHEN NOT MATCHED THEN INSERT (TOBID, TOBCAT, TOBDESC, TOBDESC2, TOBLANGUE, TOBDCRE, TOBDMAJ, TOBUTIL)
VALUES (s.TOBID, s.TOBCAT, s.TOBDESC, s.TOBDESC2, s.TOBLANGUE, SYSDATE, SYSDATE, 'admin');

MERGE INTO TRA_TECHOBJ t
USING (
  SELECT 'SCR0000000071' AS TOBID,
         'Space Planning' AS TOBCAT,
         'fr_FR' AS TOBLANGUE,
         q'[<div><i class="bbs-keywords">Objet : </i>Liste des UPC/codes-barres exclus du flux Space Planning vers POS (<code>SPACEPLANNING_EXCLUDEPOS@HEINENS_CUSTOM_PROD</code>). Flux GOLD Central vers Space planning POS. L''equipe design supprime les zeros en tete dans l''extract - les chiffres envoyes a Space Planning peuvent differer de GOLD.</div>]' AS TOBDESC,
         q'[<div><i class="bbs-keywords">Regles codes-barres GOLD : </i><ul><li>Avec ou sans zeros en tete = codes-barres differents dans GOLD Central.</li><li>Types differents (EAN, UPC ou GTIN-14).</li><li>Meme code numerique possible sur des articles differents selon le type.</li></ul></div><div><i class="bbs-keywords">Quand l''utiliser : </i>Ajouter une ligne si un code-barre ne doit pas aller vers Space Planning (probleme signale) apres normalisation des zeros en tete, ou pour eviter une ambiguite Space planning POS. Saisir la valeur comme dans l''extract POS / Space Planning (souvent sans zeros en tete), pas forcement le format GOLD.</div>]' AS TOBDESC2
    FROM dual
) s
ON (t.TOBID = s.TOBID AND t.TOBLANGUE = s.TOBLANGUE)
WHEN MATCHED THEN UPDATE SET
  t.TOBCAT = s.TOBCAT, t.TOBDESC = s.TOBDESC, t.TOBDESC2 = s.TOBDESC2, t.TOBDMAJ = SYSDATE, t.TOBUTIL = 'admin'
WHEN NOT MATCHED THEN INSERT (TOBID, TOBCAT, TOBDESC, TOBDESC2, TOBLANGUE, TOBDCRE, TOBDMAJ, TOBUTIL)
VALUES (s.TOBID, s.TOBCAT, s.TOBDESC, s.TOBDESC2, s.TOBLANGUE, SYSDATE, SYSDATE, 'admin');

COMMIT;
