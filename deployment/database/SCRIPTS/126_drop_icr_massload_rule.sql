-- =============================================================================
-- 126_drop_icr_massload_rule.sql
-- Retire ICR_MASSLOAD_RULE — tool 24 defaults now come from Excel
-- (COMPENSATION / PHYSICAL / REASON on ICR_TEMPLATE023).
--
-- Run AFTER deploying updated LOADRETURN_* package body (111 / 122 / 125).
-- Safe to re-run (guards on object existence).
-- =============================================================================

SET DEFINE OFF;

PROMPT Dropping ICR_MASSLOAD_RULE (and related LIBQUERY / menu if present)...

-- 1) Table
BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE ICR_MASSLOAD_RULE CASCADE CONSTRAINTS';
  DBMS_OUTPUT.PUT_LINE('Dropped ICR_MASSLOAD_RULE');
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -942 THEN
      DBMS_OUTPUT.PUT_LINE('ICR_MASSLOAD_RULE already absent');
    ELSE
      RAISE;
    END IF;
END;
/

-- 2) LIBQUERY mass-load settings (MAS0000100–MAS0000104)
DELETE FROM LIBQUERY WHERE QUERYNUM IN (
  'MAS0000100', 'MAS0000101', 'MAS0000102', 'MAS0000103', 'MAS0000104'
);
COMMIT;

-- 3) Menu — Mass-load settings under Mass-change box
--    Delete children first: ICR_MENU_LABEL FK → ICR_MENU_ENTRY (ORA-02292 otherwise)
DELETE FROM ICR_PROFILE_MENU WHERE MENU_CODE = 'ROUTE_SET_MASSLOAD';
DELETE FROM ICR_MENU_ACCESS_RULE WHERE MENU_CODE = 'ROUTE_SET_MASSLOAD';
DELETE FROM ICR_MENU_LABEL WHERE MENU_CODE = 'ROUTE_SET_MASSLOAD';
DELETE FROM ICR_MENU_ENTRY WHERE MENU_CODE = 'ROUTE_SET_MASSLOAD';
COMMIT;

PROMPT Done. Angular /settingmassload can be left unused or removed from routing later.
PROMPT Re-login required for menu change to appear.

SET DEFINE ON;
/