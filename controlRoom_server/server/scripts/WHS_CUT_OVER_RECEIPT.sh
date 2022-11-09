nohup curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: abe" -H "SUBJECT_EXT: for Warehouse #1" "http://localhost:8092/api/notification/?PARAM=CUT0000000001&PARAM=1" -L &

nohup curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: abe" -H "SUBJECT_EXT: for Warehouse #2" "http://localhost:8092/api/notification/?PARAM=CUT0000000001_1&PARAM=2" -L &

