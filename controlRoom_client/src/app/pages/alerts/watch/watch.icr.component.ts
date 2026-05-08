/**
 * Critical Alert Watch — CRUD + reporting screen for ALERTWATCH.
 *
 * Sister screen to alerts.icr.component.ts. Lets ops define, edit, pause and
 * audit the watchdog contracts that guarantee critical ALERTLOG signatures
 * arrive on time.
 *
 * Author : Ahmed Benamrouche
 * Date   : May 2026
 */

import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ConfirmEventType, ConfirmationService, MessageService } from 'primeng/api';
import { AlertsICRService, WatchICRService } from '../../../shared/services/index';

@Component({
    selector: 'watch.icr-cmp',
    templateUrl: './watch.icr.component.html',
    styleUrls: ['./watch.icr.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class WatchICRComponent implements OnInit, OnDestroy {

    // ─── search state ───────────────────────────────────────────────────────
    searchAwtId: string;
    searchAwtAltId: string;
    searchStatus: string = '-1';
    searchButtonEnable: boolean = true;
    waitMessage: string = '';
    csvButtonTooltip: string = 'Export the table below to CSV';

    statusFilterOptions = [
        { label: 'All',         value: '-1' },
        { label: 'Active',      value: '1'  },
        { label: 'Paused',      value: '0'  }
    ];

    // ─── data ───────────────────────────────────────────────────────────────
    searchResult: any[] = [];
    alertList: any[] = [];                // dropdown source from ALERTS table
    alertOptions: any[] = [];             // [{label:'ALTID — ALTSUBJECT', value:'ALTID'}]
    selectedElement: any = {};

    columnsResult: any[];
    screenID: string = 'SCR0000000020';

    // ─── dialog / form state ────────────────────────────────────────────────
    crudMode: 'create' | 'edit' | 'view' = 'view';
    isNewWatch: boolean = false;
    displayWatch: boolean = false;
    watchDisplay: any = {};

    yesNoOptions = [
        { label: 'Yes', value: 1 },
        { label: 'No',  value: 0 }
    ];

    // Preview panel state
    previewLoading: boolean = false;
    previewRows: any[] = [];
    previewLookbackHours: number = 24;

    // ─── recovery history dialog ────────────────────────────────────────────
    displayHistory: boolean = false;
    historyAwtId: string = '';
    historyRows: any[] = [];
    historyDays: number = 30;
    columnsHistory: any[];

    // ─── cron builder (mirror of alerts.icr.component) ──────────────────────
    scheduleFrequency: string = 'daily';
    scheduleHour:      number = 9;
    scheduleMinute:    number = 0;
    scheduleDayOfWeek: number = 1;
    scheduleDayOfMonth:number = 1;
    scheduleInterval:  number = 15;
    scheduleReadable:  string = '';
    scheduleHourRange: string = '';
    scheduleDayOfWeekRange: string = '';

    frequencyOptions = [
        { label: 'Every X minutes', value: 'interval_minutes' },
        { label: 'Hourly',          value: 'hourly' },
        { label: 'Hour range',      value: 'hour_range' },
        { label: 'Daily',           value: 'daily' },
        { label: 'Weekly',          value: 'weekly' },
        { label: 'Monthly',         value: 'monthly' },
        { label: 'Custom',          value: 'custom' }
    ];
    hourOptions       = Array.from({ length: 24 }, (_, i) => ({ label: i.toString().padStart(2,'0'), value: i }));
    minuteOptions     = Array.from({ length: 60 }, (_, i) => ({ label: i.toString().padStart(2,'0'), value: i }));
    dayOfWeekOptions  = [
        { label: 'Sunday',    value: 0 },
        { label: 'Monday',    value: 1 },
        { label: 'Tuesday',   value: 2 },
        { label: 'Wednesday', value: 3 },
        { label: 'Thursday',  value: 4 },
        { label: 'Friday',    value: 5 },
        { label: 'Saturday',  value: 6 }
    ];
    dayOfMonthOptions = Array.from({ length: 31 }, (_, i) => ({ label: (i+1).toString(), value: i+1 }));
    intervalMinuteOptions = [
        { label: '5',  value: 5  }, { label: '10', value: 10 }, { label: '15', value: 15 },
        { label: '20', value: 20 }, { label: '30', value: 30 }, { label: '45', value: 45 },
        { label: '55', value: 55 }
    ];

    // ─── help panel ─────────────────────────────────────────────────────────
    /** Visible by default for first-time users.  Persisted between visits. */
    showHelp: boolean = (typeof localStorage !== 'undefined'
                         ? localStorage.getItem('watchdog.showHelp') !== '0'
                         : true);

    toggleHelp() {
        this.showHelp = !this.showHelp;
        try { localStorage.setItem('watchdog.showHelp', this.showHelp ? '1' : '0'); }
        catch (_) { /* localStorage may be disabled — best effort */ }
    }


    // ─── housekeeping ───────────────────────────────────────────────────────
    subscription: any[] = [];
    msgDisplayed: string;
    displayProcessCompleted: boolean;

    constructor(
        private _watchService:  WatchICRService,
        private _alertsService: AlertsICRService,
        private _confirmation:  ConfirmationService,
        private _messageService:MessageService
    ) {
        this.columnsResult = [
            { field: 'ACTION',         header: 'Action',           align: 'left',   display: true,  main: true },
            { field: 'AWTID',          header: 'Watch ID',         align: 'left',   display: true,  main: true },
            { field: 'AWTDESC',        header: 'Description',      align: 'left',   display: true,  main: true },
            { field: 'AWTALTID',       header: 'Alert',            align: 'left',   display: true,  main: true },
            { field: 'AWTPARAMLIKE',   header: 'Param LIKE',       align: 'left',   display: true,  main: true },
            { field: 'AWTCRON',        header: 'Cron',             align: 'left',   display: true,  main: true },
            { field: 'AWTGRACE',       header: 'Grace (s)',        align: 'right',  display: true,  main: true },
            { field: 'AWTACTIVEFLAG',  header: 'Active',           align: 'center', display: true,  main: true },
            { field: 'LASTSTATUS',     header: 'Last recovery',    align: 'center', display: true,  main: true },
            { field: 'LASTRECOVERY',   header: 'Last recovery at', align: 'left',   display: true,  main: true }
        ];

        this.columnsHistory = [
            { field: 'AWLEXPECTED',  header: 'Expected fire' },
            { field: 'AWLSTATUS',    header: 'Status' },
            { field: 'AWLEXITCODE',  header: 'Exit code' },
            { field: 'AWLDDETECTED', header: 'Detected at' },
            { field: 'AWLDFIRED',    header: 'Recovered at' },
            { field: 'AWLOUTPUT',    header: 'Output (tail)' }
        ];
    }


    // ==================== INIT =================================================

    /**
     * Load the alerts dropdown ONCE when the screen opens.  Previously this lived
     * inside search(), which meant every SEARCH click ran ALT0000001 against
     * ALERTS in addition to the WAT0000001 / ALERTWATCH query — wasteful and
     * misleading in the query log.
     */
    ngOnInit() {
        this.subscription.push(this._alertsService.getAlerts('-1', '-1', '-1').subscribe(
            data => {
                this.alertList = data || [];
                this.alertOptions = this.alertList.map(a => ({
                    label: `${a.ALTID} — ${a.ALTSUBJECT || ''}`,
                    value: a.ALTID
                }));
            },
            error => console.log('Error loading ALERTS for dropdown', error)
        ));
    }


    // ==================== SEARCH / LIST ========================================

    search() {
        this.searchResult = [];
        this.selectedElement = {};
        this.searchButtonEnable = false;

        const id     = this.searchAwtId    || '-1';
        const altId  = this.searchAwtAltId || '-1';
        const status = this.searchStatus   || '-1';

        // Only ALERTWATCH is queried here.  Dropdown is hydrated in ngOnInit().
        this.subscription.push(this._watchService.getWatches(id, altId, status).subscribe(
            data  => { this.searchResult = data || []; },
            error => {
                console.log('Error HTTP GET /api/watch ', error);
                this._messageService.add({severity:'error', summary:'ERROR', detail: error});
                this.searchButtonEnable = true;
            },
            () => {
                this._messageService.add({
                    severity:'success', summary:'Info',
                    detail: `Retrieved ${this.searchResult.length} watch contract(s).`
                });
                this.searchButtonEnable = true;
            }
        ));
    }


    /** Manual refresh of the alerts dropdown (e.g. after a new alert is added). */
    refreshAlertList() {
        this.subscription.push(this._alertsService.getAlerts('-1', '-1', '-1').subscribe(
            data => {
                this.alertList = data || [];
                this.alertOptions = this.alertList.map(a => ({
                    label: `${a.ALTID} — ${a.ALTSUBJECT || ''}`,
                    value: a.ALTID
                }));
                this._messageService.add({severity:'info', summary:'Refreshed',
                    detail: `${this.alertList.length} alert(s) reloaded.`});
            },
            error => this._messageService.add({severity:'error', summary:'Error', detail: error})
        ));
    }


    // ==================== CRUD =================================================

    /** Default AWTSHELL template — preseeded so the user can edit it directly
     *  (and copy / select / paste) instead of staring at a CSS placeholder. */
    private readonly AWTSHELL_TEMPLATE: string =
`. $HOME/env/envICR

# Replace the PARAM values below to target the missed instance.
# This template mirrors what notification.js expects on /api/notification/.
curl -s \\
  -H 'USER: alert' \\
  -H 'DATABASE_SID: HEINENS_CUSTOM_PROD' \\
  -H 'LANGUAGE: HN' \\
  -H 'SUBJECT_EXT: <human-readable suffix>' \\
  'http://localhost:8092/api/notification/?PARAM=YOUR_ALERT_ID&PARAM=YOUR_KEY&PARAM=3&PARAM=1' \\
  -L
`;

    createWatch() {
        this.crudMode = 'create';
        this.isNewWatch = true;
        this.watchDisplay = {
            AWTID: '',
            AWTDESC: '',
            AWTALTID: '',
            AWTPARAMLIKE: '',
            AWTCRON: '0 9 * * *',
            AWTGRACE: 120,
            AWTSHELL: this.AWTSHELL_TEMPLATE,
            AWTACTIVE: new Date(),
            AWTACTIVEDATE: new Date(),
            AWTACTIVEFLAG: 1,
            AWTACTIVEFLAGBOOLEAN: true,
            AWTCATCHUP: 1,
            AWTCATCHUPBOOLEAN: true,
            AWTMAXRETRY: 3,
            AWTUTIL: '',
            AWTCOMMENT: ''
        };
        this.scheduleFrequency = 'daily';
        this.scheduleHour = 9;
        this.scheduleMinute = 0;
        this.previewRows = [];
        this.updateReadableSchedule();
        this.displayWatch = true;
    }

    /** Reset the AWTSHELL field to the curl template. */
    insertShellTemplate() {
        if (!this.watchDisplay) return;
        this.watchDisplay.AWTSHELL = this.AWTSHELL_TEMPLATE;
        this._messageService.add({severity:'info', summary:'Template loaded',
            detail:'Edit the PARAM values for this watch.'});
    }

    /** Small clipboard helper used by the Copy button on the Recovery tab. */
    copyToClipboard(text: string) {
        if (!text) {
            this._messageService.add({severity:'warn', summary:'Nothing to copy', detail:'AWTSHELL is empty.'});
            return;
        }
        navigator.clipboard.writeText(text).then(
            () => this._messageService.add({severity:'success', summary:'Copied', detail:'AWTSHELL copied to clipboard.'}),
            () => this._messageService.add({severity:'error',  summary:'Error',  detail:'Clipboard write failed.'})
        );
    }

    editWatch(awtId: string) {
        this.crudMode = 'edit';
        this.isNewWatch = false;
        const idx = this.searchResult.findIndex(x => x.AWTID === awtId);
        if (idx < 0) return;

        this.watchDisplay = { ...this.searchResult[idx] };
        this.watchDisplay.AWTACTIVEFLAGBOOLEAN = this.watchDisplay.AWTACTIVEFLAG == 1;
        this.watchDisplay.AWTCATCHUPBOOLEAN   = this.watchDisplay.AWTCATCHUP   == 1;
        if (this.watchDisplay.AWTACTIVE) {
            this.watchDisplay.AWTACTIVEDATE = new Date(this.watchDisplay.AWTACTIVE);
        }
        this.parseCronExpression();
        this.previewRows = [];
        this.displayWatch = true;
    }

    duplicateWatch(awtId: string) {
        const idx = this.searchResult.findIndex(x => x.AWTID === awtId);
        if (idx < 0) return;

        this.crudMode = 'create';
        this.isNewWatch = true;
        this.watchDisplay = { ...this.searchResult[idx] };
        this.watchDisplay.AWTID  = '';
        this.watchDisplay.AWTDESC = (this.watchDisplay.AWTDESC || '') + ' (Copy)';
        this.watchDisplay.AWTACTIVEFLAGBOOLEAN = this.watchDisplay.AWTACTIVEFLAG == 1;
        this.watchDisplay.AWTCATCHUPBOOLEAN   = this.watchDisplay.AWTCATCHUP   == 1;
        if (this.watchDisplay.AWTACTIVE) {
            this.watchDisplay.AWTACTIVEDATE = new Date(this.watchDisplay.AWTACTIVE);
        }
        this.parseCronExpression();
        this.previewRows = [];
        this.displayWatch = true;
        this._messageService.add({severity:'info', summary:'Duplicate', detail: 'Enter a new Watch ID before saving.'});
    }

    saveChanges() {
        if (!this.watchDisplay.AWTID || !this.watchDisplay.AWTID.trim()) {
            this._messageService.add({severity:'error', summary:'Validation', detail:'Watch ID is required.'});
            return;
        }
        if (!this.watchDisplay.AWTALTID) {
            this._messageService.add({severity:'error', summary:'Validation', detail:'Alert (AWTALTID) is required.'});
            return;
        }
        if (!this.watchDisplay.AWTCRON || !this.watchDisplay.AWTCRON.trim()) {
            this._messageService.add({severity:'error', summary:'Validation', detail:'Cron expression is required.'});
            return;
        }

        // Booleans -> NUMBER, Date -> ISO string
        this.watchDisplay.AWTACTIVEFLAG = this.watchDisplay.AWTACTIVEFLAGBOOLEAN ? 1 : 0;
        this.watchDisplay.AWTCATCHUP    = this.watchDisplay.AWTCATCHUPBOOLEAN    ? 1 : 0;
        if (this.watchDisplay.AWTACTIVEDATE) {
            this.watchDisplay.AWTACTIVE = this.watchDisplay.AWTACTIVEDATE.toISOString();
        }

        this.subscription.push(this._watchService.saveWatch(this.watchDisplay).subscribe(
            data => {
                this._messageService.add({severity:'success', summary:'Saved', detail:'Watch saved.'});
                this.msgDisplayed = `Watch ${this.watchDisplay.AWTID} saved successfully.`;
                this.displayProcessCompleted = true;
                this.displayWatch = false;
                this.search();
            },
            error => {
                this._messageService.add({severity:'error', summary:'Error', detail:'Save failed: '+error});
            }
        ));
    }

    confirmDeleteWatch(awtId: string) {
        this._confirmation.confirm({
            message: `Delete watch contract <b>${awtId}</b>?<br><br>` +
                     `Past recovery rows in ALERTWATCHLOG are kept for audit.`,
            header: 'Confirm delete',
            icon:   'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.deleteWatch(awtId),
            reject: () => this._messageService.add({severity:'info', summary:'Cancelled', detail:'Delete cancelled.'})
        });
    }

    deleteWatch(awtId: string) {
        this.subscription.push(this._watchService.deleteWatch(awtId).subscribe(
            data => {
                this._messageService.add({severity:'success', summary:'Deleted', detail:`Watch ${awtId} deleted.`});
                const i = this.searchResult.findIndex(x => x.AWTID === awtId);
                if (i >= 0) this.searchResult.splice(i, 1);
            },
            error => this._messageService.add({severity:'error', summary:'Error', detail:'Delete failed: '+error})
        ));
    }


    // ==================== AWTPARAMLIKE PREVIEW ================================

    testParamLike() {
        if (!this.watchDisplay.AWTALTID) {
            this._messageService.add({severity:'warn', summary:'Pick alert', detail:'Choose an alert first.'});
            return;
        }
        this.previewLoading = true;
        this.previewRows = [];
        this.subscription.push(
            this._watchService.testParamLike(
                this.watchDisplay.AWTALTID,
                this.watchDisplay.AWTPARAMLIKE || '',
                this.previewLookbackHours
            ).subscribe(
                data => { this.previewRows = data || []; },
                err  => {
                    this._messageService.add({severity:'error', summary:'Preview failed', detail: err});
                    this.previewLoading = false;
                },
                () => {
                    this.previewLoading = false;
                    this._messageService.add({
                        severity: this.previewRows.length > 0 ? 'success' : 'warn',
                        summary:  'Pattern preview',
                        detail:   `${this.previewRows.length} ALERTLOG row(s) matched in last ${this.previewLookbackHours}h`
                    });
                }
            )
        );
    }


    // ==================== HISTORY ============================================

    openHistory(awtId: string) {
        this.historyAwtId = awtId;
        this.historyRows  = [];
        this.displayHistory = true;
        this.loadHistory();
    }

    loadHistory() {
        this.subscription.push(this._watchService.getWatchLog(this.historyAwtId, this.historyDays).subscribe(
            data => { this.historyRows = data || []; },
            err  => this._messageService.add({severity:'error', summary:'History error', detail: err})
        ));
    }


    // ==================== FORCE SCAN =========================================

    runScanNow() {
        this._confirmation.confirm({
            message: 'Run a watchdog scan now? This will recover any missed occurrences immediately.',
            header:  'Confirm scan',
            icon:    'pi pi-bolt',
            accept:  () => {
                this.waitMessage = 'Running watchdog scan…';
                this.subscription.push(this._watchService.runScanNow(1440, 120, false).subscribe(
                    data => {
                        this.waitMessage = '';
                        const r = (data && data[0]) || {};
                        this._messageService.add({
                            severity:'success', summary:'Scan complete',
                            detail: `Scanned ${r.scanned||0}, missed ${r.missed||0}, recovered ${r.recovered||0}, failed ${r.failed||0}`
                        });
                        this.search();
                    },
                    err => {
                        this.waitMessage = '';
                        this._messageService.add({severity:'error', summary:'Scan failed', detail: err});
                    }
                ));
            },
            reject: () => {}
        });
    }


    // ==================== CRON BUILDER (copied from alerts.icr.component) ====

    buildCronExpression() {
        let cron = '';
        switch (this.scheduleFrequency) {
            case 'interval_minutes': cron = `*/${this.scheduleInterval} * * * *`; break;
            case 'hourly':           cron = `${this.scheduleMinute} * * * *`; break;
            case 'hour_range':
                const dayPart = this.scheduleDayOfWeekRange || '*';
                cron = `${this.scheduleMinute} ${this.scheduleHourRange} * * ${dayPart}`;
                break;
            case 'daily':            cron = `${this.scheduleMinute} ${this.scheduleHour} * * *`; break;
            case 'weekly':           cron = `${this.scheduleMinute} ${this.scheduleHour} * * ${this.scheduleDayOfWeek}`; break;
            case 'monthly':          cron = `${this.scheduleMinute} ${this.scheduleHour} ${this.scheduleDayOfMonth} * *`; break;
            case 'custom':           return;
        }
        if (this.watchDisplay) this.watchDisplay.AWTCRON = cron;
        this.updateReadableSchedule();
    }

    parseCronExpression() {
        if (!this.watchDisplay || !this.watchDisplay.AWTCRON) return;
        const parts = this.watchDisplay.AWTCRON.trim().split(/\s+/);
        if (parts.length < 5) { this.scheduleReadable = 'Invalid cron expression'; return; }
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
            this.scheduleHour   = parseInt(hour)   || 9;
        } else if (dayOfMonth === '*' && dayOfWeek !== '*') {
            this.scheduleFrequency = 'weekly';
            this.scheduleMinute = parseInt(minute) || 0;
            this.scheduleHour   = parseInt(hour)   || 9;
            this.scheduleDayOfWeek = parseInt(dayOfWeek) || 1;
        } else if (dayOfMonth !== '*') {
            this.scheduleFrequency = 'monthly';
            this.scheduleMinute   = parseInt(minute)     || 0;
            this.scheduleHour     = parseInt(hour)       || 1;
            this.scheduleDayOfMonth = parseInt(dayOfMonth) || 1;
        }
        this.updateReadableSchedule();
    }

    updateReadableSchedule() {
        const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const time = `${this.scheduleHour.toString().padStart(2,'0')}:${this.scheduleMinute.toString().padStart(2,'0')}`;
        switch (this.scheduleFrequency) {
            case 'interval_minutes': this.scheduleReadable = `Runs every ${this.scheduleInterval} minutes`; break;
            case 'hourly':           this.scheduleReadable = `Runs every hour at minute ${this.scheduleMinute.toString().padStart(2,'0')}`; break;
            case 'hour_range':       this.scheduleReadable = `Runs at hour range ${this.scheduleHourRange}`; break;
            case 'daily':            this.scheduleReadable = `Runs every day at ${time}`; break;
            case 'weekly':           this.scheduleReadable = `Runs every ${dayNames[this.scheduleDayOfWeek]} at ${time}`; break;
            case 'monthly':          this.scheduleReadable = `Runs on day ${this.scheduleDayOfMonth} of every month at ${time}`; break;
            case 'custom':           this.scheduleReadable = 'Custom schedule (see cron expression)'; break;
            default:                 this.scheduleReadable = 'Schedule not configured';
        }
    }

    onFrequencyChange() { this.buildCronExpression(); }


    // ==================== UTIL ===============================================

    statusClass(s: string): string {
        if (!s) return 'status-NEVER';
        return 'status-' + s;
    }

    closeDialog() { this.displayWatch = false; this.crudMode = 'view'; }
    onRowSelect(_ev) {}

    ngOnDestroy() {
        for (const s of this.subscription) {
            try { s.unsubscribe(); } catch (_) {}
        }
    }
}