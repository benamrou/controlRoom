-- Phase 7d — Missing screen titles + route/toolbox titles (SCR + RT keys)
-- Deploy after 80. TLAID max 15; TLADESC max 100.

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
  -- SCR titles missing from script 80
  seed3('S52.TITLE', 'Critical Alert Watchdog', 'Critical Alert Watchdog',
      'Surveillance alertes critiques', 'SCR0000000052');
  seed3('S53.TITLE', 'Retailer and GOLD setup', 'Retailer and GOLD setup',
      'Configuration detaillant GOLD', 'SCR0000000053');
  seed3('S54.TITLE', 'Schema discovery', 'Schema discovery',
      'Decouverte du schema', 'SCR0000000054');
  seed3('S55.TITLE', 'Context learning', 'Context learning',
      'Apprentissage du contexte', 'SCR0000000055');
  seed3('S56.TITLE', 'Skill library', 'Skill library',
      'Bibliotheque de competences', 'SCR0000000056');
  seed3('S58.TITLE', 'Pending phrasings', 'Pending phrasings',
      'Formulations en attente', 'SCR0000000058');
  seed3('S59.TITLE', 'Phrasing playground', 'Phrasing playground',
      'Bac a formulations', 'SCR0000000059');
  seed3('S60.TITLE', 'Supply Chain Assistant', 'Supply Chain Assistant',
      'Assistant supply chain', 'SCR0000000060');
  seed3('S61.TITLE', 'Data health', 'Data health',
      'Sante des donnees', 'SCR0000000061');
  seed3('S62.TITLE', 'Health configuration', 'Health configuration',
      'Configuration sante', 'SCR0000000062');
  seed3('S57.TITLE', 'Skill builder', 'Skill builder',
      'Constructeur de skill', 'SCR0000000057');

  -- Route / toolbox screens without SCR id in Angular
  seed3('RT.SEARCH', 'Corporate Inquiry', 'Corporate Inquiry', 'Recherche societe', 'ROUTE');
  seed3('RT.INV', 'Inventory follow-up', 'Inventory follow-up', 'Suivi inventaire', 'ROUTE');
  seed3('RT.CAOSET', 'CGO Setting', 'CGO Setting', 'Parametres CAO', 'ROUTE');
  seed3('RT.RPTBOX', 'Reporting Tool Box', 'Reporting Tool Box', 'Boite outils reporting', 'ROUTE');
  seed3('RT.WHSBOX', 'Warehouse Tool Box', 'Warehouse Tool Box', 'Boite outils entrepot', 'ROUTE');
  seed3('RT.QRUN', 'Query Runner', 'Query Runner', 'Executeur de requetes', 'ROUTE');
  seed3('RT.PQM', 'Preset Query Manager', 'Preset Query Manager', 'Gestion requetes preset', 'ROUTE');
  seed3('RT.SCHCTR', 'Supplier schedule by contract', 'Supplier schedule by contract',
      'Calendrier fournisseur par contrat', 'ROUTE');
  seed3('RT.FIXPK', 'Picking unit change', 'Picking unit change', 'Changement unite de prep', 'ROUTE');
  seed3('RT.ITMCAT', 'Item Category change', 'Item Category change', 'Changement categorie article', 'ROUTE');
  seed3('RT.AODASH', 'Automatic Order Dashboard', 'Automatic Order Dashboard',
      'Tableau de bord commande auto', 'ROUTE');

  cmn('CMN.UPD.COMP', 'Updates completed', 'Updates completed', 'Mises a jour terminees');
END;
/

COMMIT;

SET DEFINE ON;
