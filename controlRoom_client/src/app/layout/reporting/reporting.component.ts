import {Component, ViewEncapsulation, ViewChild} from '@angular/core';
import { ReportingService, WidgetService } from '../../shared/services';
import { Dialog, SelectItem, Chips, Message, DataGrid, FullCalendar } from '../../shared/components';
import { MessageService } from '../../shared/components';
import {DatePipe} from '@angular/common';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/toPromise';

/**
 * @author Ahmed Benamrouche
 * 
 */

@Component({
	moduleId: module.id,
    selector: 'reporting',
    templateUrl: './reporting.component.html',
    providers: [ReportingService, WidgetService, MessageService],
    styleUrls: ['./reporting.component.scss', '../../app.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class ReportingComponent {
   
  @ViewChild('fc') fc: FullCalendar;

   columnOptions: SelectItem[];
   trackIndex: number = 0;

   // Autocomplete list
   filteredReports: any [];
   reports: string [];
   selectedReport: string;

  // Search result 
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
 
  msgs: Message[] = [];

  constructor(private _widgetService: WidgetService, private _messageService: MessageService) {
    this.datePipe     = new DatePipe('en-US');
    this.dateNow = new Date();
    this.dateTomorrow =  new Date(this.dateNow.setDate(this.dateNow.getDate() + 1));

    this.reports =  ["Sleeping inventory", "CAO order metrics"];
    this.filteredReports = this.reports;


  }

  openReport() {
    //this.searchCode = searchCode;
    this.razLabReport();
    this._messageService.add({severity:'info', summary:'Info Message', 
                              detail: 'Preparing Reporting lab : ' + JSON.stringify(this.selectedReport)});

    this._widgetService.executeWidget( this._widgetService.widgetsInfo.widgets[0])
    .subscribe( 
    // put the data returned from the server 
    data  => {  }, 
    // in case of failure show this message
    error => { 
        console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); 
    }, 
    // Completion
    () => { this._widgetService.widgetsInfo.widgets[0].dataReady=true  }
    );

    
   /* this._widgetService.executeWidget( ).subscribe( 
                      // put the data returned from the server 
                      data  => {  }, 
                      // in case of failure show this message
                      error => { 
                          console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); 
                      }, 
                      // Completion
                      () => { this._widgetService.widgetsInfo.widgets[0].dataReady=true  }
      );*/
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

}