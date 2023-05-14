date_today=`date +"%m%d%y"`

nohup curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" -H "SUBJECT_EXT: for Grocery" "http://localhost:8092/api/notification/?PARAM=BUY0000000006_1&PARAM=90061&PARAM=${date_today}" -L &

