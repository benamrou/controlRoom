import { Component, ViewEncapsulation } from '@angular/core';
import { MenuItem } from 'primeng/api';
@Component({ selector: 'ai-domain-investigation-cmp',
  templateUrl: './ai.domain.investigation.component.html',
  styleUrls: ['./ai.domain.investigation.component.scss'],
  encapsulation: ViewEncapsulation.None })
export class AiDomainInvestigationComponent {
  domainSteps: MenuItem[] = [
    { label: 'Item' }, { label: 'Supplier' }, { label: 'Site' },
    { label: 'Promo' }, { label: 'Stock' }, { label: 'Order' }
  ];
  activeDomainStep = 0;
  running = false;
  results: any[] = [];

  form: any = {
    retailer_id: '',
    entity_id: '',
    site_id: '',
    date_ref: ''
  };

  get activeDomain(): string {
    return ['ITEM', 'SUPPLIER', 'SITE', 'PROMO', 'STOCK', 'ORDER'][this.activeDomainStep] || 'ITEM';
  }

  runPlaybook(): void {
    if (!this.form.retailer_id || !this.form.entity_id) { return; }
    this.running = true;
    this.results = [];
    setTimeout(() => {
      this.results = [
        {
          header: `${this.activeDomain} — Identity & scope`,
          lines: [
            `Retailer=${this.form.retailer_id}, Entity=${this.form.entity_id}`,
            `Site=${this.form.site_id || '-'}, Date=${this.form.date_ref || '-'}`
          ]
        },
        {
          header: `${this.activeDomain} — Evidence facts`,
          lines: [
            'Fact 1: Master record found in GOLD.',
            'Fact 2: At least one local override detected.',
            'Fact 3: Playbook recommends deeper check in S14 assistant context.'
          ]
        },
        {
          header: `${this.activeDomain} — Preliminary conclusion`,
          lines: [
            'Status: PROBABLE root-cause path identified.',
            'Next action: run targeted SQL template validation and capture recommendation.'
          ]
        }
      ];
      this.running = false;
    }, 700);
  }
}
