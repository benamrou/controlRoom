import { NgModule, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// PrimeNG Modules
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { TabViewModule } from 'primeng/tabview';
import { DialogModule } from 'primeng/dialog';
import { CardModule } from 'primeng/card';
import { TreeModule } from 'primeng/tree';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TreeTableModule } from 'primeng/treetable';
import { DragDropModule } from 'primeng/dragdrop';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

// App Modules
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';

// Components
import { UnixRunnerComponent } from './unix.runner.component';

/**
 * FIXES APPLIED:
 * 1. Organized imports into logical groups for better readability
 * 2. Added proper spacing and formatting
 * 
 * NOTE: You have many unused imports (TreeModule, TreeTableModule, DragDropModule, etc.)
 * Consider removing them if not used to reduce bundle size.
 */

@NgModule({
  imports: [
    // Angular Core
    RouterModule,
    CommonModule,
    FormsModule,

    // PrimeNG - Used
    ButtonModule,
    CardModule,
    ToastModule,
    DropdownModule,
    ProgressSpinnerModule,
    InputTextModule,
    InputTextareaModule,

    // PrimeNG - Potentially unused (review and remove if not needed)
    TableModule,
    TreeTableModule,
    DragDropModule,
    TreeModule,
    TabViewModule,
    ToggleButtonModule,
    DialogModule,
    CalendarModule,

    // App Modules
    PageHeaderModule
  ],
  declarations: [
    UnixRunnerComponent
  ],
  exports: [
    UnixRunnerComponent
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,
    NO_ERRORS_SCHEMA
  ]
})
export class UnixRunnerModule { }