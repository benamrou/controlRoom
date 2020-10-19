import {Component, OnDestroy, OnInit} from '@angular/core';
import {ViewEncapsulation } from '@angular/core';
import {DatePipe } from '@angular/common';
import { CountingService, CountResult, Count, CountStep } from '../../../shared/services/index';
import { ProcessService, ProcessData } from '../../../shared/services/index';
import { MovementData, Movement } from '../../../shared/services/index';
import { RejectionData, Rejection } from '../../../shared/services/index';
import { SelectItem, Chips, Message, DataGrid } from '../../../shared/components/index';
import { MessageService } from '../../../shared/components/';
import { interval } from 'rxjs';
import { takeWhile } from 'rxjs/operators';


@Component({
	moduleId: module.id,
    selector: 'counting-cmp',
    templateUrl: './counting.component.html',
    providers: [CountingService, ProcessService, MessageService],
    styleUrls: ['./counting.component.scss', '../../../app.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class CountingComponent implements OnDestroy {
   
   screenID;
   columnOptions: SelectItem[];

  // Search result 
   searchResult : CountResult = new CountResult();
   search_STEP2_Result : Count = new Count();
   search_STEP3_Result : CountStep = new CountStep();
   columnsResult: any [] = [];
   columnsResultMVT: any [] = [];
   columnsResultRejection: any [] = [];
   performedResearch: boolean = false;
   countingDate: any;
   overallPercentage: number;

   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries

  // Search action
   searchCode: string = '';
   // Selected element
   selectedElement: Count;

  //movementData
  movementData: MovementData;
  //rejectionData
  rejectionData: RejectionData;

  subscription: any[] = [];
  runEvery;
  runEverySubscription;
  isCompleted : boolean = false;

  // Progress gathering data
  isCountingDetailInqueryPerformed: boolean = false;
  messageProgress: string = 'Collecting inventory detail information ';

  // alerts display on control bacth and integration
  alerts: Array<Array<Object>> = [
    [{type: 'info', msg: 'STEP 0 - Sales upload check '}],
    [{type: 'info', msg: 'STEP 1 - Counting file upload check '}],
    [{type: 'info', msg: 'STEP 2 - Counting file has been mapped with GOLD '}],
    [{type: 'info', msg: 'STEP 3 - Counting has been integrated in GOLD '}],
    [{type: 'info', msg: 'STEP 4 - Counting has been validated in GOLD. Inventory is updated. '}],
    [{type: 'info', msg: 'CONTROL - Check in-between operations prior to the counting integration. '}],
  ];

  constructor(private _countingService: CountingService, private _processService: ProcessService, 
              private _messageService: MessageService) {

    // The screen ID 
    this.screenID =  'SCR0000000007';
    
    this.columnsResult = [
      { field: 'company', header: 'Third-Party' },
      { field: 'inventorydate', header: 'Counting date' },
      { field: 'sitefulldescription', header: 'Store' },
      { field: 'totalcount', header: 'Nb of references counted' }
    ];

    this.columnsResultMVT = [
      { field: 'SITE', header: 'Store #' },
      { field: 'USER', header: 'User' },
      { field: 'TMVT', header: 'Movement Type' },
      { field: 'DESC', header: 'Mvt. Description' },
      { field: 'ITEM', header: 'Item code' },
      { field: 'ITEMDESC', header: 'Description'},
      { field: 'QTY', header: 'Quantity' },
      { field: 'UPDATEDAT', header: 'Movement date' }
    ];

    this.columnsResultRejection = [
      { field: 'FILE', header: 'Filename'},
      { field: 'LINE', header: 'Line number' },
      { field: 'SITE', header: 'Store number' },
      { field: 'UPC', header: 'UPC' },
      { field: 'ITEM', header: 'Item code' },
      { field: 'ITEMDESC', header: 'Item Description' },
      { field: 'QTY', header: 'Quantity' },
      { field: 'TRT', header: 'Treatment code'},
      { field: 'NERR', header: 'Error number'},
      { field: 'MESS', header: 'Message error'}
    ];
  }

  search() {
    //this.searchCode = searchCode;
    let datePipe = new DatePipe('en-US');
    let searchDate;
    this.razSearch();
    if (this.countingDate != null) {
      searchDate = datePipe.transform(this.countingDate, 'MM/dd/yyyy');
      this._messageService.add({severity:'info', summary:'Info Message', detail: 'Looking for counting on : ' + 
                      JSON.stringify(searchDate) });
    } else {
      this._messageService.add({severity:'info', summary:'Info Message', detail: 'Looking for all the countings.'});    
      searchDate = '-1'
    }
    this.subscription.push(this._countingService.getCountingIntegrationInfo_STEP1(searchDate)
            .subscribe( 
                data => { if (data.counts.length > 0) {
                    this.searchResult = data; // put the data returned from the server in our variable
                   //console.log('data: ' + JSON.stringify(data));
                }
                //console.log(JSON.stringify(this.searchResult));  
                this.performedResearch = true;
              },
                error => {
                      console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                      this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                },
                () => {this._messageService.add({severity:'warn', summary:'Info Message', detail: 'Retrieved ' + 
                                     this.searchResult.counts.length + ' reference(s).'});
                }
            ));
  }

  razSearch () {
    this.searchResult.counts = [];
    //this.alerts = [[{}],[{}],[{}],[{}], [{}]];
  }

  handleRowSelect(event) {
    // Gather the others data for the counting
    let datePipe = new DatePipe('en-US');
    this.alerts = [[],[],[],[],[],[]];
    this.rejectionData = null;
    this.movementData = null;

    this.isCompleted = true; // End previous row selection
    this.isCompleted = false;
    this.ngOnDestroy();
    
    this.isCountingDetailInqueryPerformed = true;
    this._messageService.add({severity:'info', summary:'Info Message', detail: 'Gathering information for counting on store ' + event.data.site});
    this.getGOLDIntegration(datePipe.transform(event.data.inventorydate, 'MM/dd/yyyy'), event.data.site, event.data.filename);
    
    //this.runEvery = interval(10000);

    this.runEverySubscription = interval(10000).pipe(takeWhile(() => !this.isCompleted)).subscribe(val => {
                                                                      this.getGOLDStep(datePipe.transform(event.data.inventorydate, 'MM/dd/yyyy'), 
                                                                      event.data.site, event.data.filename);
                            });
    
    this.checkStep1_PICSLoadProcess(this.selectedElement);

    this.getGOLDStep(datePipe.transform(event.data.inventorydate, 'MM/dd/yyyy'), event.data.site, event.data.filename);
    
    //this.checkAlert(this.selectedElement, this.search_STEP2_Result, this.search_STEP3_Result, 
    //                datePipe.transform(event.data.inventorydate, 'MM/dd/yyyy'), event.data.site);
    this._messageService.add({severity:'warn', summary:'Info Message', detail: 'Counting data retrieved'});
  }

  getGOLDIntegration(countingDate: string, site: string, filename: string) {
    let datePipe = new DatePipe('en-US');
    this.subscription.push(this._countingService.getCountingIntegrationInfo_STEP2(countingDate, site, filename)
            .subscribe( 
                data => { this.search_STEP2_Result = data; 
                this.overallPercentage = 1 - (this.search_STEP2_Result.failure.total+this.selectedElement.failure.total + this.selectedElement.unknown.total)
                                         /this.selectedElement.totalcount;
                this.checkStep0_SaleUpload(countingDate, site);
                this.check_MovementInBetween(countingDate, site, filename);
                this.getRejection(countingDate, site, filename);
                }, // put the data returned from the server in our variable
                error => {
                      console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                      this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                },
                () => {}
            ));
  }

  getGOLDStep(countingDate: string, site: string, filename: string) {
    console.log('Runnin GOLD Step');
    let datePipe = new DatePipe('en-US');
   let stepSubscribe = this._countingService.getCountingIntegrationInfo_STEP3(countingDate, site, filename)
            .subscribe( 
                data => { this.search_STEP3_Result = new CountStep();
                          this.search_STEP3_Result = data; 
                          this.checkStep2_GOLDProcess(this.search_STEP3_Result);
                          this.checkStep3_GOLDProcess(this.search_STEP3_Result);
              }, // put the data returned from the server in our variable
                error => {
                      console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                      this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                },
                () => { 
                  console.log('this.search_STEP3_Result :', this.search_STEP3_Result );
                  if (this.search_STEP3_Result.progressStockUpdate >= 1) {
                    stepSubscribe.unsubscribe();
                    this.isCompleted = true;
                 }
                 else {  this.subscription.push(stepSubscribe);}
                }
            );
  }


/**
 * @method checkStep0_SaleUpload 
 * @param countingDate
 * @param site 
 */
 checkStep0_SaleUpload (countingDate: string, site: string) {
  let processData: ProcessData;
  this.subscription.push(this._processService.getBatchDuration('pssti12p',' 10 ' + site + ' ', countingDate)
            .subscribe( 
                data => { processData = data; 
                this.alerts[0] = [];
                if (processData.processes.length > 0) {
                  for (let i=0; i < processData.processes.length; i++) {
                    
                    this.alerts[0].push({ type: 'success', msg: 'STEP 0 - Sale upload PSSTI12P program ran for store ' + 
                                      site + ' with parameters ' +  
                                      processData.processes[i].PARAMETER +  ' during ' +
                                      processData.processes[i].DURATION + ' at ' + processData.processes[i].STARTAT });  
                  }
                }
                else {
                    this.alerts[0] = [{ type: 'danger', msg: 'STEP 0 - Sale upload program didn\'t run for the store ' + site + '...'}];
                }}, // put the data returned from the server in our variable
                error => {
                      console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                      this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                },
                () => {}
            ));
 }

/**
 * @method checkStep1_PICSLoadProcess 
 * @param counting 
 */
 checkStep1_PICSLoadProcess (counting: any) {
   // Check if file has been uploaded
   //console.log(' Counting PICSLoadProcess : ' + JSON.stringify(counting));
    if (counting.totalcount === 0) {
      this.alerts[1] = [];
      this.alerts[1].push({ type: 'info', msg: 'STEP 1 - ' + counting.company + ' has not been uploaded...'});
    } else {
      this.alerts[1] = [];
      this.alerts[1].push({ type: 'success', msg: 'STEP 1 - ' + counting.company + ' has been uploaded in the staging table at ' +
                                                  counting.createdat });
    }
    // Check if the counting file has been processed
    if (counting.tobeprocessed.total > 0) {
      this.alerts[2] = [];
      this.alerts[2].push({ type: 'danger', msg: 'STEP 2 - ' + counting.company + ' integration/mapping not completed - ' + 
                                                 counting.tobeprocessed.total + ' record(s) to be processed...'});
    }
    if (counting.success.total > 0) {
      this.alerts[2] = [];
      this.alerts[2].push({ type: 'success', msg: 'STEP 2 - ' + counting.company + ' integration/mapping has been completed at ' +
                                                  counting.success.updatedat });
    } 
 }

 /**
 * @method checkStep2_GOLDProcess 
 * @param counting 
 */
 checkStep2_GOLDProcess (countingStepGOLD: any) {
   // Check if file has been uploaded
    if (countingStepGOLD.initialisation === 0) {
      this.alerts[3] = [];
      this.alerts[3].push({ type: 'info', msg: 'STEP 3 - Counting has not been integrated...'});
    } else {
      this.alerts[3] = [];
      this.alerts[3].push({ type: 'success', msg: 'STEP 3 - Counting has been initialised in GOLD at ' + 
                                           countingStepGOLD.initialisationdate + ' ...'});
    }
 }

/** 
 * @method checkStep3_GOLDProcess 
 * @param counting Step in GOLD
 */
 checkStep3_GOLDProcess (countingStepGOLD: any) {
   // Check if file has been uploade
   //console.log('countingStepGOLD: '  + JSON.stringify(countingStepGOLD));
    if (countingStepGOLD.stkupdate === 0) {
      this.alerts[4] = [];
      this.alerts[4].push({ type: 'info', msg: 'STEP 4 - Counting has NOT been validated...'});
    } else {
      this.alerts[4] = [];
      this.alerts[4].push({ type: 'success', msg: 'STEP 4 - Counting has been validated. Inventory layers have been updated at ' +
                                           countingStepGOLD.stkupdatedate + ' ...'});
    }
 }

 /**
 * @method check_MovementInBetween 
 * @param countingDate
 * @param site 
 */
 check_MovementInBetween (countingDate: string, site: string, filename: string) {
  this.subscription.push(this._countingService.getMovementsInBetween(countingDate, site, filename)
            .subscribe( 
                data => { this.movementData = data; 
                  this.alerts[5] = [];
                if (this.movementData.movements.length > 0) {
                  if (this.movementData.movements.length > 0 ) {
                    this.alerts[5].push({ type: 'warning', msg: 'CONTROL - ' + this.movementData.movements.length + 
                                        ' inventory operation(s) performed in-between the counting and the integration - '});  
                    }
                  }
                else {
                    this.alerts[5].push({ type: 'success', msg: 'CONTROL - No in-between operations prior to the counting integration.'});
                }}, // put the data returned from the server in our variable
                error => {
                      console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                      this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                },
                () => {}
            ));
 }


 /**
 * @method getRejection 
 * @param countingDate
 * @param site 
 */
 getRejection (countingDate: string, site: string, filename: string) {
  this.subscription.push(this._countingService.getRejection(countingDate, site, filename)
            .subscribe( 
                data => { this.rejectionData = data; }, // put the data returned from the server in our variable
                error => {
                      console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                      this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                },
                () => {}
            ));
 }

  ngOnDestroy() {
    for(let i=0; i< this.subscription.length; i++) {
      this.subscription[i].unsubscribe();
    }
    this.isCompleted = true;
  }
}

