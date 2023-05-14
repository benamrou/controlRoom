. /home/hntcen/env/envCEN
date_today=`date +"%Y%m%d"`


# DUMP THE DATABASE
exp controlroom/controlroom owner=controlroom file=/data/hntcen/icr/backup/controlroom_$date_today.dmp > /opt/apps/controlRoom/controlRoom_server/server/scripts/icr/logs/controlroom_$date_today.log

# REMOVE 30 days more logs
sqlplus controlroom/controlroom @/opt/apps/controlRoom/controlRoom_server/server/scripts/icr/sql/maintenance.sql

# REMOVE OLD DUMP - Default 5 days
find /data/hntcen/icr/backup/  -mtime +3 -exec rm -f {} \;

# REMOVE NOHUP
find /opt/apps/controlRoom/controlRoom_server/server/ -name "nohup.out" -print -exec rm -f {} \;

# REMOVE OLD LOGS
find /opt/apps/controlRoom/controlRoom_server/server/scripts/icr/logs/admin/ -mtime +30 -exec rm -rf {} \;
find /opt/apps/controlRoom/controlRoom_server/server/scripts/icr/logs/server/ -mtime +30 -exec rm -rf {} \;
find /opt/apps/controlRoom/controlRoom_server/server/scripts/icr/logs/alerts/ -mtime +30 -exec rm -rf {} \;


# RUN DB Maintenance
sqlplus controlroom/controlroom @/opt/apps/controlRoom/controlRoom_server/server/scripts/icr/sql/maintenance.sql

# RUN PROD DB Maintenance
/opt/apps/controlRoom/controlRoom_server/server/scripts/prod/maintenance.sh 
