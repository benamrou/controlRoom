import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { CaoConfigComponent } from './caoconfig.component';
import { PanelModule, TableModule, MultiSelectModule,ButtonModule, TabMenuModule,TabViewModule, DialogModule,
         MessagesModule, GrowlModule, DataGridModule, AccordionModule,  CalendarModule } from '../../../shared/components/index';
import { AlertModule } from 'ngx-bootstrap/alert';
import { CaoConfigRoutingModule } from './caoconfig-routing.module';
import { PageHeaderModule } from '../../../shared';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, PanelModule, AlertModule.forRoot(), TabMenuModule, TabViewModule,DialogModule,
               TableModule,MultiSelectModule, ButtonModule, DataGridModule, AccordionModule,CalendarModule,
               MessagesModule, GrowlModule,
               CaoConfigRoutingModule, PageHeaderModule ],
    declarations: [CaoConfigComponent],
    exports: [CaoConfigComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class CaoConfigModule { }
