module.exports = {
  log: "error",
  redis: {
    url: process.env.REDIS_URL
  },
   db: {
    maxRows: 70000,
    provider: "oracledb",
    connAttrs: {
          "user": "controlroom",
          "password": "controlroom",
          // HEINEN'S
          "connectString": "10.200.14.230/test",
          // B&B SYMPHONY
          //"connectString": "vps145391.vps.ovh.ca/croom.vps.ovh.ca",
          // S&F PERF
          //"connectString": "10.1.23.13/xe",
          //"connectString": "192.168.56.109/xe",
          //"connectString": "192.168.56.104/xe",
          //"connectString": "10.0.2.15/xe",

          //"connectString": "10.200.14.230/test",
          "poolMin": 2,
          "poolMax": 4,
          "poolIncrement": 1,
          "poolTimeout": 60,
          "maxRows": 0,
          "autocommit"  : true,   // default is false
          "_enableStats"  : false,   // default is false
          "queueRequests": false,
          "queueTimeout": 3000, // 3 seconds
          "stmtCacheSize": 100 // 40 by default
        },
    connAttrs_volume: {
      "user": "controlroom",
      "password": "controlroom",
      // HEINEN'S
      "connectString": "10.200.14.230/test",
      "poolMin": 1,
      "poolMax": 200,
      "poolTimeout": 60,
      "maxRows": 0, //value is 0, meaning unlimited
      "autocommit"  : true,   // default is false
      "_enableStats"  : false,   // default is false
      "queueRequests": false,
      "queueTimeout": 3000, // 60 seconds
      "stmtCacheSize": 100 // 40 by default
    }
 },
 server : {
   timeout: 8800000
 },
 notification: {
  email_service:  'heinens.com',
  email_host:  'smtp.heinens.com',
  email_port:  25,
  email_secure:  false,
  email_user: 'inventorycontrol@heinens.com',
  email_password: 'Warrensville4540!',
  email_private_key: '/opt/apps/controlRoom/controlRoom_server/server/config/private_key.pem',
  email_cache_dir: '/opt/apps/controlRoom/controlRoom_server/server/cache'
 },
 secret: 'bbsymphonysecret',
};
