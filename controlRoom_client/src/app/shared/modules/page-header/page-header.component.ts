import { Component, OnInit, Input } from '@angular/core';
import { HttpService, ScreenService } from '../../services/'

@Component({
    selector: 'app-page-header',
    templateUrl: './page-header.component.html',
    styleUrls: ['./page-header.component.scss', '../../../app.component.scss']
})
export class PageHeaderComponent implements OnInit {
    @Input() screenID: string;
    @Input() heading: string;
    @Input() icon: string;
    @Input() waitMessage: string;

    screenInfo: any;
    constructor(private _screenInfo: ScreenService, public _httpService: HttpService) {
    }

    ngOnInit() {
        this._httpService.resetTransaction();
        this._screenInfo.getScreenInfo(this.screenID).subscribe(
            data  => {  
                if (data.length > 0) { this.screenInfo = data[0].SCREENINFO;  }
            }
        );
    }
}
