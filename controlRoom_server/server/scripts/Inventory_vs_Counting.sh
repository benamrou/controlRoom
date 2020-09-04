
. /home/hntcen/env/envCEN

sqlplus -s controlroom/controlroom @/opt/apps/controlRoom/controlRoom_server/server/scripts/sql/INVENTORY_store_list.sql

chmod 777 /opt/apps/controlRoom/controlRoom_server/server/scripts/sql/INVENTORY_store_list.txt
sed '/^$/d' /opt/apps/controlRoom/controlRoom_server/server/scripts/sql/INVENTORY_store_list.txt > /opt/apps/controlRoom/controlRoom_server/server/scripts/sql/INVENTORY_store_list.out

mylist="/opt/apps/controlRoom/controlRoom_server/server/scripts/sql/INVENTORY_store_list.out"

while read line;
do
  if expr length $line > 0 
  then
  	nohup curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" -H "SUBJECT_EXT: for STORE #$line" "http://localhost:8092/api/notification/?PARAM=CNT0000000001&PARAM=$line" -L &
  fi
done <"$mylist"

rm -f $mylist /opt/apps/controlRoom/controlRoom_server/server/scripts/sql/INVENTORY_store_list.txt
