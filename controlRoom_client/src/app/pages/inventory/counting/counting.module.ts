import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { CountingComponent } from './counting.component';
import { TableModule } from 'primeng/table';
import { AlertModule } from 'src/app/shared/components.bbs/alert/alert.module';
import { ButtonModule } from 'primeng/button';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import {ToastModule} from 'primeng/toast';
import {CalendarModule} from 'primeng/calendar';
import {PanelModule} from 'primeng/panel';
import {TabViewModule} from 'primeng/tabview';
import { InputTextModule } from 'primeng/inputtext';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, TableModule, AlertModule, ButtonModule, PageHeaderModule,
               ToastModule, CalendarModule, PanelModule,
               InputTextModule,
               TabViewModule ],
    declarations: [CountingComponent],
    exports: [CountingComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class CountingModule { }
