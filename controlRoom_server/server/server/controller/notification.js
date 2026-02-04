/**
* This is the description for Notification API class. The initlaized request for CORS (different URL reuqest)
* is managed to support GET, POST, PUT, DELETE and OPTIONS.
* Browsers are sending an OPTIONS request for authorization before sending the actual request.
*
* API Library: /notification/
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
* @class Notification
*
* @author Ahmed Benamrouche
* Date: July 2019
*/

"use strict";

const PQueue = require('p-queue').default;
const excelQueue = new PQueue({concurrency: 2});

let configuration = {
    nodemailer : require('nodemailer'),
    config : new require("../../config/" + (process.env.NODE_ENV || "development") + ".js")
}

// Shell script execution imports
const fs_promises = require('fs/promises');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');

let heap = {
    logger : require("../utils/logger.js"),
    dbLogger : require("../utils/db_logger.js"),
    excel : require('exceljs'),
    fs : require('fs'),
    disrequire: require('disrequire'),
    
    parseXML2JS : require('xml2js').parseString,
    json2html : require('../utils/json2html.js'),
    json2xls : require('../utils/json2xls.js'),

    TABLE_HEADER : 4,
    
    transporter : configuration.nodemailer.createTransport({
        //service: configuration.config.notification.email_service,
        host: configuration.config.notification.email_host,
        port: configuration.config.notification.email_port,
        secure: configuration.config.notification.email_secure,
        auth: {
            user: configuration.config.notification.email_user,
            pass: configuration.config.notification.email_password,
        },
        tls: {
              rejectUnauthorized: false
          },
          // ADD THESE TIMEOUT CONFIGURATIONS:
        connectionTimeout: 60000,      // 60 seconds to connect
        greetingTimeout: 30000,        // 30 seconds for greeting
        socketTimeout: 300000,         // 5 minutes for socket operations (DATA phase)
        
        // ADD CONNECTION POOLING:
        pool: true,                    // Use connection pool
        maxConnections: 5,             // Max simultaneous connections
        maxMessages: 100,              // Max messages per connection
        dkim: {
            domainName: configuration.config.notification.email_service,
            keySelector: "default",
            privateKey: configuration.config.notification.email_private_key,
            cacheDir: configuration.config.notification.email_cache_dir,
            cacheTreshold: 100 * 1024
          },
          //debug: true, // show debug output
          logger: false // log information in console
    })
}


function sendSMS(to, subject, message) {
    let mailOptions = {
        from: configuration.config.notification.email_user,
        to,
        subject,
        html: message
    };
    let infoMessage =  heap.transporter.sendMail(mailOptions, (error) => {
        if (error) {
            heap.logger.log('alert', error, 'alert', 3);
        }

    });
    heap.logger.log('alert', 'Text-message sent to:' + to + ' subject: ' + subject, 'alert', 1);
    heap.logger.log('alert', 'Message sent: ' + message, 'alert', 1);
    //heap.logger.log('alert', 'Preview URL: ' + configuration.nodemailer.getTestMessageUrl(infoMessage), 'alert', 1);
    mailOptions = null;
    infoMessage = null;
    message = null;
    to = null;
    subject = null;
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
    // Preview only available when sending through an Ethereal account
}

function sendEmail(to, emailcc, emailbcc, subject, message, requestId, requestStartTime, overallTimeout) {
    let mailOptions = {
        from: configuration.config.notification.email_user,
        to,
        cc: emailcc,
        bcc: emailbcc,
        subject,
        html: message,
        dsn: {
            id: 'ICR Delivery status',
            return: 'headers',
            notify: ['failure', 'delay','success'],
            recipient: configuration.config.notification.email_user
        }
    };
    let infoMessage =  heap.transporter.sendMail(mailOptions, async (error) => {
        if (error) { 
            heap.logger.log('alert', 'Error sending email function call: ' + to + ' ' + subject + ' ' + 
                                message , 'alert', 3);
            //logger.log('alert', 'Error sending email BUFFER: ' + JSON.stringify(stream) , 'alert', 3);
            heap.logger.log('alert', 'Error sending email ERROR details: ' + JSON.stringify(error) , 'alert', 3);
            
            // Log failure to database
            if (requestId && requestStartTime) {
                const duration = Math.floor((Date.now() - requestStartTime) / 1000);
                await heap.dbLogger.logFailed(requestId, duration, `Email send failed: ${error.message || JSON.stringify(error)}`);
            }
            
            sendSMS('6789863021@tmomail.net','CRITICAL: SPAM alert ' + subject, `RequestID: ${requestId || 'N/A'}, Error: ${JSON.stringify(error)}`);
        }
        else {
            // Mark request as complete
            if (requestId && requestStartTime) {
                const duration = Math.floor((Date.now() - requestStartTime) / 1000);
                clearTimeout(overallTimeout);
                
                await heap.dbLogger.logComplete(requestId, duration);
                heap.logger.log('alert', `[REQUEST COMPLETE] ${requestId} | Duration: ${duration}s (0 rows, no attachment)`, 'alert', 1);
            }
        }
    });
    heap.logger.log('alert', 'Email sent to:' + to + ' cc:' +  emailcc + ' bcc:' + emailbcc + ' subject: ' + subject, 'alert', 1);
    // heap.logger.log('alert', 'Message sent: ' + message, 'alert', 1);
    // heap.logger.log('alert', 'Preview URL: ' + configuration.nodemailer.getTestMessageUrl(infoMessage), 'alert', 1);

    mailOptions = null;
    infoMessage = null;
    message = null;
    to = null;
    emailcc = null;
    emailbcc = null;
    subject = null;
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
    // Preview only available when sending through an Ethereal account
}

