sudo fallocate -l 0.5G /swapfile #Create a 4 gigabyte swapfile
sudo chmod 600 /swapfile #Secure the swapfile by restricting access to root
sudo mkswap /swapfile #Mark the file as a swap space
sudo swapon /swapfile #Enable the swap
echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab #Persist swapfile over reboots
