import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { ExportComponent } from './export.component';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule ],
    declarations: [ExportComponent],
    exports: [ExportComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class ExportModule { }
