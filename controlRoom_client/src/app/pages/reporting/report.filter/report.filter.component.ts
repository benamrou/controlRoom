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
    selector: 'report.filter',
    templateUrl: './report.filter.component.html',
    styleUrls: ['./report.filter.component.scss', '../../../../app.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class ReportFilterComponent {
   
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
   searchFilterResult : any [] = [];
   poNotDelivered : any [] = [];
   selectedElement: any;
   columnsResult: any [] = [];
   columnsResultFilterVendor: any [] = [];
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
  searchReportCode: string = '';

  queryID='ALT0000001'; /* Query to collect list or report */
  queryFilterID='ALT0000004'; /* Query to collect report filter */
  queryPostFilter='RPT0000001'; /* Query to update report filter */

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
    this.screenID =  'SCR0000000041';
    this.datePipe     = new DatePipe('en-US');
    this.dateNow = new Date();
    this.dateTomorrow =  new Date(this.dateNow.setDate(this.dateNow.getDate() + 1));

    this.dateNow = new Date();
    this.scorecardDate = new Date();

    this.columnsResult = [
      { field: 'ALTID', header: 'Report #', placeholder: 'Filter on alert id', align:'left', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field: 'ALTSUBJECT', header: 'Title', placeholder: 'Search by title', align:'left', type: 'input', options: [],expand: -1, format: false, display: true, main: true  },
      { field: 'ALTCONTENT', header: 'Content', placeholder: 'Search by content', align:'left', type: 'input', options: [],expand: -1, format: false, display: true, main: true  }
    ];

    this.columnsResultFilterVendor=[
      { field: 'selected', header: '',  align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field: 'FILVENDOR', header: 'Supplier #',  align:'left', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field: 'FOULIBL', header: 'Description', align:'left', type: 'input', options: [],expand: -1, format: false, display: true, main: true  }
    ]
  }

  search() {
    //this.searchCode = searchCode;
    let reportCodeSearch;
    this.razSearch();
    this._messageService.add({severity:'info', summary:'Info Message', detail: 'Collecting reports info... ' });

    if (! this.searchReportCode) { reportCodeSearch = '-1' }  else { reportCodeSearch=this.searchReportCode }
    
    this.waitMessage = 'Looking for reports list ' + reportCodeSearch + ' with the following parameters:<br>' +
                        'Report code: ' + reportCodeSearch + ' <br>' +
                        '<br> The request is usually taking <b>couple of seconds</b>';
    this.subscription.push(this._queryService.getQueryResult(this.queryID,[reportCodeSearch, '-1', '-1'])
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

      this.subscription.push(this._queryService.getQueryResult(this.queryFilterID,[reportCodeSearch, '-1', '-1'])
      .subscribe( 
          data => { 
                    this.searchFilterResult = data.map((obj) => {
                      obj.selected=0;
                      return obj;
                    });
                    this.dataTableFilterVendor.filter('XXXX','FILREPORT','equals');
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
    this.onRowUnSelect(event);
    this.indexSelected = this.dataTable.value.indexOf(this.selectedElement);
    this.dataTable.value[this.indexSelected].selected=1;
    console.log('select:', this.indexSelected);
    this.dataTableFilterVendor.filter(this.dataTable.value[this.indexSelected].ALTID,'FILREPORT','equals');
    //console.log('rowIndex:', event, this.indexSelected);
    
  }

  onRowUnSelect(event: any) {
    console.log('onRowUnSelect:', event);
    for(let i=0; i<this.searchResult.length; i++) {
      this.searchResult[i].selected=0;
    }
    //console.log('rowIndex:', event, this.indexSelected);
    
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


 ngAfterContentChecked () {
    //this.chart.initializeData();
    //this.chart.refresh();
  }

  ngOnInit() {
  }

  openNew() {

  }

  addFilter() {
    console.log('Add filter',this.searchFilterResult);

    this.searchFilterResult.unshift({
      selected: 0,
      FILREPORT: this.searchResult[this.indexSelected].ALTID,
      FILVENDOR: '',
      FOULIBL: '',
      FILCONTRACT: '',
      FILADDRCHAIN: '',
      FILDEPT: '',
      FILSDEPT: '',
      FILCAT: '',
      FILSCAT: ''
    });

    this.dataTableFilterVendor.filter(this.dataTable.value[this.indexSelected].ALTID,'FILREPORT','equals');

    console.log('after Add filter',this.searchFilterResult);
   };

  deleteFilter() {
    this.searchFilterResult.forEach((element,index)=>{
      if(element.selected) {this.searchFilterResult.splice(index,1);
        this.deleteFilter();
        this.dataTableFilterVendor.filter(this.dataTable.value[this.indexSelected].ALTID,'FILREPORT','equals');
        return;
      }
   });
  }

  updateFilter() {
    let filterAdjustment = [...this.searchFilterResult];
    if(filterAdjustment.length == 0) {
      filterAdjustment.unshift({
        selected: 0,
        FILREPORT: this.searchResult[this.indexSelected].ALTID,
        FILVENDOR: '',
        FOULIBL: '',
        FILCONTRACT: '',
        FILADDRCHAIN: '',
        FILDEPT: '',
        FILSDEPT: '',
        FILCAT: '',
        FILSCAT: ''
      });
    }
    this.subscription.push(this._queryService.postQueryResult(this.queryPostFilter, filterAdjustment)
    .subscribe( 
        data => {  

            console.log('Update result:',data);
            this.msgDisplayed = "Reports filters have been updated."; 
            this.displayProcessCompleted =true;
        }, // put the data returned from the server in our variable
        error => {
        },
        async () => { 
                    //this._messageService.add({severity: 'info', summary: 'File Uploaded', detail: ''});
    }));
  }

}