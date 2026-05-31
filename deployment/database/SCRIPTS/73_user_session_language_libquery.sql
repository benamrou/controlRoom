-- Phase 4 i18n — self-service USERLANG update from header language switcher
-- Deploy after 34 / 66. POST body: { USERID, USERAPPLI, USERLANG }

SET DEFINE OFF;

DELETE FROM LIBQUERY WHERE QUERYNUM = 'SET0000061';

INSERT INTO LIBQUERY (QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'SET0000061',
       'User - update session language',
       'POST :param1=REQUESTID. values[]: USERID, USERAPPLI, USERLANG, USERUTIL.',
       q'~
UPDATE USERSROOM u
   SET u.USERLANG = (
         SELECT TRIM(j.USERLANG)
           FROM json_table(
                  (SELECT r.requestbody FROM request_query_body r WHERE r.requestid = TO_NUMBER(:param1)),
                  '$.values[*]'
                  COLUMNS (
                    USERID    NUMBER        PATH '$."USERID"',
                    USERAPPLI VARCHAR2(10)  PATH '$."USERAPPLI"',
                    USERLANG  VARCHAR2(10)  PATH '$."USERLANG"',
                    USERUTIL  VARCHAR2(50)  PATH '$."USERUTIL"'
                  )
                ) j
          WHERE j.USERID IS NOT NULL
            AND ROWNUM = 1
       ),
       u.USERDMAJ = SYSDATE,
       u.USERUTIL = NVL((
         SELECT TRIM(j.USERUTIL)
           FROM json_table(
                  (SELECT r.requestbody FROM request_query_body r WHERE r.requestid = TO_NUMBER(:param1)),
                  '$.values[*]'
                  COLUMNS (
                    USERID NUMBER PATH '$."USERID"',
                    USERUTIL VARCHAR2(50) PATH '$."USERUTIL"'
                  )
                ) j
          WHERE j.USERID IS NOT NULL AND ROWNUM = 1
       ), u.USERUTIL)
 WHERE u.USERID = (
         SELECT j.USERID
           FROM json_table(
                  (SELECT r.requestbody FROM request_query_body r WHERE r.requestid = TO_NUMBER(:param1)),
                  '$.values[*]'
                  COLUMNS (USERID NUMBER PATH '$."USERID"', USERAPPLI VARCHAR2(10) PATH '$."USERAPPLI"')
                ) j
          WHERE j.USERID IS NOT NULL AND ROWNUM = 1
       )
   AND u.USERAPPLI = (
         SELECT TRIM(j.USERAPPLI)
           FROM json_table(
                  (SELECT r.requestbody FROM request_query_body r WHERE r.requestid = TO_NUMBER(:param1)),
                  '$.values[*]'
                  COLUMNS (USERAPPLI VARCHAR2(10) PATH '$."USERAPPLI"')
                ) j
          WHERE ROWNUM = 1
       )
~',
       ':param1=REQUESTID',
       '',
       1, 0, 1 FROM dual;

COMMIT;

SET DEFINE ON;
