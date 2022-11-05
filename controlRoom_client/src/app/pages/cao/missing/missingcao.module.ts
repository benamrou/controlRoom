import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';

import { PresetCAOModule } from './preset/presetcao.module';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { ToastModule } from 'primeng/toast';
import { TabViewModule } from 'primeng/tabview';
import { InputTextModule } from 'primeng/inputtext';


// Toolkit component
import { MissingCAOComponent} from './missingcao.component';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, 
               TableModule,DialogModule,
               InputTextModule,
               PresetCAOModule,ButtonModule,
               PageHeaderModule,ToastModule, 
               TabViewModule,
               MessagesModule, MessageModule ],
    declarations: [ MissingCAOComponent],
    exports: [MissingCAOComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class MissingCAOModule { }

