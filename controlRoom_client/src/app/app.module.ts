import { BrowserModule,  } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule, Http, RequestOptions, XHRBackend } from '@angular/http';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthentificationGuard, HttpService } from './shared/services/index';
import { UserService, LogginService, LabelService } from './shared/services/index';
import { SharedPipesModule } from './shared/pipes/index'
import { AlertConfig } from 'ngx-bootstrap';

import { DialogModule } from './shared/components/index';


// AoT requires an exported function for factories
export function HttpServiceFactory(backend: XHRBackend, options: RequestOptions) {
     return new HttpService(backend, options);
}

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule, BrowserAnimationsModule, 
        SharedPipesModule,
        FormsModule,
        HttpModule,
        AppRoutingModule,
        DialogModule
    ],
    providers: [{
      provide: HttpService,
      useFactory: HttpServiceFactory,
      deps: [XHRBackend, RequestOptions]}, 
      AuthentificationGuard, 
      UserService, LogginService, LabelService, 
      AlertConfig
      ],
    bootstrap: [AppComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
