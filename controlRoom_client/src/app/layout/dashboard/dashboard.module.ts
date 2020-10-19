import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbCarouselModule, NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { PageHeaderModule } from '../../shared';
import { GridsterModule } from '../../shared';
import { FormsModule } from '@angular/forms';
import { ChartModule } from '../../shared/graph';

import { StatModule } from '../../shared';
import { AlertModule } from 'ngx-bootstrap/alert';
import { TableModule, ButtonModule,  BlockUIModule,
        TooltipModule, DialogModule , PaginatorModule, MessagesModule, ToastModule } from '../../shared/components';

@NgModule({
    imports: [
        CommonModule,
        NgbCarouselModule.forRoot(),
        NgbAlertModule.forRoot(),
        AlertModule.forRoot(),
        DashboardRoutingModule,
        StatModule,
        GridsterModule,
        BlockUIModule,
        MessagesModule,ToastModule,
        FormsModule,
        TableModule,PaginatorModule,
        ButtonModule,TooltipModule,DialogModule,
        PageHeaderModule,
        ChartModule
    ],
    declarations: [ DashboardComponent ],
    exports: [ DashboardComponent ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})
export class DashboardModule {}
