import { Component, OnInit, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ScreenService } from '../../services/'

@Component({
    selector: 'app-page-header',
    templateUrl: './page-header.component.html',
    styleUrls: ['./page-header.component.scss', '../../../app.component.scss'],
    providers: [ScreenService]
})
export class PageHeaderComponent implements OnInit {
    @Input() screenID: string;
    @Input() heading: string;
    @Input() icon: string;

    screenInfo;
    constructor(private _screenInfo: ScreenService) {
    }

    ngOnInit() {
        this._screenInfo.getScreenInfo(this.screenID).subscribe(
            data  => {  
                if (data.length > 0) { this.screenInfo = data[0].SCREENINFO;  }
            }
        );
    }
}
