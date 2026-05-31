import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { GridsterModule } from './gridster/gridster.module';
import { PageHeaderModule } from './page-header/page-header.module';
import { I18nModule } from '../pipes/i18n.module';

@NgModule({
    imports: [CommonModule, RouterModule, FormsModule, GridsterModule, PageHeaderModule, I18nModule ],
    exports: [GridsterModule, PageHeaderModule, I18nModule],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SharedModule {}

