
ssh hnpcen@10.227.100.43 'rm -rf /home/hnpcen/apache/apache-tomcat-5.5.27/webapps/icr/*'
rsync -avzhe ssh ./dist/* hnpcen@10.227.100.43:/home/hnpcen/apache/apache-tomcat-5.5.27/webapps/icr/
