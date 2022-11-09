import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { RobotComponent } from './robot.component';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { ChipsModule } from 'primeng/chips';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { TabViewModule } from 'primeng/tabview';
import { MultiSelectModule } from 'primeng/multiselect';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { BadgeModule} from 'primeng/badge';
import { CheckboxModule } from 'primeng/checkbox';

@NgModule({
    imports: [ RouterModule, CommonModule,FormsModule,
               TableModule,MultiSelectModule,DialogModule, 
               ButtonModule, ChipsModule, 
               MessageModule, 
               CheckboxModule,BadgeModule,
               TooltipModule, 
               ToastModule,TabViewModule,
               PageHeaderModule ],
    declarations: [RobotComponent],
    exports: [RobotComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class RobotModule { }