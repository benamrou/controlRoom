
ssh hntcen@heinens-stgapp.symphonygold.com 'rm -rf /home/hntcen/apache/apache-tomcat-5.5.27/webapps/icr/*'
rsync -avzhe ssh ./dist/* hntcen@heinens-stgapp.symphonygold.com:/home/hntcen/apache/apache-tomcat-5.5.27/webapps/icr/
