import {Component, ViewEncapsulation, ViewChild} from '@angular/core';
import { SupplierScheduleService, Supplier,  SupplierPlanning, ValidePlanning } from '../../../shared/services/';
import { Dialog, SelectItem, Chips, Message, DataGrid, Schedule, FullCalendar } from '../../../shared/components/';
import { MessageService } from '../../../shared/components/';
import {DatePipe} from '@angular/common';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/toPromise';

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
    selector: 'schedule',
    templateUrl: './supplier.schedule.component.html',
    providers: [SupplierScheduleService, MessageService],
    styleUrls: ['./supplier.schedule.component.scss', '../../../app.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class SupplierScheduleComponent {
   
  @ViewChild('fc') fc: FullCalendar;

   columnOptions: SelectItem[];
   trackIndex: number = 0;

   screenID;

  // Search result 
   searchResult : any [] = [];
   selectedElement: Supplier;
   columnsResult: any [] = [];
   columnsSchedule: any [] = [];
   activeValidateButton: boolean = false;
   
   processReviewSchedule : boolean = false;

   public numberWeekDaysArray: Array<1>; // Number of days between Start and End schedule

   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries

  // Search action
   searchCode: string = '';
   periodStart: string = '';
   periodEnd: string = '';
   msgs: Message[] = [];

   // Original, Temporary schedule
   // originmal selection is in selectedElement variable
   temporarySchedule: TemporarySchedule [] = [];
   validateSchedule: ValidePlanning [] = [];

   // Constante used for date calculation
   oneDay: number = 1000 * 60 * 60 * 24 ;
   oneWeek: number = 1000 * 60 * 60 * 24 * 7;

   // Calculation Schedule
   colorTemporaryOrder : any = ['#FF8C00','#FF4500','#FF6347','#FF7F50','#FFA500','#DB7093','#FF69B4'];
   colorTemporaryDelivery : any = ['#00FF00', '#00FF00', '#00FF00', '#00FF00', '#00FF00', '#00FF00', '#00FF00'];
   colorPermanentOrder : any = ['#FFFACD', '#FFD700', '#F0E68C', '#FFDAB9', '#F0E68C', '#FFDAB9', '#FFFFE0'];
   colorPermanentDelivery : any = ['#00FF00', '#00FF00', '#00FF00', '#00FF00', '#00FF00', '#00FF00', '#00FF00'];

   // Completion handler
   displayUpdateCompleted: boolean;
   msgDisplayed: string;

  // Calendar
  dateNow: Date;
  dateTomorrow : Date;
  day: any = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  constructor(private _scheduleService: SupplierScheduleService, private datePipe: DatePipe,
              private _messageService: MessageService) {
    this.screenID =  'SCR0000000003';
    datePipe     = new DatePipe('en-US');
    this.dateNow = new Date();
    this.dateTomorrow =  new Date(this.dateNow.setDate(this.dateNow.getDate() + 1));

    this.columnsResult = [
      { field: 'suppliercode', header: 'Supplier code' },
      { field: 'servicecontract', header: 'Service contract code' },
      { field: 'commercialcontract', header: 'Commercial contract code' },
      { field: 'addresschain', header: 'Address chain' },
      { field: 'supplierdescription', header: 'Description' },
      { field: 'activeschedules', header: 'Number of schedules' }
    ];


    this.displayUpdateCompleted = false;
  }

  search() {
    //this.searchCode = searchCode;
    this.razSearch();
    this._messageService.add({severity:'info', summary:'Info Message', detail: 'Looking for the supplier schedule : ' + JSON.stringify(this.searchCode)});
    this._scheduleService.getSupplierScheduleInfo(this.searchCode, 
                                                  this.datePipe.transform(this.periodStart, 'MM/dd/yyyy'),
                                                  this.datePipe.transform(this.periodEnd, 'MM/dd/yyyy'))
            .subscribe( 
                data => { this.searchResult = data; // put the data returned from the server in our variable
                //console.log(JSON.stringify(this.searchResult));  
              },
                error => {
                      // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                      this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                },
                () => {this._messageService.add({severity:'warn', summary:'Info Message', detail: 'Retrieved ' + 
                                     this.searchResult.length + ' reference(s).'});
                }
            );
  }

  razSearch () {
    this.searchResult = [];
    this.selectedElement = null;
    this.processReviewSchedule = false;
    this.temporarySchedule = null;
    this.activeValidateButton = false;
  }

  /**
   * function onRowSelect (Evemt on schedule se4lection) 
   * When User selects a supplier schedule, this function copies the schedule to potential temporary schedule.
   * @param event 
   */
  onRowSelect(event) {
    let copyRegularSchedule, weekSchedule, nowDate, currentWeekDay, startDateWeek, endDateWeek, lessDays;
    this.temporarySchedule = [];
    console.log('EVENT : ' + JSON.stringify(event));
    // Initialize temporary schedule as the regular schedule with potentially one temporary week
    for (let i=0; i < event.data.schedules.length; i ++) {
      copyRegularSchedule = new TemporarySchedule();
      //weekSchedule2 = new TemporaryScheduleWeek();
      copyRegularSchedule.schedule = (Object.assign({}, event.data.schedules[i]));

      /* This section enable the start and end date of the potential Sunday to Saturday  */
      nowDate = new Date(this.periodStart);
      currentWeekDay = nowDate.getDay();
      lessDays = currentWeekDay == 0 ? 7 : currentWeekDay ;
      startDateWeek = new Date(this.periodStart);
      endDateWeek = new Date(this.periodEnd);
      
      copyRegularSchedule.start = new Date(this.periodStart); //this.datePipe.transform(startDateWeek, 'yyyy-MM-dd');
      copyRegularSchedule.end = new Date(this.periodEnd); //this.datePipe.transform(endDateWeek, 'yyyy-MM-dd');
      copyRegularSchedule.temporary = false;
      copyRegularSchedule.schedule =  event.data.schedules[i]; // Push one week
      // Need to refresh timline before pushing - Calculate the column day number.
      this.refreshTimeline(copyRegularSchedule);
      this.temporarySchedule.push(Object.assign({}, copyRegularSchedule));
     }
     console.log("TemporarySchedule  => " + JSON.stringify(this.temporarySchedule));
    //this.processReviewSchedule = true;
  }

  reviewSchedule() {
    this.processReviewSchedule = true;
    this.activeValidateButton = true;
  }

  /**
   * function transformSimulateScheduleDate 
   * @param scheduleDate 
   */
  transformSimulateScheduleDate (id: number, scheduleDate: Date, days: number, title: String, color: String) :any {
    let createSimulateSchedule: any; // = new SimulateSchedule();
    createSimulateSchedule.start = new Date(scheduleDate);
    createSimulateSchedule.end = new Date(scheduleDate);
    createSimulateSchedule.id = id;
    createSimulateSchedule.title = title;
    createSimulateSchedule.color = color;
    createSimulateSchedule.start.setDate(createSimulateSchedule.start.getDate() + days);
    createSimulateSchedule.start = this.datePipe.transform(createSimulateSchedule.start,"yyyy-MM-dd")
    createSimulateSchedule.end.setDate(createSimulateSchedule.end.getDate() + days);
    createSimulateSchedule.end = this.datePipe.transform(createSimulateSchedule.end,"yyyy-MM-dd")

    return createSimulateSchedule;
  }

  /**
   * function transformSimulateScheduleDate 
   * @param scheduleDate 
   */
  transformPlanningScheduleDate (supplierPlanning: SupplierPlanning, orderDate: Date, days: number, leadTime: number, orderTime: string, deliveryTime) : SupplierPlanning{
    let orderDatacalculation =  new Date(orderDate);
    let endDatacalculation =  new Date(orderDate);
    orderDatacalculation.setDate(orderDatacalculation.getDate() + days);
    endDatacalculation.setDate(endDatacalculation.getDate() + days + leadTime);

    supplierPlanning.orderDate.push(this.datePipe.transform(orderDatacalculation,"MM/dd/yyyy"));
    supplierPlanning.deliveryDate.push(this.datePipe.transform(endDatacalculation,"MM/dd/yyyy"));

    supplierPlanning.orderTime.push(orderTime);
    supplierPlanning.deliveryTime.push(deliveryTime);

    return supplierPlanning;
  }

  /**
   * Function adjusting the display for the timeline week (max to 2 weeks)
   * @param schedule 
   */
  refreshTimeline (schedule: TemporarySchedule) : Number{
    let startDate, endDate, weekSchedule, currentWeekDay, lessDays;
    console.log('Refresh : ' + JSON.stringify(schedule));
    console.log('Refresh schedule.start : ' + schedule.start);
    console.log('Refresh schedule.end : ' + schedule.end);
    if (schedule.start !== null) {
      try {
        //startDate = new Date(schedule.start.getTime() - schedule.start.getTimezoneOffset()*60*1000)
        startDate = new Date(schedule.start);
        //startDate = new Date(schedule.start); 
        //endDate = new Date(schedule.end.getTime() - schedule.end.getTimezoneOffset()*60*1000)
        endDate = new Date(schedule.end);
        //Timezone issue
        //startDate.setMinutes( startDate.getMinutes() + startDate.getTimezoneOffset() );
        //endDate.setMinutes( endDate.getMinutes() + endDate.getTimezoneOffset() );

        let first = startDate; //schedule.start.getDate(); //startDate.getDate() - startDate.getDay(); // First day is the day of the month - the day of the week
        currentWeekDay = first.getDay();
        lessDays = currentWeekDay; // == 6 ? 0 : currentWeekDay ;
        let dateFirst = new Date(new Date(first).setDate(first.getDate() - lessDays));

        schedule.numberWeekDays = Math.ceil(Math.abs((dateFirst.getTime() - endDate.getTime()))/this.oneWeek);
        if (schedule.numberWeekDays < 2) { schedule.numberWeekDays = 1; schedule.widthTable = 1100; }
        if (schedule.numberWeekDays >=  2) { schedule.widthTable = 1100 + 700 * (<number>schedule.numberWeekDays-1) } // Restrict to two weeks
        
        console.log('schedule.numberWeekDays : ' + schedule.numberWeekDays);
        
        this.numberWeekDaysArray= this.numberDaysWeekToArray(schedule);
        
        let sdate = new Date(dateFirst);
        schedule.columnSchedule = [];
        schedule.columnName = [];
        schedule.columnDate = [];
        schedule.columnDateMMDDYYYY = [];
        schedule.orderActive = [];
        schedule.orderDate = [];
        schedule.leadTime = [];
        schedule.collectionTime = [];
        schedule.deliveryTime = [];
        schedule.orderActiveOriginal = [];
        schedule.leadTimeOriginal = [];
        schedule.collectionTimeOriginal = [];
        schedule.deliveryTimeOriginal = [];
        //schedule.weeklySchedule = schedule.weeklySchedule.slice(0,1);
        //console.log('schedule : ' + JSON.stringify(schedule));

        for (let i = 0; i < schedule.numberWeekDays; i++) {
          //console.log('Column set up : '+ i + ' - ' + dateFirst.getTime());
          for (let j=0; j < 7; j++) {
            //sdate.setTime(dateFirst.getTime() + (j + 7*i) * this.oneDay - dateFirst.getTimezoneOffset()*60*1000);
            sdate.setTime(dateFirst.getTime() + (j + 7*i) * this.oneDay); // - dateFirst.getTimezoneOffset()*60*1000);
            schedule.columnSchedule.push(this.datePipe.transform(sdate, 'MM/dd'));
            schedule.columnName.push(this.datePipe.transform(sdate, 'EEE'));
            schedule.columnDateMMDDYYYY.push(this.datePipe.transform(sdate, 'MM/dd/yyyy'));
            schedule.columnDate.push(new Date(sdate));
            //console.log('Saturday : ' + sdate);
          }
        }
        schedule.numberWeekDaysArray= this.numberDaysWeekToArray(schedule);

        let indexActive;
        for (let i = 0; i < schedule.columnDateMMDDYYYY.length; i++) {
          indexActive = schedule.schedule.orderDate.indexOf(schedule.columnDateMMDDYYYY[i]);
          if (indexActive === -1 ) {
            schedule.orderActive.push(false);
            schedule.leadTime.push('');
            schedule.orderDate.push('');
            schedule.collectionTime.push('');
            schedule.deliveryTime.push('');

            schedule.orderActiveOriginal.push(false);
            schedule.leadTimeOriginal.push('');
            schedule.collectionTimeOriginal.push('');
            schedule.deliveryTimeOriginal.push('');
          }
          else {
            schedule.orderActive.push(true);
            schedule.orderDate.push(schedule.columnDateMMDDYYYY[i]);
            schedule.leadTime.push(schedule.schedule.leadTime[indexActive]);
            schedule.collectionTime.push(schedule.schedule.orderTime[indexActive]);
            schedule.deliveryTime.push(schedule.schedule.deliveryTime[indexActive]);

            schedule.orderActiveOriginal.push(true);
            schedule.leadTimeOriginal.push(schedule.schedule.leadTime[indexActive]);
            schedule.collectionTimeOriginal.push(schedule.schedule.orderTime[indexActive]);
            schedule.deliveryTimeOriginal.push(schedule.schedule.deliveryTime[indexActive]);
          }
        }

        //console.log("Diff : " + schedule.numberWeekDays);
      } catch (e) {
        console.log ('Error on date - Start date : ' + startDate);
        console.log ('Error on date - End date : ' + endDate); 
      }
    }
    //console.log('Refresh timeline schedule: ' + JSON.stringify(schedule));
    return schedule.numberWeekDays;
  }

  numberDaysWeekToArray (schedule: TemporarySchedule){
    let arrayDays = [];
    for (let i = 0; i < schedule.columnDate.length; i++) {
      arrayDays.push(i);
    }
    return arrayDays;
  }

  /**
   * function ValidationSchedule  
   * @param  
   */
  validationSchedule() {
    let buildValidePlanning;
    this.validateSchedule = [];
    for (let i =0; i < this.temporarySchedule.length; i++) {
      if (this.temporarySchedule[i].temporary) {
          for (let j =0; j < this.temporarySchedule[i].orderActive.length; j++) {
            if (this.temporarySchedule[i].orderActive[j]) {
              //console.log (' this.temporarySchedule[i] ' + i + ' - ' + JSON.stringify(this.temporarySchedule[i]));

              buildValidePlanning =  new ValidePlanning();
              buildValidePlanning.suppliercode = this.temporarySchedule[i].schedule.suppliercode;
              buildValidePlanning.supplierdescription = this.temporarySchedule[i].schedule.supplierdescription;
              buildValidePlanning.addresschain = this.temporarySchedule[i].schedule.addresschain;
              buildValidePlanning.commercialcontract = this.temporarySchedule[i].schedule.commercialcontract;
              buildValidePlanning.servicecontract = this.temporarySchedule[i].schedule.servicecontract;
              buildValidePlanning.sites = this.temporarySchedule[i].schedule.sites;

              buildValidePlanning.start = new Date(this.temporarySchedule[i].start.getTime());
              buildValidePlanning.end = new Date(this.temporarySchedule[i].end.getTime());

              buildValidePlanning.orderDate = this.temporarySchedule[i].columnDateMMDDYYYY[j];
              buildValidePlanning.collectionTime = this.temporarySchedule[i].collectionTime[j];
              buildValidePlanning.deliveryTime = this.temporarySchedule[i].deliveryTime[j];
              //buildValidePlanning.deliveryDate = new Date(this.temporarySchedule[i].orderDate[j].getTime());
              let calcDeliveryDate = new Date(this.temporarySchedule[i].columnDateMMDDYYYY[j]);
              //console.log (' this.temporarySchedule[i].collectionTime[j]: ' + JSON.stringify(this.temporarySchedule[i].collectionTime[j]));
              //console.log (' calcDeliveryDate: ' + JSON.stringify(calcDeliveryDate));
              //console.log ('this.temporarySchedule[i].leadTime[j] : ' + this.temporarySchedule[i].leadTime[j]);
              //let calcDeliveryDate2 = new Date(calcDeliveryDate.getTime() + parseInt(this.temporarySchedule[i].leadTime[j]))
              //console.log (' calcDeliveryDate2: ' + JSON.stringify(calcDeliveryDate2));
              //console.log ('this.temporarySchedule[i].orderDate[j] : ' + this.temporarySchedule[i].columnDateMMDDYYYY[j]);
              //console.log (' calcDeliveryDate: ' + JSON.stringify(calcDeliveryDate));
              calcDeliveryDate.setDate(calcDeliveryDate.getDate() + parseInt(this.temporarySchedule[i].leadTime[j]));

              buildValidePlanning.deliveryDate = this.datePipe.transform(calcDeliveryDate,'MM/dd/yyyy');
              //console.log (' buildValidePlanning.deliveryDate: ' + JSON.stringify(buildValidePlanning.deliveryDate));
              this.validateSchedule.push(buildValidePlanning);
            }
          }
      }
    }

    this._messageService.add({severity:'warn', summary:'Info Message', detail: 'Supplier schedule is being updated'});
    //const t = await this.deleteSchedule().toPromise();
    this.deleteSchedule().subscribe (
        data => {},
        err => {},
        () => { //console.log('Ok deletion conpleted');
              this.createSchedule().subscribe (
                data => {},
                err => {},
                () => { //console.log('Ok creation conpleted');
                  // Step 3 - execute job
                  console.log('run job ');
                  this.updateSchedule().subscribe (
                    data => {},
                    err => {},
                    () => { //console.log('Ok update conpleted');
                    // Step 3 - execute job
                    this._messageService.add({severity:'success', summary:'Info Message', detail: 'Supplier schedule has been updated'});
                    
                    if (this.validateSchedule.length === 0 ) {
                      this.msgDisplayed = 'Vendor schedule has been removed successfully during the defined period.';
                      this.displayUpdateCompleted = true;
                    }
                    else {
                      this.msgDisplayed = 'Vendor schedule ' + this.validateSchedule[0].suppliercode + ' - ' + 
                                          this.validateSchedule[0].supplierdescription + ' has been successfully updated.';
                      this.displayUpdateCompleted = true;
                    }
                  });
              });
          });
   }

  deleteSchedule(): Observable<boolean> {
    return new Observable( observer => {  
        let deleteSchedule  : SupplierPlanning;
        //console.log('Delete schedule - temporarySchedule ' +  JSON.stringify(this.temporarySchedule));
        for (let i=0; i < this.temporarySchedule.length; i ++) {
          if (this.temporarySchedule[i].temporary) {
            // console.log('Delete schedule - i ' + i + '-' + JSON.stringify(this.temporarySchedule[i]));
            this._scheduleService.deleteSchedule(this.temporarySchedule[i].schedule.suppliercode, this.temporarySchedule[i].schedule.commercialcontract,
                                                 this.temporarySchedule[i].schedule.addresschain,  this.temporarySchedule[i].schedule.servicecontract,
                                                 this.temporarySchedule[i].schedule.sites,  
                                                 this.datePipe.transform(this.temporarySchedule[i].start,'MM/dd/yyyy'),
                                                 this.datePipe.transform(this.temporarySchedule[i].end,'MM/dd/yyyy'))
           .subscribe( 
                data => { },
                error => { this._messageService.add({severity:'error', summary:'ERROR Message', detail: error }); },
                () => { console.log('Deletion request Ok: ');
                        console.log('Observer deletion completed');
                        observer.complete();
                    }
                );
              }
            }
          }
      );
    }

  createSchedule(): Observable<boolean> {
    let count = 0;
    return new Observable( observer => {  
        if (this.validateSchedule.length === 0 ) {
          observer.complete();
        }
        else {
          for (let i =0; i < this.validateSchedule.length; i++) {
            //console.log(' i : ' + i + ' - ' + JSON.stringify(this.validateSchedule[i]));
              this._scheduleService.createSchedule(this.validateSchedule[i])
              .subscribe( 
                  data => { console.log('data ' +i ); },
                  error => { this._messageService.add({severity:'error', summary:'ERROR Message', detail: error }); },
                  () => { 
                        //console.log('Creation request Ok: ' +i )
                        count = count +1;
                        //console.log('count: ' + count + ' / ' +  'this.validateSchedule.length: ' + this.validateSchedule.length);
                        if (count >= this.validateSchedule.length) {
                          observer.complete();
                }});
        }}});
    }

  updateSchedule(): Observable<boolean> {
    return new Observable( observer => {  
            this._scheduleService.updateSchedule()
            .subscribe( 
                data => { },
                error => { this._messageService.add({severity:'error', summary:'ERROR Message', detail: error }); },
                () => { observer.complete();});
        });
    }
  /**
   * ActivateDay copy from previous/after day information to the new day
   * @param schedule schedule
   * @param index day index for orderDate, OrderTime etc...
   */
  activateDay(indice: number, index: number) {
    this.temporarySchedule[indice].temporary = true;
    //console.log('ActivateDay - this.temporarySchedule[indice] BEFORE :' + JSON.stringify(this.temporarySchedule[indice]));
    //this.temporarySchedule[indice].orderActive[index] = ! this.temporarySchedule[indice].orderActive[index];
    //console.log('ActivateDay - this.temporarySchedule[indice] AFTER :' + JSON.stringify(this.temporarySchedule[indice]));
    //console.log('ActivateDay : ' + JSON.stringify(schedule));
  }

  changeMade(indice: number, index: number) {
    this.temporarySchedule[indice].temporary = true;
  }
  
  changeCollectionTime(indice: number, index: number, value: any) {
    this.temporarySchedule[indice].temporary = true;
    this.temporarySchedule[indice].collectionTime[index] = value;
    //console.log('changeCollectionTime : ' + JSON.stringify(schedule));
  }

  changeDeliveryTime(indice: number, index: number, value: any) {
    this.temporarySchedule[indice].temporary = true;
    this.temporarySchedule[indice].deliveryTime[index] = value;
    //console.log('changeDeliveryTime : ' + JSON.stringify(schedule));
  }  
  
  changeLeadTime(indice: number, index: number, value: any) {
    this.temporarySchedule[indice].temporary = true;
    this.temporarySchedule[indice].leadTime[index] = value;
    //console.log('changeLeadTime : ' + JSON.stringify(schedule));
  }

  isNotTempPeriod(indice,i) {
    //console.log('isNotTempPeriod')
    //console.log('indice,i : ' + indice + ',' + i);
    //console.log('this.temporarySchedule[indice].columnDate : ' + JSON.stringify(this.temporarySchedule[indice].columnDate));
    //console.log('this.temporarySchedule[indice].columnDate[i] : ' + JSON.stringify(this.temporarySchedule[indice].columnDate[i]));
    //console.log('this.temporarySchedule[indice].columnDate[i].getDate() : ' + JSON.stringify(this.temporarySchedule[indice].columnDate[i]));
    let dateToCheck = this.datePipe.transform(this.temporarySchedule[indice].columnDate[i], 'yyyyMMdd');
    let compareStart = this.datePipe.transform(this.temporarySchedule[indice].start,'yyyyMMdd');
    let compareEnd = this.datePipe.transform(this.temporarySchedule[indice].end,'yyyyMMdd');
    //console.log('dateToCheck : ' + dateToCheck);
    //console.log('this.temporarySchedule[indice].start : ' + compareStart);
    //console.log('this.temporarySchedule[indice].end : ' + compareEnd);
    //console.log('isNotTempPeriod : ' + (compareStart > dateToCheck || compareEnd < dateToCheck));
    return compareStart > dateToCheck || compareEnd < dateToCheck;
  }


  isOrderDay(indice,i) {
    let dateToCheck = this.datePipe.transform(new Date(this.temporarySchedule[indice].columnDate[i]), 'MM/dd/yyyy');
    //console.log('day,indice,i : ' + day + ',' + indice + ',' + i);
    //console.log('dateToCheck : ' + dateToCheck);
    //console.log('this.temporarySchedule[indice].start : ' + compareStart);
    //console.log('this.temporarySchedule[indice].end : ' + compareEnd);
    //console.log('isOrderDay : ' + (this.temporarySchedule[indice].schedule.orderDate.indexOf(dateToCheck) !== -1));
    return this.temporarySchedule[indice].schedule.orderDate.indexOf(dateToCheck) !== -1
  }

  trackByIdx(index: number, obj: any): any {
    return index;
  }
}


export class TemporarySchedule {
  public schedule: SupplierPlanning;
  public temporary: boolean = false;
  public numberWeekDays : number = 1;
  public start: Date;
  public end: Date;
  public columnSchedule = [];
  public columnName = [];
  public columnDate = [];
  public columnDateMMDDYYYY = [];
  public numberWeekDaysArray = []; // Sequence number used for LOOP in HTML
  // Used for HTML easy displays
  public orderActiveOriginal = [];
  public leadTimeOriginal = [];
  public collectionTimeOriginal = [];
  public deliveryTimeOriginal = [];

  public orderActive = [];
  public orderDate = [];
  public leadTime = [];
  public collectionTime = [];
  public deliveryTime = [];
  public widthTable = 700;
}


