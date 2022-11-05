import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { ScorecardCAOComponent } from './scorecard.cao.component';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectDropdownModule } from 'src/app/shared/components.bbs';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { ChartModule } from 'src/app/shared/graph';
import { PanelModule } from 'primeng/panel';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, TableModule, DialogModule, 
               ButtonModule, PageHeaderModule,PanelModule,
               MultiSelectDropdownModule,ToastModule,
               ChartModule,
               CalendarModule ],
    declarations: [ScorecardCAOComponent],
    exports: [ScorecardCAOComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class ScorecardCAOModule { }
