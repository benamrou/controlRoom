import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { QualityWhsReplenishmentComponent } from './quality.whs.replenishment.component';
import { PanelModule, TableModule, MultiSelectModule,ButtonModule, FullCalendarModule, DialogModule,
         MessagesModule, GrowlModule, DataGridModule, ScheduleModule, CalendarModule, ToastModule} from '../../../../shared/components/index';
import { QualityWhsReplenishmentRoutingModule } from './quality.whs.replenishment-routing.module';
import { PageHeaderModule } from '../../../../shared';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, QualityWhsReplenishmentRoutingModule,
               PanelModule, 
               TableModule,DialogModule, MultiSelectModule, ButtonModule, DataGridModule, ScheduleModule, FullCalendarModule,
               MessagesModule, GrowlModule, PageHeaderModule, CalendarModule, ToastModule ],
    declarations: [QualityWhsReplenishmentComponent],
    exports: [QualityWhsReplenishmentComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class QualityWhsReplenishmentModule { }
