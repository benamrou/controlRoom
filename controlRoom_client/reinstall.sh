rm -rf node_modules
rm -f package-lock.json

# 👇️ clean npm cache
npm cache clean --force
# npm i --legacy-peer-deps
npm i 

