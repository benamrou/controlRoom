import { Component, OnInit } from '@angular/core';
import { VersionCheckService } from './shared/services/index';
import { environment } from '../environments/environment';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    providers: [VersionCheckService],
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    constructor(private _versionCheckService: VersionCheckService) { }

    ngOnInit() {

        this._versionCheckService.initVersionCheck(environment.serverURL);
    }
}
