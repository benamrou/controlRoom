import {Component, ViewEncapsulation, ViewChild, Input} from '@angular/core';
import {  WidgetService, ProcessService, TreeDragDropService, FinanceService } from '../../../shared/services';
import { Dialog, SelectItem, Chips, Message, DataGrid, FullCalendar, TreeNode, Tree } from '../../../shared/components';
import { MessageService } from '../../../shared/components';
import {DatePipe} from '@angular/common';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/toPromise';
import { PresetCAOComponent } from './preset/presetcao.component';

/**
 * 
 * @author Ahmed Benamrouche
 * 
 */

@Component({
	  moduleId: module.id,
    selector: 'ediinvoice',
    templateUrl: './ediinvoice.component.html',
    providers: [ WidgetService, ProcessService, FinanceService, MessageService, TreeDragDropService],
    styleUrls: ['./ediinvoice.component.scss', '../../../app.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class EDIInvoiceComponent {

  @ViewChild(PresetCAOComponent) presetCAO;
  @ViewChild('fc') fc: FullCalendar;
  @ViewChild('expandingTree')
  expandingTree: Tree;

   columnOptions: SelectItem[];
   trackIndex: number = 0;

  // Search result 
  searchResult : any [] = [];
  selectedElement: any;
  columnsResult: any [] = [];
  columsCollapseResult: any [] = [];

  // Search Panel
  searchVendorCode: string = '';
  searchStatus: string = '';
  searchSiteCode: string = '';
  searchAgeCode: string = '';

  columnsMyRepository: any [] = [];

  datePipe: DatePipe;
  dateNow: Date;
  dateTomorrow: Date;

  myRepository: TreeNode[] = [];
  selection: TreeNode;
  selectedNode: TreeNode;
  batchTobeAdded: any [] = [];

  addAllButtonStatus: string;

  filterOn: boolean = false;

  // Search action
   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries
   
   displayUpdateCompleted: boolean = false;
   msgDisplayed: String;
 
  msgs: Message[] = [];

  constructor( private _messageService: MessageService, private _processService: ProcessService, private _financeService: FinanceService) {
    this.datePipe     = new DatePipe('en-US');
    this.dateNow = new Date();
    this.dateTomorrow =  new Date(this.dateNow.setDate(this.dateNow.getDate() + 1));

    this.columsCollapseResult = [
      {header: 'Location', colspan: 1, expand: 0, colspan_original: 1},
      {header: 'Merchandise hierarchy', colspan: 8, expand: -1, colspan_original: 8},
      {header: 'Supplier', colspan: 2, expand: 1, colspan_original: 2},
      {header: 'Item', colspan: 3, expand: 1, colspan_original: 3},
      {header: '', colspan: 1, expand: 0, colspan_original: 1},
      {header: '', colspan: 1, expand: 0, colspan_original: 1},
      {header: '', colspan: 1, expand: 0, colspan_original: 1},
      {header: '', colspan: 1, expand: 0, colspan_original: 1}
    ];

    this.columnsResult = [
      /** **/
      { field: 'STORE_NUM', header: 'Store #' , expand: 0, display: true, main: true},
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
      { field: 'VENDOR_ID', header: 'Vendor #', expand: 1, display: true, main: true},
      { field: 'VENDOR_DESC', header: 'Vendor Desc.', expand: 0, display: true, main: false},
      /** **/
      { field: 'ITEM_ID', header: 'Item #', expand: 1, display: true, main: true},
      { field: 'SV', header: 'SV #', expand: 0, display: true, main: false},
      { field: 'ITEM_DESC', header: 'Item Desc.', expand: 0, display: true, main: false},
      /** **/
      { field: 'BARCODE', header: 'Barcode', expand: 0, display: true, main: true},
      /** **/
      { field: 'LAST_SALE', header: 'Last Sale', expand: 0, display: true, main: true},
      /** **/
      { field: 'PRES_STOCK', header: 'Pres. Stock', expand: 0, display: true, main: true},
      /** **/
      { field: 'STATUS', header: 'Action', expand: 0, display: true, main: true}
    ];


    for (let i=0; i < this.columsCollapseResult.length; i++) {
      this.expandColumnCaoMissing(i); 
    }

    //this.presetCAO = new PresetCAOComponent(_messageService, _processService);

    this.displayUpdateCompleted = false;

  }

  /**
   * function onRowSelect (Evemt on schedule se4lection) 
   * When User selects a supplier schedule, this function copies the schedule to potential temporary schedule.
   * @param event 
   */
  onRowSelect(event) {
    
  }

  search() {
    //this.searchCode = searchCode;
    //console.log('Looking for item code : ' + this.searchJobCode + ' - Picking Unit : ' + this.selectedPU);
    this.razSearch();
    let vendorSearch, siteSearch, age, statusSearch;
    this._messageService.add({severity:'info', summary:'Info Message', detail: 'Looking for CAO missing.'});
    if (this.searchVendorCode === '') { vendorSearch = '-1'; }
    else { vendorSearch = this.searchVendorCode; }
    if (this.searchSiteCode === '0' || this.searchSiteCode === '') { siteSearch = -1; }
    else { siteSearch = Number(this.searchSiteCode) }
    if (this.searchAgeCode === '') { age = 30; }
    else { age = Number(this.searchAgeCode) }
    if (this.searchStatus === '') { statusSearch = '-1'; }
    else { statusSearch = this.searchStatus; }

    this._financeService.getEDIInvoiceStatus(vendorSearch, statusSearch, age)
            .subscribe( 
                data => { this.searchResult = data; // put the data returned from the server in our variable
                },
                error => {
                      // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                      this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                },
                () => {this._messageService.add({severity:'warn', summary:'Info Message', detail: 'Retrieved ' + 
                                     this.searchResult.length + ' reference(s).'});

                       console.log(JSON.stringify(this.searchResult));  
                }
            );
  }

  razSearch () {
    this.searchResult = [];
    this.selectedElement = null;
  }


  /**
   * One time job execution with the given parameters
   * @param jobId 
   * @param params 
   */
  update(index: number, jobId: string, params: string){
    this.searchResult[index].STATUS='INPROGRESS';
    //console.log('Executing...');
  }


  expandColumnCaoMissing(indice: number) {
    //console.log ('expandColumnCaoMissing : ' + indice);
    this.columsCollapseResult[indice].expand = this.columsCollapseResult[indice].expand * -1;
    let j = 0;
    for(let i = 0; i < this.columsCollapseResult.length; i++) {
      if(i === indice) {
        if(this.columsCollapseResult[indice].expand === -1) {
          this.columsCollapseResult[indice].colspan = this.columsCollapseResult[indice].colspan_original;
        }
        else {
          this.columsCollapseResult[indice].colspan = 1;
        }
        for(let k=j; k < this.columsCollapseResult[indice].colspan_original+j; k++) {
          if (this.columnsResult[k].main === false) {
            if (this.columsCollapseResult[indice].expand === -1) {
              this.columnsResult[k].display = true;
            }
            if (this.columsCollapseResult[indice].expand === 1) {
              this.columnsResult[k].display = false;
            }
          }
        }
      }
      else {
        j = j + this.columsCollapseResult[i].colspan_original;
      }
    }
    //console.log('Structure ', this.columnsResult, this.columsCollapseResult);
  }


  updateCaoParam(STORE_NUM, ITEM_ID, SV, LV, PRES_STOCK) {
    let index;
    for (let i = 0; i < this.searchResult.length; i++) {
      if (this.searchResult[i].STORE_NUM === STORE_NUM &&
          this.searchResult[i].ITEM_ID === ITEM_ID &&
          this.searchResult[i].SV === SV &&
          this.searchResult[i].LV === LV &&
          this.searchResult[i].PRES_STOCK === PRES_STOCK) {
            index = i;
            break;
          }
    }
    console.log ('updateCaoParam ', index);
    
    this.searchResult[index].STATUS='INPROGRESS';
  }


}