function sendEmailCSV(to, emailcc, emailbcc, subject, message, stream, preHtml, forceExit, filenameParam, requestId, requestStartTime, overallTimeout) {
    let mailOptions = {
        from: configuration.config.notification.email_user,
        to,
        cc: emailcc,
        bcc: emailbcc,
        subject,
        html: message,
        attachments: [{
            filename: filenameParam,
            //content: new Buffer(stream, 'utf-8')
            content: Buffer.from(stream, 'utf-8')
        }]
    };

    heap.logger.log('alert', 'Sending email to:' + to + ' cc:' +  emailcc + ' bcc:' + emailbcc + ' subject: ' + subject, 'alert', 1);
    let infoMessage =  heap.transporter.sendMail(mailOptions, async function(error, info) {
        if (error) { 
            heap.logger.log('alert', 'Error sending email function call: ' + to + ' ' + subject, 'alert', 3);
            //logger.log('alert', 'Error sending email BUFFER: ' + JSON.stringify(stream) , 'alert', 3);
            heap.logger.log('alert', 'Error sending email ERROR details: ' + JSON.stringify(error) , 'alert', 3);
            
            // Log failure to database
            if (requestId && requestStartTime) {
                const duration = Math.floor((Date.now() - requestStartTime) / 1000);
                await heap.dbLogger.logFailed(requestId, duration, `Email send failed: ${error.message || JSON.stringify(error)}`);
            }
            
            sendSMS('6789863021@tmomail.net','CRITICAL: SPAM alert ' + subject, `RequestID: ${requestId || 'N/A'}, Error: ${JSON.stringify(error)}`);
            if (!forceExit) {
                // If message go to SPAM then send email with preHtml part
                heap.logger.log('alert', 'Resending email with lower content: ' + 
                                            preHtml + 
                                            'Refer to the attachment for details. Content can not be displayed in the email body.' , 'alert', 3);
                message =  'Refer to the attachment for details. Content can not be displayed in the email body.';
                sendEmailCSV(to, emailcc, emailbcc, subject, message, stream, preHtml, true, filenameParam, requestId, requestStartTime, overallTimeout);
            }
        }
        else {
            heap.logger.log('alert', 'Email sent to:' + to + ' cc:' +  emailcc + ' bcc:' + emailbcc + ' subject: ' + subject, 'alert', 1);
            
            // Mark request as complete
            if (requestId && requestStartTime) {
                const duration = Math.floor((Date.now() - requestStartTime) / 1000);
                clearTimeout(overallTimeout);
                
                await heap.dbLogger.logComplete(requestId, duration);
                heap.logger.log('alert', `[REQUEST COMPLETE] ${requestId} | Duration: ${duration}s`, 'alert', 1);
            }
            // heap.logger.log('alert', 'Message sent: ' + message, 'alert', 1);
            // heap.logger.log('alert', 'Preview URL: ' + configuration.nodemailer.getTestMessageUrl(infoMessage), 'alert', 1);
            // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
            // Preview only available when sending through an Ethereal account
        }
    });
}

function clearModule() {
    heap.disrequire('nodemailer');
    heap.disrequire('exceljs');
    heap.disrequire('xml2js');
    heap.disrequire('logger.js');
    heap.disrequire('json2html.js');
    heap.disrequire('json2xls.js');
}

/**
 * Execute a shell script from SALTSHELL content
 * Adapted from crontab.js executeScript function
 */
async function executeShellScript(id, scriptContent, user) {
    return new Promise(async (resolve, reject) => {
        if (!scriptContent) {
            resolve({ success: false, message: 'No script content provided' });
            return;
        }

        //const tempDir = path.join(os.tmpdir(), 'croom');
        const tempDir = path.join(process.env.HOME, 'heinensapps', 'controlRoom_server', 'temp');
        const fileName = `script-${id}-${uuidv4()}.sh`;
        const filePath = path.join(tempDir, fileName);
        let output = '';
        let errorOutput = '';

        try {
            // Ensure temp dir exists
            await fs_promises.mkdir(tempDir, { recursive: true });

            // Write script to temp file
            await fs_promises.writeFile(filePath, scriptContent, { mode: 0o755 });

            const command = spawn('bash', [filePath], {
                stdio: ['pipe', 'pipe', 'pipe']
            });

            command.stdout.on('data', (data) => {
                output += data.toString();
            });

            command.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            command.on('error', async (err) => {
                heap.logger.log('alert', `ERROR - Shell execution ${id}: ${err}`, user, 3);
                await safeCleanupScript(filePath);
                reject({ success: false, message: err.message, output, errorOutput });
            });

            command.on('exit', async (code) => {
                await safeCleanupScript(filePath);
                if (code === 0) {
                    heap.logger.log('alert', `Shell execution ${id} [COMPLETED]`, user, 2);
                    resolve({ success: true, message: 'Script executed successfully', output, errorOutput, exitCode: code });
                } else {
                    heap.logger.log('alert', `ERROR - Shell execution ${id} exited with code ${code}`, user, 3);
                    resolve({ success: false, message: `Script exited with code ${code}`, output, errorOutput, exitCode: code });
                }
            });

            // Close stdin
            command.stdin.end();

        } catch (err) {
            heap.logger.log('alert', `ERROR - Shell execution ${id}: ${err}`, user, 3);
            await safeCleanupScript(filePath);
            reject({ success: false, message: err.message });
        }
    });
}

async function safeCleanupScript(filePath) {
    try {
        await fs_promises.unlink(filePath);
    } catch (e) {
        heap.logger.log('alert', `Failed to delete temp script file: ${filePath} ${e}`, 'alert', 3);
    }
}

