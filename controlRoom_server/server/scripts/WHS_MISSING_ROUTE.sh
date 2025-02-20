
# Today's date 
today=$(date +%m-%d-%y)

curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" -H "SUBJECT_EXT: for Manufacturing #93080" -H "FILENAME_EXT:MFG_missingRoute_${today}.xlsx" "http://localhost:8092/api/notification/?PARAM=WHS0000000012&PARAM=93" -L
