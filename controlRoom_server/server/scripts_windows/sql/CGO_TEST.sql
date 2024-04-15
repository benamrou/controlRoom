set termout off
set feed off
set head off
set echo off

spool $HOME/heinensapps/controlRoom_server/scripts/sql/CGO_TEST.txt

SELECT "SiteCode" 
FROM tbl_REF_HEINENS_SiteAttribute@Heinens_Custom_Prod
WHERE "SiteType" = 10 AND "TopaseGoLiveDate" BETWEEN '1-JAN-18' AND trunc(sysdate) AND "SiteCode"=5;

spool off;

exit success
