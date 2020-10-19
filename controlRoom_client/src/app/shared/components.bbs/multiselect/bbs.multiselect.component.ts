import {Component,Input,Output,EventEmitter, ViewEncapsulation} from '@angular/core';

@Component({
	moduleId: module.id,
    selector : 'bbs-multiselect',
    templateUrl :'./bbs.multiselect.component.html',
    styleUrls : ['./bbs.multiselect.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class MultiSelectDropdownComponent{
    @Input() options:any[]; 
    
    @Output() shareCheckedList = new EventEmitter();
    @Output() shareCheckedCodeList = new EventEmitter();
    @Output() shareIndividualCheckedList = new EventEmitter();
    
    showDropDown: boolean;
    checkedList : any[];
    checkedCodeList : any[];
    currentSelected : {};
    
    constructor(){
        this.checkedList = [];
        this.checkedCodeList = [];
    }

    getSelectedValue(status:Boolean,value:String, code: String){
        if(status){
          this.checkedList.push(value);  
          this.checkedCodeList.push(code);
        } else {
            var index = this.checkedList.indexOf(value);
            var index = this.checkedCodeList.indexOf(code);
            this.checkedList.splice(index,1);
            this.checkedCodeList.splice(index,1);
        }
        
        this.currentSelected = {checked : status, name:value};

        //share checked list
        this.shareCheckedlist();

        //share checked list
        this.shareCheckedCodelist();
        
        //share individual selected item
        this.shareIndividualStatus();
    }
    shareCheckedlist(){
         this.shareCheckedList.emit(this.checkedList);
    }
    shareCheckedCodelist(){
         this.shareCheckedCodeList.emit(this.checkedCodeList);
    }
    shareIndividualStatus(){
        this.shareIndividualCheckedList.emit(this.currentSelected);
    }
}
