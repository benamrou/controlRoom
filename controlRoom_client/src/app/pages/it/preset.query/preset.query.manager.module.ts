import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { RippleModule } from 'primeng/ripple';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';

import { ConfirmationService, MessageService } from 'primeng/api';
import { PresetQueryManagerComponent } from './preset.query.manager.component';

@NgModule({
  declarations: [PresetQueryManagerComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PageHeaderModule,
    TableModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    DropdownModule,
    TooltipModule,
    ConfirmDialogModule,
    ToastModule,
    TagModule,
    DividerModule,
    RippleModule
  ],
  providers: [ConfirmationService, MessageService]
})
export class PresetQueryManagerModule {}