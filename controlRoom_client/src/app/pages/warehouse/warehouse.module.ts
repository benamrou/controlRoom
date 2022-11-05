import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { WarehouseComponent } from './warehouse.component';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import {AutoCompleteModule} from 'primeng/autocomplete';
import { ToastModule } from 'primeng/toast';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, TableModule, ButtonModule, 
               AutoCompleteModule, PageHeaderModule, ToastModule ],
    declarations: [WarehouseComponent],
    exports: [WarehouseComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class WarehouseModule { }
