import {Component, ViewEncapsulation, ViewChild} from '@angular/core';
import { WarehouseService, WidgetService } from '../../shared/services';
import { Dialog, SelectItem, Chips, Message, DataGrid, FullCalendar } from '../../shared/components';
import { MessageService } from '../../shared/components';
import {DatePipe} from '@angular/common';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/toPromise';


import {FixPickingUnitComponent} from './toolkit/fix.picking.unit/fix.picking.unit.component';

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
    selector: 'warehouse',
    templateUrl: './warehouse.component.html',
    providers: [WarehouseService, WidgetService, MessageService],
    styleUrls: ['./warehouse.component.scss', '../../app.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class WarehouseComponent {
   
  @ViewChild('fc') fc: FullCalendar;

   columnOptions: SelectItem[];
   trackIndex: number = 0;

  // Search result 
  searchResult : any [] = [];
  selectedElement: any;
  columnsResult: any [] = [];
  columnsSchedule: any [] = [];

   // Autocomplete list
   filteredToolKits: any [];
   toolKits: string [];
   selectedToolKit: string;

   indexToolkit: number;

   datePipe: DatePipe;
   dateNow: Date;
   dateTomorrow: Date;

   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries

  // Search action
 
  searchCode: any;
  search: any;
  msgs: Message[] = [];

  constructor(private _widgetService: WidgetService, private _messageService: MessageService) {
    this.datePipe     = new DatePipe('en-US');
    this.dateNow = new Date();
    this.dateTomorrow =  new Date(this.dateNow.setDate(this.dateNow.getDate() + 1));

    this.toolKits =  ["Fix picking unit"];
    this.filteredToolKits = this.toolKits;


  }

  openToolKit() {
    //this.searchCode = searchCode;
    this.indexToolkit = this.toolKits.indexOf(this.selectedToolKit);

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
    
  }

  filterToolKits(event) {
    this.filteredToolKits = [];
    for(let i = 0; i < this.toolKits.length; i++) {
        let toolKit = this.toolKits[i];
        if(toolKit.toLowerCase().indexOf(event.query.toLowerCase()) == 0) {
            this.filteredToolKits.push(toolKit);
        }
    }
}

}