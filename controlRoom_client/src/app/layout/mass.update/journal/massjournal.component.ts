import {Component, ViewEncapsulation, ViewChild, Input} from '@angular/core';
import {  WidgetService, ProcessService, TreeDragDropService, ParamService, ImportService, ExportService } from '../../../shared/services';
import { Dialog, SelectItem, Chips, Message, DataGrid, FullCalendar, TreeNode, Tree } from '../../../shared/components';
import { MessageService, ConfirmationService } from '../../../shared/components';
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
    selector: 'massjournal',
    templateUrl: './massjournal.component.html',
    providers: [ WidgetService, ProcessService, ParamService, MessageService, TreeDragDropService, ImportService, ExportService, ConfirmationService],
    styleUrls: ['./massjournal.component.scss', '../../../app.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class MassJournalComponent {

  @ViewChild('fc') fc: FullCalendar;
  @ViewChild('expandingTree')
  expandingTree: Tree;

  // Parameters
  // Parameter table list of mass change type
  pt_33: string = '33';
  pt_32: string = '32';
  pt_31: string = '31';

  pt_33_data: any [] = []; ; // Type mass-change
  pt_32_data: any [] = []; ; // Status
  pt_31_data: any [] = []; ; // Immediate/Schedule

   columnOptions: SelectItem[];
   trackIndex: number = 0;

  // Search result 
  searchResult : any [] = [];
  selectedElement: any;
  columnsResult: any [] = [];
  columsCollapseResult: any [] = [];

  // Search Panel
  searchExecutionID: string = '';
  searchScopeCode: string = '';
  searchExecutionDate: string = '';
  searchLoadingDate: string = '';

  columnsMyRepository: any [] = [];

  datePipe: DatePipe;
  dateNow: Date;
  dateTomorrow: Date;

  indexEdit: number;
  scopeEdit;
  immediateEdit;

  myRepository: TreeNode[] = [];
  selection: TreeNode;
  selectedNode: TreeNode;
  batchTobeAdded: any [] = [];

  addAllButtonStatus: string;

  filterOn: boolean = false;

  // Search action
   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries
   
   displayUpdateCompleted: boolean = false;
   displayEdit: boolean = false;
   msgDisplayed: String;
 
  msgs: Message[] = [];
  screenID

  constructor( private _messageService: MessageService, private _processService: ProcessService, 
               private _exportService: ExportService,
               private _confirmationService: ConfirmationService,
               private _importService: ImportService, private _paramService: ParamService) {
    this.screenID =  'SCR0000000009';
    this.datePipe     = new DatePipe('en-US');
    this.dateNow = new Date();
    this.dateTomorrow =  new Date(this.dateNow.setDate(this.dateNow.getDate() + 1));

    this._paramService.getParam(this.pt_33).subscribe(data => { this.pt_33_data = data; } );
    this._paramService.getParam(this.pt_32).subscribe(data => { this.pt_32_data = data; } );
    this._paramService.getParam(this.pt_31).subscribe(data => { this.pt_31_data = data; } );
    
  this.columsCollapseResult = [
    {header: '', colspan: 1, expand: 0, colspan_original: 1},
    {header: '', colspan: 1, expand: 0, colspan_original: 1},
    {header: '', colspan: 1, expand: 0, colspan_original: 1},
    {header: '', colspan: 1, expand: 0, colspan_original: 1},
    {header: '', colspan: 1, expand: 0, colspan_original: 1},
    {header: '', colspan: 1, expand: 0, colspan_original: 1},
    {header: 'Schedule', colspan: 4, expand: -1, colspan_original: 4},
    {header: '', colspan: 1, expand: 0, colspan_original: 1},
    {header: '', colspan: 1, expand: 0, colspan_original: 1},
    {header: '', colspan: 1, expand: 0, colspan_original: 1}
  ];

    this.columnsResult = [
      //{ field: 'JSONID', header: ' Execution Id' , expand: 0, display: true, main: true},
      { field: 'JSONFILE', header: 'Filename' , expand: 0, display: true, main: true},
      { field: 'USERNAME', header: 'ICR user' , expand: 0, display: true, main: true},
      { field: 'JSONENV', header: 'Environment' , expand: 0, display: true, main: true},
      { field: 'JSONTOOL', header: 'Scope' , expand: 0, display: true, main: true},
      { field: 'JSONSTEP', header: 'Step' , expand: 0, display: true, main: true},
      { field: 'JSONSTATUS', header: 'Status' , expand: 0, display: true, main: true},
      { field: 'JSONIMMEDIATE', header: 'Type' , expand: -1, display: true, main: true},
      { field: 'JSONDSCHED', header: 'Schedule date' , expand: 0, display: true, main: false},
      { field: 'JSONTRACE', header: 'Trace (XML)' , expand: 0, display: true, main: false},
      { field: 'JSONSTARTDATE', header: 'Start date' , expand: 0, display: true, main: false},
      { field: 'JSONDSAVE', header: 'Saved on' , expand: 0, display: true, main: true},
      { field: 'JSONDPROCESS', header: 'Executed on' , expand: 0, display: true, main: true},
      { field: 'JSONNBRECORD', header: 'Nb. record' , expand: 0, display: true, main: true},
      { field: 'JSONNBERROR', header: 'Nb. error' , expand: 0, display: true, main: true},
      // + Download file see HTML
      // + download errors see HTML
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
    //console.log('Looking for item code : ' + this.searchJobCode + ' - Picking Unit : ' + this.selectedPU);
    this.razSearch();
    this._messageService.add({severity:'info', summary:'Info Message', detail: 'Looking for execution in the mass change journal.' });
    let scopeId = this.pt_33_data.find(e => e.TENTRYDESC.toUpperCase() === this.searchScopeCode.toUpperCase());
    //console.log('scopeId', scopeId);
    if (scopeId === undefined) { scopeId='';} else {scopeId =  scopeId.PARAMENTRY}
    this._importService.getJournal(this.searchExecutionID ,   scopeId, 
                                    this.searchLoadingDate, this.searchExecutionDate,1)
    .subscribe( 
        data => { this.searchResult = data; // put the data returned from the server in our variable
        },
        error => {
              // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
              this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
        },
        () => {this._messageService.add({severity:'warn', summary:'Info Message', detail: 'Retrieved ' + 
                             this.searchResult.length + ' reference(s).'});

               console.log(JSON.stringify(this.searchResult));  
        }
    );
  
  }

  razSearch () {
    this.searchResult = [];
    this.selectedElement = null;
  }

  downloadFile(id, isError) {
    //console.log ('Downloading...', id, this.searchResult)
    if (isError) {
      this._exportService.saveCSV(JSON.parse(this.searchResult[id].JSONERROR), null, null, null, 
                                  'MASSCHANGE_' + this.searchResult[id].JSONID, 
                                  'Mass Change execution report REJECTION', 'Process ' + this.searchResult[id].JSONID + ' running the EXCEL file ' + this.searchResult[id].JSONFILE +  ' has been executed on ' +
                                  this.searchResult[id].JSONDPROCESS + ' by ' + this.searchResult[id].USERNAME + ' - Nb error: ' + this.searchResult[id].JSONNBERROR);
    }
    else {
      this._exportService.saveCSV(JSON.parse(this.searchResult[id].JSONCONTENT), null, null, null, 
                                  'MASSCHANGE_' + this.searchResult[id].JSONID, 
                                  'Mass Change execution report', 'Process ' + this.searchResult[id].JSONID + ' running the EXCEL file ' + this.searchResult[id].JSONFILE +  ' has been executed on ' +
                                  this.searchResult[id].JSONDPROCESS + ' by ' + this.searchResult[id].USERNAME);

    }
  }

  expandColumn(indice: number) {
    //console.log ('expandColumnCaoMissing : ' + indice);
    this.columsCollapseResult[indice].expand = this.columsCollapseResult[indice].expand * -1;
    let j = 0;
    for(let i = 0; i < this.columsCollapseResult.length; i++) {
      if(i === indice) {
        if(this.columsCollapseResult[indice].expand === -1) {
          this.columsCollapseResult[indice].colspan = this.columsCollapseResult[indice].colspan_original;
        }
        else {
          this.columsCollapseResult[indice].colspan = 1;
        }
        for(let k=j; k < this.columsCollapseResult[indice].colspan_original+j; k++) {
          if (this.columnsResult[k].main === false) {
            if (this.columsCollapseResult[indice].expand === -1) {
              this.columnsResult[k].display = true;
            }
            if (this.columsCollapseResult[indice].expand === 1) {
              this.columnsResult[k].display = false;
            }
          }
        }
      }
      else {
        j = j + this.columsCollapseResult[i].colspan_original;
      }
    }
    //console.log('Structure ', this.columnsResult, this.columsCollapseResult);
  }

/**
 * Cancel a scheduled execution
 * @param index 
 */
  cancelExecution(index) {
    let pt_32_2 = 2 /* Cancelled status */
    let pt_32_2_desc = this.pt_32_data.find(e => e.PARAMENTRY === pt_32_2);

    this._confirmationService.confirm({
      message: 'Are you sure that you want to cancel "' + this.searchResult[index].JSONFILE + '" execution ?',
      header: 'Confirmation',
      icon: 'fas fa-exclamation-triangle',
      accept: () => {
                      this._messageService.add({severity:'info', summary:'Info Message', detail: 'Cancelling "' +   this.searchResult[index].JSONFILE + '" schedule plan'});
                      this._importService.updateJournal(this.searchResult[index].JSONID, 
                                                        this.searchResult[index].JSONFILE, 
                                                        this.datePipe.transform(this.searchResult[index].JSONSTARTDATE,'MM/dd/yy'),
                                                        this.searchResult[index].JSONTRACE, 
                                                        this.searchResult[index].JSONIMMEDIATECODE,
                                                        this.datePipe.transform(this.searchResult[index].JSONDSCHED,'MM/dd/yy hh:mm'),
                                                        pt_32_2 )
                                                .subscribe( 
                                                data => { },
                                                error => {
                                                // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                                                this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                                                },
                                                () => {
                                                  this.searchResult[index].JSONSTATUSCODE = pt_32_2;
                                                    this.searchResult[index].JSONSTATUS = pt_32_2_desc.TENTRYDESC;
                                                    this._messageService.add({severity:'warn', summary:'Info Message', detail: 'File' +   this.searchResult[index].JSONFILE + ' has been cancelled'});
                                                    this.displayEdit=false;
                                                  }
                                    );
          },
          reject: () => {
              this._messageService.add({severity:'info', summary:'Info Message', detail: 'Cancelling "' +   this.searchResult[index].JSONFILE + '" aborded'});
          }

        });
  }


  /**
   * Update a scheduled execution
   * @param index 
   */
    updateExecution(index) {
      this._messageService.add({severity:'info', summary:'Info Message', detail: 'Updating "' +   this.searchResult[index].JSONFILE + '" schedule plan'});
      this._importService.updateJournal(this.searchResult[index].JSONID, 
                                        this.searchResult[index].JSONFILE, 
                                        this.datePipe.transform(this.searchResult[index].JSONSTARTDATE,'MM/dd/yy'),
                                        + this.searchResult[index].JSONTRACE,  // + dsign to switch from TRUE to 1 and FALSE to 0
                                        this.searchResult[index].JSONIMMEDIATECODE,
                                        this.datePipe.transform(this.searchResult[index].JSONDSCHED,'MM/dd/yy HH:mm'),
                                        this.searchResult[index].JSONSTATUSCODE )
                                .subscribe( 
                                data => { },
                                error => {
                                // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                                this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                                },
                                () => {
                                  this._messageService.add({severity:'warn', summary:'Info Message', detail: 'File' +   this.searchResult[index].JSONFILE + ' has been updated'});
                                  this.displayEdit=false;
                                }
                  );
    }


    /**
     * Update a scheduled execution
     * @param index 
     */
    runExecution(index) {
      /** Run the job integration */
      let userID;
      let pt_32_1 = 1 /* Completed status */
      let pt_32_1_desc = this.pt_32_data.find(e => e.PARAMENTRY === pt_32_1);

      this._confirmationService.confirm({
        message: 'Are you sure that you want to run "' + this.searchResult[index].JSONFILE + '" execution ?',
        header: 'Confirmation',
        icon: 'fas fa-exclamation-triangle',
        accept: () => {
            this.displayEdit=false;
            this._messageService.add({severity:'warn', summary:'Step 1/4: Executing plan', detail:  this.searchResult[index].JSONFILE + ' processing plan is now being executed.'});
            this._importService.execute( this.searchResult[index].JSONID).subscribe 
                    (data => {  
                        console.log('data userID : ', data);
                        userID = data[0].RESULT;
                    },
                    error => { 
                      this._messageService.add({severity:'error', summary:'Invalid file during execution plan load', detail: error }); },
                    () =>    {  
                                
                        this._messageService.add({severity:'info', summary:'Step 2/4: Executing plan', detail: '"' + this.searchResult[index].JSONFILE  + '" processing plan completed. Collecting  final integration result.'});
                        this._importService.executeItem(userID).subscribe( 
                                data => {  },
                                error => { this._messageService.add({key:'top', severity:'error', summary:'Execution issue', detail: error }); },
                                () => {  this._importService.collectResult(this.searchResult[index].JSONID).subscribe (
                                        data => {  },
                                        error => { this._messageService.add({key:'top', severity:'error', summary:'Invalid file during execution plan load', detail: error }); },
                                        () => { 
                                          this._messageService.add({severity:'info', summary:'Step 3/4: Executing plan', detail:  '"' + this.searchResult[index].JSONFILE  + '" processing plan results collected.'});
                                          this._messageService.add({severity:'info', summary:'Step 4/4: Executing plan', detail:  '"' + this.searchResult[index].JSONFILE  + '" has been successfully processed.'});
                                          this.searchResult[index].JSONNBERROR ='Need Refresh';
                                          this.searchResult[index].JSONSTATUSCODE = pt_32_1;
                                          this.searchResult[index].JSONSTATUS = pt_32_1_desc.TENTRYDESC;

                                          this.msgDisplayed = this.searchResult[index].JSONFILE  + ' - ' + ' has been successfully processed.';
                                          this.displayUpdateCompleted = true;
                                        });
                                    });
                            }); 
                            
          },
          reject: () => {
              this._messageService.add({severity:'info', summary:'Info Message', detail: 'Cancelling "' +   this.searchResult[index].JSONFILE + '" execution'});
          }
        });
    
    }

    editExecutionPlan(index) {
      let MS_PER_MINUTE = 60000;
      this.indexEdit = index;
      this.dateNow = new Date( new Date().getTime() + 5*MS_PER_MINUTE);
      this.scopeEdit = this.pt_33_data.find(e => e.PARAMENTRY === this.searchResult[index].JSONTOOLCODE);
      this.immediateEdit = this.pt_31_data.find(e => e.PARAMENTRY === this.searchResult[index].JSONIMMEDIATECODE);
      this.displayEdit = true;


    }

}