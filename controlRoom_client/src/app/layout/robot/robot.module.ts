import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HttpModule } from '@angular/http';
import { FormsModule }  from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RobotComponent } from './robot.component';
import { TableModule, MultiSelectModule, ButtonModule, ChipsModule,
         MessagesModule, GrowlModule, ToastModule, FullCalendarModule,
         TabViewModule,  CheckboxModule, BadgeModule,DialogModule,
        TooltipModule } from '../../shared/components/index';

import { ItemModule } from '../../shared/index';
import { RobotRoutingModule } from './robot-routing.module';
import { StatModule } from '../../shared';
import { PageHeaderModule } from '../../shared';

@NgModule({
    imports: [ RouterModule,HttpModule, CommonModule,FormsModule,
               TableModule,MultiSelectModule,DialogModule, 
               ButtonModule, ChipsModule, 
               MessagesModule, GrowlModule,
               CheckboxModule,BadgeModule,
               TooltipModule, ItemModule,
               ToastModule,TabViewModule,
               StatModule,FullCalendarModule,
               RobotRoutingModule,
               PageHeaderModule ],
    declarations: [RobotComponent],
    exports: [RobotComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class RobotModule { }
