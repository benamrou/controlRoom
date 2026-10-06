import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DropdownModule } from 'primeng/dropdown';
import { RippleModule } from 'primeng/ripple';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { I18nModule } from 'src/app/shared/pipes/i18n.module';
import { SettingMassloadRulesComponent } from './setting.massload.rules.component';

@NgModule({
  declarations: [SettingMassloadRulesComponent],
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    DropdownModule,
    RippleModule,
    PageHeaderModule,
    I18nModule,
  ],
  exports: [SettingMassloadRulesComponent],
})
export class SettingMassloadRulesModule {}
