import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { PanelModule, TableModule, MultiSelectModule,ButtonModule, DialogModule,
        DropdownModule, AutoCompleteModule, 
         MessagesModule, GrowlModule, DataGridModule, CalendarModule, ToastModule} from '../../shared/components/index';
import { WarehouseRoutingModule } from './warehouse-routing.module';
import { PageHeaderModule } from '../../shared';


import { WarehouseComponent } from './warehouse.component';
// Toolkit component
import { FixPickingUnitModule} from './toolkit/fix.picking.unit/fix.picking.unit.module';


@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, 
               WarehouseRoutingModule,
               FixPickingUnitModule,
               PanelModule, AutoCompleteModule,
               TableModule,DialogModule, MultiSelectModule, ButtonModule, DataGridModule, DropdownModule, 
               MessagesModule, GrowlModule, PageHeaderModule, CalendarModule, ToastModule ],
    declarations: [WarehouseComponent],
    exports: [WarehouseComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class WarehouseModule { }
