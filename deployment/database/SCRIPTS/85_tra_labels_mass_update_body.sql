-- Phase 8b — Mass-change wizard body (all S08-S51 screens share MU.* keys)
-- Deploy after 84. TLAID max 15; TLADESC max 100.

SET DEFINE OFF;
SET SCAN OFF;

DECLARE
  PROCEDURE cmn(p_id VARCHAR2, p_us VARCHAR2, p_gb VARCHAR2, p_fr VARCHAR2) IS
  BEGIN
    MERGE INTO TRA_LABELS t USING (SELECT p_id TLAID, 'us_US' TLALANGUE FROM DUAL) s
    ON (t.TLAID = s.TLAID AND t.TLALANGUE = s.TLALANGUE)
    WHEN MATCHED THEN UPDATE SET t.TLADESC = p_us, t.TLASCREEN = 'COMMON', t.TLADMAJ = SYSDATE
    WHEN NOT MATCHED THEN INSERT (TLAID, TLADESC, TLAMENU, TLASCREEN, TLALANGUE, TLADCRE, TLADMAJ, TLAUTIL)
    VALUES (p_id, p_us, 0, 'COMMON', 'us_US', SYSDATE, SYSDATE, 'admin');
    MERGE INTO TRA_LABELS t USING (SELECT p_id TLAID, 'en_GB' TLALANGUE FROM DUAL) s
    ON (t.TLAID = s.TLAID AND t.TLALANGUE = s.TLALANGUE)
    WHEN MATCHED THEN UPDATE SET t.TLADESC = p_gb, t.TLASCREEN = 'COMMON', t.TLADMAJ = SYSDATE
    WHEN NOT MATCHED THEN INSERT (TLAID, TLADESC, TLAMENU, TLASCREEN, TLALANGUE, TLADCRE, TLADMAJ, TLAUTIL)
    VALUES (p_id, p_gb, 0, 'COMMON', 'en_GB', SYSDATE, SYSDATE, 'admin');
    MERGE INTO TRA_LABELS t USING (SELECT p_id TLAID, 'fr_FR' TLALANGUE FROM DUAL) s
    ON (t.TLAID = s.TLAID AND t.TLALANGUE = s.TLALANGUE)
    WHEN MATCHED THEN UPDATE SET t.TLADESC = p_fr, t.TLASCREEN = 'COMMON', t.TLADMAJ = SYSDATE
    WHEN NOT MATCHED THEN INSERT (TLAID, TLADESC, TLAMENU, TLASCREEN, TLALANGUE, TLADCRE, TLADMAJ, TLAUTIL)
    VALUES (p_id, p_fr, 0, 'COMMON', 'fr_FR', SYSDATE, SYSDATE, 'admin');
  END;
BEGIN
  cmn('MU.BTN.TMPL', 'TEMPLATE', 'TEMPLATE', 'MODELE');
  cmn('MU.BTN.BRWS', 'Browse', 'Browse', 'Parcourir');
  cmn('MU.BTN.CNFM', 'Confirm', 'Confirm', 'Confirmer');
  cmn('MU.BTN.VALD', 'Validate', 'Validate', 'Valider');
  cmn('MU.TOG.NOW', 'Now', 'Now', 'Maintenant');
  cmn('MU.TOG.SCHD', 'Schedule-it', 'Schedule-it', 'Planifier');
  cmn('MU.LBL.WHEN', 'When do you want to execute the changes?',
      'When do you want to execute the changes?',
      'Quand executer les changements ?');
  cmn('MU.FILE.HINT', 'Use the template file as example for column headers.',
      'Use the template file as example for column headers.',
      'Utilisez le modele comme exemple pour les entetes.');
  cmn('MU.FILE.INTRO', 'Select your change file. Required Excel columns:',
      'Select your change file. Required Excel columns:',
      'Choisir fichier. Colonnes Excel requises :');
  cmn('MU.COL.LABEL', 'COLUMN', 'COLUMN', 'COLONNE');
  cmn('MU.LBL.STRDT', 'Start date', 'Start date', 'Date debut');
  cmn('MU.LBL.ENDDT', 'End date', 'End date', 'Date fin');
  cmn('MU.LBL.TRACE', 'Item trace generation', 'Item trace generation', 'Trace article');
  cmn('MU.NOTE.LINK', '(*) Existing link ended at this date - 1.',
      '(*) Existing link ended at this date - 1.',
      '(*) Lien existant termine a cette date - 1.');
  cmn('MU.LBL.LNKDT', 'New link start date :', 'New link start date :', 'Nouvelle date debut lien :');
END;
/

COMMIT;

SET DEFINE ON;
