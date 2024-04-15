
. $HOME/env/envICR

sqlplus $ICRUSERID@central @$HOME/heinensapps/controlRoom_server/scripts/sql/FILL_RATE/DAILY_FILL_RATE_CAPTURE.sql > $HOME/heinensapps/controlRoom_server/scripts/logs/DAILY_FILL_RATE_CAPTURE.log
