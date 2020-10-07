import {Component, ViewEncapsulation, ViewChild} from '@angular/core';
import { SupplierService, ReportingReplenishmentService } from '../../../../shared/services';
import { Dialog, SelectItem, Chips, Message, DataGrid, Schedule, FullCalendar } from '../../../../shared/components';
import { MessageService } from '../../../../shared/components';
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
    selector: 'qltwhsreplenishment',
    templateUrl: './quality.whs.replenishment.component.html',
    providers: [MessageService, SupplierService, ReportingReplenishmentService],
    styleUrls: ['./quality.whs.replenishment.component.scss', '../../../../app.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class QualityWhsReplenishmentComponent {
   
  @ViewChild('fc') fc: FullCalendar;

   columnOptions: SelectItem[];
   trackIndex: number = 0;

   screenID;

  // Search result 
   searchResult : any [] = [];
   selectedElement;
   columnsResult: any [] = [];
   columnsSchedule: any [] = [];
   activeValidateButton: boolean = false;
   
   processReviewSchedule : boolean = false;

   public numberWeekDaysArray: Array<1>; // Number of days between Start and End schedule

   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries

  // Search action
   searchCode: string = '';
   searchVendorCode: string = '';
   periodStart: string = '';
   periodEnd: string = '';
   msgs: Message[] = [];

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

  // Request subscription
  subscription: any[] = [];

  constructor(private datePipe: DatePipe,
              private _supplierService: SupplierService,
              private _reporting: ReportingReplenishmentService,
              private _messageService: MessageService) {
    this.screenID =  'SCR0000000003';
    datePipe     = new DatePipe('en-US');
    this.dateNow = new Date();
    this.dateTomorrow =  new Date(this.dateNow.setDate(this.dateNow.getDate() + 1));

    this.columnsResult = [
      { field: 'WHS_CODE', header: 'Whs code', placeholder: 'Filter on warehouse', align:'center' },
      { field: 'VENDOR_CODE', header: 'Supplier code', placeholder: 'Search by vendor', align:'left' },
      { field: 'VENDOR_DESC', header: 'Supplier desc.', placeholder: 'Supplier desc.', align:'left'  },
      { field: 'ITEM_NUMBER', header: 'Item code' , placeholder: 'Item code' },
      { field: 'ITEM_DESCRIPTION', header: 'Item desc.' , placeholder: 'Search by description', align:'left'  },
      { field: 'ITEM_CLASS', header: 'Class' , placeholder: 'All' , align:'center' },
      { field: 'LAST_X_MONTHS_SHIPPED', header: 'Qty shipped' , placeholder: '', align:'center'  },
      { field: 'LAST_YEAR_SHIPPED', header: 'Qty shipped last year' , placeholder: '', align:'center'  },
      { field: 'TREND_COMING', header: 'Ratio' , placeholder: '', align:'center'  },
      { field: 'INV_CASE', header: 'Inventory' , placeholder: '', align:'center'  },
      { field: 'QTY_TO_BE_DELIVERED', header: 'On order' , placeholder: '', align:'center'  },
      { field: 'STORE_ORDERABLE', header: 'Store orderable' , placeholder: '', align:'center'  },
      { field: 'END_STORE_ORDERABLE', header: 'End orderable' , placeholder: 'End orderable', align:'center'  }
    ];


    this.displayUpdateCompleted = false;
  }

  search() {
    //this.searchCode = searchCode;
    this.razSearch();
    let vendorCodeSearch;
    let date1= new Date(this.periodStart); 
    let date2 = new Date(this.periodEnd); 
    let nbDays = Math.floor((date2.getTime()-date1.getTime()) / (1000 * 3600 * 24));

    this.columnsResult[6].header = 'Qty shipped last ' + nbDays + ' days'; 
    if (! this.searchVendorCode) { vendorCodeSearch = '-1' }  else { vendorCodeSearch=this.searchVendorCode }

    this._messageService.add({severity:'info', summary:'Info Message', detail: 'Looking for the supplier : ' + JSON.stringify(this.searchCode)});
    this.subscription.push(this._reporting.getReportingWarehouseReplenisment('90061',vendorCodeSearch, 
                                                                              this.datePipe.transform(this.periodStart,'MM/dd/yyyy'),
                                                                              this.datePipe.transform(this.periodEnd,'MM/dd/yyyy'))
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


  ngOnDestroy() {
    for(let i=0; i< this.subscription.length; i++) {
      this.subscription[i].unsubscribe();
    }
  }
}

