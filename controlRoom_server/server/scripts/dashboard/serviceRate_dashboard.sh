. /home/hntcen/env/envICR

# sqlplus controlroom/controlroom @./sql/service.sql 

curl --location --request POST 'http://10.200.14.232:8090/api/gdrive/2/' --header 'Content-Type: multipart/form-data' --header 'User: batch' --form 'file=@"/opt/apps/controlRoom/controlRoom_server/server/scripts/dashboard/report/serviceRate_Heinens.csv"'


