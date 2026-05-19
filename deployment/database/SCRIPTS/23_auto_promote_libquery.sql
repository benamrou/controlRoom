-- ─────────────────────────────────────────────────────────────────────────────
-- Supply Chain AI — Phase 7: Auto-promote on repeat
--   Closes the curation loop. When the same USER_OVERRIDE phrasing is picked
--   by enough distinct analysts inside a lookback window, the queue can
--   auto-promote it into AI_SKILL_VOCABULARY with a conservative boost,
--   without manual review. Pure LIBQUERY — no schema changes.
--
--   AI0000076  GET       eligible auto-promote candidates (preview list)
--   AI0000077  POST DML  MERGE one phrasing into AI_SKILL_VOCABULARY (idempotent)
--   AI0000078  POST DML  bulk-stamp every matching unresolved row
--                        (REASON=USER_OVERRIDE, PROMOTED_AT IS NULL) with
--                        PROMOTED_BY='AUTO_PROMOTE'
--
-- Re-runnable: drops + re-inserts each LIBQUERY entry.
-- ─────────────────────────────────────────────────────────────────────────────

DELETE FROM LIBQUERY WHERE QUERYNUM IN ('AI0000076','AI0000077','AI0000078');

-- ----- AI0000076 — list eligible auto-promote candidates
INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000076',
       'AI — Engine auto-promote eligible',
       'GET phrasings ready to auto-promote. :param1 = retailer_id (or -1). :param2 = min distinct users (default 2). :param3 = min total hits (default 3). :param4 = lookback days (default 90).',
       q'~
SELECT LOWER(TRIM(u.NORMALIZED_TEXT))                           AS PHRASE_NORM,
       u.SECOND_SKILL_CODE                                      AS SKILL_CODE,
       u.RETAILER_ID                                            AS RETAILER_ID,
       MAX(s.SKILL_ID)                                          AS TARGET_SKILL_ID,
       MAX(s.SKILL_NAME)                                        AS TARGET_SKILL_NAME,
       MAX(s.DOMAIN)                                            AS TARGET_DOMAIN,
       COUNT(*)                                                 AS HIT_COUNT,
       COUNT(DISTINCT u.ASKED_BY)                               AS DISTINCT_USERS,
       MIN(u.QUESTION_TEXT)                                     AS SAMPLE_QUESTION,
       TO_CHAR(MIN(u.ASKED_AT), 'YYYY-MM-DD"T"HH24:MI:SS')      AS FIRST_SEEN,
       TO_CHAR(MAX(u.ASKED_AT), 'YYYY-MM-DD"T"HH24:MI:SS')      AS LAST_SEEN
  FROM AI_ENGINE_UNRESOLVED u
  JOIN AI_SKILL s
    ON s.SKILL_CODE  = u.SECOND_SKILL_CODE
   AND s.RETAILER_ID = u.RETAILER_ID
 WHERE u.REASON = 'USER_OVERRIDE'
   AND u.PROMOTED_AT  IS NULL
   AND u.DISMISSED_AT IS NULL
   AND u.NORMALIZED_TEXT   IS NOT NULL
   AND u.SECOND_SKILL_CODE IS NOT NULL
   AND ( :param1 = '-1' OR u.RETAILER_ID = :param1 )
   AND u.ASKED_AT >= SYSTIMESTAMP - NUMTODSINTERVAL(
       NVL(TO_NUMBER(NULLIF(TRIM(:param4), '')), 90), 'DAY')
 GROUP BY LOWER(TRIM(u.NORMALIZED_TEXT)),
          u.SECOND_SKILL_CODE,
          u.RETAILER_ID
HAVING COUNT(DISTINCT u.ASKED_BY) >= NVL(TO_NUMBER(NULLIF(TRIM(:param2), '')), 2)
   AND COUNT(*)                   >= NVL(TO_NUMBER(NULLIF(TRIM(:param3), '')), 3)
 ORDER BY MAX(u.ASKED_AT) DESC
~',
       '', '', 0, 1, 0
  FROM dual;

-- ----- AI0000077 — idempotent INSERT into AI_SKILL_VOCABULARY (auto-promote path)
-- Differs from AI0000073 by:
--   * Uses MERGE so re-running on the same phrasing is a no-op.
--   * Defaults concept = 'AUTO_PROMOTED' and boost = 1.0 (conservative,
--     vs 1.5 / 1.7 for manual promotions).
INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000077',
       'AI — Engine auto-promote MERGE vocab',
       'POST :param1=REQUESTID. values[]: SKILL_ID, TERM, CANONICAL_CONCEPT (default AUTO_PROMOTED), TERM_TYPE (default INTENT_PHRASE), CONFIDENCE_BOOST (default 1.0). Idempotent — re-running on the same (skill_id, term, term_type) is a no-op.',
       q'~
