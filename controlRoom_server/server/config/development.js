module.exports = {
  log: "error",
  redis: {
    url: process.env.REDIS_URL
  },
   db: {
    maxRows: 5000,  // Batch size for cursor fetching
    provider: "oracledb",
    connAttrs: {
        // HEINEN'S - TEST
              //"user": "controlroom",
              //"password": "controlroom",
        //"connectString": "10.200.14.230/test",
              // HEINEN'S - PROD
        "user": "hncustom2",
        "password": "hncustom2",
        "connectString": "10.227.100.85/central",
        "poolMin": 2,
        "poolMax": 10,              // High capacity
        "poolIncrement": 1,
        "poolTimeout": 300,
        "maxRows": 5000,
        "autocommit": true,
        "queueRequests": true,      // Queue instead of failing
        "queueMax": 50,            // Allow 500 in queue
        "queueTimeout": 120000,     // 2 minutes max wait
        "stmtCacheSize": 100,
        "enableStatistics": true
      },
    connAttrs_volume: {
      //"user": "controlroom",
      //"password": "controlroom",
      //"connectString": "10.200.14.230/test",
      // HEINEN'S
      "user": "hncustom2",
      "password": "hncustom2",
      "connectString": "10.227.100.85/central",
      "poolMin": 1,
      "poolMax": 5,
      "poolTimeout": 60,
      "maxRows": 0, //value is 0, meaning unlimited
      "autocommit"  : true,   // default is false
      "_enableStats"  : false,   // default is false
      "queueRequests": false,
      "queueTimeout": 120000,     // 2 minutes max wait
      "stmtCacheSize": 100 // 40 by default
    }
 },
 server : {
   timeout: 8800000
 },
 notification: {
  email_service:  'heinens.com',
  //email_host:  'smtp.heinens.com',
  email_host: '10.227.101.214',
  email_port:  25,
  email_secure:  false,
  email_user: 'inventorycontrol@heinens.com',
  email_password: 'Warrensville4540!',
  email_private_key: '/home/hnpcen/heinensapps/controlRoom_server/config/private_key.pem',
  email_cache_dir: '/home/hnpcen/heinensapps/controlRoom_server/cache'
 },
 secret: 'bbsymphonysecret',
};
