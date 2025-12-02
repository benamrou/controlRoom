import { Component, OnInit } from '@angular/core';
import { QueryService } from '../../../shared/services/index';

interface VegaProcess {
  processId: number;
  processName: string;
  lastBatchId: number;
  lastPeriodStart: Date | null;
  lastPeriodEnd: Date | null;
  lastRunStart: Date | null;
  lastRunEnd: Date | null;
  durationMinutes?: number;
}

interface TimeGranularity {
  label: string;
  value: 'day' | 'week' | 'month' | '3month' | '6month'  | '9month' | 'year' ;
  days: number;
}

interface ProcessOption {
  label: string;
  value: string;
}

interface DurationDataPoint {
  date: string;
  duration: number;
}

@Component({
  selector: 'app-vega-process-dashboard',
  templateUrl: './vega-process-dashboard.component.html',
  styleUrls: ['./vega-process-dashboard.component.scss']
})

export class VegaProcessDashboardComponent implements OnInit {
  screenID;
  waitMessage: string = '';
  queryID: string = 'VEG0000001';

  // Raw data
  vegaProcesses: VegaProcess[] = [];
  
  // Filtered data for table
  filteredProcesses: VegaProcess[] = [];
  
  // Filter controls
  granularities: TimeGranularity[] = [
    { label: 'Last Day', value: 'day', days: 1 },
    { label: 'Last Week', value: 'week', days: 7 },
    { label: 'Last Month', value: 'month', days: 30 },
    { label: 'Last 3 months', value: '3month', days: 90 },
    { label: 'Last 6 months', value: '6month', days: 180 },
    { label: 'Last 9 months', value: '9month', days: 270 },
    { label: 'Last year', value: 'year', days: 364 }
  ];
  
  selectedGranularity: TimeGranularity = this.granularities[1]; // Default to week
  
  // Process selection
  selectedProcess: string | null = null;
  processOptions: ProcessOption[] = [];
  
  // Chart data
  durationChartData: any;
  chartOptions: any;
  
  subscription = [];
  
  constructor(private _queryService: QueryService) {
    this.screenID = 'SCR0000000048';
  }
  
  ngOnInit() {
    this.loadVegaProcessData();
    this.initializeChartOptions();
  }

  loadVegaProcessData() {
    let param = [];
    this.subscription.push(this._queryService.getQueryResult(this.queryID, param)
      .subscribe( 
        data => {  
          console.log('Data received:', data);
          
          // Map the incoming data to VegaProcess interface
          this.vegaProcesses = data.map(item => {
            const process: VegaProcess = {
              processId: item.processId,
              processName: item.processName,
              lastBatchId: item.lastBatchId,
              lastPeriodStart: item.lastPeriodStart ? new Date(item.lastPeriodStart) : null,
              lastPeriodEnd: item.lastPeriodEnd ? new Date(item.lastPeriodEnd) : null,
              lastRunStart: item.lastRunStart ? new Date(item.lastRunStart) : null,
              lastRunEnd: item.lastRunEnd ? new Date(item.lastRunEnd) : null
            };
            
            // Calculate duration in minutes (with decimal precision)
            if (process.lastRunStart && process.lastRunEnd) {
              process.durationMinutes = 
                Number(((process.lastRunEnd.getTime() - process.lastRunStart.getTime()) / 60000).toFixed(2));
            }
            
            return process;
          });
          
          // Initialize process dropdown options
          this.initializeProcessOptions();
          
          // Apply initial filters
          this.applyFilters();
        },
        error => {
          console.error('Error loading data:', error);
        }
      )
    );
  }
  
  initializeProcessOptions() {
    // Get distinct process names
    const distinctNames = [...new Set(this.vegaProcesses.map(p => p.processName))];
    
    // Create dropdown options
    this.processOptions = distinctNames.map(name => ({
      label: name,
      value: name
    }));
    
    // Sort alphabetically
    this.processOptions.sort((a, b) => a.label.localeCompare(b.label));
  }
  
  onProcessChange() {
    this.applyFilters();
  }
  
  onGranularityChange() {
    this.applyFilters();
  }
  
  applyFilters() {
    // Calculate date range based on granularity
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - this.selectedGranularity.days);
    
    // Filter processes
    this.filteredProcesses = this.vegaProcesses.filter(process => {
      // Check if process matches selected dropdown
      const matchesProcess = !this.selectedProcess || 
        process.processName === this.selectedProcess;
      
      // Check if last run is within date range
      const matchesDateRange = process.lastRunStart && 
        process.lastRunStart >= startDate && 
        process.lastRunStart <= endDate;
      
      return matchesProcess && matchesDateRange;
    });
    
