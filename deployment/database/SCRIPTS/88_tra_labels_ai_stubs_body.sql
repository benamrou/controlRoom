-- Phase 8e — AI stub screens S71-S86 body
-- Deploy after 87.

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

  PROCEDURE stub(p_sxx VARCHAR2, p_scr VARCHAR2, p_title VARCHAR2, p_fr VARCHAR2) IS
  BEGIN
    seed3(p_sxx || '.STUB.H', p_title, p_title, p_fr, p_scr);
    seed3(p_sxx || '.STUB.M', 'Under development', 'Under development', 'En developpement', p_scr);
    seed3(p_sxx || '.STUB.D', 'This screen will be available in a future release.',
        'This screen will be available in a future release.',
        'Ecran disponible dans une prochaine version.', p_scr);
  END;
BEGIN
  stub('S71', 'SCR0000000071', 'Playbook Management', 'Gestion playbook');
  stub('S72', 'SCR0000000072', 'Users and Roles', 'Utilisateurs et roles');
  stub('S73', 'SCR0000000073', 'Autonomy Settings', 'Parametres autonomie');
  stub('S74', 'SCR0000000074', 'Notifications', 'Notifications');
  stub('S75', 'SCR0000000075', 'Approval Queue', 'File approbation');
  stub('S76', 'SCR0000000076', 'AI Dashboard', 'Tableau de bord IA');
  stub('S77', 'SCR0000000077', 'Operational Blockers', 'Blocages operationnels');
  stub('S78', 'SCR0000000078', 'What-if Simulator', 'Simulateur what-if');
  stub('S79', 'SCR0000000079', 'Domain Investigation', 'Investigation domaine');
  stub('S80', 'SCR0000000080', 'AI Assistant', 'Assistant IA');
  stub('S81', 'SCR0000000081', 'Pattern Library', 'Bibliotheque modeles');
  stub('S82', 'SCR0000000082', 'KPI and Performance', 'KPI et performance');
  stub('S83', 'SCR0000000083', 'Decision Audit', 'Audit decisions');
  stub('S84', 'SCR0000000084', 'Store Operations', 'Operations magasin');
  stub('S85', 'SCR0000000085', 'Recommendations', 'Recommandations');
  stub('S86', 'SCR0000000086', 'Warehouse Operations', 'Operations entrepot');

  -- S76 dashboard extra (partial screen exists)
  seed3('S76.LBL.RET', 'Retailer', 'Retailer', 'Detaillant', 'SCR0000000076');
  seed3('S76.PLH.RET', 'Select retailer...', 'Select retailer...', 'Choisir detaillant...', 'SCR0000000076');
  seed3('S76.MSG.SEL', 'Select a retailer', 'Select a retailer', 'Choisir un detaillant', 'SCR0000000076');
  seed3('S76.MSG.KPI', 'Dashboard KPIs load from AI status endpoints.',
      'Dashboard KPIs load from AI status endpoints.',
      'Les KPI chargent depuis les endpoints IA.', 'SCR0000000076');
  seed3('S76.CRD.CTX', 'Context Learning', 'Context Learning', 'Apprentissage contexte', 'SCR0000000076');
  seed3('S76.CRD.REQ', 'Required Items', 'Required Items', 'Elements requis', 'SCR0000000076');
  seed3('S76.CRD.CONF', 'Avg Confidence', 'Avg Confidence', 'Confiance moy.', 'SCR0000000076');
  seed3('S76.CRD.VIEW', 'Active Item View', 'Active Item View', 'Vue article active', 'SCR0000000076');
  seed3('S76.TAG.READY', 'Required ready', 'Required ready', 'Requis pret', 'SCR0000000076');
  seed3('S76.TAG.PROG', 'In progress', 'In progress', 'En cours', 'SCR0000000076');
  seed3('S76.TAG.AVAIL', 'Available', 'Available', 'Disponible', 'SCR0000000076');
  seed3('S76.TAG.NGEN', 'Not generated', 'Not generated', 'Non genere', 'SCR0000000076');
  seed3('S76.SUB.LOCK', 'Knowledge items locked', 'Knowledge items locked', 'Elements verrouilles', 'SCR0000000076');
  seed3('S76.SUB.PRI', 'Priority-1 items locked', 'Priority-1 items locked', 'Priorite 1 verrouillee', 'SCR0000000076');
  seed3('S76.SUB.AVG', 'Across all catalog items', 'Across all catalog items', 'Sur tout le catalogue', 'SCR0000000076');
  seed3('S76.SUB.VIEW', 'Generated view', 'Generated view', 'Vue generee', 'SCR0000000076');
END;
/

COMMIT;

SET DEFINE ON;
