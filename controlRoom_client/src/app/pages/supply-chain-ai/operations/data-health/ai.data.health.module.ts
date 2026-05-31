import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AiDataHealthComponent } from './ai.data.health.component';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { I18nModule } from 'src/app/shared/pipes/i18n.module';
import { DropdownModule } from 'primeng/dropdown';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@NgModule({
  imports: [
    RouterModule, CommonModule, FormsModule, PageHeaderModule, I18nModule,
    DropdownModule, CardModule, TagModule, ButtonModule,
    ToastModule, TooltipModule, DialogModule, TableModule, ConfirmDialogModule
  ],
  declarations: [AiDataHealthComponent],
  exports: [AiDataHealthComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AiDataHealthModule {}
