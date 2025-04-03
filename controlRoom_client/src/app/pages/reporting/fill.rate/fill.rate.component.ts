import {Component, ViewEncapsulation, ViewChild} from '@angular/core';
import { ReportingService, WidgetService, ExportService, QueryService } from '../../../shared/services';
import { ICRChart } from 'src/app/shared/graph/chart/chart.component';
import {DatePipe} from '@angular/common';
import { MessageService } from 'primeng/api';
import { Message } from 'primeng/api';
import { FullCalendar } from 'primeng/fullcalendar';
import { SelectItem } from 'primeng/api';
import * as _ from 'lodash';


/**
 * @author Ahmed Benamrouche
 * 
 */

@Component({
    selector: 'fill.rate',
    templateUrl: './fill.rate.component.html',
    styleUrls: ['./fill.rate.component.scss', '../../../../app.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class FillRateComponent {
   
  @ViewChild('fc') fc!: FullCalendar;

   columnOptions!: SelectItem[];
   trackIndex: number = 0;

   // Autocomplete list
   filteredReports: any [];
   reports: string [];
   selectedReport!: string;


  // Request subscription
  subscription: any[] = [];

  // Search result 
   scorecardDate: any;
   searchResult : any [] = [];
   poNotDelivered : any [] = [];
   selectedElement: any;
   columnsResult: any [] = [];
   columnsSchedule: any [] = [];

   datePipe: DatePipe;
   dateNow: Date;
   dateTomorrow: Date;

   processReviewSchedule : boolean = false;
   headersSimulation: any;
   simulateReviewSchedule : boolean = false;

   searchCode: any;
   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries

  // Search action
   
  // Search action
  searchVendorCode: string = '';
  searchItemCode: string = '';
  periodStart;
  periodEnd;
  periodEndSearch;
  periodStartSearch;
  queryID='FIL0000001'; /* Query to collect data from hei_asn_dsd_vendor */
  
  chartConfig: ICRChart;
  msgs: Message[] = [];
  screenID: string;
  waitMessage ='';
  csvButtonTooltip: string;
  recapButtonTooltip: string;
  columsCollapse: { header: string; colspan: number; expand: number; colspan_original: number; }[];
  columnsResultPOnotDelivered: { field: string; header: string; placeholder: string; align: string; type: string; options: any[]; expand: number; format: boolean; display: boolean; main: boolean; }[];

  constructor(private _queryService: QueryService, 
              private _exportService: ExportService,
              private _messageService: MessageService) {
    this.screenID =  'SCR0000000037';
    this.datePipe     = new DatePipe('en-US');
    this.dateNow = new Date();
    this.dateTomorrow =  new Date(this.dateNow.setDate(this.dateNow.getDate() + 1));

    this.dateNow = new Date();
    this.scorecardDate = new Date();
    this.reports =  ["Sleeping inventory", "CAO order metrics"];
    this.filteredReports = this.reports;

    this.chartConfig = new ICRChart();
    this.chartConfig.id  = 'chart1';
    this.chartConfig.type  = ['line'];
    this.chartConfig.axis_labels = ['Monday','Tuesday'];
    this.chartConfig.label_graph = ['Graph1'];
    this.chartConfig.data = [[1,80]];
    this.chartConfig.nbSetOfData = 1;
    this.chartConfig.borderColor = ['green'];


    this.recapButtonTooltip = "Generate recap' for Category Mgrs/Buyers. This will export to excel, products fill rate by: <br> " +
                              "<ul><li> Department/Sub-dept/Category/Sub-Cat.</li>" +
                              "<li>Quantity ordered</li>" +
                              "<li>Quantity received</li>" +
                              "<li>% fill rate (Qty received/Qty ordered)</li></ul>" ;
    this.csvButtonTooltip = "This is reporting all the information in the table below for detailed analyze."
    
    this.columsCollapse = [
      {header: '', colspan: 1, expand: 0, colspan_original: 1},
      {header: 'SUPPLIER', colspan: 1, expand: -1, colspan_original: 2},
      {header: 'MERCH', colspan: 1, expand: -1, colspan_original: 3},
      {header: '', colspan: 1, expand: 0, colspan_original: 1},
      {header: '', colspan: 1, expand: 0, colspan_original: 1},
      {header: '', colspan: 1, expand: 0, colspan_original: 1},
      {header: '', colspan: 1, expand: 0, colspan_original: 1},
      {header: '', colspan: 1, expand: 0, colspan_original: 1}
    ];
    
    this.columnsResult = [
      { field: 'location', header: 'location #', placeholder: 'Filter on warehouse', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      // Supplier
      { field: 'Supplier code', header: 'Supplier code', placeholder: 'Search by vendor', align:'center', type: 'input', options: [],expand: -1, format: false, display: true, main: true  },
      { field: 'Supplier desc', header: 'Supplier desc', placeholder: 'Search by vendor', align:'left', type: 'input', options: [],expand: -1, format: false, display: true, main: false  },
      // Item 
      //{ field: 'Article', header: 'Item code' , placeholder: 'Item code', type: 'input', align:'left', options: [],expand: 1, format: false, display: true, main: true  },
      //{ field: 'LV', header: 'LV #' , placeholder: 'LV#', type: 'input', align:'left', options: [],expand: 1, format: false, display: true, main: false  },
      //{ field: 'Description', header: 'Item desc.' , placeholder: 'Search by description', align:'left', type: 'input', options: [] ,expand: 0, format: false, display: true, main: false  },
      { field: 'Sub-dept', header: 'Sub-dept' , placeholder: 'Sub-dept', type: 'input', align:'left', options: [],expand: -1, format: false, display: true, main: false  },
      { field: 'Category', header: 'Category' , placeholder: 'Category', type: 'input', align:'left', options: [],expand: -1, format: false, display: true, main: false  },
      { field: 'Sub-cat.', header: 'Sub-cat.' , placeholder: 'Sub-cat.', type: 'input', align:'left', options: [],expand: -1, format: false, display: true, main: true  },
      { field: 'Item code', header: 'Item code' , placeholder: 'Item code', type: 'input', align:'left', options: [],expand: -1, format: false, display: true, main: true  },
      { field: 'Item desc', header: 'Item desc' , placeholder: 'Item desc', type: 'input', align:'left', options: [],expand: -1, format: false, display: true, main: true  },
      { field: 'Case ordered', header: 'Case ordered' , placeholder: 'Ordered', type: 'input', align:'center', options: [],expand: 0, format: false, display: true, main: true  },
      { field: 'Case received', header: 'Case received' , placeholder: 'Received', type: 'input', align:'center', options: [],expand: 0, format: false, display: true, main: true  },
      { field: '% of fill', header: '% fill rate' , placeholder: '% fill rate', type: 'input', align:'center', options: [],expand: 0, format: false, display: true, main: true  }
    ];

    this.columnsResultPOnotDelivered = [
      { field: 'location', header: 'location #', placeholder: 'Filter on warehouse', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      // Supplier
      { field: 'Supplier code', header: 'Supplier code', placeholder: 'Search by vendor', align:'center', type: 'input', options: [],expand: -1, format: false, display: true, main: true  },
      { field: 'Supplier desc', header: 'Supplier desc', placeholder: 'Search by vendor', align:'left', type: 'input', options: [],expand: -1, format: false, display: true, main: false  },
      { field: 'PO #', header: 'PO#' , placeholder: 'Item code', type: 'input', align:'left', options: [],expand: -1, format: false, display: true, main: true  },
      { field: 'Item code', header: 'Item code' , placeholder: 'Item code', type: 'input', align:'left', options: [],expand: -1, format: false, display: true, main: true  },
      { field: 'Item desc', header: 'Item desc' , placeholder: 'Item desc', type: 'input', align:'left', options: [],expand: -1, format: false, display: true, main: true  },
      { field: 'Case ordered', header: 'Case ordered' , placeholder: 'Ordered', type: 'input', align:'center', options: [],expand: 0, format: false, display: true, main: true  },
      { field: 'Case received', header: 'Case received' , placeholder: 'Received', type: 'input', align:'center', options: [],expand: 0, format: false, display: true, main: true  },
      { field: '% of fill', header: '% fill rate' , placeholder: '% fill rate', type: 'input', align:'center', options: [],expand: 0, format: false, display: true, main: true  }
    ];
  }

  search() {
    //this.searchCode = searchCode;
    let vendorCodeSearch;
    this.periodEndSearch = '';
    this.periodStartSearch= '';
    this.razSearch();
    this._messageService.add({severity:'info', summary:'Info Message', detail: 'Collecting orders and receipt info... ' });

    if (! this.searchVendorCode) { vendorCodeSearch = '-1' }  else { vendorCodeSearch=this.searchVendorCode }
    if (! this.periodStart) { this.periodStartSearch = '-1' }  else { this.periodStartSearch=this.datePipe.transform(this.periodStart, 'MM/dd/yyyy')}
    if (! this.periodEnd) { this.periodEndSearch = '-1' }  else { this.periodEndSearch=this.datePipe.transform(this.periodEnd, 'MM/dd/yyyy') }
    
    this.waitMessage = 'Looking for orders and receipt for supplier # ' + vendorCodeSearch + ' with the following parameters:<br>' +
                        'Supplier code: ' + vendorCodeSearch + ' <br>' +
                        'Period from: ' + this.periodStartSearch + ' <br>' +
                        'Period until: ' + this.periodEndSearch + ' <br>' +
                        'For DSD vendors, stores are not receiving against the PO. The PO matches process is based on the order delivery +/- X days.' +
                        '<br> The request is usually taking <b>between 3 to 5 minutes</b>';
    this.subscription.push(this._queryService.getQueryResult(this.queryID,[vendorCodeSearch, this.periodStartSearch, this.periodEndSearch])
            .subscribe( 
                data => { this.searchResult = data; // put the data returned from the server in our variable
                          if (data.length >0) {
                            this.searchResult.slice();
                          }
                          this.poNotDelivered = this.searchResult.filter(obj => obj['Receipt #'] === '-1');
                          console.log('data:', this.searchResult);
                          console.log('poNotDelivered:', this.poNotDelivered);

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
  }

  /**
   * function onRowSelect (Evemt on schedule se4lection) 
   * When User selects a supplier schedule, this function copies the schedule to potential temporary schedule.
   * @param event 
   */
  onRowSelect(event: any) {
    this.simulateReviewSchedule = false;
    
  }

  filterReports(event: any) {
    this.filteredReports = [];
    for(let i = 0; i < this.reports.length; i++) {
        let report = this.reports[i];
        if(report.toLowerCase().indexOf(event.query.toLowerCase()) == 0) {
            this.filteredReports.push(report);
        }
    }
}

exportExcelRecap() {
  let recapReport : any [] = [];
  let recapReportSheet2 : any [] = [];
  let searchResultSorted =  this.searchResult.sort((a, b) => a['Days to push'] - b['Days to push']);
  let data_group = _(this.searchResult) 
        .groupBy(x => x['Item code'] + '_' + x['Supplier code']) // using groupBy from Rxjs
        //.flatMap(group => group.toArray())// GroupBy dont create a array object so you have to flat it
        .map(g => { // mapping 
          return {
            "Sub-dept": g[0]["Sub-dept"],//take the first name because we grouped them by name
            "Category": g[0]["Category"],//take the first name because we grouped them by name
            "Sub-cat.": g[0]["Sub-cat."],//take the first name because we grouped them by name
            "Supplier code": g[0]["Supplier code"],//take the first name because we grouped them by name
            "Supplier desc": g[0]["Supplier desc"],//take the first name because we grouped them by name
            "Item code": g[0]["Item code"],//take the first name because we grouped them by name
            "Item desc": g[0]["Item desc"],//take the first name because we grouped them by name
            "Case ordered": _.sumBy(g, 'Case ordered'), // using lodash to sum 
            "Case received": _.sumBy(g, 'Case received'), // using lodash to sum 
            "% of fill rate": _.sumBy(g, 'Case received')/_.sumBy(g, 'Case ordered'), 
          }
        })
        .value(); 

  data_group
  .map(item => recapReport.push ({
    "Sub-dept code desc.": item["Sub-dept"],
    "Category": item["Category"],
    "Sub-cat.": item["Sub-cat."],
    "Supplier code": item['Supplier code'],
    "Supplier desc": item['Supplier desc'],
    "Item code": item['Item code'],
    "Item desc": item['Item desc'],
    "Case ordered": item['Case ordered'],
    "Case received": item['Case received'],
    "% of fill rate": item['% of fill rate']* 100
  }))

  if (this.poNotDelivered.length >0) {
  this.poNotDelivered.map(item => recapReportSheet2.push ({
    "Location": item["location"],
    "PO #": item["PO #"],
    "Receipt #": item["Receipt #"],
    "Supplier code": item["Supplier code"],
    "Supplier desc": item["Supplier desc"],
    "Delivery date": item["Delivery date"],
    "Item code": item['Item code'],
    "Item desc": item["Item desc"],
    "Case ordered": item["Case ordered"],
    "Case received": item["Case received"],
    "% of fill": item["% of fill"],}));
  }
  else {
    recapReportSheet2 = [];
  }
    

  let formatXLS = {
    "conditionalRule": [
      {
        "easeRule": {
          "repeat": "1",
          "lineStart": "6",
          "columnStart": "J",
          "every": "1",
          "columnEnd": "J"
        },
        "style": {
          "numFmt": "0.00%"
        }
      },
      {
        "easeRule": {
          "repeat": "1",
          "lineStart": "5",
          "columnStart": "H",
          "every": "1",
          "columnEnd": "J"
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
          "lineStart": "5",
          "every": "1",
          "columnStart": "J",
          "columnEnd": "J"
        },
        "rules": [
          {
            "ref": "J5:J99999",
            "rule": [
              {
                "type": "expression",
                "formulae": [
                  "AND($J5<=0,NOT(ISBLANK($J5)))"
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
    ]
  }

  let formatXLS2 = {
    "conditionalRule": [
      {
        "easeRule": {
          "repeat": "1",
          "lineStart": "6",
          "columnStart": "K",
          "every": "1",
          "columnEnd": "K"
        },
        "style": {
          "numFmt": "0.00%"
        }
      },
      {
        "easeRule": {
          "repeat": "1",
          "lineStart": "5",
          "columnStart": "A",
          "every": "1",
          "columnEnd": "A"
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
          "lineStart": "5",
          "columnStart": "F",
          "every": "1",
          "columnEnd": "F"
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
          "lineStart": "5",
          "columnStart": "I",
          "every": "1",
          "columnEnd": "K"
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
          "lineStart": "5",
          "every": "1",
          "columnStart": "J",
          "columnEnd": "J"
        },
        "rules": [
          {
            "ref": "K5:K99999",
            "rule": [
              {
                "type": "expression",
                "formulae": [
                  "AND($J5<=0,NOT(ISBLANK($J5)))"
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
    ]
  }
  
  let freezePanel = {"ALTROWCOLUMN" : 4
                    }
  this._exportService.saveCSV(recapReport, null, null, null, "FIL000000001", 
                              "Fill rate report Vendor #" + this.searchVendorCode +
                              " Period from " + this.periodStartSearch + " to " + this.periodEndSearch,
                              //this.recapButtonTooltip
                              '', formatXLS, true, 
                              freezePanel,
                              'PO not delivered', formatXLS2, recapReportSheet2
                              );
}

 ngAfterContentChecked () {
    //this.chart.initializeData();
    //this.chart.refresh();
  }

  ngOnInit() {
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
}