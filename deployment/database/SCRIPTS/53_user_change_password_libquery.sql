-- Self-service password change (SET0000024) — deploy if 34_settings_users_corporate_libquery.sql predates this entry.
DELETE FROM LIBQUERY WHERE QUERYNUM = 'SET0000024';

INSERT INTO LIBQUERY (QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'SET0000024',
       'Users - change own password',
       'Logged-in user changes password. Body {values:[{USERID,USERAPPLI,CURRENT_PASS,NEW_PASS}]}. Passes Base64 (client encodes plain text). CURRENT_PASS must match USERSROOM.USERPASS.',
       TO_CLOB(q'~
DECLARE
  v_userid  VARCHAR2(20);
  v_appli   NUMBER;
  v_cur     VARCHAR2(40);
  v_new     VARCHAR2(40);
  v_cnt     NUMBER;
BEGIN
  SELECT jt.USERID, NVL(TO_NUMBER(jt.USERAPPLI), 1), jt.CURRENT_PASS, jt.NEW_PASS
    INTO v_userid, v_appli, v_cur, v_new
    FROM REQUEST_QUERY_BODY rb,
         JSON_TABLE(rb.REQUESTBODY, '$.values[0]'
           COLUMNS (
             USERID       VARCHAR2(20) PATH '$."USERID"',
             USERAPPLI    VARCHAR2(10) PATH '$."USERAPPLI"',
             CURRENT_PASS VARCHAR2(40) PATH '$."CURRENT_PASS"',
             NEW_PASS     VARCHAR2(40) PATH '$."NEW_PASS"'
           )
         ) jt
   WHERE rb.REQUESTID = :param1;

  IF v_new IS NULL OR TRIM(v_new) IS NULL THEN
    RAISE_APPLICATION_ERROR(-20024, 'New password is required.');
  END IF;

  UPDATE USERSROOM
     SET USERPASS = v_new,
         USERDMAJ = SYSDATE,
         USERUTIL = v_userid
   WHERE USERID = v_userid
     AND USERAPPLI = v_appli
     AND USERPASS = v_cur;

  v_cnt := SQL%ROWCOUNT;
  IF v_cnt = 0 THEN
    RAISE_APPLICATION_ERROR(-20025, 'Current password is incorrect.');
  END IF;
END;
~'),
       ':param1=REQUESTID',
       '',
       1, 0, 1 FROM dual;

COMMIT;
