import { Component,  ChangeDetectorRef } from '@angular/core';
import { ViewEncapsulation, Input, OnChanges, SimpleChanges } from '@angular/core';

import { Message } from '../../components';

import {NgModule } from '@angular/core';
import Chart from '../../../../../node_modules/chart.js/';

import { ExportService} from '../../services/inout/export.service';
import 'chartjs-plugin-zoom'; // Extension to enable zoom in chartjs


export class ICRChart {    
    id: string;    // Chart Id e.g. 'chart1' will have a line chart and a bar chart 
    type: any[] = [];   // Chart type e.g. ['line','bar'] will have a line chart and a bar chart 
    axis_labels: any[] = [];  // Label on the X axis
    label_graph: any [] = []; // Legend for the data by dataset/graph
    data: any [] = [];        // datasets by graph
    nbSetOfData: number; // Number of set of data 
    borderColor: any [] = []; // Color array for the graph e.g. ['green', 'red']
    colorTemplate: any[] = ['green','red', 'bleu', 'purple', 'orange', 'black',
                            '#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6', 
                            '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
                            '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A', 
                            '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
                            '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC', 
                            '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
                            '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680', 
                            '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
                            '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3', 
                            '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF' ];
    refreshChart: number = 0; // Switch ready variable - to notify for change
    unit: string = '';

    public getColorTemplate (i) {
      return this.colorTemplate[i];
    }
}

@Component({
	moduleId: module.id,
    selector: 'chart-cmp',
    templateUrl: './chart.component.html',
    providers: [ExportService],
    styleUrls: ['./chart.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ChartComponent implements OnChanges {

    //@ViewChild('fc') fc: FullCalendar;
    @Input() chart_id;    // Chart Id e.g. 'chart1' will have a line chart and a bar chart 
    @Input() chart_type;   // Chart type e.g. ['line','bar'] will have a line chart and a bar chart 
    @Input() axis_labels;  // Label on the X axis ['Monday,'Tuesaday']
    @Input() label_graph; // Legend for the data by dataset/graph ['Curve']
    @Input() data;        // Multi-datasets by graph [[1,2,3],[4,5,6]]
    @Input() nbSetOfData; // Number of set of data 2
    @Input() borderColor; // Color array for the graph e.g. ['green', 'red']
    @Input() stacked = false;     // Used for bar chart if data to be stacked
    @Input() height = '400px';     // Used for bar chart if data to be stacked
    @Input() width = '100%';     // Used for bar chart if data to be stacked.
    @Input() refreshChart = 0; // Switch refreshChart variable - to notify for change
    @Input() chart_unit = ''; // chart unit allow to have % unit or regular unit label

    @Input() report_id; // Used for export to display in EXCEL export 
    @Input() report_title; // Used for export to display in EXCEL export 
    @Input() report_content; // Used for export to display in EXCEL export 
    @Input() raw_data; // Used for export to display in EXCEL export 

    
    msgs: Message[] = [];

    canvasDocument;
    canvasChart : any;
    chartConfig;
    ctxChart;
    chartData; 
    downloadFile;

    gradientStroke:  any;
    gradientBarChartConfiguration: any;
    gradientChartOptionsConfigurationWithTooltipRed: any;

    PieChart; BarChart; LineChart;

    showCharts: boolean = true; //Toogle on charts lione display

    constructor(private _changeDetector: ChangeDetectorRef, private _exportService: ExportService) {
    }


    handleRetailClick(e) {
    }

    ngAfterViewInit () {
        this.initializeData();
        this.refresh();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['refreshChart']) {
          if(changes.refreshChart.currentValue !== changes.refreshChart.previousValue) { 
              this.initializeData();
              this.refresh();
          }
        }
    }

    initializeData() {

      this.canvasChart = document.getElementById(this.chart_id)  as HTMLElement;

      //console.log(' init: ', this.chart_unit);
      //console.log(' type: ', this.chart_type);
      this.gradientChartOptionsConfigurationWithTooltipRed = {
        maintainAspectRatio: true,
        responsive: true,
        legend: {
          display: true
        },

        tooltips: {
          callbacks:  {label: function(tooltipItem, data) {
                        var label = data.datasets[tooltipItem.datasetIndex].label || '';
                        if (label) { label += ': '; }
                        label += Math.round(tooltipItem.yLabel) + data.unit;
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
        scales: {
          yAxes: [{
            barPercentage: 1.6,
            gridLines: {
              drawBorder: false,
              color: 'rgba(29,140,248,0.0)',
              zeroLineColor: "transparent",
            },
            ticks: {
                beginAtZero: true,
              suggestedMin: 0,
              suggestedMax: 100,
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
      }
    
  

      this.chartConfig = {
          type: this.chart_type[0],
          options: this.gradientChartOptionsConfigurationWithTooltipRed,
          data: {
              labels: this.axis_labels,
              unit: this.chart_unit,
              datasets: []
          }
      };
            
      for (let i =0; i < this.nbSetOfData; i ++) { 
          this.chartConfig.data.datasets.push({
              label: this.label_graph[i],
              type: this.chart_type[i],
              fill: false,
              //backgroundColor: this.gradientStroke,
              borderColor: this.borderColor[i],
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
              data: this.data[i]
              });
      }
      // console.log('chartConfig : ',this.chartConfig);
    }


    refresh() {
      if (this.chartData) {
        this.chartData.destroy();
      }
      let canvas = <HTMLCanvasElement> document.getElementById(this.chart_id);
      if (canvas) {
        let ctx = canvas.getContext('2d');
        this.chartData = new Chart(ctx, this.chartConfig);
      }

    }

    showHide() {
      this.chartData.data.datasets.forEach(function(ds) {
        ds.hidden = !ds.hidden;
      });
      this.showCharts = ! this.showCharts;
      this.chartData.update();
    }

    downloadCSV() {

     let canvas = Object.assign(<HTMLCanvasElement> document.getElementById(this.chart_id));
     let context = canvas.getContext('2d');

      // We're going to modify the context state, so it's
      // good practice to save the current state first.
      context.save();
      context.globalCompositeOperation = 'destination-over';

      // Fill in the background. We do this by drawing a rectangle
      // filling the entire canvas, using the provided color.
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Restore the original context state from `context.save()`
      context.restore();

     let chartImage = canvas.toDataURL("image/png");

     this._exportService.saveCSV(this.raw_data, chartImage, canvas.width, canvas.height,
                                 this.report_id, this.report_title, this.report_content);
    }

}