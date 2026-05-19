-- ─────────────────────────────────────────────────────────────────────────────
-- Supply Chain AI — Engine feedback LIBQUERY (AI0000070)
-- Replaces the inline INSERT in /api/ai/engine/feedback so all DML stays in
-- LIBQUERY (per architecture rule). Insert fires from S14 AI Assistant when
-- the user clicks 👍/👎 under an assistant message.
-- ─────────────────────────────────────────────────────────────────────────────

-- POST DML pattern: :param1 = REQUESTID; QUERYSQL reads requestbody from
-- REQUEST_QUERY_BODY and expands JSON_TABLE on $.values[*] (uppercase keys).

DELETE FROM LIBQUERY WHERE QUERYNUM IN ('AI0000070');

INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000070',
       'AI — Engine feedback (👍/👎) insert',
       'S14 POST: :param1=REQUESTID. JSON values[]: RETAILER_ID, QUESTION_TEXT, SKILL_ID, TEMPLATE_CODE, RESULT_COUNT, ANSWER_QUALITY, THUMB, ASKED_BY. THUMB must be ''up'' or ''down''.',
       q'~
INSERT INTO AI_ENGINE_INTERACTION_LOG (
    RETAILER_ID, QUESTION_TEXT, SKILL_ID, TEMPLATE_CODE,
    RESULT_COUNT, ANSWER_QUALITY, THUMB_UP, THUMB_DOWN,
    ASKED_BY, ASKED_AT
)
SELECT TRIM(j.retailer_id),
       j.question_text,
       NULLIF(TRIM(j.skill_id), ''),
       NULLIF(TRIM(j.template_code), ''),
       NVL(TO_NUMBER(NULLIF(TRIM(j.result_count), '')), 0),
       NULLIF(TRIM(j.answer_quality), ''),
       CASE WHEN UPPER(TRIM(j.thumb)) = 'UP'   THEN 1 ELSE 0 END,
       CASE WHEN UPPER(TRIM(j.thumb)) = 'DOWN' THEN 1 ELSE 0 END,
       NVL(NULLIF(TRIM(j.asked_by), ''), 'SYSTEM'),
       SYSTIMESTAMP
  FROM json_table(
         (SELECT r.requestbody
            FROM request_query_body r
           WHERE r.requestid = TO_NUMBER(TRIM(:param1))),
         '$.values[*]'
         COLUMNS (
            retailer_id     VARCHAR2(30)   PATH '$."RETAILER_ID"',
            question_text   CLOB           PATH '$."QUESTION_TEXT"',
            skill_id        VARCHAR2(50)   PATH '$."SKILL_ID"',
            template_code   VARCHAR2(100)  PATH '$."TEMPLATE_CODE"',
            result_count    VARCHAR2(20)   PATH '$."RESULT_COUNT"',
            answer_quality  VARCHAR2(30)   PATH '$."ANSWER_QUALITY"',
            thumb           VARCHAR2(10)   PATH '$."THUMB"',
            asked_by        VARCHAR2(50)   PATH '$."ASKED_BY"'
         )
       ) j
 WHERE TRIM(j.retailer_id) IS NOT NULL
   AND UPPER(TRIM(j.thumb)) IN ('UP','DOWN')
~',
       '', '', 1, 0, 1
  FROM dual;

COMMIT;
