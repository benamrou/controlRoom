-- ─────────────────────────────────────────────────────────────────────────────
-- Supply Chain AI — Engine unresolved-question LIBQUERY bundle
--   AI0000071  POST DML  insert into AI_ENGINE_UNRESOLVED  (engine logs misses)
--   AI0000072  GET       list pending phrasings (admin "Pending phrasings" UI)
--   AI0000073  POST DML  promote: stamp PROMOTED_AT + insert into AI_SKILL_VOCABULARY
--   AI0000074  POST DML  dismiss: stamp DISMISSED_AT (no vocabulary insert)
-- ─────────────────────────────────────────────────────────────────────────────

DELETE FROM LIBQUERY WHERE QUERYNUM IN ('AI0000071','AI0000072','AI0000073','AI0000074');

-- ----- AI0000071 — INSERT unresolved phrasing (engine writes one row per miss)
INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000071',
       'AI — Engine unresolved insert',
       'Engine POST :param1=REQUESTID. JSON values[]: RETAILER_ID, QUESTION_TEXT, NORMALIZED_TEXT, TOP_SKILL_ID, TOP_SKILL_CODE, TOP_SCORE, SECOND_SKILL_CODE, SECOND_SCORE, INTENT_TYPE, REASON, ASKED_BY.',
       q'~
INSERT INTO AI_ENGINE_UNRESOLVED (
    RETAILER_ID, QUESTION_TEXT, NORMALIZED_TEXT,
    TOP_SKILL_ID, TOP_SKILL_CODE, TOP_SCORE,
    SECOND_SKILL_CODE, SECOND_SCORE,
    INTENT_TYPE, REASON, ASKED_BY, ASKED_AT
)
SELECT TRIM(j.retailer_id),
       j.question_text,
       j.normalized_text,
       NULLIF(TRIM(j.top_skill_id), ''),
       NULLIF(TRIM(j.top_skill_code), ''),
       TO_NUMBER(NULLIF(TRIM(j.top_score), '')),
       NULLIF(TRIM(j.second_skill_code), ''),
       TO_NUMBER(NULLIF(TRIM(j.second_score), '')),
       NULLIF(TRIM(j.intent_type), ''),
       NVL(NULLIF(TRIM(j.reason), ''), 'LOW_CONFIDENCE'),
       NVL(NULLIF(TRIM(j.asked_by), ''), 'SYSTEM'),
       SYSTIMESTAMP
  FROM json_table(
         (SELECT r.requestbody FROM request_query_body r
           WHERE r.requestid = TO_NUMBER(TRIM(:param1))),
         '$.values[*]'
         COLUMNS (
            retailer_id        VARCHAR2(30)    PATH '$."RETAILER_ID"',
            question_text      CLOB            PATH '$."QUESTION_TEXT"',
            normalized_text    CLOB            PATH '$."NORMALIZED_TEXT"',
            top_skill_id       VARCHAR2(50)    PATH '$."TOP_SKILL_ID"',
            top_skill_code     VARCHAR2(100)   PATH '$."TOP_SKILL_CODE"',
            top_score          VARCHAR2(20)    PATH '$."TOP_SCORE"',
            second_skill_code  VARCHAR2(100)   PATH '$."SECOND_SKILL_CODE"',
            second_score       VARCHAR2(20)    PATH '$."SECOND_SCORE"',
            intent_type        VARCHAR2(30)    PATH '$."INTENT_TYPE"',
            reason             VARCHAR2(40)    PATH '$."REASON"',
            asked_by           VARCHAR2(50)    PATH '$."ASKED_BY"'
         )
       ) j
 WHERE TRIM(j.retailer_id) IS NOT NULL
   AND TRIM(j.question_text) IS NOT NULL
~',
       '', '', 1, 0, 1
  FROM dual;

-- ----- AI0000072 — GET list pending phrasings (most recent first, optional limit)
INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000072',
       'AI — Engine unresolved list',
       'GET pending unresolved phrasings (PROMOTED_AT IS NULL AND DISMISSED_AT IS NULL). :param1 = retailer_id (or -1 for all). :param2 = limit (default 100).',
       q'~
SELECT *
  FROM (
    SELECT u.UNRES_ID,
           u.RETAILER_ID,
           u.QUESTION_TEXT,
           u.NORMALIZED_TEXT,
           u.TOP_SKILL_ID,
           u.TOP_SKILL_CODE,
           u.TOP_SCORE,
           u.SECOND_SKILL_CODE,
           u.SECOND_SCORE,
           u.INTENT_TYPE,
           u.REASON,
           u.ASKED_BY,
           TO_CHAR(u.ASKED_AT, 'YYYY-MM-DD"T"HH24:MI:SS') AS ASKED_AT
      FROM AI_ENGINE_UNRESOLVED u
     WHERE u.PROMOTED_AT IS NULL
       AND u.DISMISSED_AT IS NULL
       AND ( :param1 = '-1' OR u.RETAILER_ID = :param1 )
     ORDER BY u.ASKED_AT DESC
  )
 WHERE ROWNUM <= NVL(TO_NUMBER(NULLIF(TRIM(:param2), '')), 100)
~',
       '', '', 1, 1, 0
  FROM dual;

