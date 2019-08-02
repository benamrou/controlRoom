import {Component, OnInit} from '@angular/core';
import {ViewEncapsulation } from '@angular/core';
import {DatePipe } from '@angular/common';
import { InventoryService} from '../../../shared/services/index';
import { SelectItem, Message } from '../../../shared/components/index';


@Component({
	moduleId: module.id,
    selector: 'stock-cmp',
    templateUrl: './stock.component.html',
    providers: [InventoryService],
    styleUrls: ['./stock.component.scss', '../../../app.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class StockComponent {
   
   columnOptions: SelectItem[];

  // Search result 
   searchResult;
   columnsResult: any [] = [];
   columsCollapse: any [] = [];
   columnsResultMVT: any [] = [];
   columnsResultRejection: any [] = [];
   performedResearch: boolean = false;
   stockDate: any;
   overallPercentage: number;
   locationCode: any;

   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries

  // Search action
   searchCode: string = '';
   msgs: Message[] = [];
   dataReady = false;
   // Selected element
   selectedElement;

  constructor(private _inventoryService: InventoryService) {
    this.columsCollapse = [
      {header: 'Snap', colspan: 1, expand: 0, colspan_original: 1},
      {header: 'Location', colspan: 2, expand: 1, colspan_original: 2},
      {header: 'Merchandise hierarchy', colspan: 8, expand: -1, colspan_original: 8},
      {header: 'Item', colspan: 2, expand: 1, colspan_original: 2},
      {header: 'Inventory Info', colspan: 5, expand: -1, colspan_original: 5},
      {header: 'Inventory Mvt', colspan: 3, expand: -1, colspan_original: 3},
      {header: 'Orderable', colspan: 1, expand: 0, colspan_original: 1}
    ];

    this.columnsResult = [
      { field: 'IMAGE_DATE', header: 'Snapshot date', expand: 0, display: true, main: true},
      /** **/
      { field: 'STOSITE', header: 'Store #' , expand: 1, display: true, main: true},
      { field: 'SOCLMAG', header: 'Store desc.', expand: 0, display: true, main: false},
      /** **/
      { field: 'DEPT_ID', header: 'Dept id.', expand: -1, display: true, main: true},
      { field: 'DEPT_DESC', header: 'Dept Desc.', expand: 0, display: true, main: false},
      { field: 'SDEPT_ID', header: 'Sub-Dept id.', expand: 0, display: true, main: false},
      { field: 'SDEPT_DESC', header: 'Sub-Dep Desc.', expand: 0, display: true, main: false},
      { field: 'CAT_ID', header: 'Cat id.', expand: 0, display: true, main: false},
      { field: 'CAT_DESC', header: 'Cat Desc.', expand: 0, display: true, main: false},
      { field: 'SCAT_ID', header: 'Sub-Cat id.', expand: 0, display: true, main: false},
      { field: 'SCAT_DESC', header: 'Sub-Cat Desc.', expand: 0, display: true, main: false},
      /** **/
      { field: 'ITEMCODE', header: 'Item #', expand: 1, display: true, main: true},
      { field: 'ITEM_DESC', header: 'Item Desc.', expand: 0, display: true, main: false},
      /** **/
      { field: 'QTY', header: 'Inventory', expand: 1, display: true, main: true},
      { field: 'TOTALCOST', header: 'Total cost', expand: 0, display: true, main: false},
      { field: 'UNITCOST', header: 'Unit cost', expand: 0, display: true, main: false},
      { field: 'RETAIL', header: 'Retail', expand: 0, display: true, main: false},
      { field: 'MARGIN', header: 'Margin', expand: 0, display: true, main: false},
      /** **/
      { field: 'LASTMVTDATE', header: 'Last Mvt. date', expand: 1, display: true, main: true},
      { field: 'LASTMVT', header: 'Last Mvt.', expand: 0, display: true, main: false},
      { field: 'LASTSALE', header: 'Last sale', expand: 0, display: true, main: false},
      /** **/
      { field: 'ORDERABLEUNTIL', header: 'Orderable until', expand: 0, display: true, main: true}
    ];

    for (let i=0; i < this.columsCollapse.length; i++) {
      this.expandColumn(i); 
    }
    this.razSearch();
  }

  search(mode: any) {
    //this.searchCode = searchCode;
    let datePipe = new DatePipe('en-US');
    this.msgs.push({severity:'info', summary:'Info Message', detail: 'Looking for store inventory.'});    
    this._inventoryService.getStoreInventory(this.locationCode,mode)
            .subscribe( 
                data => { 
                    this.searchResult = data; // put the data returned from the server in our variable
                    this.dataReady = true;
                },
                error => {
                      console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                      this.msgs.push({severity:'error', summary:'ERROR Message', detail: error });
                },
                () => {this.msgs.push({severity:'warn', summary:'Info Message', detail: 'Retrieved ' + 
                                     this.searchResult.length + ' reference(s).'});
                }
            );
  }

  razSearch () {
    this.searchResult = [];
  }

  handleRowSelect(event) {
    // Gather the others data for item selected.
    let datePipe = new DatePipe('en-US');
    this.msgs.push({severity:'info', summary:'Info Message', detail: 'Gathering inventory information ' + event.data.site});
 
    //this.checkAlert(this.selectedElement, this.search_STEP2_Result, this.search_STEP3_Result, 
    //                datePipe.transform(event.data.inventorydate, 'MM/dd/yyyy'), event.data.site);
    this.msgs.push({severity:'warn', summary:'Info Message', detail: 'Item inventory data retrieved'});
  }

  expandColumn(indice: number) {
    this.columsCollapse[indice].expand = this.columsCollapse[indice].expand * -1;
    let j = 0;
    for(let i = 0; i < this.columsCollapse.length; i++) {
      if(i === indice) {
        if(this.columsCollapse[indice].expand === -1) {
          this.columsCollapse[indice].colspan = this.columsCollapse[indice].colspan_original;
        }
        else {
          this.columsCollapse[indice].colspan = 1;
        }
        for(let k=j; k < this.columsCollapse[indice].colspan_original+j; k++) {
          if (this.columnsResult[k].main === false) {
            if (this.columsCollapse[indice].expand === -1) {
              this.columnsResult[k].display = true;
            }
            if (this.columsCollapse[indice].expand === 1) {
              this.columnsResult[k].display = false;
            }
          }
        }
      }
      else {
        j = j + this.columsCollapse[i].colspan_original;
      }
    }
  }

}

