import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ExportService, QueryService,  ProcessService, UserService } from 'src/app/shared/services';
import { ConfirmEventType, ConfirmationService, Message, MessageService } from 'primeng/api';
import { FormControl, FormGroup, Validators } from '@angular/forms';


@Component({
	moduleId: module.id,
    selector: 'ediasn-cmp',
    templateUrl: './edi.asn.component.html',
    providers: [MessageService, ExportService, QueryService, ProcessService],
    styleUrls: ['./edi.asn.component.scss'],
    encapsulation: ViewEncapsulation.None
})


export class EdiAsnComponent {
  
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
  newVendorCode: string = '';
  arraySearchCode;

  queryID='ASN0000002'; /* Query to collect data from hei_asn_dsd_vendor */
  queryIDupdate='ASN0000003'; /* Query to update data in hei_asn_dsd_vendor */
  queryNewVendor='ASN0000004'; /* Query to add a new vendor */

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
              private _datePipe: DatePipe) {
    this.screenID =  'SCR0000000027';
    this.columnsResult = [ 
        { field:'X', header: '', display: true },
        { field: 'FOUCNUF', header: 'Supplier code', display: true },
        { field: 'FOULIBL', header: 'Supplier desc.', display: true },
        { field: 'STORE_CODE', header: 'Store #', align:'center', display: true },
        { field: 'ASNENABLE', header: 'ASN Active', align:'center', display: true },
        { field: 'DUNS', header: 'DUNS #', display: true },
        { field: 'UPDATED', header: 'Updated', display: false },
      ];

      this.searchResult = [];
      this.displayNewVendor = false;

  }
  

  search() {
    this.searchResult = [];
    this.searchResultOriginal = [];
    this._messageService.add({severity:'info', summary:'Info Message', sticky: true, closable: true, detail: 'Looking for the ASN activation...'});

    let vendorCodeSearch, siteCodeSearch;
    let arraySearch = [];
    if (! this.searchCode) { vendorCodeSearch = '-1' }  else { vendorCodeSearch=this.searchCode }
    if (! this.searchStoreCode) { siteCodeSearch = '-1' }  else { siteCodeSearch=this.searchStoreCode }

    arraySearch.push(vendorCodeSearch);
    arraySearch.push(siteCodeSearch);
    this.subscription.push(this._queryService.getQueryResult(this.queryID, arraySearch)
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


    unselectAll() {
        for (let i=0; i < this.searchResult.length; i++) {
            this.searchResult[i]['X'] = 0;
        }
    }

    selectAll() {
      for (let i=0; i < this.searchResult.length; i++) {
          this.searchResult[i]['X'] = 1;
      }
    }

    updateStatus(status) {
      for(let i=0; i < this.searchResult.length; i++) {
        if (this.searchResult[i]['X'] == 1) {
          this.searchResult[i]['ASNENABLE'] = status;
          this.searchResult[i]['UPDATE'] = 1
        }
      }
    }

    validateChanges() {
    for(let i =0; i < this.searchResult.length; i++) {
      console.log('avant ASNENABLE', this.searchResult[i]['ASNENABLE']);
      if (this.searchResult[i]['ASNENABLE'] == true) {
        this.searchResult[i]['ASNENABLE']=1
      }
      if (this.searchResult[i]['ASNENABLE'] == false) {
        this.searchResult[i]['ASNENABLE']=0
      }
      console.log('apres ASNENABLE', this.searchResult[i]['ASNENABLE']);
    }
    this.subscription.push(this._queryService.postQueryResult(this.queryIDupdate, this.searchResult)
    .subscribe( 
        data => {  
            this.resultValidate = data; 
            this.searchResultOriginal = Object.assign([], this.searchResult);

            console.log('RESULT',this.searchResult);
            this.msgDisplayed = "Stores EDI ASN authorizations have been updated for those suppliers/stores."; 
            this.displayProcessCompleted =true;
        }, // put the data returned from the server in our variable
        error => {
        },
        async () => { 
                    //this._messageService.add({severity: 'info', summary: 'File Uploaded', detail: ''});
    }));
    }

    newVendorASN() {
      this.displayNewVendor = false;

    }

    addNewVendor(vendorCode) {
      let arraySearch = [];
      let newVendorInformation;
      this.displayError = '';
      arraySearch.push(vendorCode);
      this.subscription.push(this._queryService.getQueryResult(this.queryNewVendor, arraySearch)
      .subscribe( 
          data => {  
              newVendorInformation = data;
              console.log('new vendor:', data);
              //console.log('RESULT',this.searchResult);
          }, // put the data returned from the server in our variable
          error => {
                // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
          },
          () => {this._messageService.add({severity:'warn', summary:'Retrieving supplier information...', detail: 'Retrieved ' + 
                               this.searchResult.length + ' reference(s).'});
                 if (newVendorInformation[0]['X'] == -1) {
                    this.displayError = 'Vendor ' + vendorCode + ' is not found.'
                    this.displayNewVendor = true;
                 }
                 else {
                  if(newVendorInformation[0]['DUNS'] == null) {
                    this.displayError = 'This vendor ' + vendorCode + ' has no DUNS number associated'
                    this.displayNewVendor = true;
                  }
                  else {
                    let match = false;
                    this.displayNewVendor = false;
                    for (let i=0; i < newVendorInformation.length; i++) {
                      match = false;
                      for (let j=0; j < this.searchResult.length; j++) {
                        if (newVendorInformation[i].FOUCNUF==this.searchResult[j].FOUCNUF &&
                            newVendorInformation[i].STORE_CODE==this.searchResult[j].STORE_CODE) {
                              console.log('Match...',newVendorInformation[i], this.searchResult[j]);
                              match = true;
                         }
                       }
                        if(! match) {
                            this.searchResult = [...this.searchResult, ...[newVendorInformation[i]]];
                        }
                    }

                      console.log('this.searchResult:', this.searchResult);
                  }
                }
          }));
    }
  

}