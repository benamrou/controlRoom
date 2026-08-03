import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { SyndigoExcludePosComponent } from './syndigo.exclude.pos.component';
import { SyndigoExcludePosService } from '../../../shared/services/syndigo/syndigo.exclude.pos.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputTextareaModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    PageHeaderModule
  ],
  declarations: [SyndigoExcludePosComponent],
  exports: [SyndigoExcludePosComponent],
  providers: [SyndigoExcludePosService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SyndigoExcludePosModule {}
