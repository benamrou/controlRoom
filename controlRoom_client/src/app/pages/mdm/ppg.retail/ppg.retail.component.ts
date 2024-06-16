import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ExportService, QueryService,  ProcessService, UserService, ImportService } from 'src/app/shared/services';
import { ConfirmEventType, ConfirmationService, Message, MessageService } from 'primeng/api';
import { FormControl, FormGroup, Validators } from '@angular/forms';


@Component({
	moduleId: module.id,
    selector: 'PPGRetail-cmp',
    templateUrl: './ppg.retail.component.html',
    providers: [MessageService, ExportService, QueryService, ProcessService],
    styleUrls: ['./ppg.retail.component.scss'],
    encapsulation: ViewEncapsulation.None
})


export class PPGRetailComponent {
  
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

  deptList = [];
  subDeptList = [];
  catList = [];
  subCatList = [];
  periodStart: string = '';
  periodEnd: string = '';
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

  queryLookUp='RET0000001'; /* Query to update data in item new/discontinued */

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
    this.screenID =  'SCR0000000032';
    _datePipe     = new DatePipe('en-US');
    this.dateNow = new Date();
    this.dateTomorrow =  new Date(this.dateNow.setDate(this.dateNow.getDate() + 1));
    
    this.adsOnly = true;

