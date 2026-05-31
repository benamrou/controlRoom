-- Phase 8 — ICR screen body: shared CMN/TBL/MU/ALT/RT/SCH keys (forms, tables, wizards)
-- Deploy after 83. TLAID max 15; TLADESC max 100; no ampersand in literals.

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
  -- Table / toolbar (site-wide)
  cmn('CMN.CSV', 'CSV', 'CSV', 'CSV');
  cmn('CMN.GLBSRH', 'Global Search', 'Global Search', 'Recherche globale');
  cmn('CMN.SRCHBTN', 'Search', 'Search', 'Rechercher');
  cmn('CMN.EXEC', 'Execute', 'Execute', 'Executer');
  cmn('CMN.DOWN', 'Download', 'Download', 'Telecharger');
  cmn('CMN.UPLOAD', 'Upload', 'Upload', 'Charger');
  cmn('CMN.REFS', 'references', 'references', 'references');
  cmn('CMN.EDIT', 'Edit', 'Edit', 'Modifier');
  cmn('CMN.CREATE', 'Create', 'Create', 'Creer');
  cmn('CMN.RUN', 'Run', 'Run', 'Lancer');
  cmn('CMN.TEST', 'Test', 'Test', 'Tester');
  cmn('CMN.CONFIRM', 'Confirm', 'Confirm', 'Confirmer');
  cmn('CMN.BACK', 'Back', 'Back', 'Retour');
  cmn('CMN.NEXT', 'Next', 'Next', 'Suivant');
  cmn('CMN.CLOSE', 'Close', 'Close', 'Fermer');
  cmn('CMN.DETAILS', 'Details', 'Details', 'Details');
  cmn('CMN.SELECT', 'Select', 'Select', 'Selectionner');
  cmn('CMN.REQUIRED', 'Required', 'Required', 'Obligatoire');
  cmn('CMN.OPTIONAL', 'Optional', 'Optional', 'Facultatif');
  cmn('CMN.NO.DATA', 'No data found.', 'No data found.', 'Aucune donnee trouvee.');
  cmn('CMN.LOADING', 'Loading...', 'Loading...', 'Chargement...');

  -- Mass-update wizard (MU.*)
  cmn('MU.WARN.BH', 'Use cautiously during business hours. Data integrity may lock items.',
      'Use cautiously during business hours. Data integrity may lock items.',
      'Prudence en heures ouvrables. Integrite peut bloquer les articles.');
  cmn('MU.STP0.LBL', 'Data selection', 'Data selection', 'Selection donnees');
  cmn('MU.STP0.TTL', 'Pick your data file', 'Pick your data file', 'Choisir votre fichier');
  cmn('MU.STP1.LBL', 'Configuration', 'Configuration', 'Configuration');
  cmn('MU.STP1.TTL', 'Define changes parameter', 'Define changes parameter', 'Definir les parametres');
  cmn('MU.STP2.LBL', 'Execution/Schedule', 'Execution/Schedule', 'Execution/Planif.');
  cmn('MU.STP2.TTL', 'Execute now or schedule', 'Execute now or schedule', 'Executer ou planifier');
  cmn('MU.STP3.LBL', 'Confirmation', 'Confirmation', 'Confirmation');
  cmn('MU.STP3.TTL', 'Confirm execution', 'Confirm execution', 'Confirmer execution');
  cmn('MU.RCP.ERR2', 'Records with Errors:', 'Records with Errors:', 'Enreg. en erreur :');
  cmn('MU.RCP.ERRDTL', 'Error Details', 'Error Details', 'Detail des erreurs');
  cmn('MU.COL.ERRMSG', 'Error Message', 'Error Message', 'Message erreur');
  cmn('MU.MSG.NOERR', 'No errors found.', 'No errors found.', 'Aucune erreur.');
  cmn('MU.BTN.ERRCSV', 'Export Errors to CSV', 'Export Errors to CSV', 'Exporter erreurs CSV');
  cmn('MU.BTN.CLSRST', 'Close & Reset', 'Close & Reset', 'Fermer et reinit.');
  cmn('MU.BTN.EXEC', 'Execute now', 'Execute now', 'Executer maintenant');
  cmn('MU.BTN.SCHED', 'Schedule', 'Schedule', 'Planifier');
  cmn('MU.LBL.FILE', 'Select file', 'Select file', 'Choisir fichier');
  cmn('MU.LBL.NOW', 'Execute immediately', 'Execute immediately', 'Executer immediatement');
  cmn('MU.LBL.SCHD', 'Schedule for later', 'Schedule for later', 'Planifier plus tard');
  cmn('MU.TOAST.S0', 'Pick your data file', 'Pick your data file', 'Choisir fichier');
  cmn('MU.TOAST.S1', 'Specify configuration', 'Specify configuration', 'Preciser configuration');
  cmn('MU.TOAST.S2', 'Execute or schedule', 'Execute or schedule', 'Executer ou planifier');
  cmn('MU.TOAST.S3', 'Wrap up', 'Wrap up', 'Terminer');

  -- Corporate search (SCR route)
  seed3('RT.SRCH.TIP', 'Enter terms; use @item @ean @supplier @order @invoice',
      'Enter terms; use @item @ean @supplier @order @invoice',
      'Saisir termes; @item @ean @supplier @order @invoice', 'ROUTE');
  seed3('RT.SRCH.DEPT', 'Department', 'Department', 'Rayon', 'ROUTE');
  seed3('RT.SRCH.SDEPT', 'Sub-department', 'Sub-department', 'Sous-rayon', 'ROUTE');
  seed3('RT.SRCH.CAT', 'Category', 'Category', 'Categorie', 'ROUTE');
  seed3('RT.SRCH.SCAT', 'Sub-Category', 'Sub-Category', 'Sous-categorie', 'ROUTE');
  seed3('RT.SRCH.CMGR', 'Category Mgr', 'Category Mgr', 'Resp. categorie', 'ROUTE');
  seed3('RT.SRCH.STAT', 'Status', 'Status', 'Statut', 'ROUTE');
  seed3('RT.SRCH.BRND', 'Brand', 'Brand', 'Marque', 'ROUTE');
  seed3('RT.SRCH.SSNL', 'Seasonality', 'Seasonality', 'Saisonnalite', 'ROUTE');

  -- Alerts management S19
  seed3('S19.TAB.GEN', 'General', 'General', 'General', 'SCR0000000019');
  seed3('S19.TAB.DIST', 'Distribution', 'Distribution', 'Distribution', 'SCR0000000019');
  seed3('S19.TAB.SCH', 'Schedule', 'Schedule', 'Planification', 'SCR0000000019');
  seed3('S19.TAB.DLST', 'Distribution list', 'Distribution list', 'Liste distribution', 'SCR0000000019');
  seed3('S19.TAB.PRNT', 'Printing', 'Printing', 'Impression', 'SCR0000000019');
  seed3('S19.TAB.SCHD', 'Scheduling', 'Scheduling', 'Planification', 'SCR0000000019');
  seed3('S19.BTN.NEW', 'New Alert', 'New Alert', 'Nouvelle alerte', 'SCR0000000019');
  seed3('S19.BTN.RUN', 'Run report', 'Run report', 'Lancer rapport', 'SCR0000000019');
  seed3('S19.BTN.EXEC', 'Execute query', 'Execute query', 'Executer requete', 'SCR0000000019');
  seed3('S19.LBL.ID', 'ID', 'ID', 'ID', 'SCR0000000019');
  seed3('S19.LBL.SUBJ', 'Title/Subject', 'Title/Subject', 'Titre/Sujet', 'SCR0000000019');
  seed3('S19.LBL.RTIME', 'Real-time', 'Real-time', 'Temps reel', 'SCR0000000019');
  seed3('S19.LBL.PLAIN', 'Email plain text', 'Email plain text', 'Courriel texte seul', 'SCR0000000019');
  seed3('S19.LBL.NBPAR', 'Parameter count', 'Parameter count', 'Nb parametres', 'SCR0000000019');
  seed3('S19.LBL.PARNM', 'Parameter names', 'Parameter names', 'Noms parametres', 'SCR0000000019');
  seed3('S19.PLH.PARNM', 'site_id,vendor_id', 'site_id,vendor_id', 'site_id,fournisseur', 'SCR0000000019');
  seed3('S19.LBL.SMS', 'SMS content', 'SMS content', 'Contenu SMS', 'SCR0000000019');
  seed3('S19.LBL.FILE', 'File', 'File', 'Fichier', 'SCR0000000019');
  seed3('S19.COL.SUBJ', 'Subject', 'Subject', 'Sujet', 'SCR0000000019');
  seed3('S19.COL.RTIME', 'Real-time', 'Real-time', 'Temps reel', 'SCR0000000019');
  seed3('S19.COL.ACT', 'Active', 'Active', 'Actif', 'SCR0000000019');
  seed3('S19.MSG.PARAM', 'parameters', 'parameters', 'parametres', 'SCR0000000019');

  -- Holiday schedule S03
  seed3('S03.BTN.SRCH', 'Search', 'Search', 'Rechercher', 'SCR0000000003');
  seed3('S03.BTN.ADD', 'Add holiday', 'Add holiday', 'Ajouter ferie', 'SCR0000000003');
  seed3('S03.LBL.SUPP', 'Supplier', 'Supplier', 'Fournisseur', 'SCR0000000003');
  seed3('S03.LBL.DATE', 'Date', 'Date', 'Date', 'SCR0000000003');
  seed3('S03.LBL.DESC', 'Description', 'Description', 'Description', 'SCR0000000003');
  seed3('S03.DLG.ADD', 'Add new holiday', 'Add new holiday', 'Ajouter jour ferie', 'SCR0000000003');
  seed3('S03.LBL.HDATE', 'Holiday date', 'Holiday date', 'Date ferie', 'SCR0000000003');
  seed3('S03.LBL.PSTART', 'Period start', 'Period start', 'Debut periode', 'SCR0000000003');
  seed3('S03.LBL.PEND', 'Period end', 'Period end', 'Fin periode', 'SCR0000000003');

  -- Inventory counting S07
  seed3('S07.BTN.SRCH', 'Search', 'Search', 'Rechercher', 'SCR0000000007');
  seed3('S07.LBL.CDATE', 'Counting date :', 'Counting date :', 'Date comptage :', 'SCR0000000007');
  seed3('S07.LBL.SITE', 'Site', 'Site', 'Site', 'SCR0000000007');
  seed3('S07.LBL.FROM', 'From date', 'From date', 'Date debut', 'SCR0000000007');
  seed3('S07.LBL.TO', 'To date', 'To date', 'Date fin', 'SCR0000000007');

  -- Batch schedule S06
  seed3('S06.BTN.SRCH', 'Search', 'Search', 'Rechercher', 'SCR0000000006');
  seed3('S06.LBL.JOB', 'Job Id :', 'Job Id :', 'Id job :', 'SCR0000000006');
  seed3('S06.LBL.EXON', 'Executed on :', 'Executed on :', 'Execute le :', 'SCR0000000006');
  seed3('S06.BTN.RUN', 'Run batch', 'Run batch', 'Lancer batch', 'SCR0000000006');
  seed3('S06.COL.JOB', 'Job', 'Job', 'Job', 'SCR0000000006');
  seed3('S06.COL.STAT', 'Status', 'Status', 'Statut', 'SCR0000000006');
END;
/

COMMIT;

SET DEFINE ON;
