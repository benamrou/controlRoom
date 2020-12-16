import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { DashboardSupplierComponent } from './dashboard.supplier.component';
import { PanelModule, TableModule, MultiSelectModule,ButtonModule, FullCalendarModule, DialogModule, OverlayPanelModule, TooltipModule,
         MessagesModule, GrowlModule, DataGridModule, ScheduleModule, CalendarModule, ToastModule} from '../../../../shared/components/index';
import { DashboardSupplierRoutingModule } from './dashboard.supplier-routing.module';
import { PageHeaderModule } from '../../../../shared';
import { MultiSelectDropdownModule } from '../../../../shared/components.bbs/index';
import { ChartModule } from '../../../../shared/graph';


@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, DashboardSupplierRoutingModule,
               PanelModule, MultiSelectDropdownModule,OverlayPanelModule, TooltipModule,
               TableModule,DialogModule, MultiSelectModule, ButtonModule, DataGridModule, ScheduleModule, FullCalendarModule,
               MessagesModule, GrowlModule, PageHeaderModule, CalendarModule, ToastModule ,
               ChartModule],
    declarations: [DashboardSupplierComponent],
    exports: [DashboardSupplierComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class DashboardSupplierModule { }
