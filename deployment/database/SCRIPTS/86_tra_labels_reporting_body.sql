-- Phase 8c — Reporting dashboards body (S02, S04, S10, S11, S17)
-- Deploy after 85.

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
  -- S02 Scorecard CAO
  seed3('S02.LBL.LOC', 'Location :', 'Location :', 'Emplacement :', 'SCR0000000002');
  seed3('S02.LBL.SCDT', 'Score card date :', 'Score card date :', 'Date scorecard :', 'SCR0000000002');
  seed3('S02.BTN.OPEN', 'OPEN', 'OPEN', 'OUVRIR', 'SCR0000000002');
  seed3('S02.DEPT.DAIRY', 'Dairy', 'Dairy', 'Cremerie', 'SCR0000000002');
  seed3('S02.DEPT.GROC', 'Grocery', 'Grocery', 'Epicerie', 'SCR0000000002');
  seed3('S02.MSG.NODATA', 'No data available - Review the search criteria.',
      'No data available - Review the search criteria.',
      'Aucune donnee - Verifiez les criteres.', 'SCR0000000002');
  seed3('S02.CARD.SUM', 'Summary', 'Summary', 'Resume', 'SCR0000000002');
  seed3('S02.CARD.CCC', 'Completed Cycle Count', 'Completed Cycle Count',
      'Inventaire tournant complete', 'SCR0000000002');

  -- S04 Cycle dashboard
  seed3('S04.MSG.NODATA', 'No data available', 'No data available', 'Aucune donnee', 'SCR0000000004');
  seed3('S04.CARD.ADJ', 'Inventory Adjustments', 'Inventory Adjustments', 'Ajustements inventaire', 'SCR0000000004');
  seed3('S04.CARD.VOL', 'Volume Neg./zero', 'Volume Neg./zero', 'Volume neg./zero', 'SCR0000000004');

  -- S10 Warehouse replenishment
  seed3('S10.MSG.NODATA', 'No data available', 'No data available', 'Aucune donnee', 'SCR0000000010');
  seed3('S10.CARD.SUM', 'Summary', 'Summary', 'Resume', 'SCR0000000010');
  seed3('S10.LBL.WHS', 'Warehouse :', 'Warehouse :', 'Entrepot :', 'SCR0000000010');
  seed3('S10.LBL.SUP', 'Supplier :', 'Supplier :', 'Fournisseur :', 'SCR0000000010');
  seed3('S10.BTN.SRCH', 'SEARCH', 'SEARCH', 'RECHERCHER', 'SCR0000000010');
  seed3('S10.LBL.PST', 'Period start :', 'Period start :', 'Debut periode :', 'SCR0000000010');
  seed3('S10.LBL.PEN', 'Period end :', 'Period end :', 'Fin periode :', 'SCR0000000010');
  seed3('S10.PLH.CODE', 'Enter a code or a description', 'Enter a code or a description',
      'Saisir un code ou une description', 'SCR0000000010');
  seed3('S10.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee', 'SCR0000000010');

  -- S11 Supplier dashboard (also S11 reception AP)
  seed3('S11.MSG.NODATA', 'No data available', 'No data available', 'Aucune donnee', 'SCR0000000011');
  seed3('S11.CARD.SUM', 'Summary', 'Summary', 'Resume', 'SCR0000000011');
  seed3('S11.LBL.WHS', 'Warehouse :', 'Warehouse :', 'Entrepot :', 'SCR0000000011');
  seed3('S11.LBL.SUP', 'Supplier :', 'Supplier :', 'Fournisseur :', 'SCR0000000011');
  seed3('S11.BTN.SRCH', 'SEARCH', 'SEARCH', 'RECHERCHER', 'SCR0000000011');
  seed3('S11.LBL.PST', 'Period start :', 'Period start :', 'Debut periode :', 'SCR0000000011');
  seed3('S11.LBL.PEN', 'Period end :', 'Period end :', 'Fin periode :', 'SCR0000000011');
  seed3('S11.PLH.CODE', 'Enter a code or a description', 'Enter a code or a description',
      'Saisir un code ou une description', 'SCR0000000011');

  -- S17 Smart UBD
  seed3('S17.MSG.NODATA', 'No data available', 'No data available', 'Aucune donnee', 'SCR0000000017');
  seed3('S17.BTN.SRCH', 'SEARCH', 'SEARCH', 'RECHERCHER', 'SCR0000000017');
  seed3('S17.LBL.WHS', 'Warehouse :', 'Warehouse :', 'Entrepot :', 'SCR0000000017');
  seed3('S17.LBL.SUP', 'Supplier :', 'Supplier :', 'Fournisseur :', 'SCR0000000017');
  seed3('S17.PLH.CODE', 'Enter a code or a description', 'Enter a code or a description',
      'Saisir un code ou une description', 'SCR0000000017');
END;
/

COMMIT;

SET DEFINE ON;
