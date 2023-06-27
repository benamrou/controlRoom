
ssh hnpcen@10.200.14.231 'rm -rf /home/hnpcen/apache/apache-tomcat-5.5.27/webapps/icr/*'
rsync -avzhe ssh ./dist/* hnpcen@10.200.14.231:/home/hnpcen/apache/apache-tomcat-5.5.27/webapps/icr/
