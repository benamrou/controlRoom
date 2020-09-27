import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { DashboardSupplierComponent } from './dashboard.supplier.component';
import { PanelModule, TableModule, MultiSelectModule,ButtonModule, FullCalendarModule, DialogModule,
         MessagesModule, GrowlModule, DataGridModule, ScheduleModule, CalendarModule, ToastModule} from '../../../../shared/components/index';
import { DashboardSupplierRoutingModule } from './dashboard.supplier-routing.module';
import { PageHeaderModule } from '../../../../shared';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, DashboardSupplierRoutingModule,
               PanelModule, 
               TableModule,DialogModule, MultiSelectModule, ButtonModule, DataGridModule, ScheduleModule, FullCalendarModule,
               MessagesModule, GrowlModule, PageHeaderModule, CalendarModule, ToastModule ],
    declarations: [DashboardSupplierComponent],
    exports: [DashboardSupplierComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class DashboardSupplierModule { }
