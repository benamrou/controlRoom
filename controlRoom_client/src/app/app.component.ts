import { Component } from '@angular/core';
import { Router } from '@angular/router';

import {LabelService} from './shared/services/index';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {

    constructor() {}

 /*   constructor(private translate: TranslateService) {
        this.translate.addLangs(['en', 'fr', 'ur']);
        this.translate.setDefaultLang('en');

        const browserLang = translate.getBrowserLang();
        //this.translate.use(browserLang.match(/en|fr|ur/) ? browserLang : 'en');
        //this.translate.use('en');
        this.translate.reloadLang('en');
        console.log('Youpi ' + JSON.stringify(this.translate.translations));
        
    }*/

}

