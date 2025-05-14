
# Today's date
today=$(date +%m-%d-%y)
yest=$(date --date yesterday "+%m/%d/%y")

nohup curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" "http://localhost:8092/api/notification/?PARAM=DAR0000000001&PARAM=${yest}&PARAM=${yest}" -L &

