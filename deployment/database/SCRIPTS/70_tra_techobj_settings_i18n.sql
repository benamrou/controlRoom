-- Phase 1 i18n — TRA_TECHOBJ en_GB + fr_FR for General Settings screens
-- Deploy after 57_tra_techobj_general_settings.sql and 69_tra_labels_settings_us_us_seed.sql

SET DEFINE OFF;

-- en_GB — British English variants (settings admin)
MERGE INTO TRA_TECHOBJ t USING (SELECT 'SCR0000000064' TOBID, 'en_GB' TOBLANGUE FROM DUAL) s
ON (t.TOBID = s.TOBID AND t.TOBLANGUE = s.TOBLANGUE)
WHEN MATCHED THEN UPDATE SET TOBCAT='Retailer and Access', TOBDESC=q'[<div><i class="bbs-keywords">What is it : </i>Admin setup for <b>corporates</b> and <b>GOLD environments</b> (<code>CORPENV</code>).</div>]', TOBDMAJ=SYSDATE, TOBUTIL='admin'
WHEN NOT MATCHED THEN INSERT (TOBID,TOBCAT,TOBDESC,TOBDESC2,TOBLANGUE,TOBDCRE,TOBDMAJ,TOBUTIL)
VALUES ('SCR0000000064','Retailer and Access',q'[<div><i class="bbs-keywords">What is it : </i>Admin setup for corporates and GOLD environments.</div>]','','en_GB',SYSDATE,SYSDATE,'admin');

MERGE INTO TRA_TECHOBJ t USING (SELECT 'SCR0000000065' TOBID, 'en_GB' TOBLANGUE FROM DUAL) s
ON (t.TOBID = s.TOBID AND t.TOBLANGUE = s.TOBLANGUE)
WHEN MATCHED THEN UPDATE SET TOBCAT='Users and Profiles', TOBDMAJ=SYSDATE, TOBUTIL='admin'
WHEN NOT MATCHED THEN INSERT (TOBID,TOBCAT,TOBDESC,TOBDESC2,TOBLANGUE,TOBDCRE,TOBDMAJ,TOBUTIL)
VALUES ('SCR0000000065','Users and Profiles',q'[<div><i class="bbs-keywords">What is it : </i>ICR login accounts in <code>USERSROOM</code>.</div>]','','en_GB',SYSDATE,SYSDATE,'admin');

MERGE INTO TRA_TECHOBJ t USING (SELECT 'SCR0000000066' TOBID, 'en_GB' TOBLANGUE FROM DUAL) s
ON (t.TOBID = s.TOBID AND t.TOBLANGUE = s.TOBLANGUE)
WHEN MATCHED THEN UPDATE SET TOBCAT='Menu and access', TOBDMAJ=SYSDATE, TOBUTIL='admin'
WHEN NOT MATCHED THEN INSERT (TOBID,TOBCAT,TOBDESC,TOBDESC2,TOBLANGUE,TOBDCRE,TOBDMAJ,TOBUTIL)
VALUES ('SCR0000000066','Menu and access',q'[<div><i class="bbs-keywords">What is it : </i>Data-driven navigation catalog and access rules.</div>]','','en_GB',SYSDATE,SYSDATE,'admin');

MERGE INTO TRA_TECHOBJ t USING (SELECT 'SCR0000000069' TOBID, 'en_GB' TOBLANGUE FROM DUAL) s
ON (t.TOBID = s.TOBID AND t.TOBLANGUE = s.TOBLANGUE)
WHEN MATCHED THEN UPDATE SET TOBCAT='Widget Library', TOBDMAJ=SYSDATE, TOBUTIL='admin'
WHEN NOT MATCHED THEN INSERT (TOBID,TOBCAT,TOBDESC,TOBDESC2,TOBLANGUE,TOBDCRE,TOBDMAJ,TOBUTIL)
VALUES ('SCR0000000069','Widget Library',q'[<div><i class="bbs-keywords">What is it : </i>Dashboard section is your <b>Home</b> tracking process. It simplifies and regroups data visualisation.</div><div><i class="bbs-keywords">Tracking type : </i>Table, Chart, Message and Alert.</div>]','','en_GB',SYSDATE,SYSDATE,'admin');

