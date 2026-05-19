import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
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
import { SettingMenuAccessComponent } from './setting.menu.access.component';

@NgModule({
  declarations: [SettingMenuAccessComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
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
  exports: [SettingMenuAccessComponent],
})
export class SettingMenuAccessModule {}
