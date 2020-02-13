import {Component, ViewEncapsulation, ViewChild, Injectable, Input} from '@angular/core';
import {  WidgetService, CaoService, TreeDragDropService } from '../../../../shared/services';
import { Dialog, SelectItem, Chips, Message, DataGrid, FullCalendar, TreeNode, Tree } from '../../../../shared/components';
import { MessageService } from '../../../../shared/components';
import {DatePipe} from '@angular/common';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/toPromise';

/**
 * 
 * @author Ahmed Benamrouche
 * 
 */

@Component({
	  moduleId: module.id,
    selector: 'presetcao',
    templateUrl: './presetcao.component.html',
    providers: [ WidgetService, CaoService, MessageService, TreeDragDropService],
    styleUrls: ['./presetcao.component.scss', '../../../../app.component.scss'],
    encapsulation: ViewEncapsulation.None
})

@Injectable()
export class PresetCAOComponent {

  @ViewChild('fc') fc: FullCalendar;
  @ViewChild('expandingTree')
  expandingTree: Tree;

   columnOptions: SelectItem[];
   trackIndex: number = 0;

  // Search result 
  searchResult : any [] = [];
  selectedElement: any;
  columnsResult: any [] = [];
  searchResultStore : any [] = [];
  selectedElementStore: any;
  columnsResultStore: any [] = [];

  datePipe: DatePipe;
  dateNow: Date;
  dateTomorrow: Date;

  displayUpdateCompleted: boolean = false;
  msgDisplayed: String;
 
  msgs: Message[] = [];

  constructor( private _messageService: MessageService, private _caoService: CaoService) {
    this.datePipe     = new DatePipe('en-US');
    this.dateNow = new Date();
    this.dateTomorrow =  new Date(this.dateNow.setDate(this.dateNow.getDate() + 1));

    this.columnsResult = [
      { field: 'MERCH_ID', header: 'Merch. id' , width: '10%'},
      { field: 'DEPT_ID', header: 'Dept.', width: '20%' },
      { field: 'CAT_ID', header: 'Cat.', width: '25%' },
      { field: 'SCAT_ID', header: 'Sub-Cat', width: '25%' },
      { field: 'STORE_TYPE', header: 'Type', width: '10%' },
      { field: 'PRES_STOCK', header: 'Pres. Stock', width: '10%' }
    ];

    this.columnsResultStore = [
      { field: 'STORE_ID', header: 'Store #' , width: '20%'},
      { field: 'STORE_DESC', header: 'Description', width: '50%' },
      { field: 'STORE_TYPE', header: 'Type', width: '30%' }
    ];

    this._caoService.getCaoPredefinedConfiguration().subscribe(
        data => { this.searchResult = data;  },
        error => {},
        () => {});

    this._caoService.getCaoStoreType().subscribe(
            data => { this.searchResultStore = data; },
            error => {},
            () => {});
  }

}