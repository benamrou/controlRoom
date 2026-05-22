import { Component, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

/** Embeds the Docsify site shipped under dist/documentation/ (same origin as ICR). */
@Component({
  selector: 'app-documentation-viewer',
  templateUrl: './documentation-viewer.component.html',
  styleUrls: ['./documentation-viewer.component.scss'],
})
export class DocumentationViewerComponent {
  readonly docFrameUrl: SafeResourceUrl;

  constructor(
    sanitizer: DomSanitizer,
    @Inject(DOCUMENT) document: Document,
  ) {
    const href = document.querySelector('base')?.getAttribute('href') ?? '/';
    const base = href.endsWith('/') ? href : `${href}/`;
    this.docFrameUrl = sanitizer.bypassSecurityTrustResourceUrl(
      `${base}documentation/index.html`,
    );
  }
}
