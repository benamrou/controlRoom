import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AiContextLearningComponent } from './ai.context.learning.component';

import { DropdownModule }      from 'primeng/dropdown';
import { ProgressBarModule }   from 'primeng/progressbar';
import { ButtonModule }        from 'primeng/button';
import { TagModule }           from 'primeng/tag';
import { DividerModule }       from 'primeng/divider';
import { ToastModule }         from 'primeng/toast';
import { InputTextModule }     from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TableModule }         from 'primeng/table';
import { DialogModule }        from 'primeng/dialog';
import { TooltipModule }       from 'primeng/tooltip';

import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { I18nModule } from 'src/app/shared/pipes/i18n.module';

@NgModule({
    imports: [
        RouterModule, CommonModule, FormsModule,
        DropdownModule, ProgressBarModule, ButtonModule, TagModule,
        DividerModule, ToastModule, InputTextModule, InputTextareaModule,
        PageHeaderModule, I18nModule,
    ],
    declarations: [AiContextLearningComponent],
    exports: [AiContextLearningComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AiContextLearningModule {}
