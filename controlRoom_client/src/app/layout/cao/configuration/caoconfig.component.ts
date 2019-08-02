import {Component, OnInit} from '@angular/core';
import {ViewEncapsulation } from '@angular/core';
import {DatePipe } from '@angular/common';
import { CaoService} from '../../../shared/services/index';
import { SelectItem, Message } from '../../../shared/components/index';


@Component({
	moduleId: module.id,
    selector: 'caoconfig-cmp',
    templateUrl: './caoconfig.component.html',
    providers: [CaoService],
    styleUrls: ['./caoconfig.component.scss', '../../../app.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class CaoConfigComponent {
   
   columnOptions: SelectItem[];

  // Search result 
   searchResultCaoLift;
   searchResultCaoItem;
   columnsResultCaoLift: any [] = [];
   columsCollapseCaoLift: any [] = [];

   columnsResultCaoItem: any [] = [];
   columsCollapseCaoItem: any [] = [];

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
   dataReadyCaoLift = false;
   dataReadyCaoItem = false;
   // Selected element
   selectedElementCaoLift;
   selectedElementCaoItem;

  constructor(private _caoService: CaoService) {
    this.columsCollapseCaoLift = [
      {header: 'Snap', colspan: 1, expand: 0, colspan_original: 1},
      {header: 'Location', colspan: 2, expand: 1, colspan_original: 2},
      {header: 'Merchandise hierarchy', colspan: 8, expand: -1, colspan_original: 8},
      {header: 'Item', colspan: 2, expand: 1, colspan_original: 2},
      {header: 'Supplier', colspan: 2, expand: 1, colspan_original: 2},
      {header: 'CGO mode', colspan: 1, expand: 0, colspan_original: 1},
      {header: 'Duration', colspan: 3, expand: 1, colspan_original: 3},
      {header: '', colspan: 1, expand: 0, colspan_original: 1},
      {header: '', colspan: 1, expand: 0, colspan_original: 1},
      {header: '', colspan: 1, expand: 0, colspan_original: 1},
      {header: '', colspan: 1, expand: 0, colspan_original: 1},
      {header: '', colspan: 1, expand: 0, colspan_original: 1}
    ];

    this.columnsResultCaoLift = [
      { field: 'IMAGE_DATE', header: 'Snapshot date', expand: 0, display: true, main: true},
      /** **/
      { field: 'SOCSITE', header: 'Store #' , expand: 1, display: true, main: true},
      { field: 'SOCLMAG', header: 'Store desc.', expand: 0, display: true, main: false},
      /** **/
      { field: 'DEPT_ID', header: 'Dept id.', expand: -1, display: true, main: false},
      { field: 'DEPT_DESC', header: 'Dept Desc.', expand: 0, display: true, main: false},
      { field: 'SDEPT_ID', header: 'Sub-Dept id.', expand: 0, display: true, main: false},
      { field: 'SDEPT_DESC', header: 'Sub-Dep Desc.', expand: 0, display: true, main: false},
      { field: 'CAT_ID', header: 'Cat id.', expand: 0, display: true, main: false},
      { field: 'CAT_DESC', header: 'Cat Desc.', expand: 0, display: true, main: true},
      { field: 'SCAT_ID', header: 'Sub-Cat id.', expand: 0, display: true, main: false},
      { field: 'SCAT_DESC', header: 'Sub-Cat Desc.', expand: 0, display: true, main: false},
      /** **/
      { field: 'ITEM_ID', header: 'Item #', expand: 1, display: true, main: true},
      { field: 'ITEM_DESC', header: 'Item Desc.', expand: 0, display: true, main: false},
      /** **/
      { field: 'VENDOR_ID', header: 'Vendor #', expand: 1, display: true, main: true},
      { field: 'VENDOR_DESC', header: 'Vendor Desc.', expand: 0, display: true, main: false},
      /** **/
      { field: 'CGOMODE', header: 'CGO mode', expand: 0, display: true, main: true},
      /** **/
      { field: 'RPANBSEM', header: 'Nb. weeks', expand: 1, display: true, main: true},
      { field: 'RPADDEB', header: 'Start', expand: 0, display: true, main: false},
      { field: 'RPADFIN', header: 'End', expand: 0, display: true, main: false},
      /** **/
      { field: 'RPALEVIERC', header: 'Leverage HQ', expand: 0, display: true, main: true},
      /** **/
      { field: 'RPALEVIERM', header: 'Leverage Store', expand: 0, display: true, main: true},
      /** **/
      { field: 'RPACOEF', header: 'Std variance Coef.', expand: 0, display: true, main: true},
      /** **/
      { field: 'LASTUPDATE', header: 'Last update', expand: 0, display: true, main: true},
      { field: 'RPAUTIL', header: 'Last user', expand: 0, display: true, main: true}
    ];


    this.columsCollapseCaoItem = [
      {header: 'Snap', colspan: 1, expand: 0, colspan_original: 1},
      {header: 'Location', colspan: 2, expand: 1, colspan_original: 2},
      {header: 'Merchandise hierarchy', colspan: 8, expand: -1, colspan_original: 8},
      {header: 'Item', colspan: 2, expand: 1, colspan_original: 2},
      {header: 'Supplier', colspan: 2, expand: 1, colspan_original: 2},
      {header: '', colspan: 1, expand: 0, colspan_original: 1},
      {header: '', colspan: 1, expand: 0, colspan_original: 1},
      {header: '', colspan: 1, expand: 0, colspan_original: 1},
      {header: '', colspan: 1, expand: 0, colspan_original: 1},
      {header: '', colspan: 1, expand: 0, colspan_original: 1},
      {header: '', colspan: 1, expand: 0, colspan_original: 1},
      {header: '', colspan: 1, expand: 0, colspan_original: 1},
      {header: '', colspan: 1, expand: 0, colspan_original: 1},
      {header: '', colspan: 1, expand: 0, colspan_original: 1}
    ];

    this.columnsResultCaoItem = [
      { field: 'IMAGE_DATE', header: 'Snapshot date', expand: 0, display: true, main: true},
      /** **/
      { field: 'SOCSITE', header: 'Store #' , expand: 1, display: true, main: true},
      { field: 'SOCLMAG', header: 'Store desc.', expand: 0, display: true, main: false},
      /** **/
      { field: 'DEPT_ID', header: 'Dept id.', expand: -1, display: true, main: false},
      { field: 'DEPT_DESC', header: 'Dept Desc.', expand: 0, display: true, main: false},
      { field: 'SDEPT_ID', header: 'Sub-Dept id.', expand: 0, display: true, main: false},
      { field: 'SDEPT_DESC', header: 'Sub-Dep Desc.', expand: 0, display: true, main: false},
      { field: 'CAT_ID', header: 'Cat id.', expand: 0, display: true, main: false},
      { field: 'CAT_DESC', header: 'Cat Desc.', expand: 0, display: true, main: true},
      { field: 'SCAT_ID', header: 'Sub-Cat id.', expand: 0, display: true, main: false},
      { field: 'SCAT_DESC', header: 'Sub-Cat Desc.', expand: 0, display: true, main: false},
      /** **/
      { field: 'ITEM_ID', header: 'Item #', expand: 1, display: true, main: true},
      { field: 'ITEM_DESC', header: 'Item Desc.', expand: 0, display: true, main: false},
      /** **/
      { field: 'VENDOR_ID', header: 'Vendor #', expand: 1, display: true, main: true},
      { field: 'VENDOR_DESC', header: 'Vendor Desc.', expand: 0, display: true, main: false},
      /** **/
      { field: 'CGOMODE', header: 'CGO mode', expand: 0, display: true, main: true},
      /** **/
      { field: 'AREQMAX', header: 'Max Qty', expand: 0, display: true, main: true},
      /** **/
      { field: 'AREQTEC', header: 'Qty', expand: 0, display: true, main: true},
      /** **/
      { field: 'ARECOEFFS', header: 'Safety Stock', expand: 0, display: true, main: true},
      /** **/
      { field: 'ARESECU', header: 'Security Stock', expand: 0, display: true, main: true},
      /** **/
      { field: 'ARESTPR', header: 'Presentation Stock', expand: 0, display: true, main: true},
      /** **/
      { field: 'ARESTPRC', header: 'Pres. Stock HQ', expand: 0, display: true, main: true},
      /** **/
      { field: 'LASTUPDATE', header: 'Last update', expand: 0, display: true, main: true},
      { field: 'AREUTIL', header: 'Last user', expand: 0, display: true, main: true}
    ];

    for (let i=0; i < this.columsCollapseCaoLift.length; i++) {
      this.expandColumnCaoLift(i); 
    }

    for (let i=0; i < this.columsCollapseCaoItem.length; i++) {
      this.expandColumnCaoItem(i); 
    }
    this.razSearch();
  }

  search(mode: any) {
    //this.searchCode = searchCode;
    let datePipe = new DatePipe('en-US');
    this.msgs.push({severity:'info', summary:'Info Message', detail: 'Looking for store CGO config.'});    
    this._caoService.getCaoConfigLift(this.locationCode,mode)
            .subscribe( 
                data => { 
                    this.searchResultCaoLift = data; // put the data returned from the server in our variable
                    this.dataReadyCaoLift = true;
                },
                error => {
                      console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                      this.msgs.push({severity:'error', summary:'ERROR Message', detail: error });
                },
                () => {this.msgs.push({severity:'warn', summary:'Info Message', detail: 'Retrieved ' + 
                                     this.searchResultCaoLift.length + ' reference(s).'});
                }
            );

    this._caoService.getCaoConfigItem(this.locationCode,mode)
    .subscribe( 
        data => { 
            this.searchResultCaoItem = data; // put the data returned from the server in our variable
            this.dataReadyCaoItem = true;
        },
        error => {
              console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
              this.msgs.push({severity:'error', summary:'ERROR Message', detail: error });
        },
        () => {this.msgs.push({severity:'warn', summary:'Info Message', detail: 'Retrieved ' + 
                             this.searchResultCaoItem.length + ' reference(s).'});
        }
    );
  }

  razSearch () {
    this.searchResultCaoLift = [];
    this.searchResultCaoItem = [];
  }

  handleRowSelect(event) {
    // Gather the others data for item selected.
    let datePipe = new DatePipe('en-US');
    this.msgs.push({severity:'info', summary:'Info Message', detail: 'Gathering CGO additional information ' + event.data.site});
 
    //this.checkAlert(this.selectedElement, this.search_STEP2_Result, this.search_STEP3_Result, 
    //                datePipe.transform(event.data.inventorydate, 'MM/dd/yyyy'), event.data.site);
    this.msgs.push({severity:'warn', summary:'Info Message', detail: 'Item CGO data retrieved'});
  }

  expandColumnCaoLift(indice: number) {
    this.columsCollapseCaoLift[indice].expand = this.columsCollapseCaoLift[indice].expand * -1;
    let j = 0;
    for(let i = 0; i < this.columsCollapseCaoLift.length; i++) {
      if(i === indice) {
        if(this.columsCollapseCaoLift[indice].expand === -1) {
          this.columsCollapseCaoLift[indice].colspan = this.columsCollapseCaoLift[indice].colspan_original;
        }
        else {
          this.columsCollapseCaoLift[indice].colspan = 1;
        }
        for(let k=j; k < this.columsCollapseCaoLift[indice].colspan_original+j; k++) {
          if (this.columnsResultCaoLift[k].main === false) {
            if (this.columsCollapseCaoLift[indice].expand === -1) {
              this.columnsResultCaoLift[k].display = true;
            }
            if (this.columsCollapseCaoLift[indice].expand === 1) {
              this.columnsResultCaoLift[k].display = false;
            }
          }
        }
      }
      else {
        j = j + this.columsCollapseCaoLift[i].colspan_original;
      }
    }
  }


  expandColumnCaoItem(indice: number) {
    this.columsCollapseCaoItem[indice].expand = this.columsCollapseCaoItem[indice].expand * -1;
    let j = 0;
    for(let i = 0; i < this.columsCollapseCaoItem.length; i++) {
      if(i === indice) {
        if(this.columsCollapseCaoItem[indice].expand === -1) {
          this.columsCollapseCaoItem[indice].colspan = this.columsCollapseCaoItem[indice].colspan_original;
        }
        else {
          this.columsCollapseCaoItem[indice].colspan = 1;
        }
        for(let k=j; k < this.columsCollapseCaoItem[indice].colspan_original+j; k++) {
          if (this.columnsResultCaoItem[k].main === false) {
            if (this.columsCollapseCaoItem[indice].expand === -1) {
              this.columnsResultCaoItem[k].display = true;
            }
            if (this.columsCollapseCaoItem[indice].expand === 1) {
              this.columnsResultCaoItem[k].display = false;
            }
          }
        }
      }
      else {
        j = j + this.columsCollapseCaoItem[i].colspan_original;
      }
    }
  }

}

