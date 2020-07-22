import {Component, ViewEncapsulation, ViewChild} from '@angular/core';
import { ReportingService, WidgetService } from '../../../../shared/services';
import { Dialog, SelectItem, Chips, Message, DataGrid, FullCalendar, TreeModule } from '../../../../shared/components';
import { MessageService } from '../../../../shared/components';
import { ChartModule, ICRChart } from '../../../../shared/graph';
import { FilterComponent } from '../../../../shared/filter';
import {DatePipe} from '@angular/common';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/toPromise';
import { FilterModule } from '../../../../shared/filter';
import * as _ from 'lodash';


/**
 * @author Ahmed Benamrouche
 * 
 */

@Component({
	moduleId: module.id,
    selector: 'dashboard.cycle',
    templateUrl: './dashboard.cycle.component.html',
    providers: [ReportingService, WidgetService, MessageService, ChartModule, FilterModule],
    styleUrls: ['./dashboard.cycle.component.scss', '../../../../app.component.scss'],
    encapsulation: ViewEncapsulation.None

})

export class DashboardCycleComponent {
   
  @ViewChild('ICRfilter') filter: FilterComponent;

   trackIndex: number = 0;

  // Search result 
   scorecardDate: any;
   searchResult : any [] = [];
   selectedElement: any;
   columnsResult: any [] = [];
   columnsSchedule: any [] = [];

   datePipe: DatePipe;
   dateNow: Date;
   dateTomorrow: Date;

   searchResultCycleCount;
   searchResultCycleCountOthers;
   searchSiteCode;
   reportCycleCountActivity = false;
   reportCycleCountOthersActivity = false;
   filterReady = false;

   percentageCycleCount = 0;
   additionalCycleCountItem = 0;

   network;
   structure;
   flow;

   selectedFlow;
   selectedNetwork;
   selectedStructure;

   refreshingData;

  // Search action
   
  chartConfigActivity: ICRChart;
  chartConfigActivity_Performance: ICRChart;
  msgs: Message[] = [];

  reportTitleNeg;
  reportContentNeg;
  reportTitlePerf;
  reportContentPerf;

  data_neg_process;
  data_zero_process;
  data_others_process;
  data_covered;

  screenID;

  buttonEffect = {
    NEG_DISPLAY: true,
    ZERO_DISPLAY: false,
    OTHERS_DISPLAY: false,
    COVERED_DISPLAY: true
  }; // data_neg_process, data_zero_process, data_others_process, data_covered

  constructor(private _widgetService: WidgetService, private _messageService: MessageService,
              private _dashboardService: ReportingService) {

    this.screenID =  'SCR0000000004';
    this.reportTitlePerf ='Cycle count activity on neg./zero';
    this.reportContentPerf ='Store cycle count activity on CAO items';

    this.reportTitleNeg ='Cycle count Negative/Zero Inv.';
    this.reportContentNeg ='Store cycle count neg/zero inventory on CAO items'

    this.datePipe     = new DatePipe('en-US');
    this.dateNow = new Date();
    this.dateTomorrow =  new Date(this.dateNow.setDate(this.dateNow.getDate() + 1));


    this.chartConfigActivity = new ICRChart();
    this.chartConfigActivity.id  = 'chart_volume';
    this.chartConfigActivity.type  = ['line'];
    this.chartConfigActivity.axis_labels = [];
    this.chartConfigActivity.label_graph = [];
    this.chartConfigActivity.data = []; 
    this.chartConfigActivity.nbSetOfData = 1;
    this.chartConfigActivity.borderColor = [];

    this.chartConfigActivity_Performance = new ICRChart();
    this.chartConfigActivity_Performance.id  = 'chart_performance';
    this.chartConfigActivity_Performance.type  = ['line'];
    this.chartConfigActivity_Performance.axis_labels = [];
    this.chartConfigActivity_Performance.label_graph = [];
    this.chartConfigActivity_Performance.data = []; 
    this.chartConfigActivity_Performance.nbSetOfData = 1;
    this.chartConfigActivity_Performance.borderColor = [];

    this.selectedNetwork = [];
    this.selectedStructure = [];
    this.selectedFlow = [];
    
    this.refreshingData = false;

    this.buttonEffect = {
      NEG_DISPLAY: true,
      ZERO_DISPLAY: false,
      OTHERS_DISPLAY: false,
      COVERED_DISPLAY: true
    }; 

    // chart_id;    // Chart Id e.g. 'chart1' will have a line chart and a bar chart 
    // chart_type;   // Chart type e.g. ['line','bar'] will have a line chart and a bar chart 
    // axis_labels;  // Label on the X axis ['Monday,'Tuesaday']
    // label_graph; // Legend for the data by dataset/graph ['Curve']
    // data;        // Multi-datasets by graph [[1,2,3],[4,5,6]]
    // nbSetOfData; // Number of set of data 2
    // borderColor; // Color array for the graph e.g. ['green', 'red']

    this.razDashboard();
  }

