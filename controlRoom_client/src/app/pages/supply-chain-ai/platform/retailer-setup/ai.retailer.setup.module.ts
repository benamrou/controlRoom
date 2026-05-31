import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AiRetailerSetupComponent } from './ai.retailer.setup.component';

/* PrimeNG */
import { StepsModule } from 'primeng/steps';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { MessageModule } from 'primeng/message';
import { MessagesModule } from 'primeng/messages';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';

/* ICR Shared */
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { I18nModule } from 'src/app/shared/pipes/i18n.module';

@NgModule({
    imports: [
        RouterModule, CommonModule, FormsModule, ReactiveFormsModule,
        StepsModule, InputTextModule, InputNumberModule, PasswordModule,
        ButtonModule, DropdownModule, MessageModule, MessagesModule,
        ProgressBarModule, ToastModule, DividerModule, TagModule,
        CardModule, ChipModule, PageHeaderModule, I18nModule,
    ],
    declarations: [AiRetailerSetupComponent],
    exports: [AiRetailerSetupComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AiRetailerSetupModule { }
