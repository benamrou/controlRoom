import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ExportService }from '../../../shared/services';
import { QueryService } from '../../../shared/services';
import { ProcessService } from '../../../shared/services';
import { UserService } from '../../../shared/services';

import { ConfirmEventType, ConfirmationService, Message, MessageService } from 'primeng/api';
import { FormControl, FormGroup, Validators } from '@angular/forms';


@Component({
	moduleId: module.id,
    selector: 'SpaceItemDimReporting-cmp',
    templateUrl: './space.item.dimension.reporting.component.html',
    providers: [MessageService, ExportService, QueryService, ProcessService],
    styleUrls: ['./space.item.dimension.reporting.component.scss'],
    encapsulation: ViewEncapsulation.None
})


export class SpaceItemDimReportingComponent {
  
   msgs: Message[] = [];
   msgDisplayed: string;
   displayProcessCompleted: boolean;
   displayNewVendor: boolean;
   values: string [] = [];
   //msgs: Message[] = [];

   searchResultOriginal : any [] = [];
   searchResult : any [] = [];
   searchResultMerchOriginal : any [] = [];
   searchResultMerch : any [] = [];
   resultValidate : any [] = [];
   selectedElement: any[] = [];
   columnsResult: any [] = [];
   columnsSchedule: any [] = [];
   activeValidateButton: boolean = false;

   screenID;
   waitMessage: string = '';


  // Search action
  searchCode: string = '';
  searchStoreCode: string = '';

  searchDept: any = [];
  searchSubDept: any = [];
  searchCat: any = [];
  searchSubCat: any = [];
  arraySearchCode;

  deptList: any[] = [];
  subDeptList: any[] = [];
  catList: any[] = [];
  subCatList: any[] = [];
  privateLabelOnly : boolean = true;
  activeFutureOnly : boolean = true;

  dateNow: Date;
  dateTomorrow : Date;

  queryMerchHierarchy='STR0000003'; /* Query to capture merchandise hierarchy */
  queryLookUp='SYN0000004'; /* Query to update data in item information */

  // Completion handler
  displayUpdateCompleted: boolean;
  displayError = '';


  newVendorForm = new FormGroup({
    newVendor_field: new FormControl('', [Validators.required, Validators.minLength(5)])
  });

  // Request subscription
  subscription: any[] = [];

  constructor(private _messageService: MessageService,
              private _queryService: QueryService,
              private _processService: ProcessService,
              private _userService: UserService,
              private _confrmation: ConfirmationService,
              private _exportService: ExportService,
              private _datePipe: DatePipe) {
    this.screenID =  'SCR0000000034';
    _datePipe     = new DatePipe('en-US');

    this.columnsResult = [ 
      { field: 'Item code', header: 'Item #', align:'left', display: true },
      { field: 'Item desc', header: 'Item desc', align:'left', display: true },
      { field: 'UPC', header: 'UPC', align:'center', display: true },
      { field: 'Since', header: 'Since', display: true },
      { field: 'Until', header: 'Until', display: true },
      { field: 'PRIVATE_LABEL', header: 'Private Label', display: true },
      { field: 'BRAND', header: 'Brand', display: true },
      { field: 'HEIGHT', header: 'Height', display: true },
      { field: 'WIDTH', header: 'Width', display: true },
      { field: 'DEPTH', header: 'Depth', display: true },
      { field: 'DIM_UNIT', header: 'Dim. unit', display: true },
      { field: 'WEIGHT', header: 'Weight', display: true },
      { field: 'WEIGHT_UNIT', header: 'Wght unit', display: true },
      { field: 'L5', header: 'L5', display: true },
      { field: 'L4', header: 'L4', display: true },
      { field: 'L3', header: 'L3', display: true },
      { field: 'L2', header: 'L2', display: true },
        { field: 'L1', header: 'L1', display: true }
      ];


    this.subscription.push(this._queryService.getQueryResult(this.queryMerchHierarchy, [])
    .subscribe( 
        data => {  
            this.searchResultMerch = data; 
            this.searchResultMerchOriginal = Object.assign([], this.searchResultMerch);
        }, // put the data returned from the server in our variable
        error => {
              // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
              this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
        },
        () => {
            this.deptList = this.searchResultMerch.filter(x => x.Level === 2);
            this.subDeptList = this.searchResultMerch.filter(x => x.Level === 3);
            this.catList = this.searchResultMerch.filter(x => x.Level === 4);
            this.subCatList = this.searchResultMerch.filter(x => x.Level === 5);

            
            this.searchResult = [];
            this.displayNewVendor = false;


        }));


  }

