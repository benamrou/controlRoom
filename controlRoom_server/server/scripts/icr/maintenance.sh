. /home/hnpcen/env/envCEN
date_today=`date +"%Y%m%d"`


# DUMP THE DATABASE
exp hncustom2/hncustom2@central owner=hncustom2 file=/data/hnpcen/heinensapps/backup/controlroom_$date_today.dmp > /home/hnpcen/heinensapps/controlRoom_server/scripts/icr/logs/controlroom_$date_today.log

# REMOVE 30 days more logs
sqlplus hncustom2/hncustom2@central @/home/hnpcen/heinensapps/controlRoom_server/scripts/icr/sql/maintenance.sql

# REMOVE OLD DUMP - Default 5 days
find /data/hnpcen/heinensapps/backup/  -mtime +3 -exec rm -f {} \;

# REMOVE NOHUP
find /home/hnpcen/heinensapps/controlRoom_server/ -name "nohup.out" -print -exec rm -f {} \;

# REMOVE OLD LOGS
find /home/hnpcen/heinensapps/controlRoom_server/scripts/icr/logs/admin/ -mtime +30 -exec rm -rf {} \;
find /home/hnpcen/heinensapps/controlRoom_server/scripts/icr/logs/server/ -mtime +30 -exec rm -rf {} \;
find /home/hnpcen/heinensapps/controlRoom_server/scripts/icr/logs/alerts/ -mtime +30 -exec rm -rf {} \;


# RUN PROD DB Maintenance
/home/hnpcen/heinensapps/controlRoom_server/scripts/prod/maintenance.sh 

# Save crontab
/usr/bin/crontab -l > /data/hnpcen/heinensapps/backup/crontab/crontab_$date_today.log

