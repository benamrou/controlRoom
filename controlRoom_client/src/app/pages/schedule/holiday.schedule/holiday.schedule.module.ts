import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { HolidayScheduleComponent } from './holiday.schedule.component';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { PanelModule } from 'primeng/panel';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, TableModule, DialogModule, 
               ButtonModule, PageHeaderModule, 
               CalendarModule, ToastModule,
               InputTextModule,
               TooltipModule,
               PanelModule ],
    declarations: [HolidayScheduleComponent],
    exports: [HolidayScheduleComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class HolidayScheduleModule { }