  search() {
    this.searchResult = [];
    let privateLabelSearch;
    let activeFutureSearch;
    this.searchResultOriginal = [];
    this._messageService.add({severity:'info', summary:'Info Message', sticky: true, closable: true, detail: 'Looking for the Item information...'});


    this.waitMessage = 'Looking for item information....<br>' +
                        '<br> The request is usually taking <b>between 1 to 3 minutes</b>';
                        

    if(this.privateLabelOnly) {privateLabelSearch = '1'} else { privateLabelSearch='-1'}
    if(this.activeFutureOnly) {activeFutureSearch = '1'} else { activeFutureSearch='-1'}
    if ((this.searchDept.length + this.searchSubCat.length + this.searchCat.length + this.searchSubDept.length) == 0) {
      this.searchDept.push({ "SOBCINT" : '-1'}) ;
    }
    for (let i=0; i < this.searchDept.length; i++){
      this.searchDept[i].privateLabel=privateLabelSearch;
      this.searchDept[i].activeFuture=activeFutureSearch;

    }
    for (let i=0; i < this.searchSubCat.length; i++){
      this.searchSubCat[i].privateLabel=privateLabelSearch;
      this.searchSubCat[i].activeFuture=activeFutureSearch;
    }
    for (let i=0; i < this.searchCat.length; i++){
      this.searchCat[i].privateLabel=privateLabelSearch;
      this.searchCat[i].activeFuture=activeFutureSearch;
    }
    for (let i=0; i < this.searchSubDept.length; i++){
      this.searchSubDept[i].privateLabel=privateLabelSearch;
      this.searchSubDept[i].activeFuture=activeFutureSearch;
    }
    console.log('Search:', this.searchSubDept, this.searchDept, this.searchSubCat, this.searchCat);
    this.subscription.push(this._queryService.postQueryResult(this.queryLookUp, [...this.searchDept, ...this.searchSubDept, ...this.searchCat, ...this.searchSubCat, ...privateLabelSearch])
            .subscribe( 
                data => {  
                    this.searchResult = data; 
                    this.searchResultOriginal = Object.assign([], this.searchResult);
                }, // put the data returned from the server in our variable
                error => {
                      // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                      this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                },
                () => {this._messageService.add({severity:'warn', summary:'Info Message', detail: 'Retrieved ' + 
                                     this.searchResult.length + ' reference(s).'});
                       this.waitMessage = '';
                }));

    }
    /**
   * function onRowSelect (Evemt on schedule se4lection) 
   * When User selects a supplier schedule, this function copies the schedule to potential temporary schedule.
   * @param event 
   */
    onRowSelect(event) {
        //this.processReviewSchedule = true;
      }

  

  exportExcelRecap() {
    let recapReport: any[] = [];
    this.searchResult
      .map(item => recapReport.push ({
        "Item code": item['Item code'],
        "Item desc": item['Item desc'],
        "UPC": item['UPC'],
        "Since": this._datePipe.transform(item["Since"], 'MM/dd/yy'),
        "Until": this._datePipe.transform(item["Until"], 'MM/dd/yy'),
        "Brand": item['BRAND'],
        "Private Label": item['PRIVATE_LABEL'],
        "Height": item['HEIGHT'],
        "Width": item['WIDTH'],
        "Depth": item['DEPTH'],
        "Dim. unit": item['DIM_UNIT'],
        "Weight": item['WEIGHT'],
        "Wgt. unit": item['WEIGHT_UNIT'],
        "L5": item["L5"],
        "L4": item["L4"],
        "L3": item["L3"],
        "L2": item["L2"],
        "L1": item["L1"]
      }));
   console.log ('Export :', this.searchResult,  recapReport);
    ;

    let formatXLS = {
      "conditionalRule": [
        {
          "easeRule": {
            "repeat": "1",
            "lineStart": "5",
            "columnStart": "A",
            "every": "1",
            "columnEnd": "A"
          },
          "style": {
            "alignment": {
              "horizontal": "center"
            }
          }
        },
        {
          "easeRule": {
            "repeat": "1",
            "lineStart": "5",
            "columnStart": "C",
            "every": "1",
            "columnEnd": "M"
          },
          "style": {
            "alignment": {
              "horizontal": "center"
            }
          }
        },
        {
          "easeRule": {
            "repeat": "1",
            "lineStart": "5",
            "columnStart": "E",
            "every": "1",
            "columnEnd": "G"
          },
          "style": {
            "alignment": {
              "horizontal": "center"
            }
          }
        }
      ]
    }

    let freezePanel = {"ALTFREEZECOLUMN" : 2, 
                        "ALTROWCOLUMN" : 4
                      }
    this._exportService.saveCSV(recapReport, null, null, null, "SYN000000004", "Space Planning - Item Information" ,
                                //this.recapButtonTooltip
                                '', formatXLS, true, 
                                freezePanel
                                );
  }

}