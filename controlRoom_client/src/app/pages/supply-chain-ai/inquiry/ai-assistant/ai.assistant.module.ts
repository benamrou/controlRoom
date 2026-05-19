import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AiAssistantComponent } from './ai.assistant.component';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TimelineModule } from 'primeng/timeline';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { AccordionModule } from 'primeng/accordion';

@NgModule({
    imports: [RouterModule, CommonModule, FormsModule, PageHeaderModule, InputTextareaModule, InputTextModule, ButtonModule, CardModule, TimelineModule, TagModule, ToastModule, DropdownModule, TableModule, TooltipModule, AccordionModule],
    declarations: [AiAssistantComponent],
    exports: [AiAssistantComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AiAssistantModule { }

