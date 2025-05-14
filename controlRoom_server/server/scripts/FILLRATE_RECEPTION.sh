nohup curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" "http://localhost:8092/api/notification/?PARAM=FIL0000000001&PARAM=1" -L &

nohup curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" "http://localhost:8092/api/notification/?PARAM=FIL0000000002&PARAM=0" -L &


# Capture report snapshot

sqlplus $ICRUSERID@central @$HOME/heinensapps/controlRoom_server/scripts/insert/FILLRATE_RECEPTION.sql

