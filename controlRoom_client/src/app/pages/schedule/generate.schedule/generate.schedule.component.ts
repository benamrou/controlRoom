import {Component, ViewEncapsulation, ViewChild, OnDestroy} from '@angular/core';
import { SupplierService, ProcessService } from '../../../shared/services';
import {DatePipe} from '@angular/common';
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
    selector: 'generateschedule',
    templateUrl: './generate.schedule.component.html',
    providers: [ MessageService],
    styleUrls: ['./generate.schedule.component.scss', '../../../app.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class GenerateScheduleComponent implements OnDestroy{
   
  @ViewChild('fc') fc: FullCalendar;

   columnOptions: SelectItem[];
   trackIndex: number = 0;

   screenID;
    waitMessage: string = '';

  // Search result 
   searchResult : any [] = [];
   selectedElement: any[] = [];
   columnsResult: any [] = [];
   columnsSchedule: any [] = [];
   activeValidateButton: boolean = false;
   
   processReviewSchedule : boolean = false;

   public numberWeekDaysArray: Array<1>; // Number of days between Start and End schedule

   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries

  // Search action
   searchCode: string = '';
   msgs: Message[] = [];

   // Completion handler
   displayUpdateCompleted: boolean;
   msgDisplayed: string;

  // Calendar
  dateNow: Date;
  dateTomorrow : Date;
  currentYear = new Date().getUTCFullYear();


  // Request subscription
  subscription: any[] = [];

  constructor(private datePipe: DatePipe,
              private _processService: ProcessService,
              private _supplierService: SupplierService,
              private _messageService: MessageService) {
    this.screenID =  'SCR0000000018';
    datePipe     = new DatePipe('en-US');
    this.dateNow = new Date();
    this.dateTomorrow =  new Date(this.dateNow.setDate(this.dateNow.getDate() + 1));

    this.columnsResult = [
      { field: 'FOUCNUF', header: 'Supplier code' },
      { field: 'FOULIBL', header: 'Description' },
      { field: 'Year1', header: this.currentYear, tooltip: 'Generate schedule for year ' + this.currentYear, align: 'center'},
      { field: 'Year2', header: this.currentYear+1, tooltip: 'Generate schedule for year ' + (this.currentYear+1), align: 'center'},
      { field: 'Year3', header: this.currentYear+2, tooltip: 'Generate schedule for year ' + (this.currentYear+2), align: 'center'},
    ];


    this.displayUpdateCompleted = false;
  }

  search() {
    //this.searchCode = searchCode;
    this.razSearch();
    this._messageService.add({severity:'info', summary:'Info Message', detail: 'Looking for the supplier schedule : ' + JSON.stringify(this.searchCode)});
    this._supplierService.getSupplierInfo(this.searchCode)
            .subscribe( 
                data => { this.searchResult = data; // put the data returned from the server in our variable
                console.log('this.searchResult: ',this.searchResult);  
              },
                error => {
                      // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                      this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                },
                () => {this._messageService.add({severity:'warn', summary:'Info Message', detail: 'Retrieved ' + 
                                     this.searchResult.length + ' reference(s).'});
                }
            );
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
    //this.processReviewSchedule = true;
  }

  generateSchedule(year: number, supplierCode: string) {
        // $BIN/shell/generate_fouplan.sh ' || foucnuf || ' ' || to_char(SYSDATE,'MM/DD/RR') || ' ' ||
    // '12/31/' || to_char(SYSDATE,'RR') || ';' "UNIX script"
    let dateNowFormat = this.datePipe.transform(this.dateNow, 'MM/dd/YY');

    if (this.currentYear === year ) {

      this._messageService.add({severity:'warn', summary:'Schedule getting generated', 
      detail: 'Supplier schedule for supplier ' + supplierCode + ' Year ' + year + ' is now processing.' });
       this._supplierService.executeSchedule(supplierCode,dateNowFormat, ' 12/31/' + year.toString().slice(-2))
        //this._processService.executeScript('$BIN/shell/generate_fouplan.sh ' + supplierCode + ' ' + dateNowFormat + ' 12/31/' + year.toString().slice(-2))
        .subscribe( 
            data => { },
            error => { this._messageService.add({severity:'error', summary:'ERROR Message', detail: error }); },
            () => { 
              this.msgDisplayed = 'Supplier schedule for supplier ' + supplierCode + ' Year ' + year + ' has completed.';
              this.displayUpdateCompleted = true;
            });
    }
    else {

      this._messageService.add({severity:'warn', summary:'Schedule getting generated', 
      detail: 'Supplier schedule for supplier ' + supplierCode + ' Year ' + year + ' is now processing.' });

      this._supplierService.executeSchedule(supplierCode,'01/01/' + year.toString().slice(-2), ' 12/31/' + year.toString().slice(-2))
      //this._processService.executeScript('$BIN/shell/generate_fouplan.sh ' + supplierCode + ' 01/01/' + year.toString().slice(-2) + ' 12/31/' + year.toString().slice(-2))
      .subscribe( 
          data => { },
          error => { this._messageService.add({severity:'error', summary:'ERROR Message', detail: error }); },
          () => { 
            this.msgDisplayed = 'Supplier schedule for supplier ' + supplierCode + ' Year ' + year + ' has completed.';
            this.displayUpdateCompleted = true;
          });
    }
  }

  ngOnDestroy() {
    for(let i=0; i< this.subscription.length; i++) {
      this.subscription[i].unsubscribe();
    }
  }


}


