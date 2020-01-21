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

var logger = require("../utils/logger.js");
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
            //console.log(error);
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
            //console.log(error);
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

/*************************************************(**********************************(***********************************/
// Function setPrintArea
function setPrintArea(ws, alert) {
    // Set Print Area for a sheet

/*
    let nbRowPerPage = 40;
    let printArea = 'A1:' + columnLetter[ws.columnCount] + nbRowPerPage;
    for (let i = nbRowPerPage + 1; i <= ws.rowCount ; i + nbRowPerPage) {
        if (i+nbRowPerPage <= ws.rowCount) {
            printArea += '&&' + 'A' + i + columnLetter[ws.columnCount] + ws.rowCount;
        }
        else {
            printArea += '&&' + 'A' + i + columnLetter[ws.columnCount] + i;
        }
    }
*/
    if (alert.ALTORIENTATION) {
        ws.pageSetup.orientation = alert.ALTORIENTATION;
    }
    if (alert.ALTFITPAGE) {
        ws.pageSetup.fitToPage = alert.ALTFITPAGE === 1;
        if (alert.altfitpage === 1) {
            ws.pageSetup.fitToHeight = alert.ALTFITHEIGHT;
            ws.pageSetup.fitToWidth = alert.ALTFITWIDTH;
        }
    }
    if (alert.ALTTITLEREPEAT) {
        ws.pageSetup.printTitlesRow = alert.ALTTITLEREPEAT;
    }
    if (alert.ALTFOOTER) {
        ws.headerFooter.oddFooter = alert.ALTFOOTER;
    }

    // Set multiple Print Areas by separating print areas with '&&'
    //ws.pageSetup.printArea = printArea;

    // Repeat specific rows on every printed page
    // Five first row are reprinted on the next page

    //console.log('setPrintArea : ', ws);                   
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
                        request.req_dataAlert, request.response_dataAlert, 
        function (err, dataAlert) { 
            let alertData = dataAlert; 
            if (err) {
                console.log('Error gathering XML query : ' + JSON.stringify(err));
            }
            else {
                if (alertData.length >= 1) {
                    fs.readFile(alertData[0].ALTFILE, 'utf8', function (err, data) {
                        if (err) throw err; // we'll not consider error handling for now
                        //console.log(JSON.stringify(data));
                        parseXML2JS(data, function (err, result) {
                            //console.log('objXML2JS.query: ' + result.ROOT.QUERY);
                            //console.log('objXML2JS.param: ' + result.ROOT.PARAM);
                            
                            let SUBJECT_EXT ='';
                            if ( typeof request.header('SUBJECT_EXT') !== 'undefined' )  {
                                SUBJECT_EXT = request.header('SUBJECT_EXT');
                            }
                            //console.log('FILE : ' + JSON.stringify(result));

                            SQL.executeQueryUsingMyCallBack(SQL.getNextTicketID(),
                                result.ROOT.BANNER, 
                                "'{" + request.query.PARAM + "}'",
                                request.header('USER'),
                                "'{" + request.header('DATABASE_SID') + "}'", 
                                "'{" +request.header('LANGUAGE') + "}'", 
                                request.req_dataBanner, request.response_dataBanner, 
                                function (err,dataBanner) {
                                    let bannerData = dataBanner;
                                    console.log('BANNER : ' + JSON.stringify(bannerData));

                                    SQL.executeQueryUsingMyCallBack(SQL.getNextTicketID(),
                                        result.ROOT.QUERY, 
                                        "'{" + request.query.PARAM + "}'",
                                        request.header('USER'),
                                        "'{" + request.header('DATABASE_SID') + "}'", 
                                        "'{" +request.header('LANGUAGE') + "}'", 
                                        request.req_datadetail, request.response_dataDetail, 
                                        function (err,dataDetail) {
                                            let detailData =dataDetail;
                                            if (detailData.length > 0 || alertData[0].ALTREALTIME == '0') {
                                                let html = '';
                                                let workbook, worksheet;
                                                if (bannerData.length >= 1) {
                                                    if (bannerData[0].MESSAGE) {
                                                    //console.log('BANNER2 : ' + JSON.stringify(bannerData));
                                                    //console.log('bannerData[0].MESSAGE : ' + bannerData[0].MESSAGE);
                                                    if (bannerData[0].CRITICALITY === 'WARNING') {
                                                        html += '<div style="position: absolute; top: 0; left: 0;  width: 100%; text-align: center;background-color: #bb3434; ">';
                                                        html += '<span style="font-weight: bolder;color:#FFFFFF">'
                                                    }
                                                    else {
                                                        html += '<div style="position: absolute; top: 0; left: 0;  width: 100%; text-align: center;background-color: #32CD32;">'
                                                        html += '<span style="font-weight: bolder;color:#000000">'
                                                    }
                                                    html += bannerData[0].MESSAGE;
                                                    html += '</span>';
                                                    html += '</div>';
                                                    html += '<br>';
                                                    html += '<br>';
                                                    
                                                    }
                                                }
                                                html += '<strong>' + alertData[0].ALTSUBJECT + ' ' + SUBJECT_EXT + ' [' + detailData.length + ' Object(s)] </strong>';
                                                html += '<br>';
                                                html += '<br>';
                                                html += alertData[0].ALTCONTENT;
                                                html += '<br>';
                                                html += '<br>';
                                                html += '<br>';
                                                if (detailData.length == 0) {
                                                    html += 'No reported elements.';
                                                    sendEmail(alertData[0].ALTEMAIL, alertData[0].ALTSUBJECT + ' ' + SUBJECT_EXT + ' [' + detailData.length + ' Object(s)] ', html);
                                                }
                                                else {
                                                    if (detailData.length > 500) {
                                                        html += 'Number of objects > 500 - Look at the attachment for details.';
                                                    }
                                                    else {
                                                        html = json2html.json2table(detailData, html, alertData[0].ALTFORMAT);
                                                    }
                                                    console.log('HTML : ' + html);
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
                                                    //console.log('detailData :' + JSON.stringify(detailData)); 
                                                    //console.log('detailData[0] :' + detailData[0]); 
                                                    //console.log('request.query.PARAM : ' + request.query.PARAM);
                                                    let valueColumns = Object.keys(detailData[0]);
                                                    let dataColumns = [];
                                                    for(let i =0;i < valueColumns.length ; i ++) {
                                                        dataColumns.push (
                                                            {name: valueColumns[i], filterButton: true}
                                                        )
                                                    }
                                                    // Add rows detail
                                                    let dataRows = [];
                                                    for (let i = 0; i < detailData.length; i++) {
                                                        dataRows.push (Object.values(detailData[i]));
                                                    }
                                                    worksheet.getCell('B2').value = 'Report Title';
                                                    worksheet.getCell('C2').value = alertData[0].ALTSUBJECT + ' ' + SUBJECT_EXT;
                                                    worksheet.getCell('C3').value = alertData[0].ALTCONTENT;
                                                    worksheet.mergeCells('C2','G2');
                                                    worksheet.mergeCells('C3','G3');


                                                    worksheet.getCell('H2').value = 'Report ID';
                                                    worksheet.getCell('I2').value = alertData[0].ALTID;
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
                                                    // Creating the table detail EXCEL (real table)
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
                                                    setPrintArea(worksheet, alertData[0]);

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
                                                    //worksheet = formatWorkSheet(worksheet, detailData);
                                                    


                                                    if (html.indexOf('ERRORDIAGNOSED') < 1) {
                                                        workbook.xlsx.writeBuffer()
                                                        .then(function(buffer) {
                                                            sendEmailCSV(alertData[0].ALTEMAIL, alertData[0].ALTSUBJECT + ' ' + SUBJECT_EXT + ' [' + detailData.length + ' Object(s)] ', html, buffer);
                                                        });
                                                    }
                                                }

                                                if (alertData[0].ALTSMSCONTENT != '' && html.indexOf('ERRORDIAGNOSED') < 1) {
                                                    let newLineSMS = '<br>'
                                                    sendSMS(alertData[0].ALTMOBILE,   /* To */
                                                            alertData[0].ALTSUBJECT + ' ' + SUBJECT_EXT,  /* Subject */
                                                            alertData[0].ALTSMSCONTENT + ' : ' + detailData.length + newLineSMS +
                                                                    '<b>Distribution list : </b> ' + alertData[0].ALTEMAIL) ;  /* Content */
                                                }
                                            }   
                                            console.log ('detailData.length : ' + detailData.length);
                                            SQL.executeQuery(SQL.getNextTicketID(),
                                            "INSERT INTO ALERTLOG  SELECT ''" + alertData[0].ALTID + "'', SYSDATE, utl_raw.cast_to_raw(SUBSTR(''" +
                                            JSON.stringify(detailData).substring(1,3000) + "'',1,2000)), sysdate, sysdate, ''notification.js'', ''" + detailData.length + "'' from dual", 
                                            "'" + result.ROOT.PARAM + "'",
                                            request.header('USER'),
                                            "'{" + request.header('DATABASE_SID') + "}'", 
                                            "'{" +request.header('LANGUAGE') + "}'", 
                                            request, response);

                                            //sendEmail(alertData[0].ALTEMAIL, alertData[0].ALTSUBJECT, 'body')  
                                            //response.send(detailData);
                                            //return;
                                        });
                                    });
                                });
                            });
                        }
                    }
            //response.send(alertData)
        });
    })};
    return module;
 }
