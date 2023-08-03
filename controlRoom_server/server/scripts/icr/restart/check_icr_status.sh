#=======================================================================================================================================*
#                       CHECK GWR SERVER STATUS                                                                                         *
# Date: January 2023
# ICR is deployed on Apahe Tomee apoplication using port number 8090                                                                    *
#=======================================================================================================================================*

. /home/hnpcen/env/envCEN

# Logs are in /data/hnpcen/heinensapps/restart/restart.log

IP_ADDRESS=10.200.14.231
PORT=8093
PORT_ALERT=8091
PORT_CRON=8092

HTTP_REQUEST_OK="200"
HTTP_FAILED_CONNECTION="Failed"

# ICR SERVER

cd /home/hnpcen/heinensapps/controlRoom_server/scripts/icr/restart
response=$(curl -s --write-out "%{http_code}\n" --location --request GET "http://${IP_ADDRESS}:${PORT}/api/item/?PARAM=33777" \
--header "Content-type: Application/json; charset=UTF-8" \
--header "USER: alert" \
--header "DATABASE_SID: HEINENS_CEN_UAT, HEINENS_STK_UAT" \
--header "LANGUAGE: HN") 

wait $!
ERROR_NUM="errorNum"

# echo $response

if [[ "$response" != *"$HTTP_REQUEST_OK"*  ||  "$response" =~ ${ERROR_NUM} ]]; then
	echo "Server down: " ${PORT} `date` >> /data/hnpcen/heinensapps/restart/restart_icr.log
        echo $response `date` >> /data/hnpcen/heinensapps/restart/restart_icr.log
	/home/hnpcen/heinensapps/controlRoom_server/start_backend.sh
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
	echo "Server down: " ${PORT_CRON} `date` >> /data/hnpcen/heinensapps/restart/restart_icr.log
        echo $response `date` >> /data/hnpcen/heinensapps/restart/restart_icr.log
        /home/hnpcen/heinensapps/controlRoom_server/start_backend.sh
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
	echo "Server down: " ${PORT_ALERT} `date` >> /data/hnpcen/heinensapps/restart/restart_icr.log
        echo $response `date` >> /data/hnpcen/heinensapps/restart/restart_icr.log
        /home/hnpcen/heinensapps/controlRoom_server/start_backend.sh
	exit 1
fi

echo "Server up .... " `date` >> /data/hnpcen/heinensapps/restart/restart_icr.log
exit 0
