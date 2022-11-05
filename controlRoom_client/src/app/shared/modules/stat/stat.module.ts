import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StatComponent } from './stat.component';

@NgModule({
    imports: [CommonModule, RouterModule, StatComponent],
    declarations: [StatComponent],
    exports: [StatComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class StatModule {}

