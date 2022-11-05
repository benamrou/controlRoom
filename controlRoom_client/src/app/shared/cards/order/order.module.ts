import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { OrderComponent } from './order.component';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule ],
    declarations: [OrderComponent],
    exports: [OrderComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class OrderModule { }
