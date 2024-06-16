
ssh hnpcen@10.227.100.75 'rm -rf /home/hnpcen/apache/apache-tomcat-5.5.27/webapps/icr/*'
rsync -avzhe ssh ./dist/* hnpcen@10.227.100.75:/home/hnpcen/apache/apache-tomcat-5.5.27/webapps/icr/
