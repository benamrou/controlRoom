-- Per-screen mass-update wizard body (Sxx.MU.*, S13.CM.*, S13.SKU.*, S16.ATTR.*, S16.RTL.*)
-- Deploy after 90. TLAID max 15; TLADESC max 100.
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
  seed3('S08.MU.CA', 'COLUMN A: item code', 'COLUMN A: item code', 'COLONNE A : item code', 'SCR0000000008');
  seed3('S08.MU.CB', 'COLUMN B: New merchandise hierarchy node code', 'COLUMN B: New merchandise hierarchy node code', 'COLONNE B : New merchandise hierarchy node code', 'SCR0000000008');
  seed3('S08.MU.CNM', 'Column name A must be ITEM_CODE, column name B must be NEW_HIERARCHY.', 'Column name A must be ITEM_CODE, column name B must be NEW_HIERARCHY.', 'Column name A must be ITEM_CODE, column name B must be NEW_HIERARCHY.', 'SCR0000000008');
  seed3('S08.MU.SEL', 'Select your Item-Merchandise Hierarchy file change.', 'Select your Item-Merchandise Hierarchy file change.', 'Choisir votre fichier Item-Merchandise Hierarchy file change.', 'SCR0000000008');
  seed3('S08.MU.STP0', 'Select your Item-Merchandise Hierarchy file change.', 'Select your Item-Merchandise Hierarchy file change.', 'Choisir votre fichier Item-Merchandise Hierarchy file change.', 'SCR0000000008');
  seed3('S08.MU.WHEN', 'When do you want to execute the item hierarchy changes?', 'When do you want to execute the item hierarchy changes?', 'Quand souhaitez-vous executer the item hierarchy changes?', 'SCR0000000008');
  seed3('S08.MU.XLS', 'The XLS(x) Excel file should contain two columns:', 'The XLS(x) Excel file should contain two columns:', 'Le fichier Excel XLS(x) doit contenir two columns:', 'SCR0000000008');
  seed3('S12.MU.CA', 'COLUMN A: item code', 'COLUMN A: item code', 'COLONNE A : item code', 'SCR0000000012');
  seed3('S12.MU.CB', 'COLUMN B: sale variant code', 'COLUMN B: sale variant code', 'COLONNE B : sale variant code', 'SCR0000000012');
  seed3('S12.MU.CC', 'COLUMN C: Attribute class', 'COLUMN C: Attribute class', 'COLONNE C : Attribute class', 'SCR0000000012');
  seed3('S12.MU.CD', 'COLUMN D: Attribute code', 'COLUMN D: Attribute code', 'COLONNE D : Attribute code', 'SCR0000000012');
  seed3('S12.MU.CE', 'COLUMN E: Attribute value', 'COLUMN E: Attribute value', 'COLONNE E : Attribute value', 'SCR0000000012');
  seed3('S12.MU.CNM', 'Respect column header names from the template file (see columns above).', 'Respect column header names from the template file (see columns above).', 'Respecter les entetes du modele (voir colonnes ci-dessus).', 'SCR0000000012');
  seed3('S12.MU.SEL', 'Select your Item-SV attribute file change.', 'Select your Item-SV attribute file change.', 'Choisir votre fichier Item-SV attribute file change.', 'SCR0000000012');
  seed3('S12.MU.STP0', 'Select your Item-SV attribute file change.', 'Select your Item-SV attribute file change.', 'Choisir votre fichier Item-SV attribute file change.', 'SCR0000000012');
  seed3('S12.MU.WHEN', 'When do you want to execute the item/SV attribute changes?', 'When do you want to execute the item/SV attribute changes?', 'Quand souhaitez-vous executer the item/SV attribute changes?', 'SCR0000000012');
  seed3('S12.MU.XLS', 'The XLS(x) Excel file should contain those five columns headers:', 'The XLS(x) Excel file should contain those five columns headers:', 'Le fichier Excel XLS(x) doit contenir those five columns headers:', 'SCR0000000012');
  seed3('S13.CM.CA', 'COLUMN A: item code', 'COLUMN A: item code', 'COLONNE A : item code', 'SCR0000000013');
  seed3('S13.CM.CB', 'COLUMN B: New category manager name (for information, not used in the update process)', 'COLUMN B: New category manager name (for information, not used in the update process)', 'COLONNE B : New category manager name (for information, not used in the update process)', 'SCR0000000013');
  seed3('S13.CM.CC', 'COLUMN C: New category manager code (parameter table 1032)', 'COLUMN C: New category manager code (parameter table 1032)', 'COLONNE C : New category manager code (parameter table 1032)', 'SCR0000000013');
  seed3('S13.CM.CNM', 'Column name A must be ITEM_CODE, column name B must be CATEGORY_MANAGER_DESC, column name C must be ', 'Column name A must be ITEM_CODE, column name B must be CATEGORY_MANAGER_DESC, column name C must be ', 'Column name A must be ITEM_CODE, column name B must be CATEGORY_MANAGER_DESC, column name C must be ', 'SCR0000000013');
  seed3('S13.CM.SEL', 'Select your Item-Category Manager file change.', 'Select your Item-Category Manager file change.', 'Choisir votre fichier Item-Category Manager file change.', 'SCR0000000013');
  seed3('S13.CM.STP0', 'Select your Item-Category Manager file change.', 'Select your Item-Category Manager file change.', 'Choisir votre fichier Item-Category Manager file change.', 'SCR0000000013');
  seed3('S13.CM.TITLE', 'Item Category Manager change', 'Item Category Manager change', 'Item Category Manager change', 'SCR0000000013');
  seed3('S13.CM.WHEN', 'When do you want to execute the Item Category Manager changes?', 'When do you want to execute the Item Category Manager changes?', 'Quand souhaitez-vous executer the Item Category Manager changes?', 'SCR0000000013');
  seed3('S13.CM.XLS', 'The XLS(x) Excel file should contain three columns:', 'The XLS(x) Excel file should contain three columns:', 'Le fichier Excel XLS(x) doit contenir three columns:', 'SCR0000000013');
  seed3('S13.SKU.CA', 'COLUMN A: UPC', 'COLUMN A: UPC', 'COLONNE A : UPC', 'SCR0000000013');
  seed3('S13.SKU.CB', 'COLUMN B: Weight', 'COLUMN B: Weight', 'COLONNE B : Weight', 'SCR0000000013');
  seed3('S13.SKU.CC', 'COLUMN C: Weight unit (parameter table 806)', 'COLUMN C: Weight unit (parameter table 806)', 'COLONNE C : Weight unit (parameter table 806)', 'SCR0000000013');
  seed3('S13.SKU.CD', 'COLUMN D: Height', 'COLUMN D: Height', 'COLONNE D : Height', 'SCR0000000013');
  seed3('S13.SKU.CE', 'COLUMN E: Width', 'COLUMN E: Width', 'COLONNE E : Width', 'SCR0000000013');
  seed3('S13.SKU.CF', 'COLUMN F: Depth', 'COLUMN F: Depth', 'COLONNE F : Depth', 'SCR0000000013');
  seed3('S13.SKU.CG', 'COLUMN G: Measure unit (parameter table 806)', 'COLUMN G: Measure unit (parameter table 806)', 'COLONNE G : Measure unit (parameter table 806)', 'SCR0000000013');
  seed3('S13.SKU.CNM', 'Column name A must be UPC, column name B must be WEIGHT, column name C must be WEIGHT_UNIT, column D', 'Column name A must be UPC, column name B must be WEIGHT, column name C must be WEIGHT_UNIT, column D', 'Column name A must be UPC, column name B must be WEIGHT, column name C must be WEIGHT_UNIT, column D', 'SCR0000000013');
  seed3('S13.SKU.SEL', 'Select your Item-SKU Dimension file change.', 'Select your Item-SKU Dimension file change.', 'Choisir votre fichier Item-SKU Dimension file change.', 'SCR0000000013');
  seed3('S13.SKU.STP0', 'Select your Item-SKU Dimension file change.', 'Select your Item-SKU Dimension file change.', 'Choisir votre fichier Item-SKU Dimension file change.', 'SCR0000000013');
  seed3('S13.SKU.TITLE', 'Item SKU Dimension change', 'Item SKU Dimension change', 'Item SKU Dimension change', 'SCR0000000013');
  seed3('S13.SKU.WHEN', 'When do you want to execute the Item SKU dimension changes?', 'When do you want to execute the Item SKU dimension changes?', 'Quand souhaitez-vous executer the Item SKU dimension changes?', 'SCR0000000013');
  seed3('S13.SKU.XLS', 'The XLS(x) Excel file should contain seven columns:', 'The XLS(x) Excel file should contain seven columns:', 'Le fichier Excel XLS(x) doit contenir seven columns:', 'SCR0000000013');
  seed3('S15.MU.CA', 'COLUMN A: item code', 'COLUMN A: item code', 'COLONNE A : item code', 'SCR0000000015');
  seed3('S15.MU.CB', 'COLUMN B: sale variant code', 'COLUMN B: sale variant code', 'COLONNE B : sale variant code', 'SCR0000000015');
  seed3('S15.MU.CC', 'COLUMN C: Info. code', 'COLUMN C: Info. code', 'COLONNE C : Info. code', 'SCR0000000015');
  seed3('S15.MU.CD', 'COLUMN D: Info. value', 'COLUMN D: Info. value', 'COLONNE D : Info. value', 'SCR0000000015');
  seed3('S15.MU.CNM', 'Respect column header names from the template file (see columns above).', 'Respect column header names from the template file (see columns above).', 'Respecter les entetes du modele (voir colonnes ci-dessus).', 'SCR0000000015');
  seed3('S15.MU.SEL', 'Select your Item-SV information file change.', 'Select your Item-SV information file change.', 'Choisir votre fichier Item-SV information file change.', 'SCR0000000015');
  seed3('S15.MU.STP0', 'Select your Item-SV information file change.', 'Select your Item-SV information file change.', 'Choisir votre fichier Item-SV information file change.', 'SCR0000000015');
  seed3('S15.MU.WHEN', 'When do you want to execute the item/SV info. changes?', 'When do you want to execute the item/SV info. changes?', 'Quand souhaitez-vous executer the item/SV info. changes?', 'SCR0000000015');
  seed3('S15.MU.XLS', 'The XLS(x) Excel file should contain those four columns
                headers:', 'The XLS(x) Excel file should contain those four columns
                headers:', 'Le fichier Excel XLS(x) doit contenir those four columns
                headers:', 'SCR0000000015');
  seed3('S16.ATTR.CA', 'COLUMN A: item code', 'COLUMN A: item code', 'COLONNE A : item code', 'SCR0000000016');
  seed3('S16.ATTR.CB', 'COLUMN B: Attribute class', 'COLUMN B: Attribute class', 'COLONNE B : Attribute class', 'SCR0000000016');
  seed3('S16.ATTR.CC', 'COLUMN C: Attribute code', 'COLUMN C: Attribute code', 'COLONNE C : Attribute code', 'SCR0000000016');
  seed3('S16.ATTR.CD', 'COLUMN D: Attribute value', 'COLUMN D: Attribute value', 'COLONNE D : Attribute value', 'SCR0000000016');
  seed3('S16.ATTR.CNM', 'Respect column header names from the template file (see columns above).', 'Respect column header names from the template file (see columns above).', 'Respecter les entetes du modele (voir colonnes ci-dessus).', 'SCR0000000016');
  seed3('S16.ATTR.SEL', 'Select your Item attribute file change.', 'Select your Item attribute file change.', 'Choisir votre fichier Item attribute file change.', 'SCR0000000016');
  seed3('S16.ATTR.STP0', 'Select your Item attribute file change.', 'Select your Item attribute file change.', 'Choisir votre fichier Item attribute file change.', 'SCR0000000016');
  seed3('S16.ATTR.WHEN', 'When do you want to execute the item attribute changes?', 'When do you want to execute the item attribute changes?', 'Quand souhaitez-vous executer the item attribute changes?', 'SCR0000000016');
  seed3('S16.ATTR.XLS', 'The XLS(x) Excel file should contain those four columns headers:', 'The XLS(x) Excel file should contain those four columns headers:', 'Le fichier Excel XLS(x) doit contenir those four columns headers:', 'SCR0000000016');
  seed3('S16.RTL.CA', 'COLUMN A: Price list', 'COLUMN A: Price list', 'COLONNE A : Price list', 'SCR0000000016');
  seed3('S16.RTL.CB', 'COLUMN B: PPG', 'COLUMN B: PPG', 'COLONNE B : PPG', 'SCR0000000016');
  seed3('S16.RTL.CC', 'COLUMN C: Item code', 'COLUMN C: Item code', 'COLONNE C : Item code', 'SCR0000000016');
  seed3('S16.RTL.CD', 'COLUMN D: SV code', 'COLUMN D: SV code', 'COLONNE D : SV code', 'SCR0000000016');
  seed3('S16.RTL.CE', 'COLUMN E: Retail', 'COLUMN E: Retail', 'COLONNE E : Retail', 'SCR0000000016');
  seed3('S16.RTL.CF', 'COLUMN F: Multiple', 'COLUMN F: Multiple', 'COLONNE F : Multiple', 'SCR0000000016');
  seed3('S16.RTL.CG', 'COLUMN G: Start date', 'COLUMN G: Start date', 'COLONNE G : Start date', 'SCR0000000016');
  seed3('S16.RTL.CH', 'COLUMN H: End date', 'COLUMN H: End date', 'COLONNE H : End date', 'SCR0000000016');
  seed3('S16.RTL.CNM', 'Respect column header names from the template file (see columns above).', 'Respect column header names from the template file (see columns above).', 'Respecter les entetes du modele (voir colonnes ci-dessus).', 'SCR0000000016');
  seed3('S16.RTL.SEL', 'Select your Item retail file change.', 'Select your Item retail file change.', 'Choisir votre fichier Item retail file change.', 'SCR0000000016');
  seed3('S16.RTL.STP0', 'Select your Item retail file change.', 'Select your Item retail file change.', 'Choisir votre fichier Item retail file change.', 'SCR0000000016');
  seed3('S16.RTL.WHEN', 'When do you want to execute the item retail changes?', 'When do you want to execute the item retail changes?', 'Quand souhaitez-vous executer the item retail changes?', 'SCR0000000016');
  seed3('S16.RTL.XLS', 'The XLS(x) Excel file should contain those eight columns headers:', 'The XLS(x) Excel file should contain those eight columns headers:', 'Le fichier Excel XLS(x) doit contenir those eight columns headers:', 'SCR0000000016');
  seed3('S25.MU.CA', 'COLUMN A: item code', 'COLUMN A: item code', 'COLONNE A : item code', 'SCR0000000025');
  seed3('S25.MU.CB', 'COLUMN B: LV code', 'COLUMN B: LV code', 'COLONNE B : LV code', 'SCR0000000025');
  seed3('S25.MU.CC', 'COLUMN C: Item description', 'COLUMN C: Item description', 'COLONNE C : Item description', 'SCR0000000025');
  seed3('S25.MU.CNM', 'Column name A must be ITEM_CODE, column name B must be LV_CODE, column C must be ITEM_DESC.', 'Column name A must be ITEM_CODE, column name B must be LV_CODE, column C must be ITEM_DESC.', 'Column name A must be ITEM_CODE, column name B must be LV_CODE, column C must be ITEM_DESC.', 'SCR0000000025');
  seed3('S25.MU.SEL', 'Select your Warehouse item description file change.', 'Select your Warehouse item description file change.', 'Choisir votre fichier Warehouse item description file change.', 'SCR0000000025');
  seed3('S25.MU.STP0', 'Select your Warehouse item description file change.', 'Select your Warehouse item description file change.', 'Choisir votre fichier Warehouse item description file change.', 'SCR0000000025');
  seed3('S25.MU.WHEN', 'When do you want to execute the item description changes?', 'When do you want to execute the item description changes?', 'Quand souhaitez-vous executer the item description changes?', 'SCR0000000025');
  seed3('S25.MU.XLS', 'The XLS(x) Excel file should contain three columns:', 'The XLS(x) Excel file should contain three columns:', 'Le fichier Excel XLS(x) doit contenir three columns:', 'SCR0000000025');
  seed3('S26.MU.CA', 'COLUMN A: item code', 'COLUMN A: item code', 'COLONNE A : item code', 'SCR0000000026');
  seed3('S26.MU.CB', 'COLUMN B: LV code', 'COLUMN B: LV code', 'COLONNE B : LV code', 'SCR0000000026');
  seed3('S26.MU.CC', 'COLUMN C: Item size (optional)', 'COLUMN C: Item size (optional)', 'COLONNE C : Item size (optional)', 'SCR0000000026');
  seed3('S26.MU.CD', 'COLUMN D: Variable weight (no decimal)', 'COLUMN D: Variable weight (no decimal)', 'COLONNE D : Variable weight (no decimal)', 'SCR0000000026');
  seed3('S26.MU.CE', 'COLUMN E: Purchase price', 'COLUMN E: Purchase price', 'COLONNE E : Purchase price', 'SCR0000000026');
  seed3('S26.MU.CNM', 'Column name A must be ITEM_CODE, column name B must be LV_CODE, column C must be ITEM_SIZE, column D', 'Column name A must be ITEM_CODE, column name B must be LV_CODE, column C must be ITEM_SIZE, column D', 'Column name A must be ITEM_CODE, column name B must be LV_CODE, column C must be ITEM_SIZE, column D', 'SCR0000000026');
  seed3('S26.MU.SEL', 'Select your item variable weight file change.', 'Select your item variable weight file change.', 'Choisir votre fichier item variable weight file change.', 'SCR0000000026');
  seed3('S26.MU.STP0', 'Select your item variable weight file change.', 'Select your item variable weight file change.', 'Choisir votre fichier item variable weight file change.', 'SCR0000000026');
  seed3('S26.MU.WHEN', 'When do you want to execute the item description changes?', 'When do you want to execute the item description changes?', 'Quand souhaitez-vous executer the item description changes?', 'SCR0000000026');
  seed3('S26.MU.XLS', 'The XLS(x) Excel file should contain five columns:', 'The XLS(x) Excel file should contain five columns:', 'Le fichier Excel XLS(x) doit contenir five columns:', 'SCR0000000026');
  seed3('S28.MU.CA', 'COLUMN A: item code', 'COLUMN A: item code', 'COLONNE A : item code', 'SCR0000000028');
  seed3('S28.MU.CB', 'COLUMN B: LV code', 'COLUMN B: LV code', 'COLONNE B : LV code', 'SCR0000000028');
  seed3('S28.MU.CC', 'COLUMN C: Unit level', 'COLUMN C: Unit level', 'COLONNE C : Unit level', 'SCR0000000028');
  seed3('S28.MU.CD', 'COLUMN D: Logistic type code', 'COLUMN D: Logistic type code', 'COLONNE D : Logistic type code', 'SCR0000000028');
  seed3('S28.MU.CE', 'COLUMN E: Logistic code', 'COLUMN E: Logistic code', 'COLONNE E : Logistic code', 'SCR0000000028');
  seed3('S28.MU.CNM', 'Respect column header names from the template file (see columns above).', 'Respect column header names from the template file (see columns above).', 'Respecter les entetes du modele (voir colonnes ci-dessus).', 'SCR0000000028');
  seed3('S28.MU.SEL', 'Select your Item logistic code file change.', 'Select your Item logistic code file change.', 'Choisir votre fichier Item logistic code file change.', 'SCR0000000028');
  seed3('S28.MU.STP0', 'Select your Item logistic code file change.', 'Select your Item logistic code file change.', 'Choisir votre fichier Item logistic code file change.', 'SCR0000000028');
  seed3('S28.MU.WHEN', 'When do you want to execute the item logisitc code changes?', 'When do you want to execute the item logisitc code changes?', 'Quand souhaitez-vous executer the item logisitc code changes?', 'SCR0000000028');
  seed3('S28.MU.XLS', 'The XLS(x) Excel file should contain those five columns headers:', 'The XLS(x) Excel file should contain those five columns headers:', 'Le fichier Excel XLS(x) doit contenir those five columns headers:', 'SCR0000000028');
  seed3('S30.MU.CA', 'COLUMN A: item code', 'COLUMN A: item code', 'COLONNE A : item code', 'SCR0000000030');
  seed3('S30.MU.CB', 'COLUMN B: SV code', 'COLUMN B: SV code', 'COLONNE B : SV code', 'SCR0000000030');
  seed3('S30.MU.CC', 'COLUMN C: Image description', 'COLUMN C: Image description', 'COLONNE C : Image description', 'SCR0000000030');
  seed3('S30.MU.CD', 'COLUMN D: Image path', 'COLUMN D: Image path', 'COLONNE D : Image path', 'SCR0000000030');
  seed3('S30.MU.CNM', 'Respect column header names from the template file (see columns above).', 'Respect column header names from the template file (see columns above).', 'Respecter les entetes du modele (voir colonnes ci-dessus).', 'SCR0000000030');
  seed3('S30.MU.SEL', 'Select your Item images file change.', 'Select your Item images file change.', 'Choisir votre fichier Item images file change.', 'SCR0000000030');
  seed3('S30.MU.STP0', 'Select your Item images file change.', 'Select your Item images file change.', 'Choisir votre fichier Item images file change.', 'SCR0000000030');
  seed3('S30.MU.WHEN', 'When do you want to execute the item images changes?', 'When do you want to execute the item images changes?', 'Quand souhaitez-vous executer the item images changes?', 'SCR0000000030');
  seed3('S30.MU.XLS', 'The XLS(x) Excel file should contain those four columns headers:', 'The XLS(x) Excel file should contain those four columns headers:', 'Le fichier Excel XLS(x) doit contenir those four columns headers:', 'SCR0000000030');
  seed3('S38.MU.CA', 'COLUMN A: Supplier code', 'COLUMN A: Supplier code', 'COLONNE A : Supplier code', 'SCR0000000038');
  seed3('S38.MU.CB', 'COLUMN B: Address change number', 'COLUMN B: Address change number', 'COLONNE B : Address change number', 'SCR0000000038');
  seed3('S38.MU.CC', 'COLUMN C: New order from address code', 'COLUMN C: New order from address code', 'COLONNE C : New order from address code', 'SCR0000000038');
  seed3('S38.MU.CNM', 'Column name A must be SUPPLIER_CODE, column name B must be ADDRESS_CHAIN, column name C must be ORDE', 'Column name A must be SUPPLIER_CODE, column name B must be ADDRESS_CHAIN, column name C must be ORDE', 'Column name A must be SUPPLIER_CODE, column name B must be ADDRESS_CHAIN, column name C must be ORDE', 'SCR0000000038');
  seed3('S38.MU.SEL', 'Select your Supplier address file change.', 'Select your Supplier address file change.', 'Choisir votre fichier Supplier address file change.', 'SCR0000000038');
  seed3('S38.MU.STP0', 'Select your Supplier address file change.', 'Select your Supplier address file change.', 'Choisir votre fichier Supplier address file change.', 'SCR0000000038');
  seed3('S38.MU.WHEN', 'When do you want to execute the Supplier address changes?', 'When do you want to execute the Supplier address changes?', 'Quand souhaitez-vous executer the Supplier address changes?', 'SCR0000000038');
  seed3('S38.MU.XLS', 'The XLS(x) Excel file should contain three columns:', 'The XLS(x) Excel file should contain three columns:', 'Le fichier Excel XLS(x) doit contenir three columns:', 'SCR0000000038');
  seed3('S43.MU.CA', 'COLUMN A: item list', 'COLUMN A: item list', 'COLONNE A : item list', 'SCR0000000043');
  seed3('S43.MU.CB', 'COLUMN B: New item list description', 'COLUMN B: New item list description', 'COLONNE B : New item list description', 'SCR0000000043');
  seed3('S43.MU.CNM', 'Column name A must be ITEM_LIST, column name B must be NEW_DESCRIPTION.', 'Column name A must be ITEM_LIST, column name B must be NEW_DESCRIPTION.', 'Column name A must be ITEM_LIST, column name B must be NEW_DESCRIPTION.', 'SCR0000000043');
  seed3('S43.MU.SEL', 'Select your Item List description file change.', 'Select your Item List description file change.', 'Choisir votre fichier Item List description file change.', 'SCR0000000043');
  seed3('S43.MU.STP0', 'Select your Item List description file change.', 'Select your Item List description file change.', 'Choisir votre fichier Item List description file change.', 'SCR0000000043');
  seed3('S43.MU.WHEN', 'When do you want to execute the item list description changes?', 'When do you want to execute the item list description changes?', 'Quand souhaitez-vous executer the item list description changes?', 'SCR0000000043');
  seed3('S43.MU.XLS', 'The XLS(x) Excel file should contain two columns:', 'The XLS(x) Excel file should contain two columns:', 'Le fichier Excel XLS(x) doit contenir two columns:', 'SCR0000000043');
  seed3('S44.MU.CA', 'COLUMN A: Site code', 'COLUMN A: Site code', 'COLONNE A : Site code', 'SCR0000000044');
  seed3('S44.MU.CB', 'COLUMN B: Order date', 'COLUMN B: Order date', 'COLONNE B : Order date', 'SCR0000000044');
  seed3('S44.MU.CC', 'COLUMN C: Delivery date', 'COLUMN C: Delivery date', 'COLONNE C : Delivery date', 'SCR0000000044');
  seed3('S44.MU.CD', 'COLUMN D: Order status', 'COLUMN D: Order status', 'COLONNE D : Order status', 'SCR0000000044');
  seed3('S44.MU.CE', 'COLUMN E: Item code', 'COLUMN E: Item code', 'COLONNE E : Item code', 'SCR0000000044');
  seed3('S44.MU.CF', 'COLUMN F: LV code', 'COLUMN F: LV code', 'COLONNE F : LV code', 'SCR0000000044');
  seed3('S44.MU.CG', 'COLUMN G: Qty', 'COLUMN G: Qty', 'COLONNE G : Qty', 'SCR0000000044');
  seed3('S44.MU.CNM', 'Respect column header names from the template file (see columns above).', 'Respect column header names from the template file (see columns above).', 'Respecter les entetes du modele (voir colonnes ci-dessus).', 'SCR0000000044');
  seed3('S44.MU.SEL', 'Select your Purchase order file.', 'Select your Purchase order file.', 'Choisir votre fichier Purchase order file.', 'SCR0000000044');
  seed3('S44.MU.STP0', 'Select your Purchase order file.', 'Select your Purchase order file.', 'Choisir votre fichier Purchase order file.', 'SCR0000000044');
  seed3('S44.MU.WHEN', 'When do you want to execute the purchase order loaded?', 'When do you want to execute the purchase order loaded?', 'Quand souhaitez-vous executer the purchase order loaded?', 'SCR0000000044');
  seed3('S44.MU.XLS', 'The XLS(x) Excel file should contain those seven columns headers:', 'The XLS(x) Excel file should contain those seven columns headers:', 'Le fichier Excel XLS(x) doit contenir those seven columns headers:', 'SCR0000000044');
  seed3('S45.MU.CA', 'COLUMN A: item code', 'COLUMN A: item code', 'COLONNE A : item code', 'SCR0000000045');
  seed3('S45.MU.CB', 'COLUMN B: Attribute class', 'COLUMN B: Attribute class', 'COLONNE B : Attribute class', 'SCR0000000045');
  seed3('S45.MU.CC', 'COLUMN C: Attribute code', 'COLUMN C: Attribute code', 'COLONNE C : Attribute code', 'SCR0000000045');
  seed3('S45.MU.CD', 'COLUMN D: Attribute value', 'COLUMN D: Attribute value', 'COLONNE D : Attribute value', 'SCR0000000045');
  seed3('S45.MU.CE', 'COLUMN E: Period start (MM/DD/RR)', 'COLUMN E: Period start (MM/DD/RR)', 'COLONNE E : Period start (MM/DD/RR)', 'SCR0000000045');
  seed3('S45.MU.CF', 'COLUMN F: Period end (MM/DD/RR)', 'COLUMN F: Period end (MM/DD/RR)', 'COLONNE F : Period end (MM/DD/RR)', 'SCR0000000045');
  seed3('S45.MU.CNM', 'Respect column header names from the template file (see columns above).', 'Respect column header names from the template file (see columns above).', 'Respecter les entetes du modele (voir colonnes ci-dessus).', 'SCR0000000045');
  seed3('S45.MU.SEL', 'Select your Item attribute file change.', 'Select your Item attribute file change.', 'Choisir votre fichier Item attribute file change.', 'SCR0000000045');
  seed3('S45.MU.STP0', 'Select your Item attribute file change.', 'Select your Item attribute file change.', 'Choisir votre fichier Item attribute file change.', 'SCR0000000045');
  seed3('S45.MU.WHEN', 'When do you want to execute the item attribute changes?', 'When do you want to execute the item attribute changes?', 'Quand souhaitez-vous executer the item attribute changes?', 'SCR0000000045');
  seed3('S45.MU.XLS', 'The XLS(x) Excel file should contain those six columns headers:', 'The XLS(x) Excel file should contain those six columns headers:', 'Le fichier Excel XLS(x) doit contenir those six columns headers:', 'SCR0000000045');
  seed3('S46.MU.CA', 'COLUMN A: item code', 'COLUMN A: item code', 'COLONNE A : item code', 'SCR0000000046');
  seed3('S46.MU.CB', 'COLUMN B: New item description', 'COLUMN B: New item description', 'COLONNE B : New item description', 'SCR0000000046');
  seed3('S46.MU.CC', 'COLUMN C: Sale variant code (SV)', 'COLUMN C: Sale variant code (SV)', 'COLONNE C : Sale variant code (SV)', 'SCR0000000046');
  seed3('S46.MU.CD', 'COLUMN D: New short SV description', 'COLUMN D: New short SV description', 'COLONNE D : New short SV description', 'SCR0000000046');
  seed3('S46.MU.CE', 'COLUMN E: New long SV description', 'COLUMN E: New long SV description', 'COLONNE E : New long SV description', 'SCR0000000046');
  seed3('S46.MU.CF', 'COLUMN F: Logistic variant code (LV)', 'COLUMN F: Logistic variant code (LV)', 'COLONNE F : Logistic variant code (LV)', 'SCR0000000046');
  seed3('S46.MU.CG', 'COLUMN G: New LV description', 'COLUMN G: New LV description', 'COLONNE G : New LV description', 'SCR0000000046');
  seed3('S46.MU.CH', 'COLUMN H: Logistic unit type (LU)', 'COLUMN H: Logistic unit type (LU)', 'COLONNE H : Logistic unit type (LU)', 'SCR0000000046');
  seed3('S46.MU.CI', 'COLUMN I: New LU description', 'COLUMN I: New LU description', 'COLONNE I : New LU description', 'SCR0000000046');
  seed3('S46.MU.CNM', 'Leave the SV code blank to skip updating the sale variant description. The same applies to LV and LU', 'Leave the SV code blank to skip updating the sale variant description. The same applies to LV and LU', 'Leave the SV code blank to skip updating the sale variant description. The same applies to LV and LU', 'SCR0000000046');
  seed3('S46.MU.SEL', 'Select your Item description file change.', 'Select your Item description file change.', 'Choisir votre fichier Item description file change.', 'SCR0000000046');
  seed3('S46.MU.STP0', 'Select your Item description file change.', 'Select your Item description file change.', 'Choisir votre fichier Item description file change.', 'SCR0000000046');
  seed3('S46.MU.WHEN', 'When do you want to execute the item description changes?', 'When do you want to execute the item description changes?', 'Quand souhaitez-vous executer the item description changes?', 'SCR0000000046');
  seed3('S46.MU.XLS', 'The XLS(x) Excel file should contain nine columns:', 'The XLS(x) Excel file should contain nine columns:', 'Le fichier Excel XLS(x) doit contenir nine columns:', 'SCR0000000046');
  seed3('S47.MU.CA', 'COLUMN A: UPC', 'COLUMN A: UPC', 'COLONNE A : UPC', 'SCR0000000047');
  seed3('S47.MU.CB', 'COLUMN B: Store', 'COLUMN B: Store', 'COLONNE B : Store', 'SCR0000000047');
  seed3('S47.MU.CC', 'COLUMN C: Schematic', 'COLUMN C: Schematic', 'COLONNE C : Schematic', 'SCR0000000047');
  seed3('S47.MU.CD', 'COLUMN D: Effective date', 'COLUMN D: Effective date', 'COLONNE D : Effective date', 'SCR0000000047');
  seed3('S47.MU.CE', 'COLUMN E: Bay number', 'COLUMN E: Bay number', 'COLONNE E : Bay number', 'SCR0000000047');
  seed3('S47.MU.CF', 'COLUMN F: Shelf number', 'COLUMN F: Shelf number', 'COLONNE F : Shelf number', 'SCR0000000047');
  seed3('S47.MU.CG', 'COLUMN G: Location number', 'COLUMN G: Location number', 'COLONNE G : Location number', 'SCR0000000047');
  seed3('S47.MU.CH', 'COLUMN H: Capacity', 'COLUMN H: Capacity', 'COLONNE H : Capacity', 'SCR0000000047');
  seed3('S47.MU.CI', 'COLUMN I: Facing', 'COLUMN I: Facing', 'COLONNE I : Facing', 'SCR0000000047');
  seed3('S47.MU.CNM', 'Respect column header names from the template file (see columns above).', 'Respect column header names from the template file (see columns above).', 'Respecter les entetes du modele (voir colonnes ci-dessus).', 'SCR0000000047');
  seed3('S47.MU.SEL', 'Select your Item address file change.', 'Select your Item address file change.', 'Choisir votre fichier Item address file change.', 'SCR0000000047');
  seed3('S47.MU.STP0', 'Select your Item address file change.', 'Select your Item address file change.', 'Choisir votre fichier Item address file change.', 'SCR0000000047');
  seed3('S47.MU.WHEN', 'When do you want to execute the item address changes?', 'When do you want to execute the item address changes?', 'Quand souhaitez-vous executer the item address changes?', 'SCR0000000047');
  seed3('S47.MU.XLS', 'The XLS(x) Excel file should contain those eight columns headers:', 'The XLS(x) Excel file should contain those eight columns headers:', 'Le fichier Excel XLS(x) doit contenir those eight columns headers:', 'SCR0000000047');
  seed3('S49.MU.CA', 'COLUMN A: Site code', 'COLUMN A: Site code', 'COLONNE A : Site code', 'SCR0000000049');
  seed3('S49.MU.CB', 'COLUMN B: Order date', 'COLUMN B: Order date', 'COLONNE B : Order date', 'SCR0000000049');
  seed3('S49.MU.CC', 'COLUMN C: Delivery date', 'COLUMN C: Delivery date', 'COLONNE C : Delivery date', 'SCR0000000049');
  seed3('S49.MU.CD', 'COLUMN D: Order mode', 'COLUMN D: Order mode', 'COLONNE D : Order mode', 'SCR0000000049');
  seed3('S49.MU.CE', 'COLUMN E: Urgency', 'COLUMN E: Urgency', 'COLONNE E : Urgency', 'SCR0000000049');
  seed3('S49.MU.CF', 'COLUMN F: Order status', 'COLUMN F: Order status', 'COLONNE F : Order status', 'SCR0000000049');
  seed3('S49.MU.CG', 'COLUMN G: Supplier code', 'COLUMN G: Supplier code', 'COLONNE G : Supplier code', 'SCR0000000049');
  seed3('S49.MU.CH', 'COLUMN H: Item code', 'COLUMN H: Item code', 'COLONNE H : Item code', 'SCR0000000049');
  seed3('S49.MU.CI', 'COLUMN I: LV code', 'COLUMN I: LV code', 'COLONNE I : LV code', 'SCR0000000049');
  seed3('S49.MU.CJ', 'COLUMN J: Qty', 'COLUMN J: Qty', 'COLONNE J : Qty', 'SCR0000000049');
  seed3('S49.MU.CNM', 'Respect column header names from the template file (see columns above).', 'Respect column header names from the template file (see columns above).', 'Respecter les entetes du modele (voir colonnes ci-dessus).', 'SCR0000000049');
  seed3('S49.MU.SEL', 'Select your Push/Breakdown order file.', 'Select your Push/Breakdown order file.', 'Choisir votre fichier Push/Breakdown order file.', 'SCR0000000049');
  seed3('S49.MU.STP0', 'Select your Push/Breakdown order file.', 'Select your Push/Breakdown order file.', 'Choisir votre fichier Push/Breakdown order file.', 'SCR0000000049');
  seed3('S49.MU.WHEN', 'When do you want to execute the purchase order loaded?', 'When do you want to execute the purchase order loaded?', 'Quand souhaitez-vous executer the purchase order loaded?', 'SCR0000000049');
  seed3('S49.MU.XLS', 'The XLS(x) Excel file should contain those ten columns headers:', 'The XLS(x) Excel file should contain those ten columns headers:', 'Le fichier Excel XLS(x) doit contenir those ten columns headers:', 'SCR0000000049');
  seed3('S50.MU.CA', 'COLUMN A: Site code', 'COLUMN A: Site code', 'COLONNE A : Site code', 'SCR0000000050');
  seed3('S50.MU.CB', 'COLUMN B: item code', 'COLUMN B: item code', 'COLONNE B : item code', 'SCR0000000050');
  seed3('S50.MU.CC', 'COLUMN C: LV code', 'COLUMN C: LV code', 'COLONNE C : LV code', 'SCR0000000050');
  seed3('S50.MU.CD', 'COLUMN D: Quantity', 'COLUMN D: Quantity', 'COLONNE D : Quantity', 'SCR0000000050');
  seed3('S50.MU.CE', 'COLUMN E: Case cost', 'COLUMN E: Case cost', 'COLONNE E : Case cost', 'SCR0000000050');
  seed3('S50.MU.CNM', 'Respect column header names from the template file (see columns above).', 'Respect column header names from the template file (see columns above).', 'Respecter les entetes du modele (voir colonnes ci-dessus).', 'SCR0000000050');
  seed3('S50.MU.SEL', 'Select your Stock layer file change.', 'Select your Stock layer file change.', 'Choisir votre fichier Stock layer file change.', 'SCR0000000050');
  seed3('S50.MU.STP0', 'Select your Stock layer file change.', 'Select your Stock layer file change.', 'Choisir votre fichier Stock layer file change.', 'SCR0000000050');
  seed3('S50.MU.WHEN', 'When do you want to execute the Stock layer changes?', 'When do you want to execute the Stock layer changes?', 'Quand souhaitez-vous executer the Stock layer changes?', 'SCR0000000050');
  seed3('S50.MU.XLS', 'The XLS(x) Excel file should contain those five columns headers:', 'The XLS(x) Excel file should contain those five columns headers:', 'Le fichier Excel XLS(x) doit contenir those five columns headers:', 'SCR0000000050');
  seed3('S51.MU.CA', 'COLUMN A: UPC', 'COLUMN A: UPC', 'COLONNE A : UPC', 'SCR0000000051');
  seed3('S51.MU.CNM', 'Respect column header names from the template file (see columns above).', 'Respect column header names from the template file (see columns above).', 'Respecter les entetes du modele (voir colonnes ci-dessus).', 'SCR0000000051');
  seed3('S51.MU.SEL', 'Select your Item end barcode file change.', 'Select your Item end barcode file change.', 'Choisir votre fichier Item end barcode file change.', 'SCR0000000051');
  seed3('S51.MU.STP0', 'Select your Item end barcode file change.', 'Select your Item end barcode file change.', 'Choisir votre fichier Item end barcode file change.', 'SCR0000000051');
  seed3('S51.MU.WHEN', 'When do you want to execute the Item end barcode changes?', 'When do you want to execute the Item end barcode changes?', 'Quand souhaitez-vous executer the Item end barcode changes?', 'SCR0000000051');
  seed3('S51.MU.XLS', 'The XLS(x) Excel file should contain this one column header:', 'The XLS(x) Excel file should contain this one column header:', 'Le fichier Excel XLS(x) doit contenir this one column header:', 'SCR0000000051');
END;
/
COMMIT;
SET DEFINE ON;
