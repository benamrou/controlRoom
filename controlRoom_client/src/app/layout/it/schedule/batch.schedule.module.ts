import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { PanelModule, TableModule, MultiSelectModule,ButtonModule, DialogModule,DragDropModule,
        DropdownModule, AutoCompleteModule, AccordionModule, TabViewModule,TreeTableModule,TreeModule,
         MessagesModule, GrowlModule, DataGridModule, CalendarModule, ToastModule} from '../../../shared/components/index';

import { MyBatchListModule } from './mybatchlist/mybatch.list.module';
import { PageHeaderModule } from '../../../shared';


import { BatchScheduleRoutingModule } from './batch.schedule-routing.module';
// Toolkit component
import { BatchScheduleComponent} from './batch.schedule.component';


@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, 
               BatchScheduleRoutingModule, DragDropModule,
               MyBatchListModule,
               PanelModule, AutoCompleteModule,AccordionModule,TabViewModule,TreeTableModule,TreeModule,
               TableModule,DialogModule, MultiSelectModule, ButtonModule, DataGridModule, DropdownModule, 
               MessagesModule, GrowlModule, PageHeaderModule, CalendarModule, ToastModule ],
    declarations: [ BatchScheduleComponent],
    exports: [BatchScheduleComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class BatchScheduleModule { }

