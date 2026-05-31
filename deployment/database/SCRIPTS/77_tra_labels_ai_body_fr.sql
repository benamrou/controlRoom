-- Phase 5c — TRA_LABELS body copy for AI screens (fr_FR + en_GB); extends 75
-- Retailer setup banner, stepper, common step titles. Deploy after 75.

SET DEFINE OFF;

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
  seed3('S53.BAN.TTL', 'What is this setup?',
        'What is this setup?',
        'A quoi sert cette configuration ?', 'SCR0000000053');
  seed3('S53.BAN.P1',
        'This screen registers a GOLD ERP environment as a retailer in the Supply Chain AI engine.',
        'This screen registers a GOLD ERP environment as a retailer in the Supply Chain AI engine.',
        'Cet ecran enregistre un environnement GOLD ERP comme detaillant dans le moteur IA Supply Chain.',
        'SCR0000000053');
  seed3('S53.PRQ.TTL', 'Before you begin:',
        'Before you begin:',
        'Avant de commencer :', 'SCR0000000053');
  seed3('S53.STP.0', 'Environment', 'Environment', 'Environnement', 'SCR0000000053');
  seed3('S53.STP.1', 'Retailer identity', 'Retailer identity', 'Identite detaillant', 'SCR0000000053');
  seed3('S53.STP.2', 'Connection test', 'Connection test', 'Test de connexion', 'SCR0000000053');
  seed3('S53.STP.3', 'Confirm and save', 'Confirm and save', 'Confirmer et enregistrer', 'SCR0000000053');
  seed3('S53.ST0.TTL', 'Select GOLD environment',
        'Select GOLD environment',
        'Selectionner l''environnement GOLD', 'SCR0000000053');
  seed3('S53.ST0.CTX',
        'The AI engine connects to GOLD via an Oracle DB link defined in CORPENV.',
        'The AI engine connects to GOLD via an Oracle DB link defined in CORPENV.',
        'Le moteur IA se connecte a GOLD via un lien Oracle DB defini dans CORPENV.',
        'SCR0000000053');
END;
/

COMMIT;

SET DEFINE ON;
