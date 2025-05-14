RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

export UV_THREADPOOL_SIZE=10

. $HOME/env/envCEN
. $HOME/env/envICR

CONTROLROOM_SERVER=${ICR_SERVER}
#CONFIG_SERVER=${CONTROLROOM_SERVER}/config/admin/server
NODE_BIN=/usr/local/bin

cd ${CONTROLROOM_SERVER}
# export NODE_MODULE_PATH=${CONFIG_SERVER}/node_modules/lib/node_modules/ControlRoomAdminServer/node_modules/

# Variable NODE_PATH is needed to look for the node_modules
# export NODE_PATH=${NODE_MODULE_PATH}

# DEBUG=express* nodemon server_admin.js package.json
echo -e "[${GREEN}PRE${NC}]\t Deactivating existing SERVER NODE..... \t[${GREEN}DONE${NC}]"
kill -9 `ps aux | grep server_admin.js | awk '{print $2}'`



