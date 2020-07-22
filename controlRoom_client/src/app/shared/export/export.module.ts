import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HttpModule } from '@angular/http';
import { FormsModule }  from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ExportComponent } from './export.component';

import { TableModule, MultiSelectModule, ButtonModule, ChipsModule,
         MessagesModule, GrowlModule, InputTextModule,FullCalendarModule,TreeModule,
        TooltipModule, PanelModule, DataListModule, ScheduleModule, CalendarModule, TabViewModule, DialogModule } from '../components/index';

@NgModule({
    imports: [ RouterModule,HttpModule, CommonModule,FormsModule,
               TableModule,MultiSelectModule,
               ButtonModule, ChipsModule, 
               TreeModule,
               MessagesModule, GrowlModule, InputTextModule,
               TabViewModule, DialogModule, FullCalendarModule,
               TooltipModule, PanelModule, DataListModule, ScheduleModule, CalendarModule ],
    declarations: [ExportComponent],
    exports: [ExportComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class ExportModule { }

