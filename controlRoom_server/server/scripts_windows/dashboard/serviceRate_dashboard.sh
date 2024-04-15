. $HOME/env/envICR

# sqlplus $ICRUSERID@central @./sql/service.sql 

curl --location --request POST 'http://10.200.14.232:8090/api/gdrive/2/' --header 'Content-Type: multipart/form-data' --header 'User: batch' --form 'file=@"$HOME/heinensapps/controlRoom_server/scripts/dashboard/report/serviceRate_Heinens.csv"'



