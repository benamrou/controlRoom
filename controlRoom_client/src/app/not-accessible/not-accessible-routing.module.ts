import {NgModule} from "@angular/core";
import {Routes, RouterModule} from "@angular/router";
import {NotAccessibleComponent} from "./not-accessible.component";

const routes: Routes = [
  {path: '', component: NotAccessibleComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NotAccessibleRoutingModule {
}
