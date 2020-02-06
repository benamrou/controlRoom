import {Component, ViewEncapsulation, ViewChild} from '@angular/core';
import { WarehouseItemService, WidgetService } from '../../../../shared/services';
import { Dialog, SelectItem, Chips, Message, DataGrid, FullCalendar } from '../../../../shared/components';
import { MessageService } from '../../../../shared/components';
import {DatePipe} from '@angular/common';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/toPromise';

/**
 * 
 * @author Ahmed Benamrouche
 * 
 */

@Component({
	  moduleId: module.id,
    selector: 'fixpickingunit',
    templateUrl: './fix.picking.unit.component.html',
    providers: [WarehouseItemService, WidgetService, MessageService],
    styleUrls: ['./fix.picking.unit.component.scss', '../../../../app.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class FixPickingUnitComponent {
   
  @ViewChild('fc') fc: FullCalendar;

   columnOptions: SelectItem[];
   trackIndex: number = 0;

  // Search result 
  searchResult : any [] = [];
  selectedElement: any;
  columnsResult: any [] = [];
  columnsSchedule: any [] = [];

   // Search Panel
   pickingUnits: any [];
   searchItemCode: string = '';
   selectedPU: string = '';

   datePipe: DatePipe;
   dateNow: Date;
   dateTomorrow: Date;


  // Search action
   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries
   
   displayUpdateCompleted: boolean = false;
   msgDisplayed: String;
 
  msgs: Message[] = [];

  constructor(private _warehouseItemService: WarehouseItemService, private _messageService: MessageService) {
    this.datePipe     = new DatePipe('en-US');
    this.dateNow = new Date();
    this.dateTomorrow =  new Date(this.dateNow.setDate(this.dateNow.getDate() + 1));

    this.pickingUnits = [
      {name: 'Unit', code: '1'},
      {name: 'Inner Pack', code: '2'},
      {name: 'Case', code: '3'},
      {name: 'Layer', code: '4'},
      {name: 'Pallet', code: '5'}
  ];

  // TB_PICK.RP_CODEUP value 1: SKU, 2: Inner, 3: Case, 4: Layer, 5: Pallet
    this.columnsResult = [
      { field: 'ID', header: '#' },
      { field: 'WHSID', header: 'Warehouse code' },
      { field: 'WHSDESC', header: 'Whs. description' },
      { field: 'ITEMCODE', header: 'Item code' },
      { field: 'LVCODE', header: 'LV #' },
      { field: 'LVDESC', header: 'Description' },
      { field: 'PICKUNIT', header: 'Picking unit' }
    ];


    this.displayUpdateCompleted = false;

  }

  /**
   * function onRowSelect (Evemt on schedule se4lection) 
   * When User selects a supplier schedule, this function copies the schedule to potential temporary schedule.
   * @param event 
   */
  onRowSelect(event) {
    
  }

  search() {
    //this.searchCode = searchCode;
    //console.log('Looking for item code : ' + this.searchItemCode + ' - Picking Unit : ' + this.selectedPU);
    this.razSearch();
    let pickingUnitSearch, itemCodeSearch;
    this._messageService.add({severity:'info', summary:'Info Message', detail: 'Looking for picking information : ' + JSON.stringify(this.searchItemCode)});
    if (! this.selectedPU) {
      pickingUnitSearch = -1;
    }
    else {
      pickingUnitSearch = this.pickingUnits[this.pickingUnits.indexOf(this.selectedPU)].code;
    }
    if (! this.searchItemCode) { 
      itemCodeSearch = '-1'
    } 
    else {
      itemCodeSearch=this.searchItemCode
    }

    //console.log('Looking for item code : ' + this.searchItemCode + ' - Picking Unit : ' + pickingUnitSearch);
    this._warehouseItemService.getItemPickingInfo(itemCodeSearch, pickingUnitSearch)
            .subscribe( 
                data => { this.searchResult = data; // put the data returned from the server in our variable
                console.log(JSON.stringify(this.searchResult));  
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

  applyChange (whscode: string, itemcode: string, lvcode: string, actualpickunit: string, newpickunit: any) {
    console.log( ' Want to change whscode: '+ whscode +  " itemcode: " + itemcode + " lvcode: " + lvcode + 
                 " actualpickunit: " + actualpickunit + " newpickunit: "+ JSON.stringify(newpickunit));

    this._warehouseItemService.changePickingUnit(whscode, itemcode, lvcode, newpickunit.code)
        .subscribe( 
            data  => { },
            error => { this._messageService.add({severity:'error', summary:'ERROR Message', detail: error }); },
            () => { 
              this._messageService.add({severity:'success', summary:'Info Message', 
                                        detail: 'Picking unit item ' + itemcode + ' has been updated'});

              this.msgDisplayed = 'Picking unit for item ' + itemcode + '/' + lvcode + ' has been successfully changed.';
              this.displayUpdateCompleted = true;
              
              });
    }

}