import {Component, ViewEncapsulation, OnInit, ViewChild} from '@angular/core';
import { WarehouseService, WidgetService, ExportService, ImportService } from '../../../shared/services';
import { MenuItem } from 'primeng/api';
import { Table } from 'primeng/table';
import { MessageService } from 'primeng/api';
import {DatePipe} from '@angular/common';   

/**
 * 
 * @author Ahmed Benamrouche
 * 
 */
@Component({
    selector: 'sku-dimension',
    templateUrl: './sku.dimension.component.html',
    providers: [WarehouseService, WidgetService, MessageService, ExportService, ImportService],
    styleUrls: ['./sku.dimension.component.scss', '../../../app.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class SKUDimensionComponent implements OnInit{

    @ViewChild('fileUpload') fileUpload: any;
    @ViewChild('result') resultTable: Table;

   // Menu/Qorkflow list
   activeIndex: number = 0;
   menuItems: MenuItem[] = [];
   uploadedFiles: any[] = [];

   templateID = 'ICR_TEMPLATE006';
   toolID = 7; /** parameter 33 */

   indicatorXLSfileLoaded: boolean = false;

   workbook;
   

   datePipe: DatePipe;
   dateNow: Date;
   dateTomorrow: Date;

   startDate;
   scheduleDate;
   defaultStartDate;
   itemTrace;
   scheduleFlag: boolean = false;
   /** Validation Message */
   displayUpdateCompleted: boolean = false;
   msgFinalDisplayed;

   missingData;

   screenID;
   waitMessage: string = '';
   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries

  // Search action
 
  searchCode: any;
  search: any;

  globalError: any[] = [];
  globalValid: any[] = [];
  displayConfirm: boolean;

  constructor(private _widgetService: WidgetService, private _messageService: MessageService,
              private _exportService: ExportService, public _importService: ImportService) {
    this.datePipe     = new DatePipe('en-US');
    this.dateNow = new Date();
    this.dateTomorrow =  new Date(this.dateNow.setDate(this.dateNow.getDate() + 1));
    this.defaultStartDate = new Date(this.dateNow.setDate(this.dateNow.getDate() -2));
    this.startDate = new Date(this.dateNow.setDate(this.dateNow.getDate() -2));

    this.scheduleDate = new Date();
    this.itemTrace = false;
    this.scheduleFlag = false;
    this.screenID = 'SCR0000000013';
    this.activeIndex = 0;
    this.displayConfirm = false;
    this.globalError = [];
    this.globalValid = [];
    this.displayUpdateCompleted = false;
  }


  ngOnInit() {
      this.menuItems = [{
              id: 'step0',
              label: 'Data selection',
              title: 'Pick your item sku dimension manager file',
              command: (event: any) => {
                  this.activeIndex = 0;
                  this._messageService.add({key:'top', sticky:false, severity:'info', summary:'Pick your data file item-hierarchy', detail: event.item.label});
              }
          },
          {
              id: 'step1',
              label: 'Configuration',
              title: 'Define changes parameter',
              command: (event: any) => {
                this.activeIndex = 1;
                  this._messageService.add({key:'top', sticky:false, severity:'info', summary:'Specify change configuration', detail: event.item.label});
              }
          },
          {
              id: 'step2',
              label: 'Execution/Schedule',
              title: 'Execute now or schedule the change',
              command: (event: any) => {
                  this.activeIndex = 2;
                  this._messageService.add({key:'top', sticky:false, severity:'info', summary:'Execute or Schedule change', detail: event.item.label});
              }
          },
          {
              id: 'step3',
              label: 'Confirmation',
              title: 'Confirmation for execution/planification',
              command: (event: any) => {
                  this.activeIndex = 3;
                  this._messageService.add({key:'top', sticky:false, severity:'info', summary:'Wrap up', detail: event.item.label});
              }
          }
      ];
  }

  onBeforeUpload(event) {
    console.log('Before upload :', event);
  }

  onUploadCompleted(event) {
    //console.log('Upload completed :', event);
    for(let file of event.files) {
        this.uploadedFiles.push(file);
        this._messageService.add({severity: 'info', summary: 'File Uploaded', detail: file});
    }

    //this.fileUpload.clear();
  }

    onSelect(event) {
        this.activeIndex = 0; // Go next step;
        this.uploadedFiles = [];
        this.displayConfirm = false;
        let formData: FormData = new FormData();
        this.indicatorXLSfileLoaded = false;
        try {   
            for(let i =0; i < event.currentFiles.length; i++) {
                //console.log('event.currentFiles:', event.currentFiles[i]);
                this.uploadedFiles.push(event.currentFiles[i]);
                this._messageService.add({severity: 'info', summary: 'In progress file load', detail: event.currentFiles[i].name});
                
            }

            this.fileUpload.clear();
            this._importService.getExcelFile(this.uploadedFiles[0])
                    .subscribe (data => {  
                                },
                                error => { this._messageService.add({key:'top', sticky:false, severity:'error', summary:'Invalid file during loading', detail: error }); },
                                () => { 
                                        this.indicatorXLSfileLoaded = true;
                                        this._messageService.add({key:'top', sticky:false, severity:'success', summary:'Data file loaded', detail:  
                                                                '"' + this.uploadedFiles[0].name + '" worksheet loaded.' }); 

                                        // add comments field
                                        this._importService.addColumns('COMMENTS', '');
                                        //console.log('sheets :', this._importService.wb.sheets);
                                        this.displayConfirm = this.checkGlobal();

                                }
                            );

        } catch (error) {
            this._messageService.add({key:'top', sticky:false, severity:'error', summary:'ERROR file loading message', detail: error }); 
        }
    }

    getTemplate() {
    let existTemplate;
    this._importService.getTemplate(this.templateID)
    .subscribe (data => {  
                existTemplate = data !== -1;
                console.log('data getTemplate :', data);
                },
                error => { this._messageService.add({key:'top', sticky:false, severity:'error', summary:'Template error', detail: error }); },
                () => { 
                        if (existTemplate) {
                            this._messageService.add({key:'top', sticky:false, severity:'success', summary:'Template file', detail:  
                                                    'File Item dimension downloaded.' }); 
                        } else {
                            this._messageService.add({key:'top', sticky:false, severity:'error', summary:'Template error', detail: 'Template file ' + this.templateID + ' can not be found' });
                        }
                }
            );

  }

  validationChanges() {
    // To be implemented
    //console.log('validationChanges', this._importService.wb.sheets[0]);

    let executionId;
    let userID;
    this.displayUpdateCompleted = false;
    if (this.checkGlobal()) {
        this.waitMessage =  'Step 1/4: Posting the execution plan...<br>'+ 
                            '<br><br>'+
                            '<b>SKU dimension change is usually taking less than a  minute</b>';
        this._messageService.add({key:'top', sticky:false, severity:'info', summary:'Step 1/4: Posting the execution plan', detail:  '"' + this.uploadedFiles[0].name + '" processing plan is being posted.'});
        this._importService.postExecution(this.uploadedFiles[0].name, this.toolID,
                            this.datePipe.transform(this.startDate,'MM/dd/yy'), 
                            +this.itemTrace, // Implicit cast to have 1: True, 0: False
                            + !this.scheduleFlag, // Implicit cast to have 1: True, 0: False
                            this.datePipe.transform(this.scheduleDate,'MM/dd/yy HH:mm'), 
                            JSON.stringify(this._importService.wb.sheets[0].worksheet.rows),
                            this._importService.wb.sheets[0].worksheet.rows.length)
                            .subscribe (data => {  
                            executionId = data;
                            console.log('executionId : ', executionId);
                        },
                        error => { this._messageService.add({key:'top', sticky:false, severity:'error', summary:'Invalid file during execution plan load', detail: error }); },
                        () => { 

                            this.waitMessage =  'Step 1/4: Posting the execution plan... &emsp;<b>COMPLETED</b><br>'+ 
                                                '<br><br>'+
                                                '<b>SKU dimension change is usually taking less than a  minute</b>';
                    if (this.scheduleFlag) {
                        this._messageService.add({key:'top', sticky:false, severity:'success', summary:'Step 2/2: Data file execution plan', detail:  
                                                    '"' + this.uploadedFiles[0].name + '" worksheet loaded for scheduled execution.' }); 
                    }
                    else {
                        // Execute the file
                        if(executionId.RESULT[0] < 0 ) {
                            this._messageService.add({key:'top', sticky:false, severity:'error', summary:'Execution failure', detail: executionId.MESSAGE[0] }); 
                            return;
                        }
                        /** Run the job integration */

                        this.waitMessage =  'Step 1/4: Posting the execution plan... &emsp;<b>COMPLETED</b><br>'+ 
                                            'Step 2/4: Executing item sku dimension mapping change...<br>'+ 
                                            '<br><br>'+
                                            '<b>SKU dimension change is usually taking less than a  minute</b>';
                        this._messageService.add({key:'top', sticky:false, severity:'info', summary:'Step 2/4: Executing integration job', detail:  this.uploadedFiles[0].name + ' processing plan is now being executed.'});
                        this._importService.execute(executionId.RESULT[0]).subscribe 
                                (data => {  
                                    //console.log('data userID : ', data);
                                    userID = data[0].RESULT;
                                },
                                error => { this._messageService.add({key:'top', sticky:false, severity:'error', summary:'Invalid file during execution plan load', detail: error }); },
                                () =>    {  

                                    this.waitMessage =  'Step 1/4: Posting the execution plan... &emsp;<b>COMPLETED</b><br>'+ 
                                                        'Step 2/4: Executing item sku dimension mapping change... &emsp;<b>COMPLETED</b><br>'+ 
                                                        'Step 3/4: Running integration job...<br>'+ 
                                                        '<br><br>'+
                                                        '<b>SKU dimension change is usually taking less than a  minute</b>';
                                            
                                    this._messageService.add({key:'top', sticky:false, severity:'info', summary:'Step 3/4: Executing plan', detail: '"' + this.uploadedFiles[0].name + '" processing plan completed. Collecting  final integration result.'});
                                    this._importService.executePlan(userID, this.toolID).subscribe( 
                                            data => {  },
                                            error => { this._messageService.add({key:'top', sticky:false, severity:'error', summary:'Execution issue', detail: error }); },
                                            () => {  
                                                
                                                    this.waitMessage =  'Step 1/4: Posting the execution plan... &emsp;<b>COMPLETED</b><br>'+ 
                                                                        'Step 2/4: Executing item sku dimension mapping change... &emsp;<b>COMPLETED</b><br>'+ 
                                                                        'Step 3/4: Running integration job... &emsp;<b>COMPLETED</b><br>'+ 
                                                                        'Step 4/4: Collecting integration result... <br>'+ 
                                                                        '<br><br>'+
                                                                        '<b>SKU dimension change is usually taking less than a  minute</b>';
                                                    this._importService.collectResult(executionId.RESULT[0]).subscribe (
                                                    data => { },
                                                    error => { this._messageService.add({key:'top', sticky:false, severity:'error', summary:'Invalid file during execution plan load', detail: error }); },
                                                    () => { 
                                                        this._messageService.add({key:'top', sticky:false, severity:'info', summary:'Step 4/4: Executing plan', detail:  '"' + this.uploadedFiles[0].name + '" processing plan results collected.'});
                                                        this.msgFinalDisplayed = 'Item - Category Manager  ' + this.uploadedFiles[0].name + ' - ' + 
                                                                                ' has been successfully processed.';

                                                        this.waitMessage =  'Step 1/4: Posting the execution plan... &emsp;<b>COMPLETED</b><br>'+ 
                                                        'Step 2/4: Executing item sku dimension mapping change... &emsp;<b>COMPLETED</b><br>'+ 
                                                                            'Step 3/4: Running integration job... &emsp;<b>COMPLETED</b><br>'+ 
                                                                            'Step 4/4: Collecting integration result... &emsp;<b>COMPLETED</b><br>'+ 
                                                                            '<br><br>'+
                                                                            '<b>SKU dimension change is usually taking less than a  minute</b>';
                                                        this.displayUpdateCompleted = true;

                                                        this.waitMessage ='';
                                                        this.reset();
                                                    });
                                                });
                                        });                     
                            }
                        });
                    } 
        else {
                this._messageService.add({key:'top', sticky:false, severity:'error', summary:'Required data missing', detail: this.missingData }); 
        }
    }

  /**
   * 
   */
  confirmFile() {
    //console.log('confirmFile', this._importService.wb.sheets[0]);
    this.activeIndex = 0;
    this.globalError = [];
    if (this.checkGlobal()) {
        this._importService.checkFile(this.uploadedFiles[0].name, this.toolID,
                                    JSON.stringify(this._importService.wb.sheets[0].worksheet.rows))
                .subscribe (data => {  
                        //console.log('data: ', data, this._importService.wb.sheets[0].worksheet.rows);
                            this._importService.wb.sheets[0].worksheet.rows = data;
                        },
                        error => { this._messageService.add({key:'top', sticky:false, severity:'error', summary:'Invalid file during check', detail: error }); },
                        () => { 

                                this._messageService.add({key:'top', sticky:false, severity:'success', summary:'Content verification', detail:  
                                                            this.uploadedFiles[0].name + ' data file content check completed.' }); 

                                for(let i=0; i < this._importService.wb.sheets[0].worksheet.rows.length; i++){
                                    /* Check data in weight unit and measure unit */
                                    console.log('row' + i, isNaN(parseFloat(this._importService.wb.sheets[0].worksheet.rows[i].DEPTH.toString())),
                                            parseFloat(this._importService.wb.sheets[0].worksheet.rows[i].DEPTH.toString()).toFixed(2));
                                    if((this._importService.wb.sheets[0].worksheet.rows[i].WEIGHT == null) &&
                                        (this._importService.wb.sheets[0].worksheet.rows[i].WEIGHT_UNIT != null)) {
                                        this._importService.wb.sheets[0].worksheet.rows[i].COMMENTS ='Weight is mandatory when weight unit is set.'; 
                                    }
                                    if((this._importService.wb.sheets[0].worksheet.rows[i].WEIGHT_UNIT == null) &&
                                        (this._importService.wb.sheets[0].worksheet.rows[i].WEIGHT != null)) {
                                        this._importService.wb.sheets[0].worksheet.rows[i].COMMENTS ='Weight unit is mandatory when weight is set.'; 
                                    }
                                    if((this._importService.wb.sheets[0].worksheet.rows[i].WEIGHT != null) &&
                                        isNaN(parseFloat(this._importService.wb.sheets[0].worksheet.rows[i].WEIGHT.toString()))) {
                                        this._importService.wb.sheets[0].worksheet.rows[i].COMMENTS ='Weight must be positive number.'; 
                                    }
                                    if((this._importService.wb.sheets[0].worksheet.rows[i].HEIGHT == null) ||
                                        isNaN(parseFloat(this._importService.wb.sheets[0].worksheet.rows[i].HEIGHT.toString()))) {
                                        this._importService.wb.sheets[0].worksheet.rows[i].COMMENTS ='Height must be positive number.';
                                    }
                                    if((this._importService.wb.sheets[0].worksheet.rows[i].WIDTH == null) ||
                                        isNaN(parseFloat(this._importService.wb.sheets[0].worksheet.rows[i].WIDTH.toString()))) {
                                        this._importService.wb.sheets[0].worksheet.rows[i].COMMENTS ='Width must be positive number.'; 
                                    }
                                    if((this._importService.wb.sheets[0].worksheet.rows[i].DEPTH == null) ||
                                        isNaN(parseFloat(this._importService.wb.sheets[0].worksheet.rows[i].DEPTH.toString()))) {
                                        this._importService.wb.sheets[0].worksheet.rows[i].COMMENTS ='Depth must be positive number.'; 
                                    }
                                }

                                console.log('sheets :', this._importService.wb.sheets[0]);
                                let rowsWithError = this._importService.wb.sheets[0].worksheet.rows.filter(item => item.COMMENTS !== '' && item.COMMENTS !== null);

                                //console.log('rowsWithError: ', rowsWithError);
                                if (rowsWithError.length === 0) {
                                    this.globalValid = [];
                                    this.globalValid.push('<i class="fas fa-thumbs-up" style="padding-right: 1em;"></i> Data file verification SUCCESSFUL ' +
                                                            ' <ul style="margin-bottom: 0px;"> ' +
                                                            ' <li>Columns naming is respected</li>' +
                                                            ' <li>Item codes are all recognized</li>' +
                                                            ' <li>Category Manager codes are all recognized</li></ul>'); 
                                    this.activeIndex = this.activeIndex + 1; // Enable Configuration
                                    this.activeIndex = this.activeIndex + 1; // Enable schedule
                                    this.activeIndex = this.activeIndex + 1; // Enable Recap

                                    let MS_PER_MINUTE = 60000;
                                    this.dateNow = new Date( new Date().getTime() + 5*MS_PER_MINUTE);
                                }
                                else {
                                    this.globalError.push('File contains ' + rowsWithError.length + ' errors. Review red highlighted rows with error in comments.'); 
                                    //this.resultTable.sortColumn = this.resultTable.columns.find(col => col.field === 'COMMENTS');
                                    this.resultTable.sortOrder = -1;
                                    this.resultTable.sortField = 'COMMENTS';
                                    this.resultTable.sortSingle();
                                }
                        }
                    );
        }
        else {
                this._messageService.add({key:'top', sticky:false, severity:'error', summary:'Required data missing', detail: this.missingData }); 
        }
    }

  /**
   * Function to check that required data are fulfilled. If not return false.
   * @returns True if required data, else false
   */
  checkGlobal(): boolean {
    this.globalError=[];
    let result = true;
    if (this._importService.wb.sheets[0].worksheet.columns[0].field.toUpperCase() !== 'UPC') {
      this.globalError.push('The column A header must be named UPC'); 
      result = false;
    }
    if (this._importService.wb.sheets[0].worksheet.columns[1].field.toUpperCase() !== 'WEIGHT') {
        this.globalError.push('The column B header must be named WEIGHT'); 
      result = false;
    }
    if (this._importService.wb.sheets[0].worksheet.columns[2].field.toUpperCase() !== 'WEIGHT_UNIT') {
        this.globalError.push('The column C header must be named WEIGHT_UNIT'); 
      result = false;
    }
    if (this._importService.wb.sheets[0].worksheet.columns[3].field.toUpperCase() !== 'HEIGHT') {
        this.globalError.push('The column D header must be named HEIGHT'); 
      result = false;
    }
    if (this._importService.wb.sheets[0].worksheet.columns[4].field.toUpperCase() !== 'WIDTH') {
        this.globalError.push('The column E header must be named WIDTH'); 
      result = false;
    }
    if (this._importService.wb.sheets[0].worksheet.columns[5].field.toUpperCase() !== 'DEPTH') {
        this.globalError.push('The column F header must be named DEPTH'); 
      result = false;
    }
    if (this._importService.wb.sheets[0].worksheet.columns[6].field.toUpperCase() !== 'MEASURE_UNIT') {
        this.globalError.push('The column G header must be named MEASURE_UNIT'); 
      result = false;
    }

    return result;
  }

  reset() {
      this.activeIndex = 0; // Go next step;
      this.uploadedFiles = [];
      this.displayConfirm = false;
      this.indicatorXLSfileLoaded = false;
  }
 
}