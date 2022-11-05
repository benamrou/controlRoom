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
          "poolMin": 1,
          "poolMax": 200,
          "poolTimeout": 0,
          "maxRows": 70000,
          "autocommit"  : true,   // default is false
          "_enableStats"  : false,   // default is false
          "queueRequests": false,
          "queueTimeout": 0, // 60 seconds
          "stmtCacheSize": 40
        },
    connAttrs_volume: {
      "user": "controlroom",
      "password": "controlroom",
      // HEINEN'S
      "connectString": "10.200.14.230/test",
      "poolMin": 1,
      "poolMax": 200,
      "poolTimeout": 0,
      "maxRows": 0, //value is 0, meaning unlimited
      "autocommit"  : true,   // default is false
      "_enableStats"  : false,   // default is false
      "queueRequests": false,
      "queueTimeout": 0, // 60 seconds
      "stmtCacheSize": 40
    }
 },
 server : {
   timeout: 8800000
 },
 notification: {
  email_service:  'bbsymphony.com',
  email_host:  'ehub43.webhostinghub.com',
  email_port:  587,
  email_secure:  false,
  email_user: 'heinens@bbsymphony.com',
  email_password: 'bbsymphony1!1!',
  email_private_key: '/opt/apps/controlRoom/controlRoom_server/server/config/private_key.pem',
  email_cache_dir: '/opt/apps/controlRoom/controlRoom_server/server/cache'
 },
 secret: 'bbsymphonysecret',
};
