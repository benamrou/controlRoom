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

const nodemailer = require('nodemailer');
const csvjson = require('csvjson');
const excel = require('exceljs');
//const excel = require('xlsx');
//const json2xls = require('json2xls');
//const xlsx = require('node-xlsx');
let config = new require("../../config/" + (process.env.NODE_ENV || "development") + ".js");
let fs = require('fs');
let json2html = require('../utils/json2html.js');
var parseXML2JS = require('xml2js').parseString;
let transporter = nodemailer.createTransport({
    //service: config.notification.email_service,
    host: config.notification.email_host,
    port: config.notification.email_port,
    secure: config.notification.email_secure,
    auth: {
        user: config.notification.email_user,
        pass: config.notification.email_password,
    },
});


function sendSMS(to, subject, message) {
    let mailOptions = {
        from: config.notification.email_user,
        to,
        subject,
        html: message
    };
    let infoMessage = transporter.sendMail(mailOptions, (error) => {
        if (error) {
            console.log(error);
        }
    });
    console.log("Message sent: %s", message);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
  
    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(infoMessage));
}


function sendEmail(to, subject, message) {
    let mailOptions = {
        from: config.notification.email_user,
        to,
        subject,
        html: message
    };
    let infoMessage = transporter.sendMail(mailOptions, (error) => {
        if (error) {
            console.log(error);
        }
    });
    console.log("Message sent: %s", message);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
  
    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(infoMessage));
}

function sendEmailCSV(to, subject, message, stream) {
    let mailOptions = {
        from: config.notification.email_user,
        to,
        subject,
        html: message,
        attachments: [{
            filename: 'result.xlsx',
            content: new Buffer(stream, 'utf-8')
        }]
    };
    let infoMessage = transporter.sendMail(mailOptions, (error) => {
        if (error) {
            console.log(error);
        }
    });
    console.log("Message sent: %s", message);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
  
    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(infoMessage));
}

/*************************************************(**********************************(***********************************/
// Function to autofit the columns
function eachColumnInRange(ws, col1, col2, cb){
    for(let c = col1; c <= col2; c++){
        let col = ws.getColumn(c);
        cb(col);
    }
}

function autofitColumns(ws){ // no good way to get text widths
    eachColumnInRange(ws, 1, ws.columnCount, column => {
        
        let maxWidth=10;
        column.eachCell( cell => {
            if( !cell.isMerged && cell.value ){ // doesn't handle merged cells
                
                let text = "";
                if( typeof cell.value != "object" ){ // string, number, ...
                    text = cell.value.toString();
                } else if( cell.value.richText ){ // richText
                    text = cell.value.richText.reduce((text, obj)=>text+obj.text.toString(),"");
                }

                // handle new lines -> don't forget to set wrapText: true
                let values = text.split(/[\n\r]+/);
                
                for( let value of values ){
                    let width = value.length;
                    
                    if(cell.font && cell.font.bold){
                        width *= 1.08; // bolding increases width
                    }
                    
                    maxWidth = Math.max(maxWidth, width);
                }
            }
        });
        
        maxWidth += 0.71; // compensate for observed reduction
        maxWidth += 1; // buffer space
        
        column.width = maxWidth;
    });
}

/*************************************************(**********************************(***********************************/

module.exports.sendSMS = sendSMS;
module.exports.sendEmailCSV = sendEmailCSV;
module.exports.sendEmail = sendEmail;

