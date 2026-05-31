-- Phase 10 body labels — search sub-panels, dashboard cards, filter, dialogs
-- Deploy after 89. Per-screen Sxx.* only (TLAID max 15).
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

  -- S04 Cycle dashboard filter (shared filter-cmp)
  seed3('S04.FLT.NET', 'LOCATIONS/NETWORK', 'LOCATIONS/NETWORK', 'SITES/RESEAU', 'SCR0000000004');
  seed3('S04.FLT.MERCH', 'MERCHANDISE', 'MERCHANDISE', 'ASSORTIMENT', 'SCR0000000004');
  seed3('S04.FLT.FLOW', 'FLOW', 'FLOW', 'FLUX', 'SCR0000000004');
  seed3('S04.FLT.REF', 'REFRESH', 'REFRESH', 'ACTUALISER', 'SCR0000000004');

  -- S09 Mass journal
  seed3('S09.LBL.MASFIL', 'Mass filename:', 'Mass filename:', 'Fichier de masse :', 'SCR0000000009');
  seed3('S09.PLH.MASFIL', 'Key part of the file name', 'Key part of the file name', 'Partie du nom de fichier', 'SCR0000000009');
  seed3('S09.LBL.SCOPE', 'Scope :', 'Scope :', 'Perimetre :', 'SCR0000000009');
  seed3('S09.LBL.LOADED', 'Loaded :', 'Loaded :', 'Charge :', 'SCR0000000009');
  seed3('S09.LBL.EXEC', 'Execution :', 'Execution :', 'Execution :', 'SCR0000000009');
  seed3('S09.DLG.EXECPL', 'Execution plan', 'Execution plan', 'Plan d execution', 'SCR0000000009');
  seed3('S09.BTN.BACK', 'Back', 'Back', 'Retour', 'SCR0000000009');
  seed3('S09.BTN.RUN', 'Execute', 'Execute', 'Executer', 'SCR0000000009');
  seed3('S09.BTN.UPD', 'Update', 'Update', 'Mettre a jour', 'SCR0000000009');
  seed3('S09.BTN.CANCEL', 'Cancel', 'Cancel', 'Annuler', 'SCR0000000009');
  seed3('S09.BTN.EDIT', 'EDIT', 'EDIT', 'MODIFIER', 'SCR0000000009');

  -- S11 Supplier dashboard — KPI cards + table
  seed3('S11.CRD.INFO', 'Information', 'Information', 'Information', 'SCR0000000011');
  seed3('S11.CRD.ASSORT', 'Assortment', 'Assortment', 'Assortiment', 'SCR0000000011');
  seed3('S11.LBL.NBREF', 'Nb. references:', 'Nb. references:', 'Nb. references :', 'SCR0000000011');
  seed3('S11.LBL.NBDEAL', 'Nb. deals:', 'Nb. deals:', 'Nb. offres :', 'SCR0000000011');
  seed3('S11.LBL.ACTDEAL', 'List of active deals', 'List of active deals', 'Liste des offres actives', 'SCR0000000011');
  seed3('S11.CRD.CTDSVC', 'CTD Service rate', 'CTD Service rate', 'Taux de service CTD', 'SCR0000000011');
  seed3('S11.LBL.LASTSVC', 'was last receipt service rate', 'was last receipt service rate', 'taux service derniere reception', 'SCR0000000011');
  seed3('S11.CRD.CTDFIL', 'CTD Fill rate', 'CTD Fill rate', 'Taux de service CTD livraison', 'SCR0000000011');
  seed3('S11.LBL.LASTFIL', 'was last fill rate', 'was last fill rate', 'taux de service dernier envoi', 'SCR0000000011');
  seed3('S11.CRD.MARGIN', 'Margin', 'Margin', 'Marge', 'SCR0000000011');
  seed3('S11.BTN.CLOSE', 'Close', 'Close', 'Fermer', 'SCR0000000011');
  seed3('S11.CHT.SVCHIS', 'Service rate history', 'Service rate history', 'Historique taux de service', 'SCR0000000011');
  seed3('S11.CHT.FILHIS', 'Fill rate history', 'Fill rate history', 'Historique taux de service livraison', 'SCR0000000011');

  seed3('S11.COL.WHS', 'Whs code', 'Whs code', 'Code entrepot', 'SCR0000000011');
  seed3('S11.COL.SUP', 'Supplier', 'Supplier', 'Fournisseur', 'SCR0000000011');
  seed3('S11.COL.ITEM', 'Item', 'Item', 'Article', 'SCR0000000011');
  seed3('S11.COL.PROMO', 'Promotion', 'Promotion', 'Promotion', 'SCR0000000011');
  seed3('S11.COL.INV', 'Inventory (Cases)', 'Inventory (Cases)', 'Stock (colis)', 'SCR0000000011');
  seed3('S11.COL.SVC', 'Service rate', 'Service rate', 'Taux de service', 'SCR0000000011');
  seed3('S11.COL.FILL', 'Fill rate', 'Fill rate', 'Taux de service livraison', 'SCR0000000011');
  seed3('S11.COL.REPL', 'Replenishment', 'Replenishment', 'Reapprovisionnement', 'SCR0000000011');
  seed3('S11.COL.STRDLV', 'Store delivery', 'Store delivery', 'Livraison magasin', 'SCR0000000011');
  seed3('S11.COL.ORD', 'Orderable', 'Orderable', 'Commandable', 'SCR0000000011');
  seed3('S11.COL.COST', 'Cost/Retail', 'Cost/Retail', 'Cout/Vente', 'SCR0000000011');

  seed3('S11.C.WHS', 'Whs code', 'Whs code', 'Code entrepot', 'SCR0000000011');
  seed3('S11.C.VCODE', 'Supplier code', 'Supplier code', 'Code fournisseur', 'SCR0000000011');
  seed3('S11.C.VDESC', 'Supplier desc.', 'Supplier desc.', 'Desc. fournisseur', 'SCR0000000011');
  seed3('S11.C.ICODE', 'Item code', 'Item code', 'Code article', 'SCR0000000011');
  seed3('S11.C.IDESC', 'Item desc.', 'Item desc.', 'Desc. article', 'SCR0000000011');
  seed3('S11.C.CLASS', 'Class', 'Class', 'Classe', 'SCR0000000011');
  seed3('S11.C.PROMO', 'Promo', 'Promo', 'Promo', 'SCR0000000011');
  seed3('S11.C.INV', 'Inventory', 'Inventory', 'Stock', 'SCR0000000011');
  seed3('S11.C.LASTRCV', 'Last reception', 'Last reception', 'Derniere reception', 'SCR0000000011');
  seed3('S11.C.YEARLY', 'Yearly', 'Yearly', 'Annuel', 'SCR0000000011');
  seed3('S11.C.LASTSHP', 'Last shipment', 'Last shipment', 'Dernier envoi', 'SCR0000000011');
  seed3('S11.C.ORDON', 'Order on', 'Order on', 'Commande le', 'SCR0000000011');
  seed3('S11.C.PLANDLV', 'Planned delivery', 'Planned delivery', 'Livraison prevue', 'SCR0000000011');
  seed3('S11.C.RCVON', 'Received on', 'Received on', 'Recu le', 'SCR0000000011');
  seed3('S11.C.QTYCSE', 'Qty (cases)', 'Qty (cases)', 'Qte (colis)', 'SCR0000000011');
  seed3('S11.C.STRDMD', 'Last store demand', 'Last store demand', 'Derniere demande magasin', 'SCR0000000011');
  seed3('S11.C.ORDABL', 'Orderable', 'Orderable', 'Commandable', 'SCR0000000011');
  seed3('S11.C.COSTU', 'Cost unit', 'Cost unit', 'Cout unitaire', 'SCR0000000011');
  seed3('S11.C.UNITDL', 'Unit deal', 'Unit deal', 'Offre unitaire', 'SCR0000000011');
  seed3('S11.C.NETCST', 'Net unit cost', 'Net unit cost', 'Cout unitaire net', 'SCR0000000011');
  seed3('S11.C.RETAIL', 'Retail', 'Retail', 'Vente', 'SCR0000000011');
  seed3('S11.C.MARGIN', 'Margin', 'Margin', 'Marge', 'SCR0000000011');
  seed3('S11.PH.WHS', 'Filter on warehouse', 'Filter on warehouse', 'Filtrer sur entrepot', 'SCR0000000011');
  seed3('S11.PH.VEND', 'Search by vendor', 'Search by vendor', 'Rechercher par fournisseur', 'SCR0000000011');
  seed3('S11.PH.ITEM', 'Item code', 'Item code', 'Code article', 'SCR0000000011');
  seed3('S11.PH.IDESC', 'Search by description', 'Search by description', 'Rechercher par description', 'SCR0000000011');

  -- S17 Smart UBD
  seed3('S17.LBL.UBDEND', 'Nb days UBD ending :', 'Nb days UBD ending :', 'Nb jours fin DLC :', 'SCR0000000017');
  seed3('S17.LBL.UBDCLS', 'Nb days Closed UBD:', 'Nb days Closed UBD:', 'Nb jours DLC fermes :', 'SCR0000000017');
  seed3('S17.BTN.RECAP', 'Recap', 'Recap', 'Recap', 'SCR0000000017');

  -- S10 Fill rate
  seed3('S10.BTN.RECAP', 'Recap', 'Recap', 'Recap', 'SCR0000000010');

  -- S41 Report filter
  seed3('S41.LBL.RPTID', 'Report id :', 'Report id :', 'Id rapport :', 'SCR0000000041');
  seed3('S41.PLH.RPTID', 'Enter a report code', 'Enter a report code', 'Saisir un code rapport', 'SCR0000000041');

  -- RT.AODASH (Automatic Order Dashboard body)
  seed3('RT.AOD.LBL.DATE', 'Dashboard date :', 'Dashboard date :', 'Date tableau de bord :', 'ROUTE');
  seed3('RT.AOD.BTN.OPEN', 'OPEN', 'OPEN', 'OUVRIR', 'ROUTE');

  -- S35 warehouse search extras
  seed3('S35.LBL.SSCC', 'SSCC # :', 'SSCC # :', 'SSCC n. :', 'SCR0000000035');
  seed3('S35.PLH.SSCC', 'Enter a SSCC code', 'Enter a SSCC code', 'Saisir un code SSCC', 'SCR0000000035');
  seed3('S35.LBL.ITEM', 'Item # :', 'Item # :', 'Article n. :', 'SCR0000000035');

  -- S39
  seed3('S39.LBL.SSCC', 'SSCC # :', 'SSCC # :', 'SSCC n. :', 'SCR0000000039');
  seed3('S39.PLH.SSCC', 'Enter a SSCC code', 'Enter a SSCC code', 'Saisir un code SSCC', 'SCR0000000039');
  seed3('S39.LBL.ITEM', 'Item # :', 'Item # :', 'Article n. :', 'SCR0000000039');
  seed3('S39.LBL.LBLDT', 'Label date :', 'Label date :', 'Date etiquette :', 'SCR0000000039');

  -- S42
  seed3('S42.LBL.ITEM', 'Item :', 'Item :', 'Article :', 'SCR0000000042');
  seed3('S42.LBL.TRACE', 'Trace :', 'Trace :', 'Trace :', 'SCR0000000042');

  -- S31 space planning
  seed3('S31.LBL.DEPT', 'Department :', 'Department :', 'Departement :', 'SCR0000000031');
  seed3('S31.LBL.SDEPT', 'Sub-dept :', 'Sub-dept :', 'Sous-dept :', 'SCR0000000031');
  seed3('S31.LBL.CAT', 'Category :', 'Category :', 'Categorie :', 'SCR0000000031');

  -- S34
  seed3('S34.LBL.DEPT', 'Department :', 'Department :', 'Departement :', 'SCR0000000034');
  seed3('S34.LBL.SDEPT', 'Sub-dept :', 'Sub-dept :', 'Sous-dept :', 'SCR0000000034');
  seed3('S34.LBL.CAT', 'Category :', 'Category :', 'Categorie :', 'SCR0000000034');
  seed3('S34.LBL.ACTFUT', 'Active/Future :', 'Active/Future :', 'Actif/Futur :', 'SCR0000000034');

  -- S05 finance
  seed3('S05.LBL.SOLDX', 'Sold last X days :', 'Sold last X days :', 'Vendu X derniers jours :', 'SCR0000000005');

  -- S40
  seed3('S40.LBL.INVNUM', 'Invoice # :', 'Invoice # :', 'Facture n. :', 'SCR0000000040');

  -- S36
  seed3('S36.LBL.ITEMNO', 'Item # :', 'Item # :', 'Article n. :', 'SCR0000000036');

  -- S32 MDM PPG
  seed3('S32.LBL.PPG', 'PPG :', 'PPG :', 'PPG :', 'SCR0000000032');

  -- S27 ASN
  seed3('S27.LBL.STORE', 'Store :', 'Store :', 'Magasin :', 'SCR0000000027');

  -- S24 orders
  seed3('S24.LBL.STATUS', 'Status :', 'Status :', 'Statut :', 'SCR0000000024');

  -- S03 holiday schedule
  seed3('S03.BTN.TMPL', 'TEMPLATE', 'TEMPLATE', 'MODELE', 'SCR0000000003');
  seed3('S03.BTN.LOAD', 'LOAD', 'LOAD', 'CHARGER', 'SCR0000000003');
  seed3('S03.BTN.REMOVE', 'REMOVE', 'REMOVE', 'RETIRER', 'SCR0000000003');
  seed3('S03.BTN.ADD', 'ADD', 'ADD', 'AJOUTER', 'SCR0000000003');
  seed3('S03.BTN.REVSCH', 'Review schedules', 'Review schedules', 'Revoir calendriers', 'SCR0000000003');
  seed3('S03.BTN.VALID', 'Validate', 'Validate', 'Valider', 'SCR0000000003');
  seed3('S03.LBL.HOLDAY', 'Holiday day :', 'Holiday day :', 'Jour ferie :', 'SCR0000000003');

END;
/

COMMIT;

SET DEFINE ON;
