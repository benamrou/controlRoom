import {Component, ViewEncapsulation, ViewChild} from '@angular/core';
import {ImportService, SupplierScheduleService } from '../../../shared/services';
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
    providers: [ImportService, MessageService, SupplierScheduleService],
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


  // Request subscription
  subscription: any[] = [];

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

  constructor(public _importService: ImportService, 
              private _supplierSchedule: SupplierScheduleService,
              private datePipe: DatePipe,
              private _messageService: MessageService) {
    this.screenID =  'SCR0000000003';
    datePipe     = new DatePipe('en-US');
    this.dateNow = new Date();
    this.dateTomorrow =  new Date(this.dateNow.setDate(this.dateNow.getDate() + 1));

    this.columnsResult = [
      { field: 'FOUCNUF', header: 'Supplier code' },
      { field: 'FOULIBL', header: 'Supplier desc' },
      { field: 'HOLDATE', header: 'Holiday date' },
      { field: 'Order day', header: 'Order day' },
      { field: 'Order date', header: 'Order date' },
      { field: 'Network', header: 'Network' },
      { field: 'Delivery day', header: 'Delivery day'},
      { field: 'Status', header: 'Status'}
    ];
    this.displayUpdateCompleted = false;
  }

  search() {
    let vendorCodeSearch;
    let holDay;
    let holStart;
    let holEnd;

    this.razSearch();
    this._messageService.add({severity:'info', summary:'Info Message', detail: 'Looking for holiday schedule : '});

    if (! this.searchCode) { vendorCodeSearch = '-1' }  else { vendorCodeSearch=this.searchCode }
    if (! this.holydayDay) { holDay = '-1' }  else { holDay=this.datePipe.transform(this.holydayDay,"MM/dd/yyyy") }
    if (! this.periodStart) { holStart = '-1' }  else { holStart=this.datePipe.transform(this.periodStart,"MM/dd/yyyy") }
    if (! this.periodEnd) { holEnd = '-1' }  else { holEnd=this.datePipe.transform(this.periodEnd,"MM/dd/yyyy") }

    this.subscription.push(this._supplierSchedule.listHoliday(vendorCodeSearch,holDay, holStart,holEnd)
                                .subscribe( 
                                    data => { console.log('data:', data);
                                              this.searchResult = data;
                        },
                          error => {
                                // Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                                this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                          },
                          () => {this._messageService.add({severity:'warn', summary:'Info Message', detail: 'Holiday schedule gathered.'});
                                this.waitMessage = '';
                          }
                      ));

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
    this.globalError=[]; 
    this.displayErrorAddHoliday= false; 
    this.displayAddHoliday=true
  }

  removeHoliday() {
    this.displayRemoveHoliday=true
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
                                    this._importService.addColumns('COMMENTS', '');
                                    if (this.checkGlobal()) {
                                      this._messageService.add({key:'top', severity:'success', summary:'Schedule file check', 
                                                                detail: '"' + this.uploadedFiles[0].name + '" worksheet validated, ready for load.' }); 
                                    }
                                    else {
                                      this._messageService.add({key:'top', severity:'error', summary:'Data file errors', 
                                                                detail: '"' + this.uploadedFiles[0].name + '" worksheet doesn\'t meet requirements.' }); 
                                    }
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
      try {
      if(this._importService.wb.sheets[0].worksheet.columns.length != 7) {
          this.globalError.push('Holiday schedule file must contains the following headers: Supplier code, Order day, Order date, Order time, Network, Delivery day'); 
          result = false;
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
    }
    catch(e) {
      console.log('Exception', e);
      result = false;
    }
    console.log('Global error', this.globalError, this._importService.wb.sheets[0]);
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

  cancelRemoveHoliday() {
    this.displayRemoveHoliday = false;
  }

  loadHolidaySchedule() {
    this.subscription.push(this._supplierSchedule.loadSchedule('-1',
              this.datePipe.transform(this.newHolidayDate,"MM/dd/yyyy"), 
              this.datePipe.transform(this.newHolidayStart,"MM/dd/yyyy"), 
              this.datePipe.transform(this.newHolidayEnd,"MM/dd/yyyy"), 
              this._importService.wb.sheets[0].worksheet.rows,
              this.uploadedFiles[0].name)
            .subscribe( 
                data => { console.log('data:', data);
              },
                error => {
                      // Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                      this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                },
                () => {this._messageService.add({severity:'warn', summary:'Info Message', detail: 'New holiday schedule loaded '});
                       this.waitMessage = '';
                }
            ));

  }

  executeRemoveHoliday() {
    this.subscription.push(this._supplierSchedule.removeHoliday(this.datePipe.transform(this.removeHolidayDate,"MM/dd/yyyy"))
                                .subscribe( 
                                    data => { console.log('data:', data);
                        },
                          error => {
                                // Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                                this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                          },
                          () => {this._messageService.add({severity:'warn', summary:'Info Message', detail: 'New holiday schedule loaded '});
                                this.waitMessage = '';
                          }
                      ));
  }
}
