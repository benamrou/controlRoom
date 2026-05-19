-- ============================================================================
-- 19_engine_vendor_resolve_upgrade.sql
-- ----------------------------------------------------------------------------
-- Upgrades every ENGINE_VENDOR_RESOLVE template already loaded in
-- AI_SKILL_SQL_TEMPLATE so the resolver handles "name + code" inputs such as
--   - "lipari 06966"      (alpha + embedded code)
--   - "06966 lipari"      (embedded code + alpha)
--   - "06966"             (code only)
--   - "lipari"            (alpha only)
--
-- Why: the previous SQL only matched on full :vendor_text against FOUCNUF
-- (exact) or FOULIBL (substring). When the user combined name and code in one
-- string, neither column matched and the resolver returned 0 rows; the engine
-- then ran the executor with an empty :supplier_id (TRIM('')) and produced
-- "No buyable items found".
--
-- The new SQL also:
--   - extracts a 3+ digit run with REGEXP_SUBSTR for an embedded FOUCNUF match
--   - strips non-alpha chars with REGEXP_REPLACE for a clean FOULIBL substring
-- ============================================================================

UPDATE AI_SKILL_SQL_TEMPLATE
SET sql_text = q'~SELECT supplier_id, supplier_name, score
  FROM (
        SELECT f.FOUCNUF AS supplier_id,
               f.FOULIBL AS supplier_name,
               CASE
                 WHEN UPPER(f.FOUCNUF) = UPPER(TRIM(:vendor_text)) THEN 100
                 WHEN REGEXP_SUBSTR(:vendor_text, '\d{3,}') IS NOT NULL
                      AND UPPER(f.FOUCNUF) = UPPER(REGEXP_SUBSTR(:vendor_text, '\d{3,}'))
                      THEN 98
                 WHEN UPPER(f.FOULIBL) = UPPER(TRIM(:vendor_text)) THEN 95
                 WHEN UPPER(f.FOULIBL) LIKE UPPER(TRIM(:vendor_text)) || '%' THEN 85
                 WHEN LENGTH(TRIM(REGEXP_REPLACE(:vendor_text, '[^A-Za-z ]+', ' '))) >= 3
                      AND UPPER(f.FOULIBL) LIKE '%' || UPPER(TRIM(REGEXP_REPLACE(:vendor_text, '[^A-Za-z ]+', ' '))) || '%'
                      THEN 80
                 WHEN UPPER(f.FOULIBL) LIKE '%' || UPPER(TRIM(:vendor_text)) || '%' THEN 70
                 ELSE 0
               END AS score
          FROM FOUDGENE@HEINENS_CEN_PROD f
         WHERE UPPER(f.FOUCNUF) = UPPER(TRIM(:vendor_text))
            OR UPPER(f.FOULIBL) LIKE '%' || UPPER(TRIM(:vendor_text)) || '%'
            OR (REGEXP_SUBSTR(:vendor_text, '\d{3,}') IS NOT NULL
                AND UPPER(f.FOUCNUF) = UPPER(REGEXP_SUBSTR(:vendor_text, '\d{3,}')))
            OR (LENGTH(TRIM(REGEXP_REPLACE(:vendor_text, '[^A-Za-z ]+', ' '))) >= 3
                AND UPPER(f.FOULIBL) LIKE '%' || UPPER(TRIM(REGEXP_REPLACE(:vendor_text, '[^A-Za-z ]+', ' '))) || '%')
       )
 WHERE score > 0
 ORDER BY score DESC, supplier_name
 FETCH FIRST 10 ROWS ONLY~',
    purpose = 'Router step: map free-text vendor name/code to FOUDGENE rows. Handles "lipari 06966" / "06966 lipari" / pure code / pure name. Not used for /engine/execute listing.',
    parameters_json = q'~[{"name":"vendor_text","type":"STRING","required":true}]~'
WHERE UPPER(template_code) = 'ENGINE_VENDOR_RESOLVE';

COMMIT;

-- Sanity check
SELECT skill_id, template_code, DBMS_LOB.GETLENGTH(sql_text) AS sql_len
  FROM AI_SKILL_SQL_TEMPLATE
 WHERE UPPER(template_code) = 'ENGINE_VENDOR_RESOLVE';
