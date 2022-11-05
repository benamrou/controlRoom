import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { SupplierComponent } from './supplier.component';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule ],
    declarations: [SupplierComponent],
    exports: [SupplierComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class SupplierModule { }
