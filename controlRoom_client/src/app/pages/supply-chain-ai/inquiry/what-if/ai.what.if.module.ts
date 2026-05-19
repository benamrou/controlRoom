import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AiWhatIfComponent } from './ai.what.if.component';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
@NgModule({ imports: [RouterModule, CommonModule, PageHeaderModule],
  declarations: [AiWhatIfComponent], exports: [AiWhatIfComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA] })
export class AiWhatIfModule {}
