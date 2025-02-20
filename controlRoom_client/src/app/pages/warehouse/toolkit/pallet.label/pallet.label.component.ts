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
    selector: 'pallet.label',
    templateUrl: './pallet.label.component.html',
    styleUrls: ['./pallet.label.component.scss', '../../../../app.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class PalletLabelComponent {
   
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
   printedOn;

   labelFileContent;
   labelFileDisplay;

   waitMessage;
   subscription: any[] = [];
   warehouses = [];
   selectedWarehouse: any; selectedIndividualWarehouse: any;

   selectedSSCC = [];
   

   queryPalletLabel='WHS0000003'; /* Query to collect data from hei_asn_dsd_vendor */


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
    this.screenID =  'SCR0000000039';

  // TB_PICK.RP_CODEUP value 1: SKU, 2: Inner, 3: Case, 4: Layer, 5: Pallet
    this.columnsResult = [
      { field:'X', header: 'Selection', placeholder: 'Selected', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field: 'WHS', header: 'Warehouse code', align:'center' },
      { field: 'ITEM_CODE', header: 'Item #', align:'left' },
      { field: 'LV', header: 'LV #', align:'center' },
      { field: 'ITEM_DESC', header: 'Item desc.', align:'left' },
      { field: 'SSCC', header: 'Pallet #', align:'center' },
      { field: 'ADDRESS', header: 'Address', align:'center'},
      { field: 'REQUESTED_BY', header: 'Requested by', align:'center'},
      { field: 'PRINTED_ON', header: 'Requested on', align:'center' }
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
    let ssccSearch, printedOnSearch, itemSearch;
    let arraySearch = [];
    this._messageService.add({severity:'info', summary:'Info Message', detail: 'Looking for pallet information : ' + JSON.stringify(this.searchSSCC)});
   
    if (! this.searchSSCC) { ssccSearch = '-1' } else { ssccSearch=this.searchSSCC}
    if (! this.searchItem) { itemSearch = '-1' } else { itemSearch=this.searchItem}
    if (! this.printedOn) { printedOnSearch= '-1' }  else { 
      printedOnSearch=this.datePipe.transform(this.printedOn, 'MM/dd/yyyy'); 
    }

    arraySearch.push(ssccSearch);
    arraySearch.push(itemSearch);
    arraySearch.push(printedOnSearch);
    //console.log('Looking for item code : ' + this.searchSSCC + ' - Picking Unit : ' + pickingUnitSearch);

    this.waitMessage =  '<b>Pallet label is usually taking less than a minute depending on the number of requested label processed</b>';
    this.subscription.push(this._queryService.getQueryResult(this.queryPalletLabel, arraySearch)
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

  selectionChange(indice) {
    console.log("indice :" , indice);
    for(let i=0; i < this.searchResult.length; i++) {
      if(i != indice && this.searchResult[i].Selected) {
        this.searchResult[i].Selected=false;
      }
    }
    this.selectedSSCC =Object.assign(this.searchResult[indice]);
  }

  copyReportToCentral() {
    /** Step 1 - Copy labels fron STOCK to /tmp */
    this._messageService.add({severity:'success', summary:'Start', detail: 'Collecting the pallet labels requests.....' });
    this._processService.executeScriptStock(this._userService.userInfo.mainEnvironment[0].initSH   + ';' +
      'cd /tmp/; rm -f R*; cd /home/hnpstk/log/; grep -l -r ' + this.selectedSSCC['SSCC'] + ' R* | xargs cp  -t /tmp/; chmod 777 /tmp/R*;')
    .subscribe( 
        data => { },
        error => {
              // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
              this.waitMessage='';
              this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
        },
        () => { 
              this.waitMessage='';
              /** Step 2 - Find file matching */
              for(let i =0; i < this.searchResult.length; i++) {
                let dataZPL;
                if(this.searchResult[i]['Selected']) {
                  this._uploadService.getFileStock('/tmp/','R' + this.searchResult[i]['PRINTED_AT'], this.searchResult[i]['SSCC'],false)
                  .subscribe( 
                    data => { console.log('data BLOB label :', data); },
                    error => {
                          // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                          this.waitMessage='';
                          this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                    },
                    () => {
                     
                        
                    });
                }
              }
              //this._uploadService.getFileStock(  + ';' + 'cp -p /home/hnpstk/log/R* /tmp/; chmod 777 /tmp/R*;')
        }
    );
    
  }

  
}