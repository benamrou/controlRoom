import { Component, OnInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { ViewEncapsulation } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { DashboardGridComponent } from './components/grid/dashboard.grid.component';
import { GridsterComponent } from '../../shared/modules/gridster/gridster.component';
import { ChartModule, ICRChart } from '../../shared/graph';

import * as _ from 'lodash';

import { WidgetService, Widget, MessageService, ScreenService } from '../../shared/services/index';

@Component({
	moduleId: module.id,
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss', '../../app.component.scss'],
    providers: [WidgetService, MessageService, ScreenService, ChartModule],
    animations: [routerTransition()],
    encapsulation: ViewEncapsulation.None
})

export class DashboardComponent implements OnInit, OnDestroy {

    @ViewChild("gridster1") theGrid: ElementRef;

    grid:  DashboardGridComponent;
    columns: any [] = [];

    screenID;
    screenInfo;

    chart: ICRChart;

    subscription: any [] = [];

    // Step 1 - Get list of widgets allowed for the user
    // Step 2 - Execute the authorized widgets
    constructor(public _widgetService: WidgetService, public _messageService: MessageService, private _screenInfo: ScreenService) {
        
        this.screenID =  'SCR0000000001';
        this.chart = new ICRChart();
        this.grid = new DashboardGridComponent ();
        // Step 1 - Get list of widgets allowed for the user
        try {
            this.subscription.push(this._widgetService.getWidgets()
            .subscribe( 
                dataGet => { 
                    // Step 2 - Execute the authorized widgets

                    for(let i =0; i < this._widgetService.widgetsInfo.widgets.length; i++) {
                        this.subscription.push(this._widgetService.executeWidget( this._widgetService.widgetsInfo.widgets[i])
                        .subscribe( 
                        // put the data returned from the server 
                        dataExecution  => {  
                            // If chart, set the canvas
                            
                            this._widgetService.widgetsInfo.widgets[i].chartConfig.id = 
                            this._widgetService.widgetsInfo.widgets[i].widid + this._widgetService.widgetsInfo.widgets[i].widparam +
                            '_chart' + i;
                            
                            
                            //console.log('this._widgetService.widgetsInfo.widgets[i] : ',  this._widgetService.widgetsInfo.widgets[i]);
                            if(this._widgetService.widgetsInfo.widgets[i].widchart === 1) {
                                
                                //console.log('this._widgetService.widgetsInfo.widgets[i] : ',  this._widgetService.widgetsInfo.widgets[i]);
                                //console.log('data: ',  this._widgetService.widgetsInfo.widgets[i].result);
                                let data_labels = _.uniqBy(this._widgetService.widgetsInfo.widgets[i].result, 
                                                           this._widgetService.widgetsInfo.widgets[i].widchartx);
                                //console.log('data_labels', data_labels);
                                data_labels = data_labels.map(item =>  item[this._widgetService.widgetsInfo.widgets[i].widchartx]);
                                //console.log('data_labels', data_labels);


                                let data_nbSet = _.uniqBy(this._widgetService.widgetsInfo.widgets[i].result, this._widgetService.widgetsInfo.widgets[i].widchartnbset);
                                //console.log('data_nbSet', data_nbSet);
                                data_nbSet = data_nbSet.map(item =>  item[this._widgetService.widgetsInfo.widgets[i].widchartnbset]);

                                //console.log('data_nbSet', data_nbSet);

                                for (let j =0; j < data_nbSet.length; j ++) {
                                    let data = this._widgetService.widgetsInfo.widgets[i].result.filter((items) => 
                                                        items[this._widgetService.widgetsInfo.widgets[i].widchartnbset] === data_nbSet[j]); 
                                    let dataChart = _.chain(data).groupBy(
                                        key => key[this._widgetService.widgetsInfo.widgets[i].widchartnbset] + '_' + 
                                               key[this._widgetService.widgetsInfo.widgets[i].widchartx]) // using groupBy from Rxjs
                                            //.flatMap(group => group.toArray())// GroupBy dont create a array object so you have to flat it
                                            .map((variable, key) => { // mapping 
                                                return {
                                                    key,
                                                    DATA: _.sumBy(variable,this._widgetService.widgetsInfo.widgets[i].widchartdata)
                                                }
                                            }).value(); 
                                    //console.log('dataChart', dataChart);
                                    this._widgetService.widgetsInfo.widgets[i].chartConfig.label_graph.push(this._widgetService.widgetsInfo.widgets[i].widchartlegendinfo + data_nbSet[j]);
                                    this._widgetService.widgetsInfo.widgets[i].chartConfig.data.push(dataChart.map(item =>  item['DATA']));

                                    this._widgetService.widgetsInfo.widgets[i].chartConfig.borderColor.push(this.chart.colorTemplate[j]);
                                }
                                this._widgetService.widgetsInfo.widgets[i].chartConfig.axis_labels = data_labels;
                                this._widgetService.widgetsInfo.widgets[i].chartConfig.nbSetOfData =  data_nbSet.length;
                                this._widgetService.widgetsInfo.widgets[i].chartConfig.type.push(this._widgetService.widgetsInfo.widgets[i].widcharttype);
                                this._widgetService.widgetsInfo.widgets[i].chartConfig.unit =this._widgetService.widgetsInfo.widgets[i].widchartunit;
                                this._widgetService.widgetsInfo.widgets[i].chartConfig.refreshChart = 0;
                            }
                            else {
                                this._widgetService.widgetsInfo.widgets[i].chartConfig.label_graph.push([0]);
                                this._widgetService.widgetsInfo.widgets[i].chartConfig.data.push([0]);
                                this._widgetService.widgetsInfo.widgets[i].chartConfig.axis_labels.push([0]);
                                this._widgetService.widgetsInfo.widgets[i].chartConfig.nbSetOfData =  0;
                                this._widgetService.widgetsInfo.widgets[i].chartConfig.type.push([0]);
                                this._widgetService.widgetsInfo.widgets[i].chartConfig.borderColor.push([0]);
                                this._widgetService.widgetsInfo.widgets[i].chartConfig.unit ='';
                                this._widgetService.widgetsInfo.widgets[i].chartConfig.refreshChart = 0;
                            }
                            //console.log(' this.chartConfig : ',  this.chartConfig);
                        }, 
                        // in case of failure show this message
                        error => {  }, 
                        // Completion
                        () => { 
                                this._widgetService.widgetsInfo.widgets[i].dataReady=true;
                                this._widgetService.widgetsInfo.widgets[i].chartConfig.refreshChart += 1;
                                //this.grid.setDragOption(this.grid.gridster);
                                //console.log('widget:', this._widgetService.widgetsInfo.widgets[i]);
                            }
                        ));
                    }
                }, // put the data returned from the server in our variable
                error => { },
                () => { 
                }
            ));
        }
        catch (error) { console.log('Widget loading error ' + error + JSON.stringify(error)); }
    }

    ngOnInit() {

    }

    ngAfterViewInit(){
        let grid2 = this.theGrid.nativeElement as GridsterComponent;

    }

    addWidget() {
        let additional = new Widget();
        additional.title = 'New Widget #' +  this._widgetService.widgetsInfo.widgets.length;
        this._widgetService.widgetsInfo.widgets.push(additional);
    }

    removeWidget($event, index, gridster) {
        this._widgetService.widgetsInfo.widgets.splice(index,1);
        this.grid.remove($event, index,gridster);
    }

    saveLayout() {

        //console.log('widgetsInfo:', this._widgetService.widgetsInfo);
        for (let i=0; i < this._widgetService.widgetsInfo.widgets.length; i++) {
            this._widgetService.update(this._widgetService.widgetsInfo.widgets[i])
            .subscribe( 
                data => { },
                error => {
                    // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                    this._messageService.add({severity:'error', summary:'ERROR Message', detail: 'Dashboard layout save :' + error });
                },
                () => {}
            );
        }
        this._messageService.add({severity:'success', summary:'Info Message', detail: 'Dashboard layout saved.'});  
    }

    load(gridster) {
    }

    collapseExpand(widgetId, indx, event, gridster) {
        //console.log('widgets :', indx, this._widgetService.widgetsInfo.widgets[indx]);
        //this._widgetService.widgetsInfo.widgets[indx].collapse_h = this._widgetService.widgetsInfo.widgets[indx].widheight;

        if (document.getElementById(widgetId).style.visibility === "collapse") {
            document.getElementById(widgetId).style.visibility= "visible";
            document.getElementById(widgetId + '_collapse').className= "fas fa-caret-down";
            this._widgetService.widgetsInfo.widgets[indx].widcollapse= 'expand';

            this.grid.setHeight(this._widgetService.widgetsInfo.widgets[indx], 
                                this._widgetService.widgetsInfo.widgets[indx].collapse_h, event, gridster);
        }
        else {
            document.getElementById(widgetId).style.visibility= "collapse";
            document.getElementById(widgetId + '_collapse').className= "fas fa-caret-up";
            this._widgetService.widgetsInfo.widgets[indx].widcollapse= 'collapse';

            this.grid.setHeight(this._widgetService.widgetsInfo.widgets[indx], 1, event, gridster);
        }

        this._widgetService.widgetsInfo.widgets[indx].chartConfig.refreshChart += 1;
    } 

    ngOnDestroy() {
        for (let i =0; i < this.subscription.length; i ++) {
            this.subscription[i].unsubscribe();
        }
    }
}
