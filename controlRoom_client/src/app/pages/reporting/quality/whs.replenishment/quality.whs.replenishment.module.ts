import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { QualityWhsReplenishmentComponent } from './quality.whs.replenishment.component';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { MultiSelectDropdownModule } from 'src/app/shared/components.bbs';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { ChartModule } from 'src/app/shared/graph';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, TableModule, DialogModule, 
               ButtonModule, PageHeaderModule,
               MultiSelectDropdownModule,ToastModule,
               ChartModule,
               CalendarModule ],
    declarations: [QualityWhsReplenishmentComponent],
    exports: [QualityWhsReplenishmentComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class QualityWhsReplenishmentModule { }
