import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { DashboardReceptionComponent } from './dashboard.reception.component';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { MultiSelectDropdownModule } from 'src/app/shared/components.bbs';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';


@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, TableModule, 
               DialogModule, ButtonModule, PageHeaderModule,
               MultiSelectDropdownModule,
               CalendarModule, 
               ToastModule ],
    declarations: [DashboardReceptionComponent],
    exports: [DashboardReceptionComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class DashboardReceptionModule { }
