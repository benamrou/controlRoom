import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { AccessDeniedComponent } from './access-denied.component';


@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule ],
    declarations: [AccessDeniedComponent],
    exports: [AccessDeniedComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class AccessDeniedModule { }
