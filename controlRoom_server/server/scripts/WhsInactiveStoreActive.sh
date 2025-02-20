
# Today's date 
today=$(date +%m-%d-%y)

curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" -H "SUBJECT_EXT: for Dairy Warehouse #91070" -H "FILENAME_EXT:Dairy_disc_items_${today}.xlsx" "http://localhost:8092/api/notification/?PARAM=WHS0000000009&PARAM=91070" -L 


curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" -H "SUBJECT_EXT: for Freezer Warehouse #91071" -H "FILENAME_EXT:Frozen_disc_items_${today}.xlsx" "http://localhost:8092/api/notification/?PARAM=WHS0000000009&PARAM=91071" -L


sleep 3s

curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" -H "SUBJECT_EXT: for Grocery Warehouse #90061" -H "FILENAME_EXT:Grocery_disc_items_${today}.xlsx" "http://localhost:8092/api/notification/?PARAM=WHS0000000009&PARAM=90061" -L 

curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" -H "SUBJECT_EXT: for Meat Warehouse #91072" -H "FILENAME_EXT:Meat_disc_items_${today}.xlsx" "http://localhost:8092/api/notification/?PARAM=WHS0000000009&PARAM=91072" -L 

sleep 3s
curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" -H "SUBJECT_EXT: for Manufacturing Warehouse #93080" -H "FILENAME_EXT:MFG_disc_items_${today}.xlsx" "http://localhost:8092/api/notification/?PARAM=WHS0000000009_1&PARAM=93080" -L

curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" -H "SUBJECT_EXT: for Grocery Warehouse #90061" -H "FILENAME_EXT:Grocery_disc_items_${today}.xlsx" "http://localhost:8092/api/notification/?PARAM=WHS0000000009_2&PARAM=90061" -L


