set termout off
set feed off
set head off
set echo off

spool /opt/apps/controlRoom/controlRoom_server/server/scripts/sql/CGO_store_list.txt

SELECT "SiteCode" 
FROM tbl_REF_HEINENS_SiteAttribute@Heinens_Custom_Prod
WHERE "SiteType" = 10 AND "TopaseGoLiveDate" BETWEEN '1-JAN-18' AND trunc(sysdate);

spool off;

exit success
