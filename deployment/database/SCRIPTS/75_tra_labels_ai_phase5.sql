-- Phase 5 i18n — Supply Chain AI active screens (S01 platform, S14, S20–S25)
-- Deploy after 72. TLAID VARCHAR2(15); TLASCREEN = full SCR id.

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
  seed3('S53.TITLE', 'Retailer and GOLD Setup', 'Retailer and GOLD Setup',
        'Configuration detaillant GOLD', 'SCR0000000053');
  seed3('S54.TITLE', 'Schema Discovery', 'Schema Discovery',
        'Decouverte schema', 'SCR0000000054');
  seed3('S55.TITLE', 'Context Learning', 'Context Learning',
        'Apprentissage contexte', 'SCR0000000055');
  seed3('S56.TITLE', 'Skill Library', 'Skill Library',
        'Bibliotheque skills', 'SCR0000000056');
  seed3('S57.TITLE', 'Skill Builder', 'Skill Builder',
        'Constructeur skill', 'SCR0000000057');
  seed3('S57.TITLE.NEW', 'New template skill', 'New template skill',
        'Nouveau skill modele', 'SCR0000000057');
  seed3('S58.TITLE', 'Pending phrasings', 'Pending phrasings',
        'Formulations en attente', 'SCR0000000058');
  seed3('S59.TITLE', 'Phrasing Playground', 'Phrasing Playground',
        'Bac a formulations', 'SCR0000000059');
  seed3('S60.TITLE', 'Supply Chain Assistant', 'Supply Chain Assistant',
        'Assistant supply chain', 'SCR0000000060');
  seed3('S61.TITLE', 'AI Data Health', 'AI Data Health',
        'Sante des donnees IA', 'SCR0000000061');
  seed3('S62.TITLE', 'Data Health Config', 'Data Health Configuration',
        'Config sante donnees', 'SCR0000000062');
  seed3('S61.BTN.RUN', 'Run now', 'Run now', 'Executer', 'SCR0000000061');
  seed3('S62.BTN.CONFIG', 'Configure checks', 'Configure checks',
        'Configurer controles', 'SCR0000000062');
END;
/

COMMIT;

SET DEFINE ON;
