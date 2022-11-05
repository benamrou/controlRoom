import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { NotFoundComponent } from './not-found.component';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule ],
    declarations: [NotFoundComponent],
    exports: [NotFoundComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class NotFoundModule { }
