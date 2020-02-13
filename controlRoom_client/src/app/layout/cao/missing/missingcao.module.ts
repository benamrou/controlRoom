import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { PanelModule, TableModule, MultiSelectModule,ButtonModule, DialogModule,DragDropModule,
        TooltipModule,
        DropdownModule, AutoCompleteModule, AccordionModule, TabViewModule,TreeTableModule,TreeModule,
         MessagesModule, GrowlModule, DataGridModule, CalendarModule, ToastModule} from '../../../shared/components/index';

import { PresetCAOModule } from './preset/presetcao.module';
import { PageHeaderModule } from '../../../shared';


import { MissingCAORoutingModule } from './missingcao-routing.module';
// Toolkit component
import { MissingCAOComponent} from './missingcao.component';


@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, 
               MissingCAORoutingModule, DragDropModule,
               PresetCAOModule,TooltipModule,
               PanelModule, AutoCompleteModule,AccordionModule,TabViewModule,TreeTableModule,TreeModule,
               TableModule,DialogModule, MultiSelectModule, ButtonModule, DataGridModule, DropdownModule, 
               MessagesModule, GrowlModule, PageHeaderModule, CalendarModule, ToastModule ],
    declarations: [ MissingCAOComponent],
    exports: [MissingCAOComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class MissingCAOModule { }

