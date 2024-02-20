
# Last month
l_first_date=$(date -d "`date +%Y%m01` -1 month" +%m/%d/%y)
l_last_date=$(date -d "`date +%Y%m01` -1 day" +%m/%d/%y)
l_mid_last_month_date=$(date -d "`date +%Y%m15` -1 month" +%m/%d/%y)
l_mid_1_last_month_date=$(date -d "`date +%Y%m16` -1 month" +%m/%d/%y)

l_week1_end_month_date=$(date -d "`date +%Y%m07` -1 month" +%m/%d/%y)
l_week2_start_month_date=$(date -d "`date +%Y%m08` -1 month" +%m/%d/%y)
l_week2_end_month_date=$(date -d "`date +%Y%m14` -1 month" +%m/%d/%y)
l_week3_start_month_date=$(date -d "`date +%Y%m15` -1 month" +%m/%d/%y)
l_week3_end_month_date=$(date -d "`date +%Y%m21` -1 month" +%m/%d/%y)
l_week4_start_month_date=$(date -d "`date +%Y%m22` -1 month" +%m/%d/%y)

# This month
t_first_date=$(date +%m/01/%y)
t_last_date=$(date -d "`date +%Y%m01` +1 month -1 day" +%m/%d/%y)

# Wellness - WELL attribute and Y value WEEK#1
curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" -H "SUBJECT_EXT: period ${l_first_date} to ${l_week1_end_month_date} on Wellness items (Attribute WELL/Y)" "http://localhost:8092/api/notification/?PARAM=LOS0000000002&PARAM=WELL&PARAM=Y&PARAM=${l_first_date}&PARAM=${l_week1_end_month_date}" -L 

# Wellness - WELL attribute and Y value WEEK#2
curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" -H "SUBJECT_EXT: period ${l_week2_start_month_date} to ${l_week2_end_month_date} on Wellness items (Attribute WELL/Y)" "http://localhost:8092/api/notification/?PARAM=LOS0000000002&PARAM=WELL&PARAM=Y&PARAM=${l_week2_start_month_date}&PARAM=${l_week2_end_month_date}" -L

# Wellness - WELL attribute and Y value WEEK#3
curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" -H "SUBJECT_EXT: period ${l_week3_start_month_date} to ${l_week3_end_month_date} on Wellness items (Attribute WELL/Y)" "http://localhost:8092/api/notification/?PARAM=LOS0000000002&PARAM=WELL&PARAM=Y&PARAM=${l_week3_start_month_date}&PARAM=${l_week3_end_month_date}" -L

# Wellness - WELL attribute and Y value WEEK#4
curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" -H "SUBJECT_EXT: period ${l_week4_start_month_date} to ${l_last_date} on Wellness items (Attribute WELL/Y)" "http://localhost:8092/api/notification/?PARAM=LOS0000000002&PARAM=WELL&PARAM=Y&PARAM=${l_week4_start_month_date}&PARAM=${l_last_date}" -L

