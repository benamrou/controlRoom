import { Component, ViewEncapsulation, ViewChild, OnDestroy, OnInit, Inject } from '@angular/core';
import { ReportingReplenishmentService, ExportService, CommentService } from '../../../shared/services';
import {ConfirmationService, ConfirmEventType} from 'primeng/api';
import { DatePipe } from '@angular/common';
import { ICRChart } from 'src/app/shared/graph/chart/chart.component';
import Annotation from 'chartjs-plugin-annotation';
import { Chart } from 'chart.js';


import { MessageService } from 'primeng/api';
import { Message } from 'primeng/api';
import { FullCalendar } from 'primeng/fullcalendar';
import { SelectItem } from 'primeng/api';



import * as _ from 'lodash';

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
    selector: 'dshsmartubd',
    templateUrl: './smart.ubd.component.html',
    styleUrls: ['./smart.ubd.component.scss', '../../../../app.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class SmartUBDComponent implements OnDestroy {
   
  @ViewChild('fc') fc!: FullCalendar;

   columnOptions!: SelectItem[];
   trackIndex: number = 0;

   screenID;
   waitMessage: string = '';

   // top badges
   selectedVendorCode: any;

  // Search result 
   searchResult : any [] = [];
   searchResultItemStoreInventory : any [] = [];
   selectedElement: any;
   selectedComment: any;
   columnsResult: any [] = [];
   columsCollapse: any [] = [];


   commentResult : any [] = [];
   columnsCommentResult: any [] = [];
   displayComment: boolean = false;
   displayedComment: string;
   actionComment: number;
   commentHeader: string;

   focussedItemCinv : any;
   focussedItem : any;
   focussedItemCode : any;
   focussedLVCode : any;
   focussedWarehouse : any;
   focussedItemCasePack : any;
   focussedCommentId : any;

   // Chart
   chartSalesHistory: ICRChart;
   chartShipmentHistory: ICRChart;
   rawDataSalesItem: any;
   rawDataShipmentItem: any;

   // Table
   sortInventory: any = [0,0,0,0,0,0]; // -1 ASC, 0 neutral, 1 DESC

   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries

  // Search action
  searchVendorCode: string = '';
  searchinStoreDays: string = '45';
  searchUBDend: string = '120';
  searchClosedUBD: string = '60';

   msgs: Message[] = [];

   recapButtonTooltip: string ='';
   csvButtonTooltip: string ='';

   // Constante used for date calculation
   oneDay: number = 1000 * 60 * 60 * 24 ;
   oneWeek: number = 1000 * 60 * 60 * 24 * 7;

   // Completion handler
   displayResult: boolean;
   msgDisplayed!: string;

  // Calendar
  dateNow: Date;
  dateTomorrow : Date;

  // Request subscription
  subscription: any[] = [];

 // Dropdown warehouse
  warehouses;
  selectedWarehouse: any; selectedIndividualWarehouse: any;

  constructor(private datePipe: DatePipe,
              private _reporting: ReportingReplenishmentService,
              private _exportService: ExportService,
              private _commentService: CommentService,
              private _confrmation: ConfirmationService,
              private _messageService: MessageService) {
    this.screenID =  'SCR0000000017';
    datePipe     = new DatePipe('en-US');
    this.dateNow = new Date();
    this.dateTomorrow =  new Date(this.dateNow.setDate(this.dateNow.getDate() + 1));

    Chart.register(Annotation);

    this.columsCollapse = [
      {header: '', colspan: 1, expand: 0, colspan_original: 1},
      {header: '', colspan: 1, expand: 0, colspan_original: 1},
      {header: 'ITEM', colspan: 1, expand: 0, colspan_original: 1},
      {header: '', colspan: 1, expand: 0, colspan_original: 1},
      {header: '', colspan: 1, expand: 0, colspan_original: 1},
      {header: 'INFO', colspan: 1, expand: 1, colspan_original: 6},
      {header: 'PUSH', colspan: 1, expand: 1, colspan_original: 3},
      {header: 'UBD', colspan: 1, expand: 1, colspan_original: 4},
      {header: 'TREND', colspan: 1, expand: 1, colspan_original: 4},
      {header: 'RETAIL', colspan: 1, expand: 1, colspan_original: 3},
      {header: 'COST', colspan: 1, expand: 1, colspan_original: 3},
      {header: 'INVENTORY', colspan: 1, expand: 1, colspan_original: 2},
      {header: 'ANALYTICS', colspan: 1, expand: 1, colspan_original: 3},
    ];

    this.columnsResult = [
      { field: 'Whs', header: 'Whs #', placeholder: 'Filter on warehouse', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      // Supplier
      { field: 'Supplier code desc', header: 'Supplier code desc.', placeholder: 'Search by vendor', align:'left', type: 'input', options: [],expand: -1, format: false, display: true, main: true  },
      // Item 
      //{ field: 'Article', header: 'Item code' , placeholder: 'Item code', type: 'input', align:'left', options: [],expand: 1, format: false, display: true, main: true  },
      //{ field: 'LV', header: 'LV #' , placeholder: 'LV#', type: 'input', align:'left', options: [],expand: 1, format: false, display: true, main: false  },
      //{ field: 'Description', header: 'Item desc.' , placeholder: 'Search by description', align:'left', type: 'input', options: [] ,expand: 0, format: false, display: true, main: false  },
      { field: 'Item code desc', header: 'Item code desc' , placeholder: 'Item code', type: 'input', align:'left', options: [],expand: -1, format: false, display: true, main: true  },
      // Status 
      { field: 'Status', header: 'Attention' , placeholder: '' , align:'center', type: 'input', options: [] ,expand: 0, format: true, display: true, main: true, 
            tooltip: '<b>High:</b> projection covering less than 80% inventory ,<br><b>Medium:</b> Between 80% and 100%, <br>' +
                     '<b>Low:</b> Between 100% and 120% <br>'+
                     '<b>Closed:</b> UBDwithin the next ' + this.searchClosedUBD + ' days<br>' + 
                     '<b>Linked</b> SSCC is linked to other pallet with Hypothetical push<br>'  },
      // CM 
      { field: 'Categ', header: 'Categroy Mgr' , placeholder: '' , align:'center', type: 'input', options: [] ,expand: 0, format: false, display: true, main: true },
      // Item info 
      { field: 'Case Pack', header: 'Case Pack' , placeholder: '' , align:'center', type: 'input', options: [] ,expand: 0, format: false, display: true, main: true },
      { field: 'Active since', header: 'Active since' , placeholder: '' , align:'center', type: 'input', options: [] ,expand: 0, format: false, display: false, main: false },
      { field: 'Whs. discontinued on', header: 'Whs. discontinued on' , placeholder: '' , align:'center', type: 'input', options: [] ,expand: 0, format: false, display: false, main: false },
      { field: 'Seasonal', header: 'Seasonality' , placeholder: '' , align:'center', type: 'input', options: [] ,expand: 0, format: false, display: false, main: false },
      { field: 'In Store', header: 'In store/consumer' , placeholder: '' , align:'center', type: 'input', options: [] ,expand: 0, format: true, display: false, main: false,  tooltip: 'Store plus consumer shelf life' },
      { field: 'Shipping unit', header: 'Shipping unit' , placeholder: '' , align:'center', type: 'input', options: [] ,expand: 0, format: true, display: false, main: false },
      //Hypothetical push
      { field: 'Hypothetical push', header: 'Hypothetical push' , placeholder: '' , align:'center', type: 'input', options: [] ,expand: 1, format: true, display: true, main: true },
      { field: 'Days to push', header: 'Days to push' , placeholder: '' , align:'center', type: 'input', options: [] ,expand: 0, format: false, display: false, main: false },
      { field: 'Trend Hyp. push', header: 'Trend Hyp. push' , placeholder: '' , align:'center', type: 'input', options: [] ,expand: 0, format: false, display: false, main: false },
      // UBD info
      { field: 'UBD', header: 'UBD' , placeholder: '' , align:'center', type: 'input', options: [] ,expand: 1, format: true, display: true, main: true },
      { field: 'Average UBD', header: 'Average UBD' , placeholder: '' , align:'center', type: 'input', options: [] ,expand: 0, format: false, display: false, main: false },
      { field: 'Received on', header: 'Received on' , placeholder: '' , align:'center', type: 'input', options: [] ,expand: 0, format: false, display: false, main: false },
      { field: 'SSCC_ADDRESS', header: 'SSCC' , placeholder: '' , align:'left', type: 'input', options: [] ,expand: 0, format: false, display: false, main: false },
      // Sales trend
      { field: 'SKU sold trend_1', header: 'Trend' , placeholder: '' , align:'center', type: 'input', options: [] ,expand: 1, format: true, display: true, main: true },
      { field: 'SKU sold trend_2', header: 'Week-2' , placeholder: '' , align:'left', type: 'input', options: [] ,expand: 0, format: true, display: false, main: false },
      { field: 'SKU sold trend_3', header: 'Week-3' , placeholder: '' , align:'left', type: 'input', options: [] ,expand: 0, format: true, display: false, main: false },
      { field: 'SKU sold trend_4', header: 'Week-4' , placeholder: '' , align:'left', type: 'input', options: [] ,expand: 0, format: true, display: false, main: false },
      // Retail
      { field: 'CLE retail', header: 'CLE retail' , placeholder: '' , align:'center', type: 'input', options: [] ,expand: 1, format: true, display: true, main: true },
      { field: 'On Promo', header: 'On Promo' , placeholder: '' , align:'center', type: 'input', options: [] ,expand: 0, format: false, display: false, main: false },
      { field: 'Nb Promo past 13 weeks', header: 'Promo past 13 weeks' , placeholder: '' , align:'center', type: 'input', options: [] ,expand: 0, format: false, display: false, main: false },
      // Cost
      { field: 'Case cost', header: 'Case cost' , placeholder: '' , align:'center', type: 'input', options: [] ,expand: 1, format: true, display: true, main: true },
      { field: 'Unit cost', header: 'Unit cost' , placeholder: '' , align:'center', type: 'input', options: [] ,expand: 0, format: true, display: false, main: false },
      { field: 'Total cost', header: 'Total cost' , placeholder: '' , align:'center', type: 'input', options: [] ,expand: 0, format: true, display: false, main: false },
      // Inventory
      { field: 'Inventory (Ship. unit)', header: 'Inventory (Ship. unit)' , placeholder: '', align:'center', type: 'input', options: [],expand: 1, format: false, display: true, main: true  },
      { field: 'WEEKS OF INVENTORY', header: 'Weeks of inv.' , placeholder: '', align:'center', type: 'input', options: [],expand: 0, format: false, display: false, main: false, tooltip: 'Calculation based on the projection'   },
      // Analytics
      { field: 'Shipped per week', header: 'Shipped per week' , placeholder: '', align:'center', type: 'input', options: [] ,expand: -1, format: true, display: true, main: true, tooltip: 'Calculation on last 4 weeks'},
      { field: 'Sold per week', header: 'Sold per week' , placeholder: '', align:'center', type: 'input', options: [] ,expand: -1, format: true, display: false, main: false, tooltip: 'Calculation on last 4 weeks'  },
      { field: 'Projection per week', header: 'Projection per week' , placeholder: '', align:'center', type: 'input', options: [] ,expand: -1, format: true, display: false, main: false, tooltip: 'Calculation on last 4 weeks'   },
    ];

    this.columnsCommentResult = [
      { field: 'UBDDATE', header: 'Date', placeholder: '', align:'center', type: 'input', options: [],expand: 0, format: true, display: true, main: true },
      { field: 'UBDCOMMENT', header: 'Comment', placeholder: '', align:'left', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
    ];

    this.warehouses = [
      {label:'90061 - Grocery', name: 'Grocery', code: '90061', checked: true},
      {label:'91070 - Dairy', name: 'Dairy', code: '91070', checked: false},
      {label:'91071 - Frozen',  name: 'Frozen', code: '91071', checked: false},
      {label:'91072 - Meat', name: 'Meat', code: '91072', checked: false},
      {label:'95073 - Produce', name: 'Produce', code: '95073', checked: false},
      {label:'95074 - Floral', name: 'Produce', code: '95074', checked: false},
    ];

    this.selectedWarehouse = ["90061"];
    this.displayResult = false;

    this.recapButtonTooltip = "Generate recap' for Category Mgrs/Buyers. This will export to excel, products with: <br> " +
                              "<ul><li> High and Medium status (Hypothetical push)</li>" +
                              "<li>Item with quadruple negative trends</li>" +
                              "<li>Item with UBD within " + this.searchClosedUBD + " days</li>" +
                              "<li>SSCC linked to other pallet with Hypothetical push</li></ul>" ;
    this.csvButtonTooltip = "This is reporting all the information in the table below for detailed analyze."
  }

  search() {
    //this.searchCode = searchCode;
    let vendorCodeSearch;
    let inStoreDaysCodeSearch;
    let ubdEndCodeSearch;
    let warehouseCodeSearch;
    let closedUbdCodeSearch;
    this.razSearch();
    this._messageService.add({severity:'info', summary:'Info Message', detail: 'Looking for the warehouse UBD items... ' });

    if (! this.searchVendorCode) { vendorCodeSearch = '-1' }  else { vendorCodeSearch=this.searchVendorCode }
    if (! this.searchinStoreDays) { inStoreDaysCodeSearch = '-1' }  else { inStoreDaysCodeSearch=this.searchinStoreDays }
    if (! this.searchUBDend) { ubdEndCodeSearch = '-1' }  else { ubdEndCodeSearch=this.searchUBDend }
    if (! this.searchClosedUBD) { closedUbdCodeSearch = '0' }  else { closedUbdCodeSearch=this.searchClosedUBD }
    if (! this.selectedWarehouse) { warehouseCodeSearch= '-1' }  else { 
      warehouseCodeSearch=this.selectedWarehouse.join('/'); 
    }

    this.waitMessage = 'Looking for the warehouse UBD items from whs # ' + warehouseCodeSearch + ' with the following parameters:<br>' +
                        'Supplier code: ' + vendorCodeSearch + ' <br>' +
                        'UBD ended within: ' + ubdEndCodeSearch + ' days <br>' +
                        'Closed UBD are within: ' + closedUbdCodeSearch + ' days <br>' +
                        '<br> The request is usually taking <b>between 1 to 3 minutes</b>';
    this.subscription.push(this._reporting.getReportingWarehouseUBD(warehouseCodeSearch,vendorCodeSearch, ubdEndCodeSearch, closedUbdCodeSearch)
            .subscribe( 
                data => { this.searchResult = data; // put the data returned from the server in our variable
                          if (data.length >0) {
                            this.searchResult.slice();
                          }
                          console.log('data:', this.searchResult);
              },
                error => {
                      // Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                      this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                },
                () => {this._messageService.add({severity:'warn', summary:'Info Message', detail: 'Retrieved ' + 
                                     this.searchResult.length + ' reference(s).'});
                       this.waitMessage = '';
                }
            ));


  }

  razSearch () {
    this.searchResult = [];
    this.commentResult = [];
    this.focussedItemCinv = null;
    this.focussedWarehouse = null;
    this.focussedItem = null;
    this.focussedItemCasePack = null;
  }

  /**
   * function onRowSelect (Evemt on schedule se4lection) 
   * When User selects a supplier schedule, this function copies the schedule to potential temporary schedule.
   * @param event 
   */
  onRowSelect(event: any) {
    console.log('onRowSelect :', event)
    this.focussedItemCinv = this.selectedElement.ARLCINLUVC;
    this.focussedWarehouse = this.selectedElement["Whs"];
    this.focussedItemCode = this.selectedElement["Article"];
    this.focussedLVCode = this.selectedElement["LV"];
    this.focussedItem = this.selectedElement['Item code desc'];
    this.focussedItemCasePack = this.selectedElement['Case Pack'];

    this.chartSalesHistory = new ICRChart();
    this.chartShipmentHistory = new ICRChart();
    this.chartSalesHistory.id = 'chartSales';
    this.chartShipmentHistory.id = 'chartShipment';

    this.chartSalesHistory.refreshChart = 0;
    this.chartShipmentHistory.refreshChart = 0;

    /* Get retail & sales */
    this.subscription.push(this._reporting.getReportingWarehouseSalesItem(this.focussedItemCinv, '365')
    .subscribe( 
        data => { 
                  console.log('getReportingWarehouseSalesItem:', data);
                  this.chartSalesHistory.axis_labels = data.map(obj => obj.SEMNSEM);
                  this.chartSalesHistory.unit = '';
                  this.chartSalesHistory.title = 'Retail/Promo and Sales';
                  this.chartSalesHistory.nbSetOfData = 3;
                  this.chartSalesHistory.data.push(data.map(obj => obj.RetailRegular));
                  this.chartSalesHistory.data.push(data.map(obj => obj.RetailPromo));
                  this.chartSalesHistory.data.push(data.map(obj => Math.ceil(obj.Sales/this.focussedItemCasePack)));
                  
                  this.chartSalesHistory.label_graph = ['Regular', 'Promo', 'Sales'];
                  this.chartSalesHistory.borderColor = ['lightblue', 'lightcoral', 'green'];
                  this.chartSalesHistory.backgroundColor = ['lightblue', 'lightcoral', 'green'];

                  let dataMultipleRegular = data.map(obj => '$ ' + obj.RetailRegular + '/' + obj.MultipleRegular);
                  let dataMultiplePromo = data.map(obj => '$ ' + obj.RetailPromo + '/' + obj.MultiplePromo);

                  let maxValue = Math.max.apply(Math, this.chartSalesHistory.data.map(function(o) { return o.y; }));

                  this.chartSalesHistory.options = {
                          plugins: {
                            title: {
                                display: true,
                                text: 'Retail/Promo and Sales'
                            },
                            annotation: {
                              annotations: {
                                box1: {
                                  type: 'box',
                                  xMin: 52,
                                  xMax: 70,
                                  yMin: 0,
                                  yMax: maxValue,
                                  backgroundColor: 'rgba(255, 252, 127, 0.25)'
                                  // 'rgba(255, 99, 132, 0.25)'
                                },
                                label1: {
                                  type: 'label',  
                                  xValue: 52,
                                  yValue: maxValue/3,
                                  rotation: 90,
                                  content: ['TODAY'],
                                  font: {
                                    size: 14
                                  }
                                },
                                line1: {
                                  type: 'line',
                                  xMin: 52,
                                  xMax: 52,
                                  yMin: 0,
                                  yMax: maxValue,
                                  borderColor: 'darkgray',
                                  borderDash: [2,2],
                                  borderWidth: 3,
                                }}},
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        let label ='';
                                        console.log('Chart callback:', context, this.chartSalesHistory);
                                        if (context.datasetIndex == 0) { // Regular 
                                          label = 'Regular : ' + dataMultipleRegular[context.dataIndex];
                                        }
                                        if (context.datasetIndex == 1) { // Promo
                                          label = 'Promo: ' + dataMultiplePromo[context.dataIndex];
                                        }
                                        if (context.datasetIndex == 2) { // Sales
                                          label = 'Sold ' + context.dataset.data[context.dataIndex] + ' case(s)';
                                        }
                                        return label;
                                    }
                                }
                            }
                        },
                    }
                  this.chartSalesHistory.type = ['bar', 'bar', 'line'];
                  //this.chartSalesHistory.data = data; // put the data returned from the server in our variable
                  this.chartSalesHistory.refreshChart = 1;
                  console.log('this.chartSalesHistory:', this.chartSalesHistory);
      },
        error => {
              // Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
              this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
        },
        () => {this._messageService.add({severity:'success', summary:'Info Message', detail: 'Retrieved sales & retail info ' + 
                                        this.chartSalesHistory.data.length + ' reference(s).'});
        }
    ));

    /* Get shipments */
    this.subscription.push(this._reporting.getReportingWarehouseShipmentItem(this.focussedWarehouse,this.focussedItemCinv, '365')
    .subscribe( 
        data => { 
                  console.log('getReportingWarehouseShipmentItem:', data);
                  this.chartShipmentHistory.axis_labels = data.map(obj => obj.PVDNSEM);
                  this.chartShipmentHistory.unit = '';
                  this.chartShipmentHistory.title = 'Warehouse shipments';
                  this.chartShipmentHistory.nbSetOfData = 1;
                  this.chartShipmentHistory.data.push(data.map(obj => Math.ceil(obj.PVDREEL/this.focussedItemCasePack)));
                  
                  this.chartShipmentHistory.label_graph = ['Shipments'];
                  this.chartShipmentHistory.borderColor = ['red'];
                  this.chartShipmentHistory.backgroundColor = ['red'];

                  this.chartShipmentHistory.options = {
                          plugins: {
                            title: {
                                display: true,
                                text: 'Shipments'
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        let label ='';
                                        label = 'Shipped ' + context.dataset.data[context.dataIndex] + ' case(s)';
                                        return label;
                                    }
                                }
                            }
                        }
                    }
                  this.chartShipmentHistory.type = ['line'];
                  //this.chartSalesHistory.data = data; // put the data returned from the server in our variable
                  this.chartShipmentHistory.refreshChart = 1;
                  console.log('this.chartShipmentHistory:', this.chartShipmentHistory);
      },
        error => {
              // Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
              this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
        },
        () => {this._messageService.add({severity:'success', summary:'Info Message', detail: 'Retrieved shipment info ' + 
                             this.chartShipmentHistory.data.length + ' reference(s).'});
        }
    ));

    /* Get comments */
    this.subscription.push(this._commentService.getComment(this.focussedWarehouse,this.focussedItemCode, this.focussedLVCode)
            .subscribe( 
                data => { this.commentResult = data; // put the data returned from the server in our variable
                          if (data.length >0) {
                            this.commentResult.slice();
                          }
                          console.log('comment:', this.commentResult);
              },
                error => {
                      // Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                      this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                },
                () => {this._messageService.add({severity:'success', summary:'Info Message', detail: 'Retrieved comments ' + 
                                     this.commentResult.length + ' reference(s).'}
                                     );
                }
    ));
}

  ngOnDestroy() {
    for(let i=0; i< this.subscription.length; i++) {
      this.subscription[i].unsubscribe();
    }
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

  addComment(event) {
    this.displayComment = true;
    this.actionComment = 0; // Creation
    this.commentHeader = 'Add a note'
  }

  saveAddComment(event) {
    this.displayComment = false;

    if(this.actionComment ===1 ||this.actionComment===2 ) { /* 1- DELETED, 2 - EDITED */
      const searchIndex = this.commentResult.findIndex((comment) => comment.UBDID==this.focussedCommentId);
      this.commentResult[searchIndex].UBDACTION= 1; /* deleted */
      console.log('commentResult: ', this.commentResult, searchIndex, this.actionComment );

      this.subscription.push(this._commentService.editDeleteComment(this.focussedCommentId,this.displayedComment,this.actionComment,this.focussedWarehouse, this.focussedItemCode, this.focussedLVCode,
                             this.selectedElement)
                .subscribe( 
                data => { this.focussedCommentId = data; // put the data returned from the server in our variable
                if (data.length >0) {
                  this.searchResult.slice();
                }
                console.log('data:', this.searchResult);
                },
                error => {
                // Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });

                console.log('error comment adding:', error);
                },
                () => {
                this._messageService.add({severity:'success', summary:'Info Message', detail: 'Comment added to the item '});
                }
          ));
    }
    if (this.actionComment ===0 || this.actionComment ===2) { /* 0 - ADD; 2-EDITED */
        this.subscription.push(this._commentService.createComment(this.focussedWarehouse,this.focussedItemCode, this.focussedLVCode, this.displayedComment,
                              this.selectedElement)
        .subscribe( 
            data => { this.focussedCommentId = data; // put the data returned from the server in our variable
                      if (data.length >0) {
                        this.searchResult.slice();
                      }
                      console.log('data:', this.searchResult);
          },
            error => {
                  // Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                  this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });

                  console.log('error comment adding:', error);
            },
            () => {
              this._messageService.add({severity:'success', summary:'Info Message', detail: 'Comment added to the item '});
              this.commentResult.unshift({ /* unshift: add beginning array */
                UBDID: this.focussedCommentId,
                UBDWHS: this.focussedWarehouse,
                UBDITEM: this.focussedItemCode,
                UBDLV: this.focussedLVCode,
                UBDDATE: this.dateNow,
                UBDACTION: 0 /*create */,
                UBDCOMMENT:  this.displayedComment,
                UBDCOMMENTPREVIOUS: null,
                UBDDETAIL: this.selectedElement,
                UBDDCRE :  this.dateNow,
                UBDDMAJ :  this.dateNow,
                UBDUTIL : localStorage.getItem('ICRUser')
              });
            }
        ));
      }

  }

  removeComment(event) {
    this._confrmation.confirm({
      message: 'Are you sure that you want to proceed?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
          this._messageService.add({severity:'info', summary:'Confirmed', detail:'Deletion confirmed'});
          this.actionComment = 1; /* Remove comment */
          this.displayedComment = this.selectedComment['UBDCOMMENT'];
          this.saveAddComment(null);
      },
      reject: (type) => {
          switch(type) {
              case ConfirmEventType.REJECT:
                  this._messageService.add({severity:'error', summary:'Rejected', detail:'Deletion rejected'});
              break;
              case ConfirmEventType.CANCEL:
                  this._messageService.add({severity:'warn', summary:'Cancelled', detail:'Deletion cancelled'});
              break;
          }
      }
  });
  }

  editComment(event) {
    this.displayedComment = this.selectedComment['UBDCOMMENT'];
    this.displayComment = true;
    this.actionComment = 2; /* Edit comment */
    this.commentHeader = 'Edit the note'

  }

  onCommentSelect(event) {
    this.focussedCommentId = this.selectedComment["UBDID"];
  }

  exportExcelRecap() {
    let recapReport : any [] = [];
    let searchResultSorted =  this.searchResult.sort((a, b) => a['Days to push'] - b['Days to push']);
    this.searchResult
    .filter(item => item["Status"] == 'High' || item["Status"] == 'Medium' ||
                    item["Status"] == 'Closed' || 
                    (item["Status"] == 'Linked' &&  this.searchResult.findIndex(function (value) {
                            return value['Item code desc'] == item['Item code desc'] && 
                                  (value['Status'] == 'High' || value['Status'] == 'Medium') &&
                                  value['UBD'] != item['UBD'] }) >= 0) ||
                    (item["SKU sold trend_1"] < 0 && item["SKU sold trend_2"] < 0 &&
                     item["SKU sold trend_3"] < 0 && item["SKU sold trend_4"] < 0 ))
    .map(item => recapReport.push ({
      "Item code desc": item["Item code desc"],
      "UBD": this.datePipe.transform(item["UBD"], 'MM/dd/yy'),
      "Status": item['Status'],
      "Hypothetical push": item["Hypothetical push"],
      "Days to push": item["Days to push"],
      "Average UBD": item["Average UBD"],
      "Received on": item["Received on"],
      "Shelf life (store/consumer)": item["In Store"],
      "Inventory (Ship. unit)": item["Inventory (Ship. unit)"],
      "Projection per week": item["Projection per week"],
      "Case Pack": item["Case Pack"],
      "CLE retail": item["CLE retail"],
      "Unit cost": item["Unit cost"],
      "Case cost": item["Case cost"],
      "Total cost": item["Total cost"],
      "Weeks of inventory": item["WEEKS OF INVENTORY"],
      "Nb Promo": item["Nb Promo"],
      "Nb Promo past 13 weeks": item["Nb Promo past 13 weeks"],
      "Active since": item["Active since"],
      "Whs. discontinued on": item["Whs. discontinued on"],
      "Shipping unit": item["Shipping unit"],
      "Shipped per week": item["Shipped per week"],
      "Sold per week": item["Sold per week"],
      "Hyp. push Week-1": item["Hyp. push Week-1"],
      "Hyp. push Week-2": item["Hyp. push Week-2"],
      "Hyp. push Week-3": item["Hyp. push Week-3"],
      "Trend sales Week-1 (%)": item["SKU sold trend_1"] * 100,
      "Trend sales Week-2 (%)" : item["SKU sold trend_2"] * 100,
      "Trend sales Week-3 (%)": item["SKU sold trend_3"] * 100,
      "Trend sales Week-4 (%)": item["SKU sold trend_4"] * 100,
      "Qty sold Week-1 (sku)": item["SKU sold week_1"],
      "Qty sold Week-2 (sku)": item["SKU sold week_2"],
      "Qty sold Week-3 (sku)": item["SKU sold week_3"],
      "Qty sold Week-4 (sku)": item["SKU sold week_4"],
      "New in report item": item["New in report item"],
      "Trend Hyp. push": item["Trend Hyp. push"],

      "Whs": item["Whs"],
      "Supplier code desc": item["Supplier code desc"],
      "Category Mgr": item["Categ"],
    }))
   console.log ('Export :', this.searchResult,  recapReport);
    ;

    let formatXLS = {
      "conditionalRule": [
        {
          "easeRule": {
            "repeat": "1",
            "lineStart": "6",
            "columnStart": "AA",
            "every": "1",
            "columnEnd": "AD"
          },
          "style": {
            "numFmt": "0.00%"
          }
        },
        {
          "easeRule": {
            "repeat": "1",
            "lineStart": "5",
            "columnStart": "B",
            "every": "1",
            "columnEnd": "AJ"
          },
          "style": {
            "alignment": {
              "horizontal": "center"
            }
          }
        },
        {
          "easeRule": {
            "repeat": "1",
            "lineStart": "6",
            "columnStart": "AA",
            "every": "1",
            "columnEnd": "AD"
          },
          "rules": [
            {
              "ref": "",
              "rule": [
                {
                  "priority": "1",
                  "type": "containsText",
                  "operator": "containsText",
                  "text": "-",
                  "style": {
                    "fill": {
                      "type": "pattern",
                      "pattern": "solid",
                      "bgColor": {
                        "argb": "fff44336"
                      }
                    }
                  }
                },
                {
                  "priority": "2",
                  "type": "containsText",
                  "operator": "notContainsBlanks",
                  "style": {
                    "fill": {
                      "type": "pattern",
                      "pattern": "solid",
                      "bgColor": {
                        "argb": "ffa4ffa4"
                      }
                    }
                  }
                }
              ]
            }
          ]
        },
        {
          "easeRule": {
            "repeat": "1",
            "lineStart": "6",
            "columnStart": "C",
            "every": 1,
            "columnEnd": "C"
          },
          "rules": [
            {
              "ref": "",
              "rule": [
                {
                  "priority": "1",
                  "type": "containsText",
                  "operator": "containsText",
                  "text": "High",
                  "style": {
                    "fill": {
                      "type": "pattern",
                      "pattern": "solid",
                      "bgColor": {
                        "argb": "fff44336"
                      }
                    }
                  }
                },
                {
                  "priority": "2",
                  "type": "containsText",
                  "operator": "containsText",
                  "text": "Medium",
                  "style": {
                    "fill": {
                      "type": "pattern",
                      "pattern": "solid",
                      "bgColor": {
                        "argb": "ffffcc00"
                      }
                    }
                  }
                },
                {
                  "priority": "3",
                  "type": "containsText",
                  "operator": "containsText",
                  "text": "Low",
                  "style": {
                    "fill": {
                      "type": "pattern",
                      "pattern": "solid",
                      "bgColor": {
                        "argb": "ff949494"
                      }
                    }
                  }
                },
                {
                  "priority": "4",
                  "type": "containsText",
                  "operator": "containsText",
                  "text": "Closed",
                  "style": {
                    "fill": {
                      "type": "pattern",
                      "pattern": "solid",
                      "bgColor": {
                        "argb": "FF91D2FF"
                      }
                    }
                  }
                },
                {
                  "priority": "5",
                  "type": "containsText",
                  "operator": "containsText",
                  "text": "Linked",
                  "style": {
                    "fill": {
                      "type": "pattern",
                      "pattern": "solid",
                      "bgColor": {
                        "argb": "ffa4ff00"
                      }
                    }
                  }
                }
              ]
            }
          ]
        },
        {
          "easeRule": {
            "repeat": "1",
            "lineStart": "6",
            "columnStart": "U",
            "every": 1,
            "columnEnd": "U"
          },
          "rules": [
            {
              "ref": "",
              "rule": [
                {
                  "priority": "1",
                  "type": "containsText",
                  "operator": "containsText",
                  "text": "Inner pack",
                  "style": {
                    "fill": {
                      "type": "pattern",
                      "pattern": "solid",
                      "bgColor": {
                        "argb": "ffffcc00"
                      }
                    }
                  }
                }
              ]
            }
          ]
        },
        {
          "easeRule": {
            "repeat": "1",
            "lineStart": "5",
            "every": "1",
            "columnStart": "A",
            "columnEnd": "A"
          },
          "rules": [
            {
              "ref": "A5:A99999",
              "rule": [
                {
                  "type": "expression",
                  "formulae": [
                    "$AI5=1"
                  ],
                  "style": {
                    "fill": {
                      "type": "pattern",
                      "pattern": "solid",
                      "fgColor": {
                        "argb": "ffffffff"
                      },
                      "bgColor": {
                        "argb": "ffD2C863"
                      }
                    }
                  }
                }
              ]
            }
          ]
        },
        {
          "easeRule": {
            "repeat": "1",
            "lineStart": "6",
            "every": "1",
            "columnStart": "D",
            "columnEnd": "D"
          },
          "rules": [
            {
              "ref": "D6:D99999",
              "rule": [
                {
                  "type": "expression",
                  "formulae": [
                    "$AJ6>0"
                  ],
                  "style": {
                    "fill": {
                      "type": "pattern",
                      "pattern": "solid",
                      "bgColor": {
                        "argb": "ffff0000"
                      }
                    }
                  }
                }
              ]
            }
          ]
        },
        {
          "easeRule": {
            "repeat": "1",
            "lineStart": "6",
            "every": "1",
            "columnStart": "D",
            "columnEnd": "D"
          },
          "rules": [
            {
              "ref": "D6:D99999",
              "rule": [
                {
                  "type": "expression",
                  "formulae": [
                    "$AJ6<0"
                  ],
                  "style": {
                    "fill": {
                      "type": "pattern",
                      "pattern": "solid",
                      "bgColor": {
                        "argb": "ffa4ff00"
                      }
                    }
                  }
                }
              ]
            }
          ]
        }
      ]
    }

    let freezePanel = {"ALTFREEZECOLUMN" : 1, 
                        "ALTROWCOLUMN" : 4
                      }
    this._exportService.saveCSV(recapReport, null, null, null, "UBD000000001", "UBD items recap'  Category Mgrs/Buyers",
                                //this.recapButtonTooltip
                                '', formatXLS, true, 
                                freezePanel
                                );
  }

}

