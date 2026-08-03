-- S87 Pallet/SSCC traceability — labels (SCR0000000087)
-- Deploy after 109_tra_labels_tladesc_clob.sql and 111_menu_pallet_sscc_trace.sql.
-- Re-login or language switch to reload LAB0000002.

SET DEFINE OFF;
SET SCAN OFF;

DECLARE
  PROCEDURE seed3(p_id VARCHAR2, p_us VARCHAR2, p_gb VARCHAR2, p_fr VARCHAR2, p_screen VARCHAR2) IS
  BEGIN
    MERGE INTO TRA_LABELS t USING (SELECT p_id TLAID, 'us_US' TLALANGUE FROM DUAL) s
    ON (t.TLAID = s.TLAID AND t.TLALANGUE = s.TLALANGUE)
    WHEN MATCHED THEN UPDATE SET t.TLADESC = p_us, t.TLASCREEN = p_screen, t.TLADMAJ = SYSDATE, t.TLAUTIL = 'admin'
    WHEN NOT MATCHED THEN INSERT (TLAID, TLADESC, TLAMENU, TLASCREEN, TLALANGUE, TLADCRE, TLADMAJ, TLAUTIL)
    VALUES (p_id, p_us, 0, p_screen, 'us_US', SYSDATE, SYSDATE, 'admin');
    MERGE INTO TRA_LABELS t USING (SELECT p_id TLAID, 'en_GB' TLALANGUE FROM DUAL) s
    ON (t.TLAID = s.TLAID AND t.TLALANGUE = s.TLALANGUE)
    WHEN MATCHED THEN UPDATE SET t.TLADESC = p_gb, t.TLASCREEN = p_screen, t.TLADMAJ = SYSDATE, t.TLAUTIL = 'admin'
    WHEN NOT MATCHED THEN INSERT (TLAID, TLADESC, TLAMENU, TLASCREEN, TLALANGUE, TLADCRE, TLADMAJ, TLAUTIL)
    VALUES (p_id, p_gb, 0, p_screen, 'en_GB', SYSDATE, SYSDATE, 'admin');
    MERGE INTO TRA_LABELS t USING (SELECT p_id TLAID, 'fr_FR' TLALANGUE FROM DUAL) s
    ON (t.TLAID = s.TLAID AND t.TLALANGUE = s.TLALANGUE)
    WHEN MATCHED THEN UPDATE SET t.TLADESC = p_fr, t.TLASCREEN = p_screen, t.TLADMAJ = SYSDATE, t.TLAUTIL = 'admin'
    WHEN NOT MATCHED THEN INSERT (TLAID, TLADESC, TLAMENU, TLASCREEN, TLALANGUE, TLADCRE, TLADMAJ, TLAUTIL)
    VALUES (p_id, p_fr, 0, p_screen, 'fr_FR', SYSDATE, SYSDATE, 'admin');
  END;
