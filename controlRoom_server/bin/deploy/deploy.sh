
# *****************************************************************************
#
# Control room deployment script
# This script is deploying the FRONTEND and BACKEND of the ADMIN solution
#
# Date: January, 2017
# Author: Ahmed Benamrouche
#
# ******************************************************************************

#CONTROLROOM=$HOME/controlroom

CONTROLROOM=$HOME/Workspace/controlRoom/admin

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
DARK_GRAY='\033[1;30m'
BROWN='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${PURPLE}[`date +"%r"`] ${DARK_GRAY} CONTROL ROOM deployment.... \t\t\t\t${GREEN} [BEGIN]"

# CONFIG file to identify the node_modules folder. Node.js is requiring to have it in the $HOME folder
echo -e ${CONTROLROOM}/config/.npmrc
cp ${CONTROLROOM}/config/.npmrc ${HOME}/

./deploy_backend.sh

echo -e "${PURPLE}[`date +"%r"`] ${DARK_GRAY} CONTROL ROOM deployment.... \t\t\t\t${GREEN} [END]"
