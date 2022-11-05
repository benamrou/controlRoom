import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { MyBatchListComponent } from './mybatch.list.component';
import { ButtonModule } from 'primeng/button';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { TreeModule } from 'primeng/tree';
import { CardModule } from 'primeng/card';
import { ToggleButtonModule } from 'primeng/togglebutton';
import {TreeTableModule} from 'primeng/treetable';


@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, ButtonModule, PageHeaderModule,
               TreeTableModule,
               TreeModule, CardModule, ToggleButtonModule ],
    declarations: [MyBatchListComponent],
    exports: [MyBatchListComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class MyBatchListModule { }