import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { StockComponent } from './stock.component';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { InputTextModule } from 'primeng/inputtext';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, TableModule, ButtonModule,
               InputTextModule,
               MessagesModule, MessageModule, PageHeaderModule],
    declarations: [StockComponent],
    exports: [StockComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class StockModule { }
