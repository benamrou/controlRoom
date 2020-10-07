import {Component, ViewEncapsulation, ViewChild} from '@angular/core';
import { SupplierContractScheduleService, Supplier, SupplierContract, SupplierContractPlanning } from '../../../shared/services';
import { Dialog, SelectItem, Chips, Message, DataGrid, Schedule, FullCalendar } from '../../../shared/components';
import { MessageService } from '../../../shared/components';
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
    templateUrl: './service.contract.component.html',
    providers: [SupplierContractScheduleService, MessageService],
    styleUrls: ['./service.contract.component.scss', '../../../app.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class SupplierScheduleServiceContractComponent {
   
  @ViewChild('fc') fc: FullCalendar;

   columnOptions: SelectItem[];
   trackIndex: number = 0;


  // Search result 
   searchResult : any [] = [];
   selectedElement: Supplier;
   columnsResult: any [] = [];
   columnsSchedule: any [] = [];
   
   processReviewSchedule : boolean = false;
   headersSimulation: any;
   simulateReviewSchedule : boolean = false;

   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries

  // Search action
   searchCode: string = '';
   msgs: Message[] = [];

   // Original, Temporary and Simulation schedule
   // originmal selection is in selectedElement variable
   temporarySchedule: TemporaryScheduleServiceContract [] = [];
   simulateSchedule: SimulateScheduleServiceContract [] = [];
   validateSchedule: SupplierContractPlanning [] = [];

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

  constructor(private _scheduleService: SupplierContractScheduleService, private datePipe: DatePipe,
              private _messageService: MessageService) {
    datePipe     = new DatePipe('en-US');
    this.dateNow = new Date();
    this.dateTomorrow =  new Date(this.dateNow.setDate(this.dateNow.getDate() + 1));

    this.columnsResult = [
      { field: 'externalcode', header: 'Supplier code' },
      { field: 'servicecontract', header: 'Service contract code' },
      { field: 'commercialcontract', header: 'Commercial contract code' },
      { field: 'addresschain', header: 'Address chain' },
      { field: 'description', header: 'Description' },
      { field: 'activeschedules', header: 'Number of schedules' }
    ];


    this.headersSimulation = {
			left: 'prev,next today',
			center: 'title',
			right: '' 
    };

    this.displayUpdateCompleted = false;

  }

  search() {
    //this.searchCode = searchCode;
    this.razSearch();
    this._messageService.add({severity:'info', summary:'Info Message', detail: 'Looking for the supplier schedule : ' + JSON.stringify(this.searchCode)});
    this._scheduleService.getSupplierScheduleServiceContractInfo(this.searchCode)
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
    this.simulateReviewSchedule = false;
    this.temporarySchedule = null;
  }

  /**
   * function onRowSelect (Evemt on schedule se4lection) 
   * When User selects a supplier schedule, this function copies the schedule to potential temporary schedule.
   * @param event 
   */
  onRowSelect(event) {
    let copyRegularSchedule, weekSchedule, nowDate, currentWeekDay, startDateWeek, endDateWeek, lessDays;
    this.temporarySchedule = [];
    this.simulateSchedule = [];
    this.simulateReviewSchedule = false;
    // Initialize temporary schedule as the regular schedule with potentially one temporary week
    for (let i=0; i < event.data.schedules.length; i ++) {
      copyRegularSchedule = new TemporaryScheduleServiceContract();
      weekSchedule = new TemporaryScheduleWeekServiceContract();
      //weekSchedule2 = new TemporaryScheduleWeek();
      weekSchedule.schedule = (Object.assign({}, event.data.schedules[i]));

      /* This section enable the start and end date of the potential Sunday to Saturday  */
      nowDate = new Date(Date.now());
      currentWeekDay = nowDate.getDay();
      lessDays = currentWeekDay == 0 ? 7 : currentWeekDay ;
      startDateWeek = new Date(new Date(nowDate).setDate(nowDate.getDate() - lessDays));
      endDateWeek = new Date(new Date(startDateWeek).setDate(startDateWeek.getDate() + 6));
      
      if (endDateWeek < this.dateTomorrow) {
        endDateWeek =  this.dateTomorrow;
      }
      copyRegularSchedule.start = this.dateTomorrow; //this.datePipe.transform(startDateWeek, 'yyyy-MM-dd');
      copyRegularSchedule.end = endDateWeek; //this.datePipe.transform(endDateWeek, 'yyyy-MM-dd');
      copyRegularSchedule.temporary = false;
      weekSchedule.schedule.start = startDateWeek; //this.datePipe.transform(startDateWeek, 'yyyy-MM-dd');
      weekSchedule.schedule.end = endDateWeek; //this.datePipe.transform(endDateWeek, 'yyyy-MM-dd');
      copyRegularSchedule.weeklySchedule.push(Object.assign({}, weekSchedule)); // Push one week
      // Need to refresh timline before pushing - Calculate the column day number.
      this.refreshTimeline(copyRegularSchedule);
      this.temporarySchedule.push(Object.assign({}, copyRegularSchedule));
      //console.log("TemporarySchedule " + i + '  => ' + JSON.stringify(this.temporarySchedule));
     }
    //this.processReviewSchedule = true;
  }

  reviewSchedule() {
    this.processReviewSchedule = true;
  }

  simulationSchedule() {
    this.simulateSchedule = [];    
    this.validateSchedule = [];    
    this.simulationPermanentScheduleBefore();
    this.simulationTemporarySchedule();
    this.simulationPermanentScheduleAfter();

    //console.log('Simulate:' + JSON.stringify(this.simulateSchedule));
    //console.log('Validate:' + JSON.stringify(this.validateSchedule));
  }

  simulationPermanentScheduleBefore() {
    let oneDay = 1000 * 60 * 60 * 24 ;
    let backDay = 20;
    let day;
    //console.log('simulationPermanentScheduleBefore : ' +JSON.stringify(this.selectedElement.schedules));
    for (let i=0; i < this.selectedElement.schedules.length; i ++) {
        let weekday;
        let startDate = new Date(Date.now());
        startDate.setDate(startDate.getDate()-backDay);
        let endDate = new Date();
        endDate.setDate(endDate.getDate()+60);
        switch (this.datePipe.transform(startDate,'EEE')) {
          case 'Mon':
            weekday = 0;
            break;
          case 'Tue':
            weekday = 1;
            break;
          case 'Wed':
            weekday = 2;
            break;
          case 'Thu':
            weekday = 3;
            break;
          case 'Fri':
            weekday = 4;
            break;
          case 'Sat':
            weekday = 5;
            break;
          case 'Sun':
            weekday = 6;
            break;
          default:
            weekday = 0;
        }
        let j =0;
        let timeline = new Date(startDate);
        let minSchedule = new Date('12/31/2049');
        minSchedule = this.getMinDateTemporarySchedule(minSchedule);
        console.log('simulationPermanentScheduleBefore / minSchedule : ' + minSchedule);
        console.log('simulationPermanentScheduleBefore / Temporary : ' + JSON.stringify(this.temporarySchedule));
        //console.log('endDate : ' + endDate);
        //console.log('Min Temporary : ' + this.getMinDateTemporarySchedule(endDate));
        //console.log('Timeline / j : ' + timeline + ' / ' + j);
        while ( this.datePipe.transform(minSchedule,'yyyyMMdd') > this.datePipe.transform(timeline,'yyyyMMdd')) {
        timeline.setTime(timeline.getTime()+ oneDay);
        //console.log('Min Temporary : ' + this.getMinDateTemporarySchedule(endDate));
        //console.log('Timeline / j : ' + timeline + ' / ' + j);
        //console.log('Test date: ' + (this.getMinDateTemporarySchedule(endDate) > timeline));
          switch ((weekday + j)%7) {
          case 0:
            if (this.selectedElement.schedules[i].orderMonday) {       
              //console.log ( "Monday !");
              this.simulateSchedule = [...this.simulateSchedule,Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                    j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorPermanentOrder[i]))];
              this.simulateSchedule = [...this.simulateSchedule,(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                      parseInt(this.selectedElement.schedules[i].leadTimeMonday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode,
                      this.colorPermanentDelivery[i])))];
            }
            break;
          case 1:
            if (this.selectedElement.schedules[i].orderTuesday) {   
              //console.log ( "Tuesday !");
              this.simulateSchedule = [...this.simulateSchedule,Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                    j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorPermanentOrder[i]))];
              this.simulateSchedule = [...this.simulateSchedule,Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                      parseInt(this.selectedElement.schedules[i].leadTimeTuesday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode, 
                      this.colorPermanentDelivery[i]))];
            }
            break;
          case 2:
            if (this.selectedElement.schedules[i].orderWednesday) {       
              //console.log ( "Wednesday !");
              this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                    j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorPermanentOrder[i]))];
              this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                      parseInt(this.selectedElement.schedules[i].leadTimeWednesday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode, 
                      this.colorPermanentDelivery[i]))];
            }
            break;
          case 3:
            if (this.selectedElement.schedules[i].orderThursday) {       
              //console.log ( "Thursday !");
              this.simulateSchedule = [...this.simulateSchedule,Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                    j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorPermanentOrder[i]))];
              this.simulateSchedule = [...this.simulateSchedule,Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                      parseInt(this.selectedElement.schedules[i].leadTimeThursday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode, 
                      this.colorPermanentDelivery[i]))];
            }
            break;
          case 4:
            if (this.selectedElement.schedules[i].orderFriday) {       
              //console.log ( "Friday !");
              this.simulateSchedule = [...this.simulateSchedule,Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                    j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorPermanentOrder[i]))];
              this.simulateSchedule = [...this.simulateSchedule,Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                      parseInt(this.selectedElement.schedules[i].leadTimeFriday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode, 
                      this.colorPermanentDelivery[i]))];
            }
            break;
          case 5:
            if (this.selectedElement.schedules[i].orderSaturday) {    
              //console.log ( "Saturday !");
              this.simulateSchedule = [...this.simulateSchedule,Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                    j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorPermanentOrder[i]))];
              this.simulateSchedule = [...this.simulateSchedule,Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                      parseInt(this.selectedElement.schedules[i].leadTimeSaturday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode, 
                      this.colorPermanentDelivery[i]))];
            }
            break;
          case 6:
            if (this.selectedElement.schedules[i].orderSunday) {       
              //console.log ( "Sunday !");
              this.simulateSchedule = [...this.simulateSchedule,Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                    j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorPermanentOrder[i]))];
              this.simulateSchedule = [...this.simulateSchedule,Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                      parseInt(this.selectedElement.schedules[i].leadTimeSunday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode, 
                      this.colorPermanentDelivery[i]))];
            }
            break;
          default:
            weekday = 0;
          }
          j++;
      }
    }
    console.log ('Simuate before : ' + JSON.stringify(this.simulateSchedule));
    this.simulateReviewSchedule = true;
  }

  simulationTemporarySchedule () {
    let supplierPlanning  : SupplierContractPlanning;
    let oneDay = 1000 * 60 * 60 * 24 ;
    for (let i=0; i < this.temporarySchedule.length; i ++) {
      if (this.temporarySchedule[i].temporary) {
        console.log('simulationTemporarySchedule : ' + JSON.stringify(this.temporarySchedule[i]));
        let startDate = new Date(this.temporarySchedule[i].start);
        let endDate = this.datePipe.transform(this.temporarySchedule[i].end, 'yyyyMMdd');
        /**  Supplier Planning is the FOUPLAN */ 
        
        for (let k=0; k < this.temporarySchedule[i].numberWeekDays; k ++) {
          console.log ('this.temporarySchedule[i].temporary: ' + this.temporarySchedule[i].temporary);
          console.log ('this.temporarySchedule[i].start: ' + this.temporarySchedule[i].start);
          if (this.temporarySchedule[i].temporary ) {
            console.log ('step 10');
            let weekday;
            if (k > 0 ) {
               this.validateSchedule = [...this.validateSchedule,Object.assign({}, supplierPlanning)];
            }
            supplierPlanning = new SupplierContractPlanning();
            supplierPlanning.start = this.datePipe.transform(this.temporarySchedule[i].start, 'MM/dd/yyyy');
            supplierPlanning.end = this.datePipe.transform(this.temporarySchedule[i].end, 'MM/dd/yyyy');
            supplierPlanning.suppliercode = this.temporarySchedule[i].weeklySchedule[0].schedule.suppliercode;
            supplierPlanning.description = this.temporarySchedule[i].weeklySchedule[0].schedule.description;
            supplierPlanning.commercialcontract = this.temporarySchedule[i].weeklySchedule[0].schedule.commercialcode;
            supplierPlanning.servicecontract = this.temporarySchedule[i].weeklySchedule[0].schedule.externalcode;
            supplierPlanning.addresschain = this.temporarySchedule[i].weeklySchedule[0].schedule.addresschaincode;
            supplierPlanning.sites = Object.assign([], this.temporarySchedule[i].weeklySchedule[0].schedule.sites);

            console.log ('step 1 ');
            switch (this.datePipe.transform(startDate,'EEE')) {
              case this.day[0]: // Monday
                weekday = 0;
                break;
              case this.day[1]: // Tuesday
                weekday = 1;
                break;
              case this.day[2]: // Wednesday
                weekday = 2;
                break;
              case this.day[3]: // Thursday
                weekday = 3;
                break;
              case this.day[4]: // Friday
                weekday = 4;
                break;
              case this.day[5]: // Saturday
                weekday = 5;
                break;
              case this.day[6]: // Sunday
                weekday = 6;
                break;
              default:
                weekday = 0;
              }
            //console.log('Weekday : ' + weekday);
            let j =0;
            let timeline = new Date(startDate);
            timeline.setTime(timeline.getTime()+ 7*k*oneDay);
            console.log ('step 2 ');
            console.log('endDate : ' + endDate);
            console.log('Timeline : ' + timeline);
            console.log('k : ' + k);
            console.log('weekday : ' + weekday);
            while (  j < 7 && (endDate >= this.datePipe.transform(timeline,'yyyyMMdd'))) {

              console.log ('step 3 ');
              console.log('Timeline / j : ' + timeline + '/' + j );
              startDate = new Date(this.temporarySchedule[i].start);
              console.log('Adding simulation tempororarySchedule day : ' + (weekday + j)%7);
              switch ((weekday + j)%7) {
              case 0:
                if (this.temporarySchedule[i].weeklySchedule[k].schedule.orderMonday || 
                   this.temporarySchedule[i].weeklySchedule[k].schedule.orderMonday == 1) {       
                  //console.log ( "Monday !");
                  this.simulateSchedule = [...this.simulateSchedule,Object.assign({}, 
                      this.transformSimulateScheduleDate(i, startDate, 
                        j + 7*k, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorTemporaryOrder[i]))];
                  this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                      this.transformSimulateScheduleDate(i, startDate, 
                          parseInt(this.temporarySchedule[i].weeklySchedule[k].schedule.leadTimeMonday)+j+ 7*k, 
                            'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode,
                          this.colorTemporaryDelivery[i]))];

                  this.validateSchedule = [...this.validateSchedule,Object.assign({}, 
                    this.transformPlanningScheduleDate (supplierPlanning, startDate, j + 7*k, 
                              (parseInt(this.temporarySchedule[i].weeklySchedule[k].schedule.leadTimeMonday)),
                              this.temporarySchedule[i].weeklySchedule[k].schedule.collectionTimeMonday1,
                              this.temporarySchedule[i].weeklySchedule[k].schedule.deliveryTimeMonday1))];
                }
                break;
              case 1:
                if (this.temporarySchedule[i].weeklySchedule[k].schedule.orderTuesday ||
                    this.temporarySchedule[i].weeklySchedule[k].schedule.orderTuesday == 1) {   
                  //console.log ( "Tuesday !");
                  this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                      this.transformSimulateScheduleDate(i, startDate, 
                        j + 7*k, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorTemporaryOrder[i]))];
                  this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                      this.transformSimulateScheduleDate(i, startDate, 
                          parseInt(this.temporarySchedule[i].weeklySchedule[k].schedule.leadTimeTuesday)+j+ 7*k, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode,
                          this.colorTemporaryDelivery[i]))];
                   
                  this.validateSchedule = [...this.validateSchedule,Object.assign({}, 
                    this.transformPlanningScheduleDate (supplierPlanning, startDate, j + 7*k, 
                              (parseInt(this.temporarySchedule[i].weeklySchedule[k].schedule.leadTimeTuesday)),
                              this.temporarySchedule[i].weeklySchedule[k].schedule.collectionTimeTuesday1,
                              this.temporarySchedule[i].weeklySchedule[k].schedule.deliveryTimeTuesday1))];       
                }
                break;
              case 2:
                if (this.temporarySchedule[i].weeklySchedule[k].schedule.orderWednesday ||
                  this.temporarySchedule[i].weeklySchedule[k].schedule.orderWednesday == 1) {    
                  //console.log ( "Wednesday ! Schedule # " + i);
                  this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                      this.transformSimulateScheduleDate(i, startDate, 
                        j + 7*k, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorTemporaryOrder[i]))];
                  this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                      this.transformSimulateScheduleDate(i, startDate, 
                          parseInt(this.temporarySchedule[i].weeklySchedule[k].schedule.leadTimeWednesday)+j + 7*k, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode,
                          this.colorTemporaryDelivery[i]))];
                   
                  this.validateSchedule = [...this.validateSchedule,Object.assign({}, 
                    this.transformPlanningScheduleDate (supplierPlanning, startDate, j + 7*k, 
                              (parseInt(this.temporarySchedule[i].weeklySchedule[k].schedule.leadTimeWednesday)),
                              this.temporarySchedule[i].weeklySchedule[k].schedule.collectionTimeWednesday1,
                              this.temporarySchedule[i].weeklySchedule[k].schedule.deliveryTimeWednesday1))];      
                }
                break;
              case 3:
                if (this.temporarySchedule[i].weeklySchedule[k].schedule.orderThursday ||
                    this.temporarySchedule[i].weeklySchedule[k].schedule.orderThursday == 1) {    
                  //console.log ( "Thursday !");
                  this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                      this.transformSimulateScheduleDate(i, startDate, 
                        j + 7*k, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorTemporaryOrder[i]))];
                  this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                      this.transformSimulateScheduleDate(i, startDate, 
                          parseInt(this.temporarySchedule[i].weeklySchedule[k].schedule.leadTimeThursday)+j + 7*k, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode,
                          this.colorTemporaryDelivery[i]))];

                  console.log ('Thursday - transformPlanningScheduleDate: ' + this.transformPlanningScheduleDate(supplierPlanning, startDate, j + 7*k, 
                    (parseInt(this.temporarySchedule[i].weeklySchedule[k].schedule.leadTimeThursday)),
                    this.temporarySchedule[i].weeklySchedule[k].schedule.collectionTimeThursday1,
                    this.temporarySchedule[i].weeklySchedule[k].schedule.deliveryTimeThursday1));

                    console.log(' parseInt(this.temporarySchedule[i].weeklySchedule[k].schedule.leadTimeThursday): ' + parseInt(this.temporarySchedule[i].weeklySchedule[k].schedule.leadTimeThursday));
                    console.log(' this.temporarySchedule[i].weeklySchedule[k].schedule.collectionTimeThursday1: ' + this.temporarySchedule[i].weeklySchedule[k].schedule.collectionTimeThursday1);
                    console.log(' this.temporarySchedule[i].weeklySchedule[k].schedule.deliveryTimeThursday1): ' + this.temporarySchedule[i].weeklySchedule[k].schedule.deliveryTimeThursday1);
                  
                  this.validateSchedule = [...this.validateSchedule,Object.assign({}, 
                    this.transformPlanningScheduleDate (supplierPlanning, startDate, j + 7*k, 
                              (parseInt(this.temporarySchedule[i].weeklySchedule[k].schedule.leadTimeThursday)),
                              this.temporarySchedule[i].weeklySchedule[k].schedule.collectionTimeThursday1,
                              this.temporarySchedule[i].weeklySchedule[k].schedule.deliveryTimeThursday1))];     
                }
                break;
              case 4:
                if (this.temporarySchedule[i].weeklySchedule[k].schedule.orderFriday ||
                    this.temporarySchedule[i].weeklySchedule[k].schedule.orderFriday == 1) {       
                  //console.log ( "Friday !");
                  this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                      this.transformSimulateScheduleDate(i, startDate, 
                        j + 7*k, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorTemporaryOrder[i]))];
                  this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                      this.transformSimulateScheduleDate(i, startDate, 
                          parseInt(this.temporarySchedule[i].weeklySchedule[k].schedule.leadTimeFriday)+j + 7*k, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode, 
                          this.colorTemporaryDelivery[i]))];
                   
               

                  this.validateSchedule = [...this.validateSchedule,Object.assign({}, 
                    this.transformPlanningScheduleDate (supplierPlanning, startDate, j + 7*k, 
                              (parseInt(this.temporarySchedule[i].weeklySchedule[k].schedule.leadTimeFriday)),
                              this.temporarySchedule[i].weeklySchedule[k].schedule.collectionTimeFriday1,
                              this.temporarySchedule[i].weeklySchedule[k].schedule.deliveryTimeFriday1))];     
                }
                break;
              case 5:
                if (this.temporarySchedule[i].weeklySchedule[k].schedule.orderSaturday ||
                      this.temporarySchedule[i].weeklySchedule[k].schedule.orderSaturday == 1) {    
                  //console.log ( "Saturday !");
                  this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                      this.transformSimulateScheduleDate(i, startDate, 
                        j + 7*k, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorTemporaryOrder[i]))];
                  this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                      this.transformSimulateScheduleDate(i, startDate, 
                          parseInt(this.temporarySchedule[i].weeklySchedule[k].schedule.leadTimeSaturday)+j + 7*k, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode, 
                          this.colorTemporaryDelivery[i]))];
                   
                  this.validateSchedule = [...this.validateSchedule,Object.assign({}, 
                    this.transformPlanningScheduleDate (supplierPlanning, startDate, j + 7*k, 
                              (parseInt(this.temporarySchedule[i].weeklySchedule[k].schedule.leadTimeSaturday)),
                              this.temporarySchedule[i].weeklySchedule[k].schedule.collectionTimeSaturday1,
                              this.temporarySchedule[i].weeklySchedule[k].schedule.deliveryTimeSaturday1))];    
                }
                break;
              case 6:
                if (this.temporarySchedule[i].weeklySchedule[k].schedule.orderSunday ||
                    this.temporarySchedule[i].weeklySchedule[k].schedule.orderSunday == 1) {        
                  //console.log ( "Sunday !");
                  this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                      this.transformSimulateScheduleDate(i, startDate, 
                        j + 7*k, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorTemporaryOrder[i]))];
                  this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                      this.transformSimulateScheduleDate(i, startDate, 
                          parseInt(this.temporarySchedule[i].weeklySchedule[k].schedule.leadTimeSunday)+j + 7*k, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode, 
                          this.colorTemporaryDelivery[i]))];
                   
                  this.validateSchedule = [...this.validateSchedule,Object.assign({}, 
                    this.transformPlanningScheduleDate (supplierPlanning, startDate, j + 7*k, 
                              (parseInt(this.temporarySchedule[i].weeklySchedule[k].schedule.leadTimeSunday)),
                              this.temporarySchedule[i].weeklySchedule[k].schedule.collectionTimeSunday1,
                              this.temporarySchedule[i].weeklySchedule[k].schedule.deliveryTimeSunday1))];    
                }
                break;
              default:
                weekday = 0;
                }

                timeline.setTime(timeline.getTime()+ oneDay);
                console.log ('Timline +1 : ' + this.datePipe.transform(timeline,'yyyyMMdd'));
                j++;
              }
          }
        }
      }
    }
    console.log('simulationTemporarySchedule / simulateSchedule : ' + JSON.stringify(this.simulateSchedule));
    console.log('simulationTemporarySchedule / validateSchedule : ' + JSON.stringify(this.validateSchedule));
    this.simulateReviewSchedule = true;
  }

  simulationPermanentScheduleAfter() {
    let oneDay = 1000 * 60 * 60 * 24 ;
    for (let i=0; i < this.selectedElement.schedules.length; i ++) {
        let weekday;
        let startDate = new Date(this.temporarySchedule[i].end);
        startDate.setDate(startDate.getDate());
        let endDate = new Date(startDate);
        endDate.setDate(endDate.getDate()+60);
        //console.log('End date : ' + endDate);
        switch (this.datePipe.transform(startDate,'EEE')) {
          case 'Mon':
            weekday = 0;
            break;
          case 'Tue':
            weekday = 1;
            break;
          case 'Wed':
            weekday = 2;
            break;
          case 'Thu':
            weekday = 3;
            break;
          case 'Fri':
            weekday = 4;
            break;
          case 'Sat':
            weekday = 5;
            break;
          case 'Sun':
            weekday = 6;
            break;
          default:
            weekday = 0;
        }
        let j =0;
        let timeline = new Date(startDate);
        timeline.setDate(timeline.getDate());
        while (  j < 40 && (this.datePipe.transform(endDate,'yyyyMMdd') >= this.datePipe.transform(timeline,'yyyyMMdd'))) {
          if (this.datePipe.transform(timeline,'yyyyMMdd') > this.datePipe.transform(this.temporarySchedule[i].end,'yyyyMMdd')) {
            console.log('Timeline : ' + this.datePipe.transform(timeline,'yyyyMMdd'));
            console.log('this.temporarySchedule[i].end : ' + this.datePipe.transform(this.temporarySchedule[i].end,'yyyyMMdd'));
          //console.log('Min Temporary : ' + this.getMinDateTemporarySchedule(endDate));
          //console.log('Timeline / j : ' + timeline + ' / ' + j);
          //console.log('Test date: ' + (this.getMinDateTemporarySchedule(endDate) > timeline));
            switch ((weekday + j)%7) {
            case 0:
              if (this.selectedElement.schedules[i].orderMonday) {       
                //console.log ( "Monday !");
                this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                    this.transformSimulateScheduleDate(i, startDate, 
                      j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorPermanentOrder[i]))];
                this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                    this.transformSimulateScheduleDate(i, startDate, 
                        parseInt(this.selectedElement.schedules[i].leadTimeMonday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode,
                        this.colorPermanentDelivery[i]))];
              }
              break;
            case 1:
              if (this.selectedElement.schedules[i].orderTuesday) {   
                //console.log ( "Tuesday !");
                this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                    this.transformSimulateScheduleDate(i, startDate, 
                      j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorPermanentOrder[i]))];
                this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                    this.transformSimulateScheduleDate(i, startDate, 
                        parseInt(this.selectedElement.schedules[i].leadTimeTuesday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode, 
                        this.colorPermanentDelivery[i]))];
              }
              break;
            case 2:
              if (this.selectedElement.schedules[i].orderWednesday) {       
                //console.log ( "Wednesday !");
                this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                    this.transformSimulateScheduleDate(i, startDate, 
                      j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorPermanentOrder[i]))];
                this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                    this.transformSimulateScheduleDate(i, startDate, 
                        parseInt(this.selectedElement.schedules[i].leadTimeWednesday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode, 
                        this.colorPermanentDelivery[i]))];
              }
              break;
            case 3:
              if (this.selectedElement.schedules[i].orderThursday) {       
                //console.log ( "Thursday !");
                this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                    this.transformSimulateScheduleDate(i, startDate, 
                      j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorPermanentOrder[i]))];
                this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                    this.transformSimulateScheduleDate(i, startDate, 
                        parseInt(this.selectedElement.schedules[i].leadTimeThursday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode, 
                        this.colorPermanentDelivery[i]))];
              }
              break;
            case 4:
              if (this.selectedElement.schedules[i].orderFriday) {       
                //console.log ( "Friday !");
                this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                    this.transformSimulateScheduleDate(i, startDate, 
                      j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorPermanentOrder[i]))];
                this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                    this.transformSimulateScheduleDate(i, startDate, 
                        parseInt(this.selectedElement.schedules[i].leadTimeFriday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode, 
                        this.colorPermanentDelivery[i]))];
              }
              break;
            case 5:
              if (this.selectedElement.schedules[i].orderSaturday) {    
                //console.log ( "Saturday !");
                this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                    this.transformSimulateScheduleDate(i, startDate, 
                      j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorPermanentOrder[i]))];
                this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                    this.transformSimulateScheduleDate(i, startDate, 
                        parseInt(this.selectedElement.schedules[i].leadTimeSaturday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode, 
                        this.colorPermanentDelivery[i]))];
              }
              break;
            case 6:
              if (this.selectedElement.schedules[i].orderSunday) {       
                //console.log ( "Sunday !");
                this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                    this.transformSimulateScheduleDate(i, startDate, 
                      j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorPermanentOrder[i]))];
                this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                    this.transformSimulateScheduleDate(i, startDate, 
                        parseInt(this.selectedElement.schedules[i].leadTimeSunday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode, 
                        this.colorPermanentDelivery[i]))];
              }
              break;
            default:
              weekday = 0;
            }
          }
          timeline.setTime(timeline.getTime()+ oneDay);
          j++;
      }
    }
    console.log('simulationPermanentScheduleAfter / simulateSchedule : ' + JSON.stringify(this.simulateSchedule));
    console.log('simulationPermanentScheduleAfter / validateSchedule : ' + JSON.stringify(this.validateSchedule));

    this.simulateReviewSchedule = true;
  }

  getMinDateTemporarySchedule(minDate: Date) {
    for (let i =0; i < this.temporarySchedule.length; i++) {
        for (let k=0; k < this.temporarySchedule[i].weeklySchedule.length; k ++) {
        if (this.temporarySchedule[i].temporary) {
            let startDate = new Date(this.temporarySchedule[i].start);
            if (minDate > startDate) {
              minDate = new Date(startDate);
            }
        }
      }
    }
    return minDate;
  }
  /**
   * function createTemporarySchedule 
   * When User decides to create a temporary schedule creation.
   * @param schedule 
   */
  createTemporarySchedule (schedule: TemporaryScheduleServiceContract) {
    this.refreshTimeline(schedule);
    schedule.temporary = true;

  }

  /**
   * function undoTemporarySchedule 
   * When User decides to undo/remove a temporary schedule creation.
   * @param schedule 
   */
  undoTemporarySchedule (schedule: TemporaryScheduleServiceContract) {
    schedule.temporary = false;
  }

  /**
   * function createTemporarySchedule 
   * When User decides to create a temporary schedule creation.
   * @param schedule 
   */
  isScheduleToChange (schedule: TemporaryScheduleServiceContract) {
    return schedule.temporary;
  }

  /**
   * function transformSimulateScheduleDate 
   * @param scheduleDate 
   */
  transformSimulateScheduleDate (id: number, scheduleDate: Date, days: number, title: String, color: String) :SimulateScheduleServiceContract {
    let createSimulateSchedule = new SimulateScheduleServiceContract();
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
  transformPlanningScheduleDate (supplierPlanning: SupplierContractPlanning, orderDate: Date, days: number, leadTime: number, orderTime: string, deliveryTime) : SupplierContractPlanning{
    let orderDatacalculation =  new Date(orderDate);
    let endDatacalculation =  new Date(orderDate);
    orderDatacalculation.setDate(orderDatacalculation.getDate() + days);
    endDatacalculation.setDate(endDatacalculation.getDate() + days + leadTime);

    supplierPlanning.orderDate = this.datePipe.transform(orderDatacalculation,"MM/dd/yyyy");
    supplierPlanning.deliveryDate = this.datePipe.transform(endDatacalculation,"MM/dd/yyyy");

    supplierPlanning.orderTime = orderTime
    supplierPlanning.deliveryTime = deliveryTime

    return supplierPlanning;
  }

  /**
   * Function adjusting the display for the timeline week (max to 2 weeks)
   * @param schedule 
   */
  refreshTimeline (schedule: TemporaryScheduleServiceContract) : Number{
    let startDate, endDate, weekSchedule, currentWeekDay, lessDays;
    let oneDay = 1000 * 60 * 60 * 24 ;
    let oneWeek = 1000 * 60 * 60 * 24 * 7;
    //console.log('Refresh : ' + JSON.stringify(schedule));
    //console.log('Refresh schedule.start : ' + schedule.start);
    if (schedule.start !== null) {
      try {
        startDate = new Date(schedule.start.getTime() - schedule.start.getTimezoneOffset()*60*1000)
        //startDate = new Date(schedule.start); 
        endDate = new Date(schedule.end); 
        //Timezone issue
        startDate.setMinutes( startDate.getMinutes() + startDate.getTimezoneOffset() );
        endDate.setMinutes( endDate.getMinutes() + endDate.getTimezoneOffset() );

        let first = startDate; //schedule.start.getDate(); //startDate.getDate() - startDate.getDay(); // First day is the day of the month - the day of the week
        currentWeekDay = first.getDay();
        lessDays = currentWeekDay; // == 6 ? 0 : currentWeekDay ;
        let dateFirst = new Date(new Date(first).setDate(first.getDate() - lessDays));

        schedule.numberWeekDays = Math.ceil(Math.abs((dateFirst.getTime() - endDate.getTime()))/oneWeek);
        if (schedule.numberWeekDays < 2) { schedule.numberWeekDays = 1; schedule.widthTable = 1100; }
        if (schedule.numberWeekDays >=  2) { schedule.widthTable = 1100 + 700 * (<number>schedule.numberWeekDays-1) } // Restrict to two weeks
        
        //console.log('schedule.numberWeekDays : ' + schedule.numberWeekDays);
        
        schedule.numberWeekDaysArray= this.numberDaysWeekToArray(schedule);
        

        //console.log('startDate : ' + startDate);
        //console.log('endDate : ' + endDate);
        //console.log('currentWeekDay : ' + currentWeekDay);
        //console.log('numberWeekDays : ' + schedule.numberWeekDays);
        //console.log('lessDays : ' + lessDays);
        //console.log('first : ' + first);
        //console.log('dateFirst : ' + dateFirst);
        let sdate = new Date(dateFirst);
        schedule.columnSchedule = [];
        schedule.columnName = [];
        schedule.columnDate = [];
        schedule.weeklySchedule = schedule.weeklySchedule.slice(0,1);
        //console.log('schedule : ' + JSON.stringify(schedule));


        for (let i = 0; i < schedule.numberWeekDays; i++) {
          if (schedule.weeklySchedule.length-1 < i) {
              // Create additional temporarySchedule
              //console.log('Create additional temporary : ' +i);
              weekSchedule = new TemporaryScheduleWeekServiceContract();
              weekSchedule.schedule = (Object.assign({}, schedule.weeklySchedule[i-1].schedule));
              schedule.weeklySchedule.push(weekSchedule);
          }
          //console.log('Column set up : '+ i + ' - ' + dateFirst.getTime());
          for (let j=0; j < 7; j++) {
            sdate.setTime(dateFirst.getTime() + (j + 7*i) * oneDay);
            schedule.columnSchedule.push(this.datePipe.transform(sdate, 'MM/dd'));
            schedule.columnName.push(this.datePipe.transform(sdate, 'EEE'));
            schedule.columnDate.push(new Date(sdate));
            //console.log('Saturday : ' + sdate);
          }
        }

        //console.log("Diff : " + schedule.numberWeekDays);
      } catch (e) {
        console.log ('Error on date - Start date : ' + startDate);
        console.log ('Error on date - End date : ' + endDate); 
      }
    }
    return schedule.numberWeekDays;
  }

  numberDaysWeekToArray (schedule: TemporaryScheduleServiceContract){
    let arrayDays = [];
    for (let i = 0; i < schedule.numberWeekDays; i++) {
      arrayDays.push(i);
    }
    return arrayDays;
  }

  /**
   * function ValidationSchedule  
   * @param  
   */
  validationSchedule() {
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
                  //console.log('run job ');
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
                                          this.validateSchedule[0].description + ' has been successfully updated.';
                      this.displayUpdateCompleted = true;
                    }
                  });
              });
          });
   }

  deleteSchedule(): Observable<boolean> {
    return new Observable( observer => {  
      //console.log(' i : ' + i + ' - ' + JSON.stringify(this.validateSchedule[i]));
      if(this.validateSchedule.length === 0) {
        let deleteSchedule  : SupplierContractPlanning;
        for (let i=0; i < this.temporarySchedule.length; i ++) {
          if (this.temporarySchedule[i].temporary) {
            deleteSchedule = new SupplierContractPlanning();
            deleteSchedule.start = this.datePipe.transform(this.temporarySchedule[i].start, 'MM/dd/yyyy');
            deleteSchedule.end = this.datePipe.transform(this.temporarySchedule[i].end, 'MM/dd/yyyy');
            deleteSchedule.suppliercode = this.temporarySchedule[i].weeklySchedule[0].schedule.suppliercode;
            deleteSchedule.description = this.temporarySchedule[i].weeklySchedule[0].schedule.description;
            deleteSchedule.commercialcontract = this.temporarySchedule[i].weeklySchedule[0].schedule.commercialcode;
            deleteSchedule.servicecontract = this.temporarySchedule[i].weeklySchedule[0].schedule.externalcode;
            deleteSchedule.addresschain = this.temporarySchedule[i].weeklySchedule[0].schedule.addresschaincode;
            deleteSchedule.sites = Object.assign([], this.temporarySchedule[i].weeklySchedule[0].schedule.sites);

            this._scheduleService.deleteSchedule(deleteSchedule)
            .subscribe( 
                data => { },
                error => { this._messageService.add({severity:'error', summary:'ERROR Message', detail: error }); },
                () => { //console.log('Deletion request Ok: ');
                        //console.log('Observer deletion completed');
                        observer.complete();
                    }
                );
            }
        }
      }
      else {
        this._scheduleService.deleteSchedule(this.validateSchedule[0])
        .subscribe( 
            data => { },
            error => { this._messageService.add({severity:'error', summary:'ERROR Message', detail: error }); },
            () => { //console.log('Deletion request Ok: ');
                    //console.log('Observer deletion completed');
                    observer.complete();
                }
            );
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
            console.log(' i : ' + i + ' - ' + JSON.stringify(this.validateSchedule[i]));
              this._scheduleService.createSchedule(this.validateSchedule[i])
              .subscribe( 
                  data => { /* console.log('data ' +i ); */ },
                  error => { this._messageService.add({severity:'error', summary:'ERROR Message', detail: error }); },
                  () => { //console.log('Creation request Ok: ' +i )
                        count = count +1;
                        //console.log('count: ' + count + ' / ' +  'this.validateSchedule.length: ' + this.validateSchedule.length);
                        if (count >= this.validateSchedule.length) {
                          observer.complete();
                        }
                      }
                  );
              }
            }
          }
      );
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
   * @param day day activated
   */
  activateDay(schedule : TemporaryScheduleWeekServiceContract, day: number) {
    //console.log('ActivateDay : ' + day);
    //console.log('Monday/Tuesday/Sunday : ' + schedule.schedule.leadTimeMonday + '/' + schedule.schedule.leadTimeTuesday + '/' + schedule.schedule.leadTimeSunday);
    //console.log ('Schedule : ' + JSON.stringify(schedule));
    switch (day) {
        case 0:
          schedule.schedule.collectionTimeSunday1 = schedule.schedule.collectionTimeMonday1;
          schedule.schedule.collectionTimeSunday2 = schedule.schedule.collectionTimeMonday2;
          schedule.schedule.collectionTimeSunday3 = schedule.schedule.collectionTimeMonday3;
          schedule.schedule.deliveryTimeSunday1 = schedule.schedule.deliveryTimeMonday1;
          schedule.schedule.deliveryTimeSunday2 = schedule.schedule.deliveryTimeMonday2;
          schedule.schedule.deliveryTimeSunday3 = schedule.schedule.deliveryTimeMonday3;
          schedule.schedule.leadTimeSunday = schedule.schedule.leadTimeMonday;
          break;
          case 1:
            //console.log('Ticked Monday');
            if (schedule.schedule.leadTimeMonday === null || schedule.schedule.leadTimeMonday === '0') {  
              //console.log('Monday is null');
            if (schedule.schedule.leadTimeSunday !== '0') {  
                schedule.schedule.collectionTimeMonday1 = schedule.schedule.collectionTimeSunday1;
                schedule.schedule.collectionTimeMonday2 = schedule.schedule.collectionTimeSunday2;
                schedule.schedule.collectionTimeMonday3 = schedule.schedule.collectionTimeSunday3;
                schedule.schedule.deliveryTimeMonday1 = schedule.schedule.deliveryTimeSunday1;
                schedule.schedule.deliveryTimeMonday2 = schedule.schedule.deliveryTimeSunday2;
                schedule.schedule.deliveryTimeMonday3 = schedule.schedule.deliveryTimeSunday3;
                schedule.schedule.leadTimeMonday = schedule.schedule.leadTimeSunday;
            }
            else { // copy from Tuesday
              //console.log('Copy from Tuesday');
                schedule.schedule.collectionTimeMonday1 = schedule.schedule.collectionTimeTuesday1;
                schedule.schedule.collectionTimeMonday2 = schedule.schedule.collectionTimeTuesday2;
                schedule.schedule.collectionTimeMonday3 = schedule.schedule.collectionTimeTuesday3;
                schedule.schedule.deliveryTimeMonday1 = schedule.schedule.deliveryTimeTuesday1;
                schedule.schedule.deliveryTimeMonday2 = schedule.schedule.deliveryTimeTuesday2;
                schedule.schedule.deliveryTimeMonday3 = schedule.schedule.deliveryTimeTuesday3;
                schedule.schedule.leadTimeMonday = schedule.schedule.leadTimeTuesday;
              }
            }
          break;
          case 2:
          //console.log('Copy from Tuesday : schedule.schedule.leadTimeTuesday : ' + schedule.schedule.leadTimeTuesday);
          //console.log('Copy from Tuesday : schedule.schedule.leadTimeMonday : ' + schedule.schedule.leadTimeMonday);
            if (schedule.schedule.leadTimeTuesday === null || schedule.schedule.leadTimeTuesday == '0') {  
            if (schedule.schedule.leadTimeMonday != '0') {  
                //console.log('Copying from Monday to Tuesday');
                schedule.schedule.collectionTimeTuesday1 = schedule.schedule.collectionTimeMonday1;
                schedule.schedule.collectionTimeTuesday2 = schedule.schedule.collectionTimeMonday2;
                schedule.schedule.collectionTimeTuesday3 = schedule.schedule.collectionTimeMonday3;
                schedule.schedule.deliveryTimeTuesday1 = schedule.schedule.deliveryTimeMonday1;
                schedule.schedule.deliveryTimeTuesday2 = schedule.schedule.deliveryTimeMonday2;
                schedule.schedule.deliveryTimeTuesday3 = schedule.schedule.deliveryTimeMonday3;
                schedule.schedule.leadTimeTuesday = schedule.schedule.leadTimeMonday;
            }
            else { // copy from Wednesday
                schedule.schedule.collectionTimeTuesday1 = schedule.schedule.collectionTimeWednesday1;
                schedule.schedule.collectionTimeTuesday2 = schedule.schedule.collectionTimeWednesday2;
                schedule.schedule.collectionTimeTuesday3 = schedule.schedule.collectionTimeWednesday3;
                schedule.schedule.deliveryTimeTuesday1 = schedule.schedule.deliveryTimeWednesday1;
                schedule.schedule.deliveryTimeTuesday2 = schedule.schedule.deliveryTimeWednesday2;
                schedule.schedule.deliveryTimeTuesday3 = schedule.schedule.deliveryTimeWednesday3;
                schedule.schedule.leadTimeTuesday = schedule.schedule.leadTimeWednesday;
              }
            }
          break;
          case 3:
            if (schedule.schedule.leadTimeWednesday === null || schedule.schedule.leadTimeWednesday == '0') {  
            if (schedule.schedule.leadTimeTuesday != '0') {  
                schedule.schedule.collectionTimeWednesday1 = schedule.schedule.collectionTimeTuesday1;
                schedule.schedule.collectionTimeWednesday2 = schedule.schedule.collectionTimeTuesday2;
                schedule.schedule.collectionTimeWednesday3 = schedule.schedule.collectionTimeTuesday3;
                schedule.schedule.deliveryTimeWednesday1 = schedule.schedule.deliveryTimeTuesday1;
                schedule.schedule.deliveryTimeWednesday2 = schedule.schedule.deliveryTimeTuesday2;
                schedule.schedule.deliveryTimeWednesday3 = schedule.schedule.deliveryTimeTuesday3;
                schedule.schedule.leadTimeWednesday = schedule.schedule.leadTimeTuesday;
            }
            else { // copy from Thursday
                schedule.schedule.collectionTimeWednesday1 = schedule.schedule.collectionTimeThursday1;
                schedule.schedule.collectionTimeWednesday2 = schedule.schedule.collectionTimeThursday2;
                schedule.schedule.collectionTimeWednesday3 = schedule.schedule.collectionTimeThursday3;
                schedule.schedule.deliveryTimeWednesday1 = schedule.schedule.deliveryTimeThursday1;
                schedule.schedule.deliveryTimeWednesday2 = schedule.schedule.deliveryTimeThursday2;
                schedule.schedule.deliveryTimeWednesday3 = schedule.schedule.deliveryTimeThursday3;
                schedule.schedule.leadTimeWednesday = schedule.schedule.leadTimeThursday;
              }
            }
          break;
          case 4:
            if (schedule.schedule.leadTimeThursday === null || schedule.schedule.leadTimeThursday == '0') {  
            if (schedule.schedule.leadTimeWednesday != '0') {  
                schedule.schedule.collectionTimeThursday1 = schedule.schedule.collectionTimeWednesday1;
                schedule.schedule.collectionTimeThursday2 = schedule.schedule.collectionTimeWednesday2;
                schedule.schedule.collectionTimeThursday3 = schedule.schedule.collectionTimeWednesday3;
                schedule.schedule.deliveryTimeThursday1 = schedule.schedule.deliveryTimeWednesday1;
                schedule.schedule.deliveryTimeThursday2 = schedule.schedule.deliveryTimeWednesday2;
                schedule.schedule.deliveryTimeThursday3 = schedule.schedule.deliveryTimeWednesday3;
                schedule.schedule.leadTimeThursday = schedule.schedule.leadTimeWednesday;
            }
            else { // copy from Friday
                schedule.schedule.collectionTimeThursday1 = schedule.schedule.collectionTimeFriday1;
                schedule.schedule.collectionTimeThursday2 = schedule.schedule.collectionTimeFriday2;
                schedule.schedule.collectionTimeThursday3 = schedule.schedule.collectionTimeFriday3;
                schedule.schedule.deliveryTimeThursday1 = schedule.schedule.deliveryTimeFriday1;
                schedule.schedule.deliveryTimeThursday2 = schedule.schedule.deliveryTimeFriday2;
                schedule.schedule.deliveryTimeThursday3 = schedule.schedule.deliveryTimeFriday3;
                schedule.schedule.leadTimeThursday = schedule.schedule.leadTimeFriday;
              }
            }
          break;
          case 5:
            if (schedule.schedule.leadTimeFriday === null || schedule.schedule.leadTimeFriday == '0') {  
            if (schedule.schedule.leadTimeThursday != '0') {  
                schedule.schedule.collectionTimeFriday1 = schedule.schedule.collectionTimeThursday1;
                schedule.schedule.collectionTimeFriday2 = schedule.schedule.collectionTimeThursday2;
                schedule.schedule.collectionTimeFriday3 = schedule.schedule.collectionTimeThursday3;
                schedule.schedule.deliveryTimeFriday1 = schedule.schedule.deliveryTimeThursday1;
                schedule.schedule.deliveryTimeFriday2 = schedule.schedule.deliveryTimeThursday2;
                schedule.schedule.deliveryTimeFriday3 = schedule.schedule.deliveryTimeThursday3;
                schedule.schedule.leadTimeFriday = schedule.schedule.leadTimeThursday;
            }
            else { // copy from Saturday
                schedule.schedule.collectionTimeFriday1 = schedule.schedule.collectionTimeSaturday1;
                schedule.schedule.collectionTimeFriday2 = schedule.schedule.collectionTimeSaturday2;
                schedule.schedule.collectionTimeFriday3 = schedule.schedule.collectionTimeSaturday3;
                schedule.schedule.deliveryTimeFriday1 = schedule.schedule.deliveryTimeSaturday1;
                schedule.schedule.deliveryTimeFriday2 = schedule.schedule.deliveryTimeSaturday2;
                schedule.schedule.deliveryTimeFriday3 = schedule.schedule.deliveryTimeSaturday3;
                schedule.schedule.leadTimeFriday = schedule.schedule.leadTimeSaturday;
              }
            }
          break;
          case 6:
            if (schedule.schedule.leadTimeSaturday === null || schedule.schedule.leadTimeSaturday == '0') {  
            if (schedule.schedule.leadTimeFriday != '0') {  
                schedule.schedule.collectionTimeSaturday1 = schedule.schedule.collectionTimeFriday1;
                schedule.schedule.collectionTimeSaturday2 = schedule.schedule.collectionTimeFriday2;
                schedule.schedule.collectionTimeSaturday3 = schedule.schedule.collectionTimeFriday3;
                schedule.schedule.deliveryTimeSaturday1 = schedule.schedule.deliveryTimeFriday1;
                schedule.schedule.deliveryTimeSaturday2 = schedule.schedule.deliveryTimeFriday2;
                schedule.schedule.deliveryTimeSaturday3 = schedule.schedule.deliveryTimeFriday3;
                schedule.schedule.leadTimeSaturday = schedule.schedule.leadTimeFriday;
            }
            }
          break;
        default:
        }
  }

  isNotTempPeriod(day,indice,i) {
    let dateToCheck = this.datePipe.transform(new Date(new Date(this.temporarySchedule[indice].columnDate[day +7*i])
                            .setDate(this.temporarySchedule[indice].columnDate[day +7*i].getDate()) 
                            + day + 7*i), 'yyyyMMdd');
    let compareStart = this.datePipe.transform(this.temporarySchedule[indice].start,'yyyyMMdd');
    let compareEnd = this.datePipe.transform(this.temporarySchedule[indice].end,'yyyyMMdd');
    //console.log('day,indice,i : ' + day + ',' + indice + ',' + i);
    //console.log('dateToCheck : ' + dateToCheck);
    //console.log('this.temporarySchedule[indice].start : ' + compareStart);
    //console.log('this.temporarySchedule[indice].end : ' + compareEnd);
    //console.log('isNotTempPeriod : ' + (compareStart > dateToCheck || compareEnd < dateToCheck));
    return compareStart > dateToCheck || compareEnd < dateToCheck;
  }
  
  trackByIndex(index, weeklySchedule) {
    this.trackIndex = this.trackIndex + 1;
    return this.trackIndex;
  }
}

export class TemporaryScheduleServiceContract {
  public temporary: boolean = false;
  public numberWeekDays: Number = 1; // Number of days between Start and End schedule
  public numberWeekDaysArray: Array<1>; // Number of days between Start and End schedule
  public start: Date;
  public end: Date;
  public weeklySchedule: TemporaryScheduleWeekServiceContract[] =[];
  public columnSchedule = [];
  public columnName = [];
  public columnDate = [];
  public widthTable = 700;
}

export class TemporaryScheduleWeekServiceContract {
  public schedule: SupplierContract;
  public scheduleFouplan: SupplierContractPlanning; 
}

export class SimulateScheduleServiceContract {
  // element below needed for the Calendar widget
  public id?;
  public title?;
  public start?;
  public end?;
  public color?;
  public allDay?: boolean = true;
}

