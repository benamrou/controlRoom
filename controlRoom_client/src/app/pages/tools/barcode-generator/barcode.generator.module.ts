import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { I18nModule } from 'src/app/shared/pipes/i18n.module';
import { BarcodeGeneratorComponent } from './barcode.generator.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DropdownModule,
    InputTextareaModule,
    PageHeaderModule,
    I18nModule,
  ],
  declarations: [BarcodeGeneratorComponent],
  exports: [BarcodeGeneratorComponent],
})
export class BarcodeGeneratorModule {}
