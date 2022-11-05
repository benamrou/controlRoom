import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { CaoConfigComponent } from './caoconfig.component';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { MessageModule } from 'primeng/message';
import { MessagesModule } from 'primeng/messages';
import { InputTextModule } from 'primeng/inputtext';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, TableModule, ButtonModule, PageHeaderModule,
               InputTextModule,
               MessagesModule, MessageModule ],
    declarations: [CaoConfigComponent],
    exports: [CaoConfigComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class CaoConfigModule { }
