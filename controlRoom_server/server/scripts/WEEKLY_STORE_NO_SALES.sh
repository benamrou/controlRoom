
. /home/hntcen/env/envICR

sqlplus -s controlroom/controlroom @/opt/apps/controlRoom/controlRoom_server/server/scripts/sql/NSL_store_list.sql

chmod 777 /opt/apps/controlRoom/controlRoom_server/server/scripts/sql/NSL_store_list.txt
sed '/^$/d' /opt/apps/controlRoom/controlRoom_server/server/scripts/sql/NSL_store_list.txt > /opt/apps/controlRoom/controlRoom_server/server/scripts/sql/NSL_store_list.out
  
mylist="/opt/apps/controlRoom/controlRoom_server/server/scripts/sql/NSL_store_list.out"

while read line;
do
  STORE=$(echo $line | awk '{print $1}')
  DEPT=$(echo $line | awk '{print $2}')
#  echo "Store#" $STORE " -Dept#" $DEPT 
  if [ "$line" != "" ]; then 
  	nohup curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" -H "SUBJECT_EXT: for STORE #${STORE} DEPT#${DEPT}" "http://localhost:8092/api/notification/?PARAM=NSL0000000001_${DEPT}_${STORE}&PARAM=${STORE}&PARAM=${DEPT}" -L &
 fi;
done <"$mylist"

rm -f $mylist /opt/apps/controlRoom/controlRoom_server/server/scripts/sql/NSL_store_list.txt
