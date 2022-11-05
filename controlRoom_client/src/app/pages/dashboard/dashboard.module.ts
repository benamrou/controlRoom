import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard.component';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { PanelModule } from 'primeng/panel';
import { ChartModule } from 'src/app/shared/graph';
import { TooltipModule } from 'primeng/tooltip';
import { GridsterModule } from 'src/app/shared/modules/gridster/gridster.module';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';

@NgModule({
    imports: [
        CommonModule,
        FormsModule, TableModule, ButtonModule, OverlayPanelModule, PageHeaderModule,
        ProgressSpinnerModule, DialogModule,
        PanelModule, ChartModule, TooltipModule, GridsterModule, ToastModule,
    ],
    declarations: [ DashboardComponent],
    exports: [ DashboardComponent ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})
export class DashboardModule {}
