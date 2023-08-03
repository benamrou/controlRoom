. /home/hnpcen/env/envICR

# sqlplus hncustom2/hncustom2@central @./sql/service.sql 

curl --location --request POST 'http://10.200.14.232:8090/api/gdrive/2/' --header 'Content-Type: multipart/form-data' --header 'User: batch' --form 'file=@"/home/hnpcen/heinensapps/controlRoom_server/scripts/dashboard/report/serviceRate_Heinens.csv"'



