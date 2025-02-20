
# Today's date 
today=$(date +%m-%d-%y)
echo `date` >> no_po..txt
sqlplus hncustom/hncustom @sql/CAPTURE_NO_PO_XML.sql

#sleep 1m

#curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" -H "FILENAME_EXT:POXML_Missing_${today}.xlsx" "http://localhost:8092/api/notification/?PARAM=ORD0000000008" -L
