

# CAPTURE data
nohup curl --fail -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" "http://localhost:8092/api/notification/?PARAM=NSL0000000002" -L  &
