import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AiDashboardComponent } from './ai.dashboard.component';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { DropdownModule } from 'primeng/dropdown';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';

@NgModule({ imports: [RouterModule, CommonModule, FormsModule, PageHeaderModule, DropdownModule, CardModule, TagModule, ToastModule],
  declarations: [AiDashboardComponent], exports: [AiDashboardComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA] })
export class AiDashboardModule {}
