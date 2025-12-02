import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { AlertModule } from 'src/app/shared/components.bbs/alert/alert.module';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import {ToastModule} from 'primeng/toast';

import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { PanelModule } from 'primeng/panel';
import { TabViewModule } from 'primeng/tabview';
import { InputTextModule } from 'primeng/inputtext';
import { VegaProcessDashboardComponent } from './vega-process-dashboard.component';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, TableModule, AlertModule, ButtonModule, PageHeaderModule,
               ToastModule, CalendarModule, PanelModule,DropdownModule,CardModule, ChartModule, TagModule, TooltipModule,
               InputTextModule,
               TabViewModule ],
    declarations: [VegaProcessDashboardComponent],
    exports: [VegaProcessDashboardComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class VegaProcessDashboardModule { }
