
# Today's date 
today=$(date +%m-%d-%y)

#sleep 1m

curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" "http://localhost:8092/api/notification/?PARAM=ORD0000000009" -L
