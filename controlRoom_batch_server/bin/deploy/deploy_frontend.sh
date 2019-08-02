
# *****************************************************************************
#
# Control room deployment script
# This script is deploying the FRONTEND of the ADMIN solution
#
# Date: January, 2017
# Author: Ahmed Benamrouche
#
# ******************************************************************************

#CONTROLROOM=$HOME/controlroom
CONTROLROOM=$HOME/Workspace/controlRoom/admin
CONFIG_CLIENT=${CONTROLROOM}/config/admin/client
 

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
DARK_GRAY='\033[1;30m'
BROWN='\033[0;33m'
NC='\033[0m' # No Color

cd ${CONTROLROOM}	

echo -e "${PURPLE}[`date +"%r"`] ${DARK_GRAY} FRONTEND ADMIN solution deployment.... \t\t\t${GREEN} [BEGIN]"

# npm config set global true
# npm config set prefix ${CONFIG_CLIENT}/node_modules
export NODE_MODULE_PATH=${CONFIG_CLIENT}/node_modules
#export NODE_PATH=${CONFIG_CLIENT}/node_modules;${NODE_PATH}

npm install --save 
echo -e "${PURPLE}[`date +"%r"`] ${DARK_GRAY} FRONTEND ADMIN solution deployment.... \t\t\t${GREEN} [DEPLOYED]"