    // Sort by last run start (most recent first)
    this.filteredProcesses.sort((a, b) => {
      if (!a.lastRunStart) return 1;
      if (!b.lastRunStart) return -1;
      return b.lastRunStart.getTime() - a.lastRunStart.getTime();
    });
    
    // Update chart
    this.updateDurationChart();
  }
  
  initializeChartOptions() {
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + context.parsed.y + ' min';
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Date'
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Duration (minutes)'
          },
          ticks: {
            precision: 0
          }
        }
      }
    };
  }
  
  updateDurationChart() {
    if (this.filteredProcesses.length === 0) {
      this.durationChartData = null;
      return;
    }
    
    // Group data by date and process
    const dataByProcess = new Map<string, DurationDataPoint[]>();
    
    this.filteredProcesses.forEach(process => {
      if (!process.lastRunStart || process.durationMinutes === undefined) return;
      
      const dateStr = this.formatDateForChart(process.lastRunStart);
      
      if (!dataByProcess.has(process.processName)) {
        dataByProcess.set(process.processName, []);
      }
      
      dataByProcess.get(process.processName)!.push({
        date: dateStr,
        duration: process.durationMinutes
      });
    });
    
    // Get all unique dates and sort them
    const allDates = new Set<string>();
    dataByProcess.forEach(points => {
      points.forEach(point => allDates.add(point.date));
    });
    const sortedDates = Array.from(allDates).sort();
    
    // Create datasets for each process
    const datasets: any[] = [];
    const colors = [
      { border: '#42A5F5', bg: 'rgba(66, 165, 245, 0.2)' },
      { border: '#66BB6A', bg: 'rgba(102, 187, 106, 0.2)' },
      { border: '#FFA726', bg: 'rgba(255, 167, 38, 0.2)' },
      { border: '#AB47BC', bg: 'rgba(171, 71, 188, 0.2)' },
      { border: '#FF6384', bg: 'rgba(255, 99, 132, 0.2)' },
      { border: '#36A2EB', bg: 'rgba(54, 162, 235, 0.2)' },
      { border: '#FFCE56', bg: 'rgba(255, 206, 86, 0.2)' }
    ];
    
    let colorIndex = 0;
    dataByProcess.forEach((points, processName) => {
      // Create data array matching all dates
      const data = sortedDates.map(date => {
        const point = points.find(p => p.date === date);
        return point ? point.duration : null;
      });
      
      const color = colors[colorIndex % colors.length];
      colorIndex++;
      
      datasets.push({
        label: this.truncateLabel(processName),
        data: data,
        borderColor: color.border,
        backgroundColor: color.bg,
        tension: 0.4,
        fill: true,
        spanGaps: false
      });
    });
    
    this.durationChartData = {
      labels: sortedDates,
      datasets: datasets
    };
  }
  
  formatDateForChart(date: Date): string {
    switch (this.selectedGranularity.value) {
      case 'day':
        // Show date and time for last day
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      case 'week':
        // Show date for last week
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric'
        });
      case 'month':
        // Show date for last month
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric'
        });
      default:
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric'
        });
    }
  }
  
  truncateLabel(label: string): string {
    return label.length > 30 ? label.substring(0, 27) + '...' : label;
  }
  
  formatDuration(minutes: number | undefined): string {
    if (minutes === undefined || minutes === null) {
      return 'N/A';
    }
    
    if (minutes < 1) {
      return `${(minutes*60).toFixed(2)} sec`;
    }
    if (minutes < 60) {
      return `${minutes.toFixed(2)} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    
    if (mins === 0) {
      return `${hours.toFixed(2)}h`;
    }
    
    return `${hours}h ${mins.toFixed(2)}min`;
  }
  
  exportToCSV() {
    const headers = [
      'Process ID',
      'Process Name',
      'Batch ID',
      'Run Start',
      'Run End',
      'Duration (minutes)'
    ];
    
    const rows = this.filteredProcesses.map(p => [
      p.processId,
      `"${p.processName}"`, // Quote to handle commas in names
      p.lastBatchId,
      p.lastRunStart ? p.lastRunStart.toISOString() : '',
      p.lastRunEnd ? p.lastRunEnd.toISOString() : '',
      p.durationMinutes !== undefined ? p.durationMinutes : ''
    ]);
    
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vega_processes_${this.selectedGranularity.value}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}