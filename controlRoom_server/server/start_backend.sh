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

echo -e "[${GREEN}START${NC}]\t Starting SERVER NODE connecting to DB..... \t[${GREEN}DONE${NC}]"
echo -e "[${GREEN}LAST${NC}]\t Daemonizing SERVER NODE..... \t\t\t[${GREEN}DONE${NC}]"

echo -e "[${GREEN}LAST${NC}]\t - BATCH EXECUTION SERVER NODE: 8091..... \t[${GREEN}DONE${NC}]"
nohup ${NODE_BIN}/node --use-strict --expose-gc --optimize-for-size server_admin.js  8091 > ./logs/server/out_batch.log 2> ./logs/server/err_batch.log &

echo -e "[${GREEN}LAST${NC}]\t - ALERTS EXECUTION SERVER NODE: 8092..... \t[${GREEN}DONE${NC}]"
# nohup ${NODE_BIN}/node --use-strict --expose-gc --no-warnings --max-old-space-size=500 --optimize-for-size --inspect=0.0.0.0:9222 server_admin.js 8092 CRONTAB  > ./logs/server/out_crontab.log 2> ./logs/server/err_crontab.log &

nohup ${NODE_BIN}/node --use-strict --expose-gc --optimize-for-size server_admin.js 8092 CRONTAB  > ./logs/server/out_crontab.log 2> ./logs/server/err_crontab.log &

echo -e "[${GREEN}LAST${NC}]\t - SERVER NODE: 8093..... \t\t\t[${GREEN}DONE${NC}]"
nohup ${NODE_BIN}/node --use-strict --expose-gc --optimize-for-size server_admin.js  8093 > ./logs/server/out_server.log 2> ./logs/server/err_server.log &

