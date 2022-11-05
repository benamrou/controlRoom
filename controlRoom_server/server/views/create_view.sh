RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;43m'
NC='\033[0m' # No Color

. /home/hntcen/env/envCEN
CONTROLROOM_SERVER=/opt/apps/controlRoom/controlRoom_server/server
#CONFIG_SERVER=${CONTROLROOM_SERVER}/config/admin/server

cd ${CONTROLROOM_SERVER}/views/
# export NODE_MODULE_PATH=${CONFIG_SERVER}/node_modules/lib/node_modules/ControlRoomAdminServer/node_modules/

# Variable NODE_PATH is needed to look for the node_modules
# export NODE_PATH=${NODE_MODULE_PATH}

echo -e "[${YELLOW}START${NC}]\t Starting process for view creation..... `date` \t[${YELLOW}IN PROGRESS${NC}]"
# sqlplus controlroom/controlroom @./sql/dshpi000001.sql
echo -e "[${GREEN}END${NC}]\ View dashboard PI deployed DSHPI000001..... `date` \t[${GREEN}IN PROGRESS${NC}]"
# sqlplus controlroom/controlroom @./sql/dshpi000002.sql
echo -e "[${GREEN}END${NC}]\ View dashboard PI deployed DSHPI000002..... `date` \t[${GREEN}IN PROGRESS${NC}]"
sqlplus controlroom/controlroom @./sql/mv_sales.sql
./email.sh "DSHPI000001 & DSHPI000002 & MV_SALES completed" "The Materialized view has been refreshed."

