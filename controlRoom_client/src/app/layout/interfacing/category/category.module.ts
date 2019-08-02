import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { MessagesModule, GrowlModule, FileUploadModule, FileReaderComponentrModule } from '../../../shared/components';
import { CategoryComponent } from './category.component';
import { CategoryRoutingModule } from './category-routing.module';
import { PageHeaderModule } from '../../../shared';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule,FileUploadModule, FileReaderComponentrModule, 
               MessagesModule, GrowlModule,
               CategoryRoutingModule, PageHeaderModule ],
    declarations: [CategoryComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class CategoryModule { }
