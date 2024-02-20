. $HOME/env/envCEN
date_today=`date +"%Y%m%d"`

# RUN PROD DB Maintenance
sqlplus $ICRUSERID@central $HOME/heinensapps/controlRoom_server/scripts/prod/sql/maintenance.sql

# Save crontab
/usr/bin/crontab -l > $HOME/heinensapps/controlRoom_server/scripts/prod/crontab_$date_today.log
