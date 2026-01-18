import { Component, ViewChild, OnDestroy, HostListener } from '@angular/core';
import { ViewEncapsulation } from '@angular/core';
import { ImportService,  AlertsICRService, QueryService } from '../../shared/services/index';
import { ConfirmEventType, ConfirmationService, MessageService } from 'primeng/api';
import { Dialog } from 'primeng/dialog';
import { Chips } from 'primeng/chips';

@Component({
    selector: 'alerts.icr-cmp',
    templateUrl: './alerts.icr.component.html',
    styleUrls: ['./alerts.icr.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class AlertsICRComponent implements OnDestroy {
  @ViewChild('daltemail') chipsEmail: Chips;
  @ViewChild('daltemailcc') chipsEmailCC: Chips;
  @ViewChild('daltemailbcc') chipsEmailBCC: Chips;

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

  queryPostDistribution='ALT0000005'; /* Query to update report filter */

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

   /** CRUD mode tracking */
   crudMode: 'create' | 'edit' | 'view' = 'view';
   isNewAlert: boolean = false;
   isNewDistribution: boolean = false;
   isNewSchedule: boolean = false;

   /** Schedule type options for dropdown */
   scheduleTypeOptions = [
     { label: 'Execute Query', value: 1 },
     { label: 'Execute File', value: 2 },
     { label: 'Execute Shell', value: 3 }
   ];

   /** Real-time options for dropdown */
   realTimeOptions = [
     { label: 'Real time', value: 1 },
     { label: 'Scheduled', value: 0 }
   ];

   /** Yes/No options for dropdown */
   yesNoOptions = [
     { label: 'Yes', value: 1 },
     { label: 'No', value: 0 }
   ];

   /** Schedule builder properties */
   scheduleFrequency: string = 'daily';
   scheduleHour: number = 9;
   scheduleMinute: number = 0;
   scheduleDayOfWeek: number = 1;
   scheduleDayOfMonth: number = 1;
   scheduleInterval: number = 15;
   scheduleReadable: string = '';
   scheduleHourRange: string = '';
   scheduleDayOfWeekRange: string = '';

   frequencyOptions = [
     { label: 'Every X minutes', value: 'interval_minutes' },
     { label: 'Hourly', value: 'hourly' },
     { label: 'Hour range', value: 'hour_range' },
     { label: 'Daily', value: 'daily' },
     { label: 'Weekly', value: 'weekly' },
     { label: 'Monthly', value: 'monthly' },
     { label: 'Custom', value: 'custom' }
   ];

   hourOptions = Array.from({ length: 24 }, (_, i) => ({ label: i.toString().padStart(2, '0'), value: i }));
   minuteOptions = Array.from({ length: 60 }, (_, i) => ({ label: i.toString().padStart(2, '0'), value: i }));
   
   dayOfWeekOptions = [
     { label: 'Sunday', value: 0 },
     { label: 'Monday', value: 1 },
     { label: 'Tuesday', value: 2 },
     { label: 'Wednesday', value: 3 },
     { label: 'Thursday', value: 4 },
     { label: 'Friday', value: 5 },
     { label: 'Saturday', value: 6 }
   ];

   dayOfMonthOptions = Array.from({ length: 31 }, (_, i) => ({ label: (i + 1).toString(), value: i + 1 }));
   
   intervalMinuteOptions = [
     { label: '5', value: 5 },
     { label: '10', value: 10 },
     { label: '15', value: 15 },
     { label: '20', value: 20 },
     { label: '30', value: 30 },
     { label: '45', value: 45 },
     { label: '55', value: 55 }
   ];

   /** Alert focus */
   alertDisplay: any = {};
   alertDistributionDisplay: any = {};
   alertSheduleDisplay: any = {};
   displayAlert: boolean = false;
   alertSheduleDisplay_DALTEMAIL: string[] = []; 
   alertSheduleDisplay_DALTEMAILCC: string[] = []; 
   alertSheduleDisplay_DALTEMAILBCC: string[] = [];

   screenID;
   csvButtonTooltip: string ='';

   columnsResult;

  // Request subscription
  subscription: any[] = [];
  msgDisplayed: string;
  displayProcessCompleted: boolean;

  constructor(private _alertsICRService: AlertsICRService, 
              private _confrmation: ConfirmationService,
              private _uploadService: ImportService,
              private _queryService: QueryService, 
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


  // ==================== ALERT CRUD OPERATIONS ====================

  /** Create new alert - Initialize empty form */
  createAlert() {
    this.crudMode = 'create';
    this.isNewAlert = true;
    this.isNewDistribution = true;
    this.isNewSchedule = true;

    // Initialize empty alert object with all fields
    this.alertDisplay = {
      ALTID: '',
      ALTQUERY: '',  // Query number - editable for new alerts
      ALTSUBJECT: '',
      ALTCONTENT: '',
      ALTDCRE: new Date(),
      ALTDMAJ: new Date(),
      ALTUTIL: '',
      ALTFILE: '',
      ALTREALTIME: 0,
      ALTSMSCONTENT: '',
      ALTORIENTATION: 'landscape',
      ALTPRINTAREA: '',
      ALTMARGIN: '{ left: 0.3, right: 0.3, top: 0.5, bottom: 0.5 }',
      ALTFITPAGE: 1,
      ALTFITPAGEBOOLEAN: true,
      ALTFITHEIGHT: 10,
      ALTFITWIDTH: 1,
      ALTTITLEREPEAT: '1:5',
      ALTFOOTER: '',
      ALTFORMAT: '',
      ALTFORMATXLS: '',
      ALTCONTENTHTML: '',
      ALTXLSBREAK: '',
      ALTSCALE: 100,
      ALTCOLMOVE: '',
      ALTNBPARAM: 0,
      ALTPARAMDESC: '',
      ALTBORDER: 0,
      ALTBORDERBOOLEAN: false,
      ALTTITLEXLS: '',
      ALTTITLEXLSCOLOR: '000000',
      ALTFREEZEHEADER: 0,
      ALTFREEZEHEADERBOOLEAN: false,
      ALTFREEZECOLUMN: 0,
      ALTFORMATTAB2XLS: '',
      ALTNOHTML: 0,
      ALTSQL: ''
    };

    // Initialize empty distribution
    this.alertDistributionDisplay = {
      DALTID: '',
      DALTUSERID: '',
      DALTTYPE: 1,
      DALTREPEAT: 0,
      DALTDCRE: new Date(),
      DALTDMAJ: new Date(),
      DALTUTIL: '',
      DALTEMAIL: '',
      DALTSMS: 0,
      DALTEMAILCC: '',
      DALTEMAILBCC: ''
    };
    this.alertSheduleDisplay_DALTEMAIL = [];
    this.alertSheduleDisplay_DALTEMAILCC = [];
    this.alertSheduleDisplay_DALTEMAILBCC = [];

    // Initialize empty schedule
    this.alertSheduleDisplay = {
      SALTID: '',
      SALTDESC: '',
      SALTCRON: '0 9 * * *',
      SALTTYPE: 2,
      SALTQUERYNUM: '',  // External query identifier
      SALTQUERYPARAM: '',
      SALTJOB: '',
      SALTACTIVE: new Date(),
      SALTACTIVEDATE: new Date(),
      SALTDCRE: new Date(),
      SALTDMAJ: new Date(),
      SALTUTIL: '',
      SALTCATCHUP: 0,
      SALTCATCHUPBOOLEAN: false,
      SALTREFALTID: '',
      SALTCOMMENT: '',
      SALTSHELL: ''
    };

    // Set default schedule builder values
    this.scheduleFrequency = 'daily';
    this.scheduleHour = 9;
    this.scheduleMinute = 0;
    this.updateReadableSchedule();

    this.displayAlert = true;
    this._messageService.add({severity:'info', summary:'New Alert', detail: 'Fill in the alert details and save.'});
  }

  /** Edit existing alert */
  editAlert(alertId) {
    this.crudMode = 'edit';
    this.isNewAlert = false;
    
    let index = this.searchResult.findIndex(x => x.ALTID == alertId);
    let indexDistribution = this.searchResultDistribution.findIndex(x => x.DALTID == alertId);
    let indexScheduling = this.searchResultSchedule.findIndex(x => x.SALTREFALTID == alertId);
    
    // Convert boolean fields
    this.searchResult[index].ALTFITPAGEBOOLEAN = this.searchResult[index].ALTFITPAGE == 1;
    this.searchResult[index].ALTFREEZEHEADERBOOLEAN = this.searchResult[index].ALTFREEZEHEADER == 1;
    this.searchResult[index].ALTBORDERBOOLEAN = this.searchResult[index].ALTBORDER == 1;

    this.alertDisplay = { ...this.searchResult[index] };
    
    // Handle distribution
    if (indexDistribution >= 0) {
      this.alertDistributionDisplay = { ...this.searchResultDistribution[indexDistribution] };
      this.isNewDistribution = false;
    } else {
      // No distribution exists - create new one
      this.alertDistributionDisplay = {
        DALTID: alertId,
        DALTUSERID: '',
        DALTTYPE: 1,
        DALTREPEAT: 0,
        DALTDCRE: new Date(),
        DALTDMAJ: new Date(),
        DALTUTIL: '',
        DALTEMAIL: '',
        DALTSMS: 0,
        DALTEMAILCC: '',
        DALTEMAILBCC: ''
      };
      this.isNewDistribution = true;
    }

    // Handle schedule
    if (indexScheduling >= 0) {
      this.alertSheduleDisplay = { ...this.searchResultSchedule[indexScheduling] };
      this.isNewSchedule = false;
      // Convert schedule boolean fields and date
      this.alertSheduleDisplay.SALTCATCHUPBOOLEAN = this.alertSheduleDisplay.SALTCATCHUP == 1;
      if (this.alertSheduleDisplay.SALTACTIVE) {
        this.alertSheduleDisplay.SALTACTIVEDATE = new Date(this.alertSheduleDisplay.SALTACTIVE);
      }
      this.parseCronExpression();
    } else {
      // No schedule exists - create new one
      this.alertSheduleDisplay = {
        SALTID: '',
        SALTDESC: this.alertDisplay.ALTSUBJECT + ' Schedule',
        SALTCRON: '0 9 * * *',
        SALTTYPE: 2,
        SALTQUERYNUM: '',
        SALTQUERYPARAM: '',
        SALTJOB: '',
        SALTACTIVE: new Date(),
        SALTACTIVEDATE: new Date(),
        SALTDCRE: new Date(),
        SALTDMAJ: new Date(),
        SALTUTIL: '',
        SALTCATCHUP: 0,
        SALTCATCHUPBOOLEAN: false,
        SALTREFALTID: alertId,
        SALTCOMMENT: '',
        SALTSHELL: ''
      };
      this.isNewSchedule = true;
      this.scheduleFrequency = 'daily';
      this.scheduleHour = 9;
      this.scheduleMinute = 0;
      this.updateReadableSchedule();
    }

    // Parse email lists
    this.alertSheduleDisplay_DALTEMAIL = this.parseEmailList(this.alertDistributionDisplay.DALTEMAIL);
    this.alertSheduleDisplay_DALTEMAILCC = this.parseEmailList(this.alertDistributionDisplay.DALTEMAILCC);
    this.alertSheduleDisplay_DALTEMAILBCC = this.parseEmailList(this.alertDistributionDisplay.DALTEMAILBCC);

    this.displayAlert = true;
  }

  /** Duplicate existing alert - creates a copy with new IDs */
  duplicateAlert(alertId) {
    this.crudMode = 'create';
    this.isNewAlert = true;
    this.isNewDistribution = true;
    this.isNewSchedule = true;
    
    let index = this.searchResult.findIndex(x => x.ALTID == alertId);
    let indexDistribution = this.searchResultDistribution.findIndex(x => x.DALTID == alertId);
    let indexScheduling = this.searchResultSchedule.findIndex(x => x.SALTREFALTID == alertId);
    
    // Copy alert data
    this.alertDisplay = { ...this.searchResult[index] };
    
    // Clear ID and set as new - user must provide new ID
    this.alertDisplay.ALTID = '';
    // Keep ALTQUERY (querynum) from source - user can modify if needed
    this.alertDisplay.ALTSUBJECT = this.alertDisplay.ALTSUBJECT + ' (Copy)';
    this.alertDisplay.ALTDCRE = new Date();
    this.alertDisplay.ALTDMAJ = new Date();
    
    // Convert boolean fields
    this.alertDisplay.ALTFITPAGEBOOLEAN = this.alertDisplay.ALTFITPAGE == 1;
    this.alertDisplay.ALTFREEZEHEADERBOOLEAN = this.alertDisplay.ALTFREEZEHEADER == 1;
    this.alertDisplay.ALTBORDERBOOLEAN = this.alertDisplay.ALTBORDER == 1;
    
    // Copy distribution data
    if (indexDistribution >= 0) {
      this.alertDistributionDisplay = { ...this.searchResultDistribution[indexDistribution] };
      this.alertDistributionDisplay.DALTID = ''; // Will be set from ALTID on save
      this.alertDistributionDisplay.DALTDCRE = new Date();
      this.alertDistributionDisplay.DALTDMAJ = new Date();
    } else {
      this.alertDistributionDisplay = {
        DALTID: '',
        DALTUSERID: '',
        DALTTYPE: 1,
        DALTREPEAT: 0,
        DALTDCRE: new Date(),
        DALTDMAJ: new Date(),
        DALTUTIL: '',
        DALTEMAIL: '',
        DALTSMS: 0,
        DALTEMAILCC: '',
        DALTEMAILBCC: ''
      };
    }

    // Copy schedule data
    if (indexScheduling >= 0) {
      this.alertSheduleDisplay = { ...this.searchResultSchedule[indexScheduling] };
      this.alertSheduleDisplay.SALTID = ''; // User must provide new ID
      this.alertSheduleDisplay.SALTDESC = this.alertSheduleDisplay.SALTDESC + ' (Copy)';
      // Keep SALTQUERYNUM from source - user can modify if needed
      this.alertSheduleDisplay.SALTREFALTID = ''; // Will be set from ALTID on save
      this.alertSheduleDisplay.SALTDCRE = new Date();
      this.alertSheduleDisplay.SALTDMAJ = new Date();
      this.alertSheduleDisplay.SALTCATCHUPBOOLEAN = this.alertSheduleDisplay.SALTCATCHUP == 1;
      if (this.alertSheduleDisplay.SALTACTIVE) {
        this.alertSheduleDisplay.SALTACTIVEDATE = new Date(this.alertSheduleDisplay.SALTACTIVE);
      }
      this.parseCronExpression();
    } else {
      this.alertSheduleDisplay = {
        SALTID: '',
        SALTDESC: 'New Schedule (Copy)',
        SALTCRON: '0 9 * * *',
        SALTTYPE: 2,
        SALTQUERYNUM: '',
        SALTQUERYPARAM: '',
        SALTJOB: '',
        SALTACTIVE: new Date(),
        SALTACTIVEDATE: new Date(),
        SALTDCRE: new Date(),
        SALTDMAJ: new Date(),
        SALTUTIL: '',
        SALTCATCHUP: 0,
        SALTCATCHUPBOOLEAN: false,
        SALTREFALTID: '',
        SALTCOMMENT: '',
        SALTSHELL: ''
      };
      this.scheduleFrequency = 'daily';
      this.scheduleHour = 9;
      this.scheduleMinute = 0;
      this.updateReadableSchedule();
    }

    // Parse email lists from source
    this.alertSheduleDisplay_DALTEMAIL = this.parseEmailList(this.alertDistributionDisplay.DALTEMAIL);
    this.alertSheduleDisplay_DALTEMAILCC = this.parseEmailList(this.alertDistributionDisplay.DALTEMAILCC);
    this.alertSheduleDisplay_DALTEMAILBCC = this.parseEmailList(this.alertDistributionDisplay.DALTEMAILBCC);

    this.displayAlert = true;
    this._messageService.add({severity:'info', summary:'Duplicate Alert', detail: 'Enter a new Alert ID. Query number and other settings have been copied.'});
  }

  /** Helper to parse semicolon-separated email list */
  parseEmailList(emailString: string): string[] {
    if (!emailString) return [];
    return emailString.split(';').filter(e => e.trim().length > 0);
  }

  /** Save all changes (Alert, Distribution, Schedule) */
  saveChanges() {
    // Validate required fields
    if (!this.alertDisplay.ALTID || this.alertDisplay.ALTID.trim() === '') {
      this._messageService.add({severity:'error', summary:'Validation Error', detail: 'Alert ID is required.'});
      return;
    }

    // Convert boolean fields back to numbers
    this.alertDisplay.ALTFITPAGE = this.alertDisplay.ALTFITPAGEBOOLEAN ? 1 : 0;
    this.alertDisplay.ALTFREEZEHEADER = this.alertDisplay.ALTFREEZEHEADERBOOLEAN ? 1 : 0;
    this.alertDisplay.ALTBORDER = this.alertDisplay.ALTBORDERBOOLEAN ? 1 : 0;
    this.alertDisplay.ALTDMAJ = new Date();

    // Save Alert (MERGE handles both insert and update)
    this.subscription.push(this._alertsICRService.saveAlert(this.alertDisplay)
      .subscribe(
        data => {
          console.log('Save alert result:', data);
          this._messageService.add({severity:'success', summary:'Success', detail: 'Alert saved successfully.'});
          this.saveDistribution();
        },
        error => {
          this._messageService.add({severity:'error', summary:'Error', detail: 'Failed to save alert: ' + error});
        }
      ));
  }

  /** Save distribution after alert is saved */
  saveDistribution() {
    // Build email strings from chips
    this.alertDistributionDisplay.DALTID = this.alertDisplay.ALTID;
    this.alertDistributionDisplay.DALTEMAIL = this.alertSheduleDisplay_DALTEMAIL.join(';');
    this.alertDistributionDisplay.DALTEMAILCC = this.alertSheduleDisplay_DALTEMAILCC.join(';');
    this.alertDistributionDisplay.DALTEMAILBCC = this.alertSheduleDisplay_DALTEMAILBCC.join(';');
    this.alertDistributionDisplay.DALTDMAJ = new Date();

    // Save distribution (MERGE handles both insert and update)
    this.subscription.push(this._alertsICRService.saveDistribution(this.alertDistributionDisplay)
      .subscribe(
        data => {
          console.log('Save distribution result:', data);
          this.saveSchedule();
        },
        error => {
          console.log('Error saving distribution:', error);
          // Still try to save schedule even if distribution fails
          this.saveSchedule();
        }
      ));
  }

  /** Save schedule after distribution is saved */
  saveSchedule() {
    // Only save if schedule has an ID
    if (!this.alertSheduleDisplay.SALTID || this.alertSheduleDisplay.SALTID.trim() === '') {
      this.finalizeSave();
      return;
    }

    // Convert boolean back to number
    this.alertSheduleDisplay.SALTCATCHUP = this.alertSheduleDisplay.SALTCATCHUPBOOLEAN ? 1 : 0;
    this.alertSheduleDisplay.SALTREFALTID = this.alertDisplay.ALTID;
    this.alertSheduleDisplay.SALTDMAJ = new Date();

    // Convert date to ISO string for JSON
    if (this.alertSheduleDisplay.SALTACTIVEDATE) {
      this.alertSheduleDisplay.SALTACTIVE = this.alertSheduleDisplay.SALTACTIVEDATE.toISOString();
    }

    // Save schedule (MERGE handles both insert and update)
    this.subscription.push(this._alertsICRService.saveSchedule(this.alertSheduleDisplay)
      .subscribe(
        data => {
          console.log('Save schedule result:', data);
          this.finalizeSave();
        },
        error => {
          console.log('Error saving schedule:', error);
          this.finalizeSave();
        }
      ));
  }

  /** Finalize save operation */
  finalizeSave() {
    this.msgDisplayed = "Alert " + this.alertDisplay.ALTID + " has been saved successfully.";
    this.displayProcessCompleted = true;
    
    // Refresh data
    this.search();
  }

  /** Delete alert with confirmation */
  confirmDeleteAlert(alertId) {
    this._confrmation.confirm({
      message: `Are you sure you want to <b>DELETE</b> this alert and all related data?<br><br>
                <b>Alert ID:</b> ${alertId}<br><br>
                This will also delete associated distribution and schedule records.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.deleteAlert(alertId);
      },
      reject: () => {
        this._messageService.add({severity:'info', summary:'Cancelled', detail: 'Delete operation cancelled.'});
      }
    });
  }

  /** Delete alert and related records */
  deleteAlert(alertId: string) {
    // Delete schedule first
    const schedule = this.searchResultSchedule.find(s => s.SALTREFALTID == alertId);
    if (schedule && schedule.SALTID) {
      this.subscription.push(this._alertsICRService.deleteSchedule(schedule.SALTID)
        .subscribe(
          data => console.log('Schedule deleted:', data),
          error => console.log('Error deleting schedule:', error)
        ));
    }

    // Delete distribution
    this.subscription.push(this._alertsICRService.deleteDistribution(alertId)
      .subscribe(
        data => console.log('Distribution deleted:', data),
        error => console.log('Error deleting distribution:', error)
      ));

    // Delete alert
    this.subscription.push(this._alertsICRService.deleteAlert(alertId)
      .subscribe(
        data => {
          console.log('Alert deleted:', data);
          this._messageService.add({severity:'success', summary:'Success', detail: 'Alert deleted successfully.'});
          // Remove from local array
          const index = this.searchResult.findIndex(x => x.ALTID == alertId);
          if (index >= 0) {
            this.searchResult.splice(index, 1);
          }
        },
        error => {
          this._messageService.add({severity:'error', summary:'Error', detail: 'Failed to delete alert: ' + error});
        }
      ));
  }


  // ==================== SCHEDULE CRUD OPERATIONS ====================

  /** Create a new schedule for the current alert */
  createNewSchedule() {
    this.isNewSchedule = true;
    this.alertSheduleDisplay = {
      SALTID: '',
      SALTDESC: this.alertDisplay.ALTSUBJECT + ' Schedule',
      SALTCRON: '0 9 * * *',
      SALTTYPE: 2,
      SALTQUERYNUM: '',
      SALTQUERYPARAM: '',
      SALTJOB: '',
      SALTACTIVE: new Date(),
      SALTACTIVEDATE: new Date(),
      SALTDCRE: new Date(),
      SALTDMAJ: new Date(),
      SALTUTIL: '',
      SALTCATCHUP: 0,
      SALTCATCHUPBOOLEAN: false,
      SALTREFALTID: this.alertDisplay.ALTID,
      SALTCOMMENT: '',
      SALTSHELL: ''
    };
    
    this.scheduleFrequency = 'daily';
    this.scheduleHour = 9;
    this.scheduleMinute = 0;
    this.scheduleDayOfWeek = 1;
    this.scheduleDayOfMonth = 1;
    this.scheduleInterval = 15;
    this.updateReadableSchedule();
    
    this._messageService.add({severity:'info', summary:'New Schedule', detail: 'Configure the schedule settings and save.'});
  }

  /** Delete schedule with confirmation */
  confirmDeleteSchedule() {
    if (!this.alertSheduleDisplay || !this.alertSheduleDisplay.SALTID) {
      this._messageService.add({severity:'warn', summary:'Warning', detail: 'No schedule to delete.'});
      return;
    }

    this._confrmation.confirm({
      key: 'scheduleDelete',
      message: `Are you sure you want to delete this schedule?<br><br><b>Schedule ID:</b> ${this.alertSheduleDisplay.SALTID}`,
      header: 'Confirm Delete Schedule',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        const saltidToDelete = this.alertSheduleDisplay.SALTID;
        this.subscription.push(this._alertsICRService.deleteSchedule(saltidToDelete)
          .subscribe(
            data => {
              console.log('Schedule deleted:', data);
              this._messageService.add({severity:'success', summary:'Success', detail: 'Schedule deleted successfully.'});
              // Remove from local array
              const index = this.searchResultSchedule.findIndex(s => s.SALTID == saltidToDelete);
              if (index >= 0) {
                this.searchResultSchedule.splice(index, 1);
              }
              // Clear schedule display and reset to new
              this.alertSheduleDisplay = {};
              this.isNewSchedule = true;
            },
            error => {
              this._messageService.add({severity:'error', summary:'Error', detail: 'Failed to delete schedule: ' + error});
            }
          ));
      }
    });
  }


  // ==================== SCHEDULE BUILDER METHODS ====================

  /** Build cron expression from user-friendly inputs */
  buildCronExpression() {
    let cron = '';
    
    switch (this.scheduleFrequency) {
      case 'interval_minutes':
        cron = `*/${this.scheduleInterval} * * * *`;
        break;
      case 'hourly':
        cron = `${this.scheduleMinute} * * * *`;
        break;
      case 'hour_range':
        const dayPart = this.scheduleDayOfWeekRange || '*';
        cron = `${this.scheduleMinute} ${this.scheduleHourRange} * * ${dayPart}`;
        break;
      case 'daily':
        cron = `${this.scheduleMinute} ${this.scheduleHour} * * *`;
        break;
      case 'weekly':
        cron = `${this.scheduleMinute} ${this.scheduleHour} * * ${this.scheduleDayOfWeek}`;
        break;
      case 'monthly':
        cron = `${this.scheduleMinute} ${this.scheduleHour} ${this.scheduleDayOfMonth} * *`;
        break;
      case 'custom':
        return;
    }
    
    if (this.alertSheduleDisplay) {
      this.alertSheduleDisplay.SALTCRON = cron;
    }
    this.updateReadableSchedule();
  }

  /** Parse cron expression and update user-friendly inputs */
  parseCronExpression() {
    if (!this.alertSheduleDisplay || !this.alertSheduleDisplay.SALTCRON) {
      return;
    }
    
    const cron = this.alertSheduleDisplay.SALTCRON.trim();
    const parts = cron.split(/\s+/);
    
    if (parts.length < 5) {
      this.scheduleReadable = 'Invalid cron expression';
      return;
    }
    
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    
    if (minute.startsWith('*/')) {
      this.scheduleFrequency = 'interval_minutes';
      this.scheduleInterval = parseInt(minute.substring(2)) || 15;
    } else if (hour === '*' && dayOfMonth === '*' && dayOfWeek === '*') {
      this.scheduleFrequency = 'hourly';
      this.scheduleMinute = parseInt(minute) || 0;
    } else if (hour.includes('-') || hour.includes(',')) {
      this.scheduleFrequency = 'hour_range';
      this.scheduleMinute = parseInt(minute) || 0;
      this.scheduleHourRange = hour;
      this.scheduleDayOfWeekRange = dayOfWeek !== '*' ? dayOfWeek : '';
    } else if (minute.includes('-') || minute.includes(',') || minute.includes('/')) {
      this.scheduleFrequency = 'custom';
    } else if (dayOfMonth === '*' && dayOfWeek === '*') {
      this.scheduleFrequency = 'daily';
      this.scheduleMinute = parseInt(minute) || 0;
      this.scheduleHour = parseInt(hour) || 9;
    } else if (dayOfMonth === '*' && dayOfWeek !== '*') {
      this.scheduleFrequency = 'weekly';
      this.scheduleMinute = parseInt(minute) || 0;
      this.scheduleHour = parseInt(hour) || 9;
      if (dayOfWeek.includes('-') || dayOfWeek.includes(',')) {
        this.scheduleFrequency = 'hour_range';
        this.scheduleHourRange = hour;
        this.scheduleDayOfWeekRange = dayOfWeek;
      } else {
        this.scheduleDayOfWeek = parseInt(dayOfWeek) || 1;
      }
    } else if (dayOfMonth !== '*') {
      this.scheduleFrequency = 'monthly';
      this.scheduleMinute = parseInt(minute) || 0;
      this.scheduleHour = parseInt(hour) || 1;
      this.scheduleDayOfMonth = parseInt(dayOfMonth) || 1;
    }
    
    this.updateReadableSchedule();
  }

  /** Update human-readable schedule description */
  updateReadableSchedule() {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timeStr = `${this.scheduleHour.toString().padStart(2, '0')}:${this.scheduleMinute.toString().padStart(2, '0')}`;
    
    switch (this.scheduleFrequency) {
      case 'interval_minutes':
        this.scheduleReadable = `Runs every ${this.scheduleInterval} minutes`;
        break;
      case 'hourly':
        this.scheduleReadable = `Runs every hour at minute ${this.scheduleMinute.toString().padStart(2, '0')}`;
        break;
      case 'hour_range':
        const hourRangeDesc = this.formatHourRange(this.scheduleHourRange);
        const dayRangeDesc = this.scheduleDayOfWeekRange ? ` on ${this.formatDayRange(this.scheduleDayOfWeekRange)}` : '';
        this.scheduleReadable = `Runs ${hourRangeDesc} at minute ${this.scheduleMinute.toString().padStart(2, '0')}${dayRangeDesc}`;
        break;
      case 'daily':
        this.scheduleReadable = `Runs every day at ${timeStr}`;
        break;
      case 'weekly':
        this.scheduleReadable = `Runs every ${dayNames[this.scheduleDayOfWeek]} at ${timeStr}`;
        break;
      case 'monthly':
        const suffix = this.getDaySuffix(this.scheduleDayOfMonth);
        this.scheduleReadable = `Runs on the ${this.scheduleDayOfMonth}${suffix} of every month at ${timeStr}`;
        break;
      case 'custom':
        this.scheduleReadable = `Custom schedule (see cron expression)`;
        break;
      default:
        this.scheduleReadable = 'Schedule not configured';
    }
  }

  formatHourRange(hourRange: string): string {
    if (!hourRange) return '';
    if (hourRange.includes('-')) {
      const [start, end] = hourRange.split('-');
      return `every hour from ${start.padStart(2, '0')}:00 to ${end.padStart(2, '0')}:00`;
    } else if (hourRange.includes(',')) {
      const hours = hourRange.split(',').map(h => h.trim().padStart(2, '0') + ':00');
      return `at hours ${hours.join(', ')}`;
    }
    return `at hour ${hourRange}`;
  }

  formatDayRange(dayRange: string): string {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    if (dayRange.includes('-')) {
      const [start, end] = dayRange.split('-');
      return `${dayNames[parseInt(start)]} to ${dayNames[parseInt(end)]}`;
    } else if (dayRange.includes(',')) {
      const days = dayRange.split(',').map(d => shortDayNames[parseInt(d.trim())]);
      return days.join(', ');
    }
    return dayNames[parseInt(dayRange)] || dayRange;
  }

  getDaySuffix(day: number): string {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }

  onFrequencyChange() {
    this.buildCronExpression();
  }


  // ==================== UTILITY METHODS ====================

  /** Copy text to clipboard */
  copyToClipboard(text: string) {
    if (!text) {
      this._messageService.add({severity:'warn', summary:'Nothing to copy', detail: 'The field is empty.'});
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      this._messageService.add({severity:'success', summary:'Copied', detail: 'Content copied to clipboard.'});
    }).catch(err => {
      this._messageService.add({severity:'error', summary:'Error', detail: 'Failed to copy to clipboard.'});
      console.error('Failed to copy: ', err);
    });
  }

  /** Close dialog and reset */
  closeDialog() {
    this.displayAlert = false;
    this.crudMode = 'view';
    this.isNewAlert = false;
    this.isNewDistribution = false;
    this.isNewSchedule = false;
  }

  ngOnDestroy() {
    for(let i=0; i< this.subscription.length; i++) {
      this.subscription[i].unsubscribe();
    }
  }

  onRowSelect(ev) {
  }

  // ==================== EXECUTION METHODS (Keep existing) ====================

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
    this.runReportDialog = 2;
    this.executionDataResult=[];
    this.columnsResultExecution = [];
    
    const alertId = this.searchResult[this.executionAlertIndex].ALTID;
    
    this.subscription.push(this._alertsICRService.executeQuery(alertId, params)
      .subscribe( 
        data => { 
          this.executionDataResult = data;
          if (this.executionDataResult.length > 0) {
            let columns = Object.keys(this.executionDataResult[0]);
            for (let i = 0; i < columns.length; i++) {
              this.columnsResultExecution.push({ field: columns[i], header: columns[i] });
            }
          }
        },
        error => {
          this.waitMessage = '';
          this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
        },
        () => { 
          this.waitMessage = '';
          console.log('Report result', this.executionDataResult);
          this._messageService.add({severity:'success', summary:'Completed', detail: 'Alerts/reports execution completed...' });
          this.executionDataResultDisplay = true;
        }
      ));
  }

  confirmRunReport(alertId) {
    this.runReportDialog = 1;
    this.executionAlertIndex = this.searchResult.findIndex(x => x.ALTID == alertId);
    
    const schedule = this.searchResultSchedule.find(s => s.SALTREFALTID == alertId || s.SALTQUERYNUM == alertId);
    const hasSaltShell = schedule && schedule.SALTSHELL && schedule.SALTSHELL.trim() !== '';
    
    this._confrmation.confirm({
      message: 'Are you sure that you want to <b>execute</b> this report? <b>' + this.searchResult[this.executionAlertIndex].ALTID + ' ' + this.searchResult[this.executionAlertIndex].ALTSUBJECT + 
               '</b><br><br>This will send the email notification to the distribution list.',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
          this._messageService.add({severity:'info', summary:'Info Message', detail: 'Executing alerts/reports ...' });
          this.waitMessage='Running <b>' + this.searchResult[this.executionAlertIndex].ALTID + ' ' + this.searchResult[this.executionAlertIndex].ALTSUBJECT + '</b> report...<br>' + 
                           '<br> The report usually taking <b>between 1 to 3 minutes</b>. An automatic result pop-up will be opened shortly.';
          
          if (hasSaltShell) {
            setTimeout(() => {
              this.showShellVsParameterConfirmation(alertId, schedule);
            }, 100);
          } else {
            this.proceedWithParameterCheck();
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

  showShellVsParameterConfirmation(alertId, schedule) {
    this._confrmation.confirm({
      key: 'shellConfirm',
      message: `<b>Shell script detected for this alert.</b><br><br>
                Choose execution method:<br><br>
                <b>• Execute Shell Script:</b> Runs the complete shell script as configured<br>
                <b>• Run with Parameters:</b> Executes the report query using the provided parameters`,
      header: 'Execution Method',
      icon: 'pi pi-question-circle',
      acceptLabel: 'Execute Shell Script',
      rejectLabel: 'Run with Parameters',
      accept: () => {
        console.log('Executing shell script for schedule:', schedule);
        this.executionAlertParam = [];
        this.runReportShellOnly(alertId, schedule);
      },
      reject: (type) => {
        if (type === ConfirmEventType.REJECT) {
          this.proceedWithParameterCheck();
        } else {
          this.waitMessage = '';
          this._messageService.add({severity:'warn', summary:'Cancelled', detail: 'Report execution cancelled'});
        }
      }
    });
  }

  proceedWithParameterCheck() {
    this.executionAlertParam = [];
    if(this.searchResult[this.executionAlertIndex].ALTNBPARAM > 0) {
      this.executionAlertParamDesc = this.searchResult[this.executionAlertIndex].ALTPARAMDESC.split(',');
      for(let i=0; i < this.executionAlertParamDesc.length; i++) {
        this.executionAlertParam.push('-1');
      }
      setTimeout(() => {
        this.captureParamDialog = true;
      }, 100);
    }
    else {
      this.runReportWithParams(this.executionAlertParam);
    }
  }

  runReportShellOnly(alertId, alertSchedule) {
    this.subscription.push(this._alertsICRService.executeShellScript(alertSchedule.SALTID)
      .subscribe( 
        data => { this.executionDataResult = data; },
        error => {
          this.waitMessage = '';
          this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
        },
        () => { 
          this.waitMessage = '';
          this._messageService.add({severity:'success', summary:'Completed', detail: 'Shell script execution completed...' });
        }
      ));
  }

  runReportWithParams(params) {
    const alertId = this.searchResult[this.executionAlertIndex].ALTID;
    this.subscription.push(this._alertsICRService.runReport(alertId, params)
      .subscribe( 
        data => { this.executionDataResult = data; },
        error => {
          this.waitMessage = '';
          this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
        },
        () => { 
          this.waitMessage = '';
          this._messageService.add({severity:'success', summary:'Completed', detail: 'Alerts/reports execution completed...' });
        }
      ));
  }

  runReport(params){
    this.runReportWithParams(params);
  }

  removeReport(alertId) {
    this.confirmDeleteAlert(alertId);
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
              this.waitMessage='';
              this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
        },
        () => { 
              this.waitMessage='';
              this.alertSQLFileDisplay = true;
              this._messageService.add({severity:'success', summary:'Completed', detail: 'Alerts/reports download completed...' });
        }));
  }

  // ==================== EMAIL PASTE HANDLERS ====================

  onPasteEmail(event) {
    let splitPaste = event.clipboardData.getData('text').split(' ');
    if(event.clipboardData.getData('text').includes(' ')) {
       this.alertSheduleDisplay_DALTEMAIL=[...this.alertSheduleDisplay_DALTEMAIL, ...splitPaste];
       this.chipsEmail.cd.detectChanges();
       event.preventDefault();
       event.target.value ="";
    } 
    if(splitPaste[0].includes('\r\n')) {
      this.alertSheduleDisplay_DALTEMAIL=[...this.alertSheduleDisplay_DALTEMAIL, ...splitPaste[0].split('\r\n')];
       this.chipsEmail.cd.detectChanges();
       event.preventDefault();
       event.target.value ="";
    } 
    if(splitPaste[0].includes(';')) {
      this.alertSheduleDisplay_DALTEMAIL=[...this.alertSheduleDisplay_DALTEMAIL, ...splitPaste[0].split(';')];
       this.chipsEmail.cd.detectChanges();
       event.preventDefault();
       event.target.value ="";
    } 
    if(splitPaste[0].includes(',')) {
      this.alertSheduleDisplay_DALTEMAIL=[...this.alertSheduleDisplay_DALTEMAIL, ...splitPaste[0].split(',')];
       this.chipsEmail.cd.detectChanges();
       event.preventDefault();
       event.target.value ="";
    } 
  }

  onPasteEmailCC(event) {
    let splitPaste = event.clipboardData.getData('text').split(' ');
    if(event.clipboardData.getData('text').includes(' ')) {
       this.alertSheduleDisplay_DALTEMAILCC=[...this.alertSheduleDisplay_DALTEMAILCC, ...splitPaste];
       this.chipsEmailCC.cd.detectChanges();
       event.preventDefault();
       event.target.value ="";
    } 
    if(splitPaste[0].includes('\r\n')) {
      this.alertSheduleDisplay_DALTEMAILCC=[...this.alertSheduleDisplay_DALTEMAILCC, ...splitPaste[0].split('\r\n')];
       this.chipsEmailCC.cd.detectChanges();
       event.preventDefault();
       event.target.value ="";
    } 
    if(splitPaste[0].includes(';')) {
      this.alertSheduleDisplay_DALTEMAILCC=[...this.alertSheduleDisplay_DALTEMAILCC, ...splitPaste[0].split(';')];
       this.chipsEmailCC.cd.detectChanges();
       event.preventDefault();
       event.target.value ="";
    } 
    if(splitPaste[0].includes(',')) {
      this.alertSheduleDisplay_DALTEMAILCC=[...this.alertSheduleDisplay_DALTEMAILCC, ...splitPaste[0].split(',')];
       this.chipsEmailCC.cd.detectChanges();
       event.preventDefault();
       event.target.value ="";
    } 
  }

  onPasteEmailBCC(event) {
    let splitPaste = event.clipboardData.getData('text').split(' ');
    if(event.clipboardData.getData('text').includes(' ')) {
       this.alertSheduleDisplay_DALTEMAILBCC=[...this.alertSheduleDisplay_DALTEMAILBCC, ...splitPaste];
       this.chipsEmailBCC.cd.detectChanges();
       event.preventDefault();
       event.target.value ="";
    } 
    if(splitPaste[0].includes('\r\n')) {
      this.alertSheduleDisplay_DALTEMAILBCC=[...this.alertSheduleDisplay_DALTEMAILBCC, ...splitPaste[0].split('\r\n')];
       this.chipsEmailBCC.cd.detectChanges();
       event.preventDefault();
       event.target.value ="";
    } 
    if(splitPaste[0].includes(';')) {
      this.alertSheduleDisplay_DALTEMAILBCC=[...this.alertSheduleDisplay_DALTEMAILBCC, ...splitPaste[0].split(';')];
       this.chipsEmailBCC.cd.detectChanges();
       event.preventDefault();
       event.target.value ="";
    } 
    if(splitPaste[0].includes(',')) {
      this.alertSheduleDisplay_DALTEMAILBCC=[...this.alertSheduleDisplay_DALTEMAILBCC, ...splitPaste[0].split(',')];
       this.chipsEmailBCC.cd.detectChanges();
       event.preventDefault();
       event.target.value ="";
    } 
  }
}