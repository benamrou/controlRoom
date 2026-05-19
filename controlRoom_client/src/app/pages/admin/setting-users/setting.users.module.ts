import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DropdownModule } from 'primeng/dropdown';
import { TabViewModule } from 'primeng/tabview';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { SettingUsersComponent } from './setting.users.component';

@NgModule({
  declarations: [SettingUsersComponent],
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    DropdownModule,
    TabViewModule,
    CheckboxModule,
    TooltipModule,
    RippleModule,
    PageHeaderModule,
  ],
  exports: [SettingUsersComponent],
})
export class SettingUsersModule {}
