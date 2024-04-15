
. $HOME/env/envICR

sqlplus $ICRUSERID@central @$HOME/heinensapps/controlRoom_server/scripts/sql/SERVICE_RATE/DAILY_SERVICE_RATE_CAPTURE.sql  > $HOME/heinensapps/controlRoom_server/scripts/logs/DAILY_SERVICE_RATE_CAPTURE.log
