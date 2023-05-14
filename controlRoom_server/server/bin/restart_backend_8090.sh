RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

. /home/hntcen/env/envCEN
. /home/hntcen/env/envICR

CONTROLROOM_SERVER=/opt/apps/controlRoom/controlRoom_server/server
BIN=/usr/local/bin/
NODE_BIN=/usr/local/bin

cd ${CONTROLROOM_SERVER}
ls
# Variable NODE_PATH is needed to look for the node_modules

# DEBUG=express* nodemon server_admin.js package.json
echo -e "[${GREEN}PRE${NC}]\t Deactivating existing SERVER NODE..... \t[${GREEN}DONE${NC}]"
kill -9 `ps aux | grep 8090 | awk '{print $2}'`

echo -e "[${GREEN}LAST${NC}]\t - SERVER NODE: 8090..... \t\t\t[${GREEN}DONE${NC}]"
${NODE_BIN}/node --use-strict --expose-gc --optimize-for-size server_admin.js  8090 > ./logs/server/out_server.log 2> ./logs/server/err_server.log 

