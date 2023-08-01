import {Component, ViewEncapsulation, ViewChild} from '@angular/core';
import {ImportService } from '../../../shared/services';
import {DatePipe} from '@angular/common';


import { MessageService } from 'primeng/api';
import { Message } from 'primeng/api';
import { FullCalendar } from 'primeng/fullcalendar';
import { SelectItem } from 'primeng/api';
import { FormControl, FormGroup, Validators } from '@angular/forms';

/**
 * In GOLD 5.10, there is no automation to generate the supplier planning automatically using the
 * service contract link. Users have to go in the screen and readjust the supplier planning
 * 
 * Symphony EYC has the license for GOLD source code and API. This solution is a workaround to generate
 * the service contract link and supplier planning within one operation.
 * 
 * Overall technical solution:
 *   1. Gather the actual service contract link information
 *   2. Send by interface (service contract link and Supplier schedule) the updated link
 *   3. Execute the integration batches.
 * 
 * @author Ahmed Benamrouche
 * 
 */
 @Component({
	moduleId: module.id,
    selector: 'holiday',
    templateUrl: './holiday.schedule.component.html',
    providers: [ImportService, MessageService],
    styleUrls: ['./holiday.schedule.component.scss', '../../../app.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class HolidayScheduleComponent {
   
  @ViewChild('fc') fc: FullCalendar;
  @ViewChild('fileUpload',{static:false}) fileUpload: any;

   columnOptions: SelectItem[];
   trackIndex: number = 0;

   screenID;
  waitMessage: string = '';
  templateID = 'ICR_TEMPLATE007';

  // Search result 
   searchResult : any [] = [];
   selectedElement;
   columnsResult: any [] = [];
   columnsSchedule: any [] = [];
   globalError: any [] = [];
   activeValidateButton: boolean = false;

   displayAddHoliday: boolean = false;
   displayErrorAddHoliday: boolean = false;
   displayRemoveHoliday: boolean = false;
   
   processReviewSchedule : boolean = false;
   displayConfirm: boolean = false;
   uploadedFiles: any [] = [];

   public numberWeekDaysArray: Array<1>; // Number of days between Start and End schedule

   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries

  // Search action
   searchCode: string = '';
   periodStart: string = '';
   periodEnd: string = '';
   holydayDay: string = '';
   msgs: Message[] = [];

   newHolidayForm = new FormGroup({
    holidayDate_field: new FormControl('', [Validators.required]),
    holidayStart_field: new FormControl('', [Validators.required]),
    holidayEnd_field: new FormControl('', [Validators.required])
  });

  removeHolidayForm = new FormGroup({
    holidayDate_field: new FormControl('', [Validators.required])
  });

  newHolidayDate;
  newHolidayStart;
  newHolidayEnd;
  removeHolidayDate;


   // Constante used for date calculation
   oneDay: number = 1000 * 60 * 60 * 24 ;
   oneWeek: number = 1000 * 60 * 60 * 24 * 7;

   // Completion handler
   displayUpdateCompleted: boolean;
   msgDisplayed: string;

  // Calendar
  dateNow: Date;
  dateTomorrow : Date;
  day: any = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  constructor(public _importService: ImportService, private datePipe: DatePipe,
              private _messageService: MessageService) {
    this.screenID =  'SCR0000000003';
    datePipe     = new DatePipe('en-US');
    this.dateNow = new Date();
    this.dateTomorrow =  new Date(this.dateNow.setDate(this.dateNow.getDate() + 1));

    this.columnsResult = [
      { field: 'Supplier code', header: 'Supplier code' },
      { field: 'Supplier desc', header: 'Supplier desc' },
      { field: 'Holiday date', header: 'Holiday date' },
      { field: 'Order day', header: 'Order day' },
      { field: 'Order date', header: 'Order date' },
      { field: 'Network', header: 'Network' },
      { field: 'Delivery day', header: 'Delivery day'},
      { field: 'Status', header: 'Status'}
    ];


    this.displayUpdateCompleted = false;
  }

  search() {
    //this.searchCode = searchCode;
    this.razSearch();
    this._messageService.add({severity:'info', summary:'Info Message', detail: 'Looking for the supplier schedule : ' + JSON.stringify(this.searchCode)});

  }

  razSearch () {
    this.searchResult = [];
    this.selectedElement = null;
    this.processReviewSchedule = false;
    this.activeValidateButton = false;
  }

  /**
   * function onRowSelect (Evemt on schedule se4lection) 
   * When User selects a supplier schedule, this function copies the schedule to potential temporary schedule.
   * @param event 
   */
  onRowSelect(event) {
  }

  reviewSchedule() {
    this.processReviewSchedule = true;
    this.activeValidateButton = true;
  }

  addHoliday() {
    this.displayAddHoliday = false;
  }

  removeHoliday() {
    this.displayRemoveHoliday = false;
  }

  onSelect(event) {
    this.displayConfirm = false;
    this.uploadedFiles = [];
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
                            error => { this._messageService.add({key:'top', severity:'error', summary:'Invalid file during loading', detail: error }); },
                            () => { 
                                    this._messageService.add({key:'top', severity:'success', summary:'Data file loaded', 
                                                              detail: '"' + this.uploadedFiles[0].name + '" worksheet loaded.' }); 
                                    this._importService.addColumns('COMMENTS', '');
                                    this.checkGlobal();
                            }
                        );

      } catch (error) {
          this._messageService.add({key:'top', sticky:true, severity:'error', summary:'ERROR file loading message', detail: error }); 
      }
  }
  onBeforeUpload(event) {
    //console.log('Before upload :', event);
  }

  onUploadCompleted(event) {
    //console.log('Upload completed :', event);
    for(let file of event.files) {
        this.uploadedFiles.push(file);
        this._messageService.add({severity: 'info', summary: 'File Uploaded', detail: file});
        console.log('File uploaded', )
    }
  }

  getTemplate() {
  let existTemplate;
  this._importService.getTemplate(this.templateID)
  .subscribe (data => {  
              existTemplate = data !== -1;
              //console.log('data getTemplate :', data);
              },
              error => { this._messageService.add({key:'top', sticky:true, severity:'error', summary:'Template error', detail: error }); },
              () => { 
                      if (existTemplate) {
                          this._messageService.add({key:'top', sticky:true, severity:'success', summary:'Template file', detail:  
                                                  'File Item attribute downloaded.' }); 
                      } else {
                          this._messageService.add({key:'top', sticky:true, severity:'error', summary:'Template error', detail: 'Template file ' + this.templateID + ' can not be found' });
                      }
              }
          );
    }

  checkGlobal(): boolean {
    this.globalError=[];
    let result = true;    
    if(this._importService.wb.sheets[0].worksheet.columns.length < 7) {
        this.globalError.push('Holiday schedule file must contains the following headers: Supplier code, Order day, Order date, Order time, Network, Delivery day'); 
        return false;
    }
    if (this._importService.wb.sheets[0].worksheet.columns[0].field.toUpperCase() !== String('Supplier code').toUpperCase()) {
      this.globalError.push('The column A header must be named "<b>Supplier code</b>", actual value <b>"' + this._importService.wb.sheets[0].worksheet.columns[0].field + '"</b>'); 
      result = false;
    }
    if (this._importService.wb.sheets[0].worksheet.columns[1].field.toUpperCase() !== String('Order day').toUpperCase()) {
        this.globalError.push('The column C header must be named "<b>Order day/b>", actual value <b>"' + this._importService.wb.sheets[0].worksheet.columns[1].field + '"</b>'); 
      result = false;
    }
    if (this._importService.wb.sheets[0].worksheet.columns[2].field.toUpperCase() !== String('Order date').toUpperCase()) {
        this.globalError.push('The column D header must be named "<b>Order date/b>", actual value <b>"' + this._importService.wb.sheets[0].worksheet.columns[2].field + '"</b>'); 
      result = false;
    }
    if (this._importService.wb.sheets[0].worksheet.columns[3].field.toUpperCase() !== String('Order time').toUpperCase()) {
        this.globalError.push('The column E header must be named "<b>Order time/b>", actual value <b>"' + this._importService.wb.sheets[0].worksheet.columns[3].field + '"</b>'); 
      result = false;
    }
    if (this._importService.wb.sheets[0].worksheet.columns[4].field.toUpperCase() !== String('Network').toUpperCase()) {
        this.globalError.push('The column F header must be named "<b>Network</b>", actual value <b>"' + this._importService.wb.sheets[0].worksheet.columns[4].field + '"</b>'); 
      result = false;
    }
    if (this._importService.wb.sheets[0].worksheet.columns[5].field.toUpperCase() !== String('Delivery day').toUpperCase()) {
        this.globalError.push('The column G header must be named "<b>Delivery day</b>", actual value <b>"' + this._importService.wb.sheets[0].worksheet.columns[5].field + '"</b>'); 
      result = false;
    }
    console.log('Global error', this.globalError);
    this.displayErrorAddHoliday = this.globalError.length != 0;
    return result;
  }

  validateNewSchedule() {
    this.checkGlobal();
    this.displayAddHoliday = this.globalError.length == 0;

    this.displayErrorAddHoliday = this.globalError.length != 0;
  }

  cancelNewHoliday() {
    this.globalError=[];
    this.displayErrorAddHoliday = false;
    this.displayAddHoliday = false;
    this.uploadedFiles = [];
    this.newHolidayEnd = '';
    this.newHolidayStart = '';
    this.newHolidayDate = '';
  }

  canceRemoveHoliday() {
    this.displayRemoveHoliday = false;
  }
}
