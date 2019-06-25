import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HttpModule } from '@angular/http';
import { FormsModule }  from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderComponent } from './order.component';
import 'fullcalendar'; // needed for Scheduler
import { TableModule, MultiSelectModule, ButtonModule, ChipsModule,
         MessagesModule, GrowlModule, InputTextModule,
        TooltipModule, PanelModule, DataListModule, ScheduleModule, CalendarModule, TabViewModule, DialogModule } from '../../components/index';

@NgModule({
    imports: [ RouterModule,HttpModule, CommonModule,FormsModule,
               TableModule,MultiSelectModule,
               ButtonModule, ChipsModule, 
               MessagesModule, GrowlModule, InputTextModule,
               TabViewModule, DialogModule,
               TooltipModule, PanelModule, DataListModule, ScheduleModule, CalendarModule ],
    declarations: [OrderComponent],
    exports: [OrderComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class OrderModule { }

