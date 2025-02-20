. $HOME/env/envCEN
date_today=`date +"%Y%m%d"`


# DUMP THE DATABASE
exp hncustom2/hncustom2@central owner=hncustom2 file=/data/hnpcen/heinensapps/backup/controlroom_$date_today.dmp > $HOME/heinensapps/controlRoom_server/scripts/icr/logs/controlroom_$date_today.log

# REMOVE 30 days more logs
sqlplus hncustom2/hncustom2@central @$HOME/heinensapps/controlRoom_server/scripts/icr/sql/maintenance.sql

# REMOVE OLD DUMP - Default 3 ays
find /data/hnpcen/heinensapps/backup/  -mtime +1 -exec rm -f {} \;

# REMOVE NOHUP
find $HOME/heinensapps/controlRoom_server/ -name "nohup.out" -print -exec rm -f {} \;

# REMOVE OLD LOGS
find $HOME/heinensapps/controlRoom_server/logs/admin/ -mtime +7 -exec rm -rf {} \;
find $HOME/heinensapps/controlRoom_server/logs/server/ -mtime +7 -exec rm -rf {} \;
find $HOME/heinensapps/controlRoom_server/logs/alerts/ -mtime +7 -exec rm -rf {} \;
find $HOME/bin/shell/ -name "*nohup*" -exec rm -f "{}" \;
find $HOME/heinensapps/controlRoom_server/ -name "*.log" -mtime +2 -exec rm -f {} \;

# RUN PROD DB Maintenance
$HOME/heinensapps/controlRoom_server/scripts/prod/maintenance.sh 

# Save crontab
/usr/bin/crontab -l > /data/hnpcen/heinensapps/backup/crontab/crontab_$date_today.log

