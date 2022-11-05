import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { SmartUBDComponent } from './smart.ubd.component';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { MultiSelectDropdownModule } from 'src/app/shared/components.bbs';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { InputNumberModule } from 'primeng/inputnumber';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ChartModule } from 'src/app/shared/graph';
import { PanelModule } from 'primeng/panel';
import {InputTextareaModule} from 'primeng/inputtextarea';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import 'chartjs-plugin-annotation';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, TableModule, 
               DialogModule, ButtonModule, PageHeaderModule,
               ChartModule,
               ConfirmDialogModule,
               MultiSelectDropdownModule,
               CalendarModule, 
               PanelModule,
               TooltipModule,
               InputTextareaModule,
               InputNumberModule,
               MultiSelectModule,
               InputTextModule,
               ToastModule ],
    declarations: [SmartUBDComponent],
    exports: [SmartUBDComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class SmartUBDModule { }
