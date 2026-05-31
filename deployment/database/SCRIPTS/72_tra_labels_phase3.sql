-- Phase 3 i18n — Query Library, App logs, Customer/Env, Dictionary tabs + en_GB/fr_FR
-- Deploy after 69, 70, 71. TLAID VARCHAR2(15) max.

SET DEFINE OFF;

DECLARE
  PROCEDURE upsert_label(p_id VARCHAR2, p_lang VARCHAR2, p_desc VARCHAR2, p_screen VARCHAR2) IS
  BEGIN
    MERGE INTO TRA_LABELS t
    USING (SELECT p_id TLAID, p_lang TLALANGUE FROM DUAL) s
    ON (t.TLAID = s.TLAID AND t.TLALANGUE = s.TLALANGUE)
    WHEN MATCHED THEN UPDATE SET t.TLADESC = p_desc, t.TLASCREEN = p_screen, t.TLADMAJ = SYSDATE
    WHEN NOT MATCHED THEN INSERT (TLAID, TLADESC, TLAMENU, TLASCREEN, TLALANGUE, TLADCRE, TLADMAJ, TLAUTIL)
    VALUES (p_id, p_desc, 0, p_screen, p_lang, SYSDATE, SYSDATE, 'admin');
  END;

  PROCEDURE seed3(p_id VARCHAR2, p_us VARCHAR2, p_gb VARCHAR2, p_fr VARCHAR2, p_screen VARCHAR2) IS
  BEGIN
    upsert_label(p_id, 'us_US', p_us, p_screen);
    upsert_label(p_id, 'en_GB', p_gb, p_screen);
    upsert_label(p_id, 'fr_FR', p_fr, p_screen);
  END;
BEGIN
  -- S64 — Customer / corporate / environment (General Settings)
  seed3('S64.TITLE', 'Retailer and Access', 'Retailer and Access', 'Acces detaillant', 'SCR0000000064');
  seed3('S64.TAB.CORP', 'Corporate', 'Corporate', 'Societe', 'SCR0000000064');
  seed3('S64.TAB.ENV', 'Environment', 'Environment', 'Environnement', 'SCR0000000064');

  -- S65–S69 titles/tabs (en_GB/fr_FR; us_US from script 69)
  seed3('S65.TITLE', 'Users and Profiles', 'Users and Profiles', 'Utilisateurs et profils', 'SCR0000000065');
  seed3('S65.TAB.USERS', 'Users', 'Users', 'Utilisateurs', 'SCR0000000065');
  seed3('S65.TAB.ENV', 'Environment access', 'Environment access', 'Acces environnement', 'SCR0000000065');
  seed3('S65.TAB.WDG', 'Dashboard widgets', 'Dashboard widgets', 'Widgets tableau de bord', 'SCR0000000065');

  seed3('S66.TITLE', 'Menu and access', 'Menu and access', 'Menu et acces', 'SCR0000000066');
  seed3('S66.TAB.CAT', 'Menu catalog', 'Menu catalog', 'Catalogue menu', 'SCR0000000066');
  seed3('S66.TAB.RULES', 'Flag rules', 'Flag rules', 'Regles indicateurs', 'SCR0000000066');
  seed3('S66.TAB.PROF', 'Profiles', 'Profiles', 'Profils', 'SCR0000000066');
  seed3('S66.TAB.PMNU', 'Profile menus', 'Profile menus', 'Menus profil', 'SCR0000000066');
  seed3('S66.TAB.TRN', 'Translations', 'Translations', 'Traductions', 'SCR0000000066');

  seed3('S67.TITLE', 'Query Library', 'Query Library', 'Bibliotheque requetes', 'SCR0000000067');
  seed3('S67.TAB.GEN', 'General', 'General', 'General', 'SCR0000000067');
  seed3('S67.TAB.CFG', 'Configuration', 'Configuration', 'Configuration', 'SCR0000000067');
  seed3('S67.TAB.AUD', 'Audit Info', 'Audit Info', 'Infos audit', 'SCR0000000067');
  seed3('S67.BTN.CREATE', 'CREATE', 'CREATE', 'CREER', 'SCR0000000067');

  seed3('S68.TITLE', 'Dictionary', 'Dictionary', 'Dictionnaire', 'SCR0000000068');
  seed3('S68.TAB.COV', 'Translation coverage', 'Translation coverage', 'Couverture traduction', 'SCR0000000068');
  seed3('S68.TAB.TOBJ', 'Technical Objects', 'Technical Objects', 'Objets techniques', 'SCR0000000068');
  seed3('S68.TAB.SCR', 'Screen Labels', 'Screen Labels', 'Libelles ecran', 'SCR0000000068');
  seed3('S68.TAB.PRM', 'Parameters', 'Parameters', 'Parametres', 'SCR0000000068');
  seed3('S68.TAB.ENT', 'Entry Labels', 'Entry Labels', 'Libelles entree', 'SCR0000000068');

  seed3('S69.TITLE', 'Widget Library', 'Widget Library', 'Bibliotheque widgets', 'SCR0000000069');
  seed3('S69.TAB.WDG', 'Widgets', 'Widgets', 'Widgets', 'SCR0000000069');
  seed3('S69.TAB.RSLT', 'Result columns', 'Result columns', 'Colonnes resultat', 'SCR0000000069');
  seed3('S69.TAB.LINK', 'Links', 'Links', 'Liens', 'SCR0000000069');

  seed3('S70.TITLE', 'App logs', 'App logs', 'Journaux applicatifs', 'SCR0000000070');
  seed3('S70.TAB.SRV', 'Server files', 'Server files', 'Fichiers serveur', 'SCR0000000070');
  seed3('S70.TAB.CRM', 'CROOMLOG', 'CROOMLOG', 'CROOMLOG', 'SCR0000000070');
  seed3('S70.TAB.ALR', 'ALERTLOG', 'ALERTLOG', 'ALERTLOG', 'SCR0000000070');

  -- Common keys — all three languages
  seed3('CMN.REFRESH', 'Refresh', 'Refresh', 'Actualiser', 'COMMON');
  seed3('CMN.SAVE', 'Save', 'Save', 'Enregistrer', 'COMMON');
  seed3('CMN.CANCEL', 'Cancel', 'Cancel', 'Annuler', 'COMMON');
  seed3('CMN.ADD', 'Add', 'Add', 'Ajouter', 'COMMON');
  seed3('CMN.DELETE', 'Delete', 'Delete', 'Supprimer', 'COMMON');
  seed3('CMN.SEARCH', 'Type text to filter...', 'Type text to filter...', 'Filtrer...', 'COMMON');
  seed3('CMN.ACTIONS', 'Actions', 'Actions', 'Actions', 'COMMON');
END;
/

COMMIT;

SET DEFINE ON;
