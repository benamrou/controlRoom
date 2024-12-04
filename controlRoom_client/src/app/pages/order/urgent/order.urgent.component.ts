import {Component, ViewEncapsulation, OnDestroy, ViewChild} from '@angular/core';
import { OrderService, ProcessService } from '../../../shared/services';
import {DatePipe} from '@angular/common';
import { ConfirmEventType, ConfirmationService } from 'primeng/api';

import { FormGroup, FormControl, Validators} from '@angular/forms';
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
    providers: [OrderService, MessageService, ConfirmationService, ProcessService],
    styleUrls: ['./order.urgent.component.scss', '../../../app.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class OrderUrgentComponent implements OnDestroy {
   
  @ViewChild('fc') fc: FullCalendar;

   columnOptions: SelectItem[];
   trackIndex: number = 0;

   screenID;
   waitMessage: string = '';
   okExit = false;

   displayUpdateCompleted: boolean = false;
   displayChangeDeliveryDate: boolean = false;
   displayChangeSendingDate: boolean = false;
   displaySendCompleted: boolean = false;

   newDeliveryDate:any;
   newDeliveryTime:any = '';

   newSendingDate:any;
   newSendingTime:any = '';

   enableSendPO: boolean = false;

  // Search result 
   searchResult : any [] = [];
   selectedElement: any;
   columnsResult: any [] = [];
   columnsSchedule: any [] = [];

  subscription: any[] = [];
  
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

   deliveryDateForm = new FormGroup({
    deliveryDate_field: new FormControl('', [Validators.required]),
    deliveryTime_field: new FormControl('', [Validators.required, Validators.minLength(4)])
  });

  sendingDateForm = new FormGroup({
    sendingDate_field: new FormControl('', [Validators.required]),
    sendingTime_field: new FormControl('', [Validators.required, Validators.minLength(4)])
  });

  // Calendar
  dateNow: Date;
  dateTomorrow : Date;

  constructor(private _orderService: OrderService, private datePipe: DatePipe,
              private _confrmationService: ConfirmationService,
              private _processService: ProcessService,
              private _messageService: MessageService) {
    this.screenID =  'SCR0000000024';
    datePipe     = new DatePipe('en-US');
    this.dateNow = new Date();
    this.dateTomorrow =  new Date(this.dateNow.setDate(this.dateNow.getDate() + 1));

    this.columnsResult = [
      { field:'X', header: '', placeholder: 'Selected', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:'PO #', header: 'PO #', placeholder: 'Order number...', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:'Parent PO #', header: 'Parent PO #', placeholder: 'Parent order number...', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:'Location', header: 'Location', placeholder: 'Selected', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:'Supplier code', header: 'Supplier code', placeholder: 'Supplier code', align:'left', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:'Supplier desc', header: 'Supplier desc', placeholder: 'Supplier description', align:'left', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:'Order status', header: 'Status', placeholder: 'Order status', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:'Urgent', header: 'Urgent', placeholder: 'Urgency', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:'Order date', header: 'Order date', placeholder: 'Order date', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:'Delivery date', header: 'Delivery date', placeholder: 'Delivery date', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:'Sending date', header: 'Sending date', placeholder: 'Sending date', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true }
    ];

    this.listOrderStatus = [
      {label:'2- Blocked', name: 'Blocked', code: '2', checked: false},
      {label:'3- Valued', name: 'Valued', code: '3', checked: false},
      {label:'5- Awaiting del.',  name: 'Awaiting del.', code: '5', checked: true},
    ];

    this.selectedOrderStatus = ["5"];

  }

  search() {
    let vendorCodeSearch;
    let urgentSearch;
    let storeSearch;
    let periodStartSearch;
    let periodEndSearch;
    let orderStatusSearch;
    this.razSearch();

    if (! this.searchCode) { vendorCodeSearch = '-1' }  else { vendorCodeSearch=this.searchCode }
    if (this.notUrgentOnly) { urgentSearch = '1' }  else { urgentSearch='-1' }
    if (this.storeOnly) { storeSearch = '1' }  else { storeSearch='-1' }
    if (! this.periodStart) { periodStartSearch = '-1' }  else { periodStartSearch=this.datePipe.transform(this.periodStart, 'MM/dd/yyyy')}
    if (! this.periodEnd) { periodEndSearch = '-1' }  else { periodEndSearch=this.datePipe.transform(this.periodEnd, 'MM/dd/yyyy') }
    if (! this.selectedOrderStatus) { orderStatusSearch= '-1' }  else { 
      orderStatusSearch=this.selectedOrderStatus.join('/'); 
    }

    //this.searchCode = searchCode;
    this.razSearch();
    this._messageService.add({severity:'info', summary:'Info Message', detail: 'Looking for the orders...'});
    this.subscription.push(this._orderService.getOrderInfo(vendorCodeSearch, urgentSearch,
                                                      storeSearch,
                                                      orderStatusSearch,
                                                      periodStartSearch,
                                                      periodEndSearch)
            .subscribe( 
                data => {
                  this.searchResult = data; // put the data returned from the server in our variable
                  for (let i=0; i < this.searchResult.length; i++) {
                    this.searchResult[i]['Selected'] = true;
                    this.searchResult[i]['Urgent enable'] = this.searchResult[i]['Urgent'] == '1';

                  }
                  console.log('order info: ', this.searchResult);  
              },
                error => {
                      // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                      this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                },
                () => {this._messageService.add({severity:'warn', summary:'Info Message', detail: 'Retrieved ' + 
                                     this.searchResult.length + ' reference(s).'});
                }
            ));
  }


  validateChanges() {
    let ordersToChange = [];
    this.searchResult.filter(item => item["Selected"] == true)
                     .map(item => ordersToChange.push (item));


    for (let i=0; i < this.searchResult.length; i++) {
      if (this.searchResult[i]['Selected'] && this.searchResult[i]['Urgent enable']) {
        this.searchResult[i]['Urgent'] = 1;
      }
    }
    this.waitMessage =  '<b>Orders information update is usually taking less than a minute depending on the number of PO to be processed</b>';
                        
    this._messageService.add({severity:'info', summary:'Info Message', detail: 'Updating orders...'});
    this.subscription.push(this._orderService.updateOrder(ordersToChange)
            .subscribe( 
                data => {
                  console.log('order update: ', data);  
                  this.waitMessage = '';
                  this.msgDisplayed = 'All the selected purchase orders have been updated. Play safe, please review in GOLD the updated PO.'
                  this.displayUpdateCompleted=true;

              },
                error => {
                      // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                      this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                },
                () => {this._messageService.add({severity:'warn', summary:'Info Message', detail: 'Orders update completed.'});
                      this.waitMessage = '';
                }
            ));

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
    this.selectedOrderStatus = item;
    console.log('shareCheckedCodeList : ', this.selectedOrderStatus)
  }

  shareIndividualCheckedList(item:{}){
    //console.log(item);
  }

  setSelectionAsUgent() {

    this._confrmationService.confirm({
      message: 'Are you sure that you want to mark as urgent all the selected orders? ',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
          for (let i=0; i < this.searchResult.length; i++) {
            if (this.searchResult[i]['Selected']) {
              this.searchResult[i]['Urgent enable'] = true;
              this.searchResult[i]['Urgent'] = 1;
            }
          }
      },
      reject: (type) => {
          switch(type) {
              case ConfirmEventType.REJECT:
                  this._messageService.add({severity:'error', summary:'Cancelled', detail:'Cancelled - Selected PO not been flagged as urgent.'});
              break;
              case ConfirmEventType.CANCEL:
                  this._messageService.add({severity:'warn', summary:'Cancelled', detail:'Cancelled - Selected PO not been flagged as urgent.'});
              break;
          }
          this.waitMessage='';
      }
    });
    
  }

  unselectAll() {
    for (let i=0; i < this.searchResult.length; i++) {
      if (this.searchResult[i]['Selected']) {
        this.searchResult[i]['Selected'] = false;
      }
    }
  }
  
  changeDeliveryDate() {
    let deliveryDate = new Date(this.searchResult[0]['Delivery date']);
    this.newDeliveryDate = deliveryDate;
    this.newDeliveryTime = deliveryDate.getHours().toString().padStart(2,'0') + deliveryDate.getMinutes().toString().padStart(2,'0');
    this.displayChangeDeliveryDate=true;
  }

  updateDeliveryDate() {
    for (let i =0; i < this.searchResult.length; i++) {
      if (this.searchResult[i]['Selected']) {
        this.searchResult[i]['Delivery date']=
                this.datePipe.transform(this.newDeliveryDate, 'MM/dd/yyyy') + ' ' + 
                this.newDeliveryTime.substring(0,2) + ':' +
                this.newDeliveryTime.substring(2);
      }
    }
    this.displayChangeDeliveryDate=false;

  }

  changeSendingDate() {
    let sendingDate = new Date(this.searchResult[0]['Sending date']);
    this.newSendingDate = sendingDate;
    this.newSendingTime = sendingDate.getHours().toString().padStart(2,'0') + sendingDate.getMinutes().toString().padStart(2,'0');
    this.displayChangeSendingDate=true;
  }

  updateSendingDate() {
    for (let i =0; i < this.searchResult.length; i++) {
      if (this.searchResult[i]['Selected']) {
        this.searchResult[i]['Sending date']=
                this.datePipe.transform(this.newSendingDate, 'MM/dd/yyyy') + ' ' + 
                this.newSendingTime.substring(0,2) + ':' +
                this.newSendingTime.substring(2);
      }
    }
    this.displayChangeSendingDate=false;

  }

  sendPO(){

    this._confrmationService.confirm({
      message: 'Are you sure that you want to send all the VALUED PO with a passed collection date & time ? <br><br>This will proces all the store orders (not only the selected in the table). <br><b>Please make sure the PO collection date and time are passed.</b> ',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.waitMessage =  'Executing the validation PO for central vendor (store to warehouse PO)... <br>'+
                            '<br><br>'+
                            '<b>This process is usually taking between 1 and 3 minutes</b>';
                            this.subscription.push(this._processService.executeJob('pscde45p', '10 -1 3 -1 -1 0 HN 1')
                            .subscribe( 
                              data => { },
                              error => {
                                    // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                                    this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                                    this.waitMessage =  'Executing the validation PO for central vendor (store to warehouse PO)... &emsp;<b>FAILED</b><br>'+
                                                        '<br><br>'+
                                                        '<b>This process is usually taking between 1 and 3 minutes</b>';
                                    this.okExit=true;
                              },
                              () => {
                                this.waitMessage =  'Executing the validation PO for central vendor (store to warehouse PO)... &emsp;<b>COMPLETED</b><br>'+
                                                    'Executing the validation PO for external vendor (DSD orders)... <br>'+
                                                    '<br><br>'+
                                                    '<b>This process is usually taking between 1 and 3 minutes</b>';

                                                    this.subscription.push(this._processService.executeJob('pscde45p', '10 -1 1 -1 -1 0 HN 1')
                                                    .subscribe( 
                                                      data => { },
                                                      error => {
                                                            // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                                                            this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });

                                                            this.waitMessage =  'Executing the validation PO for central vendor (store to warehouse PO)... &emsp;<b>COMPLETED</b><br>'+
                                                                                'Executing the validation PO for external vendor (DSD orders)...&emsp;<b>FAILED</b><br>'+
                                                                                '<br><br>'+
                                                                                '<b>This process is usually taking between 1 and 3 minutes</b>';
                                                            this.okExit=true;
                                                      },
                                                      () => {
                                                            this.waitMessage =  'Executing the validation PO for central vendor (store to warehouse PO)... &emsp;<b>COMPLETED</b><br>'+
                                                                                'Executing the validation PO for external vendor (DSD orders)...&emsp;<b>COMPLETED</b><br>'+
                                                                                '<br><br>'+
                                                                                '<b>This process is usually taking between 1 and 3 minutes</b>';
                                                            this.msgDisplayed = 'Sending PO process has completed. Refresh and check your orders.'
                                                            this.okExit =true;
                                                            this.waitMessage = '';
                                                            this.displaySendCompleted =true;
                                                            this.search();

                                                            this._messageService.add({severity:'warn', summary:'Info Message', detail: 'Orders sending process completed.'});
                                                        
                        
                                                      }
                                                  ));

                              }
                          ));

      },
      reject: (type) => {
          switch(type) {
              case ConfirmEventType.REJECT:
                  this._messageService.add({severity:'error', summary:'Cancelled', detail:'Cancelled - Sending PO has been cancelled.'});
              break;
              case ConfirmEventType.CANCEL:
                  this._messageService.add({severity:'warn', summary:'Cancelled', detail:'Cancelled - Sending PO has been cancelled.'});
              break;
          }
          this.waitMessage='';
      }
    });
  }


  ngOnDestroy() {
    for(let i=0; i< this.subscription.length; i++) {
      this.subscription[i].unsubscribe();
    }
  }

  trackByIdx(index: number, obj: any): any {
    return index;
  }
}