BEGIN
  seed3('S87.TITLE', 'Pallet/SSCC traceability', 'Pallet/SSCC traceability', 'Tracabilite palette/SSCC', 'SCR0000000087');
  seed3('S87.WARN',
        'Add, edit or remove UBD and production lot (LOF) on live and archived SSCC pallet lines. Default search: allotment missing both indicators. Production lot is only available for Manufacturing warehouse 93080.',
        'Add, edit or remove UBD and production lot (LOF) on live and archived SSCC pallet lines. Default search: allotment missing both indicators. Production lot is only available for Manufacturing warehouse 93080.',
        'Ajouter, modifier ou supprimer DLC et LOF sur les SSCC live et archives. Recherche par defaut : allotement sans les deux indicateurs. LOF reserve a l''entrepot Manufacturing 93080.',
        'SCR0000000087');
  seed3('S87.LBL.SSCC', 'SSCC #', 'SSCC #', 'SSCC #', 'SCR0000000087');
  seed3('S87.LBL.ITEM', 'Item #', 'Item #', 'Article #', 'SCR0000000087');
  seed3('S87.LBL.PO', 'PO #', 'PO #', 'Commande #', 'SCR0000000087');
  seed3('S87.LBL.WHS', 'Whs #', 'Whs #', 'Entrepot #', 'SCR0000000087');
  seed3('S87.LBL.STORE', 'Store #', 'Store #', 'Magasin #', 'SCR0000000087');
  seed3('S87.LBL.VND', 'Vendor #', 'Vendor #', 'Fournisseur #', 'SCR0000000087');
  seed3('S87.LBL.FLOW', 'Flow', 'Flow', 'Flux', 'SCR0000000087');
  seed3('S87.LBL.MISS', 'Missing', 'Missing', 'Manquant', 'SCR0000000087');
  seed3('S87.PLH.SSCC', 'Enter SSCC', 'Enter SSCC', 'Saisir SSCC', 'SCR0000000087');
  seed3('S87.PLH.ITEM', 'Enter item code', 'Enter item code', 'Saisir article', 'SCR0000000087');
  seed3('S87.PLH.PO', 'Enter PO (receipt or shipment)', 'Enter PO (receipt or shipment)', 'Saisir commande (reception ou expedition)', 'SCR0000000087');
  seed3('S87.PLH.WHS', '93080 (blank = all)', '93080 (blank = all)', '93080 (vide = tous)', 'SCR0000000087');
  seed3('S87.PLH.VND', 'Enter vendor code', 'Enter vendor code', 'Saisir fournisseur', 'SCR0000000087');
  seed3('S87.OPT.ALL', 'All', 'All', 'Tous', 'SCR0000000087');
  seed3('S87.OPT.ALOT', 'Allotment', 'Allotment', 'Allotement', 'SCR0000000087');
  seed3('S87.OPT.STK', 'In-stock', 'In-stock', 'Stock', 'SCR0000000087');
  seed3('S87.OPT.BOTH', 'No UBD and no prod lot', 'No UBD and no prod lot', 'Sans UBD ni lot', 'SCR0000000087');
  seed3('S87.OPT.DLC', 'No UBD', 'No UBD', 'Sans UBD', 'SCR0000000087');
  seed3('S87.OPT.LOF', 'No prod lot', 'No prod lot', 'Sans lot fab.', 'SCR0000000087');
  seed3('S87.OPT.ANY', 'Any (with or without)', 'Any (with or without)', 'Tous (avec ou sans)', 'SCR0000000087');
  seed3('S87.BTN.SRCH', 'SEARCH', 'SEARCH', 'RECHERCHER', 'SCR0000000087');
  seed3('S87.BTN.ADD', 'Add', 'Add', 'Ajouter', 'SCR0000000087');
  seed3('S87.BTN.EDIT', 'Edit', 'Edit', 'Modifier', 'SCR0000000087');
  seed3('S87.BTN.DEL', 'Remove', 'Remove', 'Supprimer', 'SCR0000000087');
  seed3('S87.BTN.SAVE', 'Save', 'Save', 'Enregistrer', 'SCR0000000087');
  seed3('S87.BTN.MASS', 'APPLY TO ALL', 'APPLY TO ALL', 'APPLIQUER A TOUS', 'SCR0000000087');
  seed3('S87.LBL.MASS', 'Apply to all results', 'Apply to all results', 'Appliquer a tous les resultats', 'SCR0000000087');
  seed3('S87.LBL.UBD', 'UBD', 'UBD', 'DLC', 'SCR0000000087');
  seed3('S87.LBL.LOF', 'Prod lot', 'Prod lot', 'Lot fab.', 'SCR0000000087');
  seed3('S87.PLH.LOF', 'Production lot', 'Production lot', 'Lot de fabrication', 'SCR0000000087');
  seed3('S87.LBL.IND', 'Indicator', 'Indicator', 'Indicateur', 'SCR0000000087');
  seed3('S87.LBL.VAL', 'Value', 'Value', 'Valeur', 'SCR0000000087');
  seed3('S87.LBL.UID', 'User id', 'User id', 'Identifiant', 'SCR0000000087');
  seed3('S87.PLH.UID', 'Enter your user id to confirm', 'Enter your user id to confirm',
        'Saisir votre identifiant pour confirmer', 'SCR0000000087');
  seed3('S87.CFM.TTL', 'Confirm change', 'Confirm change', 'Confirmer modification', 'SCR0000000087');
  seed3('S87.CFM.DEL', 'Remove this traceability indicator from the SSCC line?',
        'Remove this traceability indicator from the SSCC line?',
        'Supprimer cet indicateur de tracabilite de la ligne SSCC ?', 'SCR0000000087');
  seed3('S87.CFM.SAV', 'Save this traceability indicator on the SSCC line?',
        'Save this traceability indicator on the SSCC line?',
        'Enregistrer cet indicateur de tracabilite sur la ligne SSCC ?', 'SCR0000000087');
  seed3('S87.MSG.UINV', 'User id does not match your login.',
        'User id does not match your login.',
        'L''identifiant ne correspond pas a votre connexion.', 'SCR0000000087');
  seed3('S87.MSG.LOF', 'Production lot is only allowed for Manufacturing warehouse 93080.',
        'Production lot is only allowed for Manufacturing warehouse 93080.',
        'Le lot de fabrication est reserve a l''entrepot Manufacturing 93080.', 'SCR0000000087');
  seed3('S87.MSG.MASSREQ', 'Enter a UBD and/or production lot to apply to all results.',
        'Enter a UBD and/or production lot to apply to all results.',
        'Saisir une DLC et/ou un lot a appliquer a tous les resultats.', 'SCR0000000087');
  seed3('S87.MSG.EMPTY', 'No SSCC lines found for the current filters.',
        'No SSCC lines found for the current filters.',
        'Aucune ligne SSCC pour les filtres selectionnes.', 'SCR0000000087');
  seed3('S87.MSG.OK', 'Traceability indicator saved.',
        'Traceability indicator saved.',
        'Indicateur de tracabilite enregistre.', 'SCR0000000087');
  seed3('S87.MSG.MASSOK', 'UBD / prod lot applied to all searched lines.',
        'UBD / prod lot applied to all searched lines.',
        'DLC / lot appliques a toutes les lignes recherchees.', 'SCR0000000087');
  seed3('S87.MSG.DEL', 'Traceability indicator removed.',
        'Traceability indicator removed.',
        'Indicateur de tracabilite supprime.', 'SCR0000000087');
  seed3('S87.DLG.EDIT', 'Edit indicator', 'Edit indicator', 'Modifier indicateur', 'SCR0000000087');
  seed3('S87.DLG.ADD', 'Add indicator', 'Add indicator', 'Ajouter indicateur', 'SCR0000000087');
