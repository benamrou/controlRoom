import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { MultiSelectDropdownComponent } from './bbs.multiselect.component';
import {CheckboxModule} from 'primeng/checkbox';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, CheckboxModule ],
    declarations: [MultiSelectDropdownComponent],
    exports: [MultiSelectDropdownComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class MultiSelectDropdownModule { }
