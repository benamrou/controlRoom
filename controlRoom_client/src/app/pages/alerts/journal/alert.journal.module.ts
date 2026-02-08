import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// PrimeNG Modules
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TabViewModule } from 'primeng/tabview';
import { ChartModule } from 'primeng/chart';
import { DialogModule } from 'primeng/dialog';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';

// Component and Service
import { AlertLogJournalComponent } from './alert.journal.component';

@NgModule({
  declarations: [
    AlertLogJournalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    PageHeaderModule,
    
    // PrimeNG
    TableModule,
    ButtonModule,
    CardModule,
    DropdownModule,
    CalendarModule,
    InputTextModule,
    TagModule,
    TooltipModule,
    TabViewModule,
    ChartModule,
    DialogModule
  ],
  exports: [
    AlertLogJournalComponent
  ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AlertLogJournalModule { }