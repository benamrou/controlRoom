
CONTROLROOM=$HOME/Workspace/controlRoom/admin
CONFIG_CLIENT=${CONTROLROOM}/config/admin/client

export NODE_MODULE_PATH=${CONFIG_CLIENT}/node_modules/lib/node_modules/ControlRoomAdminClient/node_modules/

# Variable NODE_PATH is needed to look for the node_modules
export NODE_PATH=${NODE_MODULE_PATH}

npm set prefix=${CONFIG_CLIENT}/node_modules
# cd ${CONTROLROOM}
# npm start --prefix ${NODE_MODULE_PATH}/../
# nodemon ${CONTROLROOM}/server_client.js ${CONFIG_CLIENT}/package.json
