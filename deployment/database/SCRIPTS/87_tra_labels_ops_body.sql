-- Phase 8d — Syndigo, warehouse, helpdesk, IT ops (selected screens)
-- Deploy after 86.

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

  PROCEDURE rt(p_id VARCHAR2, p_us VARCHAR2, p_gb VARCHAR2, p_fr VARCHAR2) IS
  BEGIN
    seed3(p_id, p_us, p_gb, p_fr, 'ROUTE');
  END;
BEGIN
  -- Syndigo
  seed3('S21.BTN.SRCH', 'Search', 'Search', 'Rechercher', 'SCR0000000021');
  seed3('S21.MSG.NODATA', 'No results', 'No results', 'Aucun resultat', 'SCR0000000021');
  seed3('S22.BTN.DOWN', 'Download', 'Download', 'Telecharger', 'SCR0000000022');
  seed3('S29.BTN.SYNC', 'Synchronize', 'Synchronize', 'Synchroniser', 'SCR0000000029');

  -- Warehouse toolkit
  seed3('S35.BTN.REL', 'Release', 'Release', 'Liberer', 'SCR0000000035');
  seed3('S39.BTN.PRINT', 'Print label', 'Print label', 'Imprimer etiquette', 'SCR0000000039');
  seed3('S42.LBL.BATCH', 'Batch number', 'Batch number', 'Numero de lot', 'SCR0000000042');
  rt('RT.FPK.BTN', 'Apply change', 'Apply change', 'Appliquer');

  -- Helpdesk / restart
  seed3('S20.BTN.RST', 'Restart', 'Restart', 'Redemarrer', 'SCR0000000020');
  seed3('S20.MSG.CONF', 'Confirm service restart?', 'Confirm service restart?',
      'Confirmer redemarrage ?', 'SCR0000000020');

  -- Robot S14
  seed3('S14.BTN.RUN', 'Run diagnostic', 'Run diagnostic', 'Lancer diagnostic', 'SCR0000000014');

  -- Route toolboxes
  rt('RT.WHSBOX', 'Warehouse Tool Box', 'Warehouse Tool Box', 'Boite outils entrepot');
  rt('RT.RPTBOX', 'Reporting Tool Box', 'Reporting Tool Box', 'Boite outils reporting');
  rt('RT.WHS.LBL', 'Toolkit :', 'Toolkit :', 'Boite a outils :');
  rt('RT.RPT.LBL', 'Reporting :', 'Reporting :', 'Reporting :');
  rt('RT.BTN.OPEN', 'OPEN', 'OPEN', 'OUVRIR');
  rt('RT.CAO.LBL', 'Location code', 'Location code', 'Code emplacement');
  rt('RT.CAO.LBL.LOC', 'Location :', 'Location :', 'Emplacement :');
  rt('RT.CAO.BTN.SRCH', 'SEARCH', 'SEARCH', 'RECHERCHER');

  -- Batch S06 extra
  seed3('S06.MSG.RUN', 'Batch submitted', 'Batch submitted', 'Batch soumis', 'SCR0000000006');

  -- Counting S07 extra  
  seed3('S07.MSG.NODATA', 'No counting data', 'No counting data', 'Aucune donnee comptage', 'SCR0000000007');

  seed3('S05.MSG.NODATA', 'No missing CAO rows', 'No missing CAO rows', 'Aucune ligne CAO', 'SCR0000000005');

  -- Fix picking unit (route RT.FIXPK title; body keys RT.FPK.* max 15 chars)
  seed3('RT.FPK.ITM', 'Item code :', 'Item code :', 'Code article :', 'ROUTE');
  seed3('RT.FPK.PU', 'Picking unit :', 'Picking unit :', 'Unite prep. :', 'ROUTE');
END;
/

COMMIT;

SET DEFINE ON;
