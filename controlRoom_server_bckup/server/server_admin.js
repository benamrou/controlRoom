/*jslint node:true*/

// **************************************************************************************/
// This serve manage the back-end connection to the Control Room Admin application
//
// Environment letiable:
//     NODE_ENV: which environment configuration to be used (production/development/testing)
//               if not set by default ./config/development.js config file
//     COOKIE_SECRET_KEY:
//     REDIS_URL: URL distribution
//
// Creation date: 01/2017
// Author: Ahmed Benamrouche
//
// **************************************************************************************/

let http = require('http');
let express = require('express');        // Manage client request
let bodyParser = require('body-parser'); // Parse JSON file
let oracledb = require('oracledb');      // Oracle DB connection
let fs = require('fs-extra'); // File management
let _= require("lodash");
let inherits = require("inherits");

let openHttpConnections = {};
let httpServer;
//let _= require(["underscore"]); // User to concatenate array for parameters

// Config - by default Development is Envrionment variable NODE_ENV is not set to production
// Config - Merging default with the Production or Development or Testing config file
let defaults = require("./config/default.js");
let config = new require("./config/" + (process.env.NODE_ENV || "development") + ".js");
module.exports = _.merge({}, defaults, config);

let app = express();

process.env.UV_THREADPOOL_SIZE=64;

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(function(req, res, next) {
	if (req.method === 'OPTIONS') {
	      console.log('!OPTIONS');
	      let headers = {};
	      // IE8 does not allow domains to be specified, just the *
	      headers["Access-Control-Max-Age"] = '86400'; // 24 hours
	      headers["Access-Control-Allow-Origin"] = "*";
    	  headers["Access-Control-Allow-Credentials"] = false;
    	  headers["Access-Control-Allow-Methods"] = "GET, HEAD, OPTIONS, POST, PUT";
    	  headers["Access-Control-Allow-Headers"] = "Access-Control-Allow-Headers, Origin,Accept, " +
                                                    "Cache-Control, Pragma, Origin, Authorization, " +
                                                    "X-Requested-With, Content-Type, Access-Control-Request-Method, " +
                                                    " Access-Control-Request-Headers, " +
                                                    "USER, PASSWORD, " +
                                                    "DATABASE_SID, LANGUAGE";
	      res.writeHead(200, headers);
	      res.end();
	}
	else {
		next();
	}
});

/* Publish the available routes and methodes */
let dbConnection = require('./server/utils/dbconnect');
let SQL = require('./server/utils/sqlquery.js');
let userprofile=	require('./server/controller/userprofile.js')(app, SQL);
let authentification=	require('./server/controller/authentification.js')(app, SQL);
let user=	require('./server/controller/user.js')(app, SQL);
let environment=	require('./server/controller/environment.js')(app, SQL);
let searchObject = require('./server/controller/searchobject.js')(app, SQL);
let itemObject = require('./server/controller/item.js')(app, SQL);
let itemCost = require('./server/controller/itemcost.js')(app, SQL);
let itemRetail = require('./server/controller/itemretail.js')(app, SQL);
let itemSubstitution = require('./server/controller/itemsubstitution')(app, SQL);
let itemInventory = require('./server/controller/iteminventory')(app, SQL);
let supplierSchedule = require('./server/controller/supplierschedule')(app, SQL);
let counting = require('./server/controller/counting')(app, SQL);
let batchprocess = require('./server/controller/process')(app, SQL);
let order = require('./server/controller/order')(app, SQL);
let labels = require('./server/controller/labels')(app, SQL);
let upload = require('./server/controller/upload')(app, SQL);
let ls = require('./server/controller/patcher/ls')(app, SQL);
let command = require('./server/controller/command/execute')(app, SQL);
let logger = require('./server/utils/logger.js');     // Log manager
let widget = require('./server/controller/widget')(app, SQL);

//dbConnection.createPool('dd');
userprofile.get(app,oracledb);
userprofile.post(app,oracledb);
userprofile.delete(app,oracledb);
userprofile.put(app,oracledb);
authentification.get(app,oracledb);
authentification.post(app,oracledb);
user.get(app,oracledb);
environment.get(app,oracledb);
searchObject.get(app,oracledb);
itemObject.get(app,oracledb);
itemCost.get(app,oracledb);
itemRetail.get(app,oracledb);
itemSubstitution.get(app,oracledb);
itemInventory.get(app,oracledb);
supplierSchedule.get(app,oracledb);
counting.get(app,oracledb);
batchprocess.get(app,oracledb);
order.get(app,oracledb);
labels.get(app,oracledb);
upload.post(app,oracledb);
ls.get(app,oracledb);
command.get(app,oracledb);
widget.get(app, oracledb);


// Prepare logs folder/files
// File folder for logs
// logs > admin > date (format - YYYYMMDD)
let date = new Date();
let timestamp = (date.getFullYear() + "." + (date.getMonth() + 1) + '.' + date.getDate());

// Logs file structure is ready


httpServer = http.Server(app);
httpServer.on('connection', function(conn) {
        var key = conn.remoteAddress + ':' + (conn.remotePort || '');

        openHttpConnections[key] = conn;

        conn.on('beforeExit', function() {
            dbConnection.getPool().close();
            delete openHttpConnections[key];
        });

        conn.on('close', function() {
            dbConnection.getPool().close();
            delete openHttpConnections[key];
        });
    });
// Connection to the database and listenning the server
dbConnection.addBuildupSql({
	sql: "BEGIN EXECUTE IMMEDIATE q'[alter session set NLS_DATE_FORMAT='DD-MM-YYYY']'; END;"
});

dbConnection.addTeardownSql({
	sql: "BEGIN sys.dbms_session.modify_package_state(sys.dbms_session.reinitialize); END;"
});

dbConnection.createPool(config.db.connAttrs)
	.then(function() {
		let server = httpServer.listen(8090, function () {
		let host = server.address().address,
			port = server.address().port;

		logger.log(0,' Server is listening at http://' + host + ':' + port, "internal");
		});
	})
	.catch(function(err) {
		console.error('Error occurred creating database connection pool', err);
		console.log('Exiting process');
		process.exit(0);
    }
);

process.on('uncaughtException', function(err) {
    console.error('Uncaught exception ', err);
    shutdown();
});

process.on('SIGTERM', function () {
    console.log('Received SIGTERM');
    shutdown();
});

process.on('SIGINT', function () {
    console.log('Received SIGINT');

    shutdown();
});

process.on('beforeExit', function () {
    console.log('Received BeforeExit');
    dbConnection.terminatePool();
});


function shutdown() {
    console.log('Shutting down');
    console.log('Closing Inventory Control Room backend server');

    httpServer.close(function () {
        console.log('Web server closed');

        dbConnection.terminatePool()
            .then(function() {
                console.log('Connection pool terminated');
                console.log('Exiting process');
                process.exit(0);
            })
            .catch(function(err) {
                console.error('Error occurred while terminating Server connection pool', err);
                console.log('Exiting process');
                process.exit(0);
            });
    });

    for (key in openHttpConnections) {
        openHttpConnections[key].destroy();
    }
}
