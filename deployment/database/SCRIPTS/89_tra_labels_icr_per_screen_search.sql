-- Per-screen search panel labels (Sxx / RT route keys) — no COMMON consolidation
-- Deploy after 88. Each screen owns Sxx.* (or RT.* for route-only pages).
-- Optional cleanup if consolidated keys were deployed from an earlier 86 draft:
-- DELETE FROM TRA_LABELS WHERE TLAID IN (
--   'RPT.LBL.WHS','RPT.LBL.SUP','RPT.BTN.SRCH','RPT.LBL.PST','RPT.LBL.PEN',
--   'RPT.LBL.LOC','RPT.LBL.VEND','RPT.LBL.SUPN','CMN.TAB.SRCH','CMN.PLH.CODE');

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

  -- S03
  seed3('S03.BTN.SRCH', 'SEARCH', 'SEARCH', 'RECHERCHER', 'SCR0000000003');
  seed3('S03.LBL.SUP', 'Supplier :', 'Supplier :', 'Fournisseur :', 'SCR0000000003');
  seed3('S03.PLH.CODE', 'Enter a code or a description', 'Enter a code or a description', 'Saisir un code ou une description', 'SCR0000000003');
  seed3('S03.LBL.PST', 'Period start :', 'Period start :', 'Debut periode :', 'SCR0000000003');
  seed3('S03.LBL.PEN', 'Period end :', 'Period end :', 'Fin periode :', 'SCR0000000003');
  seed3('S03.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee', 'SCR0000000003');

  -- S05
  seed3('S05.BTN.SRCH', 'SEARCH', 'SEARCH', 'RECHERCHER', 'SCR0000000005');
  seed3('S05.LBL.VEND', 'Vendor :', 'Vendor :', 'Fournisseur :', 'SCR0000000005');
  seed3('S05.LBL.LOC', 'Location :', 'Location :', 'Emplacement :', 'SCR0000000005');
  seed3('S05.TAB.SRCH', 'Search', 'Search', 'Rechercher', 'SCR0000000005');
  seed3('S05.PLH.CODE', 'Enter a code or a description', 'Enter a code or a description', 'Saisir un code ou une description', 'SCR0000000005');
  seed3('S05.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee', 'SCR0000000005');

  -- S06
  seed3('S06.BTN.SRCH', 'SEARCH', 'SEARCH', 'RECHERCHER', 'SCR0000000006');
  seed3('S06.TAB.SRCH', 'Search', 'Search', 'Rechercher', 'SCR0000000006');
  seed3('S06.PLH.CODE', 'Enter a code or a description', 'Enter a code or a description', 'Saisir un code ou une description', 'SCR0000000006');
  seed3('S06.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee', 'SCR0000000006');

  -- S08
  seed3('S08.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee', 'SCR0000000008');

  -- S09
  seed3('S09.BTN.SRCH', 'SEARCH', 'SEARCH', 'RECHERCHER', 'SCR0000000009');
  seed3('S09.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee', 'SCR0000000009');

  -- S12
  seed3('S12.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee', 'SCR0000000012');

  -- S13
  seed3('S13.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee', 'SCR0000000013');

  -- S15
  seed3('S15.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee', 'SCR0000000015');

  -- S16
  seed3('S16.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee', 'SCR0000000016');

  -- S18
  seed3('S18.BTN.SRCH', 'SEARCH', 'SEARCH', 'RECHERCHER', 'SCR0000000018');
  seed3('S18.LBL.SUP', 'Supplier :', 'Supplier :', 'Fournisseur :', 'SCR0000000018');
  seed3('S18.PLH.CODE', 'Enter a code or a description', 'Enter a code or a description', 'Saisir un code ou une description', 'SCR0000000018');

  -- S19
  seed3('S19.BTN.SRCH', 'SEARCH', 'SEARCH', 'RECHERCHER', 'SCR0000000019');

  -- S24
  seed3('S24.BTN.SRCH', 'SEARCH', 'SEARCH', 'RECHERCHER', 'SCR0000000024');
  seed3('S24.LBL.PST', 'Period start :', 'Period start :', 'Debut periode :', 'SCR0000000024');
  seed3('S24.LBL.PEN', 'Period end :', 'Period end :', 'Fin periode :', 'SCR0000000024');
  seed3('S24.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee', 'SCR0000000024');

  -- S25
  seed3('S25.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee', 'SCR0000000025');

  -- S26
  seed3('S26.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee', 'SCR0000000026');

  -- S27
  seed3('S27.BTN.SRCH', 'SEARCH', 'SEARCH', 'RECHERCHER', 'SCR0000000027');
  seed3('S27.LBL.SUP', 'Supplier :', 'Supplier :', 'Fournisseur :', 'SCR0000000027');

  -- S28
  seed3('S28.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee', 'SCR0000000028');

  -- S30
  seed3('S30.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee', 'SCR0000000030');

  -- S31
  seed3('S31.BTN.SRCH', 'SEARCH', 'SEARCH', 'RECHERCHER', 'SCR0000000031');
  seed3('S31.LBL.PST', 'Period start :', 'Period start :', 'Debut periode :', 'SCR0000000031');
  seed3('S31.LBL.PEN', 'Period end :', 'Period end :', 'Fin periode :', 'SCR0000000031');

  -- S32
  seed3('S32.BTN.SRCH', 'SEARCH', 'SEARCH', 'RECHERCHER', 'SCR0000000032');
  seed3('S32.LBL.PST', 'Period start :', 'Period start :', 'Debut periode :', 'SCR0000000032');
  seed3('S32.LBL.PEN', 'Period end :', 'Period end :', 'Fin periode :', 'SCR0000000032');

  -- S34
  seed3('S34.BTN.SRCH', 'SEARCH', 'SEARCH', 'RECHERCHER', 'SCR0000000034');

  -- S35
  seed3('S35.BTN.SRCH', 'SEARCH', 'SEARCH', 'RECHERCHER', 'SCR0000000035');
  seed3('S35.LBL.WHS', 'Warehouse :', 'Warehouse :', 'Entrepot :', 'SCR0000000035');
  seed3('S35.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee', 'SCR0000000035');

  -- S36
  seed3('S36.BTN.SRCH', 'SEARCH', 'SEARCH', 'RECHERCHER', 'SCR0000000036');

  -- S37
  seed3('S37.BTN.SRCH', 'SEARCH', 'SEARCH', 'RECHERCHER', 'SCR0000000037');
  seed3('S37.LBL.SUP', 'Supplier :', 'Supplier :', 'Fournisseur :', 'SCR0000000037');
  seed3('S37.PLH.CODE', 'Enter a code or a description', 'Enter a code or a description', 'Saisir un code ou une description', 'SCR0000000037');
  seed3('S37.LBL.PST', 'Period start :', 'Period start :', 'Debut periode :', 'SCR0000000037');
  seed3('S37.LBL.PEN', 'Period end :', 'Period end :', 'Fin periode :', 'SCR0000000037');

  -- S38
  seed3('S38.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee', 'SCR0000000038');

  -- S39
  seed3('S39.BTN.SRCH', 'SEARCH', 'SEARCH', 'RECHERCHER', 'SCR0000000039');
  seed3('S39.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee', 'SCR0000000039');

  -- S40
  seed3('S40.BTN.SRCH', 'SEARCH', 'SEARCH', 'RECHERCHER', 'SCR0000000040');
  seed3('S40.LBL.SUPN', 'Supplier # :', 'Supplier # :', 'Fournisseur n. :', 'SCR0000000040');
  seed3('S40.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee', 'SCR0000000040');

  -- S41
  seed3('S41.BTN.SRCH', 'SEARCH', 'SEARCH', 'RECHERCHER', 'SCR0000000041');

  -- S42
  seed3('S42.BTN.SRCH', 'SEARCH', 'SEARCH', 'RECHERCHER', 'SCR0000000042');
  seed3('S42.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee', 'SCR0000000042');

  -- S43
  seed3('S43.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee', 'SCR0000000043');

  -- S44
  seed3('S44.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee', 'SCR0000000044');

  -- S45
  seed3('S45.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee', 'SCR0000000045');

  -- S46
  seed3('S46.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee', 'SCR0000000046');

  -- S47
  seed3('S47.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee', 'SCR0000000047');

  -- S49
  seed3('S49.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee', 'SCR0000000049');

  -- S50
  seed3('S50.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee', 'SCR0000000050');

  -- S51
  seed3('S51.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee', 'SCR0000000051');

  -- S52
  seed3('S52.BTN.SRCH', 'SEARCH', 'SEARCH', 'RECHERCHER', 'SCR0000000052');

  -- S67
  seed3('S67.BTN.SRCH', 'SEARCH', 'SEARCH', 'RECHERCHER', 'SCR0000000067');

  -- RT.CAOSET (title + search keys also in 87_tra_labels_ops_body.sql)

  -- RT.SCHCTR title; body keys RT.SCH.* (TLAID max 15)
  seed3('RT.SCH.BTN.SRCH', 'SEARCH', 'SEARCH', 'RECHERCHER', 'ROUTE');
  seed3('RT.SCH.LBL.SUP', 'Supplier :', 'Supplier :', 'Fournisseur :', 'ROUTE');
  seed3('RT.SCH.PLH.COD', 'Enter a code or a description', 'Enter a code or a description', 'Saisir un code ou une description', 'ROUTE');
  seed3('RT.SCH.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee', 'ROUTE');

  -- RT.INV
  seed3('RT.INV.BTN.SRCH', 'SEARCH', 'SEARCH', 'RECHERCHER', 'ROUTE');
  seed3('RT.INV.LBL.LOC', 'Location :', 'Location :', 'Emplacement :', 'ROUTE');

  -- RT.FIXPK title; body keys RT.FPK.*
  seed3('RT.FPK.BTN.SRCH', 'SEARCH', 'SEARCH', 'RECHERCHER', 'ROUTE');
  seed3('RT.FPK.PLH.COD', 'Enter a code or a description', 'Enter a code or a description', 'Saisir un code ou une description', 'ROUTE');
  seed3('RT.FPK.DLG.UPD', 'Update completed', 'Update completed', 'Mise a jour terminee', 'ROUTE');
END;
/

COMMIT;

SET DEFINE ON;
