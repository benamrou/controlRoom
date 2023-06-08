import { Component, ViewChild, OnDestroy, HostListener } from '@angular/core';
import { ViewEncapsulation } from '@angular/core';
import { SearchService, SyndigoEnvironment, SyndigoService } from '../../../shared/services/index';
import { MessageService } from 'primeng/api';
import { SyndigoResult, SyndigoData } from 'src/app/shared/services/syndigo/syndigo.result';

@Component({
    selector: 'syndigo-download-cmp',
    templateUrl: './syndigo.download.component.html',
    styleUrls: ['./syndigo.download.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class SyndigoDownloadComponent implements OnDestroy {
  
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
   searchResult : any[] = [];
   tabSelect: number = 0;
   displayOverlayInfo: boolean = false;
   displaySetting: boolean= false;
   displaySettingOption: boolean= false;
   syndigoInfo : SyndigoEnvironment;

   separatorChips: string = ' ';

   // Selected element
   selectedElement: any = {};
   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries

  // Request subscription
  subscription: any[] = [];

  constructor(private _searchService: SearchService, private _messageService: MessageService,
              public _syndigoService: SyndigoService) {
      this.subscription.push(this._syndigoService.getSyndigoInfo().subscribe( 
        data => { this.displaySettingOption = true}, // put the data returned from the server in our variable
        error => {
              console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
              this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
        },
        () => { }
      ));
  }
  

  search() {
    this.razSearch();
    this._messageService.add({severity:'info', summary:'Info Message', detail: 'Looking for the elements : ' + JSON.stringify(this.values)});
    this.searchButtonEnable = false; 

    this.subscription.push(this._syndigoService.getAuthToken()
            .subscribe( 
                data => {  }, // put the data returned from the server in our variable
                error => {
                      console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                      this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                },
                () => { 
                      this._messageService.add({severity:'success', summary:'Syndigo authorization', detail: 'Retrieved ' + 
                                                ' Syndigo authorization request validated.'});

                      this.subscription.push(this._syndigoService.searchUPCMarketplace(this.values,0, this.values.length*5) .subscribe( 
                      //this.subscription.push(this._syndigoService.testConnection().subscribe(  
                      data => { this.searchResult = data;
                                console.log('searchResult:', this.searchResult.length, this.searchResult);}, // put the data returned from the server in our variable
                        error => {
                              this.searchButtonEnable = true;
                              console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                              this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                        },
                        () => {
                              this.searchButtonEnable = true;
                              this._messageService.add({severity:'success', summary:'Syndigo references', detail: 'Retrieved ' + 
                                                        ' Syndigo product information captured.'});
                        }
                    ));
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

  saveJson(){
    var a = document.createElement('a');
    a.setAttribute('href', 'data:text/plain;charset=utf-u,'+encodeURIComponent(JSON.stringify(this.searchResult)));
    a.setAttribute('download', 'SYNDIGOLlookUp_' + this.values.join('_') + '.json');
    a.click()
  }
}