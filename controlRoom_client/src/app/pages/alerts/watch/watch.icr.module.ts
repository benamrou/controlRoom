import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WatchICRComponent } from './watch.icr.component';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { TabViewModule } from 'primeng/tabview';
import { DialogModule } from 'primeng/dialog';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CalendarModule } from 'primeng/calendar';
import { TagModule } from 'primeng/tag';

@NgModule({
    imports: [ RouterModule, CommonModule, FormsModule, TableModule, ButtonModule, PageHeaderModule,
               TooltipModule, ToastModule, TabViewModule,
               CheckboxModule,
               DialogModule, InputTextareaModule,
               DropdownModule,
               ConfirmDialogModule,
               CalendarModule,
               TagModule
             ],
    declarations: [WatchICRComponent],
    exports: [WatchICRComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class WatchICRModule { }
