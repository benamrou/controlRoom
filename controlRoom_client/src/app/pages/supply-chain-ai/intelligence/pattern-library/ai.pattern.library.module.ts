import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AiPatternLibraryComponent } from './ai.pattern.library.component';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
@NgModule({ imports: [RouterModule, CommonModule, PageHeaderModule],
  declarations: [AiPatternLibraryComponent], exports: [AiPatternLibraryComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA] })
export class AiPatternLibraryModule {}
