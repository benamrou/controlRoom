-- =============================================================================
-- AI Skill Library — fix inverted question mark (¿) in AI_SKILL.skill_name
-- =============================================================================
-- Symptom: Skill Library shows names like
--   "Retail price not loading ¿ root cause"
-- instead of
--   "Retail price not loading - root cause"
--
-- Cause: em dash (—) in seed INSERTs was stored with the wrong character set and
-- appears as ¿ (U+00BF) in the UI.
--
-- Safe to re-run: only rows where skill_name contains ¿ are updated.
-- =============================================================================

SET DEFINE OFF;
SET SCAN OFF;

PROMPT === Preview: AI_SKILL rows with inverted question mark in skill_name ===

SELECT skill_id,
       skill_code,
       skill_name AS skill_name_before,
       description
  FROM AI_SKILL
 WHERE skill_name LIKE '%' || UNISTR('\00BF') || '%'
 ORDER BY skill_code, version;

PROMPT === Update skill_name: replace spaced ¿ then any remaining ¿ with hyphen ===

UPDATE AI_SKILL s
   SET s.skill_name  = REPLACE(
         REPLACE(s.skill_name,
                 ' ' || UNISTR('\00BF') || ' ', ' - '),
         UNISTR('\00BF'), '-'),
       s.updated_at  = SYSTIMESTAMP
 WHERE s.skill_name LIKE '%' || UNISTR('\00BF') || '%';

PROMPT Rows updated:
SELECT SQL%ROWCOUNT AS rows_updated FROM DUAL;

COMMIT;

PROMPT === Verify: should return no rows ===

SELECT skill_id, skill_code, skill_name
  FROM AI_SKILL
 WHERE skill_name LIKE '%' || UNISTR('\00BF') || '%';

SET DEFINE ON;
