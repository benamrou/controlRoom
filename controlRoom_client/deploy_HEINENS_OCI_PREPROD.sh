
ssh hntcen@10.227.100.44 'rm -rf /home/hntcen/apache/apache-tomcat-5.5.27/webapps/icr/*'
rsync -avzhe ssh ./dist/* hntcen@10.227.100.44:/home/hntcen/apache/apache-tomcat-5.5.27/webapps/icr/
