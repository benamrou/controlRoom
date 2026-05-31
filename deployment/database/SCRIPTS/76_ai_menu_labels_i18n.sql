-- Phase 5b — French + UK menu labels for Supply Chain AI sidebar (ICR_MENU_LABEL)
-- Deploy after 68. Re-login or use header language switch after menu load.

SET DEFINE OFF;

DECLARE
  PROCEDURE upsert_menu(p_code VARCHAR2, p_lang VARCHAR2, p_text VARCHAR2) IS
  BEGIN
    MERGE INTO ICR_MENU_LABEL t
    USING (SELECT p_code MENU_CODE, p_lang MLLANGUE, p_text LABEL_TEXT FROM DUAL) s
    ON (t.MENU_CODE = s.MENU_CODE AND t.MLLANGUE = s.MLLANGUE)
    WHEN MATCHED THEN UPDATE SET t.LABEL_TEXT = s.LABEL_TEXT, t.MLDMAJ = SYSDATE, t.MLUTIL = 'admin'
    WHEN NOT MATCHED THEN INSERT (MENU_CODE, MLLANGUE, LABEL_TEXT, MLDCRE, MLDMAJ, MLUTIL)
    VALUES (s.MENU_CODE, s.MLLANGUE, s.LABEL_TEXT, SYSDATE, SYSDATE, 'admin');
  END;
BEGIN
  -- en_GB
  upsert_menu('GRP_AI', 'en_GB', 'Supply Chain AI');
  upsert_menu('LBL_AI_PLATFORM', 'en_GB', 'Platform setup');
  upsert_menu('ROUTE_AI_RETAILER', 'en_GB', 'Retailer and GOLD setup');
  upsert_menu('ROUTE_AI_SCHEMA', 'en_GB', 'Schema discovery');
  upsert_menu('ROUTE_AI_CONTEXT', 'en_GB', 'Context learning');
  upsert_menu('LBL_AI_STUDIO', 'en_GB', 'Skill studio');
  upsert_menu('ROUTE_AI_LIB', 'en_GB', 'Skill library');
  upsert_menu('ROUTE_AI_BUILDER', 'en_GB', 'Skill builder');
  upsert_menu('ROUTE_AI_PENDING', 'en_GB', 'Pending phrasings');
  upsert_menu('ROUTE_AI_PLAY', 'en_GB', 'Phrasing playground');
  upsert_menu('LBL_AI_OPS', 'en_GB', 'Operations');
  upsert_menu('ROUTE_AI_HEALTH', 'en_GB', 'Data health');
  upsert_menu('ROUTE_AI_HEALTHCFG', 'en_GB', 'Health configuration');
  upsert_menu('LBL_AI_INQ', 'en_GB', 'Inquiry');
  upsert_menu('ROUTE_AI_ASST', 'en_GB', 'Supply Chain Assistant');

  -- fr_FR
  upsert_menu('GRP_AI', 'fr_FR', 'IA Supply Chain');
  upsert_menu('LBL_AI_PLATFORM', 'fr_FR', 'Configuration plateforme');
  upsert_menu('ROUTE_AI_RETAILER', 'fr_FR', 'Configuration detaillant GOLD');
  upsert_menu('ROUTE_AI_SCHEMA', 'fr_FR', 'Decouverte du schema');
  upsert_menu('ROUTE_AI_CONTEXT', 'fr_FR', 'Apprentissage du contexte');
  upsert_menu('LBL_AI_STUDIO', 'fr_FR', 'Studio de competences');
  upsert_menu('ROUTE_AI_LIB', 'fr_FR', 'Bibliotheque de modeles');
  upsert_menu('ROUTE_AI_BUILDER', 'fr_FR', 'Constructeur de skill');
  upsert_menu('ROUTE_AI_PENDING', 'fr_FR', 'Formulations en attente');
  upsert_menu('ROUTE_AI_PLAY', 'fr_FR', 'Bac a formulations');
  upsert_menu('LBL_AI_OPS', 'fr_FR', 'Operations');
  upsert_menu('ROUTE_AI_HEALTH', 'fr_FR', 'Sante des donnees');
  upsert_menu('ROUTE_AI_HEALTHCFG', 'fr_FR', 'Configuration sante');
  upsert_menu('LBL_AI_INQ', 'fr_FR', 'Requetes');
  upsert_menu('ROUTE_AI_ASST', 'fr_FR', 'Assistant supply chain');
END;
/

COMMIT;

SET DEFINE ON;
