import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AiUsersRolesComponent } from './ai.users.roles.component';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
@NgModule({ imports: [RouterModule, CommonModule, PageHeaderModule],
  declarations: [AiUsersRolesComponent], exports: [AiUsersRolesComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA] })
export class AiUsersRolesModule {}