MERGE INTO AI_SKILL_VOCABULARY v
USING (
  SELECT TRIM(j.skill_id)                                              AS skill_id,
         LOWER(TRIM(j.term))                                            AS term,
         NVL(NULLIF(TRIM(j.canonical_concept), ''), 'AUTO_PROMOTED')    AS concept,
         NVL(NULLIF(TRIM(j.term_type), ''), 'INTENT_PHRASE')            AS term_type,
         NVL(TO_NUMBER(NULLIF(TRIM(j.confidence_boost), '')), 1.0)      AS boost
    FROM json_table(
           (SELECT r.requestbody FROM request_query_body r
             WHERE r.requestid = TO_NUMBER(TRIM(:param1))),
           '$.values[*]'
           COLUMNS (
              skill_id           VARCHAR2(50)    PATH '$."SKILL_ID"',
              term               VARCHAR2(200)   PATH '$."TERM"',
              canonical_concept  VARCHAR2(100)   PATH '$."CANONICAL_CONCEPT"',
              term_type          VARCHAR2(30)    PATH '$."TERM_TYPE"',
              confidence_boost   VARCHAR2(10)    PATH '$."CONFIDENCE_BOOST"'
           )
         ) j
   WHERE TRIM(j.skill_id) IS NOT NULL
     AND TRIM(j.term)     IS NOT NULL
) src
ON (    v.skill_id   = src.skill_id
    AND LOWER(v.term) = src.term
    AND v.term_type  = src.term_type )
WHEN NOT MATCHED THEN INSERT
    (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
  VALUES
    (src.skill_id, src.term, src.concept, src.term_type, 'EN', src.boost)
~',
       '', '', 0, 0, 1
  FROM dual;

-- ----- AI0000078 — bulk stamp matching unresolved rows as auto-promoted
-- Stamps EVERY USER_OVERRIDE row whose (NORMALIZED_TEXT, SECOND_SKILL_CODE,
-- RETAILER_ID) matches one of the JSON values (i.e. all duplicates of the
-- promoted phrasing). PROMOTED_BY = 'AUTO_PROMOTE' so reports can split
-- manual vs automatic curation.
INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000078',
       'AI — Engine auto-promote stamp',
       'POST :param1=REQUESTID. values[]: PHRASE_NORM, SKILL_CODE, RETAILER_ID, SKILL_ID, CANONICAL_CONCEPT. Stamps all matching USER_OVERRIDE unresolved rows as PROMOTED with PROMOTED_BY=AUTO_PROMOTE.',
       q'~
UPDATE AI_ENGINE_UNRESOLVED u
   SET (PROMOTED_AT, PROMOTED_BY, PROMOTED_TERM, PROMOTED_CONCEPT, PROMOTED_SKILL_ID) = (
        SELECT SYSTIMESTAMP,
               'AUTO_PROMOTE',
               LOWER(TRIM(j.phrase_norm)),
               NVL(NULLIF(TRIM(j.canonical_concept), ''), 'AUTO_PROMOTED'),
               NULLIF(TRIM(j.skill_id), '')
          FROM json_table(
                 (SELECT r.requestbody FROM request_query_body r
                   WHERE r.requestid = TO_NUMBER(TRIM(:param1))),
                 '$.values[*]'
                 COLUMNS (
                    phrase_norm        VARCHAR2(500) PATH '$."PHRASE_NORM"',
                    skill_code         VARCHAR2(100) PATH '$."SKILL_CODE"',
                    retailer_id        VARCHAR2(30)  PATH '$."RETAILER_ID"',
                    skill_id           VARCHAR2(50)  PATH '$."SKILL_ID"',
                    canonical_concept  VARCHAR2(100) PATH '$."CANONICAL_CONCEPT"'
                 )
               ) j
         WHERE LOWER(TRIM(j.phrase_norm)) = LOWER(TRIM(u.NORMALIZED_TEXT))
           AND TRIM(j.skill_code)         = u.SECOND_SKILL_CODE
           AND TRIM(j.retailer_id)        = u.RETAILER_ID
           AND ROWNUM = 1
   )
 WHERE u.REASON       = 'USER_OVERRIDE'
   AND u.PROMOTED_AT  IS NULL
   AND u.DISMISSED_AT IS NULL
   AND EXISTS (
        SELECT 1
          FROM json_table(
                 (SELECT r.requestbody FROM request_query_body r
                   WHERE r.requestid = TO_NUMBER(TRIM(:param1))),
                 '$.values[*]'
                 COLUMNS (
                    phrase_norm  VARCHAR2(500) PATH '$."PHRASE_NORM"',
                    skill_code   VARCHAR2(100) PATH '$."SKILL_CODE"',
                    retailer_id  VARCHAR2(30)  PATH '$."RETAILER_ID"'
                 )
               ) j2
         WHERE LOWER(TRIM(j2.phrase_norm)) = LOWER(TRIM(u.NORMALIZED_TEXT))
           AND TRIM(j2.skill_code)         = u.SECOND_SKILL_CODE
           AND TRIM(j2.retailer_id)        = u.RETAILER_ID
   )
~',
       '', '', 0, 0, 1
  FROM dual;

COMMIT;
