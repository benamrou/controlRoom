import {Component, ViewEncapsulation, ViewChild} from '@angular/core';
import { ReportingService, WidgetService, ExportService, QueryService } from '../../../shared/services';
import { ICRChart } from 'src/app/shared/graph/chart/chart.component';
import {DatePipe} from '@angular/common';
import { MessageService } from 'primeng/api';
import { Message } from 'primeng/api';
import { FullCalendar } from 'primeng/fullcalendar';
import { SelectItem } from 'primeng/api';
import * as _ from 'lodash';
import { Table } from 'primeng/table';


/**
 * @author Ahmed Benamrouche
 * 
 */

@Component({
    selector: 'available.mh',
    templateUrl: './available.mh.component.html',
    styleUrls: ['./available.mh.component.scss', '../../../../app.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class AvailableMHComponent {
   
  @ViewChild('resultTable') dataTable: Table;
  @ViewChild('resultFilterVendorTable') dataTableFilterVendor: Table;

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
   searchCategoryResult : any [] = [];
   searchSubCategoryResult : any [] = [];
   poNotDelivered : any [] = [];
   selectedElement: any;
   columnsResult: any [] = [];
   columnsResultAvailableCat: any [] = [];
   columnsResultAvailableSubCat: any [] = [];
   columnsSchedule: any [] = [];

   msgDisplayed;

   datePipe: DatePipe;
   dateNow: Date;
   dateTomorrow: Date;

   selectedVendor;

   searchCode: any;
   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries

  // Search action
   
  // Search action
  queryID='MHA0000001'; /* Query to collect list or report */
  queryAvailableCatCode='MHA0000002'; /* Query to collect report filter */
  queryAvailableSubCatCode='MHA0000003'; /* Query to collect report filter */

  displayProcessCompleted = false;
  
  chartConfig: ICRChart;
  msgs: Message[] = [];
  screenID: string;
  waitMessage ='';
  csvButtonTooltip: string;
  recapButtonTooltip: string;
  columsCollapse: { header: string; colspan: number; expand: number; colspan_original: number; }[];
  columnsResultPOnotDelivered: { field: string; header: string; placeholder: string; align: string; type: string; options: any[]; expand: number; format: boolean; display: boolean; main: boolean; }[];

  indexSelected;
  constructor(private _queryService: QueryService, 
              private _exportService: ExportService,
              private _messageService: MessageService) {
    this.screenID =  'SCR0000000042';
    this.datePipe     = new DatePipe('en-US');
    this.dateNow = new Date();
    this.dateTomorrow =  new Date(this.dateNow.setDate(this.dateNow.getDate() + 1));

    this.dateNow = new Date();
    this.scorecardDate = new Date();

    this.columnsResult = [
      { field: 'Root', header: 'Root', placeholder: 'Search by root', align:'left', type: 'input', options: [],expand: -1, format: false, display: true, main: true  },
      { field: 'Dept', header: 'Dept', placeholder: 'Search by dept', align:'left', type: 'input', options: [],expand: -1, format: false, display: true, main: true  },
      { field: 'Sub-Dept', header: 'Sub-Dept', placeholder: 'Search by sub-dept', align:'left', type: 'input', options: [],expand: -1, format: false, display: true, main: true  },
      { field: 'Cat', header: 'Cat', placeholder: 'Search by category', align:'left', type: 'input', options: [],expand: -1, format: false, display: true, main: true  },
      { field: 'Sub-Cat', header: 'Sub-Cat', placeholder: 'Search by sub-cat', align:'left', type: 'input', options: [],expand: -1, format: false, display: true, main: true  },
      { field: 'Nb Items', header: 'Nb Items', placeholder: 'Search by # items', align:'left', type: 'input', options: [],expand: -1, format: false, display: true, main: true  }
    ];

    this.columnsResultAvailableCat=[
      { field: 'MISSING_NUMBER', header: 'Category code available',  align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true }
    ]

    this.columnsResultAvailableSubCat=[
      { field: 'MISSING_NUMBER', header: 'Sub-Category code available',  align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true }
    ]

    this.search();
  }

  search() {
    //this.searchCode = searchCode;
    this.razSearch();
    this._messageService.add({severity:'info', summary:'Info Message', detail: 'Collecting MH info... ' });

    
    this.waitMessage = 'Looking for Merchandise hierarchy information<br>' +
                        '<br> The request is usually taking <b>couple of seconds</b>';
    this.subscription.push(this._queryService.getQueryResult(this.queryID,[])
            .subscribe( 
                data => { 
                          this.searchResult = data.map((obj) => {
                            obj.selected=0;
                            return obj;
                          });
                          console.log('this.searchResult', this.searchResult);
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

      this.subscription.push(this._queryService.getQueryResult(this.queryAvailableCatCode,[])
      .subscribe( 
          data => { 
                    this.searchCategoryResult = data.map((obj) => {
                      obj.selected=0;
                      return obj;
                    });
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

      this.subscription.push(this._queryService.getQueryResult(this.queryAvailableSubCatCode,[])
      .subscribe( 
          data => { 
                    this.searchSubCategoryResult = data.map((obj) => {
                      obj.selected=0;
                      return obj;
                    });
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
    this.searchCategoryResult = [];
    this.searchSubCategoryResult = [];

  }



 ngAfterContentChecked () {
    //this.chart.initializeData();
    //this.chart.refresh();
  }

  ngOnInit() {
  }


}