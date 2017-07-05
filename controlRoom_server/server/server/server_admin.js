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

let express = require('express');        // Manage client request
let bodyParser = require('body-parser'); // Parse JSON file
let oracledb = require('oracledb');      // Oracle DB connection
let fs = require('fs-extra'); // File management
let _= require("lodash");
//let _= require(["underscore"]); // User to concatenate array for parameters

// Config - by default Development is Envrionment variable NODE_ENV is not set to production
// Config - Merging default with the Production or Development or Testing config file
let defaults = require("./config/default.js");
let config = require("./config/" + (process.env.NODE_ENV || "development") + ".js");
module.exports = _.merge({}, defaults, config);

let app = express();

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
    	  headers["Access-Control-Allow-Headers"] = "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, USER, PASSWORD";

	      res.writeHead(200, headers);
	      res.end();
	}
	else {
		next();
	}
});

/* Publish the available routes and methodes */
let dbConnection = require('./server/utils/dbconnect')(app);
let SQL = require('./server/utils/sqlquery.js')(app);
let userprofile=	require('./server/controller/userprofile.js')(app, SQL);
let authentification=	require('./server/controller/authentification.js')(app, SQL);
let user=	require('./server/controller/user.js')(app, SQL);
let environment=	require('./server/controller/environment.js')(app, SQL);
let searchObject = require('./server/controller/searchObject.js')(app, SQL);
let logger = require('./server/utils/logger.js')(app);     // Log manager

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


// Prepare logs folder/files
// File folder for logs 
// logs > admin > date (format - YYYYMMDD)
let date = new Date();
let timestamp = (date.getFullYear() + "." + (date.getMonth() + 1) + '.' + date.getDate());

// Logs file structure is ready  

console.log('config.connAttrs: ' + config.connAttrs);
// Connection to the database and listenning the server
dbConnection.createPool(config.connAttrs)
	.then(function() {
		let server = app.listen(3300, function () {
		let host = server.address().address,
			port = server.address().port;

		logger.log(0,' Server is listening at http://' + host + ':' + port, "internal");
		});
	})
	.catch(function(err) {
		console.error('Error occurred creating database connection pool', err);
		console.log('Exiting process');
		process.exit(0);
});
