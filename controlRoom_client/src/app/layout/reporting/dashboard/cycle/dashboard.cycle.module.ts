import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { DashboardCycleComponent } from './dashboard.cycle.component';
import { PanelModule, TableModule, MultiSelectModule,ButtonModule, DialogModule,
        DropdownModule, AutoCompleteModule,TreeModule,
         MessagesModule, GrowlModule, DataGridModule, CalendarModule, ToastModule} from '../../../../shared/components/index';
import { DashboardCycleRoutingModule } from './dashboard-cycle-routing.module';
import { PageHeaderModule } from '../../../../shared';
import { ChartModule } from '../../../../shared/graph';
import { FilterModule } from '../../../../shared/filter';

@NgModule({
    imports: [  RouterModule,CommonModule,FormsModule, 
        DashboardCycleRoutingModule,TreeModule,
                PanelModule, AutoCompleteModule,
                TableModule,DialogModule, MultiSelectModule, ButtonModule, DataGridModule, DropdownModule, 
                MessagesModule, GrowlModule, PageHeaderModule, CalendarModule, ToastModule,
                // Own B&B Module
                ChartModule, FilterModule ],
    declarations: [DashboardCycleComponent],
    exports: [DashboardCycleComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class DashboardCycleModule { }
