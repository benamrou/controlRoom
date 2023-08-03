#nohup curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" -H "SUBJECT_EXT: for Grocery" "http://localhost:8092/api/notification/?PARAM=UBD0000000006&PARAM=90061&PARAM=120&PARAM=60" -L &

nohup curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" -H "SUBJECT_EXT: for Dairy" "http://localhost:8092/api/notification/?PARAM=UBD0000000006&PARAM=91070&PARAM=30&PARAM=20" -L &

#nohup curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" -H "SUBJECT_EXT: for Freezer" "http://localhost:8092/api/notification/?PARAM=UBD0000000006&PARAM=91071&PARAM=120&PARAM=60" -L &

# Capture report snapshot
#sqlplus hncustom2/hncustom2@central @/home/hnpcen/heinensapps/controlRoom_server/scripts/insert/WHS_SMART_UBD.sql

