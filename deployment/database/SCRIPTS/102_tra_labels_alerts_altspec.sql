-- S19 ALTSPEC — Specification tab labels (Alerts management SCR0000000019)
-- Deploy after 101_alerts_altspec.sql. TLAID max 15 chars; TLADESC max 100; no ampersand in literals.
-- Reload labels in app: re-login or header language switch (LAB0000002).

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

  PROCEDURE cmn(p_id VARCHAR2, p_us VARCHAR2, p_gb VARCHAR2, p_fr VARCHAR2) IS
  BEGIN
    seed3(p_id, p_us, p_gb, p_fr, 'COMMON');
  END;
BEGIN
  -- Specification tab (S19)
  seed3('S19.TAB.SPEC', 'Specification', 'Specification', 'Specification', 'SCR0000000019');
  seed3('S19.SPC.EMPTY', 'No specification has been written for this alert yet.',
        'No specification has been written for this alert yet.',
        'Aucune specification redigee pour cette alerte.', 'SCR0000000019');
  seed3('S19.SPC.WRITE', 'Write specification', 'Write specification', 'Rediger specification', 'SCR0000000019');
  seed3('S19.SPC.RICHHT', 'Type or paste from Word, Outlook, or Excel — formatting converts to HTML.',
        'Type or paste from Word, Outlook, or Excel — formatting converts to HTML.',
        'Saisir ou coller depuis Word, Outlook ou Excel — conversion HTML auto.', 'SCR0000000019');
  seed3('S19.SPC.HIDHT', 'Hide HTML', 'Hide HTML', 'Masquer HTML', 'SCR0000000019');
  seed3('S19.SPC.SHWHT', 'Show HTML source', 'Show HTML source', 'Voir source HTML', 'SCR0000000019');
  seed3('S19.SPC.PDF', 'Export to PDF', 'Export to PDF', 'Exporter en PDF', 'SCR0000000019');

  -- Toolbar (shared)
  cmn('CMN.DONE', 'Done', 'Done', 'Termine');
END;
/

COMMIT;

SET DEFINE ON;
