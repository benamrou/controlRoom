. /home/hntcen/env/envCEN
date_today=`date +"%Y%m%d"`


# DUMP THE DATABASE
exp controlroom/controlroom owner=controlroom file=/data/hntcen/icr/backup/controlroom_$date_today.dmp > /opt/apps/controlRoom/controlRoom_server/server/scripts/icr/logs/controlroom_$date_today.log

# REMOVE OLD DUMP - Default 5 days
find /data/hntcen/icr/backup/  -mtime +3 -exec rm {} \;
find /opt/apps/controlRoom/controlRoom_server/server/scripts/icr/logs/ -mtime +5 -exec rm {} \;

