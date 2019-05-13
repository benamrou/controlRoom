import { Component, OnInit, ViewChild } from '@angular/core';
import { ViewEncapsulation } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { DashboardGridComponent } from './components/grid/dashboard.grid.component';

import { WidgetService } from '../../shared/services/index';
import * as util from 'util' // has no default export
import { inspect } from 'util' // or directly

@Component({
	moduleId: module.id,
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    providers: [WidgetService],
    animations: [routerTransition()],
    encapsulation: ViewEncapsulation.None
})

export class DashboardComponent implements OnInit {

    grid:  DashboardGridComponent;
    columns: any [] = [];

    // Step 1 - Get list of widgets allowed for the user
    // Step 2 - Execute the authorized widgets
    constructor(public _widgetService: WidgetService) {
        
        this.grid = new DashboardGridComponent ();
        // Step 1 - Get list of widgets allowed for the user
        try {
            this._widgetService.getWidgets()
            .subscribe( 
                data => { 
                    console.log('Widgets :' + JSON.stringify(data));
                    // Step 2 - Execute the authorized widgets

                    for(let i =0; i < this._widgetService.widgetsInfo.widgets.length; i++) {
                        this._widgetService.executeWidget( this._widgetService.widgetsInfo.widgets[i])
                        .subscribe( 
                        // put the data returned from the server 
                        data  => {  }, 
                        // in case of failure show this message
                        error => { console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); }, 
                        // Completion
                        () => { this._widgetService.widgetsInfo.widgets[i].dataReady=true  }
                        );
                    }
                }, // put the data returned from the server in our variable
                error => {
                    console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                },
                () => { }
            )
        }
        catch (error) { console.log('Widget loading error ' + error + JSON.stringify(error)); }
    }

    ngOnInit() {}

}
