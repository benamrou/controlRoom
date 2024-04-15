
curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" -H "SUBJECT_EXT: period ${l_first_date} to ${l_last_date} on Wellness items (Attribute WELL/Y)" "http://localhost:8093/api/notification/?PARAM=LOS0000000002&PARAM=WELL&PARAM=Y&PARAM=12/01/23&PARAM=12/01/23" -L

