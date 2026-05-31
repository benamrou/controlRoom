import { Component, OnDestroy, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { AppLogsService, ServerLogFile } from '../../../shared/services/app-logs/app.logs.service';
import { LabelService } from '../../../shared/services/labels/labels.service';

@Component({
  selector: 'app-app-logs',
  templateUrl: './app.logs.component.html',
  styleUrls: ['./app.logs.component.scss']
})
export class AppLogsComponent implements OnInit, OnDestroy {

  screenID = 'SCR0000000070';
  waitMessage = '';
  activeTabIndex = 0;

  logRoot = '';
  serverLogPath = '';
  serverTailTruncated = false;

  serverDayOptions: { label: string; value: string }[] = [];
  selectedDay = '';
  serverFiles: ServerLogFile[] = [];
  selectedFile = '';
  serverContent = '';
  serverLoading = false;
  tailLines = 1000;

  croomQueryNum = '';
  croomUserId = '';
  croomDateFrom: Date | null = null;
  croomDateTo: Date | null = null;
  croomRows: any[] = [];
  croomLoading = false;
  croomGlobalFilterFields = [
    'LOGQUERYNUM', 'QUERYTITLE', 'QUERYDESC', 'LOGUSERID', 'LOGSID', 'LOGMESSAGE', 'LOGPARAM', 'LOGUTIL'
  ];
  selectedCroom: any = null;
  displayCroomDetail = false;

  alertId = '';
  alertStatus = '';
  alertDateFrom: Date | null = null;
  alertDateTo: Date | null = null;
  alertRows: any[] = [];
  alertLoading = false;
  alertGlobalFilterFields = [
    'LALTID', 'ALTSUBJECT', 'ALTCONTENT', 'LALTREQID', 'LALTEMAIL', 'LALTSTATUS',
    'LALTPHASE', 'LALTERROR', 'LALTPARAM', 'LALTUTIL'
  ];
  selectedAlert: any = null;
  displayAlertDetail = false;

  statusOptions: { label: string; value: string }[] = [];

  private labelSub?: Subscription;

  constructor(
    private _svc: AppLogsService,
    private _msg: MessageService,
    private _labels: LabelService,
  ) {}

  ngOnInit(): void {
    this.buildStatusOptions();
    this.labelSub = this._labels.revision$.subscribe(() => this.buildStatusOptions());
    this._svc.getLogRoot().subscribe({
      next: (r) => {
        this.logRoot = r.log_root;
        this.updateServerLogPath();
      },
      error: () => {
        this.logRoot = '';
        this.serverLogPath = 'Server log path unavailable';
      }
    });
    this.loadServerDays();
    const today = new Date();
    this.croomDateTo = today;
    this.alertDateTo = today;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    this.croomDateFrom = weekAgo;
    this.alertDateFrom = weekAgo;
  }

  ngOnDestroy(): void {
    this.labelSub?.unsubscribe();
  }

  private L(key: string, fallback: string): string {
    return this._labels.text(key, fallback);
  }

  private buildStatusOptions(): void {
    this.statusOptions = [
      { label: this.L('CMN.ALL', 'All'), value: '' },
      { label: 'PROCESSING', value: 'PROCESSING' },
      { label: 'COMPLETE', value: 'COMPLETE' },
      { label: 'FAILED', value: 'FAILED' },
      { label: 'TIMEOUT', value: 'TIMEOUT' }
    ];
  }

  loadServerDays(): void {
    this.serverLoading = true;
    this._svc.listServerDays().subscribe({
      next: (days) => {
        this.serverDayOptions = days.map((d) => ({ label: d, value: d }));
        if (days.length && !this.selectedDay) {
          this.selectedDay = days[0];
          this.onServerDayChange();
        }
        this.serverLoading = false;
      },
      error: (err) => {
        this.serverLoading = false;
        this._msg.add({ severity: 'error', summary: 'Server logs', detail: String(err?.message || err) });
      }
    });
  }

  onServerDayChange(): void {
    if (!this.selectedDay) {
      this.serverFiles = [];
      this.updateServerLogPath();
      return;
    }
    this.updateServerLogPath();
    this.serverLoading = true;
    this._svc.listServerFiles(this.selectedDay).subscribe({
      next: (files) => {
        this.serverFiles = files;
        if (files.length) {
          this.selectedFile = files[0].name;
          this.loadServerTail();
        } else {
          this.selectedFile = '';
          this.serverContent = '';
          this.updateServerLogPath();
        }
        this.serverLoading = false;
      },
      error: (err) => {
        this.serverLoading = false;
        this._msg.add({ severity: 'error', summary: 'Server logs', detail: String(err?.message || err) });
      }
    });
  }

  loadServerTail(): void {
    if (!this.selectedDay || !this.selectedFile) {
      return;
    }
    this.serverLoading = true;
    this._svc.tailServerFile(this.selectedDay, this.selectedFile, this.tailLines).subscribe({
      next: (r) => {
        this.serverContent = r.content;
        this.serverTailTruncated = r.truncated;
        if (r.file_path) {
          this.serverLogPath = r.file_path;
        } else {
          this.updateServerLogPath();
        }
        this.serverLoading = false;
      },
      error: (err) => {
        this.serverLoading = false;
        this._msg.add({ severity: 'error', summary: 'Tail', detail: String(err?.message || err) });
      }
    });
  }

  searchCroom(): void {
    this.croomLoading = true;
    this._svc.searchCroomLog({
      queryNum: this.croomQueryNum,
      userId: this.croomUserId,
      dateFrom: this.croomDateFrom,
      dateTo: this.croomDateTo
    }).subscribe({
      next: (rows) => {
        this.croomRows = rows;
        this.croomLoading = false;
        this._msg.add({
          severity: 'info',
          summary: 'CROOMLOG',
          detail: `${rows.length} row(s) (max 500)`
        });
      },
      error: (err) => {
        this.croomLoading = false;
        this._msg.add({ severity: 'error', summary: 'CROOMLOG', detail: String(err?.message || err) });
      }
    });
  }

  searchAlert(): void {
    this.alertLoading = true;
    this._svc.searchAlertLog({
      alertId: this.alertId,
      status: this.alertStatus,
      dateFrom: this.alertDateFrom,
      dateTo: this.alertDateTo
    }).subscribe({
      next: (rows) => {
        this.alertRows = rows;
        this.alertLoading = false;
        this._msg.add({
          severity: 'info',
          summary: 'ALERTLOG',
          detail: `${rows.length} row(s) (max 500)`
        });
      },
      error: (err) => {
        this.alertLoading = false;
        this._msg.add({ severity: 'error', summary: 'ALERTLOG', detail: String(err?.message || err) });
      }
    });
  }

  viewCroom(row: any): void {
    this.selectedCroom = row;
    this.displayCroomDetail = true;
  }

  viewAlert(row: any): void {
    this.selectedAlert = row;
    this.displayAlertDetail = true;
  }

  statusSeverity(status: string): string {
    const s = String(status || '').toUpperCase();
    if (s === 'COMPLETE') {
      return 'success';
    }
    if (s === 'FAILED' || s === 'TIMEOUT') {
      return 'danger';
    }
    if (s === 'PROCESSING') {
      return 'warning';
    }
    return 'info';
  }

  formatBytes(n: number): string {
    if (!n) {
      return '0';
    }
    if (n < 1024) {
      return `${n} B`;
    }
    if (n < 1024 * 1024) {
      return `${(n / 1024).toFixed(1)} KB`;
    }
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  }

  updateServerLogPath(): void {
    if (!this.logRoot) {
      return;
    }
    let p = `${this.logRoot}/admin/`;
    if (this.selectedDay) {
      p += `${this.selectedDay}/`;
    }
    if (this.selectedFile) {
      p += this.selectedFile;
    }
    this.serverLogPath = p;
  }
}
