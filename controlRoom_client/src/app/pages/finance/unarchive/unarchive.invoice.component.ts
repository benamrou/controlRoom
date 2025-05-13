import { Component, ViewEncapsulation, ViewChild} from '@angular/core';
import { FinanceService } from 'src/app/shared/services';
import { DatePipe } from '@angular/common';
import { MessageService, SelectItem } from 'primeng/api';
import { Message } from 'primeng/api';
import { FullCalendar } from 'primeng/fullcalendar';

/**
 * 
 * @author Ahmed Benamrouche
 * 
 */
@Component({
    selector: 'unarchive.invoice',
    templateUrl: './unarchive.invoice.component.html',
    styleUrls: ['./unarchive.invoice.component.scss', '../../../../app.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class UnarchiveInvoiceComponent {
   
  @ViewChild('fc') fc!: FullCalendar;

   columnOptions!: SelectItem[];
   trackIndex: number = 0;

  // Search result 
  searchResult : any [] = [];
  selectedElement: any;
  columnsResult: any [] = [];
  columnsSchedule: any [] = [];

   // Search Panel
   searchVendor: string = '';
   searchInvoice: string = '';

   datePipe: DatePipe;
   dateNow: Date;
   dateTomorrow: Date;

   waitMessage;
   subscription: any[] = [];


  // Search action
   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries
   
   displayUpdateCompleted: boolean = false;
   msgDisplayed!: String;
 
  msgs: Message[] = [];
  screenID;
  okExit = false;

  constructor(private _financeService: FinanceService, private _messageService: MessageService) {
    this.datePipe     = new DatePipe('en-US');
    this.dateNow = new Date();
    this.dateTomorrow =  new Date(this.dateNow.setDate(this.dateNow.getDate() + 1));
    this.screenID =  'SCR0000000040';

    this.columnsResult = [
      { field:'X', header: 'Selection', placeholder: 'Selected', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field: 'INVOICE_NUMBER', header: 'Invoice #', align:'center' },
      { field: 'SUPPLIER_CODE', header: 'Supplier code', align:'left' },
      { field: 'SUPPLIER_DESC', header: 'Description', align:'left' },
      { field: 'CONTRACT', header: 'Commercial contract', align:'left' },
      { field: 'INVOICE_DATE', header: 'Invoice date', align:'center' },
      { field: 'RECEIPT_AMOUNT', header: 'Receipt amount', align:'center' },
      { field: 'INVOICE_AMOUNT', header: 'Invoice amount', align:'center' }
    ];

    this.displayUpdateCompleted = false;

  }

  /**
   * function onRowSelect (Evemt on schedule se4lection) 
   * When User selects a supplier schedule, this function copies the schedule to potential temporary schedule.
   * @param event 
   */
  onRowSelect(event: any) {
    
  }

  search() {
    //this.searchCode = searchCode;
    //console.log('Looking for item code : ' + this.searchVendor + ' - Picking Unit : ' + this.selectedPU);
    this.razSearch();
    let invoiceSearch,  supplierSearch;
    this._messageService.add({severity:'info', summary:'Info Message', detail: 'Looking for invoice information : ' + JSON.stringify(this.searchVendor)});
   
    if (! this.searchVendor) { supplierSearch = '-1' } else { supplierSearch=this.searchVendor}
    if (! this.searchInvoice) { invoiceSearch = '-1' } else { invoiceSearch=this.searchInvoice}

    //console.log('Looking for item code : ' + this.searchVendor + ' - Picking Unit : ' + pickingUnitSearch);
    this._financeService.getInvoice(supplierSearch, invoiceSearch)
            .subscribe( 
                data => { 
                  this.searchResult = data; // put the data returned from the server in our variable
                  console.log(JSON.stringify(this.searchResult));  
              },
                error => {
                      // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                      this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                },
                () => {this._messageService.add({severity:'warn', summary:'Info Message', detail: 'Retrieved ' + 
                                     this.searchResult.length + ' reference(s).'});
                      this.okExit=true;
                }
            );
  }

  razSearch () {
    this.searchResult = [];
    this.selectedElement = null;
  }


    validateChanges() {
      let invoiceToUnarchive = [];
      this.searchResult.filter(item => item["Selected"] == true)
                       .map(item => invoiceToUnarchive.push (item));
  
      this.waitMessage =  '<b>Unarchive invoice process is using taking less than a minute</b>';
                          
      this._messageService.add({severity:'info', summary:'Info Message', detail: 'Updating invoices...'});
      this.subscription.push(this._financeService.unarchiveInvoice(invoiceToUnarchive)
              .subscribe( 
                  data => {
                    //console.log('SSCC update: ', data);  
                    this.waitMessage = '';
                    this.msgDisplayed = 'All the selected invoices have been unarchived. Play safe, please review in GOLD the updated invoices.'
                    this.displayUpdateCompleted=true;
  
                },
                  error => {
                        // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                        this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                  },
                  () => {this._messageService.add({severity:'warn', summary:'Info Message', detail: 'Invoice unarchive process completed.'});
                        this.waitMessage = '';
                        this.okExit=true;
                  }
              ));
  
    }

    ngOnDestroy() {
      for(let i=0; i< this.subscription.length; i++) {
        this.subscription[i].unsubscribe();
      }
    }
  
}