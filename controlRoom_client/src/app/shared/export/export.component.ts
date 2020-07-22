import { Component, Output, EventEmitter } from '@angular/core';
import { ViewEncapsulation, Input, OnChanges,} from '@angular/core';

import { QueryService, UserService, WidgetService, StructureService } from '../services';

import { Message } from '../components';

import {NgModule } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { delay } from 'rxjs/operators';

@Component({
	moduleId: module.id,
    selector: 'export-cmp',
    templateUrl: './export.component.html',
    providers: [QueryService, WidgetService, UserService, StructureService],
    styleUrls: ['./export.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class ExportComponent implements OnChanges {

    //@ViewChild('fc') fc: FullCalendar;
    @Input() selectedStructure;  
    @Input() selectedNetwork;  
    @Input() selectedFlow; 
    @Input() disabledButton;

    @Output() clickRefresh = new EventEmitter();
    @Output() initCompleted = new EventEmitter();

    network;
    structure;
    flow;

    networkDataReady = false;
    structureDataReady = false;
    public flowDataReady = false;

    flatSelectedNetworkID = []; // contains the selected netork ID
    flatSelectedStructureID = []; // contains the selected structure ID
    flatSelectedFlowID = []; // contains the selected flow ID

    
    dataNetwork;
    dataStructure;
    dataFlow;

    
    msgs: Message[] = [];


    constructor(private _queryService: QueryService, 
                private _structureService: StructureService) {

    }
    
    ngOnInit()  { 
        this.initializeData();
    }

    ngAfterViewInit () {
        
    }

    ngOnChanges() {
    }

    initializeData() {
        //console.log('Received network : ',this.network, this.structure);

        this.flow = [ { "data":0,
            "NODE_ID":0,
            "LABEL":"DISTRIBUTION FLOW",
            "PARENT_ID": null,
            "children":[ {"data":1,
                            "NODE_ID":3,
                            "LABEL":"WAREHOUSE",
                            "PARENT_ID": 0,
                            "children":[ ] },
                            {"data":2,
                            "NODE_ID":1,
                            "LABEL":"DIRECT DELIVERY",
                            "children":[ ] }
                        ]
        }];
        //await new Observable( observer => {
        this._structureService.getNetwork().subscribe(
            data =>  {
                this.network = data;
                this.networkDataReady = true;
                //this.selectedNetwork.push(this.network.data[0]);
                //console.log('Received network : ' + JSON.stringify(this.network));
            }
        );

        this._structureService.getStructure().subscribe(
            data =>  {
                this.structure = data;
                //this.selectedNetwork.push(this.network.data[0]);
                //console.log('Received structure : ' + JSON.stringify(this.structure));
                this.structureDataReady = true;
                this.flowDataReady = true;
                this.initCompleted.emit();
            }
        );
            
        
    }


    refresh() {
        // Event clickedRefresh already shared through html directive attribute
        this.disabledButton = true;
    }

    nodeSelect(flatData, e) {
        //console.log('nodeSelect :', e);
        let indice = flatData.indexOf(e.node.NODE_ID)
        if (indice === -1 ) {
            flatData.push(e.node.NODE_ID);
        }
        for (let i =0; i < e.node.children.length; i++) {
            this.nodeSelect(flatData, { node: e.node.children[i]});
        }
        //this.ngOnChanges();
        this.disabledButton = false;
    }

    nodeUnSelect(flatData, e) {
        //console.log('nodeUnSelect :', e);
        let indice = flatData.indexOf(e.node.NODE_ID)
        if (indice > -1 ) {
            flatData.splice(indice, 1);
        }
        for (let i =0; i < e.node.children.length; i++) {
            this.nodeUnSelect(flatData, { node: e.node.children[i]});
        }
        //this.ngOnChanges();
        this.disabledButton = false;
    }

    public setSelectedNetwork(nodeID) {
        this.setSelected(this.selectedNetwork, this.flatSelectedNetworkID, this.network.data[0], nodeID);
    }

    public setSelectedStructure(nodeID) {
        this.setSelected(this.selectedStructure, this.flatSelectedStructureID, this.structure.data[0], nodeID);
    }

    public setSelectedFlow(nodeID) {
        this.setSelected(this.selectedFlow, this.flatSelectedFlowID, this.flow[0], nodeID);
    }

    public setSelected(masterNode, flatSelection, node, nodeID) {
        //console.log('setSelected : ', nodeID, node);
        if (node.children.length ===0 && node.NODE_ID === nodeID) {
            if(flatSelection.indexOf(node.NODE_ID) === -1)  {
                flatSelection.push(node.NODE_ID);
                masterNode.push(node);
            }
            return true;
        }
        for (let i =0; i < node.children.length; i ++) {
            if(node.NODE_ID === nodeID){
                masterNode.push(node);
                return true;
            }
            if (this.setSelected(masterNode, flatSelection, node.children[i], nodeID)) {
                if(flatSelection.indexOf(node.NODE_ID) === -1)  {
                    flatSelection.push(node.NODE_ID);
                    masterNode.push(node);
                }
                return true;
            }
        }
        return false;
    }
}
