import { Component, OnInit, OnDestroy } from '@angular/core';
import { ImportService,  AlertsICRService, QueryService } from '../../../shared/services/index';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';


@Component({
  selector: 'alert-journal',
  templateUrl: './alert.journal.component.html',
  styleUrls: ['./alert.journal.component.scss']
})
export class AlertLogJournalComponent implements OnInit, OnDestroy {
  // Data
  alertLogs: any[] = [];
  filteredLogs: any[] = [];
  weeklyStats: DurationStat[] = [];
  monthlyStats: DurationStat[] = [];
  waitMessage: string = '';
  screenID;
  activeTabIndex: number = 0; // 0=live, 1=weekly, 2=monthly
  
  // View state
  activeView: string = 'live'; // live, weekly, monthly
  loading: boolean = false;
  autoRefresh: boolean = true;
  
  // Filters
  selectedAlertId: string = '';
  selectedStatus: string = '';
  dateFrom: Date | null = null;
  dateTo: Date | null = null;
  
  // Dropdowns
  alertIds: string[] = [];
  statuses = [
    { label: 'All', value: '' },
    { label: 'Processing', value: 'PROCESSING' },
    { label: 'Complete', value: 'COMPLETE' },
    { label: 'Failed', value: 'FAILED' },
    { label: 'Timeout', value: 'TIMEOUT' }
  ];
  
  // Chart data
  durationChartData: any;
  durationChartOptions: any;
  
  // Subscriptions
  private refreshSubscription?: Subscription;
  
  // Detail dialog
  displayDetailDialog: boolean = false;
  selectedLog: AlertLog | null = null;
  
  // Columns
  cols = [
    { field: 'LALTEDATE', header: 'Execution Date', width: '150px' },
    { field: 'LALTID', header: 'Alert ID', width: '120px' },
    { field: 'ALTSUBJECT', header: 'Description', width: '120px' },
    { field: 'LALTREQID', header: 'Request ID', width: '200px' },
    { field: 'LALTEMAIL', header: 'Email', width: '200px' },
    { field: 'LALTSTATUS', header: 'Status', width: '100px' },
    { field: 'LALTPHASE', header: 'Phase', width: '120px' },
    { field: 'LALTDURATION', header: 'Duration (s)', width: '100px' },
    { field: 'LALTROWCOUNT', header: 'Row Count', width: '100px' },
    { field: 'LALTERROR', header: 'Error', width: '200px' }
  ];

  // Alert Log Journal Component - TypeScript
// Add these properties and methods to your alerts_icr_component.ts

// Properties for Alert Log Journal
activeJournalTab: number = 0;
journalResults: any[] | null = null;
journalColumns: any[] = [];

// Dropdown options
alertIdOptions: any[] = [
  { label: 'All Alerts', value: null },
  { label: 'ALERT001 - Daily Sales Report', value: 'ALERT001' },
  { label: 'ALERT002 - Inventory Check', value: 'ALERT002' },
  { label: 'ALERT003 - Price Updates', value: 'ALERT003' },
  // Add your actual alerts here
];

statusOptions: any[] = [
  { label: 'All', value: null },
  { label: 'Success', value: 'SUCCESS' },
  { label: 'Running', value: 'RUNNING' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Pending', value: 'PENDING' }
];

// Chart data for Weekly and Monthly tabs
weeklyChartData: any = {
  labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
  datasets: [
    {
      label: 'Average Duration (seconds)',
      data: [45, 52, 48, 55],
      backgroundColor: 'rgba(102, 126, 234, 0.5)',
      borderColor: 'rgba(102, 126, 234, 1)',
      borderWidth: 2
    }
  ]
};

weeklyChartOptions: any = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Weekly Execution Duration Trends'
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Duration (seconds)'
      }
    }
  }
};

monthlyChartData: any = {
  labels: ['January', 'February', 'March', 'April', 'May', 'June'],
  datasets: [
    {
      label: 'Total Executions',
      data: [450, 480, 520, 490, 530, 560],
      backgroundColor: 'rgba(118, 75, 162, 0.5)',
      borderColor: 'rgba(118, 75, 162, 1)',
      borderWidth: 2
    }
  ]
};

