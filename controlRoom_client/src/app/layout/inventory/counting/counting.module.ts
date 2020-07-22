import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { CountingComponent } from './counting.component';
import { PanelModule, TableModule, MultiSelectModule,ButtonModule, TabMenuModule,TabViewModule, DialogModule,
         MessagesModule, GrowlModule, DataGridModule, AccordionModule, ToastModule, CalendarModule } from '../../../shared/components/index';
import { AlertModule } from 'ngx-bootstrap/alert';
import { CountingRoutingModule } from './counting-routing.module';
import { PageHeaderModule } from '../../../shared';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, PanelModule, AlertModule.forRoot(), TabMenuModule, TabViewModule,DialogModule,
               TableModule,MultiSelectModule, ButtonModule, DataGridModule, AccordionModule,CalendarModule,
               MessagesModule, GrowlModule,ToastModule,
               CountingRoutingModule, PageHeaderModule ],
    declarations: [CountingComponent],
    exports: [CountingComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class CountingModule { }
