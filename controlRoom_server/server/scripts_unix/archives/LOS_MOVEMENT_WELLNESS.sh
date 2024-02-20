
# Last month
l_first_date=$(date -d "`date +%Y%m01` -1 month" +%m/%d/%y)
l_last_date=$(date -d "`date +%Y%m01` -1 day" +%m/%d/%y)

# This month
t_first_date=$(date +%m/01/%y)
t_last_date=$(date -d "`date +%Y%m01` +1 month -1 day" +%m/%d/%y)


# Wellness - 1030380000000
curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" -H "SUBJECT_EXT: period ${l_first_date} to ${l_last_date} on Wellness (1030380000000)" "http://localhost:8092/api/notification/?PARAM=LOS0000000001&PARAM=1030380000000&PARAM=${l_first_date}&PARAM=${l_last_date}" -L 