monthlyChartOptions: any = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Monthly Execution Volume'
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Number of Executions'
      }
    }
  }
};

  constructor(private _alertsICRService: AlertsICRService) {
    this.initChartOptions();
  }

  ngOnInit(): void {
    this.loadData();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  loadData(): void {
    this.loading = true;
    
    const params = {
      alertId: this.selectedAlertId,
      status: this.selectedStatus,
      dateFrom: this.dateFrom,
      dateTo: this.dateTo,
      view: this.activeView
    };

    this._alertsICRService.getAlertLogs(params).subscribe({
      next: (data) => {
        this.alertLogs = data;
        this.filteredLogs = data;
        this.extractAlertIds();
        this.loading = false;
        
        if (this.activeView === 'weekly') {
          this.loadWeeklyStats();
        } else if (this.activeView === 'monthly') {
          this.loadMonthlyStats();
        }
      },
      error: (err) => {
        console.error('Error loading alert logs:', err);
        this.loading = false;
      }
    });
  }

  loadWeeklyStats(): void {
    this._alertsICRService.getWeeklyStats().subscribe({
      next: (stats) => {
        this.weeklyStats = stats;
        this.updateDurationChart(stats, 'Weekly');
      },
      error: (err) => console.error('Error loading weekly stats:', err)
    });
  }

  loadMonthlyStats(): void {
    this._alertsICRService.getMonthlyStats().subscribe({
      next: (stats) => {
        this.monthlyStats = stats;
        this.updateDurationChart(stats, 'Monthly');
      },
      error: (err) => console.error('Error loading monthly stats:', err)
    });
  }

  extractAlertIds(): void {
    const uniqueIds = [...new Set(this.alertLogs.map(log => log.LALTID))].sort();
    this.alertIds = [
      { label: 'All Alerts', value: '' },
      ...uniqueIds.map(id => ({ label: id, value: id }))
    ] as any;
  }
onViewChange(event: any): void {
  this.activeTabIndex = event.index;
  switch(event.index) {
    case 0: this.activeView = 'live'; break;
    case 1: this.activeView = 'weekly'; break;
    case 2: this.activeView = 'monthly'; break;
  }
  this.loadData();
}

  applyFilters(): void {
    this.loadData();
  }

  clearFilters(): void {
    this.selectedAlertId = '';
    this.selectedStatus = '';
    this.dateFrom = null;
    this.dateTo = null;
    this.loadData();
  }

  startAutoRefresh(): void {
    if (this.autoRefresh && this.activeView === 'live') {
      this.refreshSubscription = interval(10000) // Refresh every 10 seconds
        .pipe(switchMap(() => this._alertsICRService.getAlertLogs({
          alertId: this.selectedAlertId,
          status: this.selectedStatus,
          dateFrom: this.dateFrom,
          dateTo: this.dateTo,
          view: 'live'
        })))
        .subscribe({
          next: (data) => {
            this.alertLogs = data;
            this.filteredLogs = data;
          },
          error: (err) => console.error('Auto-refresh error:', err)
        });
    }
  }

  stopAutoRefresh(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh;
    if (this.autoRefresh && this.activeView === 'live') {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
  }

  exportToCSV(): void {
    // Implement CSV export
    const csv = this.convertToCSV(this.filteredLogs);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `alert-log-${new Date().toISOString()}.csv`;
    link.click();
  }

  private convertToCSV(data: AlertLog[]): string {
    const headers = this.cols.map(col => col.header).join(',');
    const rows = data.map(log => 
      this.cols.map(col => {
        const value = log[col.field as keyof AlertLog];
        return value !== null && value !== undefined ? `"${value}"` : '';
      }).join(',')
    );
    return [headers, ...rows].join('\n');
  }

  getStatusSeverity(status: string): string {
    switch (status) {
      case 'COMPLETE': return 'success';
      case 'FAILED': return 'danger';
      case 'TIMEOUT': return 'warning';
      case 'PROCESSING': return 'info';
      case 'INIT': return 'info';
      case 'JSON2XLS': return 'primary';
      case 'EXCEL_GEN': return 'primary';
      case 'EMAIL_SEND': return 'success';
      case 'NO_EMAIL': return 'info';
      case 'SPAM_BLOCKED': return 'danger';
      default: return 'secondary';
    }
  }

  getPhaseBadgeClass(phase: string): string {
    switch (phase) {
      case 'INIT': return 'badge-info';
      case 'JSON2XLS': return 'badge-primary';
      case 'EXCEL_GEN': return 'badge-primary';
      case 'EMAIL_SEND': return 'badge-success';
      case 'NO_EMAIL': return 'badge-info';
      case 'SPAM_BLOCKED': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  private initChartOptions(): void {
    this.durationChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Duration (seconds)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Period'
          }
        }
      }
    };
  }

  private updateDurationChart(stats: DurationStat[], label: string): void {
    this.durationChartData = {
      labels: stats.map(s => s.period),
      datasets: [
        {
          label: 'Average Duration',
          data: stats.map(s => s.avgDuration),
          borderColor: '#42A5F5',
          backgroundColor: 'rgba(66, 165, 245, 0.2)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Max Duration',
          data: stats.map(s => s.maxDuration),
          borderColor: '#FFA726',
          backgroundColor: 'rgba(255, 167, 38, 0.2)',
          fill: false,
          tension: 0.4
        },
        {
          label: 'Min Duration',
          data: stats.map(s => s.minDuration),
          borderColor: '#66BB6A',
          backgroundColor: 'rgba(102, 187, 106, 0.2)',
          fill: false,
          tension: 0.4
        }
      ]
    };
  }

  viewDetails(log: AlertLog): void {
    this.selectedLog = log;
    this.displayDetailDialog = true;
    // Scroll to top to see the dialog after a brief delay to ensure dialog is rendered
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }

  onDetailDialogHide(): void {
    this.displayDetailDialog = false;
  }

  retryAlert(log: AlertLog): void {
    // Implement retry logic
    console.log('Retry alert:', log.LALTID);
  }

  formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  }

  formatDate(date: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleString();
  }
}