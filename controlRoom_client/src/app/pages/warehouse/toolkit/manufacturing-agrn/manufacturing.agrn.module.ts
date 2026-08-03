import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { I18nModule } from 'src/app/shared/pipes/i18n.module';
import { ManufacturingAgrnComponent } from './manufacturing.agrn.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TableModule,
    ToastModule,
    PageHeaderModule,
    I18nModule,
  ],
  declarations: [ManufacturingAgrnComponent],
  exports: [ManufacturingAgrnComponent],
})
export class ManufacturingAgrnModule {}
