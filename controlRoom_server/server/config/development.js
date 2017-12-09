module.exports = {
  log: "error",
  redis: {
    url: process.env.REDIS_URL
  },
   db: {
    maxRows: 20000,
    provider: "oracledb",
    connAttrs: {
          "user": "controlroom",
          "password": "controlroom",
          //"connectString": "10.0.2.4/xe",
          //"connectString": "10.0.2.15/xe",
          //"connectString": "127.0.0.1/xe",
          //"connectString": "169.254.234.153/xe",
          //"connectString": "169.254.209.87/xe",
          "connectString": "192.168.56.101/xe",
          //"connectString": "164.208.144.227/xe",
          "poolMin": 1,
          "poolMax": 20,
          "poolTimeout": 60,
          "maxRows": 20000,
          "autocommit"  : true,   // default is false
          "_enableStats"  : true,   // default is false
          "queueRequests": false,
          "queueTimeout": 10000, // 60 seconds
          "stmtCacheSize": 40
        }
 },
 secret: 'bbsymphonysecret',
};