  razDashboard () {
    this.searchResultCycleCount = [];
    this.percentageCycleCount = 0;
    this.network= [];
    this.structure=[];
    this.flow=[];
  }

  ngAfterViewInit () {
    this.filterReady = true;

    // Wait filter to be fully loaded
    /*this.filter.filterLoaded.subscribe(data =>  {
      this.getDashboardData();
    });*/
  }

  getDashboardData() {
    /** Inventory Status regroup day inventory informaion */


    // Webservice Cycle Count Activity on Neg. and Zero Inv.
    this._dashboardService.getDashboard('DSHPI00001')
    .subscribe( 
        data => { 
                this.reportCycleCountActivity = true;
                this.searchResultCycleCount = data; 
        },
        error => {
              this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
              this.searchResultCycleCount =[];
        },
        () => {
            this.manipulateData();
        }
    );

    // Webservice Cycle Count Activity on non-Neg and zero reported items
    this._dashboardService.getDashboard('CYC0000001')
            .subscribe( 
                data => { 
                        this.reportCycleCountOthersActivity = true;
                        this.searchResultCycleCountOthers = data; 
                },
                error => {
                      this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                      this.searchResultCycleCountOthers =[];
                },
                () => {
                }
            );
  }

  removeDuplicate(values) {
    //console.log('Removing duplicate...');
    let concatArray = values.map(eachValue => {
      return Object.values(eachValue).join('')
    })
    let filterValues = values.filter((value, index) => {
      return concatArray.indexOf(concatArray[index]) === index
  
    })
    return filterValues
  }

  clickedData(option) {
    this.buttonEffect.NEG_DISPLAY =  false;
    this.buttonEffect.ZERO_DISPLAY =  false;
    this.buttonEffect.OTHERS_DISPLAY =  false;

    this.chartConfigActivity.data = [];

    switch(option) {
      case 'NEG_DISPLAY' :
        this.chartConfigActivity.data = [...this.data_neg_process];
        this.buttonEffect.NEG_DISPLAY = true;
        break;
      case 'ZERO_DISPLAY' :
        this.chartConfigActivity.data= [...this.data_zero_process];
        this.buttonEffect.ZERO_DISPLAY = true;
        break;
      case 'OTHERS_DISPLAY' :
        this.chartConfigActivity.data= [...this.data_others_process];
        this.buttonEffect.OTHERS_DISPLAY =  true;
        break;
      default:
        this.chartConfigActivity.data= [...this.data_neg_process];
        this.buttonEffect.NEG_DISPLAY = true;
        break;
    }
    this.chartConfigActivity.refreshChart = this.chartConfigActivity.refreshChart+1; 
  }

