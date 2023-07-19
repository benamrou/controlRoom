import {Component, ViewEncapsulation, ViewChild} from '@angular/core';
import { SupplierScheduleService, Supplier,  SupplierPlanning, ValidePlanning, SupplierPlannings } from '../../../shared/services';
import {DatePipe} from '@angular/common';
import { Observable } from 'rxjs';


import { MessageService } from 'primeng/api';
import { Message } from 'primeng/api';
import { FullCalendar } from 'primeng/fullcalendar';
import { SelectItem } from 'primeng/api';

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
    selector: 'orderUrgent',
    templateUrl: './order.urgent.component.html',
    providers: [SupplierScheduleService, MessageService],
    styleUrls: ['./order.urgent.component.scss', '../../../app.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class OrderUrgentComponent {
   
  @ViewChild('fc') fc: FullCalendar;

   columnOptions: SelectItem[];
   trackIndex: number = 0;

   screenID;
   waitMessage: string = '';
   displayUpdateCompleted: boolean = false;

  // Search result 
   searchResult : any [] = [];
   selectedElement: SupplierPlannings;
   columnsResult: any [] = [];
   columnsSchedule: any [] = [];
  
   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries

  // Search action
   searchCode: string = '';
   periodStart: string = '';
   periodEnd: string = '';
   notUrgentOnly: string = ''
   msgs: Message[] = [];

   msgDisplayed: string;

  // Calendar
  dateNow: Date;
  dateTomorrow : Date;

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
  }

  /**
   * function onRowSelect (Evemt on schedule se4lection) 
   * When User selects a supplier schedule, this function copies the schedule to potential temporary schedule.
   * @param event 
   */
  onRowSelect(event) {
  }

  reviewSchedule() {
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


