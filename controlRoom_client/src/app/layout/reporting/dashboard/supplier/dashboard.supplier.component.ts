import {Component, ViewEncapsulation, ViewChild, OnInit, Inject} from '@angular/core';
import { SupplierService, ReportingReplenishmentService, ItemService, Pricing , Retail} from '../../../../shared/services';
import { Dialog, SelectItem, Chips, Message, DataGrid, Schedule, FullCalendar } from '../../../../shared/components';
import { MessageService, Table } from '../../../../shared/components';
import {DatePipe, DOCUMENT} from '@angular/common';
import { Observable } from 'rxjs/Observable';

import { ChartModule, ICRChart } from '../../../../shared/graph';
import 'rxjs/add/operator/toPromise';


import * as _ from 'lodash';
import { exit } from 'process';

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
    selector: 'dshsupplier',
    templateUrl: './dashboard.supplier.component.html',
    providers: [MessageService, SupplierService, ReportingReplenishmentService, ChartModule, ItemService],
    styleUrls: ['./dashboard.supplier.component.scss', '../../../../app.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class DashboardSupplierComponent {
   
  @ViewChild('fc') fc: FullCalendar;

   columnOptions: SelectItem[];
   trackIndex: number = 0;

   screenID;

   // top badges
   selectedVendorCode;
   selectedVendorCDesc;
   selectedVendorStreet;
   selectedVendorCity;
   averageMargin;
   nbReference;
   fillRateYearly;
   fillRateLast;
   serviceRateYearly;
   serviceRateLast;
   itemStoreInventory;
   itemRetails;

  // Search result 
   searchResult : any [] = [];
   searchResultItemStoreInventory : any [] = [];
   selectedElement;
   columnsResult: any [] = [];
   columsCollapse: any [] = [];
   columnsSchedule: any [] = [];
   activeValidateButton: boolean = false;
   
   processReviewSchedule : boolean = false;

   // Chart
   chartFillRateHistory: ICRChart;
   chartServiceRateHistory: ICRChart;
   rawDataServiceItem: any;
   rawDataFillItem: any;
   rawDataItemStoreInventory: any;
   rawAssortment: any;

   // Table
   sortInventory: any = [0,0,0,0,0,0]; // -1 ASC, 0 neutral, 1 DESC

   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries

  // Search action
  searchVendorCode: string = '';
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
   displayResult: boolean;
   msgDisplayed: string;

  // Calendar
  dateNow: Date;
  dateTomorrow : Date;
  day: any = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Retail
  itemRetailInfos;
  itemPurchasingInfos;
  itemUniqueDeals: any = [];
  retailSelected;
  dialogRetailVisible;
  promoColor;
  regularColor;

  // Request subscription
  subscription: any[] = [];

 // Dropdown warehouse
  warehouses;
  selectedWarehouse; selectedIndividualWarehouse;

  //focus data on vendor
  focussedVendor: any = '';
  focussedItem: any = '';
  focussedItemDesc: any = '';
  focussedRetail;

  _document;
  constructor(@Inject(DOCUMENT) document,
              private datePipe: DatePipe,
              private _supplierService: SupplierService,
              private _reporting: ReportingReplenishmentService,
              private _itemService: ItemService,
              private _messageService: MessageService) {
    this.screenID =  'SCR0000000011';
    datePipe     = new DatePipe('en-US');
    this.dateNow = new Date();
    this.dateTomorrow =  new Date(this.dateNow.setDate(this.dateNow.getDate() + 1));

    this._document = document;


    this.chartFillRateHistory = new ICRChart();
    this.chartServiceRateHistory = new ICRChart();
    this.chartFillRateHistory.id = 'chartFill';
    this.chartServiceRateHistory.id = 'chartService';


    this.itemRetailInfos =new Pricing();  
    this.dialogRetailVisible = false;
    this.promoColor = this._itemService.getRetailPromoColor();
    this.regularColor = this._itemService.getRetailPermanentColor();

    this.focussedItem = '';
    this.focussedVendor = '';
    this.focussedItemDesc = '';

    this.columsCollapse = [
      {header: 'Whs code', colspan: 1, expand: 0, colspan_original: 1},
      {header: 'Supplier', colspan: 2, expand: 1, colspan_original: 2},
      {header: 'Item', colspan: 3, expand: 1, colspan_original: 3},
      {header: 'Promotion', colspan: 1, expand: 0, colspan_original: 1},
      {header: 'Inventory (Cases)', colspan: 1, expand: 0, colspan_original: 1},
      {header: 'Service rate', colspan: 2, expand: -1, colspan_original: 2},
      {header: 'Fill rate', colspan: 2, expand: -1, colspan_original: 2},
      {header: 'Replenishment', colspan: 4, expand: -1, colspan_original: 4},
      {header: 'Store delivery', colspan: 1, expand: 0, colspan_original: 1},
      {header: 'Orderable', colspan: 1, expand: 0, colspan_original: 1},
      {header: 'Cost/Retail', colspan: 5, expand: -1, colspan_original: 5}
    ];

    this.columnsResult = [
      { field: 'WHS_CODE', header: 'Whs code', placeholder: 'Filter on warehouse', align:'center', type: 'input', options: [],expand: 0, display: true, main: true },
      // Supplier
      { field: 'VENDOR_CODE', header: 'Supplier code', placeholder: 'Search by vendor', align:'left', type: 'input', options: [],expand: -1, display: true, main: true  },
      { field: 'VENDOR_DESC', header: 'Supplier desc.', placeholder: 'Supplier desc.', align:'left', type: 'input', options: [],expand: -1, display: true, main: false   },
      // Item 
      { field: 'ITEM_CODE', header: 'Item code' , placeholder: 'Item code', type: 'input', options: [],expand: -1, display: true, main: true  },
      { field: 'ITEM_DESC', header: 'Item desc.' , placeholder: 'Search by description', align:'left', type: 'input', options: [] ,expand: 0, display: true, main: false  },
      { field: 'ITEM_CLASS', header: 'Class' , placeholder: '' , align:'center', type: 'input', options: [] ,expand: 0, display: true, main: false },
      // Promom
      { field: 'NB_PROMO', header: 'Promo' , placeholder: '', align:'center', type: 'input', options: [],expand: 0, display: true, main: true  },
      // Inventory
      { field: 'INV_CASE', header: 'Inventory' , placeholder: '', align:'center', type: 'input', options: [],expand: 0, display: true, main: true  },
      // Service
      { field: 'LD_SERVICE_RATE', header: 'Last reception' , placeholder: '', align:'center', type: 'input', options: [] ,expand: -1, display: true, main: true },
      { field: 'YEARLY_SERVICE_RATE', header: 'Yearly' , placeholder: '', align:'center', type: 'input', options: [] ,expand: -1, display: true, main: false  },
      // Fill
      { field: 'LO_FILL_RATE_CCL', header: 'Last shipment' , placeholder: '', align:'center', type: 'input', options: []  , expand: -1, display: true, main: true },
      { field: 'YEARLY_FILL_RATE', header: 'Yearly' , placeholder: '', align:'center', type: 'input', options: []   , expand: -1, display: true, main: false },
      // Replenishment
      { field: 'LAST_PO_ORDER_DATE', header: 'Order on' , placeholder: '', align:'center', type: 'input', options: []   , expand: -1, display: true, main: true },
      { field: 'LAST_PO_DLIV_DATE', header: 'Planned delivery' , placeholder: '', align:'center', type: 'input', options: [], expand: -1, display: true, main: false },
      { field: 'LAST_PO_RECEIVING_DATE', header: 'Received on' , placeholder: '', align:'center', type: 'input', options: [] , expand: -1, display: true, main: false },
      { field: 'LAST_PO_QTY', header: 'Qty (cases)' , placeholder: '', align:'center', type: 'input', options: [], expand: -1, display: true, main: false },
      // Store delivery
      { field: 'LAST_STORE_ORDER_CCL', header: 'Last store demand' , placeholder: '', align:'left', type: 'input', options: [], expand: 0, display: true, main: true },
      // Orderable
      { field: 'OA_STORE_STATUS', header: 'Orderable' , placeholder: '', align:'center', type: 'input', options: []   , expand: 0, display: true, main: true },
      // Cost/Retail
      { field: 'UNIT_COST', header: 'Cost unit' , placeholder: '', align:'center', type: 'input', options: []   , expand: 0, display: true, main: true },
      { field: 'UNIT_DEAL', header: 'Unit deal' , placeholder: '', align:'center', type: 'input', options: []   , expand: 0, display: true, main: false },
      { field: 'NET_UNIT_COST', header: 'Net unit cost' , placeholder: '', align:'center', type: 'input', options: []   , expand: 0, display: true, main: false },
      { field: 'RETAIL', header: 'Cost unit' , placeholder: '', align:'center', type: 'input', options: []   , expand: 0, display: true, main: false },
      { field: 'MARGIN', header: 'Margin' , placeholder: '', align:'center', type: 'input', options: []   , expand: 0, display: true, main: false }
    ];

    this.warehouses = [
      {label:'90061 - Grocery', name: 'Grocery', code: '90061'},
      {label:'91070 - Dairy', name: 'Dairy', code: '91070'},
      {label:'91071 - Frozen',  name: 'Frozen', code: '91071'},
      {label:'91072 - Meat', name: 'Meat', code: '91072'},
      {label:'95073 - Produce', name: 'Produce', code: '95073'},
      {label:'95074 - Floral', name: 'Produce', code: '95074'}
    ];

    for(let i=0; i < this.columsCollapse.length; i ++) {
      this.expandColumn(i);
    }
    this.displayResult = false;
  }

  search() {
    //this.searchCode = searchCode;
    let vendorCodeSearch;
    let warehouseCodeSearch;
    this.razSearch();
    this._messageService.add({severity:'info', summary:'Info Message', detail: 'Looking for the supplier : ' + JSON.stringify(this.searchVendorCode)});


    if (! this.searchVendorCode) { vendorCodeSearch = '-1' }  else { vendorCodeSearch=this.searchVendorCode }
    if (! this.selectedWarehouse) { warehouseCodeSearch= '-1' }  else { 
      warehouseCodeSearch=this.selectedWarehouse.join('/'); 
    }

    // QUERY #1: Get list of Vendor assortment with item detail
    this.subscription.push(this._reporting.getReportingWarehouseVendorReplenisment(warehouseCodeSearch,vendorCodeSearch)
          .subscribe( 
              data => { 
                  data.forEach(function(item){ 
                    if (item.RETAIL > 0 ) { 
                      item.MARGIN=(item.RETAIL -item.NET_UNIT_COST)/item.RETAIL;
                    } else {
                      item.MARGIN='';
                    }
                  });
                  this.rawAssortment = data;
                  if (data.length > 0) {
                    this.selectedVendorCode =data[0].VENDOR_CODE;
                    this.selectedVendorCDesc =data[0].VENDOR_DESC;
                    this.selectedVendorStreet =data[0].VENDOR_STREET;
                    this.selectedVendorCity =data[0].VENDOR_CITY;
                    let topBadges = data.filter((item) => item.VENDOR_CODE === this.selectedVendorCode);

                    this.nbReference = topBadges.length;

                    this.averageMargin = topBadges.map(res => res["MARGIN"]).reduce((accumulator, current) => {return accumulator + current; }) / this.nbReference;
                    this.fillRateYearly = topBadges.map(res => res["YEARLY_FILL_RATE"]).reduce((accumulator, current) => {return accumulator + current; }) / this.nbReference;
                    this.serviceRateYearly = topBadges.map(res => res["YEARLY_SERVICE_RATE"]).reduce((accumulator, current) => {return accumulator + current; }) / this.nbReference;
                  }
                this.searchResult = data; // put the data returned from the server in our variable
                this.searchResult.slice();
                this.displayResult = true;
            },
              error => {
                    // Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                    this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
              },
              () => {this._messageService.add({severity:'warn', summary:'Info Message', detail: 'Retrieved ' + 
                                    this.searchResult.length + ' reference(s).'});
              }
          ));
    // QUERY #7: Get Vendor Store Item Inventory
    this.subscription.push(this._reporting.getReportingWarehouseVendorStoreitemInventory(warehouseCodeSearch,vendorCodeSearch)
    .subscribe( 
        data => { 
          this.rawDataItemStoreInventory = data;
          this.rawDataItemStoreInventory.slice();
          // this.itemStoreInventory = data.filter((item) => item.ITEM_CODE === this.focussedItem);
          console.log ('rawDataItemStoreInventory', this.rawDataItemStoreInventory);
      },
        error => {
              // Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
              this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
        },
        () => { /* No the main query - don't display result info */ }
    ));

    // QUERY #2: Get Vendor Yearly Fill Rate
    this.subscription.push(this._reporting.getReportingWarehouseVendorYearlyFillRate(warehouseCodeSearch,vendorCodeSearch)
    .subscribe( 
        data => { 
          this.rawDataFillItem = data;
          this.rawDataFillItem.slice();
        },
        error => {
              // Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
              this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
        },
        () => { /* No the main query - don't display result info */ }
    ));
    // QUERY #3: Get Vendor Yearly service rate
    this.subscription.push(this._reporting.getReportingWarehouseVendorYearlyServiceRate(warehouseCodeSearch,vendorCodeSearch)
    .subscribe( 
        data => { 
          this.rawDataServiceItem = data;
      },
        error => {
              // Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
              this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
        },
        () => { /* No the main query - don't display result info */ }
    ));
    // QUERY #4: Get Vendor last fill rate
    this.subscription.push(this._reporting.getReportingWarehouseVendorLastFillRate(warehouseCodeSearch,vendorCodeSearch)
    .subscribe( 
        data => { 
          if(data.length === 1) {
            this.fillRateLast = data[0].LAST_FILL_RATE;
          }
          if(this.focussedVendor.length > 0) {
            this.fillRateLast =  data.filter((item) => item.VENDOR_CODE === this.focussedVendor)[0].LAST_FILL_RATE;
          }
          console.log ('fillRateLast', this.fillRateLast, data);
      },
        error => {
              // Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
              this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
        },
        () => { /* No the main query - don't display result info  */}
    ));
    // QUERY #5: Get Vendor last Service rate
    this.subscription.push(this._reporting.getReportingWarehouseVendorLastServiceRate(warehouseCodeSearch,vendorCodeSearch)
      .subscribe( 
          data => { 
            if(data.length === 1) {
              this.serviceRateLast = data[0].LAST_SERVICE_RATE;
            }
            if(this.focussedVendor.length > 0) {
              this.serviceRateLast =  data.filter((item) => item.VENDOR_CODE === this.focussedVendor)[0].LAST_SERVICE_RATE;
            }
            console.log ('serviceRateLast', this.serviceRateLast, data);
        },
          error => {
                // Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
          },
          () => { /* No the main query - don't display result info  */}
      ));
    // QUERY #6: Get Item retail Information
    this.subscription.push(this._itemService.getRetailItemInfoBySupplier(warehouseCodeSearch,vendorCodeSearch)
    .subscribe( 
        data => { this.itemRetailInfos = data;
      },
        error => {
              // Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
              this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
        },
        () => { /* No the main query - don't display result info */ }
    ));
        // QUERY #7: Get Item purchasing information
        this.subscription.push(this._itemService.getPurchasingInfoBySupplier('-1', warehouseCodeSearch,vendorCodeSearch)
        .subscribe( 
            data => { this.itemPurchasingInfos = data;
                      this.itemUniqueDeals =  _.uniqBy(this.itemPurchasingInfos,function(x){ return 'Deal id: ' + x.DEAL_ID + ' ' +  x.DEAL_TYPE + ' ' + x.AMOUNT + x.DEAL_TYPE });
          },
            error => {
                  // Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                  this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
            },
            () => { /* No the main query - don't display result info */ }
        ));

  }

  razSearch () {
    this.searchResult = [];
    this.rawDataFillItem =[];
    this.rawDataServiceItem =[];
    this.rawDataItemStoreInventory =[];
    this.focussedItem='';
    this.focussedVendor='';
    this.focussedItemDesc='';
    this.selectedElement = null;
    this.displayResult = false;
    this.processReviewSchedule = false;
    this.activeValidateButton = false;
  }

  /**
   * function onRowSelect (Evemt on schedule se4lection) 
   * When User selects a supplier schedule, this function copies the schedule to potential temporary schedule.
   * @param event 
   */
  onRowSelect(event) {
    this.focussedItem = this.selectedElement.ITEM_CODE;
    this.focussedItemDesc = this.selectedElement.ITEM_DESC;
    this.focussedVendor = this.selectedElement.VENDOR_CODE;

    /** Store Item Inventory */
    this.selectItemStoreInventory();
    /** Fill rate history */
    this.selectItemFillRateHistory();
    /** Service rate history */
    this.selectItemServiceRateHistory();
    /** Item Retail */
    this.selectItemRetail();

    if (this.focussedVendor != this.selectedVendorCode) {
      this.selectedVendorCode =this.selectedElement.VENDOR_CODE;
      this.selectedVendorCDesc =this.selectedElement.VENDOR_DESC;
      this.selectedVendorStreet =this.selectedElement.VENDOR_STREET;
      this.selectedVendorCity =this.selectedElement.VENDOR_CITY;
      let topBadges = this.rawAssortment.filter((item) => item.VENDOR_CODE === this.selectedVendorCode);

      this.nbReference = topBadges.length;

      this.averageMargin = topBadges.map(res => res["MARGIN"]).reduce((accumulator, current) => {return accumulator + current; }) / this.nbReference;
      this.fillRateYearly = topBadges.map(res => res["YEARLY_FILL_RATE"]).reduce((accumulator, current) => {return accumulator + current; }) / this.nbReference;
      this.serviceRateYearly = topBadges.map(res => res["YEARLY_SERVICE_RATE"]).reduce((accumulator, current) => {return accumulator + current; }) / this.nbReference;
    }

  }

  selectItemStoreInventory() {
    this.itemStoreInventory = this.rawDataItemStoreInventory.filter((item) => item.ITEM_CODE === this.focussedItem);
    console.log ('selectItemStoreInventory', this.rawDataItemStoreInventory,  this.itemStoreInventory);
  }

  selectItemRetail() {
    this.itemRetails = new Pricing();
    this.itemRetails.retails = this.itemRetailInfos.retails.filter((item) => item.itemcode === this.focussedItem);
    console.log ('selectItemRetail', this.itemRetailInfos,  this.itemRetails);
  }

  selectItemFillRateHistory() {
    this.chartFillRateHistory.label_graph = ['Item #' + this.focussedItem + ' Fill rate history'];

    let dataItemFill = this.rawDataFillItem.filter((item) => item.ITEM_CODE === this.focussedItem);
    let data_labels = _.uniqBy(dataItemFill, 'X_LABELS');
    this.chartFillRateHistory.axis_labels = data_labels.map(item =>  item['X_LABELS']);
    this.chartFillRateHistory.nbSetOfData = 1;
    this.chartFillRateHistory.type = ['line'];
    this.chartFillRateHistory.unit = '%';
    this.chartFillRateHistory.data=[];
    this.chartFillRateHistory.borderColor = [];
    this.chartFillRateHistory.data.push(dataItemFill.map(item =>  item['FILL_RATE']));
    this.chartFillRateHistory.borderColor.push(this.chartFillRateHistory.colorTemplate[0]);
    this.chartFillRateHistory.refreshChart =this.chartFillRateHistory.refreshChart+1;

    console.log ('selectItemFillRateHistory', this.rawDataFillItem,  dataItemFill);
  }

  selectItemServiceRateHistory (){

    this.chartServiceRateHistory.label_graph = ['Item #' + this.focussedItem + ' Service rate history'];

    let dataItemService = this.rawDataServiceItem.filter((item) => item.ITEM_CODE === this.focussedItem);
    let data_labels = _.uniqBy(dataItemService, 'X_LABELS');
    this.chartServiceRateHistory.axis_labels = data_labels.map(item =>  item['X_LABELS']);
    this.chartServiceRateHistory.nbSetOfData = 1;
    this.chartServiceRateHistory.type = ['line'];
    this.chartServiceRateHistory.unit = '%';
    this.chartServiceRateHistory.data=[];
    this.chartServiceRateHistory.borderColor = [];
    this.chartServiceRateHistory.data.push(dataItemService.map(item =>  item['SERVICE_RATE']));
    this.chartServiceRateHistory.borderColor.push(this.chartServiceRateHistory.colorTemplate[0]);
    this.chartServiceRateHistory.refreshChart =this.chartServiceRateHistory.refreshChart+1;
    
    console.log ('chartServiceRateHistory', this.chartServiceRateHistory,  dataItemService);
  }

  ngOnDestroy() {
    for(let i=0; i< this.subscription.length; i++) {
      this.subscription[i].unsubscribe();
    }
  }

  expandColumn(indice: number) {
    this.columsCollapse[indice].expand = this.columsCollapse[indice].expand * -1;
    let j = 0;
    for(let i = 0; i < this.columsCollapse.length; i++) {
      if(i === indice) {
        if(this.columsCollapse[indice].expand === -1) {
          this.columsCollapse[indice].colspan = this.columsCollapse[indice].colspan_original;
        }
        else {
          this.columsCollapse[indice].colspan = 1;
        }
        for(let k=j; k < this.columsCollapse[indice].colspan_original+j; k++) {
          if (this.columnsResult[k].main === false) {
            if (this.columsCollapse[indice].expand === -1) {
              this.columnsResult[k].display = true;
            }
            if (this.columsCollapse[indice].expand === 1) {
              this.columnsResult[k].display = false;
            }
          }
        }
      }
      else {
        j = j + this.columsCollapse[i].colspan_original;
      }
    }
  }

  shareCheckedList(item:any[]){
    //console.log(item);
  }

  sortTableInventory(index, field) {
    console.log('sortTableInventory',this.itemStoreInventory, this.sortInventory, index, field );
    if(this.sortInventory[index] === 0 ) {
      this.sortInventory[index] = -1;
      this.itemStoreInventory = _.sortBy(this.itemStoreInventory, field); 
      console.log(' sort 0', this.sortInventory);
      return;
    }
    if(this.sortInventory[index] === -1 ) {
      this.sortInventory[index] = 1;
      this.itemStoreInventory = _.sortBy(this.itemStoreInventory, field).reverse();
      return;
    }
    if(this.sortInventory[index] === 1 ) {
      this.sortInventory[index] = 0;
      this.itemStoreInventory = this.rawDataItemStoreInventory.filter((item) => item.ITEM_CODE === this.focussedItem);
      return;
    }
  }


  shareCheckedCodeList(item:any[]){
    this.selectedWarehouse = item;
    console.log('shareCheckedCodeList : ', this.selectedWarehouse)
  }

  shareIndividualCheckedList(item:{}){
    //console.log(item);
  }

  handleRetailClick(e) {
    console.log('Retail click');
    this.retailSelected = new Retail();
    this.retailSelected.id = e.calEvent.id;
    this.retailSelected.pricelist = this.itemRetailInfos.retails[e.calEvent.id].pricelist;
    this.retailSelected.pricelistdescription = this.itemRetailInfos.retails[e.calEvent.id].pricelistdescription;
    this.retailSelected.priority = this.itemRetailInfos.retails[e.calEvent.id].priority;
    this.retailSelected.itemfulldescription = this.itemRetailInfos.retails[e.calEvent.id].itemfulldescription;
    
    let start = e.calEvent.start;
    let end = e.calEvent.end;
    /*if(e.view.name === 'month') {
        start.stripTime();
    }*/
    
    if(end) {
        //end.stripTime();
        this.retailSelected.end = end.format();
    }

    this.retailSelected.retail = e.calEvent.retail;
    this.retailSelected.multi = e.calEvent.multi;
    this.retailSelected.priority = e.calEvent.priority;
    this.retailSelected.start = start.format();
    this.dialogRetailVisible = true;
 }


  // Handle Table Tooltip on cell for purchasing
  getToolTipPurchasingContent(rowData) {
    let  toolTipText;
    let dataFiltered = this.itemPurchasingInfos.filter((item) => item.ITEM_CODE === rowData['ITEM_CODE']);
    
    toolTipText = ' <div class="tooltipCell"> ';
    for (let i=0; i< dataFiltered.length; i++) {
      if (i == 0) {
        toolTipText = toolTipText + ' <span> Item cost $' + dataFiltered[i].COST_PRICE + ' / ' + dataFiltered[i].COST_UNIT + ' </span>';
      }
      toolTipText = toolTipText + ' <li> ' + dataFiltered[i].DEAL_ID + ' : ' +  dataFiltered[i].DEAL_TYPE + ' ' + 
                    dataFiltered[i].AMOUNT + ' ' + dataFiltered[i].DEAL_UNIT + ' </li>';
    }
    toolTipText= toolTipText + '</div>';
    return toolTipText;
  }

    // Handle Table Tooltip on cell for purchasing
    getToolTipPromoContent(rowData) {
      let  toolTipText;
      toolTipText = ' <div class="tooltipCell"> ';
      toolTipText = toolTipText + ' <span> Item in Promotion during' + rowData.PROMO_DATE + ' </span>';
      toolTipText= toolTipText + '</div>';
      return toolTipText;
    }

}