  manipulateData() {
    let data, data_neg, data_zero, data_others, data_performance, data_subcat;
    let locationArray = this.searchResultCycleCount.map(item => item.STORE_NUM);
    let locations = locationArray.filter((val, ind) => locationArray.indexOf(val) === ind);

    this.chartConfigActivity.label_graph = [];
    this.chartConfigActivity.data = [];
    this.chartConfigActivity.borderColor = [];
    this.chartConfigActivity.type = [];

    this.chartConfigActivity_Performance.label_graph = [];
    this.chartConfigActivity_Performance.data = [];
    this.chartConfigActivity_Performance.borderColor = [];
    this.chartConfigActivity_Performance.type = [];

    this.data_neg_process = [];
    this.data_zero_process = [];
    this.data_covered = [];
    this.data_others_process = [];

   data_subcat = _(this.searchResultCycleCount).groupBy(x => x.SCAT_CODE)
    .map(g => {
      return {
          SCAT_CODE: g[0].SCAT_CODE
          }
    }).value();

    //console.log ('data_subcat : ', data_subcat);
    for (let i =0; i < data_subcat.length; i ++) {
       this.filter.setSelectedStructure(data_subcat[i].SCAT_CODE);
    }
    this.filter.setSelectedFlow(1);
    this.filter.setSelectedFlow(3);

    // Parse all the location and create the chartConfig for each.
    for(let i=0; i < locations.length; i ++) {
      this.filter.setSelectedNetwork(locations[i]);

      data =  this.searchResultCycleCount.filter((items) => items.STORE_NUM === locations[i]);
      let data_group = _(data) 
      .groupBy(x => x.COUNTING_DATE + '_' + x.STORE_NUM) // using groupBy from Rxjs
      //.flatMap(group => group.toArray())// GroupBy dont create a array object so you have to flat it
      .map(g => { // mapping 
        return {
          COUNTING_DATE: g[0].COUNTING_DATE,//take the first name because we grouped them by name
          STORE_NUM: g[0].STORE_NUM,//take the first name because we grouped them by name
          //DEPT_CODE: g[0].DEPT_CODE,//take the first name because we grouped them by name
          NEG_MORNING_TOTAL: _.sumBy(g, 'NEG_MORNING'), // using lodash to sum 
          ZERO_MORNING_TOTAL: _.sumBy(g, 'ZERO_MORNING'), // using lodash to sum 
          NEG_EVENING_TOTAL: _.sumBy(g, 'REVIEWED_NEG'), // using lodash to sum 
        }
      })
      .value(); 

      data_others =  this.searchResultCycleCountOthers.filter((items) => items.STORE_NUM === locations[i]);
      let data_others_group = _(data_others) 
      .groupBy(x => x.COUNTING_DATE + '_' + x.STORE_NUM) // using groupBy from Rxjs
      //.flatMap(group => group.toArray())// GroupBy dont create a array object so you have to flat it
      .map(g => { // mapping 
        return {
          COUNTING_DATE: g[0].COUNTING_DATE,//take the first name because we grouped them by name
          STORE_NUM: g[0].STORE_NUM,//take the first name because we grouped them by name
          //DEPT_CODE: g[0].DEPT_CODE,//take the first name because we grouped them by name
          OTHERS_TOTAL: _.sumBy(g, 'OTHERS_CNT') // using lodash to sum 
        }
      })
      .value(); 

      console.log('data_others : ', data_others, data_others_group);

      this.chartConfigActivity.type.push('line');
      this.chartConfigActivity.label_graph.push('Store #' + locations[i]);
      this.chartConfigActivity.nbSetOfData =  locations.length;
      this.chartConfigActivity.borderColor.push(this.chartConfigActivity.colorTemplate[i]);

      data_neg = data_group.map(item => item.NEG_MORNING_TOTAL);
      data_zero = data_group.map(item => item.ZERO_MORNING_TOTAL);
      data_others = data_others_group.map(item => item.OTHERS_TOTAL);
      

      data_performance = data_group.map(item => Math.round(item.NEG_EVENING_TOTAL/item.NEG_MORNING_TOTAL));

      this.chartConfigActivity_Performance.type.push('line');
      this.chartConfigActivity_Performance.label_graph.push('Store #' + locations[i]);
      this.chartConfigActivity_Performance.nbSetOfData =  locations.length;
      this.chartConfigActivity_Performance.borderColor.push(this.chartConfigActivity_Performance.colorTemplate[i]);

      this.chartConfigActivity_Performance.data.push(data_performance); // using lodash to sum 

      //console.log('this.data_neg_process: ', data_neg);
      //console.log('this.data_zero_process: ', data_zero );
      //console.log('this.data_covered: ', locations[i], data_performance);
      //console.log('this.chartConfigActivity: ', this.chartConfigActivity);

      this.chartConfigActivity.data.push(data_neg); // using lodash to sum 
      this.data_neg_process.push(data_neg);
      this.data_zero_process.push(data_zero);
      this.data_others_process.push(data_others);
      //break;
    }

    let axis = this.searchResultCycleCount.map(item => item.COUNTING_DATE);
    this.chartConfigActivity.axis_labels = this.removeDuplicate(axis);
    this.chartConfigActivity_Performance.axis_labels = this.chartConfigActivity.axis_labels;

    // Refresh
    this.chartConfigActivity.refreshChart = 1;
    this.chartConfigActivity_Performance.refreshChart = 1;
  }


