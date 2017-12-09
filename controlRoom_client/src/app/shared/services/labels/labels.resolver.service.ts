import { Injectable }             from '@angular/core';
import { Router, Resolve, RouterStateSnapshot,
         ActivatedRouteSnapshot } from '@angular/router';
import { Labels, LabelService } from './labels.service';

@Injectable()
export class LabelsResolver implements Resolve<Labels> {
  constructor(private _labelService: LabelService, private router: Router) {}
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<any> {
    let id = route.params['id'];
    return this._labelService.getAllLabelsPromise().then(labels => {
      if (labels) {
        return labels;
      } else { // id not found
        this.router.navigate(['/login']);
        return null;
      }
    });
  }
}
