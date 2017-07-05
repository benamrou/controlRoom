
module.exports = function (app, SQL) {
const spawn  = require('child_process').execFile;
const ls = spawn('ls', ['-lh', '/usr']);

module.get = function (request,response) {
        app.get('/patch/execute/', function (request, response) {
        "use strict";
        // Domain you wish to allow
        response.setHeader('Access-Control-Allow-Origin', '*');
        // requestuest methods you wish to allow
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

        if (request.query.ARGS) {
            // Command with arguments
            console.log ('Executing command with arguments ' + request.query.PARAM  + ' ' + request.query.ARGS  + ' ... ');
            //console.log ('1- ' + JSON.parse("[" + request.query.ARGS + "]"));
            //console.log ('2- ' + JSON.parse(request.query.ARGS));
            console.log ('3- ' + request.query.ARGS.split(','));
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
    }
    return module;
}