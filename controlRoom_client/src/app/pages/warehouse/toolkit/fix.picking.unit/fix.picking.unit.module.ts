import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { FixPickingUnitComponent } from './fix.picking.unit.component';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { ToastModule } from 'primeng/toast';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, DropdownModule, ToastModule, 
               InputTextModule,
               TableModule, DialogModule, ButtonModule, PageHeaderModule ],
    declarations: [FixPickingUnitComponent],
    exports: [FixPickingUnitComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class FixPickingUnitModule { }
