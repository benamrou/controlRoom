import {Component, ViewEncapsulation, ViewChild} from '@angular/core';
import { SupplierScheduleService, Supplier, SupplierSchedule, SupplierPlanning } from '../../shared/services/index';
import { SelectItem, Chips, Message, DataGrid, Schedule, FullCalendar } from '../../shared/components/index';
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
   temporarySchedule: TemporarySchedule [] = [];
   simulateSchedule: SimulateSchedule [] = [];

   // Calculation Schedule
   colorTemporaryOrder : any = ['#FF8C00','#FF4500','#FF6347','#FF7F50','#FFA500','#DB7093','#FF69B4'];
   colorTemporaryDelivery : any = ['#00FF00', '#00FF00', '#00FF00', '#00FF00', '#00FF00', '#00FF00', '#00FF00'];
   colorPermanentOrder : any = ['#FFFACD', '#FFD700', '#F0E68C', '#FFDAB9', '#F0E68C', '#FFDAB9', '#FFFFE0'];
   colorPermanentDelivery : any = ['#00FF00', '#00FF00', '#00FF00', '#00FF00', '#00FF00', '#00FF00', '#00FF00'];

  // Calendar
  dateNow: Date;
  day: any = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  constructor(private _scheduleService: SupplierScheduleService, private datePipe: DatePipe) {
    datePipe     = new DatePipe('en-US');
    this.dateNow = new Date();

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
    let copyRegularSchedule, weekSchedule, nowDate, currentWeekDay, startDateWeek, endDateWeek, lessDays;
    this.temporarySchedule = [];
    this.simulateSchedule = [];
    this.simulateReviewSchedule = false;
    // Initialize temporary schedule as the regular schedule with potentially one temporary week
    for (let i=0; i < event.data.schedules.length; i ++) {
      copyRegularSchedule = new TemporarySchedule();
      weekSchedule = new TemporaryScheduleWeek();
      //weekSchedule2 = new TemporaryScheduleWeek();
      weekSchedule.schedule = (Object.assign({}, event.data.schedules[i]));

      /* This section enable the start and end date of the potential Sunday to Saturday  */
      nowDate = new Date(Date.now());
      currentWeekDay = nowDate.getDay();
      lessDays = currentWeekDay == 0 ? 7 : currentWeekDay ;
      startDateWeek = new Date(new Date(nowDate).setDate(nowDate.getDate() - lessDays));
      endDateWeek = new Date(new Date(startDateWeek).setDate(startDateWeek.getDate() + 6));
      
      copyRegularSchedule.start = startDateWeek; //this.datePipe.transform(startDateWeek, 'yyyy-MM-dd');
      copyRegularSchedule.end = endDateWeek; //this.datePipe.transform(endDateWeek, 'yyyy-MM-dd');
      copyRegularSchedule.temporary = false;
      weekSchedule.schedule.start = startDateWeek; //this.datePipe.transform(startDateWeek, 'yyyy-MM-dd');
      weekSchedule.schedule.end = endDateWeek; //this.datePipe.transform(endDateWeek, 'yyyy-MM-dd');
      copyRegularSchedule.weeklySchedule.push(Object.assign({}, weekSchedule)); // Push one week
      // Need to refresh timline before pushing - Calculate the column day number.
      this.refreshTimeline(copyRegularSchedule);
      this.temporarySchedule.push(Object.assign({}, copyRegularSchedule));
      console.log("TemporarySchedule " + i + '  => ' + JSON.stringify(this.temporarySchedule));
     }
    //this.processReviewSchedule = true;
  }

  reviewSchedule() {
    this.processReviewSchedule = true;
  }

  simulationSchedule() {
    this.simulateSchedule = [];    
    //this.simulationPermanentScheduleBefore();
    this.simulationTemporarySchedule();
    //this.simulationPermanentScheduleAfter();

    console.log('Simulate:' + JSON.stringify(this.simulateSchedule));

    //this.createPlanning();
  }

  simulationPermanentScheduleBefore() {
    let oneDay = 1000 * 60 * 60 * 24 ;
    let backDay = 20;
    let day;
    console.log('simulationPermanentScheduleBefore : ' +JSON.stringify(this.selectedElement.schedules));
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
        console.log('minSchedule : ' + minSchedule);
        console.log('Temporary : ' + JSON.stringify(this.temporarySchedule));
        //console.log('endDate : ' + endDate);
        //console.log('Min Temporary : ' + this.getMinDateTemporarySchedule(endDate));
        //console.log('Timeline / j : ' + timeline + ' / ' + j);
        while ( minSchedule > timeline) {
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
    let oneDay = 1000 * 60 * 60 * 24 ;
    for (let i=0; i < this.temporarySchedule.length; i ++) {
      if (this.temporarySchedule[i].temporary) {
        console.log('simulationTemporarySchedule : ' + JSON.stringify(this.temporarySchedule[i]));
        for (let k=0; k < this.temporarySchedule[i].numberWeekDays; k ++) {
          if (this.temporarySchedule[i].temporary && this.temporarySchedule[i].start >  this.dateNow) {
          let weekday;
          let startDate = new Date(this.temporarySchedule[i].start);
          let endDate = new Date(this.temporarySchedule[i].end);
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
            case this.day[5]: // Saturdayr
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
          console.log('Timeline : ' + timeline);
          console.log('k : ' + k);
          console.log('weekday : ' + weekday);
          while (  j < 6 && (endDate.getTime() >= timeline.getTime())) {
            timeline.setTime(timeline.getTime() +  oneDay);
            startDate = new Date(this.temporarySchedule[i].start);
            switch ((weekday + j)%7) {
            case 0:
              if (this.temporarySchedule[i].weeklySchedule[k].schedule.orderMonday) {       
                //console.log ( "Monday !");
                this.simulateSchedule = [...this.simulateSchedule,Object.assign({}, 
                    this.transformSimulateScheduleDate(i, startDate, 
                      j + 7*k, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorTemporaryOrder[i]))];
                this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                    this.transformSimulateScheduleDate(i, startDate, 
                        parseInt(this.temporarySchedule[i].weeklySchedule[k].schedule.leadTimeMonday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode,
                        this.colorTemporaryDelivery[i]))];
              }
              break;
            case 1:
              if (this.temporarySchedule[i].weeklySchedule[k].schedule.orderTuesday) {   
                //console.log ( "Tuesday !");
                this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                    this.transformSimulateScheduleDate(i, startDate, 
                      j + 7*k, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorTemporaryOrder[i]))];
                this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                    this.transformSimulateScheduleDate(i, startDate, 
                        parseInt(this.temporarySchedule[i].weeklySchedule[k].schedule.leadTimeTuesday)+j, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode,
                        this.colorTemporaryDelivery[i]))];
              }
              break;
            case 2:
              if (this.temporarySchedule[i].weeklySchedule[k].schedule.orderWednesday) {       
                //console.log ( "Wednesday ! Schedule # " + i);
                this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                    this.transformSimulateScheduleDate(i, startDate, 
                      j + 7*k, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorTemporaryOrder[i]))];
                this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                    this.transformSimulateScheduleDate(i, startDate, 
                        parseInt(this.temporarySchedule[i].weeklySchedule[k].schedule.leadTimeWednesday)+j + 7*k, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode,
                        this.colorTemporaryDelivery[i]))];
              }
              break;
            case 3:
              if (this.temporarySchedule[i].weeklySchedule[k].schedule.orderThursday) {       
                //console.log ( "Thursday !");
                this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                    this.transformSimulateScheduleDate(i, startDate, 
                      j + 7*k, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorTemporaryOrder[i]))];
                this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                    this.transformSimulateScheduleDate(i, startDate, 
                        parseInt(this.temporarySchedule[i].weeklySchedule[k].schedule.leadTimeThursday)+j + 7*k, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode,
                        this.colorTemporaryDelivery[i]))];
              }
              break;
            case 4:
              if (this.temporarySchedule[i].weeklySchedule[k].schedule.orderFriday) {       
                //console.log ( "Friday !");
                this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                    this.transformSimulateScheduleDate(i, startDate, 
                      j + 7*k, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorTemporaryOrder[i]))];
                this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                    this.transformSimulateScheduleDate(i, startDate, 
                        parseInt(this.temporarySchedule[i].weeklySchedule[k].schedule.leadTimeFriday)+j + 7*k, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode, 
                        this.colorTemporaryDelivery[i]))];
              }
              break;
            case 5:
              if (this.temporarySchedule[i].weeklySchedule[k].schedule.orderSaturday) {    
                //console.log ( "Saturday !");
                this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                    this.transformSimulateScheduleDate(i, startDate, 
                      j + 7*k, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorTemporaryOrder[i]))];
                this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                    this.transformSimulateScheduleDate(i, startDate, 
                        parseInt(this.temporarySchedule[i].weeklySchedule[k].schedule.leadTimeSaturday)+j + 7*k, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode, 
                        this.colorTemporaryDelivery[i]))];
              }
              break;
            case 6:
              if (this.temporarySchedule[i].weeklySchedule[k].schedule.orderSunday) {       
                //console.log ( "Sunday !");
                this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                    this.transformSimulateScheduleDate(i, startDate, 
                      j + 7*k, 'Schedule #' + i + ' / ORDER ' + this.selectedElement.externalcode, this.colorTemporaryOrder[i]))];
                this.simulateSchedule= [...this.simulateSchedule,Object.assign({}, 
                    this.transformSimulateScheduleDate(i, startDate, 
                        parseInt(this.temporarySchedule[i].weeklySchedule[k].schedule.leadTimeSunday)+j + 7*k, 'Schedule #' + i + ' / DELIVERY ' + this.selectedElement.externalcode, 
                        this.colorTemporaryDelivery[i]))];
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
          j++;
      }
    }
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
  createTemporarySchedule (schedule: TemporarySchedule) {
    this.refreshTimeline(schedule);
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
    createSimulateSchedule.start = this.datePipe.transform(createSimulateSchedule.start,"yyyy-MM-dd")
    createSimulateSchedule.end.setDate(createSimulateSchedule.end.getDate() + days);
    createSimulateSchedule.end = this.datePipe.transform(createSimulateSchedule.end,"yyyy-MM-dd")
    return createSimulateSchedule;
  }

  /**
   * Function adjusting the display for the timeline week (max to 2 weeks)
   * @param schedule 
   */
  refreshTimeline (schedule: TemporarySchedule) : Number{
    let startDate, endDate, weekSchedule, currentWeekDay, lessDays;
    let oneDay = 1000 * 60 * 60 * 24 ;
    let oneWeek = 1000 * 60 * 60 * 24 * 7;
    console.log('Refresh : ' + JSON.stringify(schedule));
    console.log('Refresh schedule.start : ' + schedule.start);
    if (schedule.start !== null) {
      try {
        startDate = new Date(schedule.start); 
        endDate = new Date(schedule.end); 
        //Timezone issue
        startDate.setMinutes( startDate.getMinutes() + startDate.getTimezoneOffset() );
        endDate.setMinutes( endDate.getMinutes() + endDate.getTimezoneOffset() );

        schedule.numberWeekDays = Math.ceil(Math.abs((startDate.getTime() - endDate.getTime()))/oneWeek);
        if (schedule.numberWeekDays < 2) { schedule.numberWeekDays = 1; schedule.widthTable = 1100; }
        if (schedule.numberWeekDays >=  2) { schedule.widthTable = 1100 + 700 * (<number>schedule.numberWeekDays-1) } // Restrict to two weeks
        
        console.log('schedule.numberWeekDays : ' + schedule.numberWeekDays);
        
        schedule.numberWeekDaysArray= this.numberDaysWeekToArray(schedule);
        
        let first = startDate; //schedule.start.getDate(); //startDate.getDate() - startDate.getDay(); // First day is the day of the month - the day of the week
        currentWeekDay = first.getDay();
        lessDays = currentWeekDay == 6 ? 0 : currentWeekDay ;
        let dateFirst = new Date(new Date(first).setDate(first.getDate() - lessDays));

        /*console.log('startDate : ' + startDate);
        console.log('endDate : ' + endDate);
        console.log('currentWeekDay : ' + currentWeekDay);
        console.log('lessDays : ' + lessDays);
        console.log('first : ' + first);
        console.log('dateFirst : ' + dateFirst);*/
        let sdate = new Date(dateFirst);
        schedule.columnSchedule = [];
        schedule.weeklySchedule = schedule.weeklySchedule.slice(0,1);
        console.log('schedule : ' + JSON.stringify(schedule));


        for (let i = 0; i < schedule.numberWeekDays; i++) {
          if (schedule.weeklySchedule.length-1 < i) {
              // Create additional temporarySchedule
              console.log('Create additional temporary : ' +i);
              weekSchedule = new TemporaryScheduleWeek();
              weekSchedule.schedule = (Object.assign({}, schedule.weeklySchedule[i-1].schedule));
              schedule.weeklySchedule.push(weekSchedule);
          }
          console.log('Column set up : '+ i);
          sdate.setTime(dateFirst.getTime() + (0 + 7*i) * oneDay);
          schedule.columnSchedule.push(this.datePipe.transform(sdate, 'MM/dd'));
          schedule.columnName.push(this.datePipe.transform(sdate, 'EEE'));
          sdate.setTime(dateFirst.getTime() + (1 + 7*i) * oneDay);
          schedule.columnSchedule.push(this.datePipe.transform(sdate, 'MM/dd'));
          schedule.columnName.push(this.datePipe.transform(sdate, 'EEE'));
          sdate.setTime(dateFirst.getTime() + (2 + 7*i) * oneDay);
          schedule.columnSchedule.push(this.datePipe.transform(sdate, 'MM/dd'));
          schedule.columnName.push(this.datePipe.transform(sdate, 'EEE'));
          sdate.setTime(dateFirst.getTime() + (3 + 7*i) * oneDay);
          schedule.columnSchedule.push(this.datePipe.transform(sdate, 'MM/dd'));
          schedule.columnName.push(this.datePipe.transform(sdate, 'EEE'));
          sdate.setTime(dateFirst.getTime() + (4 + 7*i) * oneDay);
          schedule.columnSchedule.push(this.datePipe.transform(sdate, 'MM/dd'));
          schedule.columnName.push(this.datePipe.transform(sdate, 'EEE'));
          sdate.setTime(dateFirst.getTime() + (5 + 7*i) * oneDay);
          schedule.columnSchedule.push(this.datePipe.transform(sdate, 'MM/dd'));
          schedule.columnName.push(this.datePipe.transform(sdate, 'EEE'));
          sdate.setTime(dateFirst.getTime() + (6 + 7*i) * oneDay);
          schedule.columnSchedule.push(this.datePipe.transform(sdate, 'MM/dd'));
          schedule.columnName.push(this.datePipe.transform(sdate, 'EEE'));
          //console.log('Saturday : ' + sdate);
        }

        //console.log("Diff : " + schedule.numberWeekDays);
      } catch (e) {
        console.log ('Error on date - Start date : ' + startDate);
        console.log ('Error on date - End date : ' + endDate); 
      }
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
  public start: Date;
  public end: Date;
  public weeklySchedule: TemporaryScheduleWeek[] =[];
  public columnSchedule = [];
  public columnName = [];
  public widthTable = 700;
}

export class TemporaryScheduleWeek {
  public schedule: SupplierSchedule;
  public scheduleFouplan: SupplierPlanning; 
}

export class SimulateSchedule {
  // element below needed for the Calendar widget
  public id?;
  public title?;
  public start?;
  public end?;
  //public start: Date = new Date();
  //public end: Date = new Date();
  public color?;
  public allDay?: boolean = true;
}

