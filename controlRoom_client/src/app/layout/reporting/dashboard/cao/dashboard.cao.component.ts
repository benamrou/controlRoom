import {Component, ViewEncapsulation, ViewChild} from '@angular/core';
import { ReportingService, WidgetService } from '../../../../shared/services';
import { Dialog, SelectItem, Chips, Message, DataGrid, FullCalendar } from '../../../../shared/components';
import { MessageService } from '../../../../shared/components';
import { ChartComponent, ChartModule, ICRChart } from '../../../../shared/graph/';
import {DatePipe} from '@angular/common';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/toPromise';


/**
 * @author Ahmed Benamrouche
 * 
 */

@Component({
	moduleId: module.id,
    selector: 'dashboard.cao',
    templateUrl: './dashboard.cao.component.html',
    providers: [ReportingService, WidgetService, MessageService, ChartModule],
    styleUrls: ['./dashboard.cao.component.scss', '../../../../app.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class DashboardCAOComponent {
   
  @ViewChild('fc') fc: FullCalendar;

   columnOptions: SelectItem[];
   trackIndex: number = 0;

   // Autocomplete list
   filteredReports: any [];
   reports: string [];
   selectedReport: string;

  // Search result 
   scorecardDate: any;
   searchResult : any [] = [];
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
   search: any;
   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries

  // Search action
   
  chartConfig: ICRChart;
  msgs: Message[] = [];

  constructor(private _widgetService: WidgetService, private _messageService: MessageService) {
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

  }

  clickedOpen() {
    if (this.chartConfig.type[0] === 'line') {
      this.chartConfig.type = ['bar'];
    }
    else {
      this.chartConfig.type = ['line'];
    }
    console.log(' new this.chartConfig.type : ' + JSON.stringify(this.chartConfig.type));
  }
  openReport() {
    //console.log('chart_id dashboard: ' + this.chart.chart_id);
    //this.chart.initializeData();
    //this.chart.refresh();
  }

  razLabReport () {
    this.searchResult = [];
    this.selectedElement = null;
  }

  /**
   * function onRowSelect (Evemt on schedule se4lection) 
   * When User selects a supplier schedule, this function copies the schedule to potential temporary schedule.
   * @param event 
   */
  onRowSelect(event) {
    this.simulateReviewSchedule = false;
    
  }

  filterReports(event) {
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

}