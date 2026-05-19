import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { FilterComponent } from './filter.component';
import { TreeModule } from 'primeng/tree';

@NgModule({
    imports: [ RouterModule, CommonModule, FormsModule, TreeModule ],
    declarations: [FilterComponent],
    exports: [FilterComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class FilterModule { }
