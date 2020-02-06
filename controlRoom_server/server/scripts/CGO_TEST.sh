
. /home/hntcen/env/envCEN

sqlplus -s controlroom/controlroom @/opt/apps/controlRoom/controlRoom_server/server/scripts/sql/CGO_TEST.sql

chmod 777 /opt/apps/controlRoom/controlRoom_server/server/scripts/sql/CGO_TEST.txt
sed '/^$/d' /opt/apps/controlRoom/controlRoom_server/server/scripts/sql/CGO_TEST.txt > /opt/apps/controlRoom/controlRoom_server/server/scripts/sql/CGO_TEST.out
  
mylist="/opt/apps/controlRoom/controlRoom_server/server/scripts/sql/CGO_TEST.out"

while read line;
do
  nohup curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" -H "SUBJECT_EXT: for STORE #$line" "http://localhost:8092/api/notification/?PARAM=CGO0000000000&PARAM=$line" -L &
done <"$mylist"

rm -f /opt/apps/controlRoom/controlRoom_server/server/scripts/sql/CGO_TEST.txt $mylist