END;
/

MERGE INTO TRA_TECHOBJ t
USING (
  SELECT 'SCR0000000087' AS TOBID,
         'Warehouse' AS TOBCAT,
         q'[<div><i class="bbs-keywords">What is it : </i>Maintain UBD and production lot (LOF) indicators on GOLD STOCK SSCC lines (TB_TRAUMS / TB_HTRAUMS). Mainly for allotment receiving where indicators were not captured.</div>]' AS TOBDESC,
         q'[<div><i class="bbs-keywords">When to use : </i>Allotment pallets missing UBD/LOF, or correct an existing indicator. LOF is restricted to Manufacturing warehouse 93080.</div>]' AS TOBDESC2
    FROM dual
) s ON (t.TOBID = s.TOBID)
WHEN MATCHED THEN UPDATE SET
  TOBCAT = s.TOBCAT, TOBDESC = s.TOBDESC, TOBDESC2 = s.TOBDESC2, TOBDMAJ = SYSDATE, TOBUTIL = 'admin'
WHEN NOT MATCHED THEN INSERT (TOBID, TOBCAT, TOBDESC, TOBDESC2, TOBLANGUE, TOBDCRE, TOBDMAJ, TOBUTIL)
VALUES (s.TOBID, s.TOBCAT, s.TOBDESC, s.TOBDESC2, 'us_US', SYSDATE, SYSDATE, 'admin');

COMMIT;

SET DEFINE ON;
SET SCAN ON;
