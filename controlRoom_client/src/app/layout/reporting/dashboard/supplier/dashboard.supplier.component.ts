import {Component, ViewEncapsulation, ViewChild} from '@angular/core';
import { SupplierService } from '../../../../shared/services';
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
    selector: 'dshsupplier',
    templateUrl: './dashboard.supplier.component.html',
    providers: [MessageService, SupplierService],
    styleUrls: ['./dashboard.supplier.component.scss', '../../../../app.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class DashboardSupplierComponent {
   
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
              private _messageService: MessageService) {
    this.screenID =  'SCR0000000003';
    datePipe     = new DatePipe('en-US');
    this.dateNow = new Date();
    this.dateTomorrow =  new Date(this.dateNow.setDate(this.dateNow.getDate() + 1));

    this.columnsResult = [
      { field: 'SUPPLIERCODE', header: 'Supplier code' },
      { field: 'COMMERCIALCONTRACT', header: 'Commercial contract code' },
      { field: 'ADDRESSCHAIN', header: 'Address chain' },
      { field: 'SUPPLIERDESCRIPTION', header: 'Description' }
    ];


    this.displayUpdateCompleted = false;
  }

  search() {
    //this.searchCode = searchCode;
    this.razSearch();
    this._messageService.add({severity:'info', summary:'Info Message', detail: 'Looking for the supplier : ' + JSON.stringify(this.searchCode)});
    this.subscription.push(this._supplierService.getSupplierCode(this.searchCode)
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

