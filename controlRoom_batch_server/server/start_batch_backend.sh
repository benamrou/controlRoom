RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

. /home/hntcen/env/envCEN

# CONTROLROOM_BATCH_SERVER=/opt/apps/controlRoom/controlRoom_batch_server/server
# CONFIG_BATCH_SERVER=${CONTROLROOM_BATCH_SERVER}/config/admin/server

# cd ${CONTROLROOM_BATCH_SERVER}
# Variable NODE_PATH is needed to look for the node_modules
# export NODE_PATH=${NODE_MODULE_PATH}

# DEBUG=express* nodemon server_admin.js package.json
echo -e "[${GREEN}PRE${NC}]]\t Deactivating existing BATCH NODE..... \t\t\t[${GREEN}DONE${NC}]"
kill -9 `ps aux | grep server_batch_admin | awk '{print $2}'`
echo -e "[${GREEN}START${NC}]\t Starting SERVER BATCH NODE connecting to DB..... \t[${GREEN}DONE${NC}]"
echo -e "[${GREEN}LAST${NC}]\t Daemonizing SERVER BATCH NODE..... \t\t\t[${GREEN}DONE${NC}]"
nodemon server_batch_admin.js package.json 
