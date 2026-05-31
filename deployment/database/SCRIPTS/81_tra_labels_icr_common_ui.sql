-- Phase 7b — ICR shared UI (mass-update wizards, login, common dialogs)
-- Deploy after 80. TLADESC max 100; no ampersand in literals.

SET DEFINE OFF;
SET SCAN OFF;

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

  PROCEDURE cmn(p_id VARCHAR2, p_us VARCHAR2, p_gb VARCHAR2, p_fr VARCHAR2) IS
  BEGIN
    seed3(p_id, p_us, p_gb, p_fr, 'COMMON');
  END;

BEGIN
  -- Mass-update wizard (shared across mass.update/*)
  cmn('MU.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee');
  cmn('MU.DLG.RCP', 'Execution Recap', 'Execution Recap', 'Recapitulatif execution');
  cmn('MU.RCP.OK', 'All records processed successfully!', 'All records processed successfully!',
      'Tous les enregistrements traites avec succes !');
  cmn('MU.RCP.SUM', 'Summary Mass-Change', 'Summary Mass-Change', 'Resume modification de masse');
  cmn('MU.RCP.TOT', 'Total Records:', 'Total Records:', 'Total enregistrements :');
  cmn('MU.RCP.SUC', 'Successfully Loaded:', 'Successfully Loaded:', 'Charges avec succes :');
  cmn('MU.RCP.ERR', 'Errors:', 'Errors:', 'Erreurs :');
  cmn('MU.BTN.ORG', 'Reorganize', 'Reorganize', 'Reorganiser');
  cmn('MU.BTN.LAY', 'Save layout', 'Save layout', 'Enregistrer disposition');

  -- Login (LAB0000002 area — screen LOGIN)
  seed3('LG.TITLE', 'Inventory Control Room', 'Inventory Control Room', 'Salle de controle inventaire', 'LOGIN');
  seed3('LG.USER', 'User id', 'User id', 'Identifiant', 'LOGIN');
  seed3('LG.PASS', 'Password', 'Password', 'Mot de passe', 'LOGIN');
  seed3('LG.SIGNIN', 'Sign in', 'Sign in', 'Connexion', 'LOGIN');
  seed3('LG.ENV', 'Environment', 'Environment', 'Environnement', 'LOGIN');
  seed3('LG.LANG', 'Language', 'Language', 'Langue', 'LOGIN');

  -- Reporting / generic
  cmn('RPT.DONE', 'Process Completed', 'Process Completed', 'Traitement termine');
  cmn('RPT.TEST', 'Query Test Results', 'Query Test Results', 'Resultats test requete');
  cmn('RPT.CSV', 'CSV', 'CSV', 'CSV');

END;
/

COMMIT;

SET DEFINE ON;
