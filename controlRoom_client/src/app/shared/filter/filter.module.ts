import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { FilterComponent } from './filter.component';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule ],
    declarations: [FilterComponent],
    exports: [FilterComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class FilterModule { }
