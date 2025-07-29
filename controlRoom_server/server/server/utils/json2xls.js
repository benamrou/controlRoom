
"use strict";

let heap = {
    logger: require("../utils/logger.js"),
    excel : require('exceljs'),
    TABLE_HEADER : 4
}

/**
 * Sub-function to autofitColums function
 * @param {*} ws 
 * @param {*} col1 
 * @param {*} col2 
 * @param {*} cb 
 */
function eachColumnInRange(ws, col1, col2, cb){
    for(let c = col1; c <= col2; c++){
        cb(ws.getColumn(c));
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
                let width;
                for( let value of values ){
                    width = value.length;
                    
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
 * Function setPageBreak define the page Break in the Excel file
 * @param {*} ws 
 * @param {*} alertData 
 * @param {*} alert 
 */
function setPageBreak(ws, alertData, alert) {
    // Set Print Area for a sheet
    let rowBreak = 0;
    if (alert.ALTXLSBREAK) {
        let xlsBreak=JSON.parse(alert.ALTXLSBREAK);
        for (let i=0; i <  xlsBreak.pageBreak.length ; i ++) {
            if (xlsBreak.pageBreak[i].hasOwnProperty('every')) {
                for(let j = xlsBreak.pageBreak[i].row; j < alertData.length; j += every) {
                    rowBreak = +xlsBreak.pageBreak[i].row;
                    ws.getRow(rowBreak+j).addPageBreak();
                }
            }
            else {
                rowBreak = +xlsBreak.pageBreak[i].row;
                ws.getRow(rowBreak).addPageBreak();
            }
        }
    }            
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
    ws.pageSetup.fitToPage = false;
    if (alert.ALTFITPAGE) {
        ws.pageSetup.fitToPage = alert.ALTFITPAGE === 1;
        if (ws.pageSetup.fitToPage) {
            ws.pageSetup.fitToHeight = alert.ALTFITHEIGHT;
            ws.pageSetup.fitToWidth = alert.ALTFITWIDTH;
        }
        else {
            if (alert.ALTSCALE) {
                ws.pageSetup.scale = alert.ALTSCALE;
            }
        }
    }
    else {
        ws.pageSetup.fitToPage = false;
        ws.pageSetup.fitToHeight = '';
        ws.pageSetup.fitToWidth = '';
    }
    if (alert.ALTTITLEREPEAT) {
        ws.pageSetup.printTitlesRow = alert.ALTTITLEREPEAT;
    }
    if (alert.ALTFOOTER) {
        ws.headerFooter.oddFooter = alert.ALTFOOTER;
    }
    if (alert.ALTPRINTAREA) {
        if (! ws.pageSetup.fitToPage) {
            ws.pageSetup.fitToHeight = '';
            ws.pageSetup.fitToWidth = '';
        }
        ws.pageSetup.printArea = alert.ALTPRINTAREA;
    }

    if (alert.ALTMARGIN) {
        ws.pageSetup.margins = JSON.parse(alert.ALTMARGIN);
        //heap.logger.log('alert', 'formatting EXCEL : ' + JSON.stringify(formatRule), 'alert', 1);

    }


    // Set multiple Print Areas by separating print areas with '&&'
    //ws.pageSetup.printArea = printArea;

    // Repeat specific rows on every printed page
    // Five first row are reprinted on the next page
       
}

function lettersToNumber(letters){
    let chrs = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ', mode = chrs.length - 1, number = 0;
    for(let p = 0; p < letters.length; p++){
        number = number * mode + chrs.indexOf(letters[p]);
    }
    return number;
}
/*************************************************(**********************************(***********************************/

/**
 * Function formatXLS define the conditional rule in FormatRule for the worksheet
 * @param {*} worksheet 
 * @param {*} formatRule 
 */
function formatXLS (worksheet, dataRows, formatRule) {
    heap.logger.log('alert', 'Formatting EXCEL file : ' + formatRule, 'alert', 1);
    if (formatRule) {
        //heap.logger.log('alert', 'formatting EXCEL : ' + JSON.stringify(formatRule), 'alert', 1);
        try {
            formatRule = formatRule.replace('}null','}\n');
            let cellRuleXLS=JSON.parse(formatRule);
            if(cellRuleXLS != null) {
                heap.logger.log('alert', 'conditionalRule EXCEL : ' + JSON.stringify(cellRuleXLS.conditionalRule), 'alert', 1);
                let row , maxRow, every;
                for (let i =0; i < cellRuleXLS.conditionalRule.length; i++) {
                    row = 0;
                    maxRow = 0;
                    every = 1;
                    if (cellRuleXLS.conditionalRule[i].easeRule.repeat === '1') {
                        row = +cellRuleXLS.conditionalRule[i].easeRule.lineStart;
                        if (cellRuleXLS.conditionalRule[i].easeRule.hasOwnProperty('lineStop')) {
                            maxRow = +cellRuleXLS.conditionalRule[i].easeRule.lineStop +1;
                        }
                        else {
                            maxRow = dataRows.length + row + 1;
                        }
                        every = +cellRuleXLS.conditionalRule[i].easeRule.every;
                    }
                    else {
                        maxRow = 1;
                    }
                    //worksheet.getRow(32).addPageBreak();
                    for (let k = row; k < maxRow; k += every) {
                        if(cellRuleXLS.conditionalRule[i].hasOwnProperty('rules')) {
                            for (let j =0; j < cellRuleXLS.conditionalRule[i].rules.length; j++) {
                                let reference = cellRuleXLS.conditionalRule[i].easeRule.columnStart + k + ':' + 
                                                cellRuleXLS.conditionalRule[i].easeRule.columnEnd + k;
                                    for (let l =0; l < cellRuleXLS.conditionalRule[i].rules[j].rule.length; l++) {
                                        if(cellRuleXLS.conditionalRule[i].rules[j].rule[l].hasOwnProperty('formulae')) {
                                            worksheet.addConditionalFormatting({
                                                ref: cellRuleXLS.conditionalRule[i].rules[j].ref,
                                                rules: [{
                                                    type: cellRuleXLS.conditionalRule[i].rules[j].rule[l].type,
                                                    formulae: cellRuleXLS.conditionalRule[i].rules[j].rule[l].formulae,
                                                    style: cellRuleXLS.conditionalRule[i].rules[j].rule[l].style
                                                }]}); 
                                            
                                        }
                                        if(cellRuleXLS.conditionalRule[i].rules[j].rule[l].hasOwnProperty('style') &&
                                           ! cellRuleXLS.conditionalRule[i].rules[j].rule[l].hasOwnProperty('formulae')) {
                                            worksheet.addConditionalFormatting({
                                                ref: reference,
                                                rules: [{
                                                    type: cellRuleXLS.conditionalRule[i].rules[j].rule[l].type,
                                                    operator: cellRuleXLS.conditionalRule[i].rules[j].rule[l].operator,
                                                    text: cellRuleXLS.conditionalRule[i].rules[j].rule[l].text,
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
                                    }
                            }
                        }
                        if(cellRuleXLS.conditionalRule[i].hasOwnProperty('style')) {
                                // Code to parse the first letter column to the end
                            let cellToFormat;
                            let rowChange;
                            let value;
                            for(let m = lettersToNumber(cellRuleXLS.conditionalRule[i].easeRule.columnStart); 
                                    m <= lettersToNumber(cellRuleXLS.conditionalRule[i].easeRule.columnEnd); m++) {

                                    cellToFormat = m ;//String.fromCharCode(m) + k + '';
                                    rowChange = worksheet.getRow(k);

                                    if(cellRuleXLS.conditionalRule[i].style.hasOwnProperty('alignment')) {
                                        rowChange.getCell(cellToFormat).alignment = cellRuleXLS.conditionalRule[i].style.alignment;
                                    }
                                    else {
                                        rowChange.getCell(cellToFormat).style = cellRuleXLS.conditionalRule[i].style;
                                        /*if(! Number.isNaN(parseFloat(rowChange.getCell(cellToFormat).value))) {
                                            value = parseFloat(rowChange.getCell(cellToFormat).value);

                                            rowChange.getCell(cellToFormat).value=value/100;
                                        }*/
                                        if (cellRuleXLS.conditionalRule[i].style.numFmt) {
                                            rowChange.getCell(cellToFormat).numFmt = cellRuleXLS.conditionalRule[i].style.numFmt;
                                        }
                                    }
                                    //worksheet.getCell(cellToFormat).value.result=undefined;
                                    //worksheet.getCell(cellToFormat).value=parseFloat(worksheet.getCell(cellToFormat).value)/100;

                            }
                        }
                    }
                }
            }
        }
        catch (e) {
            heap.logger.log('alert', "Error format " + formatRule + e, 'alert', 3);
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
    let tableRow = heap.TABLE_HEADER;

    worksheet.getCell('B2').value = 'Report Title';
    
    worksheet.getCell('C2').value = alertData[0].ALTSUBJECT + ' ' + extensionHeader;
    worksheet.getCell('C3').value = alertData[0].ALTCONTENT;
    worksheet.mergeCells('C2','G2');
    worksheet.mergeCells('C3','G3');


    worksheet.getCell('H2').value = 'Report ID';
    worksheet.getCell('I2').value = alertData[0].ALTID;
    worksheet.mergeCells('I2','K2');
    worksheet.mergeCells('I3','K3');
    worksheet.getCell('H3').value = 'Report date';
    worksheet.getCell('I3').value = new Date(); 
    worksheet.getCell('I2').alignment = { vertical: 'top', horizontal: 'left' };
    worksheet.getCell('I3').alignment = { vertical: 'top', horizontal: 'left' };

    
    for (let i = 0; i< tableRow; i ++) {
        worksheet.getRow(i).fill = {
            type: 'pattern',
            pattern:'lightTrellis',
            fgColor:{argb:'FFFFFFFF'},
            bgColor:{argb:'FF002060'}
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

function json2xls(workbook, worksheet, alertData, detailData, extensionHeader, tableName, formatingRules, renameColumn) {
    let valueColumns = Object.keys(detailData[0] || {});
    let dataColumns = [];
    renameColumn = renameColumn || [];
    //heap.logger.log('alert', 'valueColumns before ' + JSON.stringify(valueColumns), 'alert', 3);

    if ( alertData[0].ALTCOLMOVE) {
        let element;
        let colMove=JSON.parse(alertData[0].ALTCOLMOVE);
        for (let j=0; j < colMove.move2end.length ; j++) {
            element = valueColumns[colMove.move2end[j]-j];
            //heap.logger.log('alert', 'element : ' + JSON.stringify(element), 'alert', 3);
            valueColumns.splice(colMove.move2end[j]-j,1);
            valueColumns.splice(valueColumns.length,0, element);
        }
    }


    //heap.logger.log('alert', 'valueColumns after ' + JSON.stringify(valueColumns), 'alert', 3);

    for(let i =0;i < valueColumns.length ; i ++) {
        dataColumns.push (
            {name: valueColumns[i], filterButton: true}
        )
    }
    /* Rename columns */

    //heap.logger.log('alert', 'Ready renaming ' + renameColumn.length, 'alert', 3);
    for (let i=0; i<renameColumn.length; i++) {
        let k = lettersToNumber(renameColumn[i].RENAMECOL);
        dataColumns[k-1].name=renameColumn[i].COLNAME;
        //heap.logger.log('alert', 'Rename: ' + dataColumns[k-1].name + ' => ' + renameColumn[i].COLNAME, 'alert', 3);
    }



    // Add rows detail
    let dataRows = [];
    let row, element;
    let colMove;

    for (let i = 0; i < detailData.length; i++) {
        dataRows.push (Object.values(detailData[i]));
        // If Column move is active - The selected column are moved at the end of the spreadsheet.
        if ( alertData[0].ALTCOLMOVE) {
            colMove=JSON.parse(alertData[0].ALTCOLMOVE);
            //heap.logger.log('alert', 'colMove ' + JSON.stringify(colMove), 'alert', 3);
            for (let j=0; j < colMove.move2end.length ; j++) {
                //heap.logger.log('alert', 'colMove .move2end[j]"' + JSON.stringify(colMove.move2end[j]), 'alert', 3);
                //heap.logger.log('alert', 'detailData[colMove.move2end[j]] ' + JSON.stringify(detailData[colMove.move2end[j]]), 'alert', 3);
                row = dataRows[dataRows.length-1];
                element =row[colMove.move2end[j]-j]; 
                //heap.logger.log('alert', 'row ' + JSON.stringify(row), 'alert', 3);
                row.splice(colMove.move2end[j]-j, 1);
                row.splice(row.length, 0, element);
                dataRows.splice(dataRows.length-1,1);
                dataRows.push(row);
                //heap.logger.log('alert', 'dataRows push additional row.', 'alert', 3);
            }
        }
    }

    //heap.logger.log('alert', 'dataColumns :' + JSON.stringify(dataColumns), 'alert', 3);
    //heap.logger.log('alert', 'dataRows :' + JSON.stringify(dataRows), 'alert', 3);


    setXLSHeader(worksheet, alertData, extensionHeader);

    /* Check if Title to be insert alertData[0].ALTTITLEXLS contains the row number for the title*/
    try {
        if (alertData[0].ALTTITLEXLS) {
            worksheet.getCell('A4').value = Object.values(detailData[alertData[0].ALTTITLEXLS])[0];
            worksheet.getCell('A4').font = {
                name: 'Arial',
                family: 4,
                color: { argb: alertData[0].ALTTITLEXLSCOLOR },
                size: 18,
                underline: false,
                bold: true
            };
            worksheet.mergeCells('A4:J4');
            worksheet.getCell('A4').alignment = { vertical: 'middle', horizontal: 'left' };
            // Remove first element
            dataRows.splice(alertData[0].ALTTITLEXLS, 1);
        }
    }
    catch(e) {
        heap.logger.log('alert', e, 'alert', 3);
    }

    /**************************************************************************/  
    // Creating the table detail EXCEL (real table)
    if (dataRows.length == 0) {
        worksheet.getCell('A6').value = 'No reported elements';
        worksheet.getCell('A6').font = {
                name: 'Arial',
                family: 4,
                size: 10,
                underline: false,
                bold: true
            };
    }
    else {
        worksheet.addTable({
            name: tableName,
            ref: 'A5',
            headerRow: true,
            totalsRow: true,
            style: {
            theme: 'TableStyleLight1',
            showRowStripes: true,
            },
            columns: [...dataColumns],
            rows: [...dataRows]
        });
    }

    try {
        if (formatingRules) {
            formatXLS(worksheet,dataRows, formatingRules);
        }
    } catch (err) {
        heap.logger.log('alert', 'Error formatting XLS ' + JSON.stringify(err.message), 'alert', 3);
    }

    if ( alertData[0].ALTBORDER === 1) {
        worksheet.eachRow(function (row, _rowNumber) {
            row.eachCell({ includeEmpty: true },function (cell, _colNumber) {
                if (_rowNumber > heap.TABLE_HEADER) {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                }
            });
        });
    }

    try {
        autofitColumns(worksheet);
    } catch (err) {
        heap.logger.log('alert', 'Error autofitColumns '  + JSON.stringify(err.message), 'alert', 3);
    }
    try {
        setPrintArea(worksheet, alertData[0]);
    } catch (err) {
        heap.logger.log('alert', 'Error setPrintArea ' + JSON.stringify(err.message), 'alert', 3);
    }

    try {
        setPageBreak(worksheet, dataRows, alertData[0]);
    } catch (err) {
        heap.logger.log('alert', 'Error setPageBreak ' + JSON.stringify(err), 'alert', 3);
    }

    try {
        setXLSProperties(workbook);
    } catch (err) {
        heap.logger.log('alert', 'Error setXLSProperties ' + JSON.stringify(err), 'alert', 3);
    }
    heap.logger.log('alert', 'ws.pageSetup : ' + JSON.stringify(worksheet.pageSetup), 'alert', 1);

    dataRows.length =0;
    dataColumns.length = 0;
    valueColumns.length = 0;
    dataRows = null;
    dataColumns = null;
    valueColumns = null;
    return {wb: workbook, ws:worksheet};

}

module.exports.json2xls = json2xls; 
