import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AiKpiPerformanceComponent } from './ai.kpi.performance.component';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
@NgModule({ imports: [RouterModule, CommonModule, PageHeaderModule],
  declarations: [AiKpiPerformanceComponent], exports: [AiKpiPerformanceComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA] })
export class AiKpiPerformanceModule {}
