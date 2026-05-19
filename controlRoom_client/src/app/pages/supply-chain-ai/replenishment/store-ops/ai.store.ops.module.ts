import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AiStoreOpsComponent } from './ai.store.ops.component';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
@NgModule({ imports: [RouterModule, CommonModule, PageHeaderModule],
  declarations: [AiStoreOpsComponent], exports: [AiStoreOpsComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA] })
export class AiStoreOpsModule {}
