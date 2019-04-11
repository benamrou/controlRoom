import {NgModule,Component,Input,Output,EventEmitter,Optional} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
    selector: 'p-message',
    template: `
        <div aria-live="polite" class="ui-message ui-widget ui-corner-all" *ngIf="severity"
        [ngClass]="{'ui-message-info': (severity === 'info'),
                'ui-message-warn': (severity === 'warn'),
                'ui-message-error': (severity === 'error'),
                'ui-message-success': (severity === 'success')}">
            <span class="ui-message-icon" [ngClass]="icon"></span>
            <span class="ui-message-text" [innerHTML]="text"></span>
        </div>
    `
})
export class UIMessage {

    @Input() severity: string;

    @Input() text: string;

    get icon(): string {
        let icon: string = null;

        if(this.severity) {
            switch(this.severity) {
                case 'success':
                    icon = 'fa fa-check';
                break;

                case 'info':
                    icon = 'fa fa-info-circle';
                break;

                case 'error':
                    icon = 'fa fa-times';
                break;

                case 'warn':
                    icon = 'fa fa-exclamation-triangle';
                break;

                default:
                    icon = 'fa fa-info-circle';
                break;
            }
        }

        return icon;
    }
}

@NgModule({
    imports: [CommonModule],
    exports: [UIMessage],
    declarations: [UIMessage]
})
export class MessageModule { }
