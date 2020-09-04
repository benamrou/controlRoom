
ssh hntgwr@10.200.14.232 'rm -rf /home/hntgwr/apache-tomee-webprofile-1.7.3/webapps/icr/*'
rsync -avzhe ssh ./dist/* hntgwr@10.200.14.232:/home/hntgwr/apache-tomee-webprofile-1.7.3/webapps/icr/
