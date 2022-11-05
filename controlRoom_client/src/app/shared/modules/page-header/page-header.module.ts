import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { PageHeaderComponent } from './page-header.component';
import { OverlayPanelModule } from 'primeng/overlaypanel';

@NgModule({
    imports: [CommonModule, RouterModule, FormsModule, OverlayPanelModule],
    declarations: [PageHeaderComponent],
    exports: [PageHeaderComponent],
    bootstrap: [PageHeaderComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PageHeaderModule {}

