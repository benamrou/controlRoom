import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DocumentationViewerComponent } from './documentation-viewer.component';

@NgModule({
  imports: [RouterModule, CommonModule],
  declarations: [DocumentationViewerComponent],
  exports: [DocumentationViewerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DocumentationModule {}
