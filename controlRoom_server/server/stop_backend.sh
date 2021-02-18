RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# . /home/hntcen/env/envCEN
# . /home/hntcen/env/envICR

CONTROLROOM_SERVER=/Users/bbsymphony/Workspace/controlRoom/controlRoom_server/server
#CONTROLROOM_SERVER=/opt/apps/controlRoom/controlRoom_server/server
#CONFIG_SERVER=${CONTROLROOM_SERVER}/config/admin/server

cd ${CONTROLROOM_SERVER}
# export NODE_MODULE_PATH=${CONFIG_SERVER}/node_modules/lib/node_modules/ControlRoomAdminServer/node_modules/

# Variable NODE_PATH is needed to look for the node_modules
# export NODE_PATH=${NODE_MODULE_PATH}

# DEBUG=express* nodemon server_admin.js package.json
echo -e "[${GREEN}PRE${NC}]\t Deactivating existing SERVER NODE..... \t[${GREEN}DONE${NC}]"
kill -9 `ps aux | grep forever | awk '{print $2}'`
kill -9 `ps aux | grep server_admin.js | awk '{print $2}'`
echo -e "[${GREEN}PRE${NC}]\t Backend closed..... \t[${GREEN}DONE${NC}]"
