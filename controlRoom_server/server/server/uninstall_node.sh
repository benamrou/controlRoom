#!/bin/bash

sudo yum remove -y nodejs
sudo rm -rf /var/cache/yum
sudo rm /etc/yum.repos.d/nodesource*
sudo yum clean all

sudo rm -rfv /usr/bin/node /usr/local/bin/node /usr/share/man/man1/node.1.gz
sudo rm -rfv /usr/bin/npm /usr/local/bin/npm /usr/share/man/man1/npm.1.gz
sudo rm -rfv /usr/local/bin/npx
sudo rm -rfv /usr/local/lib/node*
sudo rm -rfv /usr/local/include/node*
sudo rm -rfv /usr/lib/node_modules/
rm -rf ~/.nvm
rm -rf ~/.npm

