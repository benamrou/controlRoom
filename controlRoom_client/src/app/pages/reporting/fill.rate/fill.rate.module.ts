import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { FillRateComponent } from './fill.rate.component';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectDropdownModule } from 'src/app/shared/components.bbs';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ChartModule } from 'src/app/shared/graph';

import { InputTextModule } from 'primeng/inputtext';
import { PanelModule } from 'primeng/panel';
import 'chartjs-plugin-annotation';


@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, TableModule, 
               DialogModule, ButtonModule, PageHeaderModule,
               MultiSelectDropdownModule,
               CalendarModule, 
               ChartModule,
               TooltipModule,
               PanelModule,
               InputTextModule,
               ToastModule ],
    declarations: [FillRateComponent],
    exports: [FillRateComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class FillRateModule { }
