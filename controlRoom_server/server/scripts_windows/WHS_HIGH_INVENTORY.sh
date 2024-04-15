
. $HOME/env/envICR

# Grocery
nohup curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" -H "SUBJECT_EXT: for Grocery whs #90061 (15 weeks inv.)" "http://localhost:8092/api/notification/?PARAM=INV0000000002&PARAM=90061&PARAM=15" -L &

# Freezer
nohup curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" -H "SUBJECT_EXT: for Freezer whs #91071 (15 weeks inv.)" "http://localhost:8092/api/notification/?PARAM=INV0000000002&PARAM=91071&PARAM=15" -L &

# Dairy
nohup curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" -H "SUBJECT_EXT: for Dairy whs #91070 (6 weeks inv.)" "http://localhost:8092/api/notification/?PARAM=INV0000000002&PARAM=91070&PARAM=6" -L &

