import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { AvailableMHComponent } from './available.mh.component';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectDropdownModule } from 'src/app/shared/components.bbs';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ChartModule } from 'src/app/shared/graph';
import { TabViewModule } from 'primeng/tabview';

import { InputTextModule } from 'primeng/inputtext';
import { PanelModule } from 'primeng/panel';
import { PickListModule } from 'primeng/picklist';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { CheckboxModule } from 'primeng/checkbox';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, TableModule, 
               DialogModule, ButtonModule, PageHeaderModule,
               MultiSelectDropdownModule,
               CalendarModule, 
               CheckboxModule,
               ChartModule,
               TooltipModule,
               PanelModule,
               InputTextModule,
               TabViewModule,
               PickListModule,
               ConfirmDialogModule,
               ToolbarModule,
               ToastModule ],
    declarations: [AvailableMHComponent],
    exports: [AvailableMHComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class AvailableMHModule { }
