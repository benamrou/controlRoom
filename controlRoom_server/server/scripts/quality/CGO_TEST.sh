
. /home/hnpcen/env/envCEN

sqlplus -s hncustom2/hncustom2 @/home/hnpcen/heinensapps/controlRoom_server/scripts/sql/CGO_TEST.sql

chmod 777 /home/hnpcen/heinensapps/controlRoom_server/scripts/sql/CGO_TEST.txt
sed '/^$/d' /home/hnpcen/heinensapps/controlRoom_server/scripts/sql/CGO_TEST.txt > /home/hnpcen/heinensapps/controlRoom_server/scripts/sql/CGO_TEST.out
  
mylist="/home/hnpcen/heinensapps/controlRoom_server/scripts/sql/CGO_TEST.out"

while read line;
do
  nohup curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" -H "SUBJECT_EXT: for STORE #$line" "http://localhost:8092/api/notification/?PARAM=CGO0000000000_$line&PARAM=$line" -L ne&
done <"$mylist"

rm -f /home/hnpcen/heinensapps/controlRoom_server/scripts/sql/CGO_TEST.txt $mylist

