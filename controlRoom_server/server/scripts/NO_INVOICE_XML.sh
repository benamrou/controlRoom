
# Today's date 
today=$(date +%m-%d-%y)

sqlplus hncustom/hncustom @sql/CAPTURE_NO_INVOICE_XML.sql

#sleep 1m

