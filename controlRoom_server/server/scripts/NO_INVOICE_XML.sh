
# Today's date 
today=$(date +%m-%d-%y)

sqlplus hncustom/hncustom @$HOME/heinensapps/controlRoom_server/scripts/sql/CAPTURE_NO_INVOICE_XML.sql

#sleep 1m

