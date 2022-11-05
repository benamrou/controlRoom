import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { ReportingComponent } from './reporting.component';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, TableModule, ButtonModule, PageHeaderModule ],
    declarations: [ReportingComponent],
    exports: [ReportingComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class ReportingModule { }
