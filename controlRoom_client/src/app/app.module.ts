import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';


import { DatePipe } from '@angular/common';

import { AuthentificationGuard, HttpService } from './shared/services/index';
import { UserService, LogginService, LabelService, QueryService, StructureService } from './shared/services/index';
import { GridsterModule } from './shared';
//import { HttpModule, Http, ResponseOptions, RequestOptions, BaseRequestOptions, XHRBackend, BrowserXhr } from '@angular/http';
import { MockBackend, MockConnection } from '@angular/http/testing';


// AoT requires an exported function for factories
//export function HttpServiceFactory(backend: XHRBackend, options: RequestOptions, browser: BrowserXhr, responses: ResponseOptions) {
//export function HttpServiceFactory(mockbackend: MockBackend, backend: XHRBackend, options: BaseRequestOptions) {
//    return new HttpService(mockbackend, backend, options);
//}


// AoT requires an exported function for factories
export const createTranslateLoader = (http: HttpClient) => {
    /* for development
    return new TranslateHttpLoader(
        http,
        '/start-angular/SB-Admin-BS4-Angular-6/master/dist/assets/i18n/',
        '.json'
    ); */
   return new TranslateHttpLoader(http, './assets/i18n/', '.json');
};

@NgModule({
    imports: [
        CommonModule,
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        GridsterModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: createTranslateLoader,
                deps: [HttpClient]
            }
        }),
        AppRoutingModule
    ] ,
    declarations: [AppComponent],
    providers: [
        /*{
        provide: HttpService,
        useFactory: HttpServiceFactory,
        deps: [MockBackend, XHRBackend, BaseRequestOptions]
        },*/
        HttpService,
        //MockBackend,
        //BaseRequestOptions,
        AuthentificationGuard, 
        //XHRBackend, BrowserXhr,ResponseOptions,
        UserService, LogginService, LabelService, QueryService,StructureService,
        DatePipe],
    bootstrap: [AppComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]

})
export class AppModule {}

 
//deps: [XHRBackend, RequestOptions,  BrowserXhr, ResponseOptions]}, 