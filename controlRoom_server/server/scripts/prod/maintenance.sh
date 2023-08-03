. /home/hnpcen/env/envCEN
date_today=`date +"%Y%m%d"`

# RUN PROD DB Maintenance
sqlplus hncustom2/hncustom2@central /home/hnpcen/heinensapps/controlRoom_server/scripts/prod/sql/maintenance.sql

# Save crontab
/usr/bin/crontab -l > /home/hnpcen/heinensapps/controlRoom_server/scripts/prod/crontab_$date_today.log
