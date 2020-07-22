import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { PanelModule, TableModule, MultiSelectModule,ButtonModule, DialogModule,DragDropModule,
         DropdownModule, AutoCompleteModule, AccordionModule, TabViewModule,TreeTableModule,TreeModule,
         MessagesModule, GrowlModule, DataGridModule, CalendarModule, ToastModule} from '../../../shared/components/index';

import { PageHeaderModule } from '../../../shared';


import { MdmAttributeRoutingModule } from './mdm.attribute-routing.module';
// Toolkit component
import { MdmAttributeComponent} from './mdm.attribute.component';


@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, 
               MdmAttributeRoutingModule, DragDropModule,
               PanelModule, AutoCompleteModule,AccordionModule,TabViewModule,TreeTableModule,TreeModule,
               TableModule,DialogModule, MultiSelectModule, ButtonModule, DataGridModule, DropdownModule, 
               MessagesModule, GrowlModule, PageHeaderModule, CalendarModule, ToastModule ],
    declarations: [ MdmAttributeComponent ],
    exports: [ MdmAttributeComponent ],
	schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})

export class MdmAttributeModule { }

