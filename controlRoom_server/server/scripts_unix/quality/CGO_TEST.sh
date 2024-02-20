
. $HOME/env/envCEN

sqlplus -s $ICRUSERID @$HOME/heinensapps/controlRoom_server/scripts/sql/CGO_TEST.sql

chmod 777 $HOME/heinensapps/controlRoom_server/scripts/sql/CGO_TEST.txt
sed '/^$/d' $HOME/heinensapps/controlRoom_server/scripts/sql/CGO_TEST.txt > $HOME/heinensapps/controlRoom_server/scripts/sql/CGO_TEST.out
  
mylist="$HOME/heinensapps/controlRoom_server/scripts/sql/CGO_TEST.out"

while read line;
do
  nohup curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" -H "SUBJECT_EXT: for STORE #$line" "http://localhost:8092/api/notification/?PARAM=CGO0000000000_$line&PARAM=$line" -L ne&
done <"$mylist"

rm -f $HOME/heinensapps/controlRoom_server/scripts/sql/CGO_TEST.txt $mylist

