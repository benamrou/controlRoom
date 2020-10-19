import {Component, ViewEncapsulation, ViewChild, OnDestroy} from '@angular/core';
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

export class QualityWhsReplenishmentComponent implements OnDestroy {
   
  @ViewChild('fc') fc: FullCalendar;

   columnOptions: SelectItem[];
   trackIndex: number = 0;

   screenID;

   selectedFilter;
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

  inventoryCoverage;
  warehouses;
  selectedWarehouse; selectedIndividualWarehouse;

  constructor(private datePipe: DatePipe,
              private _supplierService: SupplierService,
              private _reporting: ReportingReplenishmentService,
              private _messageService: MessageService) {
    this.screenID =  'SCR0000000010';
    datePipe     = new DatePipe('en-US');
    this.dateNow = new Date();
    this.dateTomorrow =  new Date(this.dateNow.setDate(this.dateNow.getDate() + 1));

    this.inventoryCoverage = 80;

    this.columnsResult = [
      { field: 'WHS_CODE', header: 'Whs code', placeholder: 'Filter on warehouse', align:'center', type: 'input', options: [] },
      { field: 'VENDOR_CODE', header: 'Supplier code', placeholder: 'Search by vendor', align:'left', type: 'input', options: []  },
      { field: 'VENDOR_DESC', header: 'Supplier desc.', placeholder: 'Supplier desc.', align:'left', type: 'input', options: []   },
      { field: 'ITEM_NUMBER', header: 'Item code' , placeholder: 'Item code', type: 'input', options: []  },
      { field: 'ITEM_DESCRIPTION', header: 'Item desc.' , placeholder: 'Search by description', align:'left', type: 'input', options: []   },
      { field: 'ITEM_CLASS', header: 'Class' , placeholder: 'All' , align:'center', type: 'input', options: []  },
      { field: 'LAST_X_MONTHS_SHIPPED', header: 'Qty shipped' , placeholder: '', align:'center', type: 'input', options: []   },
      { field: 'LAST_YEAR_SHIPPED', header: 'Qty shipped last year' , placeholder: '', align:'center', type: 'input', options: []   },
      { field: 'TREND_COMING', header: 'Ratio' , placeholder: '', align:'center', type: 'input', options: []   },
      { field: 'INV_CASE', header: 'Inventory' , placeholder: '', align:'center', type: 'input', options: []   },
      { field: 'QTY_TO_BE_DELIVERED', header: 'On order' , placeholder: '', align:'center', type: 'input', options: []   },
      { field: 'STORE_ORDERABLE', header: 'Store orderable' , placeholder: '', align:'center', type: 'input', options: []},
      { field: 'END_STORE_ORDERABLE', header: 'End orderable' , placeholder: 'End orderable', align:'center', type: 'input', options: []   },
      { field: 'COVERED', header: 'Covered' , placeholder: '', align:'center', type: 'input', options: []   }
    ];


    this.warehouses = [
      {label:'90061 - Grocery', name: 'Grocery', code: '90061'},
      {label:'91070 - Dairy', name: 'Dairy', code: '91070'},
      {label:'91071 - Frozen',  name: 'Frozen', code: '91071'},
      {label:'91072 - Meat', name: 'Meat', code: '91072'},
      {label:'95073 - Produce', name: 'Produce', code: '95073'},
      {label:'95074 - Floral', name: 'Produce', code: '95074'}
  ];
    this.displayUpdateCompleted = false;
  }

  search() {
    //this.searchCode = searchCode;
    this.razSearch();
    let vendorCodeSearch;
    let warehouseCodeSearch;
    let date1= new Date(this.periodStart); 
    let date2 = new Date(this.periodEnd); 
    let nbDays = Math.floor((date2.getTime()-date1.getTime()) / (1000 * 3600 * 24));

    this.columnsResult[6].header = 'Qty shipped last ' + nbDays + ' days'; 
    if (! this.searchVendorCode) { vendorCodeSearch = '-1' }  else { vendorCodeSearch=this.searchVendorCode }
    if (! this.selectedWarehouse) { warehouseCodeSearch= '-1' }  else { 
      warehouseCodeSearch=this.selectedWarehouse.join('/'); 
    }

    this._messageService.add({severity:'info', summary:'Info Message', detail: 'Looking for the supplier : ' + JSON.stringify(this.searchVendorCode)});
    this.subscription.push(this._reporting.getReportingWarehouseReplenisment(warehouseCodeSearch,vendorCodeSearch, 
                                                                              this.datePipe.transform(this.periodStart,'MM/dd/yyyy'),
                                                                              this.datePipe.transform(this.periodEnd,'MM/dd/yyyy'))
            .subscribe( 
                data => { this.searchResult = data; // put the data returned from the server in our variable
                          this.inventoryCoverageChange();
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

  removeDuplicate(values) {
    //console.log('Removing duplicate...');
    let concatArray = values.map(eachValue => {
      return Object.values(eachValue).join('')
    })
    let filterValues = values.filter((value, index) => {
      return concatArray.indexOf(concatArray[index]) === index
  
    })
    return filterValues
  }

  shareCheckedList(item:any[]){
    //console.log(item);
  }

  shareCheckedCodeList(item:any[]){
    this.selectedWarehouse = item;
    console.log('shareCheckedCodeList : ', this.selectedWarehouse)
  }

  shareIndividualCheckedList(item:{}){
    //console.log(item);
  }

  inventoryCoverageChange() {
    this.searchResult.forEach( coverage => 
      coverage.COVERED = (coverage.INV_CASE+coverage.QTY_TO_BE_DELIVERED) > (coverage.LAST_YEAR_SHIPPED*this.inventoryCoverage/100));
    console.log('coverage :',this.searchResult);
  }


}

