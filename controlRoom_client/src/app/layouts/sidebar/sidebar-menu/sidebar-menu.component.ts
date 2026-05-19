import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { MenuNode } from '../../../shared/services/menu/menu-access.service';

@Component({
  selector: 'app-sidebar-menu',
  templateUrl: './sidebar-menu.component.html',
  styleUrls: ['./sidebar-menu.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SidebarMenuComponent {
  @Input() nodes: MenuNode[] = [];
  @Input() showMenu = '';
  @Input() depth = 0;
  @Output() expand = new EventEmitter<string>();

  onExpand(key: string | null, event: Event): void {
    event.preventDefault();
    if (key) {
      this.expand.emit(key);
    }
  }

  isExpanded(key: string | null): boolean {
    if (!key) {
      return false;
    }
    // Exact match only — indexOf caused false expands (e.g. "inventory" contains "it").
    return this.showMenu === key;
  }

  /** Solid Font Awesome + strip fa-fw so top-level rows match legacy sidebar weight. */
  menuIconClass(node: MenuNode): string {
    let raw = (node.ICON_CLASS || '').trim();
    if (!raw) {
      return node.MENU_TYPE === 'GROUP' ? 'fas fa-folder' : 'fas fa-circle';
    }
    raw = raw.replace(/\bfa-fw\b/g, '').replace(/\s+/g, ' ').trim();
    if (/\bfas\b/.test(raw) || /\bfar\b/.test(raw) || /\bfab\b/.test(raw)) {
      return raw;
    }
    if (/\bfa\b/.test(raw)) {
      return raw.replace(/\bfa\b/, 'fas');
    }
    if (raw.startsWith('pi ')) {
      return raw;
    }
    return `fas ${raw}`;
  }
}
