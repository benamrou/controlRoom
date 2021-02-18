
module.exports = function (app, SQL) {
const spawn  = require('child_process').execFile;
const ls = spawn('ls', ['-lh', '/usr']);

module.get = function (request,response) {
        app.get('/patch/ls/', function (request, response) {
        "use strict";
        console.log ('Executing ls process ... ');
        // Domain you wish to allow
        response.setHeader('Access-Control-Allow-Origin', '*');
        // requestuest methods you wish to allow
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

        const execFile = require('child_process').execFile;
        const child = execFile('node', ['--version'], (error, stdout, stderr) => {
            if (error) {
                console.error('stderr', stderr);
                throw error;
            }
            console.log('stdout', stdout);
        });

        const ls = spawn('ls', ['-lh', '/usr'], (error, stdout, stderr) => {
            if (error) {
                console.error('stderr', stderr);
                throw error;
            }
            console.log('stdout', stdout);
            response.json({
                        CMD: 'ls -lh /usr',
                        RESULT: stdout
                    });    
        });
      });
    };
    return module;
}