-- fr_FR — French (settings admin titles / key help)
MERGE INTO TRA_TECHOBJ t USING (SELECT 'SCR0000000064' TOBID, 'fr_FR' TOBLANGUE FROM DUAL) s
ON (t.TOBID = s.TOBID AND t.TOBLANGUE = s.TOBLANGUE)
WHEN MATCHED THEN UPDATE SET TOBCAT='Detail et acces', TOBDMAJ=SYSDATE, TOBUTIL='admin'
WHEN NOT MATCHED THEN INSERT (TOBID,TOBCAT,TOBDESC,TOBDESC2,TOBLANGUE,TOBDCRE,TOBDMAJ,TOBUTIL)
VALUES ('SCR0000000064','Detail et acces',q'[<div><i class="bbs-keywords">Qu''est-ce : </i>Configuration des <b>societes</b> et environnements <b>GOLD</b>.</div>]','','fr_FR',SYSDATE,SYSDATE,'admin');

MERGE INTO TRA_TECHOBJ t USING (SELECT 'SCR0000000065' TOBID, 'fr_FR' TOBLANGUE FROM DUAL) s
ON (t.TOBID = s.TOBID AND t.TOBLANGUE = s.TOBLANGUE)
WHEN MATCHED THEN UPDATE SET TOBCAT='Utilisateurs et profils', TOBDMAJ=SYSDATE, TOBUTIL='admin'
WHEN NOT MATCHED THEN INSERT (TOBID,TOBCAT,TOBDESC,TOBDESC2,TOBLANGUE,TOBDCRE,TOBDMAJ,TOBUTIL)
VALUES ('SCR0000000065','Utilisateurs et profils',q'[<div><i class="bbs-keywords">Qu''est-ce : </i>Comptes utilisateurs <code>USERSROOM</code>.</div>]','','fr_FR',SYSDATE,SYSDATE,'admin');

MERGE INTO TRA_TECHOBJ t USING (SELECT 'SCR0000000066' TOBID, 'fr_FR' TOBLANGUE FROM DUAL) s
ON (t.TOBID = s.TOBID AND t.TOBLANGUE = s.TOBLANGUE)
WHEN MATCHED THEN UPDATE SET TOBCAT='Menu et acces', TOBDMAJ=SYSDATE, TOBUTIL='admin'
WHEN NOT MATCHED THEN INSERT (TOBID,TOBCAT,TOBDESC,TOBDESC2,TOBLANGUE,TOBDCRE,TOBDMAJ,TOBUTIL)
VALUES ('SCR0000000066','Menu et acces',q'[<div><i class="bbs-keywords">Qu''est-ce : </i>Catalogue de navigation et regles d''acces.</div>]','','fr_FR',SYSDATE,SYSDATE,'admin');

MERGE INTO TRA_TECHOBJ t USING (SELECT 'SCR0000000069' TOBID, 'fr_FR' TOBLANGUE FROM DUAL) s
ON (t.TOBID = s.TOBID AND t.TOBLANGUE = s.TOBLANGUE)
WHEN MATCHED THEN UPDATE SET TOBCAT='Bibliotheque de widgets', TOBDMAJ=SYSDATE, TOBUTIL='admin'
WHEN NOT MATCHED THEN INSERT (TOBID,TOBCAT,TOBDESC,TOBDESC2,TOBLANGUE,TOBDCRE,TOBDMAJ,TOBUTIL)
VALUES ('SCR0000000069','Bibliotheque de widgets',q'[<div><i class="bbs-keywords">Qu''est-ce : </i>Le tableau de bord est votre <b>accueil</b> de suivi.</div><div><i class="bbs-keywords">Types : </i>Tableau, Graphique, Message et Alerte.</div>]','','fr_FR',SYSDATE,SYSDATE,'admin');

COMMIT;

SET DEFINE ON;
