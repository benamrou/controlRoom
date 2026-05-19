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
import { TabViewModule } from 'primeng/tabview';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { SettingCustomerComponent } from './setting.customer.component';

@NgModule({
  declarations: [SettingCustomerComponent],
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
    TabViewModule,
    PageHeaderModule,
  ],
  exports: [SettingCustomerComponent],
})
export class SettingCustomerModule {}
