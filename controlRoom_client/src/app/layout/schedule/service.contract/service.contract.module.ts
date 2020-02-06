import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { SupplierScheduleServiceContractComponent } from './service.contract.component';
import { PanelModule, TableModule, MultiSelectModule,ButtonModule, FullCalendarModule, DialogModule,
         MessagesModule, GrowlModule, DataGridModule, ScheduleModule, CalendarModule, ToastModule} from '../../../shared/components/index';
import { SupplierScheduleRoutingModule } from './service.contract-routing.module';
import { PageHeaderModule } from '../../../shared';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, SupplierScheduleRoutingModule,
               PanelModule, 
               TableModule,DialogModule, MultiSelectModule, ButtonModule, DataGridModule, ScheduleModule, FullCalendarModule,
               MessagesModule, GrowlModule, PageHeaderModule, CalendarModule, ToastModule ],
    declarations: [SupplierScheduleServiceContractComponent],
    exports: [SupplierScheduleServiceContractComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class SupplierScheduleServiceContractModule { }