    this.columnsResult = [ 
      { field:'X', header: '', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:'PPG #', header: 'PPG #', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:'PPG desc.', header: 'PPG desc', align:'left', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:['Item code'], header: 'Item code',  align:'left', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:'SV', header: 'SV', align:'left', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:'Item desc', header: 'Item desc', align:'left', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:'Retail start', header: 'Retail start',  align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:'Retail end', header: 'Retail end', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:'UPC', header: 'UPC', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:'Retail', header: 'Retail', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true }
    ];

  }

  search() {
    this.searchResult = [];
    this.searchResultOriginal = [];

    let ppgCodeSearch;
    let adsOnlySearch;
    let arrayParam;
    this.razSearch();

    if (! this.searchCode) { ppgCodeSearch = '-1' }  else { ppgCodeSearch=this.searchCode }
    if (this.adsOnly) { adsOnlySearch = '1' }  else { adsOnlySearch='-1' }

    arrayParam = [];
    arrayParam.push(ppgCodeSearch);
    arrayParam.push(adsOnlySearch);
    arrayParam.push(this._datePipe.transform(this.periodStart, 'MM/dd/yyyy'));
    arrayParam.push(this._datePipe.transform(this.periodEnd, 'MM/dd/yyyy'));

    this._messageService.add({severity:'info', summary:'Info Message', sticky: true, closable: true, detail: 'Looking for the PPG retail...'});

    this.subscription.push(this._queryService.getQueryResult(this.queryLookUp, arrayParam)
            .subscribe( 
                data => {  
                    this.searchResult = data; 
                    this.searchResultOriginal = Object.assign([], this.searchResult);
                    for (let i=0; i < this.searchResult.length; i++) {
                      this.searchResult[i]['Selected'] = true;

                    }
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
    this._exportService.saveCSV(this.searchResult, null, null, null, "RET000000001", "Retail by PPG for deletion" ,
                                //this.recapButtonTooltip
                                '', formatXLS, true, 
                                freezePanel
                                );
  }


  unselectAll() {
    for (let i=0; i < this.searchResult.length; i++) {
      if (this.searchResult[i]['Selected']) {
        this.searchResult[i]['Selected'] = false;
      }
    }
  }


  selectAll() {
    for (let i=0; i < this.searchResult.length; i++) {
        this.searchResult[i]['Selected'] = true;
    }
  }

  deleteSelected(){

    this._confrmationService.confirm({
      message: 'Are you sure that you want to delete those future retails ?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      reject: (type) => {
        switch(type) {
            case ConfirmEventType.REJECT:
                this._messageService.add({severity:'error', summary:'Cancelled', detail:'Cancelled - Retail deletion hy PPG been cancelled.'});
            break;
            case ConfirmEventType.CANCEL:
                this._messageService.add({severity:'warn', summary:'Cancelled', detail:'Cancelled - Retail deletion hy PPG has been cancelled.'});
            break;
        }
        this.waitMessage='';
      },
      accept: () => {
        this.waitMessage =  'Executing the future retail deletion process by PPG... <br>'+
                            '<br><br>'+
                            '<b>This process is usually taking between 1 and 3 minutes</b>';
        let executionId;
        let updateFilename = 'RetailPPGDelete_' + this._userService.userInfo.username + this._datePipe.transform(this.dateNow, 'MMddyyyy');
        let userID;
        let disableTrace = 0;

        for(let i=0; i < this.searchResult.length; i++) {
          this.massUpdateSKURetail.push(
              {"ITEM_CODE": this.searchResult[i]['Item code'],
               "SV_CODE": this.searchResult[i]['SV'],
               "ACTION": 2, /* DELETION*/
               "PRICE_LIST": this.searchResult[i]['Price list code'],
               "START_DATE": this.searchResult[i]['Retail start'],
               "END_DATE": this.searchResult[i]['Retail end'],
               "RETAIL" : this.searchResult[i]['Retail price']
              }
            );
          }
          
        this.startDate = new Date(this.dateNow.setDate(this.dateNow.getDate() -2));
        /* Posting data to mass-update process */
        this._importService.postExecution(updateFilename, this.toolID_SKURetail,
                                          this._datePipe.transform(this.startDate,'MM/dd/yy'), 
                                          + disableTrace, // Implicit cast to have 1: True, 0: False
                                          + !this.scheduleFlag, // Implicit cast to have 1: True, 0: False
                                          this._datePipe.transform(this.dateNow,'MM/dd/yy HH:mm'), 
                                          JSON.stringify(this.massUpdateSKURetail),
                                          this.massUpdateSKURetail.length)
            .subscribe (data => {  
                                  executionId = data;
                                  console.log('executionId : ', executionId);
                              },
              error => { this._messageService.add({key:'top', sticky:false, severity:'error', summary:'Invalid file during execution plan load', detail: error }); 
                          this.waitMessage=''; },
              () => { 
                      // Execute the file
                      if(executionId.RESULT[0] < 0 ) {
                          this._messageService.add({key:'top', sticky:false, severity:'error', summary:'Execution failure', detail: executionId.MESSAGE[0] }); 
                          return;
                      }
                      /** Run the job integration */
                      this._importService.execute(executionId.RESULT[0]).subscribe 
                              (data => {  
                                  //console.log('data userID : ', data);
                                  userID = data[0].RESULT;
                        },
                        error => { this._messageService.add({key:'top', sticky:false, severity:'error', summary:'Invalid file during execution plan load', detail: error });               
                                  this.waitMessage=''; },
                        () =>    {  
                                  
                          this._messageService.add({key:'top', sticky:false, severity:'info', summary:'Step 3/4: Executing plan', detail: '"' + updateFilename + '" processing plan completed. Collecting  final integration result.'});
                          this._importService.executePlan(userID, this.toolID_SKURetail).subscribe( 
                                  data => {  },
                                  error => { this._messageService.add({key:'top', sticky:false, severity:'error', summary:'Execution issue', detail: error }); 
                                            this.waitMessage=''; },
                                  () => {
                                          this.displayCompletion = true;
                                          this._importService.collectResult(executionId.RESULT[0]).subscribe (
                                          data => { },
                                          error => { this._messageService.add({key:'top', sticky:false, severity:'error', summary:'Invalid file during execution plan load', detail: error }); 
                                                      this.waitMessage='';},
                                          () => { 
                                                                  this.waitMessage='';
                                                                  this.displayCompletion = true;
                                    });
                          }); 
                  });
          });
        }});
  }


  razSearch () {
    this.searchResult = [];
    this.selectedElement = null;
  }

}