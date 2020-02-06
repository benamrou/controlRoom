set termout off
set feed off
set head off
set echo off

spool /opt/apps/controlRoom/controlRoom_server/server/scripts/sql/INVENTORY_store_list.txt


SELECT distinct einsite
FROM inventinv@Heinens_Custom_Prod WHERE eintinv=42
--and einsite in (14,43)
AND TRUNC(eindinv) >= TRUNC(SYSDATE-2);

spool off;

exit success
