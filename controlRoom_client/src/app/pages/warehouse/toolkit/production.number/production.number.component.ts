import { Component, ViewEncapsulation, ViewChild} from '@angular/core';
import { ImportService, ProcessService, QueryService, UserService, WarehouseItemService, WarehouseService } from '../../../../shared/services';
import { DatePipe } from '@angular/common';
import { MessageService, SelectItem } from 'primeng/api';
import { Message } from 'primeng/api';
import { FullCalendar } from 'primeng/fullcalendar';

/**
 * 
 * @author Ahmed Benamrouche
 * 
 */
@Component({
    selector: 'production.number',
    templateUrl: './production.number.component.html',
    styleUrls: ['./production.number.component.scss', '../../../../app.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class ProductionNumberComponent {
   
  @ViewChild('fc') fc!: FullCalendar;

   columnOptions!: SelectItem[];
   trackIndex: number = 0;

  // Search result 
  searchResult : any [] = [];
  selectedElement: any;
  columnsResult: any [] = [];
  columnsSchedule: any [] = [];

   // Search Panel
   searchItem: string = '';
   traceabilityIndicator: any [];
   selectedIndicator: string = '';


   datePipe: DatePipe;
   dateNow: Date;
   dateTomorrow: Date;
   printedOn;

   labelFileContent;
   labelFileDisplay;

   waitMessage;
   subscription: any[] = [];
   warehouses = [];
   selectedWarehouse: any; selectedIndividualWarehouse: any;

   selectedSSCC = [];
   

   queryProductionNumber='WHS0000004'; /* Query to collect data from hei_asn_dsd_vendor */
   queryUpdateProductionNumber='WHS0000005'; /* Query to collect data from hei_asn_dsd_vendor */


  // Search action
   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries
   
   displayUpdateCompleted: boolean = false;
   msgDisplayed!: String;
 
  msgs: Message[] = [];
  screenID;
  okExit = false;

  constructor(private _warehouseService: WarehouseService, private _messageService: MessageService,
                private _uploadService: ImportService,
                private _processService: ProcessService,
                private _userService: UserService,
              private _queryService: QueryService) {
    this.datePipe     = new DatePipe('en-US');
    this.dateNow = new Date();
    this.dateTomorrow =  new Date(this.dateNow.setDate(this.dateNow.getDate() + 1));
    this.screenID =  'SCR0000000042';

    this.traceabilityIndicator = [
      {name: 'None', code: '-1'},
      {name: '00000 | UBD + Production lot number', code: '00000'},
      {name: '00002 | UBD', code: '00002'}
  ];

  // TB_PICK.RP_CODEUP value 1: SKU, 2: Inner, 3: Case, 4: Layer, 5: Pallet
    this.columnsResult = [
      { field:'X', header: 'Selection', placeholder: 'Selected', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field: 'WHS', header: 'Warehouse #', align:'center' },
      { field: 'ITEM_CODE', header: 'Item #', align:'left' },
      { field: 'LV', header: 'LV #', align:'center' },
      { field: 'ITEM_DESC', header: 'Item desc.', align:'left' },
      { field: 'GROUP', header: 'Traceability #', align:'center' }
    ];

    this.displayUpdateCompleted = false;

  }

  /**
   * function onRowSelect (Evemt on schedule se4lection) 
   * When User selects a supplier schedule, this function copies the schedule to potential temporary schedule.
   * @param event 
   */
  onRowSelect(event: any) {
    
  }

  search() {
    //this.searchCode = searchCode;
    //console.log('Looking for item code : ' + this.searchItem + ' - Picking Unit : ' + this.selectedPU);
    this.razSearch();
    let indicatorSearch, printedOnSearch, itemSearch;
    let arraySearch = [];
    this._messageService.add({severity:'info', summary:'Info Message', detail: 'Looking for item information : ' + JSON.stringify(this.searchItem)});
   
    if (! this.searchItem) { itemSearch = '-1' } else { itemSearch=this.searchItem}

    if (! this.selectedIndicator) {
      indicatorSearch = -1;
    }
    else {
      indicatorSearch = this.traceabilityIndicator[this.traceabilityIndicator.indexOf(this.selectedIndicator)].code;
    }
    arraySearch.push(itemSearch);
    arraySearch.push(indicatorSearch);
    //console.log('Looking for item code : ' + this.searchItem + ' - Picking Unit : ' + pickingUnitSearch);

    this.waitMessage =  '<b>Item information is usually taking less than a minute depending on the warehouse</b>';
    this.subscription.push(this._queryService.getQueryResult(this.queryProductionNumber, arraySearch)
            .subscribe( 
                data => { 
                  this.searchResult = data; // put the data returned from the server in our variable
                  this.searchResult = data; // put the data returned from the server in our variable
                  for (let i=0; i < this.searchResult.length; i++) {
                    this.searchResult[i]['Selected'] = true;

                  }
                  console.log(JSON.stringify(this.searchResult));  
              },
                error => {
                      // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                      this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                },
                () => {this._messageService.add({severity:'warn', summary:'Info Message', detail: 'Retrieved ' + 
                                     this.searchResult.length + ' reference(s).'});          
                      this.waitMessage = '';
                      this.okExit=true;
                }
            ));
  }

  razSearch () {
    this.searchResult = [];
    this.selectedElement = null;
  }


    ngOnDestroy() {
      for(let i=0; i< this.subscription.length; i++) {
        this.subscription[i].unsubscribe();
      }
    }


    activate() {
      for (let i=0; i < this.searchResult.length; i++) {
        if (this.searchResult[i]['Selected']) {
          switch (this.searchResult[i]['GROUP_CODE']) {
            case '00000':
              this.searchResult[i]['GROUP_CODE']='00000';
              this.searchResult[i]['GROUP']='00000 | UBD + Production lot';
              break;
            case '00001':
              this.searchResult[i['GROUP_CODE']]='00001';
              this.searchResult[i]['GROUP']='00001 | Production lot';
              break;
            case '00002':
              this.searchResult[i]['GROUP_CODE']='00000';
              this.searchResult[i]['GROUP']='00000 | UBD + Production lot';
              break;
            default:
              this.searchResult[i]['GROUP_CODE']='00001';
              this.searchResult[i]['GROUP']='00001 | Production lot';
              break;
          }
        }
      }
    }

    deactivate() {
      for (let i=0; i < this.searchResult.length; i++) {
        if (this.searchResult[i]['Selected']) {
          switch (this.searchResult[i]['GROUP_CODE']) {
            case '00000':
                this.searchResult[i]['GROUP_CODE']='00002';
                this.searchResult[i]['GROUP']='00002 | UBD';
              break;
            case '00001':
              this.searchResult[i]['GROUP_CODE']='';
              this.searchResult[i]['GROUP']=' | NONE';
              break;
            case '00002':
              this.searchResult[i]['GROUP_CODE']='00002';
              this.searchResult[i]['GROUP']='00002 | UBD';
              break;
            default:
              this.searchResult[i]['GROUP_CODE']='';
              this.searchResult[i]['GROUP']=' | NONE';
              break;
          }
        }
      }
    }

    validateChanges() {
      let traceabilityToChange = [];
      this.searchResult.filter(item => item["Selected"] == true)
                       .map(item => traceabilityToChange.push (item));

      this.waitMessage =  '<b>Traceabiltity information update is usually taking less than a minute depending on the changes to be processed</b>';
                          
      this._messageService.add({severity:'info', summary:'Info Message', detail: 'Updating item info...'});
      this.subscription.push(this._queryService.postQueryResult(this.queryUpdateProductionNumber,traceabilityToChange)
              .subscribe( 
                  data => {
                    console.log('order update: ', data);  
                    this.waitMessage = '';
                    this.msgDisplayed = 'All the selected item traceability groups have been updated. To be safe, kindly review the traceability group i PO in GOLD STOCK the item ID card.'
                    this.displayUpdateCompleted=true;
  
                },
                  error => {
                        // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                        this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                  },
                  () => {this._messageService.add({severity:'warn', summary:'Info Message', detail: 'Item traceability changes completed.'});
                        this.waitMessage = '';
                  }
              ));
  
    }

  unselectAll() {
    for (let i=0; i < this.searchResult.length; i++) {
      if (this.searchResult[i]['Selected']) {
        this.searchResult[i]['Selected'] = false;
      }
    }
  }
  
}