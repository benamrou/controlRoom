module.exports = {
  log: "error",
  redis: {
    url: process.env.REDIS_URL
  },
  db: {
    maxRows: 50000,
    provider: "oracledb",
    connAttrs: {
          "user": "roomprod",
          "password": "roomprod",
          "connectString": "vps145391.vps.ovh.ca/croom.vps.ovh.ca",
          "poolMin": 20,
          "poolMax": 20,
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
          "maxRows": 0, // value is 0, meaning unlimited
          "autocommit"  : true,   // default is false
          "_enableStats"  : false,   // default is false
          "queueRequests": false,
          "queueTimeout": 0, // 60 seconds
          "stmtCacheSize": 40
        }
  }
};
