import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

// PrimeNG Modules
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { RippleModule } from 'primeng/ripple';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';

// Services
import { ConfirmationService, MessageService } from 'primeng/api';

// Component
import { DictionaryComponent } from './dictionary.component';

@NgModule({
  declarations: [
    DictionaryComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,PageHeaderModule,
    // PrimeNG
    TableModule,
    TabViewModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    DropdownModule,
    CheckboxModule,
    TooltipModule,
    ConfirmDialogModule,
    ToastModule,
    TagModule,
    DividerModule,
    RippleModule
  ],
  providers: [
    ConfirmationService,
    MessageService
  ]
})
export class DictionaryModule { }