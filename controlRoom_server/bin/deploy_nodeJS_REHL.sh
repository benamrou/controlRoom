
# Remove old repo for nodeJs
sudo rm -fv /etc/yum.repos.d/nodesource*

# Install nodeJs package
curl -fsSL https://rpm.nodesource.com/setup_16.x | sudo bash -
sudo yum install -y nodejs

# Install n (npm) and switch to the wanted version
sudo npm install -g n
n 17.9.1