-- ----- AI0000073 — Promote: stamp + INSERT into AI_SKILL_VOCABULARY
INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000073',
       'AI — Promote unresolved to vocabulary',
       'POST :param1=REQUESTID. values[]: UNRES_ID, SKILL_ID, TERM, CANONICAL_CONCEPT, TERM_TYPE (default INTENT_PHRASE), CONFIDENCE_BOOST (default 1.5), PROMOTED_BY.',
       q'~
INSERT INTO AI_SKILL_VOCABULARY (
    skill_id, term, canonical_concept, term_type, language_code, confidence_boost
)
SELECT TRIM(j.skill_id),
       LOWER(TRIM(j.term)),
       NVL(NULLIF(TRIM(j.canonical_concept), ''), 'GENERAL_INTENT'),
       NVL(NULLIF(TRIM(j.term_type), ''), 'INTENT_PHRASE'),
       'EN',
       NVL(TO_NUMBER(NULLIF(TRIM(j.confidence_boost), '')), 1.5)
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
~',
       '', '', 0, 0, 1
  FROM dual;

-- The promotion-stamp UPDATE runs as a second statement from Node, since
-- LIBQUERY rows wrap exactly one DML statement. AI0000074 dismisses without
-- adding vocabulary, AI0000075 stamps the unresolved row as promoted.

DELETE FROM LIBQUERY WHERE QUERYNUM IN ('AI0000074','AI0000075');

INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000074',
       'AI — Dismiss unresolved phrasing',
       'POST :param1=REQUESTID. values[]: UNRES_ID, DISMISSED_BY. Marks the row as reviewed without adding vocabulary.',
       q'~
UPDATE AI_ENGINE_UNRESOLVED u
   SET u.DISMISSED_AT = SYSTIMESTAMP,
       u.DISMISSED_BY = (
           SELECT NVL(NULLIF(TRIM(j.dismissed_by), ''), 'SYSTEM')
             FROM json_table(
                    (SELECT r.requestbody FROM request_query_body r
                      WHERE r.requestid = TO_NUMBER(TRIM(:param1))),
                    '$.values[*]'
                    COLUMNS (
                       dismissed_by VARCHAR2(50) PATH '$."DISMISSED_BY"'
                    )
                  ) j
            WHERE ROWNUM = 1
       )
 WHERE u.UNRES_ID IN (
        SELECT TO_NUMBER(TRIM(j.unres_id))
          FROM json_table(
                 (SELECT r.requestbody FROM request_query_body r
                   WHERE r.requestid = TO_NUMBER(TRIM(:param1))),
                 '$.values[*]'
                 COLUMNS (
                    unres_id VARCHAR2(20) PATH '$."UNRES_ID"'
                 )
               ) j
         WHERE TRIM(j.unres_id) IS NOT NULL
   )
~',
       '', '', 0, 0, 1
  FROM dual;

INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000075',
       'AI — Stamp unresolved as promoted',
       'POST :param1=REQUESTID. values[]: UNRES_ID, PROMOTED_BY, PROMOTED_TERM, PROMOTED_CONCEPT, PROMOTED_SKILL_ID. Stamps a row promoted after AI0000073 inserted the vocabulary.',
       q'~
UPDATE AI_ENGINE_UNRESOLVED u
   SET (PROMOTED_AT, PROMOTED_BY, PROMOTED_TERM, PROMOTED_CONCEPT, PROMOTED_SKILL_ID) = (
        SELECT SYSTIMESTAMP,
               NVL(NULLIF(TRIM(j.promoted_by), ''), 'SYSTEM'),
               NULLIF(TRIM(j.promoted_term), ''),
               NULLIF(TRIM(j.promoted_concept), ''),
               NULLIF(TRIM(j.promoted_skill_id), '')
          FROM json_table(
                 (SELECT r.requestbody FROM request_query_body r
                   WHERE r.requestid = TO_NUMBER(TRIM(:param1))),
                 '$.values[*]'
                 COLUMNS (
                    unres_id           VARCHAR2(20)  PATH '$."UNRES_ID"',
                    promoted_by        VARCHAR2(50)  PATH '$."PROMOTED_BY"',
                    promoted_term      VARCHAR2(200) PATH '$."PROMOTED_TERM"',
                    promoted_concept   VARCHAR2(100) PATH '$."PROMOTED_CONCEPT"',
                    promoted_skill_id  VARCHAR2(50)  PATH '$."PROMOTED_SKILL_ID"'
                 )
               ) j
         WHERE TO_NUMBER(TRIM(j.unres_id)) = u.UNRES_ID
   )
 WHERE u.UNRES_ID IN (
        SELECT TO_NUMBER(TRIM(j.unres_id))
          FROM json_table(
                 (SELECT r.requestbody FROM request_query_body r
                   WHERE r.requestid = TO_NUMBER(TRIM(:param1))),
                 '$.values[*]'
                 COLUMNS (
                    unres_id VARCHAR2(20) PATH '$."UNRES_ID"'
                 )
               ) j
         WHERE TRIM(j.unres_id) IS NOT NULL
   )
~',
       '', '', 0, 0, 1
  FROM dual;

COMMIT;
