import { Component, ViewChild, OnDestroy, HostListener } from '@angular/core';
import { ViewEncapsulation } from '@angular/core';
import { ImportService,  AlertsICRService } from '../../shared/services/index';
import { ConfirmEventType, ConfirmationService, MessageService } from 'primeng/api';
import { Dialog } from 'primeng/dialog';

@Component({
    selector: 'alerts.icr-cmp',
    templateUrl: './alerts.icr.component.html',
    styleUrls: ['./alerts.icr.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class AlertsICRComponent implements OnDestroy {

  // Search action
   values: string [] = [];
   waitMessage: string = '';

  // Search result 
   /** Data elements */
   searchResult : any [] = [];
   searchResultSchedule : any [] = [];
   searchResultDistribution : any [] = [];
   selectedElement: any = {};
   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries

   searchAlertId;
   searchAlertDesc;
   searchAlertEmail;

   /** Local execution and data capture/display */
   executionDataResult;
   executionAlertIndex;
   executionAlertParamDesc = [];
   executionAlertParam = [];
   runReportDialog = 2; /* 1-Execute report, 2- Run local query */
   captureParamDialog = false;
   executionDataResultDisplay;
   columnsResultExecution;

   alertSQLFileContent;
   alertSQLFileDisplay;

   /** Alert focus */
   alertDisplay;
   alertDistributionDisplay;
   alertSheduleDisplay;
   displayAlert: boolean = false;
   alertSheduleDisplay_DALTEMAIL; alertSheduleDisplay_DALTEMAILCC; alertSheduleDisplay_DALTEMAILBCC;

   screenID;
   csvButtonTooltip: string ='';

   columnsResult;

  // Request subscription
  subscription: any[] = [];

  constructor(private _alertsICRService: AlertsICRService, 
              private _confrmation: ConfirmationService,
              private _uploadService: ImportService,
              private _messageService: MessageService) {
    this.screenID =  'SCR0000000019';
    this.columnsResult = [
      { field: 'ACTION', header: 'Action', align:'left', expand: 0, display: true, main: true},
      { field: 'ALTID', header: 'Alert id.', align:'left', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field: 'ALTSUBJECT', header: 'Description', placeholder: 'Search by vendor', align:'left', type: 'input', options: [],expand: -1, format: false, display: true, main: true  },
      { field: 'ALTCONTENT', header: 'Details' , placeholder: '', align:'left', type: 'input', options: [] ,expand: -1, format: true, display: true, main: true}
   ];
   this.csvButtonTooltip = "This is reporting all the information in the table below for detailed analyze."
  }
  

  search() {
    this.razSearch();
    this._messageService.add({severity:'info', summary:'Info Message', detail: 'Looking for the elements : ' + JSON.stringify(this.values)});
    this.searchButtonEnable = false; 

    let alertIdSearch, alertDescSearch, alertEmailSearch;

    if (!this.searchAlertId) { alertIdSearch = '-1'; } else { alertIdSearch= this.searchAlertId}
    if (!this.searchAlertDesc) { alertDescSearch = '-1'; } else { alertDescSearch= this.searchAlertDesc}
    if (!this.searchAlertEmail) { alertEmailSearch = '-1'; } else { alertEmailSearch= this.searchAlertEmail}

    this.subscription.push(this._alertsICRService.getAlerts(alertIdSearch, alertDescSearch, alertEmailSearch)
            .subscribe( 
                data => { this.searchResult = data;}, // put the data returned from the server in our variable
                error => {
                      console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                      this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                },
                () => { 
                      this._messageService.add({severity:'success', summary:'Info Message', detail: 'Retrieved ' + 
                                     this.searchResult.length + ' alerts/reports reference(s).'});
                      console.log('this.searchResult:', this.searchResult);
                      this.searchButtonEnable = true;

                }
            ));

    this.subscription.push(this._alertsICRService.getAlertsSchedule()
    .subscribe( 
        data => { this.searchResultSchedule = data;}, // put the data returned from the server in our variable
        error => {
              console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
        },
        () => { console.log('this.searchResultSchedule:', this.searchResultSchedule); }
    ));

    this.subscription.push(this._alertsICRService.getAlertsDistribution('-1')
    .subscribe( 
        data => { this.searchResultDistribution = data;}, // put the data returned from the server in our variable
        error => {
              console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
        },
        () => { console.log('this.searchResultDistribution:', this.searchResultDistribution); }
    ));
  }

  razSearch () {
    this.searchResult = [];
    this.selectedElement = {};
  }

  ngOnDestroy() {
    for(let i=0; i< this.subscription.length; i++) {
      this.subscription[i].unsubscribe();
    }
  }

  createAlert() {

  }

  onRowSelect(ev) {

  }
  saveChanges() {

  }

  editAlert(alertId) {
    let index = this.searchResult.findIndex(x => x.ALTID == alertId);
    let indexDistribution = this.searchResultDistribution.findIndex(x => x.DALTID == alertId);
    let indexScheduling = this.searchResultSchedule.findIndex(x => x.ALTID == alertId);
    
    this.searchResult[index].ALTFITPAGEBOOLEAN = this.searchResult[index].ALTFITPAGE==1;
    this.searchResult[index].ALTFREEZEHEADERBOOLEAN = this.searchResult[index].ALTFREEZEHEADER==1;
    this.searchResult[index].ALTBORDERBOOLEAN = this.searchResult[index].ALTBORDER==1;

    this.alertDisplay = this.searchResult[index];
    this.alertDistributionDisplay = this.searchResultDistribution[indexDistribution];
    this.alertSheduleDisplay = this.searchResultSchedule[indexScheduling];

    if (this.alertDistributionDisplay.DALTEMAIL) {
      this.alertSheduleDisplay_DALTEMAIL = this.alertDistributionDisplay.DALTEMAIL.split(';');
      for(let i=0; i < this.alertSheduleDisplay_DALTEMAIL.length; i++) {
        if(this.alertSheduleDisplay_DALTEMAIL[i].trim().length == 0) {
          this.alertSheduleDisplay_DALTEMAIL.splice(i,1);
        }
      }
    }

    if (this.alertDistributionDisplay.DALTEMAILCC) {
      this.alertSheduleDisplay_DALTEMAILCC = this.alertDistributionDisplay.DALTEMAILCC.split(';');
      for(let i=0; i < this.alertSheduleDisplay_DALTEMAILCC.length; i++) {
        if(this.alertSheduleDisplay_DALTEMAILCC[i].trim().length == 0) {
          this.alertSheduleDisplay_DALTEMAILCC.splice(i,1);
        }
      }
    }
    if (this.alertDistributionDisplay.DALTEMAILBCC) {
      this.alertSheduleDisplay_DALTEMAILBCC = this.alertDistributionDisplay.DALTEMAILBCC.split(';');
      for(let i=0; i < this.alertSheduleDisplay_DALTEMAILBCC.length; i++) {
        if(this.alertSheduleDisplay_DALTEMAILBCC[i].trim().length == 0) {
          this.alertSheduleDisplay_DALTEMAILBCC.splice(i,1);
        }
      }
    }

    this.displayAlert = true
  }

  confirmExecutionLocalQuery(alertId) {
    this.runReportDialog = 2;
    this.executionAlertIndex = this.searchResult.findIndex(x => x.ALTID == alertId);
    this._confrmation.confirm({
      message: 'Are you sure that you want to run this report? ' + this.searchResult[this.executionAlertIndex].ALTID + ' ' + this.searchResult[this.executionAlertIndex].ALTSUBJECT,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
          this._messageService.add({severity:'info', summary:'Info Message', detail: 'Executing alerts/reports ...' });
          this.waitMessage='Running <b>' + this.searchResult[this.executionAlertIndex].ALTID + ' ' + this.searchResult[this.executionAlertIndex].ALTSUBJECT + '</b> report...<br>' + 
                           '<br> The report usually taking <b>between 1 to 3 minutes</b>. An automatic result pop-up will be opened shortly.';
          this.executionAlertParam = [];
          if(this.searchResult[this.executionAlertIndex].ALTNBPARAM > 0) {
            this.executionAlertParamDesc = this.searchResult[this.executionAlertIndex].ALTPARAMDESC.split(',');
            for(let i=0; i < this.executionAlertParamDesc.length; i++) {
              this.executionAlertParam.push('-1');
            }
            this.captureParamDialog = true;
          }
          else {
            this.executeLocalQuery(this.executionAlertParam);
          }
      },
      reject: (type) => {
          switch(type) {
              case ConfirmEventType.REJECT:
                  this._messageService.add({severity:'error', summary:'Cancelled', detail:'Alerts/reports execution cancelled'});
              break;
              case ConfirmEventType.CANCEL:
                  this._messageService.add({severity:'warn', summary:'Cancelled', detail:'Alerts/reports execution cancelled'});
              break;
          }
          this.waitMessage='';
      }
    });
  }

  executeLocalQuery(params){
    this.runReportDialog = 1; /* Mode 1 - Execute local */
    this.executionDataResult=[];
    this.columnsResultExecution = [];
    this.subscription.push( this._alertsICRService.executeQuery(this.searchResult[this.executionAlertIndex].ALTID, params)
    .subscribe( 
        data => { this.executionDataResult = data;
                  if(this.executionDataResult.length > 0) {
                  let columns =Object.keys(this.executionDataResult[0]);
                      for(let i =0; i < columns.length; i++) {
                        this.columnsResultExecution.push({ field: columns[i], header: columns[i]});
                      }
                  }
                },
        error => {
              // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
              this.waitMessage='';
              this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
        },
        () => { 
              this.waitMessage='';
              console.log('Report result', this.executionDataResult);
              this._messageService.add({severity:'success', summary:'Completed', detail: 'Alerts/reports execution completed...' });
              this.executionDataResultDisplay=true;
        }));
  }

  confirmRunReport(alertId) {
    this.executionAlertIndex = this.searchResult.findIndex(x => x.ALTID == alertId);
    this._confrmation.confirm({
      message: 'Are you sure that you want to <b>execute</b> this report? <b>' + this.searchResult[this.executionAlertIndex].ALTID + ' ' + this.searchResult[this.executionAlertIndex].ALTSUBJECT + 
               '</b><br><br>This will send the email notification to the distribution list.',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
          this._messageService.add({severity:'info', summary:'Info Message', detail: 'Executing alerts/reports ...' });
          this.waitMessage='Running <b>' + this.searchResult[this.executionAlertIndex].ALTID + ' ' + this.searchResult[this.executionAlertIndex].ALTSUBJECT + '</b> report...<br>' + 
                           '<br> The report usually taking <b>between 1 to 3 minutes</b>. An automatic result pop-up will be opened shortly.';
          this.executionAlertParam = [];
          if(this.searchResult[this.executionAlertIndex].ALTNBPARAM > 0) {
            this.executionAlertParamDesc = this.searchResult[this.executionAlertIndex].ALTPARAMDESC.split(',');
            for(let i=0; i < this.executionAlertParamDesc.length; i++) {
              this.executionAlertParam.push('-1');
            }
            this.captureParamDialog = true;
          }
          else {
            this.runReport(this.executionAlertParam);
          }
      },
      reject: (type) => {
          switch(type) {
              case ConfirmEventType.REJECT:
                  this._messageService.add({severity:'error', summary:'Cancelled', detail:'Alerts/reports execution cancelled'});
              break;
              case ConfirmEventType.CANCEL:
                  this._messageService.add({severity:'warn', summary:'Cancelled', detail:'Alerts/reports execution cancelled'});
              break;
          }
          this.waitMessage='';
      }
    });
  }

  runReport(params){
    this.subscription.push( this._alertsICRService.runReport(this.searchResult[this.executionAlertIndex].ALTID, params)
    .subscribe( 
        data => { this.executionDataResult = data;
                },
        error => {
              // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
              this.waitMessage='';
              this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
        },
        () => { 
              this.waitMessage='';
              this._messageService.add({severity:'success', summary:'Completed', detail: 'Alerts/reports execution completed...' });
        }));
  }

  removeReport(alertId) {
    this.executionAlertIndex = this.searchResult.findIndex(x => x.ALTID == alertId);
    this._confrmation.confirm({
      message: 'Are you sure that you want to <b>REMOVE</b> this report? <b>' + this.searchResult[this.executionAlertIndex].ALTID + ' ' + this.searchResult[this.executionAlertIndex].ALTSUBJECT ,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
          this._messageService.add({severity:'info', summary:'Info Message', detail: 'Alerts/reports removal completed...' });
          this.searchResult.splice(this.executionAlertIndex,1);
      },
      reject: (type) => {
          switch(type) {
              case ConfirmEventType.REJECT:
                  this._messageService.add({severity:'error', summary:'Cancelled', detail:'Alerts/reports removal cancelled'});
              break;
              case ConfirmEventType.CANCEL:
                  this._messageService.add({severity:'warn', summary:'Cancelled', detail:'Alerts/reports removal cancelled'});
              break;
          }
          this.waitMessage='';
      }
    });
    
  }

  showDialogMaximized(event, dialog: Dialog) {
      dialog.maximized = false;
      dialog.maximize();
  }

  getFile(alertId, alertFile){
    this._messageService.add({severity:'info', summary:'Completed', detail: 'Downloading file for alert ' + alertId +  '...' });
    this.subscription.push( this._uploadService.getFile(alertFile)
    .subscribe( 
        async data => { this.alertSQLFileContent = await data.text();
                  console.log('Get File result', this.alertSQLFileContent);},
        error => {
              // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
              this.waitMessage='';
              this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
        },
        () => { 
              this.waitMessage='';
              this.alertSQLFileDisplay = true;
              this._messageService.add({severity:'success', summary:'Completed', detail: 'Alerts/reports download completed...' });
        }));

  }
}