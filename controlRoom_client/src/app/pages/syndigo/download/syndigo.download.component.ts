import { Component, ViewChild, OnDestroy, HostListener } from '@angular/core';
import { ViewEncapsulation } from '@angular/core';
import { SearchService } from '../../../shared/services/index';
import { MessageService } from 'primeng/api';
import { FullCalendar } from 'primeng/fullcalendar';


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

  @ViewChild('fc') fc!: FullCalendar;
  // Search action
   values: string [] = [];
   //msgs: Message[] = [];

  // Search result 
   searchResult : any [] = [];
   tabSelect: number = 0;
   displayOverlayInfo: boolean = false;

   // Selected element
   selectedElement: any = {};
   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries

   // Indicator to check the first research
   performedResearch: boolean = false;

  // Indicator for sub-panel detail
  itemDetail: boolean = false;

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
                      console.log('this.searchResult:', this.searchResult);
                      for (let i=0; i < this.searchResult.length; i++) {
                        this.getAllInformation(i, this.searchResult[i].ARTCEXR, this.searchResult[i].ARTCINR);
                      }

                      this.performedResearch = true;
                      this.searchButtonEnable = true;

                }
            ));
  }


  getAllInformation(index, temCode, itemInternalCode) {
    this.getRetail(index, temCode, itemInternalCode);
    this.getCost(index, temCode, itemInternalCode);
    this.getOrderable(index, temCode, itemInternalCode);
    this.getDeliverable(index, temCode, itemInternalCode);
    this.getSubstitution(index, temCode, itemInternalCode);
    this.getWarehousePallet(index, temCode, itemInternalCode);
    this.getSaleVariant(index, temCode, itemInternalCode);
    this.getLogisticVariant(index, temCode, itemInternalCode);
    this.getDeals(index, temCode, itemInternalCode);

  }

  getRetail(index, itemCode, itemInternalCode) {
    this.searchResult[index].retails = [];
    this.subscription.push(this._searchService.getSearchResultRetail(itemInternalCode)
              .subscribe( 
                data => {this.searchResult[index].retails= data;}, // put the data returned from the server in our variable
                error => {
                      console.log('Error HTTP GET Service ' ,error); // in case of failure show this message
                },
                () => { 
                  console.log('this.searchResult:', this.searchResult);
                }
            ));
  }

  getCost(index, itemCode, itemInternalCode) {
    this.searchResult[index].costs = [];
    this.subscription.push(this._searchService.getSearchResultCost(itemInternalCode)
              .subscribe( 
                data => {this.searchResult[index].costs= data;}, // put the data returned from the server in our variable
                error => {
                      console.log('Error HTTP GET Service ' ,error); // in case of failure show this message
                },
                () => { }
            ));
  }

  getDeliverable(index, itemCode, itemInternalCode) {
    this.searchResult[index].deliverables = [];
    this.subscription.push(this._searchService.getSearchResultDeliverable(itemInternalCode)
              .subscribe( 
                data => {this.searchResult[index].deliverables= data;}, // put the data returned from the server in our variable
                error => {
                      console.log('Error HTTP GET Service ' ,error); // in case of failure show this message
                },
                () => { }
            ));
  }

  getOrderable(index, itemCode, itemInternalCode) {
    this.searchResult[index].orderables = [];
    this.subscription.push(this._searchService.getSearchResultOrderable(itemInternalCode)
              .subscribe( 
                data => {this.searchResult[index].orderables= data;}, // put the data returned from the server in our variable
                error => {
                      console.log('Error HTTP GET Service ' ,error); // in case of failure show this message
                },
                () => { }
            ));
  }

  getSubstitution(index, itemCode, itemInternalCode) {
    this.searchResult[index].substitutions = [];
    this.subscription.push(this._searchService.getSearchResultSubstitution(itemInternalCode)
              .subscribe( 
                data => {this.searchResult[index].substitutions= data;}, // put the data returned from the server in our variable
                error => {
                      console.log('Error HTTP GET Service ' ,error); // in case of failure show this message
                },
                () => { }
            ));
  }

  getWarehousePallet(index, itemCode, itemInternalCode) {
    this.searchResult[index].pallets = [];
    this.subscription.push(this._searchService.getSearchResultWarehousePallet(itemCode)
              .subscribe( 
                data => {this.searchResult[index].pallets= data;}, // put the data returned from the server in our variable
                error => {
                      console.log('Error HTTP GET Service ' ,error); // in case of failure show this message
                },
                () => { }
            ));
  }

  getSaleVariant(index, itemCode, itemInternalCode) {
    this.searchResult[index].salesvariants = [];
    this.subscription.push(this._searchService.getSearchResultSaleVariant(itemInternalCode)
              .subscribe( 
                data => {this.searchResult[index].salesvariants= data;}, // put the data returned from the server in our variable
                error => {
                      console.log('Error HTTP GET Service ' ,error); // in case of failure show this message
                },
                () => { }
            ));
  }

  getLogisticVariant(index, itemCode, itemInternalCode) {
    this.searchResult[index].logisticsvariants = [];
    this.subscription.push(this._searchService.getSearchResultLogisticVariant(itemInternalCode)
              .subscribe( 
                data => {this.searchResult[index].logisticsvariants= data;}, // put the data returned from the server in our variable
                error => {
                      console.log('Error HTTP GET Service ' ,error); // in case of failure show this message
                },
                () => { }
            ));
  }

  getDeals(index, itemCode, itemInternalCode) {
    this.searchResult[index].deals = [];
    this.subscription.push(this._searchService.getSearchResultDeals(itemInternalCode)
              .subscribe( 
                data => {this.searchResult[index].deals= data;}, // put the data returned from the server in our variable
                error => {
                      console.log('Error HTTP GET Service ' ,error); // in case of failure show this message
                },
                () => { }
            ));
  }
  


  razSearch () {
    this.searchResult = [];
    this.selectedElement = {};
    this.itemDetail = false; 
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