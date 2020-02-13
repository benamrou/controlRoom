
var logger = require("../utils/logger.js");
const excel = require('exceljs');


/**
 * Sub-function to autofitColums function
 * @param {*} ws 
 * @param {*} col1 
 * @param {*} col2 
 * @param {*} cb 
 */
function eachColumnInRange(ws, col1, col2, cb){
    for(let c = col1; c <= col2; c++){
        let col = ws.getColumn(c);
        cb(col);
    }
}

/**
 * Function autofitColumns auto-adjust the length of the cell accordingly to the column max length
 * @param {*} ws 
 */
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


/**
 * Function setPrintArea define the printing area and orientation defined in the alert Header
 * @param {*} ws 
 * @param {*} alert 
 */
function setPrintArea(ws, alert) {
    // Set Print Area for a sheet
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

/**
 * Function formatXLS define the conditional rule in FormatRule for the worksheet
 * @param {*} worksheet 
 * @param {*} formatRule 
 */
 function formatXLS (worksheet, dataRows, formatRule) {
    let cellRuleXLS=JSON.parse(formatRule);
    if(cellRuleXLS != null) {
        logger.log('alert', 'formatting EXCEL : ' + JSON.stringify(cellRuleXLS), 'alert', 1);
        for (let i =0; i < cellRuleXLS.conditionalRule.length; i++) {
            let row = 0;
            let every = 0;
            if (cellRuleXLS.conditionalRule[i].easeRule.repeat === '1') {
                row = +cellRuleXLS.conditionalRule[i].easeRule.lineStart;
                every = +cellRuleXLS.conditionalRule[i].easeRule.every;
            }
            for (let k = row; k < dataRows.length + row + 1; k += every) {
                if(cellRuleXLS.conditionalRule[i].hasOwnProperty('rules')) {
                    for (let j =0; j < cellRuleXLS.conditionalRule[i].rules.length; j++) {
                        let reference = cellRuleXLS.conditionalRule[i].easeRule.columnStart + k + ':' + 
                                        cellRuleXLS.conditionalRule[i].easeRule.columnEnd + k;
                            for (let l =0; l < cellRuleXLS.conditionalRule[i].rules[j].rule.length; l++) {
                                
                                if(cellRuleXLS.conditionalRule[i].rules[j].rule[l].hasOwnProperty('style')) {
                                    worksheet.addConditionalFormatting({
                                        ref: reference,
                                        rules: [{
                                            type: cellRuleXLS.conditionalRule[i].rules[j].rule[l].type,
                                            operator: cellRuleXLS.conditionalRule[i].rules[j].rule[l].operator,
                                            style: cellRuleXLS.conditionalRule[i].rules[j].rule[l].style
                                        }]}); 
                                }
                                if(cellRuleXLS.conditionalRule[i].rules[j].rule[l].hasOwnProperty('cfvo')) {
                                    worksheet.addConditionalFormatting({
                                        ref: reference,
                                        rules: [{
                                            type: cellRuleXLS.conditionalRule[i].rules[j].rule[l].type,
                                            operator: cellRuleXLS.conditionalRule[i].rules[j].rule[l].operator,
                                            cfvo: cellRuleXLS.conditionalRule[i].rules[j].rule[l].cfvo,
                                            color: cellRuleXLS.conditionalRule[i].rules[j].rule[l].color,
                                        }]}); 
                                }

                                    /*console.log('Ref : ' + reference);
                                    console.log('j : ' + j);*/
                                    //console.log('rules : ' + JSON.stringify(cellRuleXLS.conditionalRule[i].rules[j]) );
                                    /*console.log('type : ' + cellRuleXLS.conditionalRule[i].rules[j].rule[l].type);
                                    console.log('operator : ' + cellRuleXLS.conditionalRule[i].rules[j].rule[l].operator);
                                    console.log('style : ' + cellRuleXLS.conditionalRule[i].rules[j].rule[l].style);*/
                            }
                        }
                    }
                    if(cellRuleXLS.conditionalRule[i].hasOwnProperty('style')) {
                        // Code to parse the first letter column to the end
                        for(let m = cellRuleXLS.conditionalRule[i].easeRule.columnStart.charCodeAt(0); 
                                m <= cellRuleXLS.conditionalRule[i].easeRule.columnEnd.charCodeAt(0); m++) {
                                    //console.log('process...');
                                    //console.log('Lattre : ' + String.fromCharCode(m));
                                    let cellToFormat = String.fromCharCode(m) + k + '';
                                worksheet.getCell(cellToFormat).style = cellRuleXLS.conditionalRule[i].style;
                                //worksheet.getCell(cellToFormat).value.result=undefined;
                                if(! Number.isNaN(parseFloat(worksheet.getCell(cellToFormat).value))) {
                                    let value = parseFloat(worksheet.getCell(cellToFormat).value);

                                    worksheet.getCell(cellToFormat).value=value/100;
                                }
                                //worksheet.getCell(cellToFormat).value=parseFloat(worksheet.getCell(cellToFormat).value)/100;

                        }
                    }
                }
            }
        }
}

/**
 * Function setXLSHeader define top X rows header in the template report
 * @param {*} worksheet 
 * @param {*} alertDataHeader 
 */
function setXLSHeader(worksheet, alertData, extensionHeader) {

    /**
     * Excel file
     *      4 first rows are the header reports
     *  Starting line 5 the table is deployed
     * 
     */
    let tableRow = 5;

    worksheet.getCell('B2').value = 'Report Title';
    
    worksheet.getCell('C2').value = alertData[0].ALTSUBJECT + ' ' + extensionHeader;
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

}

/**
 * Function setXLSProperties define the EXCEL file property
 * @param {*} workbook 
 */
function setXLSProperties(workbook) {
    workbook.creator = 'B&B SYMPHONY LLC';
    workbook.lastModifiedBy = 'B&B SYMPHONY LLC';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.lastPrinted = new Date();
    workbook.calcProperties.fullCalcOnLoad = true;
}

function json2xls(workbook, worksheet, alertData, detailData, extensionHeader) {
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

    setXLSHeader(worksheet, alertData, extensionHeader);

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
    
    try {
        formatXLS(worksheet,dataRows, alertData[0].ALTFORMATXLS);
    } catch (err) {
        logger.log('alert', 'Error formatting XLS ', 'alert', 3);
    }
    try {
        autofitColumns(worksheet);
    } catch (err) {
        logger.log('alert', 'Error autofitColumns ', 'alert', 3);
    }
    try {
        setPrintArea(worksheet, alertData[0]);
    } catch (err) {
        logger.log('alert', 'Error setPrintArea ', 'alert', 3);
    }

    try {
        setXLSProperties(workbook);
    } catch (err) {
        logger.log('alert', 'Error setXLSProperties ', 'alert', 3);
    }

}

module.exports.json2xls = json2xls; 