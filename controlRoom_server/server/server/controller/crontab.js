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

"use strict";

let logger = require("../utils/logger.js");
let {streamWrite, streamEnd, onExit} = require('@rauschma/stringio');
let cron = require('node-cron');
let spawn  = require('child_process').spawn;
let user   = "crontab";

module.exports = function (app, SQL) {

    let module = {};
    
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
                let cronTab = [];
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
                                cronTab.push (cron.schedule(data[i].SALTCRON,async ()=> {
                                    if (data[i].SALTJOB) {
                                        try {
                                            if (fs.existsSync(data[i].SALTJOB)) {
                                                let command = spawn(data[i].SALTJOB, {}, {stdio: ['pipe', process.stdout, process.stderr]}); 
                                                writeToWritable(command.stdin); // (B)
                                                await onExit(command);
                                                command.on('error', err => {
                                                        if (err) {
                                                            logger.log('CRON', 'ERROR - Cron Job ' + data[i].SALTID + ' ' + data[i].SALTCRON + ' ' + stderr + error + stdout, user, 3);
                                                        } else {
                                                            logger.log('CRON', 'Cron Job ' + data[i].SALTID + ' ' + data[i].SALTCRON + ' [COMPLETED]' , user, 2);
                                                        }
                                                    });
                                                }
                                            }
                                        catch (err) {
                                            logger.log('CRON', 'ERROR - Cron Job ' + data[i].SALTID + ' ' + data[i].SALTCRON + ' ' + err, user, 3);
                                        }
                                        global.gc();
                                    } 
                                }));
                            }
                        }

                         /** Test if alert of the day didn't run yet */
                         SQL.executeLibQueryUsingMyCallback(SQL.getNextTicketID(),
                         "CRON000002", 
                         "'{}'" /* request.query.PARAM  */,
                         "crontab",
                         "'{}'" /* DATABASE_SID */, 
                         "'{}'" /* LANGUAGE */, 
                         request.dataJob, response.dataJob, 
                        async function (errorMissing,dataMissingRun) {
                            for (let j=0; j < dataMissingRun.length; j++) {
                                logger.log('CRON','RUN : ' +  dataMissingRun[j].SALTJOB, user);
                                if (dataMissingRun[j].SALTJOB) {
                                    let command = spawn(dataMissingRun[j].SALTJOB, {},  {stdio: ['pipe', process.stdout, process.stderr]}); 
                                    writeToWritable(command.stdin); // (B)
                                    await onExit(command);

                                    command.on('error', err => {
                                        if (err) {
                                            logger.log('CRON', 'ERROR - Cron Job ' + data[i].SALTID + ' ' + data[i].SALTCRON + ' ' + stderr + error + stdout, user, 3);
                                        } else {
                                            logger.log('CRON', 'Cron Job ' + data[i].SALTID + ' ' + data[i].SALTCRON + ' [COMPLETED]' , user, 2);
                                        }
                                    });
                                }
                            }
                                    
                        })
                    }
                }
        });
    }

    async function writeToWritable(writable) {
        //await streamWrite(writable, '');
        await streamEnd(writable);

      }

    module.killJob = function (request,response) {
        for(let i =0;i < cronTab.length ; i ++) {
            cronTab[i].stop;
            logger.log('CRON', 'Cron Job ' + JSON.stringify(cronTab[i]) + ' is now stoped.', user, 3);
        }
    }
    
    return module;
}