import { Component, ViewChild, OnDestroy, HostListener } from '@angular/core';
import { ViewEncapsulation } from '@angular/core';
import { SearchService, SyndigoEnvironment, SyndigoService } from '../../../shared/services/index';
import { MessageService } from 'primeng/api';
import { SyndigoResult, SyndigoData } from 'src/app/shared/services/syndigo/syndigo.result';
import { Chips } from 'primeng/chips';


@Component({
    selector: 'ecommerce-picture-cmp',
    templateUrl: './ecommerce.picture.component.html',
    styleUrls: ['./ecommerce.picture.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class EcommercePictureComponent implements OnDestroy {
  @ViewChild(Chips) chips: Chips;
  
  @HostListener('window:scroll', ['$event']) getScrollHeight(event) {
    if (window.pageYOffset >= 400) {
      this.displayOverlayInfo = true;
    }
    else {
      this.displayOverlayInfo = false;
    }
  }
  // Search action
   uploadedFiles: any[] = [];
   //msgs: Message[] = [];

  // Search result 
   searchResult : any[] = [];
   tabSelect: number = 0;
   displayOverlayInfo: boolean = false;
   displaySetting: boolean= false;
   displaySettingOption: boolean= false;

   externalFiles;

   // Selected element
   selectedElement: any = {};
   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries

  // Request subscription
  subscription: any[] = [];

  constructor(private _searchService: SearchService, private _messageService: MessageService,
              public _syndigoService: SyndigoService) {
  }
  

  search() {
    this.razSearch();
  }

  onUpload(event) {
    console.log('this.uploadedFiles', this.uploadedFiles, this.externalFiles);
    this._messageService.add({severity: 'info', summary: 'File Uploaded', detail: ''});
}

onSelectImage(event) {
}

onRemoveImage(event) {
  console.log('Removing image', this.uploadedFiles, this.externalFiles)
}

  razSearch () {
    this.searchResult = [];
    this.selectedElement = {};
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