import { Pipe, PipeTransform } from '@angular/core';
import { LabelService } from '../services/labels/labels.service';

/** Resolve TRA_LABELS text by key — {{ 'S66.TITLE' | lbl:'Menu and access' }} */
@Pipe({ name: 'lbl', pure: false })
export class LblPipe implements PipeTransform {
  constructor(private _labels: LabelService) {}

  transform(key: string, fallback?: string): string {
    // Depend on revision so templates refresh after header language switch.
    void this._labels.revision;
    return this._labels.text(key, fallback);
  }
}
