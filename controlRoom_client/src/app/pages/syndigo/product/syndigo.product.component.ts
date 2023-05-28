import { Component, ViewChild, OnDestroy, HostListener } from '@angular/core';
import { ViewEncapsulation } from '@angular/core';
import { SearchService } from '../../../shared/services/index';
import { MessageService } from 'primeng/api';
import { FullCalendar } from 'primeng/fullcalendar';

export class SearchResultFormat {
  COL1: any;
  COL2: any;
  COL3: any;
  COL4: any;
  COL5: any;
  COL6: any;
}


@Component({
    selector: 'syndigo-product-cmp',
    templateUrl: './syndigo.product.component.html',
    styleUrls: ['./syndigo.product.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class SyndigoProductComponent implements OnDestroy {
  
@HostListener('window:scroll', ['$event']) getScrollHeight(event) {
  if (window.pageYOffset >= 400) {
    this.displayOverlayInfo = true;
  }
  else {
    this.displayOverlayInfo = false;
  }
}
  // Search action
   values: string [] = [];
   //msgs: Message[] = [];

  // Search result 
   searchResult : any [] = [];
   tabSelect: number = 0;
   displayOverlayInfo: boolean = false;
   displaySetting: boolean= false;

   // Selected element
   selectedElement: any = {};
   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries

  // Request subscription
  subscription: any[] = [];

  constructor(private _searchService: SearchService, private _messageService: MessageService) {
  }
  

  search() {
    this.razSearch();
    this._messageService.add({severity:'info', summary:'Info Message', detail: 'Looking for the elements : ' + JSON.stringify(this.values)});
    this.searchButtonEnable = false; 
    this.subscription.push(this._searchService.getSearchResult(this.values)
            .subscribe( 
                data => { this.searchResult = data;}, // put the data returned from the server in our variable
                error => {
                      console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                      this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                },
                () => { 
                      this._messageService.add({severity:'success', summary:'Info Message', detail: 'Retrieved ' + 
                                     this.searchResult.length + ' reference(s).'});

                      this.searchButtonEnable = true;

                }
            ));
  }


  razSearch () {
    this.searchResult = [];
    this.selectedElement = {};
  }

  setting(){
    console.log('displaySetting', this.displaySetting);
    this.displaySetting =true;
  }

  ngOnDestroy() {
    for(let i=0; i< this.subscription.length; i++) {
      this.subscription[i].unsubscribe();
    }
  }

  tabSelection(e) {
    this.tabSelect = e.index;
    console.log('onScroll: ', e)
  }
}