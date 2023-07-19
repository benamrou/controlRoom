import {Component, ViewEncapsulation, ViewChild} from '@angular/core';
import { OrderService, Supplier,  SupplierPlanning, ValidePlanning, SupplierPlannings } from '../../../shared/services';
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
    providers: [OrderService, MessageService],
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
   selectedElement: any;
   columnsResult: any [] = [];
   columnsSchedule: any [] = [];
  
   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries

  // Search action
   searchCode: string = '';
   periodStart: string = '';
   periodEnd: string = '';
   notUrgentOnly: string = '';
   storeOnly: string = '';
   listOrderStatus: any;

   selectedOrderStatus: any; selectedIndividualStatus: any;

   msgs: Message[] = [];

   msgDisplayed: string;

  // Calendar
  dateNow: Date;
  dateTomorrow : Date;

  constructor(private _orderService: OrderService, private datePipe: DatePipe,
              private _messageService: MessageService) {
    this.screenID =  'SCR0000000003';
    datePipe     = new DatePipe('en-US');
    this.dateNow = new Date();
    this.dateTomorrow =  new Date(this.dateNow.setDate(this.dateNow.getDate() + 1));

    this.columnsResult = [
      { field: 'PO #', header: 'PO #' },
      { field: 'Location.', header: 'Location' },
      { field: 'Supplier code', header: 'Supplier code' },
      { field: 'Supplier desc.', header: 'Supplier desc' },
      { field: 'Order date', header: 'Order date' },
      { field: 'Delivery date', header: 'Delivery date' },
      { field: 'Sending date', header: 'Sending date' },
      { field: 'Urgent', header: 'Urgent' }
    ];

    this.listOrderStatus = [
      {label:'2- Blocked', name: 'Blocked', code: '2', checked: false},
      {label:'3- Valued', name: 'Valued', code: '3', checked: false},
      {label:'5- Awaiting del.',  name: 'Awaiting', code: '5', checked: true},
    ];

  }

  search() {
    let vendorCodeSearch;
    let urgentSearch;
    let storeSearch;
    let periodStartSearch;
    let periodEndSearch;
    let orderStatusSearch;
    this.razSearch();

    this._messageService.add({severity:'info', summary:'Info Message', detail: 'Looking for the warehouse UBD items... ' });

    if (! this.searchCode) { vendorCodeSearch = '-1' }  else { vendorCodeSearch=this.searchCode }
    if (! this.notUrgentOnly) { urgentSearch = '0' }  else { urgentSearch='-1' }
    if (! this.storeOnly) { storeSearch = '1' }  else { storeSearch='-1' }
    if (! this.periodStart) { periodStartSearch = '-1' }  else { periodStartSearch=this.periodStart }
    if (! this.periodEnd) { periodEndSearch = '-1' }  else { periodEndSearch=this.periodEnd }
    if (! this.selectedOrderStatus) { this.listOrderStatus= '-1' }  else { 
      orderStatusSearch=this.selectedOrderStatus.join('/'); 
    }

    //this.searchCode = searchCode;
    this.razSearch();
    this._messageService.add({severity:'info', summary:'Info Message', detail: 'Looking for the orders...'});
    this._orderService.getOrderInfo(vendorCodeSearch, urgentSearch,
                                                     this.storeOnly,
                                                     orderStatusSearch,
                                                     periodStartSearch,
                                                     periodEndSearch)
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

  shareCheckedList(item:any[]){
    //console.log(item);
  }

  shareCheckedCodeList(item:any[]){
    this.listOrderStatus = item;
    console.log('shareCheckedCodeList : ', this.selectedOrderStatus)
  }

  shareIndividualCheckedList(item:{}){
    //console.log(item);
  }

  trackByIdx(index: number, obj: any): any {
    return index;
  }
}