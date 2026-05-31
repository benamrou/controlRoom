-- Phase 7 — ICR screen page titles (SCR0000000001–0052 + AI stubs S71+)
-- Deploy after 72. TLAID max 15; TLADESC max 100. Run from line 1.

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
BEGIN
  seed3('S01.TITLE', 'Recent Activities Overview', 'Recent Activities Overview', 'Apercu des activites recentes', 'SCR0000000001');
  seed3('S02.TITLE', 'Automatic Order Scorecard', 'Automatic Order Scorecard', 'Tableau de bord commande automatique', 'SCR0000000002');
  seed3('S03.TITLE', 'Holiday schedule calendar', 'Holiday schedule calendar', 'Calendrier jours feries', 'SCR0000000003');
  seed3('S04.TITLE', 'Cycle Count Dashboard', 'Cycle Count Dashboard', 'Tableau de bord inventaire tournant', 'SCR0000000004');
  seed3('S05.TITLE', 'CAO missing', 'CAO missing', 'CAO manquant', 'SCR0000000005');
  seed3('S06.TITLE', 'Job execution', 'Job execution', 'Execution de job', 'SCR0000000006');
  seed3('S07.TITLE', 'Third-Party counting integration follow-up', 'Third-Party counting integration follow-up', 'Suivi integration comptage tiers', 'SCR0000000007');
  seed3('S08.TITLE', 'Item Hierarchy change', 'Item Hierarchy change', 'Changement hierarchie article', 'SCR0000000008');
  seed3('S09.TITLE', 'Mass Changes Journal', 'Mass Changes Journal', 'Journal modifications de masse', 'SCR0000000009');
  seed3('S10.TITLE', 'Warehouse Replenishment dashboard', 'Warehouse Replenishment dashboard', 'Tableau de bord replenishment entrepot', 'SCR0000000010');
  seed3('S11.TITLE', 'Supplier dashboard', 'Supplier dashboard', 'Tableau de bord fournisseur', 'SCR0000000011');
  seed3('S12.TITLE', 'Item/SV attribute change', 'Item/SV attribute change', 'Changement attribut article/SV', 'SCR0000000012');
  seed3('S13.TITLE', 'Item SKU Dimension change', 'Item SKU Dimension change', 'Item SKU Dimension changement', 'SCR0000000013');
  seed3('S14.TITLE', 'Diagnostic tool', 'Diagnostic tool', 'Outil de diagnostic', 'SCR0000000014');
  seed3('S15.TITLE', 'Item/SV information change', 'Item/SV information change', 'Changement info article/SV', 'SCR0000000015');
  seed3('S16.TITLE', 'Item attribute change', 'Item attribute change', 'Changement attribut article', 'SCR0000000016');
  seed3('S17.TITLE', 'Smart UBD', 'Smart UBD', 'Smart UBD', 'SCR0000000017');
  seed3('S18.TITLE', 'Generate schedule by calendar', 'Generate schedule by calendar', 'Generer calendrier', 'SCR0000000018');
  seed3('S19.TITLE', 'Alerts management', 'Alerts management', 'Gestion des alertes', 'SCR0000000019');
  seed3('S20.TITLE', 'Restart services', 'Restart services', 'Redemarrer services', 'SCR0000000020');
  seed3('S21.TITLE', 'Syndigo Inquiry', 'Syndigo Inquiry', 'Recherche Syndigo', 'SCR0000000021');
  seed3('S22.TITLE', 'Syndigo collect images', 'Syndigo collect images', 'Syndigo collect images', 'SCR0000000022');
  seed3('S23.TITLE', 'Ecommerce picture', 'Ecommerce picture', 'Ecommerce picture', 'SCR0000000023');
  seed3('S24.TITLE', 'Order Urgency', 'Order Urgency', 'Urgence commande', 'SCR0000000024');
  seed3('S25.TITLE', 'Warehouse item description change', 'Warehouse item description change', 'Entrepot article description changement', 'SCR0000000025');
  seed3('S26.TITLE', 'Variable weight change', 'Variable weight change', 'Variable weight changement', 'SCR0000000026');
  seed3('S27.TITLE', 'Stores ASN (de)activation', 'Stores ASN (de)activation', 'Stores ASN (de)activation', 'SCR0000000027');
  seed3('S28.TITLE', 'Item logistic code change', 'Item logistic code change', 'Item logistic code changement', 'SCR0000000028');
  seed3('S29.TITLE', 'Syndigo update MDM dimensions', 'Syndigo update MDM dimensions', 'Syndigo update MDM dimensions', 'SCR0000000029');
  seed3('S30.TITLE', 'Item images change', 'Item images change', 'Changement images article', 'SCR0000000030');
  seed3('S31.TITLE', 'Item history', 'Item history', 'Historique article', 'SCR0000000031');
  seed3('S32.TITLE', 'Retail by PPG (deletion)', 'Retail by PPG (deletion)', 'Retail by PPG (deletion)', 'SCR0000000032');
  seed3('S33.TITLE', 'Next PPG', 'Next PPG', 'PPG suivant', 'SCR0000000033');
  seed3('S34.TITLE', 'Item information', 'Item information', 'Item information', 'SCR0000000034');
  seed3('S35.TITLE', 'Release Pallet', 'Release Pallet', 'Liberer palette', 'SCR0000000035');
  seed3('S36.TITLE', 'eCommerce description', 'eCommerce description', 'eCommerce description', 'SCR0000000036');
  seed3('S37.TITLE', 'Fill rate', 'Fill rate', 'Taux de service', 'SCR0000000037');
  seed3('S38.TITLE', 'Supplier address change', 'Supplier address change', 'Fournisseur address changement', 'SCR0000000038');
  seed3('S39.TITLE', 'Release Pallet', 'Release Pallet', 'Liberer palette', 'SCR0000000039');
  seed3('S40.TITLE', 'Unarchive invoice', 'Unarchive invoice', 'Desarchiver facture', 'SCR0000000040');
  seed3('S41.TITLE', 'Filter management', 'Filter management', 'Gestion des filtres', 'SCR0000000041');
  seed3('S42.TITLE', 'Production batch number', 'Production batch number', 'Numero lot production', 'SCR0000000042');
  seed3('S43.TITLE', 'Item list description change', 'Item list description change', 'Changement description liste articles', 'SCR0000000043');
  seed3('S44.TITLE', 'Purchase order creation', 'Purchase order creation', 'Creation bon de commande', 'SCR0000000044');
  seed3('S45.TITLE', 'Item attribute start/end change', 'Item attribute start/end change', 'Changement attribut article debut/fin', 'SCR0000000045');
  seed3('S46.TITLE', 'Item description change', 'Item description change', 'Changement description article', 'SCR0000000046');
  seed3('S47.TITLE', 'Item address change', 'Item address change', 'Changement adresse article', 'SCR0000000047');
  seed3('S48.TITLE', 'Vega Process Dashboard', 'Vega Process Dashboard', 'Tableau de bord processus Vega', 'SCR0000000048');
  seed3('S49.TITLE', 'Push/Breakdown order creation', 'Push/Breakdown order creation', 'Creation commande push/repartition', 'SCR0000000049');
  seed3('S50.TITLE', 'Stock layer change', 'Stock layer change', 'Changement couche stock', 'SCR0000000050');
  seed3('S51.TITLE', 'Item end barcode', 'Item end barcode', 'Fin code-barres article', 'SCR0000000051');
  seed3('S57.TITLE', 'pageHeading', 'pageHeading', 'pageHeading', 'SCR0000000057');
  seed3('S63.TITLE', 'Alerts journal', 'Alerts journal', 'Journal des alertes', 'SCR0000000063');
  seed3('S71.TITLE', 'Playbook Management', 'Playbook Management', 'Playbook Management', 'SCR0000000071');
  seed3('S72.TITLE', 'Users and Roles', 'Users and Roles', 'Utilisateurs et roles', 'SCR0000000072');
  seed3('S73.TITLE', 'Autonomy Settings', 'Autonomy Settings', 'Autonomy Settings', 'SCR0000000073');
  seed3('S74.TITLE', 'Notifications', 'Notifications', 'Notifications', 'SCR0000000074');
  seed3('S75.TITLE', 'Approval Queue', 'Approval Queue', 'Approval Queue', 'SCR0000000075');
  seed3('S76.TITLE', 'AI Dashboard', 'AI Dashboard', 'AI Dashboard', 'SCR0000000076');
  seed3('S77.TITLE', 'Operational Blockers', 'Operational Blockers', 'Operational Blockers', 'SCR0000000077');
  seed3('S78.TITLE', 'What-if Simulator', 'What-if Simulator', 'What-if Simulator', 'SCR0000000078');
  seed3('S79.TITLE', 'Domain Investigation', 'Domain Investigation', 'Domain Investigation', 'SCR0000000079');
  seed3('S80.TITLE', 'AI Assistant', 'AI Assistant', 'AI Assistant', 'SCR0000000080');
  seed3('S81.TITLE', 'Pattern Library', 'Pattern Library', 'Pattern Library', 'SCR0000000081');
  seed3('S82.TITLE', 'KPI and Performance', 'KPI and Performance', 'KPI et performance', 'SCR0000000082');
  seed3('S83.TITLE', 'Decision Audit', 'Decision Audit', 'Decision Audit', 'SCR0000000083');
  seed3('S84.TITLE', 'Store Operations', 'Store Operations', 'Store Operations', 'SCR0000000084');
  seed3('S85.TITLE', 'Recommendations', 'Recommendations', 'Recommendations', 'SCR0000000085');
  seed3('S86.TITLE', 'Warehouse Operations', 'Warehouse Operations', 'Entrepot Operations', 'SCR0000000086');
END;
/

COMMIT;

SET DEFINE ON;
