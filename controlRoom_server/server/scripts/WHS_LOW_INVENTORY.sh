
. /home/hnpcen/env/envICR

# Grocery
nohup curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" -H "SUBJECT_EXT: for Grocery whs #90061 (5 weeks inv.)" "http://localhost:8092/api/notification/?PARAM=INV0000000001&PARAM=90061&PARAM=5" -L &

# Freezer
nohup curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" -H "SUBJECT_EXT: for Freezer whs #91071 (5 weeks inv.)" "http://localhost:8092/api/notification/?PARAM=INV0000000001&PARAM=91071&PARAM=5" -L &

# Dairy
nohup curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" -H "SUBJECT_EXT: for Dairy whs #91070 (2 weeks inv.)" "http://localhost:8092/api/notification/?PARAM=INV0000000001&PARAM=91070&PARAM=2" -L &

