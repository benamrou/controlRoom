module.exports = {
  log: "error",
  redis: {
    url: process.env.REDIS_URL
  }
  db: {
    maxRows: 20000,
    provider: "oracledb",
    connection: process.env.DATABASE_URL
    connAttrs: {
          "user": "roomprod",
          "password": "roomprod",
          "connectString": "192.168.56.101/xe"
        }
 }
};
