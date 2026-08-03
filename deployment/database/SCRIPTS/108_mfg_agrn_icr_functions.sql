-- =============================================================================
-- 108_mfg_agrn_icr_functions.sql
-- Manufacturing AGRN — drop obsolete ICR wrapper (step 1 now runs via GOLD sqlplus).
--
-- Run on ICR app DB after deploying client + server scripts for MFG AGRN.
-- =============================================================================

SET DEFINE OFF;

BEGIN
  EXECUTE IMMEDIATE 'DROP FUNCTION ICR_MFG_PLACE_ORDER';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE != -4043 THEN
      RAISE;
    END IF;
END;
/

SET DEFINE ON;
