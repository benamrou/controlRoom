import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessagesModule, DialogModule, ToastModule } from '../shared/components/index';

import { LoginRoutingModule } from './login-routing.module';
import { LoginComponent } from './login.component';

@NgModule({
    imports: [CommonModule, LoginRoutingModule, 
             LoginRoutingModule,ToastModule,
            FormsModule, MessagesModule, DialogModule],
    declarations: [LoginComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LoginModule {}



