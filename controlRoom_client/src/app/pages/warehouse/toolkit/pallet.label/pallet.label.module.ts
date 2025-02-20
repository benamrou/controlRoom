import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { PalletLabelComponent } from './pallet.label.component';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { ToastModule } from 'primeng/toast';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectDropdownModule } from 'src/app/shared/components.bbs';
import { CheckboxModule } from 'primeng/checkbox';
import { CalendarModule } from 'primeng/calendar';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, DropdownModule, ToastModule, 
               InputTextModule,MultiSelectDropdownModule,
               CheckboxModule,CalendarModule,
               TableModule, DialogModule, ButtonModule, PageHeaderModule ],
    declarations: [PalletLabelComponent],
    exports: [PalletLabelComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class PalletLabelModule { }
