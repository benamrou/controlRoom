RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;43m'
NC='\033[0m' # No Color

. $HOME/env/envCEN
. $HOME/env/envICR
cd ${ICR_SERVER}/views/

echo -e "[${YELLOW}START${NC}]\t Starting process for view refresh..... `date` \t[${YELLOW}IN PROGRESS${NC}]"
kill -9 `ps aux | grep refresh_hourly_view.sql | awk '{print $2}'`

# sqlplus hncustom2/hncustom2@central @./sql/refresh_hourly_view.sql
echo -e "[${GREEN}END${NC}]\ View dashboard sale and margin deployed MV_DSHPI00001..... `date` \t[${GREEN}IN PROGRESS${NC}]"
./email.sh "HOURLY VIEW recalculation refreshed" "Materialized view MV_DSHPI000001 has been refreshed."
