import {Component, Inject, Injectable,Input,Output,EventEmitter } from '@angular/core';

import { HttpResponse } from '@angular/common/http';
import {Router} from '@angular/router';
import {HttpService} from '../request/html.service';
import {UserService} from '../user/user.service';
import { map } from 'rxjs/operators';
import { HttpHeaders, HttpParams } from '@angular/common/http';


import * as excel from 'exceljs';
import * as fs from 'file-saver';  

@Injectable()
export class ExportService{


    public static tableRow: number = 5;
    constructor(private http : HttpService){ }
    
    /**
     * Sub-function to autofitColums function
     * @param {*} ws 
     * @param {*} col1 
     * @param {*} col2 
     * @param {*} cb 
     */
    eachColumnInRange(ws, col1, col2, cb){
        for(let c = col1; c <= col2; c++){
            let col = ws.getColumn(c);
            cb(col);
        }
    }

    /**
     * Function autofitColumns auto-adjust the length of the cell accordingly to the column max length
     * @param {*} ws 
     */
    autofitColumns(ws){ // no good way to get text widths
        this.eachColumnInRange(ws, 1, ws.columnCount, column => {
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
     * Function setPageBreak define the page Break in the Excel file
     * @param {*} ws 
     * @param {*} alertData 
     * @param {*} alert 
     */
    setPageBreak(ws, alertData, pageBreakRule) {
        // Set Print Area for a sheet
        let rowBreak = 0;
        if (pageBreakRule.ALTXLSBREAK) {
            let xlsBreak=JSON.parse(pageBreakRule.ALTXLSBREAK);
            //console.log(' parsing ALTXLSBREAK : ' + JSON.stringify(xlsBreak));
            for (let i=0; i <  xlsBreak.pageBreak.length ; i ++) {
                if (xlsBreak.pageBreak[i].hasOwnProperty('every')) {
                    for(let j = xlsBreak.pageBreak[i].row; j < alertData.length; j += xlsBreak.pageBreak[i].every) {
                        rowBreak = +xlsBreak.pageBreak[i].row;
                        //console.log('Adding Page break @ row :' + rowBreak);
                        ws.getRow(rowBreak+j).addPageBreak();
                    }
                }
                else {
                    rowBreak = +xlsBreak.pageBreak[i].row;
                    //console.log('Adding Page break @ row :' + rowBreak);
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
    setPrintArea(ws, printArea) {
        // Set Print Area for a sheet
        if (printArea.ALTORIENTATION) {
            ws.pageSetup.orientation = printArea.ALTORIENTATION;
        }
        ws.pageSetup.fitToPage = false;
        if (printArea.ALTFITPAGE) {
            ws.pageSetup.fitToPage = printArea.ALTFITPAGE === 1;
            if (ws.pageSetup.fitToPage) {
                ws.pageSetup.fitToHeight = printArea.ALTFITHEIGHT;
                ws.pageSetup.fitToWidth = printArea.ALTFITWIDTH;
            }
            else {
                if (printArea.ALTSCALE) {
                    ws.pageSetup.scale = printArea.ALTSCALE;
                }
            }
        }
        else {
            ws.pageSetup.fitToPage = false;
            ws.pageSetup.fitToHeight = '';
            ws.pageSetup.fitToWidth = '';
        }
        if (printArea.ALTTITLEREPEAT) {
            ws.pageSetup.printTitlesRow = printArea.ALTTITLEREPEAT;
        }
        if (printArea.ALTFOOTER) {
            ws.headerFooter.oddFooter = printArea.ALTFOOTER;
        }
        if (printArea.ALTPRINTAREA) {
            if (! ws.pageSetup.fitToPage) {
                ws.pageSetup.fitToHeight = '';
                ws.pageSetup.fitToWidth = '';
            }
            ws.pageSetup.printArea = printArea.ALTPRINTAREA;
        }

        if (printArea.ALTMARGIN) {
            ws.pageSetup.margins = JSON.parse(printArea.ALTMARGIN);
            //logger.log('alert', 'formatting EXCEL : ' + JSON.stringify(formatRule), 'alert', 1);

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
    formatXLS (worksheet, dataRows, formatRule) {
        if (formatRule) {
            //logger.log('alert', 'formatting EXCEL : ' + JSON.stringify(formatRule), 'alert', 1);
            try {
                let cellRuleXLS=formatRule;
                if(cellRuleXLS != null) {
                    //logger.log('alert', 'formatting EXCEL : ' + JSON.stringify(cellRuleXLS), 'alert', 1);
                    for (let i =0; i < cellRuleXLS.conditionalRule.length; i++) {
                        let row = 0;
                        let maxRow = 0;
                        let every = 1;
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
                                                }]}
                                            )};

                                        }
                                }
                            }
                            if(cellRuleXLS.conditionalRule[i].hasOwnProperty('style')) {
                                    // Code to parse the first letter column to the end
                                for(let m = this.lettersToNumber(cellRuleXLS.conditionalRule[i].easeRule.columnStart); 
                                m <= this.lettersToNumber(cellRuleXLS.conditionalRule[i].easeRule.columnEnd); m++) {

                                let cellToFormat = m ;//String.fromCharCode(m) + k + '';
                                let rowChange = worksheet.getRow(k);

                                if(cellRuleXLS.conditionalRule[i].style.hasOwnProperty('alignment')) {
                                    rowChange.getCell(cellToFormat).alignment = cellRuleXLS.conditionalRule[i].style.alignment;
                                }
                                else {
                                    rowChange.getCell(cellToFormat).style = cellRuleXLS.conditionalRule[i].style;
                                    if(! Number.isNaN(parseFloat(rowChange.getCell(cellToFormat).value))) {
                                        let value = parseFloat(rowChange.getCell(cellToFormat).value);

                                        rowChange.getCell(cellToFormat).value=value/100;
                                    }
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
                console.log("Error format ", formatRule, e);
            }
        }
    }

    lettersToNumber(letters){
        var chrs = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ', mode = chrs.length - 1, number = 0;
        for(var p = 0; p < letters.length; p++){
            number = number * mode + chrs.indexOf(letters[p]);
        }
        return number;
    }

    /**
     * Function setXLSHeader define top X rows header in the template report
     * @param {*} worksheet 
     * @param {*} alertDataHeader 
     */
    setXLSHeader(worksheet, reportid, subject , content) {
        /**
         * Excel file
         *      4 first rows are the header reports
         *  Starting line 5 the table is deployed
         * 
         */

        worksheet.getCell('A2').value = 'Report Title';
        
        worksheet.getCell('B2').value = subject;
        worksheet.getCell('B3').value = content;
        worksheet.mergeCells('B2','F2');
        worksheet.mergeCells('B3','F3');


        worksheet.getCell('G2').value = 'Report ID';
        worksheet.getCell('H2').value = reportid;
        worksheet.mergeCells('H2','J2');
        worksheet.mergeCells('H3','J3');
        worksheet.getCell('G3').value = 'Report date';
        worksheet.getCell('H3').value = new Date(); 
        worksheet.getCell('H2').alignment = { vertical: 'top', horizontal: 'left' };
        worksheet.getCell('H3').alignment = { vertical: 'top', horizontal: 'left' };

        
        for (let i = 0; i< ExportService.tableRow; i ++) {
            worksheet.getRow(i).fill = {
                type: 'pattern',
                pattern:'lightTrellis',
                fgColor:{argb:'FFFFFFFF'},
                bgColor:{argb:'FF002060'}
            };
        }

        // Styling the header
        worksheet.getCell('A2').font = {
            name: 'Arial',
            family: 4,
            color: { argb: 'FFFFFFFF' },
            size: 11,
            underline: false,
            bold: true
        };
        worksheet.getCell('G2').font = worksheet.getCell('A2').font;
        worksheet.getCell('G3').font = worksheet.getCell('A2').font

        worksheet.getCell('B2').font = {
            name: 'Arial',
            family: 4,
            color: { argb: 'FFFFFFFF' },
            size: 14,
            underline: false,
            bold: true
        };

        worksheet.getCell('B3').font = {
            name: 'Arial',
            family: 4,
            color: { argb: '000000' },
            size: 14,
            underline: false,
            bold: false
        };

        worksheet.getCell('H2').font = worksheet.getCell('B2').font
        worksheet.getCell('H3').font = worksheet.getCell('B2').font

    }

    /**
     * Function setXLSProperties define the EXCEL file property
     * @param {*} workbook 
     */
    setXLSProperties(workbook) {
        workbook.creator = 'B&B SYMPHONY LLC';
        workbook.lastModifiedBy = 'B&B SYMPHONY LLC';
        workbook.created = new Date();
        workbook.modified = new Date();
        workbook.lastPrinted = new Date();
        workbook.calcProperties.fullCalcOnLoad = true;
    }

    json2xls(workbook, worksheet, reportid, subject, content, rawData, formatStructure, border ?, freeze?, tableName?) {

        let valueColumns=[];
        let dataColumns;
        if(rawData.length >1) {
            valueColumns = Object.keys(rawData[0]);
            dataColumns = [];
        }

        for(let i =0;i < valueColumns.length ; i ++) {
            dataColumns.push (
                {name: valueColumns[i], filterButton: true}
            )
        }

        if(!tableName) {
            tableName = 'Result'
        }
        // Add rows detail
        let dataRows = [];

        for (let i = 0; i < rawData.length; i++) {
            dataRows.push (Object.values(rawData[i]));
        }

        this.setXLSHeader(worksheet, reportid, subject , content);

        if (freeze) {
            worksheet.views = [{state: 'frozen', xSplit: freeze.ALTFREEZECOLUMN, ySplit: freeze.ALTROWCOLUMN+1}];
        }

        /**************************************************************************/  
        // Creating the table detail EXCEL (real table)
        if(valueColumns.length >0) {
            worksheet.addTable({
                name: tableName,
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
        


            this.formatXLS(worksheet,dataRows, formatStructure);

            if (border) {
                worksheet.eachRow(function (row, _rowNumber) {
                    row.eachCell(function (cell, _colNumber) {
                        if (_rowNumber > ExportService.tableRow) {
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
        }
        this.autofitColumns(worksheet);
        //this.setPrintArea(worksheet, null);
        //this.setPageBreak(worksheet, dataRows, null);
        this.setXLSProperties(workbook);
    }

    saveCSV(rawData, image, imageWidth, imageHeight,reportId, reportTitle, reportContent, 
            formatStructure ?: any, border?, freeze?, 
            wrksheet2name?, formatStructure2?, wrksheet2data?) {
        let workbook = new excel.Workbook();
        let ws = workbook.addWorksheet('result');
        
        this.json2xls(workbook, ws, reportId, reportTitle, reportContent,rawData, formatStructure, border, freeze, 'result');
  

        if(wrksheet2name) {
            let worksheet2 = workbook.addWorksheet(wrksheet2name, {properties:{tabColor:{argb:'E7EBFF0'}}});
            this.json2xls(workbook, worksheet2, reportId, reportTitle, reportContent, wrksheet2data, formatStructure2, border, freeze, 'result2');
        }
        
        if (!!image) {
            //console.log('image :',image);
           let imageid =  workbook.addImage({ base64: image, extension: 'png'});
            ws.addImage(imageid, {
                    tl: { col: Object.keys(rawData[0]).length, row: 5 },
                    ext: { width: imageWidth * 0.75, height: imageHeight * 0.75}}); //String.fromCharCode(97+ columnData.length+2 || ':5'));
        }
        workbook.xlsx.writeBuffer().then((data: any) => {  
          const blob = new Blob([data], {  
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'  
          });  
          fs.saveAs(blob, 'result' + '.xlsx');  
        });  
    }

}