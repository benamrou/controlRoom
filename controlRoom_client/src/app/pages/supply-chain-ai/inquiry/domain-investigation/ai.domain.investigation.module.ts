import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AiDomainInvestigationComponent } from './ai.domain.investigation.component';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { StepsModule } from 'primeng/steps';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { AccordionModule } from 'primeng/accordion';

@NgModule({ imports: [RouterModule, CommonModule, FormsModule, PageHeaderModule, StepsModule, InputTextModule, ButtonModule, CardModule, AccordionModule],
  declarations: [AiDomainInvestigationComponent], exports: [AiDomainInvestigationComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA] })
export class AiDomainInvestigationModule {}
