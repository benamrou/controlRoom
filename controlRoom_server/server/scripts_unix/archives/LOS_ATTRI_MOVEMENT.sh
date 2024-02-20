
# Last month
l_first_date=$(date -d "`date +%Y%m01` -1 month" +%m/%d/%y)
l_last_date=$(date -d "`date +%Y%m01` -1 day" +%m/%d/%y)
l_mid_last_month_date=$(date -d "`date +%Y%m15` -1 month" +%m/%d/%y)
l_mid_1_last_month_date=$(date -d "`date +%Y%m16` -1 month" +%m/%d/%y)

# This month
t_first_date=$(date +%m/01/%y)
t_last_date=$(date -d "`date +%Y%m01` +1 month -1 day" +%m/%d/%y)

# Wellness - WELL attribute and Y value first two weeks
curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" -H "SUBJECT_EXT: period ${l_first_date} to ${l_mid_last_month_date} on Wellness items (Attribute WELL/Y)" "http://localhost:8092/api/notification/?PARAM=LOS0000000002&PARAM=WELL&PARAM=Y&PARAM=${l_first_date}&PARAM=${l_mid_last_month_date}" -L 

# Wellness - WELL attribute and Y value LAST two weeks
curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" -H "SUBJECT_EXT: period ${l_mid_1_last_month_date} to ${l_last_date} on Wellness items (Attribute WELL/Y)" "http://localhost:8092/api/notification/?PARAM=LOS0000000002&PARAM=WELL&PARAM=Y&PARAM=${l_mid_1_last_month_date}&PARAM=${l_last_date}" -L

