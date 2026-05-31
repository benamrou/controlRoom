-- Phase 1 i18n — TRA_LABELS baseline (General Settings + common keys) us_US
-- Deploy after 67. Idempotent MERGE per (TLAID, TLALANGUE).
-- TLAID is VARCHAR2(15) on Heinens — use short keys S64/S65/… (not SCR0000000064.TITLE).

SET DEFINE OFF;

DECLARE
  PROCEDURE upsert_label(p_id VARCHAR2, p_desc VARCHAR2, p_screen VARCHAR2, p_menu NUMBER DEFAULT 0) IS
  BEGIN
    MERGE INTO TRA_LABELS t
    USING (SELECT p_id TLAID, 'us_US' TLALANGUE FROM DUAL) s
    ON (t.TLAID = s.TLAID AND t.TLALANGUE = s.TLALANGUE)
    WHEN MATCHED THEN UPDATE SET t.TLADESC = p_desc, t.TLASCREEN = p_screen, t.TLAMENU = p_menu, t.TLADMAJ = SYSDATE
    WHEN NOT MATCHED THEN INSERT (TLAID, TLADESC, TLAMENU, TLASCREEN, TLALANGUE, TLADCRE, TLADMAJ, TLAUTIL)
    VALUES (p_id, p_desc, p_menu, p_screen, 'us_US', SYSDATE, SYSDATE, 'admin');
  END;
BEGIN
  upsert_label('CMN.REFRESH', 'Refresh', 'COMMON');
  upsert_label('CMN.SAVE', 'Save', 'COMMON');
  upsert_label('CMN.CANCEL', 'Cancel', 'COMMON');
  upsert_label('CMN.ADD', 'Add', 'COMMON');
  upsert_label('CMN.DELETE', 'Delete', 'COMMON');
  upsert_label('CMN.SEARCH', 'Type text to filter...', 'COMMON');
  upsert_label('CMN.ACTIONS', 'Actions', 'COMMON');

  upsert_label('S64.TITLE', 'Retailer and Access', 'SCR0000000064');
  upsert_label('S65.TITLE', 'Users and Profiles', 'SCR0000000065');
  upsert_label('S65.TAB.USERS', 'Users', 'SCR0000000065');
  upsert_label('S65.TAB.ENV', 'Environment access', 'SCR0000000065');
  upsert_label('S65.TAB.WDG', 'Dashboard widgets', 'SCR0000000065');
  upsert_label('S66.TITLE', 'Menu and access', 'SCR0000000066');
  upsert_label('S66.TAB.CAT', 'Menu catalog', 'SCR0000000066');
  upsert_label('S66.TAB.RULES', 'Flag rules', 'SCR0000000066');
  upsert_label('S66.TAB.PROF', 'Profiles', 'SCR0000000066');
  upsert_label('S66.TAB.PMNU', 'Profile menus', 'SCR0000000066');
  upsert_label('S66.TAB.TRN', 'Translations', 'SCR0000000066');
  upsert_label('S67.TITLE', 'Query Library', 'SCR0000000067');
  upsert_label('S68.TITLE', 'Dictionary', 'SCR0000000068');
  upsert_label('S68.TAB.COV', 'Translation coverage', 'SCR0000000068');
  upsert_label('S69.TITLE', 'Widget Library', 'SCR0000000069');
  upsert_label('S69.TAB.WDG', 'Widgets', 'SCR0000000069');
  upsert_label('S69.TAB.RSLT', 'Result columns', 'SCR0000000069');
  upsert_label('S69.TAB.LINK', 'Links', 'SCR0000000069');
  upsert_label('S70.TITLE', 'App logs', 'SCR0000000070');
END;
/

COMMIT;

SET DEFINE ON;
