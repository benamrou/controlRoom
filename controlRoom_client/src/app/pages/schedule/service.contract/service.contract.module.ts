import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { SupplierScheduleServiceContractComponent } from './service.contract.component'
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';


@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, TableModule, DialogModule, ButtonModule ],
    declarations: [SupplierScheduleServiceContractComponent],
    exports: [SupplierScheduleServiceContractComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class SupplierScheduleServiceContractModule { }
