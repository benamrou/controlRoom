set termout off
set feed off
set head off
set echo off

spool $HOME/heinensapps/controlRoom_server/scripts/sql/WELLNESS_store_list.txt

-- SELECT "SiteCode"
-- FROM tbl_REF_HEINENS_SiteAttribute
-- WHERE "SiteType" = 10 AND "TopaseGoLiveDate" BETWEEN '1-JAN-18' AND trunc(sysdate);


   SELECT distinct ecdsite "SiteCode"
   FROM CDEENTCDE, foudgene
   WHERE ecdetat=7
   and foucnuf='08531'
   and ecdnfilf=1
   and ecdmotifsol=14
   and trunc(ecddenvoi)=trunc(sysdate);

spool off;

exit success
