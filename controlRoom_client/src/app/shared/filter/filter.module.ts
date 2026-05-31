import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { FilterComponent } from './filter.component';
import { TreeModule } from 'primeng/tree';
import { I18nModule } from '../pipes/i18n.module';
import { ButtonModule } from 'primeng/button';
import { PanelModule } from 'primeng/panel';

@NgModule({
    imports: [ RouterModule, CommonModule, FormsModule, TreeModule, I18nModule, ButtonModule, PanelModule ],
    declarations: [FilterComponent],
    exports: [FilterComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class FilterModule { }