async function processContent(SQLProcess, alertData, request, response, result) {
  // ===== REQUEST MONITORING START =====
  const requestId = heap.dbLogger.generateRequestId();
  const requestStartTime = Date.now();
  request.requestId = requestId;
  request.requestStartTime = requestStartTime;
  
  heap.logger.log('alert', `[REQUEST START] ${requestId} | Alert: ${alertData[0].ALTID} | Email: ${alertData[0].ALTEMAIL}`, 'alert', 1);
  
  // Check for SPAM (3+ requests in 10 minutes)
  const isSpam = await heap.dbLogger.checkSpam(alertData[0].ALTID, alertData[0].ALTEMAIL);
  if (isSpam) {
    heap.logger.log('alert', `[SPAM DETECTED] ${requestId} | Alert: ${alertData[0].ALTID}`, 'alert', 3);
    await heap.dbLogger.logSpamBlocked(requestId, alertData[0].ALTID, alertData[0].ALTEMAIL);
    sendSMS('6789863021@tmomail.net', `SPAM: ${alertData[0].ALTID}`, `Alert sent 3+ times in 10 min. RequestID: ${requestId}`);
    return;
  }
  
  // Log request start to database
  await heap.dbLogger.logStart(requestId, alertData[0].ALTID, alertData[0].ALTEMAIL);
  
  // Set overall request timeout (10 minutes)
  const overallTimeout = setTimeout(async () => {
    const duration = Math.floor((Date.now() - requestStartTime) / 1000);
    heap.logger.log('alert', `[REQUEST TIMEOUT] ${requestId} | Duration: ${duration}s | CRITICAL`, 'alert', 3);
    await heap.dbLogger.logTimeout(requestId, duration);
    sendSMS('6789863021@tmomail.net', `CRITICAL: Request timeout`, `RequestID: ${requestId}, Alert: ${alertData[0].ALTID}, Duration: ${duration}s`);
  }, 600000);
  
  request.overallTimeout = overallTimeout;
  // ===== REQUEST MONITORING END =====
  
  let SUBJECT_EXT = request.header('SUBJECT_EXT') || '';
  let FILENAME_EXT = request.header('FILENAME_EXT') || 'result.xlsx';

  // Parse banner, rename query, etc.
  let bannerAdjusted, renameQuery, queryNodes = [];
  try {
    bannerAdjusted = result.ROOT.BANNER ? '' + result.ROOT.BANNER : '';
    renameQuery = result.ROOT.RENAME ? '' + result.ROOT.RENAME : '';
    
    // Dynamically collect all QUERY, QUERY2, QUERY3, ...
    Object.keys(result.ROOT).forEach((key) => {
      const match = key.match(/^QUERY(\d*)$/i);
      if (match) {
        const index = match[1] || '1'; // '1' for QUERY without number
        queryNodes.push({
          key,
          sql: result.ROOT[key],
          index,
          sheetName: result.ROOT[index === '1' ? 'NAME' : `NAME${index}`] || `RESULT${index}`,
          sheetFormat: result.ROOT[index === '1' ? 'FORMATXLS' : `FORMATXLS${index}`] || '',
          sheetFreezeHeader: result.ROOT[index === '1' ? 'FREEZERHEADER' : `FREEZERHEADER${index}`] || '',
          sheetFreezeColumn: result.ROOT[index === '1' ? 'FREEZERCOLUMN' : `FREEZERCOLUMN${index}`] || '',
          sheetColor: result.ROOT[index === '1' ? 'TABCOLORXLS' : `TABCOLORXLS${index}`] || '244062'
        });
      }
    });

     heap.logger.log('alert', 'queryNodes :' +JSON.stringify(queryNodes), 'alert', 3);

    // Sort by index ascending (e.g., QUERY, QUERY2, QUERY3 ...)
    queryNodes.sort((a, b) => parseInt(a.index) - parseInt(b.index));
  } catch (err) {
    heap.logger.log('alert', 'Error formatting XML - ' + JSON.stringify(err.message), 'alert', 3);
    return;
  }

  // Escape single quotes for safety in SQL
  bannerAdjusted = bannerAdjusted.replace(/'/g, "''");

  // Start executing first SQL query to get detailData for HTML/email usage
  if (result.ROOT.BANNER) {
        SQLProcess.executeQueryUsingMyCallBack(SQLProcess.getNextTicketID(),
            result.ROOT.BANNER, 
            "'{" + request.query.PARAM + "}'",
            request.header('USER'),
            "'{" + request.header('DATABASE_SID') + "}'", 
            "'{" +request.header('LANGUAGE') + "}'", 
            request.req_dataBanner, request.response_dataBanner, 
            function (err,dataBanner) {
                let bannerData = dataBanner;
                processDetailandXLS(SQLProcess, alertData, request, response, result, queryNodes, renameQuery, SUBJECT_EXT, FILENAME_EXT, bannerData);
            });
  }
  else {
    processDetailandXLS(SQLProcess, alertData, request, response, result, queryNodes, renameQuery, SUBJECT_EXT, FILENAME_EXT,[]);
  }
}


async function processDetailandXLS(SQLProcess, alertData, request, response, result, queryNodes, renameQuery,
                                   SUBJECT_EXT, FILENAME_EXT, bannerData) {
                                         // Object to collect all sheet data for archiving
      let archiveData = {};
      let totalArchiveRows = 0;

      // Start executing first SQL query to get detailData for HTML/email usage
    SQLProcess.executeQueryUsingMyCallBack(
      SQLProcess.getNextTicketID(),
      result.ROOT.QUERY,
      "'{" + request.query.PARAM + "}'",
      request.header('USER'),
      "'{" + request.header('DATABASE_SID') + "}'",
      "'{" + request.header('LANGUAGE') + "}'",
      request.req_datadetail,
      request.response_dataDetail,
      async function (err, detailData) {
        if (err) {
          heap.logger.log('alert', 'SQL Error on main QUERY: ' + err.message, 'alert', 3);
          return;
        }
        let preHtml = '';
        let bannerHtml = '';
        if (bannerData.length >= 1) {
            if (bannerData[0].MESSAGE) {
              if (bannerData[0].CRITICALITY === 'WARNING') {
                  bannerHtml += '<div style="position: absolute; top: 0; left: 0;  width: 100%; text-align: center;background-color: #bb3434; ">';
                  bannerHtml += '<span style="font-weight: bolder;color:#FFFFFF">';
              }
              else {
                  bannerHtml += '<div style="position: absolute; top: 0; left: 0;  width: 100%; text-align: center;background-color: #32CD32;">'
                  bannerHtml += '<span style="font-weight: bolder;color:#000000">'
              }
            bannerHtml += bannerData[0].MESSAGE;
            bannerHtml += '</span>';
            bannerHtml += '</div>';
            bannerHtml += '<br>';
            bannerHtml += '<br>';
            preHtml += bannerHtml;
          }
        }

        // Prepare initial email HTML content
        preHtml += `<strong>${alertData[0].ALTSUBJECT} ${SUBJECT_EXT} [${detailData.length} Object(s)]</strong><br><br>`;
        preHtml += alertData[0].ALTCONTENTHTML + '<br><br><br>';

        let html = '';
        if (detailData.length === 0) {
          html = preHtml + 'No reported elements.';
        } else {
          if (detailData.length > 500 || alertData[0].ALTNOHTML == 1) {
            html = preHtml + 'Look at the attachment for details.';
          } else {
            html = preHtml;
            html = heap.json2html.json2table(detailData, html, alertData[0].ALTFORMAT);
          }
        }
        heap.logger.log('alert', `HTML : ${html} `, 'alert', 1);

        // Create Excel workbook
        let workbook = new heap.excel.Workbook();

        // Handle column renaming if RENAME query exists
        let renameColumn = null;
        if (renameQuery) {
          await new Promise((resolve) => {
            SQLProcess.executeQueryUsingMyCallBack(
              SQLProcess.getNextTicketID(),
              renameQuery,
              "'{" + request.query.PARAM + "}'",
              request.header('USER'),
              "'{" + request.header('DATABASE_SID') + "}'",
              "'{" + request.header('LANGUAGE') + "}'",
              request.req_dataRename,
              request.response_dataRename,
              function (err, dataRename) {
                renameColumn = dataRename;
                resolve();
              }
            );
          });
        }

        // Helper: Process one query into worksheet
        async function processQueryNode(qNode) {
          return new Promise((resolve) => {
            const reqDataDetailKey = `req_datadetail${qNode.index === '1' ? '' : qNode.index}`;
            const resDataDetailKey = `response_dataDetail${qNode.index === '1' ? '' : qNode.index}`;

            heap.logger.log('alert', `SQL#${qNode.index} to execute ${qNode.sql}`, 'alert', 1);
            SQLProcess.executeQueryUsingMyCallBack(
              SQLProcess.getNextTicketID(),
              qNode.sql,
              "'{" + request.query.PARAM + "}'",
              request.header('USER'),
              "'{" + request.header('DATABASE_SID') + "}'",
              "'{" + request.header('LANGUAGE') + "}'",
              request[reqDataDetailKey],
              request[resDataDetailKey],
              async function (err, dataDetailN) {
                if (err) {
                  heap.logger.log('alert', `SQL Error on ${qNode.key}: ${err.message}`, 'alert', 3);
                  return resolve();
                }

                // Add worksheet
                heap.logger.log('alert', `SQL#${qNode.index} - data result length: ${dataDetailN.length}`, 'alert', 1);
                heap.logger.log('alert', `Add worksheet ${qNode.sheetName} `, 'alert', 1);
                let worksheet = workbook.addWorksheet(qNode.sheetName + '', { properties: { tabColor: { argb: qNode.sheetColor } } });
                if (alertData[0].ALTFREEZEHEADER == 1) {
                  worksheet.views = [{ state: 'frozen', xSplit: alertData[0].ALTFREEZECOLUMN, ySplit: heap.TABLE_HEADER + 1 }];
                }

                heap.logger.log('alert', `Worksheet added ${qNode.sheetName} `, 'alert', 1);

                try {
                  if([undefined, null].includes(dataDetailN)) {
                    heap.logger.log('alert', `dataDetailN empty ${qNode.dataDetailN}`, 'alert', 3);
                    dataDetailN = [];
                  }
                  
                    // Update phase to JSON2XLS
                    await heap.dbLogger.updateRequest(request.requestId, {
                      phase: 'JSON2XLS',
                      rowCount: dataDetailN.length
                    });
                    
                    // Set JSON2XLS timeout (2 minutes)
                    const json2xlsStart = Date.now();
                    const json2xlsTimeout = setTimeout(async () => {
                      heap.logger.log('alert', `[JSON2XLS TIMEOUT] ${request.requestId} | Rows: ${dataDetailN.length}`, 'alert', 3);
                      await heap.dbLogger.updateRequest(request.requestId, {
                        error: `JSON2XLS timeout: ${dataDetailN.length} rows`
                      });
                      sendSMS('6789863021@tmomail.net', `CRITICAL: JSON2XLS timeout`, `RequestID: ${request.requestId}, Rows: ${dataDetailN.length}`);
                    }, 120000);
                    
                    const wbxls = heap.json2xls.json2xls(workbook, worksheet, alertData, dataDetailN, SUBJECT_EXT, `ResultTable${qNode.index}`, qNode.sheetFormat +'', renameColumn);
                    workbook = wbxls.wb;
                    
                    clearTimeout(json2xlsTimeout);
                    const json2xlsDuration = ((Date.now() - json2xlsStart) / 1000).toFixed(2);
                    heap.logger.log('alert', `[JSON2XLS COMPLETE] ${request.requestId} | ${dataDetailN.length} rows in ${json2xlsDuration}s`, 'alert', 1);
                    
                } catch (err) {
                  heap.logger.log('alert', `Error in json2xls alert data ${qNode.key}: ` + JSON.stringify(alertData), 'alert', 3);
                  heap.logger.log('alert', `Error in json2xls detail ${qNode.key}: ${dataDetailN}`, 'alert', 3);
                  heap.logger.log('alert', `Error in json2xls detail length ${qNode.key}: ${dataDetailN.length}`, 'alert', 3);
                  heap.logger.log('alert', `Error in json2xls SUBJECT_EXT ${qNode.key}: ${SUBJECT_EXT}`, 'alert', 3);
                  heap.logger.log('alert', `Error in json2xls ResultTable ${qNode.key}: ResultTable${qNode.index}`, 'alert', 3);
                  heap.logger.log('alert', `Error in json2xls sheetFormat ${qNode.key}: ${qNode.sheetFormat}`, 'alert', 3);
                  heap.logger.log('alert', `Error in json2xls renameColumn ${qNode.key}: ${renameColumn}`, 'alert', 3);
                  heap.logger.log('alert', `Error in json2xls for ${qNode.key}: ${err}`, 'alert', 3);
                  
                  // Log failure to database
                  await heap.dbLogger.logFailed(
                    request.requestId,
                    Math.floor((Date.now() - request.requestStartTime) / 1000),
                    `JSON2XLS error: ${err.message}`
                  );
                  sendSMS('6789863021@tmomail.net', `CRITICAL: JSON2XLS error`, `RequestID: ${request.requestId}, Error: ${err.message}`);
                }
                // Store sheet data for archiving (after worksheet processing)
                archiveData[qNode.sheetName] = dataDetailN || [];
                totalArchiveRows += (dataDetailN || []).length;
                resolve();
              }
            );
          });
        }

        // Process all queries in sequence (await each)
        for (const qNode of queryNodes) {
          await processQueryNode(qNode);
        }

        // Write Excel to buffer and send email

        if (detailData.length === 0) {
              heap.logger.log('alert', `Emailing workbook length main query 0 ${alertData[0].ALTEMAIL} `, 'alert', 1);
              heap.logger.log('alert', `Emailing workbook real time ${alertData[0].ALTREALTIME} `, 'alert', 1);
          if (alertData[0].ALTREALTIME == '0') {
              heap.logger.log('alert', `Emailing workbook no attachment ${alertData[0].ALTEMAIL} `, 'alert', 1);
              
              // Update phase to EMAIL_SEND
              await heap.dbLogger.updateRequest(request.requestId, {
                phase: 'EMAIL_SEND'
              });
              
              sendEmail(
                alertData[0].ALTEMAIL,
                alertData[0].ALTEMAILCC,
                alertData[0].ALTEMAILBCC,
                `${alertData[0].ALTSUBJECT} ${SUBJECT_EXT} [0 Object(s)]`,
                html,
                request.requestId,
                request.requestStartTime,
                request.overallTimeout
              );
          }
          else {
              // No email sent (ALTREALTIME != '0' and 0 rows)
              // Mark as complete immediately
              heap.logger.log('alert', `[NO EMAIL] 0 rows and ALTREALTIME=${alertData[0].ALTREALTIME} - marking complete`, 'alert', 1);
              const duration = Math.floor((Date.now() - request.requestStartTime) / 1000);
              clearTimeout(request.overallTimeout);
              await heap.dbLogger.logComplete(request.requestId, duration);
              heap.logger.log('alert', `[REQUEST COMPLETE] ${request.requestId} | Duration: ${duration}s (0 rows, no email)`, 'alert', 1);
          }
        }
        else { 
          if (html.indexOf('ERRORDIAGNOSED') < 0) {
            heap.logger.log('alert', `[Excel Generation] Preparing for ${alertData[0].ALTEMAIL} | Rows: ${detailData.length}`, 'alert', 1);
            const bufferStartTime = Date.now();
            
            // Update phase to EXCEL_GEN
            await heap.dbLogger.updateRequest(request.requestId, {
              phase: 'EXCEL_GEN'
            });
            
            const fs = require('fs');
            const fsPromises = require('fs').promises;
            const path = require('path');
            const tempFile = path.join(process.env.HOME, 'heinensapps', 'controlRoom_server', 'temp', `excel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.xlsx`);
            
            heap.logger.log('alert', `[Excel Generation] Adding to queue (position: ${excelQueue.size + 1})`, 'alert', 1);
            
            excelQueue.add(() => {
              return new Promise((resolve, reject) => {
                heap.logger.log('alert', `[Excel Generation] Queue processing started for ${alertData[0].ALTEMAIL}`, 'alert', 1);
                
                const writeStream = fs.createWriteStream(tempFile);
                let timeoutId;
                
                const cleanup = async () => {
                  if (timeoutId) clearTimeout(timeoutId);
                  await fsPromises.unlink(tempFile).catch(() => {});
                };
                
                timeoutId = setTimeout(() => {
                  heap.logger.log('alert', `[Excel Generation] TIMEOUT after 120 seconds`, 'alert', 3);
                  writeStream.destroy();
                  cleanup();
                  reject(new Error(`Excel generation timeout after 120 seconds for ${detailData.length} rows`));
                }, 120000);
                
                writeStream.on('error', (err) => {
                  heap.logger.log('alert', `[Excel Generation] Stream error: ${err.message}`, 'alert', 3);
                  cleanup();
                  reject(err);
                });
                
                writeStream.on('finish', async () => {
                  try {
                    clearTimeout(timeoutId);
                    heap.logger.log('alert', `[Excel Generation] Stream finished, reading buffer`, 'alert', 1);
                    const buffer = await fsPromises.readFile(tempFile);
                    await fsPromises.unlink(tempFile).catch(() => {});
                    resolve(buffer);
                  } catch (err) {
                    await fsPromises.unlink(tempFile).catch(() => {});
                    reject(err);
                  }
                });
                
                heap.logger.log('alert', `[Excel Generation] Starting workbook.xlsx.write()`, 'alert', 1);
                workbook.xlsx.write(writeStream)
                  .then(() => {
                    heap.logger.log('alert', `[Excel Generation] Write complete, closing stream`, 'alert', 1);
                    writeStream.end();
                  })
                  .catch((err) => {
                    heap.logger.log('alert', `[Excel Generation] Write error: ${err.message}`, 'alert', 3);
                    writeStream.destroy();
                    cleanup();
                    reject(err);
                  });
              });
            })
              .then(async (buffer) => {
                const bufferEndTime = Date.now();
                const bufferDuration = ((bufferEndTime - bufferStartTime) / 1000).toFixed(2);
                const bufferSizeMB = (buffer.length / 1024 / 1024).toFixed(2);
                
                heap.logger.log('alert', `[Excel Generated] Size: ${bufferSizeMB}MB | Duration: ${bufferDuration}s | Rows: ${detailData.length}`, 'alert', 1);
                
                // Update phase to EMAIL_SEND
                await heap.dbLogger.updateRequest(request.requestId, {
                  phase: 'EMAIL_SEND'
                });
                
                sendEmailCSV(
                  alertData[0].ALTEMAIL,
                  alertData[0].ALTEMAILCC,
                  alertData[0].ALTEMAILBCC,
                  `${alertData[0].ALTSUBJECT} ${SUBJECT_EXT} [${detailData.length} Object(s)]`,
                  html,
                  buffer,
                  preHtml,
                  false,
                  FILENAME_EXT,
                  request.requestId,
                  request.requestStartTime,
                  request.overallTimeout
                );
                buffer = null;
              })
              .catch(async (bufferError) => {
                const bufferEndTime = Date.now();
                const bufferDuration = ((bufferEndTime - bufferStartTime) / 1000).toFixed(2);
                
                heap.logger.log('alert', `[Excel Generation FAILED] Duration: ${bufferDuration}s | Rows: ${detailData.length}`, 'alert', 3);
                heap.logger.log('alert', `[Excel Generation ERROR] ${bufferError.message}`, 'alert', 3);
                
                // Log failure to database
                await heap.dbLogger.logFailed(
                  request.requestId,
                  Math.floor((Date.now() - request.requestStartTime) / 1000),
                  `Excel generation failed: ${bufferError.message}`
                );
                
                sendSMS('6789863021@tmomail.net', 
                  `CRITICAL: Excel generation failed - ${alertData[0].ALTSUBJECT}`, 
                  `RequestID: ${request.requestId}, Error: ${bufferError.message}, Rows: ${detailData.length}, Duration: ${bufferDuration}s`);
                
                const fallbackHtml = preHtml + 
                  `<p><strong style="color: red;">Excel generation failed for this report</strong></p>` +
                  `<p>Error: ${bufferError.message}</p>` +
                  `<p>Rows attempted: ${detailData.length}</p>` +
                  `<p>Please contact IT support.</p>`;
                
                // Send fallback email (request already marked as FAILED above)
                // Don't pass monitoring params - request is already marked FAILED
                sendEmail(
                  'abenamrouche@heinens.com', //alertData[0].ALTEMAIL,
                  null, //alertData[0].ALTEMAILCC,
                  null, //alertData[0].ALTEMAILBCC,
                  `[GENERATION FAILED] ${alertData[0].ALTSUBJECT} ${SUBJECT_EXT}`,
                  fallbackHtml
                );
              });
          }
          else {
            // Case: ERRORDIAGNOSED found or no data to send
            heap.logger.log('alert', `[NO EMAIL SENT] ${request.requestId} | Reason: ${html.indexOf('ERRORDIAGNOSED') >= 0 ? 'Error in data' : 'No rows'} | Rows: ${detailData.length}`, 'alert', 2);
            
            // Mark request as complete (no email sent)
            const duration = Math.floor((Date.now() - request.requestStartTime) / 1000);
            clearTimeout(request.overallTimeout);
            await heap.dbLogger.logComplete(request.requestId, duration);
            heap.logger.log('alert', `[REQUEST COMPLETE] ${request.requestId} | Duration: ${duration}s | No email sent`, 'alert', 1);
          }

        // Optionally send SMS if configured
        if (alertData[0].ALTSMS == 1 && alertData[0].ALTSMSCONTENT && alertData[0].ALTMOBILE && html.indexOf('ERRORDIAGNOSED') < 0) {
          const newLineSMS = '<br>';
          sendSMS(
            alertData[0].ALTMOBILE,
            `${alertData[0].ALTSUBJECT} ${SUBJECT_EXT}`,
            `${alertData[0].ALTSMSCONTENT} : ${detailData.length}${newLineSMS}<b>Distribution list : </b> ${alertData[0].ALTEMAIL}`
          );
        }

        // Log to ALERTLOG with all sheets data (async - don't block email)
        const archiveJson = JSON.stringify(archiveData);
        heap.logger.log('alert', 'Archiving to ALERTLOG - ALTID: ' + alertData[0].ALTID + ', Total rows: ' + totalArchiveRows + ', Sheets: ' + Object.keys(archiveData).join(', '), 'alert', 1);
        
        // Fire and forget - don't await, let email send immediately
        (async function archiveToDatabase() {
          const oracledb = require('oracledb');
          let archiveConnection;
          try {
            archiveConnection = await oracledb.getConnection(configuration.config.db.connAttrs);
            
            // MERGE to update existing row created by logStart, or INSERT if logStart wasn't called
            const mergeSql = `MERGE INTO ALERTLOG A
                             USING (SELECT :reqid AS LALTREQID, :altid AS LALTID, 
                                           :blobdata AS LALTMESS, :rowcount AS LALTROWCOUNT,
                                           SYSDATE AS LALTDCRE, SYSDATE AS LALTDMAJ, :util AS LALTUTIL
                                    FROM DUAL) B
                             ON (A.LALTID = B.LALTID 
                                 AND (A.LALTREQID = B.LALTREQID OR A.LALTREQID IS NULL)
                                 AND A.LALTEDATE >= SYSTIMESTAMP - INTERVAL '1' MINUTE)
                             WHEN MATCHED THEN
                                UPDATE SET A.LALTMESS = B.LALTMESS,
                                          A.LALTROWCOUNT = B.LALTROWCOUNT,
                                          A.LALTDMAJ = B.LALTDMAJ
                             WHEN NOT MATCHED THEN
                                INSERT (LALTID, LALTEDATE, LALTMESS, LALTDCRE, LALTDMAJ, LALTUTIL, LALTROWCOUNT, LALTREQID)
                                VALUES (B.LALTID, SYSDATE, B.LALTMESS, B.LALTDCRE, B.LALTDMAJ, B.LALTUTIL, B.LALTROWCOUNT, B.LALTREQID)`;
            
            const bindParams = {
              reqid: request.requestId || null,
              altid: alertData[0].ALTID,
              blobdata: Buffer.from(archiveJson, 'utf8'),
              util: 'notification.js',
              rowcount: String(totalArchiveRows)
            };
            
            await archiveConnection.execute(mergeSql, bindParams, { autoCommit: true });
            heap.logger.log('alert', 'Archive SUCCESS - ALTID: ' + alertData[0].ALTID, 'alert', 1);
            
          } catch (archiveErr) {
            heap.logger.log('alert', 'Archive ERROR: ' + archiveErr.message, 'alert', 3);
          } finally {
            if (archiveConnection) {
              try {
                await archiveConnection.close();
              } catch (closeErr) {
                heap.logger.log('alert', 'Archive connection close error: ' + closeErr.message, 'alert', 3);
              }
            }
          }
        })();

        // Cleanup
        result = null;
        clearModule();
        global.gc();
          }
        }
    );

}

function processContentNoHTML(SQL, alertData, request, result, response) {
  let SUBJECT_EXT ='';
  let FILENAME_EXT='result.xlsx';
  if ( typeof request.header('SUBJECT_EXT') !== 'undefined' )  {
      SUBJECT_EXT = request.header('SUBJECT_EXT');
  }
  if ( typeof request.header('FILENAME_EXT') !== 'undefined' )  {
      FILENAME_EXT = request.header('FILENAME_EXT');
  }

  let bannerAdjusted, queryAdjusted;

  if ( result.ROOT.BANNER !== 'undefined' )  {
      bannerAdjusted = '' + result.ROOT.BANNER;;
  }
  if ( result.ROOT.QUERY !== 'undefined' )  {
      queryAdjusted = '' + result.ROOT.QUERY;
  }
  try {
      queryAdjusted = '' + result.ROOT.QUERY;
  } catch (err) {
      heap.logger.log('alert', 'Error formatting XML - Query not found ROOT :' + JSON.stringify(err.message), 'alert', 3);
      return;
  }

  bannerAdjusted = bannerAdjusted.replace(/'/g,"''");
  queryAdjusted = queryAdjusted.replace(/'/g,"''");

  SQL.executeQuery(SQL.getNextTicketID(),
                      result.ROOT.QUERY, 
                      "'{" + request.query.PARAM + "}'",
                      request.header('USER'),
                      "'{" + request.header('DATABASE_SID') + "}'", 
                      "'{" +request.header('LANGUAGE') + "}'", 
                      request, response);

}


module.exports.sendSMS = sendSMS;
module.exports.sendEmailCSV = sendEmailCSV;
module.exports.sendEmail = sendEmail;

module.exports = function (app, SQL) {

    let module = {};
    
/**
* GET method description.  
* Http Method: GET
* URL        : /api/notifications/?PARAM=...
*
*
* @method sendSMS
* @param {Object} request HTTP request. The request must contain :
*       - USER in the header (for log)
*       - PARAM in the request with the language
* @param {Object} response is the server response 
* @return {Boolean} Returns the item general information
*
* sub-module calls LIBQUERY entry NOT0000001
*/
module.get = async function (request,response) {
    /* This library entry, execute the alert and send the email to the distribution list */
    app.get('/api/notification/', function (request, response) {
    "use strict";
    response.setHeader('Access-Control-Allow-Origin', '*');
    // requestuest methods you wish to allow
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

     heap.transporter.verify(function(error, success) {
        if (error) {
            heap.logger.log('alert', 'Error config transporter: ' + JSON.stringify(error) , 'alert', 3);
        } 
      });

    // paramAdjusted.replace(/'/g,"''")
    SQL.executeLibQueryUsingMyCallback(SQL.getNextTicketID(),
                        "NOT0000001", 
                        "'{" + request.query.PARAM + "}'",
                        request.header('USER'),
                        "'{" + request.header('DATABASE_SID') + "}'", 
                        "'{" +request.header('LANGUAGE') + "}'", 
                        request.req_dataAlert, request.response_dataAlert, 
        function (err, dataAlert) { 
            let alertData = JSON.parse(JSON.stringify(dataAlert)); 
            dataAlert = null;
            if (err) {
                heap.logger.log('alert', 'Error gathering XML query : ' + JSON.stringify(err) , 'alert', 3);
            }
            else {
                if (alertData.length >= 1) {
                    if (alertData[0].ALTSQL) {
                        let content = alertData[0].ALTSQL;
                        heap.logger.log('alert', 'Query store in DB : ' + content, 'alert', 1);

                        heap.parseXML2JS(content, function (err, result) {
                            heap.logger.log('alert', 'content XML' + JSON.stringify(result), 'alert', 3);
                            // Now process the content from XML file
                            processContent(SQL, alertData, request, response, result);
                        });
                    }
                    else if (alertData[0].ALTFILE) {
                            // Read from XML file
                            heap.logger.log('alert', 'Capturing info in : ' + JSON.stringify(alertData[0].ALTFILE) , 'alert', 1);
                            heap.fs.readFile(alertData[0].ALTFILE, 'utf8', function (err, data) {
                                if (err) {
                                    heap.logger.log('alert', 'Error reading XML: ' + alertData[0].ALTFILE + ': ' + JSON.stringify(err.message), 'alert', 3);
                                    return;
                                }
                                heap.parseXML2JS(data, function (err, result) {
                                    heap.logger.log('alert', 'content XML' + JSON.stringify(result), 'alert', 3);
                                    // Now process the content from XML file
                                    processContent(SQL, alertData, request, response, result);
                                });
                            });
                        }  else {
                        heap.logger.log('alert', 'No ALTFILE or ALTSQL found in alert data', 'alert', 3);
                    }

                    }
                }
            response.send('');
            global.gc();
            try {
                    heap.logger.log('alert', 'Garbage collector execution ' + JSON.stringify(e), 'alert', 1);
                    global.gc();
              } catch (e) {
                heap.logger.log('alert', 'Garbage collector issue ' + JSON.stringify(e), 'alert', 3);
              }
        });
    });


    /* This library entry - execute the query and return the result */
    app.get('/api/notification/1', function (request, response) {
        "use strict";
        response.setHeader('Access-Control-Allow-Origin', '*');
        // requestuest methods you wish to allow
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        SQL.executeLibQueryUsingMyCallback(SQL.getNextTicketID(),
                            "NOT0000001", 
                            "'{" + request.query.PARAM + "}'",
                            request.header('USER'),
                            "'{" + request.header('DATABASE_SID') + "}'", 
                            "'{" +request.header('LANGUAGE') + "}'", 
                            request.req_dataAlert, request.response_dataAlert, 
            function (err, dataAlert) { 
                let alertData = JSON.parse(JSON.stringify(dataAlert)); 
                dataAlert = null;
                if (err) {
                    heap.logger.log('alert', 'Error gathering XML query : ' + JSON.stringify(err) , 'alert', 3);
                }
                else {
                    if (alertData.length >= 1) {

                    if (alertData[0].ALTSQL) {
                        let content = alertData[0].ALTSQL;

                        heap.parseXML2JS(content, function (err, result) {
                            heap.logger.log('alert', 'content XML' + JSON.stringify(result), 'alert', 3);
                            // Now process the content from XML file
                            processContentNoHTML(SQL, alertData, request, result, response);
                        });
                    }
                    else if (alertData[0].ALTFILE) {
                            // Read from XML file
                            heap.logger.log('alert', 'Capturing info in : ' + JSON.stringify(alertData[0].ALTFILE) , 'alert', 1);
                            heap.fs.readFile(alertData[0].ALTFILE, 'utf8', function (err, data) {
                                if (err) {
                                    heap.logger.log('alert', 'Error reading XML: ' + alertData[0].ALTFILE + ': ' + JSON.stringify(err.message), 'alert', 3);
                                    return;
                                }
                                heap.parseXML2JS(data, function (err, result) {
                                    heap.logger.log('alert', 'content XML' + JSON.stringify(result), 'alert', 3);
                                    // Now process the content from XML file
                                    processContentNoHTML(SQL, alertData, request, result, response);
                                });
                            });
                        }  
                        else {
                        heap.logger.log('alert', 'No ALTFILE or ALTSQL found in alert data', 'alert', 3);
                      }
                    }
                }

                //alertData=null;
            try {
                    heap.logger.log('alert', 'Garbage collector execution ', 'alert', 1);
                    global.gc();
              } catch (e) {
                heap.logger.log('alert', 'Garbage collector issue ' + JSON.stringify(e), 'alert', 3);
              }
            });
        });

    /* This library entry - execute shell script from SALTSHELL */
    app.get('/api/notification/shell', function (request, response) {
        "use strict";
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        
        // Query to get the schedule data with SALTSHELL - SALTID is passed as first PARAM
        // Uses CRON000003 or a new library query that returns SALTSHELL for a given SALTID
        SQL.executeLibQueryUsingMyCallback(SQL.getNextTicketID(),
                            "SHELL00001",  // New library query to get schedule with SALTSHELL by SALTID
                            "'{" + request.query.PARAM + "}'",
                            request.header('USER'),
                            "'{" + request.header('DATABASE_SID') + "}'", 
                            "'{" + request.header('LANGUAGE') + "}'", 
                            request.req_dataSchedule, request.response_dataSchedule, 
            async function (err, dataSchedule) { 
                if (err) {
                    heap.logger.log('alert', 'Error gathering schedule data: ' + JSON.stringify(err), 'alert', 3);
                    response.status(500).send([{ STATUS: 'ERROR', MESSAGE: 'Failed to retrieve schedule data' }]);
                    return;
                }

                let scheduleData = JSON.parse(JSON.stringify(dataSchedule));
                
                if (scheduleData.length < 1) {
                    heap.logger.log('alert', 'No schedule found for SALTID: ' + request.query.PARAM, 'alert', 3);
                    response.status(404).send([{ STATUS: 'ERROR', MESSAGE: 'Schedule not found' }]);
                    return;
                }

                const saltshell = scheduleData[0].SALTSHELL;
                const saltid = scheduleData[0].SALTID;

                if (!saltshell || saltshell.trim() === '') {
                    heap.logger.log('alert', 'No SALTSHELL content for SALTID: ' + saltid, 'alert', 3);
                    response.status(400).send([{ STATUS: 'ERROR', MESSAGE: 'No shell script content found' }]);
                    return;
                }

                heap.logger.log('alert', 'Executing shell script for SALTID: ' + saltid, 'alert', 2);

                try {
                    const result = await executeShellScript(saltid, saltshell, request.header('USER') || 'notification');
                    heap.logger.log('alert', 'Shell script execution completed: ' + JSON.stringify(result), 'alert', 2);
                    
                    // Return result as array for consistent frontend handling
                    if (result.output) {
                        try {
                            // Try to parse output as JSON
                            const parsedOutput = JSON.parse(result.output);
                            response.send(Array.isArray(parsedOutput) ? parsedOutput : [parsedOutput]);
                        } catch (parseErr) {
                            // Output is not JSON, return as structured result
                            response.send([{ 
                                STATUS: result.success ? 'SUCCESS' : 'ERROR',
                                EXIT_CODE: result.exitCode,
                                OUTPUT: result.output,
                                ERROR_OUTPUT: result.errorOutput,
                                MESSAGE: result.message
                            }]);
                        }
                    } else {
                        response.send([{ 
                            STATUS: result.success ? 'SUCCESS' : 'ERROR',
                            MESSAGE: result.message
                        }]);
                    }
                } catch (error) {
                    heap.logger.log('alert', 'Shell script execution failed: ' + JSON.stringify(error), 'alert', 3);
                    response.status(500).send([{ 
                        STATUS: 'ERROR',
                        MESSAGE: error.message || 'Shell script execution failed'
                    }]);
                }

                try {
                    global.gc?.();
                } catch (e) {
                    heap.logger.log('alert', 'Garbage collector issue ' + JSON.stringify(e), 'alert', 3);
                }
            });
        });
    }
    return module;
 }