module.exports = function (app, SQL) {

    var module = {};
    
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
module.exports = 


module.get = async function (request,response) {
    app.get('/api/notification/', function (request, response) {
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
                        request, response, 
        function (err,dataHeader) {
            if (dataHeader.length >= 1) {

                fs.readFile(dataHeader[0].ALTFILE, 'utf8', function (err, data) {
                    if (err) throw err; // we'll not consider error handling for now
                    //console.log(JSON.stringify(data));
                    parseXML2JS(data, function (err, result) {
                        //console.log('objXML2JS.query: ' + result.ROOT.QUERY);
                        //console.log('objXML2JS.param: ' + result.ROOT.PARAM);
                        
                        let SUBJECT_EXT ='';
                        if ( typeof request.header('SUBJECT_EXT') !== 'undefined' )  {
                            SUBJECT_EXT = request.header('SUBJECT_EXT');
                        }

                        SQL.executeQueryUsingMyCallBack(SQL.getNextTicketID(),
                            result.ROOT.QUERY, 
                            "'{" + request.query.PARAM + "}'",
                            request.header('USER'),
                            "'{" + request.header('DATABASE_SID') + "}'", 
                            "'{" +request.header('LANGUAGE') + "}'", 
                            request, response, 
                            function (err,dataDetail) {
                                if (dataDetail.length > 0 || dataHeader[0].ALTREALTIME == '0') {
                                    let html= '<strong>' + dataHeader[0].ALTSUBJECT + ' ' + SUBJECT_EXT + ' [' + dataDetail.length + ' Object(s)] </strong>';
                                    let workbook, worksheet;
                                    html+= '<br>';
                                    html+= '<br>';
                                    html+= dataHeader[0].ALTCONTENT;
                                    html+= '<br>';
                                    html+= '<br>';
                                    html+= '<br>';
                                    if (dataDetail.length == 0) {
                                        html += 'No reported elements.';
                                        sendEmail(dataHeader[0].ALTEMAIL, dataHeader[0].ALTSUBJECT + ' ' + SUBJECT_EXT + ' [' + dataDetail.length + ' Object(s)] ', html);
                                    }
                                    else {
                                        if (dataDetail.length > 500) {
                                            html += 'Number of objects > 500 - Look at the attachment for details.';
                                        }
                                        else {
                                            html = json2html.json2table(dataDetail, html);
                                        }
                                        /**
                                         * Excel file
                                         *      4 first rows are the header reports
                                         *  Starting line 5 the table is deployed
                                         * 
                                         */
                                        let tableRow = 5;
                                        workbook = new excel.Workbook();
                                        worksheet = workbook.addWorksheet('RESULT', {properties:{tabColor:{argb:'FFC0000'}}});
                                        // Add header
                                        let valueColumns = Object.keys(dataDetail[0]);
                                        let dataColumns = [];
                                        for(let i =0;i < valueColumns.length ; i ++) {
                                            dataColumns.push (
                                                {name: valueColumns[i], filterButton: true}
                                            )
                                        }

                                        // Add rows detail
                                        let dataRows = [];
                                        for (let i = 0; i < dataDetail.length; i++) {
                                            dataRows.push (Object.values(dataDetail[i]));
                                        }
                                        worksheet.getCell('B2').value = 'Report Title';
                                        worksheet.getCell('C2').value = dataHeader[0].ALTSUBJECT + ' ' + SUBJECT_EXT;
                                        worksheet.getCell('C3').value = dataHeader[0].ALTCONTENT;

                                        worksheet.getCell('H2').value = 'Report ID';
                                        worksheet.getCell('I2').value = dataHeader[0].ALTID;
                                        worksheet.getCell('H3').value = 'Report date';
                                        worksheet.getCell('I3').value = new Date(); 
                                        
                                        for (let i = 0; i< tableRow; i ++) {
                                            worksheet.getRow(i).fill = {
                                                type: 'pattern',
                                                pattern:'lightTrellis',
                                                fgColor:{argb:'FFFFFFFF'},
                                                bgColor:{argb:'04225E80'}
                                            };
                                        }
                                        // Styling the header
                                        worksheet.getCell('B2').font = {
                                            name: 'Arial',
                                            family: 4,
                                            color: { argb: 'FFFFFFFF' },
                                            size: 11,
                                            underline: false,
                                            bold: true
                                          };
                                        worksheet.getCell('H2').font = worksheet.getCell('B2').font;
                                        worksheet.getCell('H3').font = worksheet.getCell('B2').font

                                        worksheet.getCell('C2').font = {
                                            name: 'Arial',
                                            family: 4,
                                            color: { argb: 'FFFFFFFF' },
                                            size: 14,
                                            underline: false,
                                            bold: true
                                          };

                                        worksheet.getCell('C3').font = {
                                            name: 'Arial',
                                            family: 4,
                                            color: { argb: '000000' },
                                            size: 14,
                                            underline: false,
                                            bold: false
                                          };

                                          worksheet.getCell('I2').font = worksheet.getCell('C2').font
                                          worksheet.getCell('I3').font = worksheet.getCell('C2').font
                                        /**************************************************************************/  
                                        // Crating the table detail EXCEL (real table)
                                        worksheet.addTable({
                                            name: 'Result',
                                            ref: 'A5',
                                            headerRow: true,
                                            totalsRow: true,
                                            style: {
                                              theme: 'TableStyleLight1',
                                              showRowStripes: true,
                                            },
                                            columns: dataColumns,
                                            rows: dataRows,
                                          });

                                        autofitColumns(worksheet);

                                        workbook.creator = 'B&B SYMPHONY LLC';
                                        workbook.lastModifiedBy = 'B&B SYMPHONY LLC';
                                        workbook.created = new Date();
                                        workbook.modified = new Date();
                                        workbook.lastPrinted = new Date();
                                        /*workbook.Props = {
                                            Title: "BB SYMPHONY Alert result " + result.ROOT.QUERY,
                                            Subject: "Alert",
                                            Author: "BB SYMPHONY",
                                            Manager: "ControlRoom",
                                            Company: "BB SYMPHONY",
                                            Category: "Experimentation",
                                            Keywords: "Alert",
                                            Comments: "Automatic alert generation",
                                            LastAuthor: "BB SYMPHONY"
                                        };*/
                                        //worksheet = formatWorkSheet(worksheet, dataDetail);
                                        
                                        if (html.indexOf('ERRORDIAGNOSED') < 1) {
                                             workbook.xlsx.writeBuffer()
                                            .then(function(buffer) {
                                                sendEmailCSV(dataHeader[0].ALTEMAIL, dataHeader[0].ALTSUBJECT + ' ' + SUBJECT_EXT + ' [' + dataDetail.length + ' Object(s)] ', html, buffer);
                                            });
                                        }
                                    }

                                    if (dataHeader[0].ALTSMSCONTENT != '' && html.indexOf('ERRORDIAGNOSED') < 1) {
                                        sendSMS(dataHeader[0].ALTMOBILE,   /* To */
                                                  dataHeader[0].ALTSUBJECT + ' ' + SUBJECT_EXT,  /* Subject */
                                                  dataHeader[0].ALTSMSCONTENT + ' : ' + dataDetail.length +'\n') ;  /* Content */
                                    }
                                }   
                                console.log ('dataDetail.length : ' + dataDetail.length);
                                SQL.executeQuery(SQL.getNextTicketID(),
                                "INSERT INTO ALERTLOG  SELECT ''" + dataHeader[0].ALTID + "'', SYSDATE, utl_raw.cast_to_raw(SUBSTR(''" +
                                JSON.stringify(dataDetail).substring(1,3000) + "'',1,2000)), sysdate, sysdate, ''notification.js'', ''" + dataDetail.length + "'' from dual", 
                                "'" + result.ROOT.PARAM + "'",
                                request.header('USER'),
                                "'{" + request.header('DATABASE_SID') + "}'", 
                                "'{" +request.header('LANGUAGE') + "}'", 
                                request, response);

                                //sendEmail(dataHeader[0].ALTEMAIL, dataHeader[0].ALTSUBJECT, 'body')  
                                //response.send(dataDetail);
                                //return;
                            });
                        });
                    });
                }
            //response.send(dataHeader)
        });
    })};
    return module;
 }
