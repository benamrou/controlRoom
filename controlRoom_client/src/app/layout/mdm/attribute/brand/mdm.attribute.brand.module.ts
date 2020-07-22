import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { PanelModule, TableModule, MultiSelectModule,ButtonModule, DialogModule,DragDropModule,
         FileUploadModule,
         DropdownModule, AutoCompleteModule, AccordionModule, TabViewModule,TreeTableModule,TreeModule,
         MessagesModule, GrowlModule, DataGridModule, CalendarModule, ToastModule} from '../../../../shared/components/index';

import { PageHeaderModule } from '../../../../shared';


import { MdmAttributeBrandRoutingModule } from './mdm.attribute.brand-routing.module';
// Toolkit component
import { MdmAttributeBrandComponent} from './mdm.attribute.brand.component';


@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, 
               FileUploadModule,
               MdmAttributeBrandRoutingModule, DragDropModule,
               PanelModule, AutoCompleteModule,AccordionModule,TabViewModule,TreeTableModule,TreeModule,
               TableModule,DialogModule, MultiSelectModule, ButtonModule, DataGridModule, DropdownModule, 
               MessagesModule, GrowlModule, PageHeaderModule, CalendarModule, ToastModule ],
    declarations: [ MdmAttributeBrandComponent ],
    exports: [ MdmAttributeBrandComponent ],
	schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})

export class MdmAttributeBrandModule { }

