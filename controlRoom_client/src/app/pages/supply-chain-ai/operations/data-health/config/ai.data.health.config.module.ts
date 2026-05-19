import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AiDataHealthConfigComponent } from './ai.data.health.config.component';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputSwitchModule } from 'primeng/inputswitch';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@NgModule({
  imports: [
    RouterModule, CommonModule, FormsModule, PageHeaderModule,
    DropdownModule, TableModule, TagModule, ButtonModule,
    InputTextModule, InputTextareaModule, InputNumberModule, InputSwitchModule,
    DialogModule, ToastModule, TooltipModule, ConfirmDialogModule
  ],
  declarations: [AiDataHealthConfigComponent],
  exports: [AiDataHealthConfigComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AiDataHealthConfigModule {}
