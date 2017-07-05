import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { SupplierScheduleComponent } from './supplier.schedule.component';
import { PanelModule, DataTableModule, MultiSelectModule,ButtonModule, 
         MessagesModule, GrowlModule, DataGridModule} from '../../shared/components/index';
import { SupplierScheduleRoutingModule } from './supplier.schedule-routing.module';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, SupplierScheduleRoutingModule,
               PanelModule, 
               DataTableModule,MultiSelectModule, ButtonModule, DataGridModule, 
               MessagesModule, GrowlModule ],
    declarations: [SupplierScheduleComponent],
    exports: [SupplierScheduleComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class SupplierScheduleModule { }
