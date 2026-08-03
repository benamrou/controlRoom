-- S83 Manufacturing AGRN — labels (SCR0000000083)
-- Deploy after 109_tra_labels_tladesc_clob.sql and 106_menu_mfg_agrn.sql.
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
  seed3('S83.TITLE', 'Manufacturing AGRN', 'Manufacturing AGRN', 'AGRN fabrication', 'SCR0000000083');
  seed3('S83.SUBTTL', 'Create a placeholder AGRN when Just Foods production data is not yet in GOLD.',
        'Create a placeholder AGRN when Just Foods production data is not yet in GOLD.',
        'Creer un AGRN provisoire quand les donnees Just Foods ne sont pas encore dans GOLD.', 'SCR0000000083');
  seed3('S83.WARN',
        'Use this functionality when Just Food production order has not been generated automatically for Manufacturing warehouse. This process will create the Manufacturing warehouse AGRN with 1 case by item placeholder, in order to allow the produced items to be received.',
        'Use this functionality when Just Food production order has not been generated automatically for Manufacturing warehouse. This process will create the Manufacturing warehouse AGRN with 1 case by item placeholder, in order to allow the produced items to be received.',
        'Utiliser cette fonctionnalite lorsque la commande de production Just Food n''a pas ete generee automatiquement pour l''entrepot Manufacturing. Ce processus cree l''AGRN de l''entrepot Manufacturing avec un placeholder d''une caisse par article, afin de permettre la reception des articles produits.',
        'SCR0000000083');
  seed3('S83.LBL.DATE', 'Integration date', 'Integration date', 'Date integration', 'SCR0000000083');
  seed3('S83.LBL.WHS', 'Manufacturing warehouse', 'Manufacturing warehouse', 'Entrepot fabrication', 'SCR0000000083');
  seed3('S83.BTN.RUN', 'Generate Manufacturing', 'Generate Manufacturing', 'Generer fabrication', 'SCR0000000083');
  seed3('S83.LBL.RESULT', 'Generated production orders', 'Generated production orders', 'Ordres de production generes', 'SCR0000000083');
  seed3('S83.LBL.XORD', 'Existing manufacturing orders (today)', 'Existing manufacturing orders (today)',
        'Commandes fabrication existantes (aujourd''hui)', 'SCR0000000083');
  seed3('S83.MSG.XFND', 'A Manufacturing AGRN already exists for today — see order details below.',
        'A Manufacturing AGRN already exists for today — see order details below.',
        'Un AGRN fabrication existe deja pour aujourd''hui — voir les details ci-dessous.', 'SCR0000000083');
  seed3('S83.MSG.LOAD', 'Checking for existing manufacturing orders…', 'Checking for existing manufacturing orders…',
        'Recherche des commandes fabrication existantes…', 'SCR0000000083');
  seed3('S83.MSG.EMPTY', 'Click Generate Manufacturing to create placeholder orders and view results here.',
        'Click Generate Manufacturing to create placeholder orders and view results here.',
        'Cliquer Generer fabrication pour creer les commandes et afficher les resultats.', 'SCR0000000083');
  seed3('S83.MSG.RUN', 'Running manufacturing AGRN sequence…', 'Running manufacturing AGRN sequence…', 'Sequence AGRN en cours…', 'SCR0000000083');
  seed3('S83.MSG.OK', 'Manufacturing AGRN sequence completed.', 'Manufacturing AGRN sequence completed.',
        'Sequence AGRN terminee.', 'SCR0000000083');
  seed3('S83.MSG.ERR', 'Manufacturing AGRN failed.', 'Manufacturing AGRN failed.', 'Echec AGRN fabrication.', 'SCR0000000083');
  seed3('S83.CFM.TTL', 'Confirm AGRN generation', 'Confirm AGRN generation', 'Confirmer generation AGRN', 'SCR0000000083');
  seed3('S83.CFM.MSG', 'Run mfgPlaceOrder on GOLD and integrate JF_ORDERS for today?',
        'Run mfgPlaceOrder on GOLD and integrate JF_ORDERS for today?',
        'Executer mfgPlaceOrder sur GOLD et integrer JF_ORDERS pour aujourd''hui ?', 'SCR0000000083');
  seed3('S83.CFM.XMSG', 'A Manufacturing AGRN already exists for today. Generating again may create duplicate orders. Confirm only if you intend to proceed.',
        'A Manufacturing AGRN already exists for today. Generating again may create duplicate orders. Confirm only if you intend to proceed.',
        'Un AGRN fabrication existe deja pour aujourd''hui. Une nouvelle generation peut creer des doublons. Confirmez seulement si vous devez continuer.', 'SCR0000000083');
  seed3('S83.LBL.UID', 'User id', 'User id', 'Identifiant', 'SCR0000000083');
  seed3('S83.PLH.UID', 'Enter your user id to confirm', 'Enter your user id to confirm',
        'Saisir votre identifiant pour confirmer', 'SCR0000000083');
  seed3('S83.MSG.UHNT', 'Type your login user id to authorize this operation.',
        'Type your login user id to authorize this operation.',
        'Saisissez votre identifiant de connexion pour autoriser cette operation.', 'SCR0000000083');
  seed3('S83.MSG.UINV', 'User id does not match your login.',
        'User id does not match your login.',
        'L''identifiant ne correspond pas a votre connexion.', 'SCR0000000083');
  seed3('S83.BTN.CFM', 'Confirm', 'Confirm', 'Confirmer', 'SCR0000000083');
  seed3('S83.DLG.DONE', 'Generation completed', 'Generation completed', 'Generation terminee', 'SCR0000000083');
  seed3('S83.MSG.DONE', 'Manufacturing purchase order has been generated. Purchase order transfer to GOLD Stock runs every 30 minutes.',
        'Manufacturing purchase order has been generated. Purchase order transfer to GOLD Stock runs every 30 minutes.',
        'La commande d''achat fabrication a ete generee. Le transfert des commandes vers GOLD Stock s''execute toutes les 30 minutes.', 'SCR0000000083');
END;
/

MERGE INTO TRA_TECHOBJ t
USING (
  SELECT 'SCR0000000083' AS TOBID,
         'Warehouse' AS TOBCAT,
         q'[<div><i class="bbs-keywords">What is it : </i>Use when Just Food production order has not been generated automatically for the Manufacturing warehouse. Creates the Manufacturing warehouse AGRN with a 1 case per item placeholder so produced items can be received.</div>]' AS TOBDESC,
         q'[<div><i class="bbs-keywords">When to use : </i>Just Food production data is missing in GOLD and receiving must be enabled before automatic integration runs.</div>]' AS TOBDESC2
    FROM dual
) s ON (t.TOBID = s.TOBID)
WHEN MATCHED THEN UPDATE SET
  TOBCAT = s.TOBCAT, TOBDESC = s.TOBDESC, TOBDESC2 = s.TOBDESC2, TOBDMAJ = SYSDATE, TOBUTIL = 'admin'
WHEN NOT MATCHED THEN INSERT (TOBID, TOBCAT, TOBDESC, TOBDESC2, TOBLANGUE, TOBDCRE, TOBDMAJ, TOBUTIL)
VALUES (s.TOBID, s.TOBCAT, s.TOBDESC, s.TOBDESC2, 'us_US', SYSDATE, SYSDATE, 'admin');

COMMIT;

SET DEFINE ON;
SET SCAN ON;
