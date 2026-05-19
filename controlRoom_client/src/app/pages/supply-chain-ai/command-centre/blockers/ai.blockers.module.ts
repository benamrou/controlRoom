import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AiBlockersComponent } from './ai.blockers.component';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
@NgModule({ imports: [RouterModule, CommonModule, PageHeaderModule],
  declarations: [AiBlockersComponent], exports: [AiBlockersComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA] })
export class AiBlockersModule {}
