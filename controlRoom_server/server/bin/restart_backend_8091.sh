RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

. $HOME/env/envCEN
. $HOME/env/envICR

CONTROLROOM_SERVER=$HOME/heinensapps/controlRoom_server
BIN=/usr/local/bin/

cd ${CONTROLROOM_SERVER}

# Variable NODE_PATH is needed to look for the node_modules

# DEBUG=express* nodemon server_admin.js package.json
echo -e "[${GREEN}PRE${NC}]\t Deactivating existing SERVER NODE..... \t[${GREEN}DONE${NC}]"
kill -9 `ps aux | grep 8091 | awk '{print $2}'`
echo -e "[${GREEN}LAST${NC}]\t - SERVER NODE: 8091..... \t\t\t[${GREEN}DONE${NC}]"
#nohup forever start -o ./logs/server/out_server.log -e ./logs/server/err_server.log -c /usr/local/bin/node server_admin.js package.json 8091 --exitcrash &

