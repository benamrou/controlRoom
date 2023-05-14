RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;43m'
NC='\033[0m' # No Color

. /home/hntcen/env/envCEN
. /home/hntcen/env/envICR

cd ${ICR_SERVER}/views/

echo -e "[${YELLOW}START${NC}]\t Starting process for view refresh..... `date` \t[${YELLOW}IN PROGRESS${NC}]"
sqlplus controlroom/controlroom @./sql/refresh_daily_view.sql >> refresh_daily_view.log
./email.sh "DAILY VIEW REFRESH refreshed completer" "DAILY Materialized view has been refreshed."
