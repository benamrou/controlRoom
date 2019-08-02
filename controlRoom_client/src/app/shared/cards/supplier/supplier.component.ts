import { Component } from '@angular/core';
import { ViewEncapsulation, Input, OnChanges } from '@angular/core';
import { SelectItem, Chips, Message, Schedule } from '../../components/index';
import { ItemService, Item, Purchasing, Pricing, Retail, Substitution, Inventory } from '../../services/index';
import {NgModule } from '@angular/core';
import {} from 'fullcalendar';


@Component({
	moduleId: module.id,
    selector: 'supplier-cmp',
    templateUrl: './supplier.component.html',
    providers: [ItemService],
    styleUrls: ['./supplier.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class SupplierComponent implements OnChanges {

    //itemInternalCode\
    @Input() itemInternalCode: string;

    // Item information
    itemInfos: Item;
    // Purchasing information
    itemPurchasingInfos: Purchasing;
    // Retail information
    itemRetailInfos: Pricing;
    // Substitution information
    itemSubstitutionInfos: Substitution;
    // Inventory information
    itemInventoryInfos: Inventory;
    
    msgs: Message[] = [];

    // Retail information
    headersRetail: any;
    retailSelected: Retail;
    dialogRetailVisible: boolean = false;


    // Subtitution information
    resultSubstitution: any[] = [];
    columnsSubstitution: any[] = [];

    // Inventory information
    resultInventory: any[] = [];
    columnsInventory: any[] = [];

    // Color Legend
    inactiveColor: string = '#DCDCDC'; // light gray
    activeColor: string = 'white';
    mainColor: string = '#87CEFA'; // light brown

    promoColor: string;
    regularColor: string;

    constructor(private _itemService: ItemService) {
        this.itemInfos = new Item();
        this.itemPurchasingInfos =new Purchasing();
        this.itemRetailInfos =new Pricing();
        this.itemSubstitutionInfos =new Substitution();
        this.itemInventoryInfos =new Inventory();
    
        this.headersRetail = {
			left: 'prev,next today',
			center: 'title',
			right: '' 
		};

        this.columnsSubstitution = [
          { field: 'site', header: 'Site' },
          { field: 'rank', header: 'Rank' },
          { field: 'fullcode', header: 'Replaced item' },
          { field: 'itemdescription', header: 'Desc.' },
          { field: 'fullbycode', header: 'Replacing by' },
          { field: 'itembydescription', header: 'Desc' },
          { field: 'typedescription', header: 'Replacement type' },
          { field: 'coefficient', header: 'Coefficient' }
        ];
       
        this.columnsInventory = [
          { field: 'fullsite', header: 'Site', style: 'text-align : right' },
          { field: 'fulldescription', header: 'Item/LV description' },
          { field: 'inventory', header: 'On-Hand Central', style: 'text-align : right' },
          { field: 'stock', header: 'On-Hand Stock', style: 'text-align : right' },
          { field: 'onorder', header: 'To-be delivered', style: 'text-align : right' },
          { field: 'blocked', header: 'Blocked', style: 'text-align : right' }
        ];
    }

    /**
     * 
     * @param itemInternalCode 
     */
    retrieveItemDataUsingInternalCode(itemCode: string) {
        this.razData();
        // Fetch data using the Service to retrieve item data
        this._itemService.getItemInfo(itemCode)
                .subscribe( 
                    data => {this.itemInfos = data;
                        console.log('Getting itemInfos fresh data: ' + JSON.stringify(this.itemInfos));
                    }, // put the data returned from the server in our variable
                    error => {
                          console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                          this.msgs.push({severity:'error', summary:'ERROR Message', detail: error });
                    },
                    //() => console.log('Job done')           
                );

        this._itemService.getPurchaseItemInfo(itemCode)
                .subscribe( 
                    data => {this.itemPurchasingInfos = data;
                        console.log('Getting itemPurchasingInfos fresh data: ' + JSON.stringify(this.itemPurchasingInfos));
                    }, // put the data returned from the server in our variable
                    error => {// in case of failure show this message
                        this.msgs.push({severity:'error', summary:'Error Message', detail: 'Retrieving data ' + 
                                        JSON.stringify(error)});
                    }
                    //() => console.log('Job done')           
                );

        this._itemService.getRetailItemInfo(itemCode)
                .subscribe( 
                    data => {this.itemRetailInfos = data;
                        console.log('Getting itemRetailInfos fresh data: ' + JSON.stringify(this.itemRetailInfos));
                    }, // put the data returned from the server in our variable
                    error => {// in case of failure show this message
                        this.msgs.push({severity:'error', summary:'Error Message', detail: 'Retrieving data ' + 
                                        JSON.stringify(error)});
                    }
                    //() => console.log('Job done')           
                );
        this.promoColor = this._itemService.getRetailPromoColor();
        this.regularColor = this._itemService.getRetailPermanentColor();

        this._itemService.getSubstitutionItemInfo(itemCode)
                .subscribe( 
                    data => {this.itemSubstitutionInfos = data;
                        console.log('Getting itemSubstitutionInfos fresh data: ' + JSON.stringify(this.itemSubstitutionInfos));
                    }, // put the data returned from the server in our variable
                    error => {
                          console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                          this.msgs.push({severity:'error', summary:'ERROR Message', detail: error });
                    },
                    //() => console.log('Job done')           
                );

        this._itemService.getInventoryItemInfo(itemCode)
                .subscribe( 
                    data => {this.itemInventoryInfos = data;
                        console.log('Getting itemInventoryInfos fresh data: ' + JSON.stringify(this.itemSubstitutionInfos));
                    }, // put the data returned from the server in our variable
                    error => {
                          console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                          this.msgs.push({severity:'error', summary:'ERROR Message', detail: error });
                    },
                    //() => console.log('Job done')           
                );
    }

    getStatusColor(status : any, main: any) {
        if (main === 1) return this.mainColor;
        if (status === 0 || status === 2) return this.inactiveColor;
        return this.activeColor;
    }

    handleRetailClick(e) {
        console.log('Retail click');
        this.retailSelected = new Retail();
        this.retailSelected.id = e.calEvent.id;
        this.retailSelected.pricelist = this.itemRetailInfos.retails[e.calEvent.id].pricelist;
        this.retailSelected.pricelistdescription = this.itemRetailInfos.retails[e.calEvent.id].pricelistdescription;
        this.retailSelected.priority = this.itemRetailInfos.retails[e.calEvent.id].priority;
        this.retailSelected.itemfulldescription = this.itemRetailInfos.retails[e.calEvent.id].itemfulldescription;
        
        let start = e.calEvent.start;
        let end = e.calEvent.end;
        /*if(e.view.name === 'month') {
            start.stripTime();
        }*/
        
        if(end) {
            //end.stripTime();
            this.retailSelected.end = end.format();
        }

        this.retailSelected.retail = e.calEvent.retail;
        this.retailSelected.multi = e.calEvent.multi;
        this.retailSelected.priority = e.calEvent.priority;
        this.retailSelected.start = start.format();
        this.dialogRetailVisible = true;
    }

    closeRetail() {
        this.dialogRetailVisible = false;
    }

    itemLookUp(itemCode) {
        // Retrieve all the data for the item
    }

    ngOnChanges(changes:any):void {
        this.retrieveItemDataUsingInternalCode(this.itemInternalCode);
    }

    razData() {
        this.itemInfos = new Item();
        this.itemPurchasingInfos = new Purchasing();
        this.itemRetailInfos = new Pricing();
        this.itemSubstitutionInfos = new Substitution();
        this.itemInventoryInfos = new Inventory();
    }
}