import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { PanelModule, TableModule, MultiSelectModule,ButtonModule, DialogModule,
        CheckboxModule, ToggleButtonModule,
        DropdownModule, AutoCompleteModule, StepsModule,BlockUIModule,FieldsetModule,FileUploadModule,
         MessagesModule, GrowlModule, DataGridModule, CalendarModule, ToastModule, TooltipModule} from '../../../shared/components/index';
import { SVAttributeRoutingModule } from './sv.attribute-routing.module';
import { PageHeaderModule } from '../../../shared';


import { SVAttributeComponent } from './sv.attribute.component';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, 
               SVAttributeRoutingModule,
               PanelModule, AutoCompleteModule,
               ToggleButtonModule,TooltipModule,
               StepsModule,BlockUIModule,FieldsetModule,
               FileUploadModule,CheckboxModule,
               TableModule,DialogModule, MultiSelectModule, ButtonModule, 
               DataGridModule, DropdownModule, 
               MessagesModule, GrowlModule, PageHeaderModule, 
               CalendarModule, ToastModule ],
    declarations: [SVAttributeComponent],
    exports: [SVAttributeComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class SVAttributeModule { }
