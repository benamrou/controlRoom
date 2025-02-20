set termout off
set feed off
set head off
set echo off

spool $HOME/heinensapps/controlRoom_server/scripts/sql/INVENTORY_store_list.txt

SELECT distinct einsite
FROM inventinv@Heinens_Custom_Prod 
WHERE eintinv=42
AND TRUNC(eindinv)=TRUNC(SYSDATE)
/*AND TRUNC(eindinv) >= TRUNC(SYSDATE-4*60)
AND einsite =6*/
;

spool off;

exit success
