import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AiAutonomyComponent } from './ai.autonomy.component';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
@NgModule({ imports: [RouterModule, CommonModule, PageHeaderModule],
  declarations: [AiAutonomyComponent], exports: [AiAutonomyComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA] })
export class AiAutonomyModule {}
