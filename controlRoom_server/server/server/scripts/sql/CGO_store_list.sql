set termout off
set feed off
set head off
set echo off

spool /opt/apps/controlRoom/controlRoom_server/server/scripts/sql/CGO_store_list.txt

-- SELECT "SiteCode"
-- FROM tbl_REF_HEINENS_SiteAttribute
-- WHERE "SiteType" = 10 AND "TopaseGoLiveDate" BETWEEN '1-JAN-18' AND trunc(sysdate);


   SELECT socsite "SiteCode"
   FROM SITDGENE
   WHERE SOCCMAG=10 and SOCSITE in (4,5,8,17,10,12,22);

spool off;

exit success
