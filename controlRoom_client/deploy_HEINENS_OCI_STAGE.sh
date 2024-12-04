
ssh hntcen@heinens-stgapp.symphonygold.com 'rm -rf /home/hntcen/apache/apache-tomcat-5.5.27/webapps/icr/*'
rsync -avzhe ssh ./dist/* hntcen@heinens-stgapp.symphonygold.com:/home/hntcen/apache/apache-tomcat-5.5.27/webapps/icr/


#ssh hnpcen@heinens.symphonygold.com 'rm -rf /home/hnpcen/apache/apache-tomcat-5.5.27/webapps/icr/*'
#rsync -avzhe ssh ./dist/* hnpcen@heinens.symphonygold.com:/home/hnpcen/apache/apache-tomcat-5.5.27/webapps/icr/

