import {Component, ViewEncapsulation} from '@angular/core';
import { SupplierScheduleService, Supplier } from '../../shared/services/index';
import { SelectItem, Chips, Message, DataGrid } from '../../shared/components/index';

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
    selector: 'schedule',
    templateUrl: './supplier.schedule.component.html',
    providers: [SupplierScheduleService],
    styleUrls: ['./supplier.schedule.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class SupplierScheduleComponent {
   
   columnOptions: SelectItem[];

  // Search result 
   searchResult : any [] = [];
   selectedElement: Supplier;
   columnsResult: any [] = [];
   columnsSchedule: any [] = [];

   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries

  // Search action
   searchCode: string = '';
   msgs: Message[] = [];


  constructor(private _scheduleService: SupplierScheduleService) {
    this.columnsResult = [
      { field: 'externalcode', header: 'Supplier code' },
      { field: 'servicecontract', header: 'Service contract code' },
      { field: 'commercialcontract', header: 'Commercial contract code' },
      { field: 'addresschain', header: 'Address chain' },
      { field: 'description', header: 'Description' },
      { field: 'activeschedules', header: 'Number of schedules' },
    ];

    this.columnsSchedule = ['', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  }

  search() {
    //this.searchCode = searchCode;
    this.razSearch();
    this.msgs.push({severity:'info', summary:'Info Message', detail: 'Looking for the supplier schedule : ' + JSON.stringify(this.searchCode)});
    this._scheduleService.getSupplierScheduleInfo(this.searchCode)
            .subscribe( 
                data => { this.searchResult = data; // put the data returned from the server in our variable
                //console.log(JSON.stringify(this.searchResult));  
              },
                error => {
                      // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                      this.msgs.push({severity:'error', summary:'ERROR Message', detail: error });
                },
                () => {this.msgs.push({severity:'warn', summary:'Info Message', detail: 'Retrieved ' + 
                                     this.searchResult.length + ' reference(s).'});
                }
            );
  }

  razSearch () {
    this.searchResult = null;
  }
}

