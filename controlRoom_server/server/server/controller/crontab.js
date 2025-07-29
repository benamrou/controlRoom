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
const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');


async function writeToWritable(writable) {
    //await streamWrite(writable, '');
    await streamEnd(writable);
}

async function executeScript(id, schedule, scriptContent, user) {
    if (!scriptContent) return;

    const tempDir = path.join(os.tmpdir(), 'croom'); // optional
    const fileName = `script-${id}-${uuidv4()}.sh`;
    const filePath = path.join(tempDir, fileName);

    try {
        // Ensure temp dir exists
        await fs.mkdir(tempDir, { recursive: true });

        // Write script to temp file
        await fs.writeFile(filePath, scriptContent, { mode: 0o755 });

        const command = spawn('bash', [filePath], {
            stdio: ['pipe', process.stdout, process.stderr]
        });

        writeToWritable(command.stdin); // Optional input

        command.on('uncaughtException', function (err) {
            logger.log('CRON', `uncaughtException - Cron Job ${id} ${data} `, user, 2);
        });

        command.on('error', async (err) => {
            logger.log('CRON', `ERROR - Cron Job ${id} ${schedule} ${err}`, user, 3);
            await safeCleanup(filePath);
        });

        command.on('exit', async (code) => {
            if (code === 0) {
                logger.log('CRON', `Cron Job ${id} ${schedule} [COMPLETED]`, user, 2);
            } else {
                logger.log('CRON', `ERROR - Cron Job ${id} ${schedule} exited with code ${code}`, user, 3);
            }
            await safeCleanup(filePath);
        });

        await onExit(command); // optional await

    } catch (err) {
        logger.log('CRON', `ERROR - Cron Job ${id} ${schedule} ${err}`, user, 3);
        await safeCleanup(filePath);
    }

    global.gc?.();
}

async function safeCleanup(filePath) {
    try {
        await fs.unlink(filePath);
    } catch (e) {
        // Log or ignore, depending on needs
        logger.log('CRON', `Failed to delete temp file: ${filePath} ${e}`, user, 3);
    }
}

function shell2crontab(crontab, id, schedule, script, user) {
    try {
        if(crontab)
        crontab.push (cron.schedule(schedule,async ()=> {
            await executeScript(id, schedule, script, user);
        }));
    } catch (e) {
        // Log or ignore, depending on needs
        logger.log('CRON', `Failed to schedule script ${id} ${schedule}`, user, 3);
    }
}

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
                                if(data[i].SALTSHELL) {
                                    shell2crontab(cronTab, data[i].SALTID, data[i].SALTCRON, data[i].SALTSHELL, user);
                                }
                                else 
                                    if (data[i].SALTJOB) {
                                        shell2crontab(cronTab, data[i].SALTID, data[i].SALTCRON, data[i].SALTJOB, user);
                                    } 
                                }
                            }
                        }
                    }});

        /** Test if alert of the day didn't run yet */
        SQL.executeLibQueryUsingMyCallback(SQL.getNextTicketID(),
                            "CRON000002", 
                            "'{}'" /* request.query.PARAM  */,
                            "crontab",
                            "'{}'" /* DATABASE_SID */, 
                            "'{}'" /* LANGUAGE */, 
                            request, response, 
                        async function (errorMissing,dataMissingRun) {
                            for (let j=0; j < dataMissingRun.length; j++) {
                                logger.log('CRON','RUN : ' +  dataMissingRun[j].SALTJOB, user);
                                if(dataMissingRun[j].SALTSHELL) {
                                    executeScript(dataMissingRun[j].SALTID, dataMissingRun[j].SALTCRON, dataMissingRun[j].SALTSHELL, user);
                                }
                                else {
                                    if (dataMissingRun[j].SALTJOB) {
                                        executeScript(dataMissingRun[j].SALTID, dataMissingRun[j].SALTCRON, dataMissingRun[j].SALTJOB, user);
                                    } 
                                }
                            }
                                    
        });
    }

    module.killJob = function (request,response) {
        for(let i =0;i < cronTab.length ; i ++) {
            cronTab[i].stop();
            logger.log('CRON', 'Cron Job ' + JSON.stringify(cronTab[i]) + ' is now stoped.', user, 3);
        }
    }
    
    return module;
}