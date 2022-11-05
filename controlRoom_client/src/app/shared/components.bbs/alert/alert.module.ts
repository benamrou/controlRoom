import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { AlertComponent } from './alert.component';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule ],
    declarations: [AlertComponent],
    exports: [AlertComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class AlertModule { }
