import { NgModule } from '@angular/core';
import { LblPipe } from './lbl.pipe';

@NgModule({
  declarations: [LblPipe],
  exports: [LblPipe],
})
export class I18nModule {}
