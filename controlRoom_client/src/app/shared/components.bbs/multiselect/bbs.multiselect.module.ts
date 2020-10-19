import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HttpModule } from '@angular/http';
import { FormsModule }  from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MultiSelectDropdownComponent } from './bbs.multiselect.component';

@NgModule({
    imports: [ RouterModule,HttpModule, CommonModule,FormsModule ],
    declarations: [ MultiSelectDropdownComponent ],
    exports: [ MultiSelectDropdownComponent ],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class MultiSelectDropdownModule { }
