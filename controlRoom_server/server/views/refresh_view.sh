RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;43m'
NC='\033[0m' # No Color

. /home/hntcen/env/envCEN
cd ${CONTROLROOM_SERVER}/views/

echo -e "[${YELLOW}START${NC}]\t Starting process for view refresh..... `date` \t[${YELLOW}IN PROGRESS${NC}]"
sqlplus controlroom/controlroom @./sql/refresh_view.sql
echo -e "[${GREEN}END${NC}]\ View dashboard sale and margin deployed MV_DSHSAL000001..... `date` \t[${GREEN}IN PROGRESS${NC}]"
./email.sh "MV_DSHSAL000001 refreshed" "Materialized view MV_DSHSAL000001 has been refreshed."
