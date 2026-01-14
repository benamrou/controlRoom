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

   /** Schedule type options for dropdown */
   scheduleTypeOptions = [
     { label: 'Type 1', value: 1 },
     { label: 'Type 2', value: 2 },
     { label: 'Type 3', value: 3 }
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

  /** Build cron expression from user-friendly inputs */
  buildCronExpression() {
    let cron = '';
    
    switch (this.scheduleFrequency) {
      case 'interval_minutes':
        // */X * * * * (every X minutes)
        cron = `*/${this.scheduleInterval} * * * *`;
        break;
      case 'hourly':
        // M * * * * (every hour at minute M)
        cron = `${this.scheduleMinute} * * * *`;
        break;
      case 'hour_range':
        // M H1-H2 * * D (hour range with optional day range)
        const dayPart = this.scheduleDayOfWeekRange || '*';
        cron = `${this.scheduleMinute} ${this.scheduleHourRange} * * ${dayPart}`;
        break;
      case 'daily':
        // M H * * * (every day at H:M)
        cron = `${this.scheduleMinute} ${this.scheduleHour} * * *`;
        break;
      case 'weekly':
        // M H * * D (every week on day D at H:M)
        cron = `${this.scheduleMinute} ${this.scheduleHour} * * ${this.scheduleDayOfWeek}`;
        break;
      case 'monthly':
        // M H D * * (every month on day D at H:M)
        cron = `${this.scheduleMinute} ${this.scheduleHour} ${this.scheduleDayOfMonth} * *`;
        break;
      case 'custom':
        // Don't modify - user edits cron directly
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
    
    // Detect pattern and set frequency
    if (minute.startsWith('*/')) {
      // Interval pattern: */X * * * *
      this.scheduleFrequency = 'interval_minutes';
      this.scheduleInterval = parseInt(minute.substring(2)) || 15;
    } else if (hour === '*' && dayOfMonth === '*' && dayOfWeek === '*') {
      // Hourly pattern: M * * * * (every hour at minute M)
      this.scheduleFrequency = 'hourly';
      this.scheduleMinute = parseInt(minute) || 0;
    } else if (hour.includes('-') || hour.includes(',')) {
      // Hour range pattern: M H1-H2 * * * or M H1,H2,H3 * * *
      this.scheduleFrequency = 'hour_range';
      this.scheduleMinute = parseInt(minute) || 0;
      this.scheduleHourRange = hour;
      this.scheduleDayOfWeekRange = dayOfWeek !== '*' ? dayOfWeek : '';
    } else if (minute.includes('-') || minute.includes(',') || minute.includes('/')) {
      // Complex minute pattern - treat as custom
      this.scheduleFrequency = 'custom';
    } else if (dayOfMonth === '*' && dayOfWeek === '*') {
      // Daily pattern: M H * * *
      this.scheduleFrequency = 'daily';
      this.scheduleMinute = parseInt(minute) || 0;
      this.scheduleHour = parseInt(hour) || 9;
    } else if (dayOfMonth === '*' && dayOfWeek !== '*') {
      // Weekly pattern: M H * * D (could have day range like 1-5)
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
      // Monthly pattern: M H D * *
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

  /** Format hour range for readable display */
  formatHourRange(hourRange: string): string {
    if (hourRange.includes('-')) {
      const [start, end] = hourRange.split('-');
      return `every hour from ${start.padStart(2, '0')}:00 to ${end.padStart(2, '0')}:00`;
    } else if (hourRange.includes(',')) {
      const hours = hourRange.split(',').map(h => h.trim().padStart(2, '0') + ':00');
      return `at hours ${hours.join(', ')}`;
    }
    return `at hour ${hourRange}`;
  }

  /** Format day of week range for readable display */
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

  /** Get ordinal suffix for day of month */
  getDaySuffix(day: number): string {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }

  /** Handle frequency change */
  onFrequencyChange() {
    this.buildCronExpression();
  }

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

  /** Create a new schedule for the current alert */
  createNewSchedule() {
    // Initialize a new schedule object with default values
    this.alertSheduleDisplay = {
      SALTID: '', // Will be generated by backend or user can set
      SALTDESC: this.alertDisplay.ALTSUBJECT + ' Schedule',
      SALTCRON: '0 9 * * *', // Default: daily at 9:00 AM
      SALTTYPE: 2,
      SALTQUERYNUM: '',
      SALTQUERYPARAM: '',
      SALTJOB: '',
      SALTACTIVE: null,
      SALTACTIVEDATE: new Date(), // Default to today
      SALTDCRE: '',
      SALTDMAJ: '',
      SALTUTIL: '',
      SALTCATCHUP: 0,
      SALTCATCHUPBOOLEAN: false,
      SALTREFALTID: this.alertDisplay.ALTID,
      SALTCOMMENT: '',
      SALTSHELL: ''
    };
    
    // Set default schedule builder values
    this.scheduleFrequency = 'daily';
    this.scheduleHour = 9;
    this.scheduleMinute = 0;
    this.scheduleDayOfWeek = 1;
    this.scheduleDayOfMonth = 1;
    this.scheduleInterval = 15;
    
    // Update readable display
    this.updateReadableSchedule();
    
    this._messageService.add({severity:'info', summary:'New Schedule', detail: 'Configure the schedule settings and save.'});
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
    this.alertDistributionDisplay = {
                      DALTID: this.alertDisplay.ALTID,
                      NEW_DALTEMAIL:'',
                      NEW_DALTEMAILCC :'',
                      NEW_DALTEMAILBCC : ''
    };
    console.log('Update alertSheduleDisplay_XXXX:',this.alertSheduleDisplay_DALTEMAIL,this.alertSheduleDisplay_DALTEMAILCC,this.alertSheduleDisplay_DALTEMAILBCC);

    if(!Object.is(this.alertSheduleDisplay_DALTEMAIL, null)  && !Object.is(this.alertSheduleDisplay_DALTEMAIL, undefined)) {
      for(let i=0; i< this.alertSheduleDisplay_DALTEMAIL.length; i ++) {
        if(this.alertDistributionDisplay.NEW_DALTEMAIL != '' ) {
          this.alertDistributionDisplay.NEW_DALTEMAIL+= ';';
        }
        this.alertDistributionDisplay.NEW_DALTEMAIL+= this.alertSheduleDisplay_DALTEMAIL[i];
      }
    }
       
    if(!Object.is(this.alertSheduleDisplay_DALTEMAILCC, null)  && !Object.is(this.alertSheduleDisplay_DALTEMAILCC, undefined)) {
      for(let i=0; i< this.alertSheduleDisplay_DALTEMAILCC.length; i ++) {
        if(this.alertDistributionDisplay.NEW_DALTEMAILCC != '' ) {
          this.alertDistributionDisplay.NEW_DALTEMAILCC+= ';';
        }
        this.alertDistributionDisplay.NEW_DALTEMAILCC+= this.alertSheduleDisplay_DALTEMAILCC[i];
      }
    }
    if(!Object.is(this.alertSheduleDisplay_DALTEMAILBCC, null)  && !Object.is(this.alertSheduleDisplay_DALTEMAILBCC, undefined)) {
      for(let i=0; i< this.alertSheduleDisplay_DALTEMAILBCC.length; i ++) {
        if(this.alertDistributionDisplay.NEW_DALTEMAILBCC != '' ) {
          this.alertDistributionDisplay.NEW_DALTEMAILBCC+= ';';
        }
        this.alertDistributionDisplay.NEW_DALTEMAILBCC+= this.alertSheduleDisplay_DALTEMAILBCC[i];
      }
    }

   console.log('Update alert:',this.alertDistributionDisplay);
    this.subscription.push(this._queryService.postQueryResult(this.queryPostDistribution, [this.alertDistributionDisplay])
    .subscribe( 
        data => {  
            console.log('Update result:',data);
            this.msgDisplayed = "Alert " + this.alertDisplay.ALTID + " has been updated."; 
            this.displayProcessCompleted =true;
        }, // put the data returned from the server in our variable
        error => {
        },
        async () => { 
                    //this._messageService.add({severity: 'info', summary: 'File Uploaded', detail: ''});
    }));
  }

  editAlert(alertId) {
    let index = this.searchResult.findIndex(x => x.ALTID == alertId);
    let indexDistribution = this.searchResultDistribution.findIndex(x => x.DALTID == alertId);
    let indexScheduling = this.searchResultSchedule.findIndex(x => x.SALTREFALTID == alertId);
    
    this.searchResult[index].ALTFITPAGEBOOLEAN = this.searchResult[index].ALTFITPAGE==1;
    this.searchResult[index].ALTFREEZEHEADERBOOLEAN = this.searchResult[index].ALTFREEZEHEADER==1;
    this.searchResult[index].ALTBORDERBOOLEAN = this.searchResult[index].ALTBORDER==1;

    this.alertDisplay = this.searchResult[index];
    this.alertDistributionDisplay = this.searchResultDistribution[indexDistribution];
    this.alertSheduleDisplay = this.searchResultSchedule[indexScheduling];

    // Convert schedule boolean fields and date
    if (this.alertSheduleDisplay) {
      this.alertSheduleDisplay.SALTCATCHUPBOOLEAN = this.alertSheduleDisplay.SALTCATCHUP == 1;
      // Convert SALTACTIVE date string to Date object for calendar
      if (this.alertSheduleDisplay.SALTACTIVE) {
        this.alertSheduleDisplay.SALTACTIVEDATE = new Date(this.alertSheduleDisplay.SALTACTIVE);
      }
      // Parse cron expression to populate schedule builder
      this.parseCronExpression();
    }

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
    this.runReportDialog = 2; /* Mode 2 - Execute local */
    this.executionDataResult=[];
    this.columnsResultExecution = [];
    
    const alertId = this.searchResult[this.executionAlertIndex].ALTID;
    
    // Execute query via notification API (original flow)
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
    
    // Find the schedule for this alert to check if SALTSHELL is populated
    // Use loose equality (==) since alertId might be string and SALTREFALTID might differ in type
    const schedule = this.searchResultSchedule.find(s => s.SALTREFALTID == alertId || s.SALTQUERYNUM == alertId);
    const hasSaltShell = schedule && schedule.SALTSHELL && schedule.SALTSHELL.trim() !== '';
    
    console.log('confirmRunReport - alertId:', alertId);
    console.log('confirmRunReport - searchResultSchedule:', this.searchResultSchedule);
    console.log('confirmRunReport - found schedule:', schedule);
    console.log('confirmRunReport - hasSaltShell:', hasSaltShell);
    
    this._confrmation.confirm({
      message: 'Are you sure that you want to <b>execute</b> this report? <b>' + this.searchResult[this.executionAlertIndex].ALTID + ' ' + this.searchResult[this.executionAlertIndex].ALTSUBJECT + 
               '</b><br><br>This will send the email notification to the distribution list.',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
          this._messageService.add({severity:'info', summary:'Info Message', detail: 'Executing alerts/reports ...' });
          this.waitMessage='Running <b>' + this.searchResult[this.executionAlertIndex].ALTID + ' ' + this.searchResult[this.executionAlertIndex].ALTSUBJECT + '</b> report...<br>' + 
                           '<br> The report usually taking <b>between 1 to 3 minutes</b>. An automatic result pop-up will be opened shortly.';
          
          console.log('confirmRunReport accept - hasSaltShell:', hasSaltShell);
          
          // If SALTSHELL is populated, ask user which execution method to use
          if (hasSaltShell) {
            // Use setTimeout to allow first dialog to close before showing second
            setTimeout(() => {
              this.showShellVsParameterConfirmation(alertId, schedule);
            }, 100);
          } else {
            // No SALTSHELL - proceed with parameter check
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

  /** Show confirmation dialog to choose between shell script or parameter execution */
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
        // Execute shell script - call runReport directly with empty params (shell doesn't need params)
        console.log('Executing shell script for schedule:', schedule);
        this.executionAlertParam = [];
        this.runReportShellOnly(alertId);
      },
      reject: (type) => {
        if (type === ConfirmEventType.REJECT) {
          // Run with parameters - proceed to parameter check
          this.proceedWithParameterCheck();
        } else {
          // Cancel was clicked
          this.waitMessage = '';
          this._messageService.add({severity:'warn', summary:'Cancelled', detail: 'Report execution cancelled'});
        }
      }
    });
  }

  /** Proceed with parameter check and execute report */
  proceedWithParameterCheck() {
    this.executionAlertParam = [];
    if(this.searchResult[this.executionAlertIndex].ALTNBPARAM > 0) {
      this.executionAlertParamDesc = this.searchResult[this.executionAlertIndex].ALTPARAMDESC.split(',');
      for(let i=0; i < this.executionAlertParamDesc.length; i++) {
        this.executionAlertParam.push('-1');
      }
      // Use setTimeout to ensure previous dialog is closed
      setTimeout(() => {
        this.captureParamDialog = true;
      }, 100);
    }
    else {
      this.runReportWithParams(this.executionAlertParam);
    }
  }

  /** Execute report using shell script (no parameters needed) */
  runReportShellOnly(alertId) {
    this.subscription.push(this._alertsICRService.runReport(alertId, [])
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

  /** Execute report with parameters (original flow) */
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
    // This method is called from the parameter dialog submission
    // Simply execute the report with parameters
    this.runReportWithParams(params);
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

  onPasteEmail(event) {
    /* ClipboardEvent */
    console.log('chipsEmail :', this.chipsEmail);
    let splitPaste = event.clipboardData.getData('text').split(' ');
    if(event.clipboardData.getData('text').includes(' ')) {
       this.alertSheduleDisplay_DALTEMAIL=[...this.alertSheduleDisplay_DALTEMAIL, ...splitPaste]; // don't push the new value inside the array, create a new reference
       this.chipsEmail.cd.detectChanges(); // use internal change detection
       event.preventDefault();    //prevent ';' to be written
       event.target.value ="";
    } 
    if(splitPaste[0].includes('\r\n')) {
      this.alertSheduleDisplay_DALTEMAIL=[...this.alertSheduleDisplay_DALTEMAIL, ...splitPaste[0].split('\r\n')]; // don't push the new value inside the array, create a new reference
       this.chipsEmail.cd.detectChanges(); // use internal change detection
       event.preventDefault();    //prevent ';' to be written
       event.target.value ="";
    } 
    if(splitPaste[0].includes(';')) {
      this.alertSheduleDisplay_DALTEMAIL=[...this.alertSheduleDisplay_DALTEMAIL, ...splitPaste[0].split(';')]; // don't push the new value inside the array, create a new reference
       this.chipsEmail.cd.detectChanges(); // use internal change detection
       event.preventDefault();    //prevent ';' to be written
       event.target.value ="";
    } 
    if(splitPaste[0].includes(',')) {
      this.alertSheduleDisplay_DALTEMAIL=[...this.alertSheduleDisplay_DALTEMAIL, ...splitPaste[0].split(',')]; // don't push the new value inside the array, create a new reference
       this.chipsEmailBCC.cd.detectChanges(); // use internal change detection
       event.preventDefault();    //prevent ';' to be written
       event.target.value ="";
    } 
  }
  onPasteEmailCC(event) {
    /* ClipboardEvent */
    let splitPaste = event.clipboardData.getData('text').split(' ');
    if(event.clipboardData.getData('text').includes(' ')) {
       this.alertSheduleDisplay_DALTEMAILCC=[...this.alertSheduleDisplay_DALTEMAILCC, ...splitPaste]; // don't push the new value inside the array, create a new reference
       this.chipsEmailCC.cd.detectChanges(); // use internal change detection
       event.preventDefault();    //prevent ';' to be written
       event.target.value ="";
    } 
    if(splitPaste[0].includes('\r\n')) {
      this.alertSheduleDisplay_DALTEMAILCC=[...this.alertSheduleDisplay_DALTEMAILCC, ...splitPaste[0].split('\r\n')]; // don't push the new value inside the array, create a new reference
       this.chipsEmailCC.cd.detectChanges(); // use internal change detection
       event.preventDefault();    //prevent ';' to be written
       event.target.value ="";
    } 
    if(splitPaste[0].includes(';')) {
      this.alertSheduleDisplay_DALTEMAILCC=[...this.alertSheduleDisplay_DALTEMAILCC, ...splitPaste[0].split(';')]; // don't push the new value inside the array, create a new reference
       this.chipsEmailCC.cd.detectChanges(); // use internal change detection
       event.preventDefault();    //prevent ';' to be written
       event.target.value ="";
    } 
    if(splitPaste[0].includes(',')) {
      this.alertSheduleDisplay_DALTEMAILCC=[...this.alertSheduleDisplay_DALTEMAILCC, ...splitPaste[0].split(',')]; // don't push the new value inside the array, create a new reference
       this.chipsEmailBCC.cd.detectChanges(); // use internal change detection
       event.preventDefault();    //prevent ';' to be written
       event.target.value ="";
    } 
  }
  onPasteEmailBCC(event) {
    /* ClipboardEvent */
    let splitPaste = event.clipboardData.getData('text').split(' ');
    if(event.clipboardData.getData('text').includes(' ')) {
       this.alertSheduleDisplay_DALTEMAILBCC=[...this.alertSheduleDisplay_DALTEMAILBCC, ...splitPaste]; // don't push the new value inside the array, create a new reference
       this.chipsEmailBCC.cd.detectChanges(); // use internal change detection
       event.preventDefault();    //prevent ';' to be written
       event.target.value ="";
    } 
    if(splitPaste[0].includes('\r\n')) {
      this.alertSheduleDisplay_DALTEMAILBCC=[...this.alertSheduleDisplay_DALTEMAILBCC, ...splitPaste[0].split('\r\n')]; // don't push the new value inside the array, create a new reference
       this.chipsEmailBCC.cd.detectChanges(); // use internal change detection
       event.preventDefault();    //prevent ';' to be written
       event.target.value ="";
    } 
    if(splitPaste[0].includes(';')) {
      this.alertSheduleDisplay_DALTEMAILBCC=[...this.alertSheduleDisplay_DALTEMAILBCC, ...splitPaste[0].split(';')]; // don't push the new value inside the array, create a new reference
       this.chipsEmailBCC.cd.detectChanges(); // use internal change detection
       event.preventDefault();    //prevent ';' to be written
       event.target.value ="";
    } 
    if(splitPaste[0].includes(',')) {
      this.alertSheduleDisplay_DALTEMAILBCC=[...this.alertSheduleDisplay_DALTEMAILBCC, ...splitPaste[0].split(',')]; // don't push the new value inside the array, create a new reference
       this.chipsEmailBCC.cd.detectChanges(); // use internal change detection
       event.preventDefault();    //prevent ';' to be written
       event.target.value ="";
    } 
  }
}