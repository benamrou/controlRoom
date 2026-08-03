-- S19 ALERTBUG — Bug / patch history tab labels (Alerts management SCR0000000019)
-- Deploy after 114_alertbug_table_libquery.sql.
-- TLAID max 15 chars; TLADESC max 100; no ampersand in literals.

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
  seed3('S19.TAB.BUG', 'Bug / patch history', 'Bug / patch history', 'Bugs / patches', 'SCR0000000019');
  seed3('S19.BUG.EMPTY', 'No patch history recorded for this alert yet.',
        'No patch history recorded for this alert yet.',
        'Aucun historique de correctif pour cette alerte.', 'SCR0000000019');
  seed3('S19.BUG.ADD', 'Add patch entry', 'Add patch entry', 'Ajouter correctif', 'SCR0000000019');
  seed3('S19.BUG.EDIT', 'Edit patch entry', 'Edit patch entry', 'Modifier correctif', 'SCR0000000019');
  seed3('S19.BUG.PDAY', 'Patch day', 'Patch day', 'Jour du correctif', 'SCR0000000019');
  seed3('S19.BUG.RDAY', 'Release date', 'Release date', 'Date de release', 'SCR0000000019');
  seed3('S19.BUG.ISSUE', 'Issue', 'Issue', 'Probleme', 'SCR0000000019');
  seed3('S19.BUG.RES', 'Resolution', 'Resolution', 'Resolution', 'SCR0000000019');
  seed3('S19.BUG.NOTES', 'Notes', 'Notes', 'Notes', 'SCR0000000019');
  seed3('S19.BUG.OK', 'Patch entry saved.', 'Patch entry saved.', 'Correctif enregistre.', 'SCR0000000019');
  seed3('S19.BUG.DEL', 'Patch entry removed.', 'Patch entry removed.', 'Correctif supprime.', 'SCR0000000019');
  seed3('S19.BUG.CFM', 'Remove this patch history entry?',
        'Remove this patch history entry?',
        'Supprimer cette entree d historique ?', 'SCR0000000019');
  seed3('S19.BUG.HINT', 'Track bug fixes and releases. Issue, resolution and notes are rich HTML (same as Specification).',
        'Track bug fixes and releases. Issue, resolution and notes are rich HTML (same as Specification).',
        'Suivre correctifs et releases. Probleme, resolution et notes en HTML riche (comme Specification).', 'SCR0000000019');
  seed3('S19.BUG.VIEW', 'Patch entry', 'Patch entry', 'Correctif', 'SCR0000000019');
  seed3('S19.SPC.PDF', 'Export to PDF', 'Export to PDF', 'Exporter en PDF', 'SCR0000000019');
END;
/

COMMIT;

SET DEFINE ON;
SET SCAN ON;
