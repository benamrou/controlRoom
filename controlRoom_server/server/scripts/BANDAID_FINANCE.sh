kill -9 `ps aux | grep FIN0000000001 | awk '{print $2}'`

curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: abe" "http://localhost:8092/api/notification/?PARAM=FIN0000000001" -L 

