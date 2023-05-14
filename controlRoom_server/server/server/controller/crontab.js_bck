/**
* This is the description for CRONTAB API class. 
*
* API Library: /controller/crontab
*
* This class is working on a FUNCTIONapproach
* 
* @class Crontab
*
* @author Ahmed Benamrouche
* Date: October 2019
*/

var logger = require("../utils/logger.js");
var user   = "crontab";
const cron = require('node-cron');
const spawn  = require('child_process').execFile;
const exec  = require('child_process').execFile;
var cronTab = [];
module.exports = function (app, SQL) {

    var module = {};
    
    /**
    * PROCESS method description. Execute according to ALRTSCHEDULE table the jobs
    * Method: PROCESS
    *
    *
    * @method process
    * @return {Boolean} Returns the process execution general information
    *
    */
    module.process = function (request,response) {
    
        SQL.executeLibQueryUsingMyCallback(SQL.getNextTicketID(),
                            "CRON000001", 
                            "'{}'" /* request.query.PARAM  */,
                            "crontab",
                            "'{}'" /* DATABASE_SID */, 
                            "'{}'" /* LANGUAGE */, 
                            request, response, 
            function (err,data) { 
                if (err) {
                    logger.log('CRON', 'Error gathering scheduler data query : ' + JSON.stringify(err), user, 3);
                }
                else {
                    if (data.length >= 1) {
                        for(let i =0;i < data.length ; i ++) {
                            if (data[i].ACTIVE === 0 ){
                                logger.log('CRON', 'Cron Job ' + data[i].SALTID + ' is not active. Activation date on ' + data[i].SALTACTIVE, user, 3);
                            }
                            else {

                                logger.log('CRON', 'Cron Job ' + data[i].SALTID + ' is now scheduled using cron setup : ' + data[i].SALTCRON, user, 2);
                                cronTab.push (cron.schedule(data[i].SALTCRON,()=> {
                                    if (data[i].SALTJOB) {
                                        const command = spawn(data[i].SALTJOB, [], (error, stdout, stderr) => {
                                            if (error) {
                                                console.error('stderr', stderr);
                                            }
                                            console.log('stdout', stdout);
                                        });
                                    }
                                }));

                            }
                        }
                    }
                }

        });
    }

    module.killJob = function (request,response) {
        for(let i =0;i < cronTab.length ; i ++) {
            cronTab[i].stop;
            logger.log('CRON', 'Cron Job ' + JSON.stringify(cronTab[i]) + ' is now stoped.', user, 3);
        }
    }
    
    return module;
}