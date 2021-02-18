#curl -X POST -L -H "Authorization: Bearer ya29.A0AfH6SMC1ejON5pvnVo4SoWaOILlofmf-voAC9gyTq9Nr6UDwu1oZUNQ3rG92BkVJhmryObrJS2TWGQFxryxS2fNiFtQaXaCNxYiCriCYs53L4AKmvaKtBL7AdIEp080DiXn9fdvNp8CcJmqeOje9TEKU9pai" -H "Content-Type: text/csv"  --data-binary report/serviceRate_Heinens.csv https://drive.google.com/drive/folders/11csQp5Mnix1Nl0X4AIBNiZ90YKJT3Wac



#!/bin/bash

# Upload a file to Google Drive
#
# Usage: upload.sh <access_token> <file> [title] [path] [mime]

set -e

ACCESS_TOKEN=$1
BOUNDARY=`cat /dev/urandom | head -c 16 | xxd -ps`
MIME_TYPE=${5:-"application/octet-stream"}

( echo -en "--$BOUNDARY\nContent-Type: application/json; charset=UTF-8\n\n{ \"title\": \"$3\", \"parents\": [ { \"id\": \"$4\" } ] }\n\n--$BOUNDARY\nContent-Type: $MIME_TYPE\n\n" \
&& cat $2 && echo -en "\n\n--$BOUNDARY--\n" ) \
	| curl -v "https://www.googleapis.com/upload/drive/v2/files/?uploadType=multipart" \
	--header "Authorization: Bearer $ACCESS_TOKEN" \
	--header "Content-Type: multipart/related; boundary=\"$BOUNDARY\"" \
	--data-binary "@-"
