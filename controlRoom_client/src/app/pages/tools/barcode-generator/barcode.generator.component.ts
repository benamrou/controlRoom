import { Component, ViewEncapsulation } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as JsBarcode from 'jsbarcode';

export interface BarcodeFormat {
  label: string;
  value: string;
}

export interface BarcodeResult {
  code: string;
  svgHtml: SafeHtml | null;
  error: string | null;
}

@Component({
  selector: 'barcode-generator',
  templateUrl: './barcode.generator.component.html',
  styleUrls: ['./barcode.generator.component.scss', '../../../app.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class BarcodeGeneratorComponent {
  readonly screenID = 'SCR0000000082';

  codesInput = '';
  selectedFormat = 'CODE128';
  results: BarcodeResult[] = [];
  showResults = false;
  /** 1 = 100%; scales JsBarcode bar width/height for scan-friendly sizing */
  zoomLevel = 1;
  readonly zoomMin = 0.5;
  readonly zoomMax = 3;
  readonly zoomStep = 0.25;
  private readonly baseBarWidth = 2;
  private readonly baseBarHeight = 80;

  readonly formatOptions: BarcodeFormat[] = [
    { label: 'CODE128 (auto)', value: 'CODE128' },
    { label: 'CODE39', value: 'CODE39' },
    { label: 'EAN-13', value: 'EAN13' },
    { label: 'EAN-8', value: 'EAN8' },
    { label: 'UPC-A', value: 'UPC' },
    { label: 'ITF-14', value: 'ITF14' },
    { label: 'MSI', value: 'MSI' },
    { label: 'Pharmacode', value: 'pharmacode' },
  ];

  constructor(private sanitizer: DomSanitizer) {}

  get validCount(): number {
    return this.results.filter((r) => !r.error).length;
  }

  get errorCount(): number {
    return this.results.filter((r) => r.error).length;
  }

  get zoomPercentLabel(): string {
    return `${Math.round(this.zoomLevel * 100)}%`;
  }

  get canZoomOut(): boolean {
    return this.zoomLevel > this.zoomMin;
  }

  get canZoomIn(): boolean {
    return this.zoomLevel < this.zoomMax;
  }

  onCodesKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.generate();
    }
  }

  generate(): void {
    const codes = this.parseCodes(this.codesInput);
    if (!codes.length) {
      this.results = [];
      this.showResults = false;
      return;
    }

    this.results = codes.map((code) => this.buildBarcode(code));
    this.showResults = true;
  }

  clearAll(): void {
    this.codesInput = '';
    this.results = [];
    this.showResults = false;
    this.zoomLevel = 1;
  }

  zoomIn(): void {
    if (!this.canZoomIn) {
      return;
    }
    this.zoomLevel = Math.min(this.zoomMax, +(this.zoomLevel + this.zoomStep).toFixed(2));
    this.refreshBarcodeScale();
  }

  zoomOut(): void {
    if (!this.canZoomOut) {
      return;
    }
    this.zoomLevel = Math.max(this.zoomMin, +(this.zoomLevel - this.zoomStep).toFixed(2));
    this.refreshBarcodeScale();
  }

  resetZoom(): void {
    if (this.zoomLevel === 1) {
      return;
    }
    this.zoomLevel = 1;
    this.refreshBarcodeScale();
  }

  print(): void {
    document.body.classList.add('icr-barcode-print');
    const cleanup = (): void => {
      document.body.classList.remove('icr-barcode-print');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  }

  private refreshBarcodeScale(): void {
    if (!this.showResults || !this.results.length) {
      return;
    }
    this.results = this.results.map((item) =>
      item.error ? item : this.buildBarcode(item.code),
    );
  }

  private parseCodes(raw: string): string[] {
    return raw
      .split(/[\n,\t]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  private buildBarcode(code: string): BarcodeResult {
    try {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      JsBarcode(svg, code, {
        format: this.selectedFormat,
        width: +(this.baseBarWidth * this.zoomLevel).toFixed(2),
        height: Math.round(this.baseBarHeight * this.zoomLevel),
        displayValue: false,
        margin: 6,
      });
      return {
        code,
        svgHtml: this.sanitizer.bypassSecurityTrustHtml(svg.outerHTML),
        error: null,
      };
    } catch {
      return {
        code,
        svgHtml: null,
        error: `Invalid for ${this.selectedFormat}`,
      };
    }
  }
}
