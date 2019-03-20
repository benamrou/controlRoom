RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

. /home/hntcen/env/envCEN
CONTROLROOM_SERVER=/opt/apps/controlRoom/controlRoom_server/server
CONFIG_SERVER=${CONTROLROOM_SERVER}/config/admin/server

cd ${CONTROLROOM_SERVER}
# export NODE_MODULE_PATH=${CONFIG_SERVER}/node_modules/lib/node_modules/ControlRoomAdminServer/node_modules/

# Variable NODE_PATH is needed to look for the node_modules
# export NODE_PATH=${NODE_MODULE_PATH}

# DEBUG=express* nodemon server_admin.js package.json
echo -e "[${GREEN}PRE${NC}]\t Deactivating existing SERVER NODE..... \t[${GREEN}DONE${NC}]"
kill -9 `ps aux | grep server_admin | awk '{print $2}'` 
echo -e "[${GREEN}START${NC}]\t Starting SERVER NODE connecting to DB..... \t[${GREEN}DONE${NC}]"
echo -e "[${GREEN}LAST${NC}]\t Daemonizing SERVER NODE..... \t\t\t[${GREEN}DONE${NC}]"
nohup /usr/bin/nodemon server_admin.js package.json &

