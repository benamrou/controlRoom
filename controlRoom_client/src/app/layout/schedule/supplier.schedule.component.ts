import {Component, ViewEncapsulation} from '@angular/core';
import { SupplierScheduleService, Supplier, SupplierSchedule, SupplierPlanning } from '../../shared/services/index';
import { SelectItem, Chips, Message, DataGrid, Schedule } from '../../shared/components/index';
import {DatePipe} from '@angular/common';

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
    providers: [SupplierScheduleService],
    styleUrls: ['./supplier.schedule.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class SupplierScheduleComponent {
   
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
   widthTable:number=1100; // table width

   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries

  // Search action
   searchCode: string = '';
   msgs: Message[] = [];

   // Temporary schedule
   temporarySchedule: TemporarySchedule [] = [];
   simulateSchedule: SimulateSchedule [] = [];

   // Calculation Schedule


   colorTemporaryOrder : any = ['#FF8C00','#FF4500','#FF6347','#FF7F50','#FFA500','#DB7093','#FF69B4'];
   colorTemporaryDelivery : any = ['#00FF00', '#00FF00', '#00FF00', '#00FF00', '#00FF00', '#00FF00', '#00FF00'];
   colorPermanentOrder : any = ['#FFFACD', '#FFD700', '#F0E68C', '#FFDAB9', '#F0E68C', '#FFDAB9', '#FFFFE0'];
   colorPermanentDelivery : any = ['#00FF00', '#00FF00', '#00FF00', '#00FF00', '#00FF00', '#00FF00', '#00FF00'];


  constructor(private _scheduleService: SupplierScheduleService, private datePipe: DatePipe) {
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


  }

  search() {
    //this.searchCode = searchCode;
    this.razSearch();
    this.msgs.push({severity:'info', summary:'Info Message', detail: 'Looking for the supplier schedule : ' + JSON.stringify(this.searchCode)});
    this._scheduleService.getSupplierScheduleInfo(this.searchCode)
            .subscribe( 
                data => { this.searchResult = data; // put the data returned from the server in our variable
                //console.log(JSON.stringify(this.searchResult));  
              },
                error => {
                      // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                      this.msgs.push({severity:'error', summary:'ERROR Message', detail: error });
                },
                () => {this.msgs.push({severity:'warn', summary:'Info Message', detail: 'Retrieved ' + 
                                     this.searchResult.length + ' reference(s).'});
                }
            );
  }

  razSearch () {
    this.searchResult = null;
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
    let copyTemporarySchedule, weekSchedule, weekSchedule2;
    let datePipe = new DatePipe('en-US');
    this.temporarySchedule = [];
    this.simulateSchedule = [];
    this.simulateReviewSchedule = false;
      //console.log("Event: " + JSON.stringify(event));
     for (let i=0; i < event.data.schedules.length; i ++) {
        copyTemporarySchedule = new TemporarySchedule();
        weekSchedule = new TemporaryScheduleWeek();
        weekSchedule2 = new TemporaryScheduleWeek();
        weekSchedule.schedule = (Object.assign({}, event.data.schedules[i]));
        weekSchedule2.schedule = (Object.assign({}, event.data.schedules[i]));
        copyTemporarySchedule.start = datePipe.transform(Date.now(), 'yyyy-MM-dd');
        copyTemporarySchedule.end = datePipe.transform(Date.now(), 'yyyy-MM-dd');
        weekSchedule.schedule.start = datePipe.transform(Date.now(), 'yyyy-MM-dd');
        weekSchedule.schedule.end = datePipe.transform(Date.now(), 'yyyy-MM-dd');
        weekSchedule2.schedule.start = datePipe.transform(Date.now(), 'yyyy-MM-dd');
        weekSchedule2.schedule.end = datePipe.transform(Date.now(), 'yyyy-MM-dd');
        copyTemporarySchedule.weeklySchedule.push(Object.assign({}, weekSchedule)); // Push 1st week
        copyTemporarySchedule.weeklySchedule.push(Object.assign({}, weekSchedule2)); // Push 2nd week
        // Need to refresh timline before pushing
        this.refreshTimeline(copyTemporarySchedule);

        this.temporarySchedule.push(Object.assign({}, copyTemporarySchedule));
        console.log("TemporarySchedule " + i + '  => ' + JSON.stringify(this.temporarySchedule));
     }
    //this.processReviewSchedule = true;
  }

  reviewSchedule() {
    this.processReviewSchedule = true;
  }

  simulationSchedule() {
    this.simulateSchedule = [];    
    this.simulationPermanentScheduleBefore();
    this.simulationTemporarySchedule();
    this.simulationPermanentScheduleAfter();
    this.createPlanning();
  }

  simulationPermanentScheduleBefore() {
    let oneDay = 1000 * 60 * 60 * 24 ;
    for (let i=0; i < this.selectedElement.schedules.length; i ++) {
        let weekday;
        let startDate = new Date(Date.now());
        startDate.setDate(startDate.getDate()-20);
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
        while ( j<40 && (this.getMinDateTemporarySchedule(endDate) > timeline) && this.temporarySchedule[i].temporary) {
        timeline.setTime(timeline.getTime()+ oneDay);
        //console.log('Min Temporary : ' + this.getMinDateTemporarySchedule(endDate));
        //console.log('Timeline / j : ' + timeline + ' / ' + j);
        //console.log('Test date: ' + (this.getMinDateTemporarySchedule(endDate) > timeline));
          switch ((weekday + j)%7) {
          case 0:
            if (this.selectedElement.schedules[i].orderMonday) {       
              //console.log ( "Monday !");
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                    j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorPermanentOrder[i])));
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                      parseInt(this.selectedElement.schedules[i].leadTimeMonday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode,
                      this.colorPermanentDelivery[i])));
            }
            break;
          case 1:
            if (this.selectedElement.schedules[i].orderTuesday) {   
              //console.log ( "Tuesday !");
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                    j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorPermanentOrder[i])));
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                      parseInt(this.selectedElement.schedules[i].leadTimeTuesday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode, 
                      this.colorPermanentDelivery[i])));
            }
            break;
          case 2:
            if (this.selectedElement.schedules[i].orderWednesday) {       
              //console.log ( "Wednesday !");
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                    j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorPermanentOrder[i])));
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                      parseInt(this.selectedElement.schedules[i].leadTimeWednesday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode, 
                      this.colorPermanentDelivery[i])));
            }
            break;
          case 3:
            if (this.selectedElement.schedules[i].orderThursday) {       
              //console.log ( "Thursday !");
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                    j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorPermanentOrder[i])));
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                      parseInt(this.selectedElement.schedules[i].leadTimeThursday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode, 
                      this.colorPermanentDelivery[i])));
            }
            break;
          case 4:
            if (this.selectedElement.schedules[i].orderFriday) {       
              //console.log ( "Friday !");
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                    j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorPermanentOrder[i])));
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                      parseInt(this.selectedElement.schedules[i].leadTimeFriday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode, 
                      this.colorPermanentDelivery[i])));
            }
            break;
          case 5:
            if (this.selectedElement.schedules[i].orderSaturday) {    
              //console.log ( "Saturday !");
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                    j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorPermanentOrder[i])));
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                      parseInt(this.selectedElement.schedules[i].leadTimeSaturday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode, 
                      this.colorPermanentDelivery[i])));
            }
            break;
          case 6:
            if (this.selectedElement.schedules[i].orderSunday) {       
              //console.log ( "Sunday !");
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                    j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorPermanentOrder[i])));
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                      parseInt(this.selectedElement.schedules[i].leadTimeSunday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode, 
                      this.colorPermanentDelivery[i])));
            }
            break;
          default:
            weekday = 0;
          }
          j++;
      }
    }
    this.simulateReviewSchedule = true;
  }

  simulationTemporarySchedule () {
    let oneDay = 1000 * 60 * 60 * 24 ;
    for (let i=0; i < this.temporarySchedule.length; i ++) {
      for (let k=0; k < this.temporarySchedule[i].numberWeekDays; k ++) {
        if (this.temporarySchedule[i].temporary) {
        let weekday;
        let startDate = new Date(this.temporarySchedule[i].weeklySchedule[k].schedule.start);
        let endDate = new Date(this.temporarySchedule[i].weeklySchedule[k].schedule.end);
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
        //console.log('Weekday : ' + weekday);
        let j =0;
        let timeline = new Date(startDate);
        while (  j < 6 && (endDate.getTime() >= timeline.getTime())) {
          timeline.setTime(timeline.getTime() +  oneDay);
          startDate = new Date(this.temporarySchedule[i].weeklySchedule[k].schedule.start);
          switch ((weekday + j)%7) {
          case 0:
            if (this.temporarySchedule[i].weeklySchedule[k].schedule.orderMonday) {       
              //console.log ( "Monday !");
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                    j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorTemporaryOrder[i])));
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                      parseInt(this.temporarySchedule[i].weeklySchedule[k].schedule.leadTimeMonday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode,
                      this.colorTemporaryDelivery[i])));
            }
            break;
          case 1:
            if (this.temporarySchedule[i].weeklySchedule[k].schedule.orderTuesday) {   
              //console.log ( "Tuesday !");
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                    j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorTemporaryOrder[i])));
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                      parseInt(this.temporarySchedule[i].weeklySchedule[k].schedule.leadTimeTuesday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode,
                      this.colorTemporaryDelivery[i])));
            }
            break;
          case 2:
            if (this.temporarySchedule[i].weeklySchedule[k].schedule.orderWednesday) {       
              //console.log ( "Wednesday ! Schedule # " + i);
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                    j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorTemporaryOrder[i])));
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                      parseInt(this.temporarySchedule[i].weeklySchedule[k].schedule.leadTimeWednesday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode,
                      this.colorTemporaryDelivery[i])));
            }
            break;
          case 3:
            if (this.temporarySchedule[i].weeklySchedule[k].schedule.orderThursday) {       
              //console.log ( "Thursday !");
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                    j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorTemporaryOrder[i])));
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                      parseInt(this.temporarySchedule[i].weeklySchedule[k].schedule.leadTimeThursday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode,
                      this.colorTemporaryDelivery[i])));
            }
            break;
          case 4:
            if (this.temporarySchedule[i].weeklySchedule[k].schedule.orderFriday) {       
              //console.log ( "Friday !");
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                    j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorTemporaryOrder[i])));
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                      parseInt(this.temporarySchedule[i].weeklySchedule[k].schedule.leadTimeFriday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode, 
                      this.colorTemporaryDelivery[i])));
            }
            break;
          case 5:
            if (this.temporarySchedule[i].weeklySchedule[k].schedule.orderSaturday) {    
              //console.log ( "Saturday !");
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                    j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorTemporaryOrder[i])));
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                      parseInt(this.temporarySchedule[i].weeklySchedule[k].schedule.leadTimeSaturday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode, 
                      this.colorTemporaryDelivery[i])));
            }
            break;
          case 6:
            if (this.temporarySchedule[i].weeklySchedule[k].schedule.orderSunday) {       
              //console.log ( "Sunday !");
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                    j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorTemporaryOrder[i])));
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                      parseInt(this.temporarySchedule[i].weeklySchedule[k].schedule.leadTimeSunday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode, 
                      this.colorTemporaryDelivery[i])));
            }
            break;
          default:
            weekday = 0;
            }
            j++;
          }
        }
      }
    }
    this.simulateReviewSchedule = true;
  }

  simulationPermanentScheduleAfter() {
    let oneDay = 1000 * 60 * 60 * 24 ;
    for (let i=0; i < this.selectedElement.schedules.length; i ++) {
        let weekday;
        let startDate = new Date(this.temporarySchedule[i].weeklySchedule[this.temporarySchedule[i].numberWeekDaysArray.length-1].schedule.end);
        startDate.setDate(startDate.getDate());
        let endDate = new Date();
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
        while ( j<40 && (endDate > timeline) && this.temporarySchedule[i].temporary) {
        timeline.setTime(timeline.getTime()+ oneDay);
        //console.log('Min Temporary : ' + this.getMinDateTemporarySchedule(endDate));
        //console.log('Timeline / j : ' + timeline + ' / ' + j);
        //console.log('Test date: ' + (this.getMinDateTemporarySchedule(endDate) > timeline));
          switch ((weekday + j)%7) {
          case 0:
            if (this.selectedElement.schedules[i].orderMonday) {       
              //console.log ( "Monday !");
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                    j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorPermanentOrder[i])));
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                      parseInt(this.selectedElement.schedules[i].leadTimeMonday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode,
                      this.colorPermanentDelivery[i])));
            }
            break;
          case 1:
            if (this.selectedElement.schedules[i].orderTuesday) {   
              //console.log ( "Tuesday !");
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                    j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorPermanentOrder[i])));
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                      parseInt(this.selectedElement.schedules[i].leadTimeTuesday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode, 
                      this.colorPermanentDelivery[i])));
            }
            break;
          case 2:
            if (this.selectedElement.schedules[i].orderWednesday) {       
              //console.log ( "Wednesday !");
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                    j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorPermanentOrder[i])));
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                      parseInt(this.selectedElement.schedules[i].leadTimeWednesday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode, 
                      this.colorPermanentDelivery[i])));
            }
            break;
          case 3:
            if (this.selectedElement.schedules[i].orderThursday) {       
              //console.log ( "Thursday !");
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                    j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorPermanentOrder[i])));
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                      parseInt(this.selectedElement.schedules[i].leadTimeThursday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode, 
                      this.colorPermanentDelivery[i])));
            }
            break;
          case 4:
            if (this.selectedElement.schedules[i].orderFriday) {       
              //console.log ( "Friday !");
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                    j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorPermanentOrder[i])));
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                      parseInt(this.selectedElement.schedules[i].leadTimeFriday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode, 
                      this.colorPermanentDelivery[i])));
            }
            break;
          case 5:
            if (this.selectedElement.schedules[i].orderSaturday) {    
              //console.log ( "Saturday !");
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                    j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorPermanentOrder[i])));
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                      parseInt(this.selectedElement.schedules[i].leadTimeSaturday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode, 
                      this.colorPermanentDelivery[i])));
            }
            break;
          case 6:
            if (this.selectedElement.schedules[i].orderSunday) {       
              //console.log ( "Sunday !");
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                    j, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorPermanentOrder[i])));
              this.simulateSchedule.push(Object.assign({}, 
                  this.transformSimulateScheduleDate(i, startDate, 
                      parseInt(this.selectedElement.schedules[i].leadTimeSunday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode, 
                      this.colorPermanentDelivery[i])));
            }
            break;
          default:
            weekday = 0;
          }
          j++;
      }
    }
    this.simulateReviewSchedule = true;
  }

  getMinDateTemporarySchedule(minDate: Date) {
    for (let i =0; i < this.temporarySchedule.length; i++) {
        for (let k=0; k < this.temporarySchedule[i].weeklySchedule.length; k ++) {
        if (this.temporarySchedule[i].temporary) {
            let startDate = new Date(this.temporarySchedule[i].weeklySchedule[k].schedule.start);
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
  createTemporarySchedule (schedule: TemporarySchedule) {
    schedule.temporary = true;
  }

  /**
   * function undoTemporarySchedule 
   * When User decides to undo/remove a temporary schedule creation.
   * @param schedule 
   */
  undoTemporarySchedule (schedule: TemporarySchedule) {
    schedule.temporary = false;
  }

  /**
   * function createTemporarySchedule 
   * When User decides to create a temporary schedule creation.
   * @param schedule 
   */
  isScheduleToChange (schedule: TemporarySchedule) {
    return schedule.temporary;
  }

  /**
   * function transformSimulateScheduleDate 
   * @param scheduleDate 
   */
  transformSimulateScheduleDate (id: number, scheduleDate: Date, days: number, title: String, color: String) :SimulateSchedule {
    let createSimulateSchedule = new SimulateSchedule();
    createSimulateSchedule.start = new Date(scheduleDate);
    createSimulateSchedule.end = new Date(scheduleDate);
    createSimulateSchedule.id = id;
    createSimulateSchedule.title = title;
    createSimulateSchedule.color = color;
    createSimulateSchedule.start.setDate(createSimulateSchedule.start.getDate() + days);
    createSimulateSchedule.end.setDate(createSimulateSchedule.end.getDate() + days);
    return createSimulateSchedule;
  }

  /**
   * Function adjusting the display for the timeline week (max to 2 weeks)
   * @param schedule 
   */
  refreshTimeline (schedule: TemporarySchedule) : Number{
    let startDate, endDate, startDateWeek1, startDateWeek2, endDateWeek1, endDateWeek2;
    let oneDay = 1000 * 60 * 60 * 24 ;
    let oneWeek = 1000 * 60 * 60 * 24 * 7;
    let datePipe = new DatePipe('en-US');
    console.log('Refresh : ' + JSON.stringify(schedule));
    try {
      startDate = new Date(schedule.start);
      endDate = new Date(schedule.end);

      schedule.numberWeekDays = Math.ceil(Math.abs((startDate.getTime() - endDate.getTime()))/oneWeek);
      if (schedule.numberWeekDays < 2) { schedule.numberWeekDays = 1; this.widthTable = 1100; }
      if (schedule.numberWeekDays >=  2) { schedule.numberWeekDays = 2; this.widthTable = 1800; } // Restrict to two weeks
      schedule.numberWeekDaysArray= this.numberDaysWeekToArray(schedule);
      
      let first = startDate; //tartDate.getDate() - startDate.getDay(); // First day is the day of the month - the day of the week
      let dateFirst = new Date(first.setDate(startDate.getDate() - startDate.getDay()));
      startDateWeek1 = new Date(first.setDate(startDate.getDate() - startDate.getDay()));
      endDateWeek1 = new Date(first.setDate(startDate.getDate() - startDate.getDay()));
      startDateWeek2 = new Date(first.setDate(startDate.getDate() - startDate.getDay()));
      endDateWeek2 = new Date(first.setDate(startDate.getDate() - startDate.getDay()));
      
      startDateWeek1.setDate(startDateWeek1.getDate());
      endDateWeek1.setDate(endDateWeek1.getDate() + 6);
      startDateWeek2.setDate(startDateWeek2.getDate() + 7);
      endDateWeek2.setDate(endDateWeek2.getDate() + 13);

      schedule.weeklySchedule[0].schedule.start = datePipe.transform(startDateWeek1, 'yyyy-MM-dd');
      schedule.weeklySchedule[0].schedule.end = datePipe.transform(endDateWeek1, 'yyyy-MM-dd');
      schedule.start = datePipe.transform(startDateWeek1, 'yyyy-MM-dd');
      schedule.end = datePipe.transform(endDateWeek1, 'yyyy-MM-dd');
      if (schedule.numberWeekDays === 2) {
        schedule.weeklySchedule[1].schedule.start = datePipe.transform(startDateWeek2, 'yyyy-MM-dd');
        schedule.weeklySchedule[1].schedule.end = datePipe.transform(endDateWeek2, 'yyyy-MM-dd');
        schedule.end = datePipe.transform(endDateWeek2, 'yyyy-MM-dd');
      }

      let sdate = new Date(dateFirst);
      schedule.columnSchedule = [];
      
      for (let i = 0; i < schedule.numberWeekDays; i++) {
        sdate.setTime(dateFirst.getTime() + (0 + 7*i) * oneDay);
        schedule.columnSchedule.push(datePipe.transform(sdate, 'MM/dd'));
        sdate.setTime(dateFirst.getTime() + (1 + 7*i) * oneDay);
        schedule.columnSchedule.push(datePipe.transform(sdate, 'MM/dd'));
        sdate.setTime(dateFirst.getTime() + (2 + 7*i) * oneDay);
        schedule.columnSchedule.push(datePipe.transform(sdate, 'MM/dd'));
        sdate.setTime(dateFirst.getTime() + (3 + 7*i) * oneDay);
        schedule.columnSchedule.push(datePipe.transform(sdate, 'MM/dd'));
        sdate.setTime(dateFirst.getTime() + (4 + 7*i) * oneDay);
        schedule.columnSchedule.push(datePipe.transform(sdate, 'MM/dd'));
        sdate.setTime(dateFirst.getTime() + (5 + 7*i) * oneDay);
        schedule.columnSchedule.push(datePipe.transform(sdate, 'MM/dd'));
        sdate.setTime(dateFirst.getTime() + (6 + 7*i) * oneDay);
        schedule.columnSchedule.push(datePipe.transform(sdate, 'MM/dd'));
      console.log('Saturday : ' + sdate);
      }
      //console.log("Diff : " + schedule.numberWeekDays);
    } catch (e) {
      console.log ('Error on date - Start date : ' + startDate);
      console.log ('Error on date - End date : ' + endDate); 
    }
    return schedule.numberWeekDays;
  }

  numberDaysWeekToArray (schedule: TemporarySchedule){
    let arrayDays = [];
    for (let i = 0; i < schedule.numberWeekDays; i++) {
      arrayDays.push(i);
    }
    return arrayDays;
  }

  /**
   * function createPlanning 
   * @param  
   */
  createPlanning() {

  }

  /**
   * ActivateDay copy from previous/after day information to the new day
   * @param schedule schedule
   * @param day day activated
   */
  activateDay(schedule : TemporaryScheduleWeek, day: number) {
    console.log('ActivateDay : ' + day);
    //console.log('Monday/Tuesday/Sunday : ' + schedule.schedule.leadTimeMonday + '/' + schedule.schedule.leadTimeTuesday + '/' + schedule.schedule.leadTimeSunday);
    console.log ('Schedule : ' + JSON.stringify(schedule));
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
            console.log('Ticked Monday');
            if (schedule.schedule.leadTimeMonday === null) {  
              console.log('Monday is null');
            if (schedule.schedule.leadTimeSunday !== null) {  
                schedule.schedule.collectionTimeMonday1 = schedule.schedule.collectionTimeSunday1;
                schedule.schedule.collectionTimeMonday2 = schedule.schedule.collectionTimeSunday2;
                schedule.schedule.collectionTimeMonday3 = schedule.schedule.collectionTimeSunday3;
                schedule.schedule.deliveryTimeMonday1 = schedule.schedule.deliveryTimeSunday1;
                schedule.schedule.deliveryTimeMonday2 = schedule.schedule.deliveryTimeSunday2;
                schedule.schedule.deliveryTimeMonday3 = schedule.schedule.deliveryTimeSunday3;
                schedule.schedule.leadTimeMonday = schedule.schedule.leadTimeSunday;
            }
            else { // copy from Tuesday
              console.log('Copy from Tuesday');
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
            if (schedule.schedule.leadTimeTuesday === null) {  
            if (schedule.schedule.leadTimeMonday !== null) {  
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
            if (schedule.schedule.leadTimeWednesday === null) {  
            if (schedule.schedule.leadTimeTuesday !== null) {  
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
            if (schedule.schedule.leadTimeThursday === null) {  
            if (schedule.schedule.leadTimeWednesday !== null) {  
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
            if (schedule.schedule.leadTimeFriday === null) {  
            if (schedule.schedule.leadTimeThursday !== null) {  
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
            if (schedule.schedule.leadTimeSaturday === null) {  
            if (schedule.schedule.leadTimeFriday !== null) {  
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

  trackByIndex(index, weeklySchedule) {
    this.trackIndex = this.trackIndex + 1;
    return this.trackIndex;
  }
}

export class TemporarySchedule {
  public temporary: boolean = false;
  public numberWeekDays: Number = 1; // Number of days between Start and End schedule
  public numberWeekDaysArray: Array<1>; // Number of days between Start and End schedule
  public start;
  public end;
  public weeklySchedule: TemporaryScheduleWeek[] =[];
  public columnSchedule = [];
}

export class TemporaryScheduleWeek {
  public schedule: SupplierSchedule;
  public scheduleFouplan: SupplierPlanning; 
}

export class SimulateSchedule {
  // element below needed for the Calendar widget
  public id?;
  public title?;
  public start: Date = new Date();
  public end: Date = new Date();
  public color?;
  public allDay: boolean = true;
}

