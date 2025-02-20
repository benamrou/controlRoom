import { Component, ViewEncapsulation, ViewChild} from '@angular/core';
import { WarehouseItemService } from '../../../../shared/services';
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
    selector: 'release.pallet',
    templateUrl: './release.pallet.component.html',
    styleUrls: ['./release.pallet.component.scss', '../../../../app.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class ReleasePalletComponent {
   
  @ViewChild('fc') fc!: FullCalendar;

   columnOptions!: SelectItem[];
   trackIndex: number = 0;

  // Search result 
  searchResult : any [] = [];
  selectedElement: any;
  columnsResult: any [] = [];
  columnsSchedule: any [] = [];

   // Search Panel
   searchSSCC: string = '';
   searchItem: string = '';

   datePipe: DatePipe;
   dateNow: Date;
   dateTomorrow: Date;

   waitMessage;
   subscription: any[] = [];
   warehouses = [];
   selectedWarehouse: any; selectedIndividualWarehouse: any;


  // Search action
   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries
   
   displayUpdateCompleted: boolean = false;
   msgDisplayed!: String;
 
  msgs: Message[] = [];
  screenID;
  okExit = false;

  constructor(private _warehouseItemService: WarehouseItemService, private _messageService: MessageService) {
    this.datePipe     = new DatePipe('en-US');
    this.dateNow = new Date();
    this.dateTomorrow =  new Date(this.dateNow.setDate(this.dateNow.getDate() + 1));
    this.screenID =  'SCR0000000035';

  // TB_PICK.RP_CODEUP value 1: SKU, 2: Inner, 3: Case, 4: Layer, 5: Pallet
    this.columnsResult = [
      { field:'X', header: 'Selection', placeholder: 'Selected', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field: 'WHSID', header: 'Warehouse code', align:'center' },
      { field: 'WHSDESC', header: 'Whs. description', align:'left' },
      { field: 'ITEM_CODE', header: 'Item #', align:'left' },
      { field: 'LV', header: 'LV #', align:'left' },
      { field: 'ITEM_DESC', header: 'Item desc.', align:'left' },
      { field: 'SSCC', header: 'Pallet #', align:'left' },
      { field: 'STATUS', header: 'Task status', align:'center' }
    ];

    this.warehouses = [
      {label:'90061 - Grocery', name: 'Grocery', code: '90061', checked: true},
      {label:'91070 - Dairy', name: 'Dairy', code: '91070', checked: false},
      {label:'91071 - Frozen',  name: 'Frozen', code: '91071', checked: false},
      {label:'91072 - Meat', name: 'Meat', code: '91072', checked: false},
      {label:'95073 - Produce', name: 'Produce', code: '95073', checked: false},
      {label:'95074 - Floral', name: 'Floral', code: '95074', checked: false},
      {label:'93080 - Manufacturing', name: 'Manufacturing', code: '93080', checked: false}
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
    //console.log('Looking for item code : ' + this.searchSSCC + ' - Picking Unit : ' + this.selectedPU);
    this.razSearch();
    let ssccSearch, warehouseCodeSearch, itemSearch;
    this._messageService.add({severity:'info', summary:'Info Message', detail: 'Looking for pallet information : ' + JSON.stringify(this.searchSSCC)});
   
    if (! this.searchSSCC) { ssccSearch = '-1' } else { ssccSearch=this.searchSSCC}
    if (! this.searchItem) { itemSearch = '-1' } else { itemSearch=this.searchItem}
    if (! this.selectedWarehouse) { warehouseCodeSearch= '-1' }  else { 
      warehouseCodeSearch=this.selectedWarehouse.join('/'); 
    }

    //console.log('Looking for item code : ' + this.searchSSCC + ' - Picking Unit : ' + pickingUnitSearch);
    this._warehouseItemService.getSSCCInfo(warehouseCodeSearch, ssccSearch, itemSearch)
            .subscribe( 
                data => { 
                  this.searchResult = data; // put the data returned from the server in our variable
                  console.log(JSON.stringify(this.searchResult));  
              },
                error => {
                      // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                      this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                },
                () => {this._messageService.add({severity:'warn', summary:'Info Message', detail: 'Retrieved ' + 
                                     this.searchResult.length + ' reference(s).'});
                      this.okExit=true;
                }
            );
  }

  razSearch () {
    this.searchResult = [];
    this.selectedElement = null;
  }


    validateChanges() {
      let ssccToChange = [];
      this.searchResult.filter(item => item["Selected"] == true)
                       .map(item => ssccToChange.push (item));
  
      this.waitMessage =  '<b>Pallet update is usually taking less than a minute depending on the number of SSCC to be processed</b>';
                          
      this._messageService.add({severity:'info', summary:'Info Message', detail: 'Updating orders...'});
      this.subscription.push(this._warehouseItemService.releasePallet(ssccToChange)
              .subscribe( 
                  data => {
                    console.log('SSCC update: ', data);  
                    this.waitMessage = '';
                    this.msgDisplayed = 'All the selected SSCC  have been released. Play safe, please review in GOLD the updated SSCC.'
                    this.displayUpdateCompleted=true;
  
                },
                  error => {
                        // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                        this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                  },
                  () => {this._messageService.add({severity:'warn', summary:'Info Message', detail: 'SSCC releases completed.'});
                        this.waitMessage = '';
                        this.okExit=true;
                  }
              ));
  
    }

    ngOnDestroy() {
      for(let i=0; i< this.subscription.length; i++) {
        this.subscription[i].unsubscribe();
      }
    }


  shareCheckedList(item:any[]){
    console.log('shareCheckedList', item, this.selectedWarehouse);
  }

  shareCheckedCodeList(item:any[]){
    this.selectedWarehouse = item;
    console.log('shareCheckedCodeList : ', item, this.selectedWarehouse)
  }

  shareIndividualCheckedList(item:{}){
    console.log('shareIndividualCheckedList', item, this.selectedWarehouse);
    //console.log(item);
  }
  
}