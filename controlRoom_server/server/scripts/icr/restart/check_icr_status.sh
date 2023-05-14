#=======================================================================================================================================*
#                       CHECK GWR SERVER STATUS                                                                                         *
# Date: January 2023
# ICR is deployed on Apahe Tomee apoplication using port number 8090                                                                    *
#=======================================================================================================================================*

. /home/hntcen/env/envCEN

# Logs are in /data/hntcen/icr/restart/restart.log

IP_ADDRESS=10.200.14.232
PORT=8090
PORT_ALERT=8091
PORT_CRON=8092

HTTP_REQUEST_OK="200"
HTTP_FAILED_CONNECTION="Failed"

# ICR SERVER

cd /opt/apps/controlRoom/controlRoom_server/server/scripts/icr/restart
response=$(curl -s --write-out "%{http_code}\n" --location --request GET "http://${IP_ADDRESS}:${PORT}/api/item/?PARAM=33777" \
--header "Content-type: Application/json; charset=UTF-8" \
--header "USER: alert" \
--header "DATABASE_SID: HEINENS_CEN_UAT, HEINENS_STK_UAT" \
--header "LANGUAGE: HN") 

wait $!
ERROR_NUM="errorNum"

# echo $response

if [[ "$response" != *"$HTTP_REQUEST_OK"*  ||  "$response" =~ ${ERROR_NUM} ]]; then
	echo "Server down: " ${PORT} `date` >> /data/hntcen/icr/restart/restart_icr.log
        echo $response `date` >> /data/hntcen/icr/restart/restart_icr.log
	# /opt/apps/controlRoom/controlRoom_server/server/bin/restart_backend_8090.sh
        /opt/apps/controlRoom/controlRoom_server/server/start_backend.sh
	exit 1
fi

response=$(curl -s --write-out "%{http_code}\n" --location --request GET "http://${IP_ADDRESS}:${PORT_CRON}/api/item/?PARAM=33777" \
--header "Content-type: Application/json; charset=UTF-8" \
--header "USER: alert" \
--header "DATABASE_SID: HEINENS_CEN_UAT, HEINENS_STK_UAT" \
--header "LANGUAGE: HN")

wait $!

# echo $response

if [[ "$response" != *"$HTTP_REQUEST_OK"* ||  "$response" =~ ${ERROR_NUM} ]]; then
	echo "Server down: " ${PORT_CRON} `date` >> /data/hntcen/icr/restart/restart_icr.log
        echo $response `date` >> /data/hntcen/icr/restart/restart_icr.log
	#/opt/apps/controlRoom/controlRoom_server/server/bin/restart_backend_8092.sh
        /opt/apps/controlRoom/controlRoom_server/server/start_backend.sh
	exit 1
fi

response=$(curl -s --write-out "%{http_code}\n" --location --request GET "http://${IP_ADDRESS}:${PORT_ALERT}/api/item/?PARAM=33777" \
--header "Content-type: Application/json; charset=UTF-8" \
--header "USER: alert" \
--header "DATABASE_SID: HEINENS_CEN_UAT, HEINENS_STK_UAT" \
--header "LANGUAGE: HN")

wait $!

# echo $response

if [[ "$response" != *"$HTTP_REQUEST_OK"* ||  "$response" =~ ${ERROR_NUM} ]]; then
	echo "Server down: " ${PORT_ALERT} `date` >> /data/hntcen/icr/restart/restart_icr.log
        echo $response `date` >> /data/hntcen/icr/restart/restart_icr.log
        # /opt/apps/controlRoom/controlRoom_server/server/bin/restart_backend_8091.sh
        /opt/apps/controlRoom/controlRoom_server/server/start_backend.sh
	exit 1
fi

echo "Server up .... " `date` >> /data/hntcen/icr/restart/restart_icr.log
exit 0