  updateData() {
    let data, data_neg, data_zero, data_others, data_performance, data_subcat;
    let locationArray = this.searchResultCycleCount.map(item => item.STORE_NUM);
    //console.log('locationArray : ', locationArray, this.filter.flatSelectedNetworkID);
    let locations = locationArray.filter((val, ind) => locationArray.indexOf(val) === ind && 
                                                        this.filter.flatSelectedNetworkID.indexOf(val) > -1 && 
                                                        this.filter.flatSelectedNetworkID.indexOf(val) > -1);

    //console.log('updateData : ', locations, this.filter.flatSelectedNetworkID);

    this.buttonEffect.NEG_DISPLAY = true;
    this.buttonEffect.ZERO_DISPLAY = false;
    this.buttonEffect.OTHERS_DISPLAY = false;

    this.chartConfigActivity.label_graph = [];
    this.chartConfigActivity.data = [];
    this.chartConfigActivity.borderColor = [];
    this.chartConfigActivity.type = [];

    this.chartConfigActivity_Performance.label_graph = [];
    this.chartConfigActivity_Performance.data = [];
    this.chartConfigActivity_Performance.borderColor = [];
    this.chartConfigActivity_Performance.type = [];

    this.data_neg_process = [];
    this.data_zero_process = [];
    this.data_covered = [];
    this.data_others_process = [];

    // Parse all the location and create the chartConfig for each.
    for(let i=0; i < locations.length; i ++) {
      //console.log('Step # 0 location : ', locations[i]);
      data =  this.searchResultCycleCount.filter((items) => 
                                items.STORE_NUM === locations[i] &&
                                this.filter.flatSelectedStructureID.indexOf(items.SCAT_CODE) > 0 &&
                                this.filter.flatSelectedFlowID.indexOf(items.FLOW) > 0 );
      //console.log('Step # 1 data_neg', data_neg);
      let data_group = _(data) 
      .groupBy(x => x.COUNTING_DATE + '_' + x.STORE_NUM) // using groupBy from Rxjs
      //.flatMap(group => group.toArray())// GroupBy dont create a array object so you have to flat it
      .map(g => {// mapping 
        return {
          COUNTING_DATE: g[0].COUNTING_DATE,//take the first name because we grouped them by name
          STORE_NUM: g[0].STORE_NUM,//take the first name because we grouped them by name
          DEPT_CODE: g[0].DEPT_CODE,//take the first name because we grouped them by name
          NEG_MORNING_TOTAL: _.sumBy(g, 'NEG_MORNING'), // using lodash to sum 
          ZERO_MORNING_TOTAL: _.sumBy(g, 'ZERO_MORNING'), // using lodash to sum 
          NEG_EVENING_TOTAL: _.sumBy(g, 'REVIEWED_NEG'), // using lodash to sum 
        }
      })
      .value(); 
      //.toArray() //.toArray because weu want to assign the array to the charts.     

      data_others =  this.searchResultCycleCountOthers.filter((items) => 
                                    items.STORE_NUM === locations[i] &&
                                    this.filter.flatSelectedStructureID.indexOf(items.SCAT_CODE) > 0 );
                                    //&&
                                    //this.filter.flatSelectedFlowID.indexOf(items.FLOW) > 0 );
      let data_others_group = _(data_others) 
      .groupBy(x => x.COUNTING_DATE + '_' + x.STORE_NUM) // using groupBy from Rxjs
      //.flatMap(group => group.toArray())// GroupBy dont create a array object so you have to flat it
      .map(g => { // mapping 
        return {
          COUNTING_DATE: g[0].COUNTING_DATE,//take the first name because we grouped them by name
          STORE_NUM: g[0].STORE_NUM,//take the first name because we grouped them by name
          //DEPT_CODE: g[0].DEPT_CODE,//take the first name because we grouped them by name
          OTHERS_TOTAL: _.sumBy(g, 'OTHERS_CNT') // using lodash to sum 
        }
      })
      .value(); 

      //console.log('Neg count for location #' + locations[i], data_group);
      this.chartConfigActivity.type.push('line');
      this.chartConfigActivity.label_graph.push('Store #' + locations[i]);
      this.chartConfigActivity.nbSetOfData = locations.length;
      this.chartConfigActivity.borderColor.push(this.chartConfigActivity.colorTemplate[i]);

      data_neg = data_group.map(item => item.NEG_MORNING_TOTAL);
      data_zero = data_group.map(item => item.ZERO_MORNING_TOTAL);
      
      data_performance = data_group.map(item => Math.round(item.NEG_EVENING_TOTAL/item.NEG_MORNING_TOTAL));

      this.chartConfigActivity_Performance.type.push('line');
      this.chartConfigActivity_Performance.label_graph.push('Store #' + locations[i]);
      this.chartConfigActivity_Performance.nbSetOfData =  locations.length;
      this.chartConfigActivity_Performance.borderColor.push(this.chartConfigActivity.colorTemplate[i]);

      this.chartConfigActivity_Performance.data.push(data_performance); // using lodash to sum 

      //console.log('this.data_neg_process: ', data_neg);
      //console.log('this.data_zero_process: ', data_zero );
      //console.log('this.data_covered: ', locations[i], data_performance);

      this.chartConfigActivity.data.push(data_neg); // using lodash to sum 
      this.data_neg_process.push(data_neg);
      this.data_zero_process.push(data_zero);
      this.data_covered.push(data_performance);
      this.data_others_process.push(data_others);
      //this.chartConfigActivity.data.push([1,2,3,4,2,3]);
      
      //data_zero =  this.searchResultCycleCount.filter((items) => items.STORE_NUM=locationArray[i]).map(item => item.ZERO_MORNING);
      //data_others =  this.searchResultCycleCount.filter((items) => items.STORE_NUM=locationArray[i]).map(item => item.OTHER_CYCLE);
      //data_performance = this.searchResultCycleCount.filter((items) => items.STORE_NUM=locationArray[i]).map(item => item.NEG_COVERED);
      //this.chartConfigActivity.data.push
    }

    let axis = this.searchResultCycleCount.map(item => item.COUNTING_DATE);
    this.chartConfigActivity.axis_labels = this.removeDuplicate(axis);
    this.chartConfigActivity_Performance.axis_labels = this.chartConfigActivity.axis_labels;
    this.refreshingData =false;

    this.chartConfigActivity.refreshChart = this.chartConfigActivity.refreshChart + 1; 
    this.chartConfigActivity_Performance.refreshChart = this.chartConfigActivity_Performance.refreshChart + 1; 
    //console.log ('this.chartConfigActivity.axis_labels : ', this.chartConfigActivity.axis_labels )
    //console.log('this.chartConfigActivity.refreshChart  : ', this.chartConfigActivity.refreshChart )
  }

  refreshClicked() {
    this.refreshingData = true;
    this.updateData();
  }

}