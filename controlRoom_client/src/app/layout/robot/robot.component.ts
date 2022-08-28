import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SelectItem, Chips, Message, FullCalendar } from '../../shared/components/index';
import { RobotService, MessageService, ExportService, QueryService, ReportDiagnostic,
        ProcessService, 
        DiagnosticSolution} from '../../shared/services/index';
import { ItemComponent } from '../../shared/cards';
import { ExecOptionsWithStringEncoding } from 'child_process';
import { report } from 'process';


@Component({
	moduleId: module.id,
    selector: 'robot-cmp',
    templateUrl: './robot.component.html',
    providers: [RobotService, MessageService, ExportService, QueryService, ProcessService],
    styleUrls: ['./robot.component.scss'],
    encapsulation: ViewEncapsulation.None
})


export class RobotComponent {
  
  @ViewChild('fc') fc: FullCalendar;
  // Robot action
   values: string [] = [];
   //msgs: Message[] = [];

   screenID;

  // Robot result 
   searchResult : any [] = [];
   columnsDiag: any [] = [];
   columnsControl: any [] = [];
   columnsResult: any [] = [];

   msgClass = 'alert alert-info'; // style class to be displayed
   msgIconClass = 'fas fa-exclamation-circle';
   msgOriginal;
   msgDisplay = 'By default all the diagnostic categories are selected. Readjust the filter selection if you want the tool to focus on a particular domain.';

   deactivateAll = false;
   
   selectedCategories;
   AllCategories;
   diagnosticList = [];
   diagnosticByCategories;
   activeDomain;
   diagListIssue = 0;

   reportDiag: ReportDiagnostic[];

   combinedIssues =  0;
   combinedStatus = 0; // 0: Not run, 1: no issues, 2, issues found

   displayPopup = {
                      doDiag : false,
                      doneDiag: false,
                      doFix : false,
                      doneFix: false,
                      display : false,
                      index: -1
                    }

   // Selected element
   selectedElement = {};
   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries

   // Indicator to check the first research
   performedResearch: boolean = false;

  // Indicator for sub-panel detail
  itemDetail: boolean = false;

