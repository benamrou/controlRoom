-- Phase 7c — French menu labels for standard ICR sidebar (ICR_MENU_LABEL)
-- Deploy after 76. Re-login or header language switch after menu load.

SET DEFINE OFF;

DECLARE
  PROCEDURE upsert_menu(p_code VARCHAR2, p_lang VARCHAR2, p_text VARCHAR2) IS
  BEGIN
    MERGE INTO ICR_MENU_LABEL t
    USING (SELECT p_code MENU_CODE, p_lang MLLANGUE, p_text LABEL_TEXT FROM DUAL) s
    ON (t.MENU_CODE = s.MENU_CODE AND t.MLLANGUE = s.MLLANGUE)
    WHEN MATCHED THEN UPDATE SET t.LABEL_TEXT = s.LABEL_TEXT, t.MLDMAJ = SYSDATE, t.MLUTIL = 'admin'
    WHEN NOT MATCHED THEN INSERT (MENU_CODE, MLLANGUE, LABEL_TEXT, MLDCRE, MLDMAJ, MLUTIL)
    VALUES (s.MENU_CODE, s.MLLANGUE, s.LABEL_TEXT, SYSDATE, SYSDATE, 'admin');
  END;
BEGIN
  -- Inventory
  upsert_menu('GRP_INVENTORY', 'fr_FR', 'Inventaire');
  upsert_menu('ROUTE_INVENTORY', 'fr_FR', 'Suivi inventaire');
  upsert_menu('ROUTE_COUNTING', 'fr_FR', 'Comptage tiers');

  -- Computer ordering
  upsert_menu('GRP_CAO', 'fr_FR', 'Commande automatique');
  upsert_menu('ROUTE_CAOCONFIG', 'fr_FR', 'Parametres CAO');
  upsert_menu('ROUTE_CAOMISSING', 'fr_FR', 'CAO manquant');

  -- Supplier schedule
  upsert_menu('GRP_SCHEDULE', 'fr_FR', 'Calendrier fournisseur');
  upsert_menu('ROUTE_HOLIDAY', 'fr_FR', 'Calendrier jours feries');
  upsert_menu('ROUTE_SCHEDULE', 'fr_FR', 'Gestion par calendrier');
  upsert_menu('ROUTE_GENSCHED', 'fr_FR', 'Generer calendrier');

  upsert_menu('ROUTE_SEARCH', 'fr_FR', 'Recherche');

  -- Master data
  upsert_menu('GRP_SERVICES', 'fr_FR', 'Donnees de base');
  upsert_menu('ROUTE_PPGRETAIL', 'fr_FR', 'Detail par PPG');
  upsert_menu('ROUTE_NEXTPPG', 'fr_FR', 'PPG suivant');
  upsert_menu('ROUTE_ECOMMDESC', 'fr_FR', 'Description e-commerce');

  -- Syndigo
  upsert_menu('GRP_SYNDIGO', 'fr_FR', 'Syndigo');
  upsert_menu('ROUTE_SYNDIGOSEARCH', 'fr_FR', 'Recherche');
  upsert_menu('ROUTE_SYNDIGOCOLLECT', 'fr_FR', 'Collecte');
  upsert_menu('ROUTE_SYNDIGOUPDATE', 'fr_FR', 'Syndigo vers MDM');

  -- Space planning
  upsert_menu('GRP_SPACE', 'fr_FR', 'Planification lineaire');
  upsert_menu('ROUTE_ECOMPIC', 'fr_FR', 'Photo e-commerce');
  upsert_menu('ROUTE_SPACEITEM', 'fr_FR', 'Historique article');
  upsert_menu('ROUTE_SPACEDIM', 'fr_FR', 'Infos SKU');
  upsert_menu('ROUTE_ITEMADDR', 'fr_FR', 'Chargement adresse article');

  -- Finance
  upsert_menu('GRP_FINANCE', 'fr_FR', 'Comptes fournisseurs');
  upsert_menu('ROUTE_UNARCHIVE', 'fr_FR', 'Desarchiver');

  -- Warehouse
  upsert_menu('GRP_WAREHOUSE', 'fr_FR', 'Boite outils entrepot');
  upsert_menu('ROUTE_FIXPICK', 'fr_FR', 'Corriger unite de prep');
  upsert_menu('ROUTE_RELPLT', 'fr_FR', 'Liberer palette');
  upsert_menu('ROUTE_PLTLBL', 'fr_FR', 'Etiquette palette');
  upsert_menu('ROUTE_PRODNUM', 'fr_FR', 'Numero de production');

  -- IT
  upsert_menu('GRP_IT', 'fr_FR', 'Informatique');
  upsert_menu('ROUTE_BATCH', 'fr_FR', 'Traitement batch');
  upsert_menu('ROUTE_VEGA', 'fr_FR', 'Journal Vega');
  upsert_menu('ROUTE_UNIX', 'fr_FR', 'Execution de job');
  upsert_menu('ROUTE_QUERYRUN', 'fr_FR', 'Execution requete');
  upsert_menu('ROUTE_PRESET', 'fr_FR', 'Rapport requete preset');

  -- Helpdesk
  upsert_menu('GRP_HELPDESK', 'fr_FR', 'Helpdesk');
  upsert_menu('ROUTE_ROBOT', 'fr_FR', 'Robot');
  upsert_menu('ROUTE_WHSRESTART', 'fr_FR', 'Services entrepot');
  upsert_menu('ROUTE_SVCCENTER', 'fr_FR', 'Centre de services');
  upsert_menu('ROUTE_ORDERURG', 'fr_FR', 'Urgence commande');

  -- EDI
  upsert_menu('GRP_EDI', 'fr_FR', 'EDI');
  upsert_menu('ROUTE_EDIASN', 'fr_FR', 'ASN magasin');

  -- Reporting
  upsert_menu('GRP_REPORTING', 'fr_FR', 'Boite reporting');
  upsert_menu('ROUTE_SCORECAO', 'fr_FR', 'Commande automatique');
  upsert_menu('ROUTE_DASHCYCLE', 'fr_FR', 'Ajustement PI');
  upsert_menu('ROUTE_DASHSUPP', 'fr_FR', 'Service fournisseur');
  upsert_menu('ROUTE_QUALWHS', 'fr_FR', 'Repl. entrepot');
  upsert_menu('ROUTE_SMARTUBD', 'fr_FR', 'Smart UBD');
  upsert_menu('ROUTE_DASHREC', 'fr_FR', 'Reception AP');
  upsert_menu('ROUTE_FILLRATE', 'fr_FR', 'DSD / Entrepot');

  -- Alerts
  upsert_menu('GRP_ALERTS', 'fr_FR', 'Alertes');
  upsert_menu('ROUTE_ALERTJRNL', 'fr_FR', 'Journal');
  upsert_menu('ROUTE_ALERTWATCH', 'fr_FR', 'Surveillance');
  upsert_menu('ROUTE_ALERTMGT', 'fr_FR', 'Gestion des alertes');
  upsert_menu('ROUTE_RPTFILTER', 'fr_FR', 'Config. filtres');

  -- General settings (admin sidebar)
  upsert_menu('GRP_SETTINGS', 'fr_FR', 'Parametres generaux');
  upsert_menu('ROUTE_SET_CUST', 'fr_FR', 'Client et acces');
  upsert_menu('ROUTE_SET_USERS', 'fr_FR', 'Utilisateurs et profils');
  upsert_menu('ROUTE_SET_WIDGET', 'fr_FR', 'Bibliotheque widgets');
  upsert_menu('ROUTE_SET_QUERY', 'fr_FR', 'Bibliotheque requetes');
  upsert_menu('ROUTE_SET_LABEL', 'fr_FR', 'Dictionnaire');
  upsert_menu('ROUTE_SET_MENU', 'fr_FR', 'Menu et acces');
  upsert_menu('ROUTE_APP_LOGS', 'fr_FR', 'Journaux applicatifs');

  -- Header (profile dropdown — complements script 54)
  upsert_menu('HDR_USER_PROFILE', 'fr_FR', 'Profil');
  upsert_menu('HDR_USER_CHANGE_PASSWORD', 'fr_FR', 'Changer mot de passe');
  upsert_menu('HDR_USER_INBOX', 'fr_FR', 'Boite de reception');
  upsert_menu('HDR_USER_SETTINGS', 'fr_FR', 'Parametres');
  upsert_menu('HDR_USER_SWITCH_MENU', 'fr_FR', 'Changer menu');
  upsert_menu('HDR_USER_LOGOUT', 'fr_FR', 'Deconnexion');
END;
/

COMMIT;

SET DEFINE ON;
