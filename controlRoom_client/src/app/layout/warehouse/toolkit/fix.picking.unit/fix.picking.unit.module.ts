import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { PanelModule, TableModule, MultiSelectModule,ButtonModule, DialogModule,
        DropdownModule, AutoCompleteModule, AccordionModule,
         MessagesModule, GrowlModule, DataGridModule, CalendarModule, ToastModule} from '../../../../shared/components/index';
import { PageHeaderModule } from '../../../../shared';

import { FixPickingUnitRoutingModule } from './fix.picking.unit-routing.module';
// Toolkit component
import { FixPickingUnitComponent} from './fix.picking.unit.component';


@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, FixPickingUnitRoutingModule, 
               PanelModule, AutoCompleteModule,AccordionModule,
               TableModule,DialogModule, MultiSelectModule, ButtonModule, DataGridModule, DropdownModule, 
               MessagesModule, GrowlModule, PageHeaderModule, CalendarModule, ToastModule ],
    declarations: [ FixPickingUnitComponent],
    exports: [FixPickingUnitComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class FixPickingUnitModule { }

