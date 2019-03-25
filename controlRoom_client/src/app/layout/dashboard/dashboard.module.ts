import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbCarouselModule, NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { PageHeaderModule } from '../../shared';
import { GridsterModule } from '../../shared';
import { FormsModule } from '@angular/forms';

import { StatModule } from '../../shared';
import { ButtonModule, TooltipModule  } from '../../shared/components';

@NgModule({
    imports: [
        CommonModule,
        NgbCarouselModule.forRoot(),
        NgbAlertModule.forRoot(),
        DashboardRoutingModule,
        StatModule,
        GridsterModule,
        FormsModule,
        ButtonModule,TooltipModule,
        PageHeaderModule
    ],
    declarations: [ DashboardComponent ],
    exports: [ DashboardComponent ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})
export class DashboardModule {}
