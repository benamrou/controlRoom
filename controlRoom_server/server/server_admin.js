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


"use strict";

let http = require('http');
let express = require('express');        // Manage client request
let cors = require('cors');              // Cors management
let bodyParser = require('body-parser'); // Parse JSON file
let oracledb = require('oracledb');      // Oracle DB connection
let _= require("lodash");

let openHttpConnections = {};
let httpServer;
let app = express();


//let _= require(["underscore"]); // User to concatenate array for parameters

// Config - by default Development is Envrionment letiable NODE_ENV is not set to production
// Config - Merging default with the Production or Development or Testing config file
let defaults = require("./config/default.js");
let config = new require("./config/" + (process.env.NODE_ENV || "development") + ".js");
module.exports = _.merge({}, defaults, config);


//process.env.UV_THREADPOOL_SIZE=264;

// parse application/json
app.use(bodyParser.json({limit: '50mb', type: 'application/json'}), );      // to support JSON-encoded bodies
// parse application/x-www-form-urlencoded
app.use( bodyParser.urlencoded({
         extended: true
    }) 
);

//app.use(bodyParser());

let corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200, // For legacy browser support
    methods: "*"
}
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));


app.use(function(req, res, next) {
	if (req.method === 'OPTIONS') {
	      let headers = {};
	      // IE8 does not allow domains to be specified, just the *
	      headers["Access-Control-Max-Age"] = '86400'; // 24 hours
	      headers["Access-Control-Allow-Origin"] = "*";
    	  headers["Access-Control-Allow-Credentials"] = true;
    	  headers["Access-Control-Allow-Methods"] = "GET, HEAD, OPTIONS, POST, PUT, DELETE, PATCH";
    	  headers["Access-Control-Allow-Headers"] = "Access-Control-Allow-Headers, Origin,Accept, " +
                                                    "Cache-Control, Pragma, Origin, Authorization, " +
                                                    "X-Requested-With, Content-Type, " +
                                                    "Access-Control-Request-Method, " +
                                                    "Access-Control-Request-Headers, " +
                                                    "USER, PASSWORD, " +
                                                    "DATABASE_SID, LANGUAGE, " +
                                                    "DSH_ID, QUERY_ID," +  
                                                    "MODE, FILENAME," +
                                                    "ENV_ID, ENV_PASS, ENV_IP, ENV_COMMAND";
	      res.writeHead(200, headers);
	      res.end();
          headers = null;
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
let itemCAO = require('./server/controller/itemcao')(app, SQL);
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
let notification = require('./server/controller/notification')(app, SQL);
let warehouse = require('./server/controller/warehouse/itemdata')(app, SQL);
let crontab = require('./server/controller/crontab')(app, SQL);
let finance = require('./server/controller/finance')(app, SQL);
let scorecard = require('./server/controller/scorecard')(app, SQL);
let dashboard = require('./server/controller/dashboard')(app, SQL);
let supplier = require('./server/controller/supplier')(app, SQL);
let query = require('./server/controller/query')(app, SQL);
let reporting = require('./server/controller/reporting')(app, SQL);
//let gdrive = require('./server/controller/gdrive')(app, SQL);
let executeSQL = require('./server/controller/executeSQL')(app, SQL);
let ubd = require('./server/controller/ubd')(app, SQL);
let alerts = require('./server/controller/alerts')(app, SQL);
let syndigo = require('./server/controller/syndigo')(app, SQL);
let logs = require('./server/controller/logs')(app, SQL);
let oneway = require('./server/controller/oneway')(app, SQL);


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
itemCAO.get(app,oracledb);
supplierSchedule.get(app,oracledb);
supplierSchedule.post(app,oracledb);
counting.get(app,oracledb);
batchprocess.get(app,oracledb);
order.get(app,oracledb);
labels.get(app,oracledb);
upload.get(app,oracledb);
upload.post(app,oracledb);
ls.get(app,oracledb);
command.get(app,oracledb);
command.post(app,oracledb);
widget.get(app, oracledb);
notification.get(app, oracledb);
warehouse.get(app, oracledb);
scorecard.get(app, oracledb);
dashboard.get(app, oracledb);
query.get(app, oracledb);
query.post(app, oracledb);
supplier.get(app, oracledb);
reporting.get(app, oracledb);
//gdrive.post(app, oracledb);
executeSQL.post(app, oracledb);
ubd.get(app, oracledb);
ubd.post(app, oracledb);
alerts.get(app, oracledb);
syndigo.get(app, oracledb);
logs.post(app, oracledb);
oneway.post(app, oracledb);
//finance.get(aoo,oracledb);


// Prepare logs folder/files
// File folder for logs
// logs > admin > date (format - YYYYMMDD)
let date = new Date();
let timestamp = (date.getFullYear() + "." + (date.getMonth() + 1) + '.' + date.getDate());

let argv = process.argv.slice(2);

if (argv.length < 1) {
    logger.log('internal', 'Listening port number is required', 'internal', 'internal', 3);
    logger.log('internal', 'Example: nodemon server_admin.js package.json 8090', 'internal', 3);
    process.exit();
}

if (argv[1] === 'CRONTAB') {
    crontab.process(app, oracledb);
}

// Logs file structure is ready

let key; // connection key

let DEBUG = false;
// ENABLE/DISABLE Console Logs
if(!DEBUG){
  console.log = function() {}
}


httpServer = http.Server(app);
httpServer.timeout = config.server.timeout;
httpServer.on('connection', function(conn) {
        key = conn.remoteAddress + ':' + (conn.remotePort || '');

        openHttpConnections[key] = conn;

        conn.on('beforeExit', function() {
            dbConnection.getPool().close();
            delete openHttpConnections[key];
        });

        conn.on('close', function() {
            try { 
                delete openHttpConnections[key]; 
            } 
            catch (error ) {};
            
        });
    });

// process.on('unhandledRejection', up => { throw up });

// Connection to the database and listenning the server
/*dbConnection.addBuildupSql({
	sql: "BEGIN EXECUTE IMMEDIATE q'[alter session set NLS_DATE_FORMAT='DD-MM-YYYY']'; END;"
});

dbConnection.addTeardownSql({
	sql: "BEGIN sys.dbms_session.modify_package_state(sys.dbms_session.reinitialize); END;"
});*/

dbConnection.createPool(config.db.connAttrs)
	.then(function() {
		let server = httpServer.listen(argv[0], function () {
		let host = server.address().address,
			port = server.address().port;

		logger.log(0,' Server is listening at http://' + host + ':' + port, "internal");
		});
	})
	.catch(function(err) {
        logger.log('internal', 'Error occurred creating database connection pool', 'internal', 3);
        logger.log('internal', 'Exiting process', 'internal', 3);
		process.exit(0);
    }
);

process.on('uncaughtException', function(err) {
    logger.log('internal', 'Uncaught exception ' + err, 'internal', 3);
    //shutdown();
});

process.on('SIGTERM', function () {
    logger.log('internal', 'Received SIGTERM', 'internal', 1);
    shutdown();
});

process.on('SIGINT', function () {
    logger.log('internal', 'Received SIGINT', 'internal', 1);

    shutdown();
});

process.on('beforeExit', function () {
    logger.log('internal', 'Received BeforeExit',  'internal', 1);
    dbConnection.terminatePool();
});


function shutdown() {
    logger.log('internal', 'Shutting down',  'internal', 1);
    logger.log('internal', 'Closing Inventory Control Room backend server',  'internal', 1);

    httpServer.close(function () {
        logger.log('internal', 'Web server closed',  'internal', 1);

        dbConnection.terminatePool()
            .then(function() {
                logger.log('internal', 'Connection pool terminated',  'internal', 1);
                logger.log('internal', 'Exiting process',  'internal', 1);
                process.exit(0);
            })
            .catch(function(err) {
                logger.log('internal', 'Error occurred while terminating Server connection pool ' + err,  'internal', 3);
                logger.log('internal', 'Exiting process',  'internal', 3);
                process.exit(0);
            });
        
        process.exit(0);
    });

    for (key in openHttpConnections) {
        openHttpConnections[key].destroy();
    }
}
