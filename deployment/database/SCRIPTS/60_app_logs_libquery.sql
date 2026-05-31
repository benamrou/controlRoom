-- App logs — CROOMLOG (query audit) + ALERTLOG (alert execution) LIBQUERY
-- Server file logs use GET /api/app-logs/* (not LIBQUERY).
--
-- LOG0000001 params: :param1=querynum (-1=all), :param2=userid, :param3=date_from MM/DD/YYYY, :param4=date_to
-- LOG0000002 params: :param1=alert_id, :param2=status, :param3=date_from, :param4=date_to

SET DEFINE OFF;

DELETE FROM LIBQUERY WHERE QUERYNUM IN ('LOG0000001', 'LOG0000002');

-- LOG0000001 — CROOMLOG search (ICR query execution log)
INSERT INTO LIBQUERY (
  QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL,
  QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'LOG0000001',
       'App log — CROOMLOG search',
       'ICR query audit log. :param1=querynum or -1, :param2=userid or -1, :param3=date_from MM/DD/YYYY or -1, :param4=date_to or -1.',
       q'~
SELECT c.LOGQUERYNUM,
       l.QUERYTITLE,
       DBMS_LOB.SUBSTR(l.QUERYDESC, 4000, 1) AS QUERYDESC,
       c.LOGUSERID,
       c.LODDATE,
       c.LOGPARAM,
       c.LOGSID,
       c.LOGMESSAGE,
       c.LOGDCRE,
       c.LOGDMAJ,
       c.LOGUTIL
  FROM CROOMLOG c
  LEFT JOIN LIBQUERY l ON l.QUERYNUM = c.LOGQUERYNUM
 WHERE (:param1 = '-1' OR UPPER(c.LOGQUERYNUM) LIKE '%' || UPPER(:param1) || '%')
   AND (:param2 = '-1' OR UPPER(c.LOGUSERID) = UPPER(:param2))
   AND (:param3 = '-1' OR TRUNC(c.LOGDCRE) >= TO_DATE(:param3, 'MM/DD/YYYY'))
   AND (:param4 = '-1' OR TRUNC(c.LOGDCRE) <= TO_DATE(:param4, 'MM/DD/YYYY'))
 ORDER BY c.LOGDCRE DESC
 FETCH FIRST 500 ROWS ONLY
~',
       ':param1=querynum,:param2=userid,:param3=date_from,:param4=date_to',
       'LOGQUERYNUM,QUERYTITLE,QUERYDESC,LOGUSERID,LODDATE,LOGPARAM,LOGSID,LOGMESSAGE,LOGDCRE,LOGDMAJ,LOGUTIL',
       1,
       0,
       0
  FROM dual;

-- LOG0000002 — ALERTLOG search (alert run history; complements MON0000001 on journal screen)
INSERT INTO LIBQUERY (
  QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL,
  QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'LOG0000002',
       'App log — ALERTLOG search',
       'Alert execution log. :param1=LALTID or -1, :param2=LALTSTATUS or -1, :param3=date_from, :param4=date_to.',
       q'~
SELECT g.LALTID,
       a.ALTSUBJECT,
       DBMS_LOB.SUBSTR(a.ALTCONTENT, 4000, 1) AS ALTCONTENT,
       g.LALTEDATE,
       g.LALTSTATUS,
       g.LALTPHASE,
       g.LALTDURATION,
       g.LALTROWCOUNT,
       g.LALTREQID,
       g.LALTEMAIL,
       g.LALTERROR,
       g.LALTPARAM,
       g.LALTDB,
       g.LALTLANGUE,
       g.LALTSTARTTIME,
       g.LALTENDTIME,
       g.LALTDCRE,
       g.LALTUTIL
  FROM ALERTLOG g
  LEFT JOIN ALERTS a ON a.ALTID = g.LALTID
 WHERE (:param1 = '-1' OR g.LALTID = :param1)
   AND (:param2 = '-1' OR g.LALTSTATUS = :param2)
   AND (:param3 = '-1' OR TRUNC(NVL(g.LALTEDATE, g.LALTDCRE)) >= TO_DATE(:param3, 'MM/DD/YYYY'))
   AND (:param4 = '-1' OR TRUNC(NVL(g.LALTEDATE, g.LALTDCRE)) <= TO_DATE(:param4, 'MM/DD/YYYY'))
 ORDER BY NVL(g.LALTEDATE, g.LALTDCRE) DESC
 FETCH FIRST 500 ROWS ONLY
~',
       ':param1=alert_id,:param2=status,:param3=date_from,:param4=date_to',
       'LALTID,ALTSUBJECT,ALTCONTENT,LALTEDATE,LALTSTATUS,LALTPHASE,LALTDURATION,LALTROWCOUNT,LALTREQID,LALTEMAIL,LALTERROR,LALTPARAM,LALTDB,LALTLANGUE,LALTSTARTTIME,LALTENDTIME,LALTDCRE,LALTUTIL',
       1,
       0,
       0
  FROM dual;

COMMIT;

SET DEFINE ON;
