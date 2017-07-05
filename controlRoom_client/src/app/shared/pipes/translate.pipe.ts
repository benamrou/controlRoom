import { Pipe, PipeTransform } from '@angular/core';
import { LabelService, UserService } from '../../shared/services/index';

@Pipe({
    name: 'translate'
})
export class TranslatePipe implements PipeTransform {

  constructor(private _userService: UserService, private _labelService : LabelService) { 
      //console.log('Initialisation translatePipe.');
  }

    /**
     * This function retrieves the labels for a given id  and language.
     * @method getUserInfo
     * @param labelID
     * @param language 
     * @returns labels in the user language
     */
    public getLabel(labelID: string, language: string) {
        //console.log ('Getting label for id : ' + labelID  + language);
        let label = this._labelService.labels.label.filter(label => label.LABID === labelID && label.LABLANG === language)[0]
        if (label) { return label.LABDESC; }
        return labelID;
    }

    transform(id: string): string {
        return this.getLabel(id, this._userService.userInfo.language);
    }

} 

