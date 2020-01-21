RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

. /home/hntcen/env/envCEN
CONTROLROOM_SERVER=/opt/apps/controlRoom/controlRoom_server/server
#CONFIG_SERVER=${CONTROLROOM_SERVER}/config/admin/server

cd ${CONTROLROOM_SERVER}
# export NODE_MODULE_PATH=${CONFIG_SERVER}/node_modules/lib/node_modules/ControlRoomAdminServer/node_modules/

# Variable NODE_PATH is needed to look for the node_modules
# export NODE_PATH=${NODE_MODULE_PATH}

# DEBUG=express* nodemon server_admin.js package.json
echo -e "[${GREEN}PRE${NC}]\t Deactivating existing SERVER NODE..... \t[${GREEN}DONE${NC}]"
kill -9 `ps aux | grep server_admin.js | awk '{print $2}'` 
# 2> /dev/null
echo -e "[${GREEN}START${NC}]\t Starting SERVER NODE connecting to DB..... \t[${GREEN}DONE${NC}]"
echo -e "[${GREEN}LAST${NC}]\t Daemonizing SERVER NODE..... \t\t\t[${GREEN}DONE${NC}]"

echo -e "[${GREEN}LAST${NC}]\t - BATCH EXECUTION SERVER NODE: 8093..... \t[${GREEN}DONE${NC}]"
nohup nodemon server_admin.js package.json 8091 --ignore ./repository/ > log_node_batch_8091.txt &
echo -e "[${GREEN}LAST${NC}]\t - ALERTS EXECUTION SERVER NODE: 8092..... \t[${GREEN}DONE${NC}]"
nohup nodemon server_admin.js package.json 8092 CRON --ignore ./repository/ > log_node_alerts_8092.txt &
echo -e "[${GREEN}LAST${NC}]\t - SERVER NODE: 8090..... \t\t\t[${GREEN}DONE${NC}]"
nohup nodemon server_admin.js package.json 8090 --ignore ./repository/ > log_node_server_8090.txt &

