import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ExportService, QueryService,  ProcessService, UserService, ImportService } from 'src/app/shared/services';
import { ConfirmEventType, ConfirmationService, Message, MessageService } from 'primeng/api';
import { FormControl, FormGroup, Validators } from '@angular/forms';


@Component({
	moduleId: module.id,
    selector: 'EcomerceDesc-cmp',
    templateUrl: './ecommerce.desc.component.html',
    providers: [MessageService, ExportService, QueryService, ProcessService],
    styleUrls: ['./ecommerce.desc.component.scss'],
    encapsulation: ViewEncapsulation.None
})


export class EcommerceDescComponent {
  
   msgs: Message[] = [];
   msgDisplayed: string;
   displayProcessCompleted: boolean;
   displayNewVendor: boolean;
   values: string [] = [];
   //msgs: Message[] = [];

   searchResultOriginal : any [] = [];
   searchResult : any [] = [];
   resultValidate : any [] = [];
   selectedElement: any[] = [];
   columnsResult: any [] = [];
   columnsSchedule: any [] = [];
   activeValidateButton: boolean = false;

   screenID;
   waitMessage: string = '';
   displayCompletion: boolean=false;


  // Search action
  searchCode: string = '';
  searchStoreCode: string = '';
  adsOnly: boolean = true;

  searchDept: any = [];
  searchSubDept: any = [];
  searchCat: any = [];
  searchSubCat: any = [];
  arraySearchCode;

  okExit: boolean = false;

  massUpdateSKURetail: any = [];

  dateNow: Date;
  dateTomorrow : Date;

  toolID_SKURetail = 12 /** parameter 33 */
  startDate;
  scheduleDate;
  defaultStartDate;
  scheduleFlag;
  itemTrace;
  messageValidation='';

  queryLookUp='ECO0000001'; /* Query to update data in item new/discontinued */

  // Completion handler
  displayUpdateCompleted: boolean;
  displayError = '';


  newVendorForm = new FormGroup({
    newVendor_field: new FormControl('', [Validators.required, Validators.minLength(5)])
  });

  // Request subscription
  subscription: any[] = [];

  constructor(private _messageService: MessageService,
              private _queryService: QueryService,
              private _importService: ImportService,
              private _processService: ProcessService,
              private _userService: UserService,
              private _confrmationService: ConfirmationService,
              private _exportService: ExportService,
              private _datePipe: DatePipe) {
    this.screenID =  'SCR0000000036';
    _datePipe     = new DatePipe('en-US');
    this.dateNow = new Date();
    this.dateTomorrow =  new Date(this.dateNow.setDate(this.dateNow.getDate() + 1));
    
    this.adsOnly = true;

    this.columnsResult = [ 
      { field:'Item code', header: 'Item #', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:'SV', header: 'SV', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:'Item desc', header: 'Item desc', align:'left', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:'UPC', header: 'UPC',  align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:'eCommerce desc', header: 'eCommerce description', align:'left', type: 'input', options: [],expand: 0, format: false, display: true, main: true }
    ];

  }

  search() {
    this.searchResult = [];
    this.searchResultOriginal = [];

    let itemCodeSearch;
    let arrayParam;
    this.razSearch();

    if (! this.searchCode) { itemCodeSearch = '-1' }  else { itemCodeSearch=this.searchCode }

    arrayParam = [];
    arrayParam.push(itemCodeSearch);

    this._messageService.add({severity:'info', summary:'Info Message', sticky: true, closable: true, detail: 'Looking for the eCommerce description...'});

    this.subscription.push(this._queryService.getQueryResult(this.queryLookUp, arrayParam)
            .subscribe( 
                data => {  
                    this.searchResult = data; 
                    this.searchResultOriginal = Object.assign([], this.searchResult);
                    console.log('data:', data);
                }, // put the data returned from the server in our variable
                error => {
                      // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                      this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                },
                () => {this._messageService.add({severity:'warn', summary:'Info Message', detail: 'Retrieved ' + 
                                     this.searchResult.length + ' reference(s).'});
                       this.waitMessage = '';
                }));

    }
    /**
   * function onRowSelect (Evemt on schedule se4lection) 
   * When User selects a supplier schedule, this function copies the schedule to potential temporary schedule.
   * @param event 
   */
    onRowSelect(event) {
        //this.processReviewSchedule = true;
      }


  exportExcelRecap() {
    let formatXLS = {}
    let freezePanel = {"ALTROWCOLUMN" : 4}
    this._exportService.saveCSV(this.searchResult, null, null, null, "RET000000001", "eCommerce description" ,
                                //this.recapButtonTooltip
                                '', formatXLS, true, 
                                freezePanel
                                );
  }


  razSearch () {
    this.searchResult = [];
    this.selectedElement = null;
  }

}