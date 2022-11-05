. /home/hntcen/env/envCEN
date_today=`date +"%Y%m%d"`

# RUN PROD DB Maintenance
sqlplus controlroom/controlroom @/opt/apps/controlRoom/controlRoom_server/server/scripts/prod/sql/maintenance.sql
