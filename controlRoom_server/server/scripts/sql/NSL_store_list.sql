set termout off
set feed off
set head off
set echo off

spool /home/hnpcen/heinensapps/controlRoom_server/scripts/sql/NSL_store_list.txt

SELECT socsite "SiteCode", DEPT
FROM sitdgene@Heinens_Custom_Prod, (SELECT '102' DEPT FROM dual UNION SELECT '103' DEPT FROM dual)
WHERE socsite < 55
AND socsite != 30
AND soccmag=10
-- AND ROWNUM=1
ORDER BY socsite ASC;


spool off;

exit success
