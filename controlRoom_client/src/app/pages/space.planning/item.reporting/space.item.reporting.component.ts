import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ExportService, QueryService,  ProcessService, UserService } from 'src/app/shared/services';
import { ConfirmEventType, ConfirmationService, Message, MessageService } from 'primeng/api';
import { FormControl, FormGroup, Validators } from '@angular/forms';


@Component({
	moduleId: module.id,
    selector: 'SpaceItemReporting-cmp',
    templateUrl: './space.item.reporting.component.html',
    providers: [MessageService, ExportService, QueryService, ProcessService],
    styleUrls: ['./space.item.reporting.component.scss'],
    encapsulation: ViewEncapsulation.None
})


export class SpaceItemReportingComponent {
  
   msgs: Message[] = [];
   msgDisplayed: string;
   displayProcessCompleted: boolean;
   displayNewVendor: boolean;
   values: string [] = [];
   //msgs: Message[] = [];

   searchResultOriginal : any [] = [];
   searchResult : any [] = [];
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

  deptList = [];
  subDeptList = [];
  catList = [];
  subCatList = [];
  periodStart: string = '';
  periodEnd: string = '';

  dateNow: Date;
  dateTomorrow : Date;

  queryMerchHierarchy='STR0000003'; /* Query to capture merchandise hierarchy */
  queryLookUp='SYN0000003'; /* Query to update data in item new/discontinued */

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
    this.screenID =  'SCR0000000031';
    _datePipe     = new DatePipe('en-US');

    this.columnsResult = [ 
      { field: 'Criteria from', header: 'Criteria from', align:'center', display: true },
      { field: 'Criteria end', header: 'Criteria end', align:'center', display: true },
      { field: 'Item code', header: 'Item #', align:'left', display: true },
      { field: 'Item desc', header: 'Item desc', align:'left', display: true },
      { field: 'UPC', header: 'UPC', align:'center', display: true },
      { field: 'Status', header: 'Status', align:'center', display: true },
      { field: 'Since', header: 'Since', display: true },
      { field: 'L5', header: 'L5', display: true },
      { field: 'L4', header: 'L4', display: true },
      { field: 'L3', header: 'L3', display: true },
      { field: 'L2', header: 'L2', display: true },
        { field: 'L1', header: 'L1', display: true },
      ];


    this.subscription.push(this._queryService.getQueryResult(this.queryMerchHierarchy, [])
    .subscribe( 
        data => {  
            this.searchResult = data; 
            this.searchResultOriginal = Object.assign([], this.searchResult);
        }, // put the data returned from the server in our variable
        error => {
              // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
              this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
        },
        () => {
            this.deptList = this.searchResult.filter(x => x.Level === 2);
            this.subDeptList = this.searchResult.filter(x => x.Level === 3);
            this.catList = this.searchResult.filter(x => x.Level === 4);
            this.subCatList = this.searchResult.filter(x => x.Level === 5);

            
            this.searchResult = [];
            this.displayNewVendor = false;


        }));


  }

  search() {
    this.searchResult = [];
    this.searchResultOriginal = [];
    this._messageService.add({severity:'info', summary:'Info Message', sticky: true, closable: true, detail: 'Looking for the Item new/discontinued...'});

    console.log('Search:', this.searchSubDept, this.searchDept, this.searchSubCat, this.searchCat);


    this.waitMessage = 'Looking for the new and discontinued items....<br>' +
                        '<br> The request is usually taking <b>between 2 to 5 minutes</b>';

    this.searchDept.map((obj) => {
        obj.periodStart = this._datePipe.transform(this.periodStart, 'MM/dd/yyyy');
        obj.periodEnd = this._datePipe.transform(this.periodEnd, 'MM/dd/yyyy');
        return obj;
    });

    this.searchSubDept.map((obj) => {
      obj.periodStart = this._datePipe.transform(this.periodStart, 'MM/dd/yyyy');
      obj.periodEnd = this._datePipe.transform(this.periodEnd, 'MM/dd/yyyy');
      return obj;
    })

    this.searchCat.map((obj) => {
      obj.periodStart = this._datePipe.transform(this.periodStart, 'MM/dd/yyyy');
      obj.periodEnd = this._datePipe.transform(this.periodEnd, 'MM/dd/yyyy');
      return obj;
    })

    this.searchSubCat.map((obj) => {
      obj.periodStart = this._datePipe.transform(this.periodStart, 'MM/dd/yyyy');
      obj.periodEnd = this._datePipe.transform(this.periodEnd, 'MM/dd/yyyy');
      return obj;
    })


    this.subscription.push(this._queryService.postQueryResult(this.queryLookUp, [...this.searchDept, ...this.searchSubDept, ...this.searchCat, ...this.searchSubCat])
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
    let recapReport = [];
    this.searchResult
    .map(item => recapReport.push ({
      "Criteria from": item["Criteria from"],
      "Criteria end": item["Criteria end"],
      "Item code": item['Item code'],
      "Item desc": item['Item desc'],
      "UPC": item['UPC'],
      "Status": item['Status'],
      "Since": this._datePipe.transform(item["Since"], 'MM/dd/yy'),
      "L5": item["L5"],
      "L4": item["L4"],
      "L3": item["L3"],
      "L2": item["L2"],
      "L1": item["L1"]
    }))
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
            "columnEnd": "B"
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
        },
        {
          "easeRule": {
            "repeat": "1",
            "lineStart": "6",
            "columnStart": "F",
            "every": 1,
            "columnEnd": "F"
          },
          "rules": [
            {
              "ref": "",
              "rule": [
                {
                  "priority": "1",
                  "type": "containsText",
                  "operator": "containsText",
                  "text": "DISCONTINUED",
                  "style": {
                    "fill": {
                      "type": "pattern",
                      "pattern": "solid",
                      "bgColor": {
                        "argb": "fff44336"
                      }
                    }
                  }
                },
                {
                  "priority": "4",
                  "type": "containsText",
                  "operator": "containsText",
                  "text": "DISC. UPC",
                  "style": {
                    "fill": {
                      "type": "pattern",
                      "pattern": "solid",
                      "bgColor": {
                        "argb": "FFFCA33F"
                      }
                    }
                  }
                },
                {
                  "priority": "4",
                  "type": "containsText",
                  "operator": "containsText",
                  "text": "NEW",
                  "style": {
                    "fill": {
                      "type": "pattern",
                      "pattern": "solid",
                      "bgColor": {
                        "argb": "F3cff33F"
                      }
                    }
                  }
                }
              ]
            }
          ]
        }
      ]
    }

    let freezePanel = {"ALTFREEZECOLUMN" : 2, 
                        "ALTROWCOLUMN" : 4
                      }
    this._exportService.saveCSV(recapReport, null, null, null, "SYN000000003", "New/Discontinued items" ,
                                //this.recapButtonTooltip
                                '', formatXLS, true, 
                                freezePanel
                                );
  }

}