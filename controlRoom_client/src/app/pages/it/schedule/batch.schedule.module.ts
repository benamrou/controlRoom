import { NgModule, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { BatchScheduleComponent } from './batch.schedule.component';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { TabViewModule } from 'primeng/tabview';
import { DialogModule } from 'primeng/dialog';
import { CardModule } from 'primeng/card';
import { TreeModule } from 'primeng/tree';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TreeTableModule } from 'primeng/treetable';
import {DragDropModule} from 'primeng/dragdrop';
import { MyBatchListModule } from './mybatchlist/mybatch.list.module';
import { InputTextModule } from 'primeng/inputtext';


@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, TableModule, 
               TreeTableModule,DragDropModule,
               ButtonModule, PageHeaderModule,
               MyBatchListModule,
               InputTextModule,
               CardModule,
               ToastModule,
               TreeModule, 
               TabViewModule, ToggleButtonModule,
               DialogModule,
               CalendarModule ],
    declarations: [BatchScheduleComponent],
    exports: [BatchScheduleComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})

export class BatchScheduleModule { }
