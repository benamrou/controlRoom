-- Phase 6 — General Settings UI labels (us_US / en_GB / fr_FR)
-- Deploy after 72. Idempotent MERGE. TLAID max 15; TLADESC max 100.
-- Run entire file from line 1 (SET DEFINE OFF). No ampersand in literals.

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
  -- Common extensions (titles/tabs from script 72)
  cmn('CMN.YES', 'Yes', 'Yes', 'Oui');
  cmn('CMN.NO', 'No', 'No', 'Non');
  cmn('CMN.ALL', 'All', 'All', 'Tous');
  cmn('CMN.NONE', '(none)', '(none)', '(aucun)');
  cmn('CMN.CODE', 'Code', 'Code', 'Code');
  cmn('CMN.SHORT', 'Short', 'Short', 'Court');
  cmn('CMN.CITY', 'City', 'City', 'Ville');
  cmn('CMN.DUP', 'Duplicate', 'Duplicate', 'Dupliquer');
  cmn('CMN.CLEAR', 'Clear', 'Clear', 'Effacer');
  cmn('CMN.NEW', 'New', 'New', 'Nouveau');
  cmn('CMN.LOAD', 'Load', 'Load', 'Charger');
  cmn('CMN.ACTIVE', 'Active', 'Active', 'Actif');
  cmn('CMN.INACT', 'Inactive', 'Inactive', 'Inactif');
  cmn('CMN.ACCESS', 'Access', 'Access', 'Acces');
  cmn('CMN.ENABLED', 'Enabled', 'Enabled', 'Active');
  cmn('CMN.DEFAULT', 'Default', 'Default', 'Par defaut');
  cmn('CMN.FNAME', 'First name', 'First name', 'Prenom');
  cmn('CMN.LNAME', 'Last name', 'Last name', 'Nom');
  cmn('CMN.EMAIL', 'Email', 'Email', 'Courriel');
  cmn('CMN.PASS', 'Password', 'Password', 'Mot de passe');
  cmn('CMN.FILTER', 'Filter...', 'Filter...', 'Filtrer...');
  cmn('CMN.RECORDS', 'records', 'records', 'enregistrements');
  cmn('CMN.EXPORT', 'Export CSV', 'Export CSV', 'Exporter CSV');
  cmn('CMN.OK', 'Ok', 'Ok', 'OK');
  cmn('CMN.SHOW', 'Show', 'Show', 'Afficher');
  cmn('CMN.TYPE', 'Type', 'Type', 'Type');
  cmn('CMN.MODE', 'Mode', 'Mode', 'Mode');
  cmn('CMN.PARENT', 'Parent', 'Parent', 'Parent');
  cmn('CMN.ROUTE', 'Route', 'Route', 'Route');
  cmn('CMN.SORT', 'Sort', 'Sort', 'Tri');
  cmn('CMN.LABEL', 'Label', 'Label', 'Libelle');
  cmn('CMN.FLAG', 'Flag', 'Flag', 'Indicateur');
  cmn('CMN.FROM', 'From', 'From', 'Du');
  cmn('CMN.TO', 'To', 'To', 'Au');
  cmn('CMN.USER', 'User', 'User', 'Utilisateur');
  cmn('CMN.WIDGET', 'Widget', 'Widget', 'Widget');
  cmn('CMN.BEHAVIOR', 'Behavior', 'Behavior', 'Comportement');
  cmn('CMN.ROWS', 'Rows', 'Rows', 'Lignes');
  cmn('CMN.DEACT', 'Deactivate', 'Deactivate', 'Desactiver');

  -- S64 Retailer and Access
  seed3('S64.BTN.SRCH', 'Search', 'Search', 'Rechercher', 'SCR0000000064');
  seed3('S64.BTN.ADDC', 'Add corporate', 'Add corporate', 'Ajouter societe', 'SCR0000000064');
  seed3('S64.BTN.ADDE', 'Add environment', 'Add environment', 'Ajouter environnement', 'SCR0000000064');
  seed3('S64.PLH.CODE', 'Code', 'Code', 'Code', 'SCR0000000064');
  seed3('S64.PLH.DESC', 'Description', 'Description', 'Description', 'SCR0000000064');
  seed3('S64.EMP.CORP', 'No corporates found.', 'No corporates found.',
        'Aucune societe trouvee.', 'SCR0000000064');
  seed3('S64.EMP.ENV', 'No environments found.', 'No environments found.',
        'Aucun environnement trouve.', 'SCR0000000064');
  seed3('S64.DLG.NCORP', 'New corporate', 'New corporate', 'Nouvelle societe', 'SCR0000000064');
  seed3('S64.DLG.ECORP', 'Edit corporate', 'Edit corporate', 'Modifier societe', 'SCR0000000064');
  seed3('S64.DLG.NENV', 'New environment', 'New environment', 'Nouvel environnement', 'SCR0000000064');
  seed3('S64.DLG.EENV', 'Edit environment', 'Edit environment', 'Modifier environnement', 'SCR0000000064');
  seed3('S64.LBL.CORP', 'Corporate', 'Corporate', 'Societe', 'SCR0000000064');
  seed3('S64.PLH.ALLC', 'All corporates', 'All corporates', 'Toutes les societes', 'SCR0000000064');
  seed3('S64.COL.SDESC', 'Short desc', 'Short desc', 'Desc. courte', 'SCR0000000064');
  seed3('S64.COL.DBL', 'DB link', 'DB link', 'Lien DB', 'SCR0000000064');
  seed3('S64.COL.GOLD', 'GOLD schema', 'GOLD schema', 'Schema GOLD', 'SCR0000000064');
  seed3('S64.COL.CORP', 'Corp', 'Corp', 'Soc.', 'SCR0000000064');

  -- S65 Users and Profiles
  seed3('S65.BTN.SRCH', 'Search', 'Search', 'Rechercher', 'SCR0000000065');
  seed3('S65.BTN.ADDU', 'Add user', 'Add user', 'Ajouter utilisateur', 'SCR0000000065');
  seed3('S65.LBL.CORP', 'Corporate', 'Corporate', 'Societe', 'SCR0000000065');
  seed3('S65.LBL.STAT', 'Status', 'Status', 'Statut', 'SCR0000000065');
  seed3('S65.COL.UID', 'User id', 'User id', 'ID utilisateur', 'SCR0000000065');
  seed3('S65.COL.NAME', 'Name', 'Name', 'Nom', 'SCR0000000065');
  seed3('S65.COL.UTYP', 'User type', 'User type', 'Type utilisateur', 'SCR0000000065');
  seed3('S65.EMP.USER', 'No users found. Adjust filters or click Add user.',
        'No users found. Adjust filters or click Add user.',
        'Aucun utilisateur. Ajustez les filtres ou ajoutez un utilisateur.', 'SCR0000000065');
  seed3('S65.LBL.UID', 'User id', 'User id', 'ID utilisateur', 'SCR0000000065');
  seed3('S65.PLH.LOGIN', 'Login id', 'Login id', 'Identifiant', 'SCR0000000065');
  seed3('S65.BTN.LOADE', 'Load environments', 'Load environments', 'Charger environnements', 'SCR0000000065');
  seed3('S65.EMP.ENV', 'Select a user and corporate, then load environments.',
        'Select a user and corporate, then load environments.',
        'Choisissez utilisateur et societe puis chargez les environnements.', 'SCR0000000065');
  seed3('S65.BTN.LOADW', 'Load assignments', 'Load assignments', 'Charger affectations', 'SCR0000000065');
  seed3('S65.BTN.ADDW', 'Add widget', 'Add widget', 'Ajouter widget', 'SCR0000000065');
  seed3('S65.EMP.WDG', 'Select a user and load assignments, or use the grid icon on Users.',
        'Select a user and load assignments, or use the grid icon on Users.',
        'Selectionnez un utilisateur et chargez, ou l''icone grille dans Utilisateurs.', 'SCR0000000065');
  seed3('S65.LBL.UTYPE', 'User type', 'User type', 'Type utilisateur', 'SCR0000000065');
  seed3('S65.LBL.PROF', 'Access profile', 'Access profile', 'Profil d''acces', 'SCR0000000065');
  seed3('S65.LBL.LANG', 'Language', 'Language', 'Langue', 'SCR0000000065');
  seed3('S65.LBL.FLAGS', 'Access flags', 'Access flags', 'Indicateurs d''acces', 'SCR0000000065');
  seed3('S65.CHK.PASS', 'Change password', 'Change password', 'Changer mot de passe', 'SCR0000000065');
  seed3('S65.UT.STD', 'Standard user', 'Standard user', 'Utilisateur standard', 'SCR0000000065');
  seed3('S65.UT.ADM', 'ICR admin (General Settings)', 'ICR admin (General Settings)',
        'Admin ICR (parametres generaux)', 'SCR0000000065');
  seed3('S65.DLG.NWDG', 'Add dashboard widget', 'Add dashboard widget', 'Ajouter widget tableau de bord', 'SCR0000000065');
  seed3('S65.DLG.EWDG', 'Edit dashboard widget', 'Edit dashboard widget', 'Modifier widget tableau de bord', 'SCR0000000065');
  seed3('S65.TIP.UTYPE', 'ICR admin shows General Settings in the sidebar (re-login required).',
        'ICR admin shows General Settings in the sidebar (re-login required).',
        'Admin ICR : parametres generaux dans le menu (reconnexion requise).', 'SCR0000000065');
  seed3('S65.TIP.PROF', 'Optional menu bundle on top of access flags.',
        'Optional menu bundle on top of access flags.',
        'Menu optionnel en plus des indicateurs d''acces.', 'SCR0000000065');
  seed3('S65.TIP.PASS', 'Stored as Base64 in the database (same as login).',
        'Stored as Base64 in the database (same as login).',
        'Stocke en Base64 en base (comme la connexion).', 'SCR0000000065');
  seed3('S65.FLG.DI', 'Data integrity', 'Data integrity', 'Integrite donnees', 'SCR0000000065');
  seed3('S65.FLG.TECH', 'Tech Services', 'Tech Services', 'Services techniques', 'SCR0000000065');
  seed3('S65.FLG.IT', 'IT', 'IT', 'TI', 'SCR0000000065');
  seed3('S65.FLG.BUY', 'Buyer', 'Buyer', 'Acheteur', 'SCR0000000065');
  seed3('S65.FLG.HELP', 'Helpdesk', 'Helpdesk', 'Assistance', 'SCR0000000065');
  seed3('S65.FLG.WH', 'Warehouse', 'Warehouse', 'Entrepot', 'SCR0000000065');
  seed3('S65.FLG.SP', 'Space planning', 'Space planning', 'Planification espace', 'SCR0000000065');
  seed3('S65.FLG.AIA', 'AI admin', 'AI admin', 'Admin IA', 'SCR0000000065');
  seed3('S65.FLG.AID', 'AI designer', 'AI designer', 'Concepteur IA', 'SCR0000000065');
  seed3('S65.TIP.ENV', 'Environment access', 'Environment access', 'Acces environnement', 'SCR0000000065');
  seed3('S65.TIP.WDG', 'Dashboard widgets', 'Dashboard widgets', 'Widgets tableau de bord', 'SCR0000000065');
  seed3('S65.TIP.DEF', 'Set as default', 'Set as default', 'Definir par defaut', 'SCR0000000065');
  seed3('S65.TIP.DEF2', 'Default environment', 'Default environment', 'Environnement par defaut', 'SCR0000000065');

  -- S66 Menu and access
  seed3('S66.LBL.SHOW', 'Show', 'Show', 'Afficher', 'SCR0000000066');
  seed3('S66.FIL.ALL', 'All', 'All', 'Tous', 'SCR0000000066');
  seed3('S66.FIL.ACT', 'Active only', 'Active only', 'Actifs seulement', 'SCR0000000066');
  seed3('S66.FIL.INA', 'Inactive only', 'Inactive only', 'Inactifs seulement', 'SCR0000000066');
  seed3('S66.BTN.ADDM', 'Add entry', 'Add entry', 'Ajouter entree', 'SCR0000000066');
  seed3('S66.BTN.ADDR', 'Add rule', 'Add rule', 'Ajouter regle', 'SCR0000000066');
  seed3('S66.BTN.ADDP', 'Add profile', 'Add profile', 'Ajouter profil', 'SCR0000000066');
  seed3('S66.RULE.HINT', 'Users also need the flag on Users and Profiles or an access profile.',
        'Users also need the flag on Users and Profiles or an access profile.',
        'Les utilisateurs ont aussi besoin du flag ou d''un profil d''acces.', 'SCR0000000066');
  seed3('S66.LNK.USERS', 'Users and Profiles', 'Users and Profiles', 'Utilisateurs et profils', 'SCR0000000066');

  -- S67 Query Library
  seed3('S67.DLG.DONE', 'Process Completed', 'Process Completed', 'Traitement termine', 'SCR0000000067');
  seed3('S67.DLG.TEST', 'Query Test Results', 'Query Test Results', 'Resultats test requete', 'SCR0000000067');
  seed3('S67.BTN.CSV', 'CSV', 'CSV', 'CSV', 'SCR0000000067');

  -- S68 Dictionary
  seed3('S68.HEAD', 'Dictionary Management', 'Dictionary Management', 'Gestion dictionnaire', 'SCR0000000068');
  seed3('S68.LBL.OBJID', 'Object ID', 'Object ID', 'ID objet', 'SCR0000000068');
  seed3('S68.LBL.CAT', 'Category', 'Category', 'Categorie', 'SCR0000000068');
  seed3('S68.PLH.CAT', 'All Categories', 'All Categories', 'Toutes categories', 'SCR0000000068');
  seed3('S68.PLH.DESC', 'Search description...', 'Search description...', 'Rechercher description...', 'SCR0000000068');
  seed3('S68.PLH.FILT', 'Filter by ID or Description...', 'Filter by ID or Description...',
        'Filtrer par ID ou description...', 'SCR0000000068');
  seed3('S68.PLH.COV', 'Filter by screen or description...', 'Filter by screen or description...',
        'Filtrer par ecran ou description...', 'SCR0000000068');
  seed3('S68.LBL.TGTLANG', 'Target language', 'Target language', 'Langue cible', 'SCR0000000068');
  seed3('S68.BTN.COVRPT', 'Run report', 'Run report', 'Lancer rapport', 'SCR0000000068');
  seed3('S68.LBL.BASEUS', 'us_US (baseline)', 'us_US (baseline)', 'us_US (reference)', 'SCR0000000068');

  -- S69 Widget Library
  seed3('S69.BTN.ADDW', 'Add widget', 'Add widget', 'Ajouter widget', 'SCR0000000069');
  seed3('S69.CNT.WDG', 'widget(s)', 'widget(s)', 'widget(s)', 'SCR0000000069');
  seed3('S69.COL.WNAME', 'Name (us_US)', 'Name (us_US)', 'Nom (us_US)', 'SCR0000000069');
  seed3('S69.COL.WDESC', 'Description (us_US)', 'Description (us_US)', 'Description (us_US)', 'SCR0000000069');

  -- S70 App logs
  seed3('S70.READ', 'Reading:', 'Reading:', 'Lecture :', 'SCR0000000070');
  seed3('S70.FOLDER', 'Log folder:', 'Log folder:', 'Dossier journaux :', 'SCR0000000070');
  seed3('S70.NEWEST', 'newest first', 'newest first', 'plus recent en premier', 'SCR0000000070');
  seed3('S70.LBL.DAY', 'Day folder', 'Day folder', 'Dossier jour', 'SCR0000000070');
  seed3('S70.LBL.FILE', 'Log file', 'Log file', 'Fichier journal', 'SCR0000000070');
  seed3('S70.LBL.LINES', 'Lines', 'Lines', 'Lignes', 'SCR0000000070');
  seed3('S70.BTN.RDAYS', 'Refresh days', 'Refresh days', 'Actualiser jours', 'SCR0000000070');
  seed3('S70.BTN.TAIL', 'Load tail', 'Load tail', 'Charger fin', 'SCR0000000070');
  seed3('S70.PLH.TAIL', 'Select a day and file, then Load tail.',
        'Select a day and file, then Load tail.',
        'Choisissez jour et fichier puis chargez la fin.', 'SCR0000000070');
  seed3('S70.LBL.QNUM', 'Query #', 'Query #', 'Requete #', 'SCR0000000070');
  seed3('S70.PLH.ALL', '-1 = all', '-1 = all', '-1 = tout', 'SCR0000000070');
  seed3('S70.EMP.CRM', 'No rows — run Search.', 'No rows — run Search.',
        'Aucune ligne — lancez Rechercher.', 'SCR0000000070');
  seed3('S70.EMP.ALR', 'No rows — run Search.', 'No rows — run Search.',
        'Aucune ligne — lancez Rechercher.', 'SCR0000000070');
  seed3('S70.COL.TITLE', 'Title', 'Title', 'Titre', 'SCR0000000070');
  seed3('S70.COL.CRE', 'Created', 'Created', 'Cree', 'SCR0000000070');
  seed3('S70.COL.MSG', 'Message', 'Message', 'Message', 'SCR0000000070');
  seed3('S70.COL.SUBJ', 'Subject', 'Subject', 'Sujet', 'SCR0000000070');
  seed3('S70.COL.EXEC', 'Executed', 'Executed', 'Execute', 'SCR0000000070');
  seed3('S70.COL.PHASE', 'Phase', 'Phase', 'Phase', 'SCR0000000070');
  seed3('S70.COL.DUR', 'Duration', 'Duration', 'Duree', 'SCR0000000070');
  seed3('S70.COL.ERR', 'Error', 'Error', 'Erreur', 'SCR0000000070');
  seed3('S70.LBL.ALERT', 'Alert ID', 'Alert ID', 'ID alerte', 'SCR0000000070');
  seed3('S70.DLG.CRM', 'CROOMLOG detail', 'CROOMLOG detail', 'Detail CROOMLOG', 'SCR0000000070');
  seed3('S70.DLG.ALR', 'ALERTLOG detail', 'ALERTLOG detail', 'Detail ALERTLOG', 'SCR0000000070');
  seed3('S70.FIL.ROWS', 'Filter loaded rows...', 'Filter loaded rows...', 'Filtrer lignes chargees...', 'SCR0000000070');
  seed3('S70.ROWS.CNT', 'row(s) loaded (max 500)', 'row(s) loaded (max 500)', 'ligne(s) chargee(s) (max 500)', 'SCR0000000070');

END;
/

COMMIT;

SET DEFINE ON;
