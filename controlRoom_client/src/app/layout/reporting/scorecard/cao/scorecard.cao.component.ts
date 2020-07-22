import {Component, ViewEncapsulation, ViewChild} from '@angular/core';
import { ScorecardCAOService, WidgetService } from '../../../../shared/services';
import { Dialog, SelectItem, Chips, Message, DataGrid, FullCalendar } from '../../../../shared/components';
import { MessageService } from '../../../../shared/components';
import {DatePipe} from '@angular/common';
import { Observable } from 'rxjs/Observable';
import { map, filter } from 'rxjs/operators';
import 'rxjs/add/operator/toPromise';

import Chart from '../../../../../../node_modules/chart.js/';

/**
 * @author Ahmed Benamrouche
 * 
 */

@Component({
	moduleId: module.id,
    selector: 'scorecard.cao',
    templateUrl: './scorecard.cao.component.html',
    providers: [ScorecardCAOService, WidgetService, MessageService],
    styleUrls: ['./scorecard.cao.component.scss', '../../../../app.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class ScorecardCAOComponent {
   
  @ViewChild('fc') fc: FullCalendar;

   screenID;
   columnOptions: SelectItem[];
   trackIndex: number = 0;

   // Autocomplete list
   filteredDept: any [];
   departmentCode: string [];
   departmentLabel: string [];
   selectedDept: string;
   selectedDeptLabel: string;

  // Search result 
   scorecardDate: any;
   searchSiteCode: any;
   
   searchResultCycleCount : any [] = [];
   searchResultCycleCountActivity : any [] = [];
   searchResultCaoStatus : any [] = [];
   searchResultCaoActivity : any [] = [];

   searchResult : any [] = [];
   selectedElement: any;
   columnsResult: any [] = [];
   columnsSchedule: any [] = [];
   reportReady: boolean;
   reportCycleCountDetail: boolean;
   reportCycleCountActivity: boolean;
   reportCaoStatus: boolean;
   reportCaoActivity: boolean;
   dataAvailable: boolean;

   datePipe: DatePipe;
   dateNow: Date;
   dateTomorrow: Date;

   searchCode: any;
   searchDate:  any;
   search: any;
   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries

  // Search action
  searchLaunched: boolean;
  msgs: Message[] = [];

  // Result
  additionalCycleCountItem: any;
  percentageCycleCount: any;
  percentageInventoryAccuracy: any;
  percentageSuspiciousInventory: any;
  percentageOverride: any;
  additionalCaseOverride: any;
  removedCaseOverride: any;

  itemAttentionNeeded: any;
  itemHighVariance: any;

  /** Performance Chart */
  chart_labels: any [];
  chart_cao_labels: any [];
  label;
  cao_label_graph1;
  cao_label_graph2;
  data_neg: any [];
  data_zero: any [];
  data_others: any [];
  data_performance: any [];
  data_cao_override: any [];
  data_cao_total: any [];
  data_cao_volume_override: any [];
  data_cao_volume_total: any [];
  data_cao_performance: any [];

  canvasVolumeChart : any;
  canvasPerformanceChart : any;
  canvasVolumeCaoChart : any;
  canvasPerformanceCaoChart : any;
  ctxVolumeChart; ctxPerformanceChart;
  ctxVolumeCaoChart; ctxPerformanceCaoChart;
  datasets: any;
  cao_datasets: any;
  data: any;
  cao_data_graph1: any;
  cao_data_graph2: any;
  volumeChartData;
  performanceChartData;
  volumeCaoChartData;
  performanceCaoChartData;
  clickedNegZero: boolean = true;
  clickedOthers: boolean = false;
  clickedCaoLine: boolean = true;
  clickedCaoVolume: boolean = false;
  clickedCaoPerformance: boolean = false;
  clicked2: boolean = false;
  clickedDairy: boolean = true;
  clickedGrocery: boolean = true;
  volumeChartConfig: any;
  performanceChartConfig: any;
  volumeCaoChartConfig: any;
  performanceCaoChartConfig: any;
  gradientStrokeVolume:  any;
  gradientStrokePerformance:  any;
  gradientChartOptionsConfigurationWithTooltipBlue: any;
  gradientChartOptionsConfigurationWithTooltipPurple: any;
  gradientChartOptionsConfigurationWithTooltipRed: any;
  gradientChartOptionsConfigurationWithTooltipOrange: any;
  gradientChartOptionsConfigurationWithTooltipGreen: any;
  gradientBarChartConfiguration: any;

  screenInfo;

  constructor(private _scorecardCAOService: ScorecardCAOService, private _messageService: MessageService) {
    this.screenID =  'SCR0000000002';
    this.datePipe     = new DatePipe('en-US');
    this.dateNow = new Date();
    this.dateTomorrow =  new Date(this.dateNow.setDate(this.dateNow.getDate() + 1));

    this.dateNow = new Date();
    this.scorecardDate = new Date();
    this.departmentCode =  ["1020000000000", "1030000000000"];
    this.departmentLabel =  ["Dairy", "Grocery"];
    this.filteredDept = ["1020000000000 | Dairy", "1030000000000 | Grocery"];
    this.searchSiteCode = '';
    this.selectedDept = '';
    this.datasets = [];

    this.razSearch();
  }

  openScorecard() {
    //this.searchCode = searchCode;
    let filteredDeptCycleCountDetail;
    let filteredDeptCycleCountActivty;
    this.razSearch();
    this.searchLaunched = true;

    this.searchDate = this.datePipe.transform(this.scorecardDate, 'MM/dd/yyyy')
    this._messageService.add({severity:'info', summary:'Info Message', 
                              detail: 'Preparing Scorecard Store #' + this.searchSiteCode + 
                                      ' on ' + this.searchDate });


    /** Inventory Status regroup day inventory informaion */
    this._scorecardCAOService.getNegInventoryStatus( this.searchDate, this.searchSiteCode, '-1')
            .subscribe( 
                data => { this.searchResultCycleCount = data; 
                },
                error => {
                      // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                      this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                      this.searchResultCycleCount =[];
                      this.updateDepartmentCycleCountDetail(this.selectedDept);
                },
                () => {
                    this.updateDepartmentCycleCountDetail(this.selectedDept);
                }
            );

     /** Inventory Activity regroup last X weeks performance activity */  
    this._scorecardCAOService.getInventoryActivity(this.searchDate, this.searchSiteCode, '-1')
              .subscribe( 
              data => { this.searchResultCycleCountActivity = data; // put the data returned from the server in our variable
                        this.reportReady = true;
              },
              error => {
                  // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                  this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                  this.searchResultCycleCountActivity = [];
                  this.updateDepartmentCycleCountActivity(this.selectedDept);
                  this.refreshGraph();
              },
              () => {
                    this.updateDepartmentCycleCountActivity(this.selectedDept);
                    this.refreshGraph();
              }
        );

     /** CAO status regroup last X weeks performance activity */  
      this._scorecardCAOService.getCAOStatus(this.searchDate, this.searchSiteCode, '-1')
            .subscribe( 
            data => { this.searchResultCaoStatus = data; // put the data returned from the server in our variable
                      this.reportReady = true;
            },
            error => {
                // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                this.searchResultCaoStatus = [];
                this.updateDepartmentCaoStatus(this.selectedDept);
            },
            () => {
                  this.updateDepartmentCaoStatus(this.selectedDept);
            }
        );

        /** CAO Activity regroup last X weeks performance activity */  
          this._scorecardCAOService.getCAOActivity(this.searchDate, this.searchSiteCode, '-1')
          .subscribe( 
          data => { this.searchResultCaoActivity = data; // put the data returned from the server in our variable
                    this.reportReady = true;
          },
          error => {
              // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
              this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
              this.searchResultCaoActivity = [];
              this.updateDepartmentCaoActivity(this.selectedDept);
              this.refreshCaoGraph();
          },
          () => {
                this.updateDepartmentCaoActivity(this.selectedDept);
                this.refreshCaoGraph();
          }
      );
  }

  razSearch () {
    this.searchResult = [];
    this.selectedElement = null;
    this.reportReady = false;
    this.reportCycleCountActivity = false;
    this.reportCycleCountDetail = false;
    this.reportCaoStatus = false; 
    this.reportCaoActivity = false; 
    this.dataAvailable = false;
    this.searchLaunched = false;
    /** Default Departement */
    this.selectedDept=this.departmentCode[0]; // Dairy
    this.clickedDairy=true;
    this.clickedGrocery=false;
    this.clickedNegZero=true;
    this.clickedOthers=false;
    this.selectedDeptLabel  = this.departmentLabel[0];
  }

  /**
   * function onRowSelect (Evemt on schedule se4lection) 
   * When User selects a supplier schedule, this function copies the schedule to potential temporary schedule.
   * @param event 
   */
  onRowSelect(event) {
    
  }
  
  ngOnInit() {
    this.gradientChartOptionsConfigurationWithTooltipBlue = {
      maintainAspectRatio: false,
      legend: {
        display: true
      },

      tooltips: {
        backgroundColor: '#f5f5f5',
        titleFontColor: '#333',
        bodyFontColor: '#666',
        bodySpacing: 4,
        xPadding: 12,
        mode: "nearest",
        intersect: 0,
        position: "nearest"
      },
      responsive: true,
      scales: {
        yAxes: [{
          barPercentage: 1.6,
          gridLines: {
            drawBorder: false,
            color: 'rgba(29,140,248,0.0)',
            zeroLineColor: "transparent",
          },
          ticks: {
            //suggestedMin: 60,
            //suggestedMax: 125,
            padding: 20,
            fontColor: "#2380f7"
          }
        }],

        xAxes: [{
          barPercentage: 1.6,
          gridLines: {
            drawBorder: false,
            color: 'rgba(29,140,248,0.1)',
            zeroLineColor: "transparent",
          },
          ticks: {
            padding: 20,
            fontColor: "#2380f7"
          }
        }]
      }
    };


    this.gradientChartOptionsConfigurationWithTooltipRed = {
      maintainAspectRatio: false,
      legend: {
        display: true
      },

      tooltips: {
        backgroundColor: '#f5f5f5',
        titleFontColor: '#333',
        bodyFontColor: '#666',
        bodySpacing: 4,
        xPadding: 12,
        mode: "nearest",
        intersect: 0,
        position: "nearest"
      },
      responsive: true,
      scales: {
        yAxes: [{
          barPercentage: 1.6,
          gridLines: {
            drawBorder: false,
            color: 'rgba(29,140,248,0.0)',
            zeroLineColor: "transparent",
          },
          ticks: {
            //suggestedMin: 60,
            //suggestedMax: 125,
            padding: 20,
            fontColor: "#9a9a9a"
          }
        }],

        xAxes: [{
          barPercentage: 1.6,
          gridLines: {
            drawBorder: false,
            color: 'rgba(233,32,16,0.1)',
            zeroLineColor: "transparent",
          },
          ticks: {
            padding: 20,
            fontColor: "#9a9a9a"
          }
        }]
      }
    };


    this.gradientBarChartConfiguration = {
      maintainAspectRatio: false,
      legend: {
        display: true
      },

      tooltips: {
        callbacks: {
              label: function(tooltipItem, data) {
                var label = data.datasets[tooltipItem.datasetIndex].label || '';
                if (label) { label += ': '; }
                label += Math.round(tooltipItem.yLabel) + '%';
                return label;
            }},
        backgroundColor: '#f5f5f5',
        titleFontColor: '#333',
        bodyFontColor: '#666',
        bodySpacing: 4,
        xPadding: 12,
        mode: "nearest",
        intersect: 0,
        position: "nearest"
      },
      responsive: true,
      scales: {
        yAxes: [{

          gridLines: {
            drawBorder: false,
            color: 'rgba(29,140,248,0.1)',
            zeroLineColor: "transparent",
          },
          ticks: {
            suggestedMin: 10,
            suggestedMax: 100,
            padding: 20,
            fontColor: "#9e9e9e"
          }
        }],

        xAxes: [{

          gridLines: {
            drawBorder: false,
            color: 'rgba(29,140,248,0.1)',
            zeroLineColor: "transparent",
          },
          ticks: {
            padding: 20,
            fontColor: "#9e9e9e"
          }
        }]
      }
    };
  }

  updateOptions() {
    this.volumeChartData.data.datasets[0].data = this.data;
    this.volumeChartData.data.datasets[0].label = this.label;
    this.volumeChartData.update();
  }

  updateCaoOptions() {
    this.volumeCaoChartData.data.datasets[0].data = this.cao_data_graph1;
    this.volumeCaoChartData.data.datasets[0].label = this.cao_label_graph1;
    this.volumeCaoChartData.data.datasets[1].data = this.cao_data_graph2;
    this.volumeCaoChartData.data.datasets[1].label = this.cao_label_graph2;
    this.volumeCaoChartData.update();
  }
  
  refreshGraph() {
    /** Refresh Volume Chart */
    if (this.datasets.length > 0) {
      this.data = this.datasets[0];

      this.canvasVolumeChart = document.getElementById("volumeChart");

      this.ctxVolumeChart = this.canvasVolumeChart.getContext("2d");

      this.gradientStrokeVolume = this.ctxVolumeChart.createLinearGradient(0, 230, 0, 50);

      this.gradientStrokeVolume.addColorStop(1, 'rgba(233,32,16,0.2)');
      this.gradientStrokeVolume.addColorStop(0.4, 'rgba(233,32,16,0.0)');
      this.gradientStrokeVolume.addColorStop(0, 'rgba(233,32,16,0)'); //red colors


      this.volumeChartConfig = {
        type: 'line',
        data: {
          labels: this.chart_labels,
          datasets: [{
            label: "Zero inventory",
            fill: true,
            backgroundColor: this.gradientStrokeVolume,
            borderColor: '#ec250d',
            borderWidth: 2,
            borderDash: [],
            borderDashOffset: 0.0,
            pointBackgroundColor: '#ec250d',
            pointBorderColor: 'rgba(255,255,255,0)',
            pointHoverBackgroundColor: '#ec250d',
            pointBorderWidth: 20,
            pointHoverRadius: 4,
            pointHoverBorderWidth: 15,
            pointRadius: 4,
            data:  this.datasets[1],
          },{
            label: "Negative Inventory",
            fill: true,
            backgroundColor: this.gradientStrokeVolume,
            borderColor: 'green',
            borderWidth: 2,
            borderDash: [],
            borderDashOffset: 0.0,
            pointBackgroundColor: '#yellow',
            pointBorderColor: 'rgba(255,255,255,0)',
            pointHoverBackgroundColor: 'yellow',
            pointBorderWidth: 20,
            pointHoverRadius: 4,
            pointHoverBorderWidth: 15,
            pointRadius: 4,
            data: this.data_neg,
          }
        ]
        },
        options: this.gradientChartOptionsConfigurationWithTooltipRed
      };

      if (this.volumeChartData) {
        this.volumeChartData.destroy();
      }
      this.volumeChartData = new Chart(this.ctxVolumeChart, this.volumeChartConfig);

      /** Refrech Performance Chart */
      this.canvasPerformanceChart = document.getElementById("performanceChart");
      this.ctxPerformanceChart = this.canvasPerformanceChart.getContext("2d");

      this.gradientStrokePerformance = this.ctxPerformanceChart.createLinearGradient(0, 230, 0, 50);

      this.gradientStrokePerformance.addColorStop(1, 'rgba(233,32,16,0.2)');
      this.gradientStrokePerformance.addColorStop(0.4, 'rgba(233,32,16,0.0)');
      this.gradientStrokePerformance.addColorStop(0, 'rgba(233,32,16,0)'); //red colors

      this.performanceChartConfig = {
        type: 'bar',
        data: {
          labels: this.chart_labels,
          datasets: [{
            label: "% Negative Reviewed",
            fill: true,
            backgroundColor: this.gradientStrokePerformance,
            borderColor: '#ec250d',
            maxBarThickness: 4,
            borderWidth: 2,
            borderDash: [],
            borderDashOffset: 0.0,
            pointBackgroundColor: '#ec250d',
            pointBorderColor: 'rgba(255,255,255,0)',
            pointHoverBackgroundColor: '#ec250d',
            pointBorderWidth: 20,
            pointHoverRadius: 4,
            pointHoverBorderWidth: 15,
            pointRadius: 4,
            data: this.data_performance,
          }
        ]
        },
        options: this.gradientBarChartConfiguration
      };

      if (this.performanceChartData) {
        this.performanceChartData.destroy();
      }
      this.performanceChartData = new Chart(this.canvasPerformanceChart, this.performanceChartConfig);
    }
    if(this.volumeChartData) {
      this.volumeChartData.update();
    }
    if (this.performanceChartData)  {
     this.performanceChartData.update();
    }
  }


  refreshCaoGraph() {
    /** Refresh Volume Chart */
    if (this.cao_datasets.length > 0) {
      //this.data = this.cao_datasets[0];

      this.canvasVolumeCaoChart = document.getElementById("volumeCaoChart");
      this.ctxVolumeCaoChart = this.canvasVolumeCaoChart.getContext("2d");

      this.gradientStrokeVolume = this.ctxVolumeCaoChart.createLinearGradient(0, 230, 0, 50);

      this.gradientStrokeVolume.addColorStop(1, 'rgba(233,32,16,0.2)');
      this.gradientStrokeVolume.addColorStop(0.4, 'rgba(233,32,16,0.0)');
      this.gradientStrokeVolume.addColorStop(0, 'rgba(233,32,16,0)'); //red colors


      this.volumeCaoChartConfig = {
        type: 'line',
        data: {
          labels: this.chart_cao_labels,
          datasets: [{
            label: "Nb. line item changed",
            fill: true,
            backgroundColor: this.gradientStrokeVolume,
            borderColor: '#ec250d',
            borderWidth: 2,
            borderDash: [],
            borderDashOffset: 0.0,
            pointBackgroundColor: '#ec250d',
            pointBorderColor: 'rgba(255,255,255,0)',
            pointHoverBackgroundColor: '#ec250d',
            pointBorderWidth: 20,
            pointHoverRadius: 4,
            pointHoverBorderWidth: 15,
            pointRadius: 4,
            data:  this.cao_datasets[1],
          },{
            label: "Nb. total line",
            fill: true,
            backgroundColor: this.gradientStrokeVolume,
            borderColor: 'green',
            borderWidth: 2,
            borderDash: [],
            borderDashOffset: 0.0,
            pointBackgroundColor: '#yellow',
            pointBorderColor: 'rgba(255,255,255,0)',
            pointHoverBackgroundColor: 'yellow',
            pointBorderWidth: 20,
            pointHoverRadius: 4,
            pointHoverBorderWidth: 15,
            pointRadius: 4,
            data: this.cao_datasets[0]
          }
        ]
        },
        options: this.gradientChartOptionsConfigurationWithTooltipRed
      };

      if (this.volumeCaoChartData) {
        this.volumeCaoChartData.destroy();
      }
      this.volumeCaoChartData = new Chart('volumeCaoChart', this.volumeCaoChartConfig);

      /** Refrech Performance Chart */
      this.canvasPerformanceCaoChart = document.getElementById("performanceCaoChart");
      this.ctxPerformanceCaoChart = this.canvasPerformanceCaoChart.getContext("2d");

      this.gradientStrokePerformance = this.ctxPerformanceCaoChart.createLinearGradient(0, 230, 0, 50);

      this.gradientStrokePerformance.addColorStop(1, 'rgba(233,32,16,0.2)');
      this.gradientStrokePerformance.addColorStop(0.4, 'rgba(233,32,16,0.0)');
      this.gradientStrokePerformance.addColorStop(0, 'rgba(233,32,16,0)'); //red colors

      this.performanceCaoChartConfig = {
        type: 'bar',
        data: {
          labels: this.chart_cao_labels,
          datasets: [{
            label: "% Override",
            fill: true,
            backgroundColor: this.gradientStrokePerformance,
            borderColor: '#ec250d',
            maxBarThickness: 4,
            borderWidth: 2,
            borderDash: [],
            borderDashOffset: 0.0,
            pointBackgroundColor: '#ec250d',
            pointBorderColor: 'rgba(255,255,255,0)',
            pointHoverBackgroundColor: '#ec250d',
            pointBorderWidth: 20,
            pointHoverRadius: 4,
            pointHoverBorderWidth: 15,
            pointRadius: 4,
            data: this.data_cao_performance,
          }
        ]
        },
        options: this.gradientBarChartConfiguration
      };

      if (this.performanceCaoChartData) {
        this.performanceCaoChartData.destroy();
      }
      this.performanceCaoChartData = new Chart('performanceCaoChart', this.performanceCaoChartConfig);
    }
    if(this.volumeCaoChartData) {
      this.volumeCaoChartData.update();
    }
    if (this.performanceCaoChartData)  {
     this.performanceCaoChartData.update();
    }
    console.log('this.volumeCaoChartConfig : ' ,this.volumeCaoChartConfig);
  }

  updateDepartment(deptCode:any) {
    this.updateDepartmentCycleCountDetail(deptCode);
    this.updateDepartmentCycleCountActivity(deptCode);
    this.updateDepartmentCaoStatus(deptCode);
    this.updateDepartmentCaoActivity(deptCode);

    this.refreshGraph();
    this.refreshCaoGraph();
    this.clickedNegZero=true;
    this.clickedOthers=false;
    this.clickedCaoLine=true;
    this.clickedCaoVolume=false;
  }

  updateDepartmentCycleCountDetail(deptCode: any) {

    let filteredDeptCycleCountDetail;

    filteredDeptCycleCountDetail = this.searchResultCycleCount.filter((items) => items.DEPT_CODE === deptCode);
    if (filteredDeptCycleCountDetail.length > 0 ) {
      /*this._messageService.add({severity:'warn', summary:'Info Message', detail: 'Retrieved ' + 
                    this.searchResultCycleCount.length + ' reference(s).'});*/
       this.additionalCycleCountItem = 
       filteredDeptCycleCountDetail.length - 
       filteredDeptCycleCountDetail.filter((items) => !isNaN(parseFloat(items.NEG_REPORT_QTY)) && !isNaN(items.NEG_REPORT_QTY - 0)).length;
       if(filteredDeptCycleCountDetail.filter((items) => parseFloat(items.NEG_REPORT_QTY) < 0 ).length === 0) {
         this.percentageCycleCount = 1;
       }
       else {
         this.percentageCycleCount =  filteredDeptCycleCountDetail.filter((items) => parseFloat(items.NEG_REPORT_QTY) < 0 && parseFloat(items.QTY ) >=0 ).length / 
         filteredDeptCycleCountDetail.filter((items) => parseFloat(items.NEG_REPORT_QTY) < 0 ).length;
       }

       //console.log('items.NEG_REPORT_QTY : ' + JSON.stringify(this.searchResultCycleCount.filter((items) => parseFloat(items.NEG_REPORT_QTY) < 0 )));
       //console.log('this.percentageCycleCount : ' + this.percentageCycleCount);
       this.itemAttentionNeeded = [];
       this.itemHighVariance = [];
       this.itemAttentionNeeded = filteredDeptCycleCountDetail.filter((items) => parseFloat(items.NEG_REPORT_QTY)< 0 && !parseFloat(items.QTY ) && 
                                                                                items.COUNTING_DATE === this.searchDate && !parseFloat(items.VARIANCE));
       this.itemHighVariance = filteredDeptCycleCountDetail.filter((items) => Math.abs(parseFloat(items.VARIANCE)) > -3 && items.COUNTING_DATE === this.searchDate);
       this.itemAttentionNeeded = this.itemAttentionNeeded.sort(function(obj1, obj2) {
                                   // Ascending: High variance first top 5
                                   return Math.abs(obj2.NEG_REPORT_QTY) - Math.abs(obj1.NEG_REPORT_QTY);
                               }).slice(0,5);
       this.itemHighVariance = this.itemHighVariance.sort(function(obj1, obj2) {
                                   // Ascending: High variance first top 5
                                   return Math.abs(obj2.VARIANCE) - Math.abs(obj1.VARIANCE);
                               }).slice(0,5);
                                 
       this.reportReady = true;
       this.reportCycleCountDetail = true; 
       this.dataAvailable = true;
       //this.updateChart();
     }
    else {
      this.reportReady = true;
      this.reportCycleCountDetail = true; 
      this.dataAvailable = false;
    }
  }

  updateDepartmentCycleCountActivity(deptCode: any) {

    let filteredDeptCycleCountActivty;

    filteredDeptCycleCountActivty = this.searchResultCycleCountActivity.filter((items) => items.DEPT_CODE === deptCode);

    //console.log('Data activity : ' +JSON.stringify(filteredDeptCycleCountActivty));
    this.chart_labels = filteredDeptCycleCountActivty.map(item => item.COUNTING_DATE);
    //console.log('chart_labels : ' +JSON.stringify(this.chart_labels));
    this.data_neg =  filteredDeptCycleCountActivty.map(item => item.NEG_MORNING);
    this.data_zero =  filteredDeptCycleCountActivty.map(item => item.ZERO_MORNING);
    this.data_others =  filteredDeptCycleCountActivty.map(item => item.OTHER_CYCLE);
    this.data_performance = filteredDeptCycleCountActivty.map(item => item.NEG_COVERED);
    
    this.datasets = [];
    this.datasets.push(this.data_neg);
    this.datasets.push(this.data_zero);
    this.datasets.push(this.data_others);
    this.datasets.push(this.data_performance);

    this.percentageCycleCount = filteredDeptCycleCountActivty.filter((items) => items.COUNTING_DATE === this.searchDate.substring(0,5))[0].NEG_COVERED/100;
    this.additionalCycleCountItem = filteredDeptCycleCountActivty.filter((items) => items.COUNTING_DATE === this.searchDate.substring(0,5))[0].OTHER_CYCLE;

    this.reportReady = true;
    this.reportCycleCountActivity = true; 
    this.dataAvailable = true;

  }

  updateDepartmentCaoStatus(deptCode: any) {

    let filteredDeptCaoActivty, overrideCao, dayCaoData, overriedLess, overriedMore;

    filteredDeptCaoActivty = this.searchResultCaoStatus.filter((items) => items.DEPT_CODE === deptCode);

    //console.log('Cao activity : ' +JSON.stringify(filteredDeptCaoActivty));

    this.chart_cao_labels = filteredDeptCaoActivty.map(item => item.ORDER_DATE);
    dayCaoData = filteredDeptCaoActivty.filter((items) => items.ORDER_DATE === this.searchDate);
    
    overrideCao = dayCaoData.filter(item => item.QTY_AUTO !== item.QTY);

    //console.log( ' overrideCao : ' + JSON.stringify(overrideCao));
    //console.log( ' overrideCao length: ' + JSON.stringify(overrideCao.length));
    //console.log( ' dayCaoData length: ' + JSON.stringify(dayCaoData.length));
    

    this.percentageOverride = overrideCao.length / dayCaoData.length;
    overriedLess= overrideCao.filter((items) => items.QTY_AUTO > items.QTY );

    overriedMore= overrideCao.filter((items) => items.QTY_AUTO < items.QTY );

    this.additionalCaseOverride = overriedMore.reduce(function(total, currentValue) {
                                          return total + (currentValue.QTY-currentValue.QTY_AUTO)/currentValue.NB_SKU_PCK;
                                      }, 0);
    this.removedCaseOverride = overriedLess.reduce(function(total, currentValue) {
                                          return total + (currentValue.QTY_AUTO -currentValue.QTY)/currentValue.NB_SKU_PCK;
                                      }, 0);

    //console.log( ' percentageOverride : ' + JSON.stringify(this.percentageOverride));
    //console.log( ' overriedMore : ' + JSON.stringify(overriedMore));
    //console.log( ' overriedLess : ' + JSON.stringify(overriedLess));
    //console.log( ' removedCaseOverride : ' + JSON.stringify(this.removedCaseOverride));
    //console.log( ' additionalCaseOverride : ' + JSON.stringify(this.additionalCaseOverride));
    this.reportReady = true;
    this.reportCaoStatus = true; 
    this.dataAvailable = true;

  }

  updateDepartmentCaoActivity(deptCode: any) {

    let filteredDeptCaoActivty;

    filteredDeptCaoActivty = this.searchResultCaoActivity.filter((items) => items.DEPT_CODE === deptCode);

    //console.log('Cao activity : ' +JSON.stringify(filteredDeptCaoActivty));

    this.chart_cao_labels = filteredDeptCaoActivty.map(item => item.ORDER_DATE);
    

    this.data_cao_override =  filteredDeptCaoActivty.map(item => item.OVERRIDE_TOTAL);
    this.data_cao_total =  filteredDeptCaoActivty.map(item => item.NB_ITEMS);
    this.data_cao_volume_override =  filteredDeptCaoActivty.map(item => item.OVERRIDE_QTY);
    this.data_cao_volume_total = filteredDeptCaoActivty.map(item => item.VOLUME_QTY);
    this.data_cao_performance = filteredDeptCaoActivty.map(item => item.OVERRIDE_PERC);
    
    this.cao_datasets = [];
    this.cao_datasets.push(this.data_cao_total);
    this.cao_datasets.push(this.data_cao_override);
    this.cao_datasets.push(this.data_cao_volume_total);
    this.cao_datasets.push(this.data_cao_volume_override);
    this.cao_datasets.push(this.data_cao_performance);

    this.reportReady = true;
    this.reportCaoActivity = true; 
    this.dataAvailable = true;

  }
}