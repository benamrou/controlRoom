module.exports = {
  log: "error",
  redis: {
    url: process.env.REDIS_URL
  },
   db: {
    maxRows: 0,
    provider: "oracledb",
    connAttrs: {
          //"user": "controlroom",
          //"password": "controlroom",
          //"connectString": "10.200.14.230/test",
          // HEINEN'S
          "user": "hncustom2",
          "password": "hncustom2",
          "connectString": "10.227.100.85/central",
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
          "maxRows": 0,
          "autocommit"  : true,   // default is false
          "_enableStats"  : false,   // default is false
          "queueRequests": false,
          "queueTimeout": 0, // 60 seconds
          "stmtCacheSize": 0 // 40 by default
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
      "poolMax": 200,
      "poolTimeout": 0,
      "maxRows": 0, //value is 0, meaning unlimited
      "autocommit"  : true,   // default is false
      "_enableStats"  : false,   // default is false
      "queueRequests": false,
      "queueTimeout": 0, // 60 seconds
      "stmtCacheSize": 0 // 40 by default
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
