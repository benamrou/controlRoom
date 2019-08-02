import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HttpModule } from '@angular/http';
import { FormsModule }  from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InquiryComponent } from './inquiry.component';
import { TableModule, MultiSelectModule, ButtonModule, ChipsModule,
         MessagesModule, GrowlModule, ToastModule,
        TooltipModule } from '../../shared/components/index';

import { ItemModule } from '../../shared/index';
import { InquiryRoutingModule } from './inquiry-routing.module';
import { StatModule } from '../../shared';
import { PageHeaderModule } from '../../shared';

@NgModule({
    imports: [ RouterModule,HttpModule, CommonModule,FormsModule,
               TableModule,MultiSelectModule,
               ButtonModule, ChipsModule, 
               MessagesModule, GrowlModule,
               TooltipModule, ItemModule,
               ToastModule,
               StatModule,
               InquiryRoutingModule,
               PageHeaderModule ],
    declarations: [InquiryComponent],
    exports: [InquiryComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class InquiryModule { }
