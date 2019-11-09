
/**
* This is the description for Execute API class. The initlaized request for CORS (different URL reuqest)
* is managed to support GET, POST, PUT, DELETE and OPTIONS.
* Browsers are sending an OPTIONS request for authorization before sending the actual request.
*
* API Library: /api/execute  Execute a command on the node server
* API Library: /api/execute/1 Execute a command on the REMOTE environment
*
* This class is working on a REQUEST => RESPONSE approach
* Response return sattus:
*    200 OK successful GET
*    201 Created for successful POST.  URI for the created resource is specified in the Location header field
*    204 No Content for successful PUT and DELETE. No message body.
*    400 Bad Request with error, if the new resource to be created through POST already exists
*    404 Not Found with error, if GET or PUT has not found anything matching the Request-URI
*    415 Unsupported Media Type with error, if POST or PUT if the request body is not in application/json MIME type
*    500 Internal Server Error with error, if server encountered an unexpected error while processing the request
* 
* @class Execute
*
* @author Ahmed Benamrouche
* Date: April 2018
*/
module.exports = function (app, SQL) {
    const spawn  = require('child_process').execFile;
    const exec  = require('child_process').execFile;
    
    module.get = function (request,response) {
            /* *********************************************************************************** */
            /* Local Server Batch execution                                                       */
            /* *********************************************************************************** */
            app.get('/api/execute/', function (request, response) {
            "use strict";
            // Domain you wish to allow
            response.setHeader('Access-Control-Allow-Origin', '*');
            // requestuest methods you wish to allow
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    
            if (request.query.ARGS) {
                // Command with arguments
                //console.log ('Executing command with arguments ' + request.query.PARAM  + ' ' + request.query.ARGS  + ' ... ');
                //console.log ('1- ' + JSON.parse("[" + request.query.ARGS + "]"));
                //console.log ('2- ' + JSON.parse(request.query.ARGS));
                //console.log ('3- ' + request.query.ARGS.split(','));
                const command = spawn(request.query.PARAM, request.query.ARGS.split(','), (error, stdout, stderr) => {
                //const command = spawn('ls', ['-A','/usr'], (error, stdout, stderr) => {
                    if (error) {
                        console.error('stderr', stderr);
                        throw error;
                    }
                    console.log('stdout', stdout);
                    response.json({
                                CMD: request.query.PARAM + ' ' + request.query.ARGS ,
                                RESULT: stdout,
                                ERROR: stderr
                            });    
                });
            }
            else {
                // Command without argument
                console.log ('Executing ' + request.query.PARAM  + ' ... ');
                const command = spawn(request.query.PARAM, [], (error, stdout, stderr) => {
                    if (error) {
                        console.error('stderr', stderr);
                        throw error;
                    }
                    console.log('stdout', stdout);
                    response.json({
                                CMD: request.query.PARAM ,
                                RESULT: stdout,
                                ERROR: stderr
                            });    
                });
            }
            });
    
    
            /* *********************************************************************************** */
            /* Remote Server Batch execution                                                       */
            /* *********************************************************************************** */
            app.get('/api/execute/1/', function (request, response) {
                "use strict";
                // Domain you wish to allow
                response.setHeader('Access-Control-Allow-Origin', '*');
                // requestuest methods you wish to allow
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
         
                // Command with arguments
                console.log ('Executing command with arguments ' + request.query.PARAM  + ' ' + request.query.ARGS  + ' ... ');
    
    
                //host configuration with connection settings and commands
               var host = {
                    server:        {     
                    host:         request.header('ENV_IP'),
                    userName:     request.header('ENV_ID'),
                    password:     request.header('ENV_PASS'),
                    },
                    commands:      [ request.header('ENV_COMMAND') ],
                    onCommandComplete: function( command, response, sshObj ) {
                        //confirm it is the root home dir and change to root's .ssh folder
                        this.emit("msg", this.sshObj.server.host + ": host.onCommandComplete event, command: " + command);
                        this.emit("msg", response);
                        //we are listing the dir so output it to the msg handler
                        sshObj.exitCommands.pop()
                        //this.emit("msg", response);
                       },
                       
                    onEnd: function( sessionText, sshObj ) {
                    //email the session text instead of outputting it to the console
                    this.emit("msg", this.sshObj.server.host + ": host.onEnd event");
                    
                    
                    //this.emit("error", this.sshObj.server.host + ": " + sessionText, null, true);
                    this.emit("exit");
                    //sshObj._stream
                    console.log(this.sshObj.server.host + ": host.onEnd event")
                    
                    // if callback is provided, errors will be passed into it
                    // else errors will be thrown
                    },
                    
                };
                    
                var SSH2Shell = require ('ssh2shell'),
                    //Create a new instance passing in the host object
                    SSH = new SSH2Shell(host),
                    //Use a callback function to process the full session text
                    callback = function(sessionText){
                        response.json({
                            CMD: request.query.PARAM ,
                            RESULT: sessionText
                        });
                    }
                    
                //Start the process
                SSH.connect(callback);
                });
        }
        return module;
    }