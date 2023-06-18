import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { MassJournalComponent } from './massjournal.component';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';


@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, 
               CalendarModule,DropdownModule,
               InputTextModule,
               CheckboxModule,
               TableModule, ButtonModule, PageHeaderModule ],
    declarations: [MassJournalComponent],
    exports: [MassJournalComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class MassJournalModule { }
