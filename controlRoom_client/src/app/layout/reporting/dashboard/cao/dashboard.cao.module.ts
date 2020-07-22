import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { DashboardCAOComponent } from './dashboard.cao.component';
import { PanelModule, TableModule, MultiSelectModule,ButtonModule, DialogModule,
        DropdownModule, AutoCompleteModule,
         MessagesModule, GrowlModule, DataGridModule, CalendarModule, ToastModule} from '../../../../shared/components/index';
import { DashboardCAORoutingModule } from './dashboard-cao-routing.module';
import { PageHeaderModule } from '../../../../shared';
import { ChartModule } from '../../../../shared/graph';

@NgModule({
    imports: [  RouterModule,CommonModule,FormsModule, 
                DashboardCAORoutingModule,
                PanelModule, AutoCompleteModule,
                TableModule,DialogModule, MultiSelectModule, ButtonModule, DataGridModule, DropdownModule, 
                MessagesModule, GrowlModule, PageHeaderModule, CalendarModule, ToastModule,
                // Own B&B Module
                ChartModule ],
    declarations: [DashboardCAOComponent],
    exports: [DashboardCAOComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class DashboardCAOModule { }
