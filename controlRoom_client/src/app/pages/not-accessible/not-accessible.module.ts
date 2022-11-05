import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { NotAccessibleComponent } from './not-accessible.component';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule ],
    declarations: [NotAccessibleComponent],
    exports: [NotAccessibleComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class NotAccessibleModule { }