  constructor(private _robotService: RobotService, private _messageService: MessageService,
              private _exportService: ExportService,
              private _queryService: QueryService,
              private _processService: ProcessService,
              private _datePipe: DatePipe) {
    this.screenID =  'SCR0000000014';

    this.msgOriginal = this.msgDisplay;
    this.columnsDiag = [
      { field: 'diagId', header: '#', width: '10%', textalign: 'left' },
      { field: 'diagInfo', header: 'Description', width: '35%', textalign: 'left' },
      { field: 'commentInfo', header: 'Comment', width: '35%', textalign: 'left' },
      { field: 'nbChecks', header: 'Controls', width: '6%', textalign: 'lecenterft' },
      { field: 'status', header: 'Status', width: '6%', textalign: 'center' },
      //{ field: 'result', header: 'Result', width: '6%', textalign: 'left' },
      { field: 'enableCheck', header: 'Enable', width: '6%', textalign: 'center' }
    ];

    this.columnsControl = [
      { field: 'checkId', header: '#', width: '10%', textalign: 'left' },
      { field: 'checkInfo', header: 'Description', width: '50%', textalign: 'left' },
      { field: 'checkLevelDesc', header: 'Severity', width: '10%', textalign: 'left' },
      { field: 'status', header: 'Status', width: '10%', textalign: 'left' },
      { field: 'result', header: 'Result', width: '10%', textalign: 'left' },
      { field: 'checked', header: 'Enable', width: '10%', textalign: 'center' }
    ];


    // Get domain list diagnostic
    this._robotService.getDiagnosticDomain()
    .subscribe( 
        data => { 
                  this.selectedCategories = data; 
                  for (let i=0; i < this.selectedCategories.length; i++) {
                    this.selectedCategories[i].count=0;
                    this.selectedCategories[i].selected=false;
                    this.selectedCategories[i].deactivated=false;
                  }
                  this.AllCategories = this.selectedCategories;
                  console.log('this.AllCategories', this.AllCategories);
                   // Get domain list diagnostic
                  this.diagnosticByCategories = data;
                  this._robotService.getDiagnosticListWithControl('-1').subscribe( 
                    data => { 
                      this.diagnosticList = data; 
                      this.diagListIssue =0;
                      let index=-1;
                      let findSelected = false;
                      for (let i=0; i < this.diagnosticList.length; i++) {
                        index = this.AllCategories.findIndex(x => x.entryId == this.diagnosticList[i].diagDomain);
                        console.log('this.diagnosticList:', this.diagnosticList[i]);
                        if (index < 0) {
                          this.diagListIssue =1;
                          this._messageService.add({severity:'error', summary:'Domain not found.', 
                                                    detail: 'Domain list is not accessible' });
                        }
                        else {
                          this.AllCategories[index].count = this.AllCategories[index].count +1;
                          if (!findSelected) {
                            this.activeDomain = index;
                            findSelected = true;
                          }
                        }
                      }
                    },
                    error => { this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });},
                    () => {
                    }
                   );

      },
        error => {
              // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
              this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
        },
        () => {}
    );

  }
  

  search() {
    this._messageService.add({severity:'info', summary:'Info Message', sticky: true, closable: true, detail: 'Looking for the elements : ' + JSON.stringify(this.values)});
    this.searchButtonEnable = false; 

  }

  selectDiagDetail(index) {
    this.displayPopup.index = index;
    this.displayPopup.display = true;
  }

  deactivateCategorySelection(indexSelected?) {
    //console.log("DeactivaAll : ", this.deactivateAll, this.selectedCategories);

    for(let i=0; i < this.AllCategories.length;i++) {
      if (indexSelected < 0 ) {
        this.AllCategories[i].deactivated = true;
        this.selectedCategories = [];
      }
      this.AllCategories[i].count = 0;
    }
    if (indexSelected >= 0 ) {
      this.AllCategories[indexSelected].deactivated = ! this.AllCategories[indexSelected].deactivated;
    }

    let findSelected = false;
    for (let i=0; i < this.diagnosticList.length; i++) {
      let index = this.AllCategories.findIndex(x => x.entryId == this.diagnosticList[i].diagDomain);
      if (index < 0) {
        this.diagListIssue =1;
      }
      else {

        this.AllCategories[index].count = this.AllCategories[index].count +1;
        if (!findSelected && !this.AllCategories[index].deactivated) {
          this.activeDomain = index;
          findSelected = true;
        }
      }
      if (indexSelected < 0 ) { this.diagnosticList[i].checked = ! this.diagnosticList[i].checked }
      if (indexSelected >= 0 && index == indexSelected) { this.diagnosticList[i].checked = ! this.diagnosticList[i].checked }
    }
  }

  /**
   * Run diagnostic
   */
  async executeDiagnostic() {
    console.log('Start diag');
    
    this.msgDisplay = 'Executing diagnostic'
    this.msgClass ='alert alert-warning';

    let dateCheck=new Date();
    let dateExecutionCheck =this._datePipe.transform(dateCheck, 'MM/dd/yyyy h:mm a');
    this.combinedIssues = 0;
    this.combinedStatus = 1;
    this.reportDiag = [];
    let reportCheck;
    for(let i=0; i < this.diagnosticList.length; i++) {
      if (this.diagnosticList[i].checked) {
        for (let j=0; j < this.diagnosticList[i].checks.length; j++) {
          reportCheck = this.initializeReport(new ReportDiagnostic());
          reportCheck['Diag #'] = this.diagnosticList[i].diagId;
          reportCheck['Info'] = this.diagnosticList[i].diagInfo;
          reportCheck['Domain']= this.diagnosticList[i].diagDomainDesc;
          reportCheck['Comment'] = this.diagnosticList[i].commentInfo;
          reportCheck['Diag status'] = this.diagnosticList[i].diagStatus;
          if (this.diagnosticList[i].checks[j].checked) {
            //execute SQL to capture the invalid data
            this.diagnosticList[i].statusInfo = 0;
            this.diagnosticList[i].status = 1;
            this.columnsDiag[4].header ='Issues';
            this.columnsControl [3].header = 'Issues';
            switch (this.diagnosticList[i].checks[j].checkType) {
              case 1: // execute SQL
                let data = await this._queryService.getQuerySQLResult(this.diagnosticList[i].checks[j].checkSQL, 0).toPromise(); 
                console.log('diag check data:', data) 
                this.diagnosticList[i].checks[j].result = data;
                if(this.diagnosticList[i].checks[j].result.length == 0 ){
                  this.diagnosticList[i].checks[j].status=1;
                }
                else {
                  this.diagnosticList[i].checks[j].status=2;
                  this.diagnosticList[i].status = 2;
                  this.combinedStatus = 2;
                }
                this.diagnosticList[i].statusInfo = this.diagnosticList[i].statusInfo + this.diagnosticList[i].checks[j].result.length;
                this.diagnosticList[i].checks[j].statusInfo=this.diagnosticList[i].checks[j].result.length;
                this.combinedIssues = this.combinedIssues + this.diagnosticList[i].checks[j].result.length;

                reportCheck['Diag status'] = this.diagnosticList[i].status;
                reportCheck['Control #'] = this.diagnosticList[i].checks[j].checkId;
                reportCheck['Control detail'] = this.diagnosticList[i].checks[j].checkInfo;
                reportCheck['Solution information'] = this.diagnosticList[i].checks[j].solutionInfo;
                reportCheck['Control status'] = this.diagnosticList[i].checks[j].status;
                reportCheck['Control result'] = this.diagnosticList[i].checks[j].result.length + ' issue(s)';
                reportCheck['Control execution'] = dateExecutionCheck;
                //solutionStatus=0; 
                //resultSolution;

                reportCheck['Solution status'] = 0;
                reportCheck['Solution result'] = 0 + ' issue(s)';;

                this.reportDiag.push(reportCheck);
                break;
              case 2: // execute script
                break;
              case 3: // execute batch
                break;
              default:
                this._messageService.add({severity:'error', summary:'Invalid action', sticky: true, closable: true, 
                                          detail: 'Unknown treatment for type ' + this.diagnosticList[i].checks[j].checkType + 
                                                  ' to control ' + this.diagnosticList[i].checks[j].checkId});
                break;
            }
            
          }
          if (this.combinedIssues == 0) { this.msgClass ='alert alert-success'; this.msgIconClass ='fas fa-smile-wink'; }
          else { this.msgClass ='alert alert-danger'; this.msgIconClass ='fas fa-meh'; }
          
          this.msgDisplay = 'As far as now, i found ' + this.combinedIssues + ' issue(s) ';
        }
      }
    }
    this._messageService.add({severity:'info', summary:'Diagnostic completed', detail:  'All the diagnostics controls have been executed.'});

    this.msgDisplay = 'Diagnostic control just finished. ' + this.combinedIssues + ' issue(s) found';
    this.displayPopup.doneDiag = true;
  }

  downloadControlFile(diagId, checkId) {
    this.msgDisplay = 'Control detail execution report is ready, check your download folder.';
    this.msgClass ='alert alert-success'; this.msgIconClass ='fas fa-smile-wink'; 

      this._exportService.saveCSV(this.diagnosticList[diagId].checks[checkId].result, null, null, null, 
                                  'Diagnostic ' + this.diagnosticList[diagId].diagInfo, 
                                  'Control# ' + this.diagnosticList[diagId].checks[checkId].checkId, 
                                  this.diagnosticList[diagId].checks[checkId].checkInfo);
  
  }

  /**
   * Execute the diagnostic fix detail
   */
  async executeFix() {
    console.log('Start Fix');

    this.msgDisplay = 'I am going to try to fix the issues identified.'
    this.msgClass ='alert alert-warning'; this.msgIconClass ='fas fa-rocket'; 

    for(let i=0; i < this.diagnosticList.length; i++) {
      if (this.diagnosticList[i].status == 2 && this.diagnosticList[i].checked) {
        for (let j=0; j < this.diagnosticList[i].checks.length; j++) {
          if (this.diagnosticList[i].checks[j].status == 2 && this.diagnosticList[i].checks[j].checked) {
            for (let k=0; k < this.diagnosticList[i].checks[j].solutionDetail.length; k++) {
              //execute solution process one by one - Solution are ordered by diag id, slution and solution order
              await this.executeDetailFix(i,j,k);
            }
          }
        }
      }
    }
    this.msgDisplay = 'Fixing process is now finished. Rerun the diagnostic to check the issues have been fixed, if not, contact my creator to make me smarter';
    this.msgClass ='alert alert-success'; this.msgIconClass ='fas fa-check-circle'; 

    this.displayPopup.doneFix = true;

  }

  async executeDetailFix(i: number, j: number, k: number) {
    //execute Solution to capture the invalid data
    this.msgDisplay = 'I am trying to fix this issue: ' + this.diagnosticList[i].checks[j].checkInfo;
    this.msgClass ='alert alert-warning'; this.msgIconClass ='fas fa-rocket'; 

    switch (this.diagnosticList[i].checks[j].solutionDetail[k].solutionType) {
      case 1: // execute SQL
        break;
      case 2: // execute script
        console.log('Solution - Script execution:', this.diagnosticList[i].checks[j].solutionDetail[k].solutionExec);
        let data = await this._processService.executeScript(this.diagnosticList[i].checks[j].solutionDetail[k].solutionExec).toPromise();
        console.log ('Script execution', data.CMD, data.RESULT, data.ERROR) 

        this.msgDisplay = 'Fixing ' + this.diagnosticList[i].checks[j].checkInfo + ' is completed.';
        this.msgClass ='alert alert-success'; this.msgIconClass ='fas fa-check-circle'; 
        break;
      case 3: // execute batch
          console.log('Solution - Batch execution:', this.diagnosticList[i].checks[j].solutionDetail[k].solutionExec);
          await this._processService.executeScript(this.diagnosticList[i].checks[j].solutionDetail[k].solutionExec).subscribe( 
            data => { console.log ('Batch execution', data.CMD, data.RESULT, data.ERROR) },
            error => {},
            () => {
                    this.msgDisplay = 'Fixing ' + this.diagnosticList[i].checks[j].checkInfo + ' is completed.';
                    this.msgClass ='alert alert-success'; this.msgIconClass ='fas fa-check-circle'; 
                }
            );
        break;
      default:
        this._messageService.add({severity:'error', summary:'Invalid solution type', sticky: true, closable: true, 
                                  detail: 'Unknown solution type ' + this.diagnosticList[i].checks[j].solutionDetail[k].solutionType});
        break;
      }
  }

  executeReport() {
    if(this.reportDiag.length > 0) {
      this.msgDisplay = 'Global diagnostic report is ready, check your download folder.';
      this.msgClass ='alert alert-success'; this.msgIconClass ='fas fa-smile-wink'; 

      this._exportService.saveCSV(this.reportDiag, null, null, null, 
        '', 'DIAGNOSTIC REPORT',
        'Diagnostic execution on ' + this.reportDiag[0]['Control execution']);
      }
  }

  // Function needed to have the right order on the report property
  initializeReport(rdiag: any) : Object {
    let report =  [];
    let reportOrdered = {};
    report.push(rdiag);
    
    report.map(function(data){
      reportOrdered["Diag #"]= data["Diag #"];
      reportOrdered["Domain"]= data["Domain"];
      reportOrdered["Info"]= data["Info"];
      reportOrdered["Comment"]= data["Comment"];
      reportOrdered["Diag status"]= data["Diag status"];
      reportOrdered["Control #"]= data["Control #"];
      reportOrdered["Control detail"]= data["Control detail"];
      reportOrdered["Control execution"]= data["Control execution"];
      reportOrdered["Control result"]= data["Control result"];
      reportOrdered["Control status"]= data["Control status"];
      reportOrdered["Solution information"]= data["Solution information"];
      reportOrdered["Solution status"]= data["Solution status"];
      reportOrdered["Solution result"]= data["Solution result"];
      return reportOrdered; 
    }); 
    return reportOrdered;

  }

  /**
   * Function to format and coloring the global report
   */
  formatGlobalReport() {

  }
}