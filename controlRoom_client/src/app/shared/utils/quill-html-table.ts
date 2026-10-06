/**
 * Quill 1.3 has no built-in table support — tables are stripped on paste/load.
 * Register an HTML-table embed blot so ALTSPEC (and similar) can keep real <table> markup.
 *
 * Uses the Quill constructor from a live editor instance (PrimeNG already loads quill),
 * so we do not need a separate import path that may fail under different module formats.
 *
 * IMPORTANT: Never push quill.root.innerHTML into [(ngModel)] on every keystroke —
 * PrimeNG Editor.writeValue() calls setContents() and resets the caret to the top.
 */

let registered = false;

function resolveQuill(quillOrCtor?: any): any {
  if (quillOrCtor && typeof quillOrCtor.import === 'function') {
    return quillOrCtor;
  }
  if (quillOrCtor && quillOrCtor.constructor && typeof quillOrCtor.constructor.import === 'function') {
    return quillOrCtor.constructor;
  }
  const w = typeof window !== 'undefined' ? (window as any).Quill : null;
  return w || null;
}

function ensureRegistered(Quill: any): boolean {
  if (!Quill || typeof Quill.import !== 'function') {
    return false;
  }
  if (registered) {
    return true;
  }
  const BlockEmbed = Quill.import('blots/block/embed');

  class HtmlTableBlot extends BlockEmbed {
    static create(value: string): HTMLElement {
      const node = super.create() as HTMLElement;
      const html = typeof value === 'string' ? value : '';
      const wrap = document.createElement('div');
      wrap.innerHTML = html;
      const table = wrap.querySelector('table');
      if (table) {
        HtmlTableBlot.normalizeTable(table as HTMLTableElement);
        node.appendChild(table);
      } else {
        node.innerHTML = html;
      }
      // Editable cells; do not sync to ngModel on each keypress (see bindQuillTableToolbar).
      node.setAttribute('contenteditable', 'true');
      node.classList.add('ql-html-table');
      return node;
    }

    static value(node: HTMLElement): string {
      const table = node.querySelector('table');
      return table ? table.outerHTML : node.innerHTML;
    }

    static normalizeTable(table: HTMLTableElement): void {
      table.removeAttribute('width');
      if (!table.getAttribute('border')) {
        table.setAttribute('border', '1');
      }
      const style = table.getAttribute('style') || '';
      if (!/border-collapse/i.test(style)) {
        table.setAttribute(
          'style',
          (style ? style.replace(/;?\s*$/, '; ') : '') + 'border-collapse:collapse;width:100%;'
        );
      }
    }
  }

  (HtmlTableBlot as any).blotName = 'htmlTable';
  (HtmlTableBlot as any).className = 'ql-html-table';
  (HtmlTableBlot as any).tagName = 'DIV';
  Quill.register(HtmlTableBlot, true);
  registered = true;
  return true;
}

export function registerQuillHtmlTable(quillOrCtor?: any): void {
  const Quill = resolveQuill(quillOrCtor);
  if (Quill) {
    ensureRegistered(Quill);
  }
}

export function defaultTableHtml(rows = 3, cols = 3): string {
  const safeRows = Math.max(1, Math.min(20, rows | 0));
  const safeCols = Math.max(1, Math.min(12, cols | 0));
  let html = '<table border="1" style="border-collapse:collapse;width:100%"><thead><tr>';
  for (let c = 0; c < safeCols; c++) {
    html += `<th>Column ${c + 1}</th>`;
  }
  html += '</tr></thead><tbody>';
  for (let r = 0; r < safeRows; r++) {
    html += '<tr>';
    for (let c = 0; c < safeCols; c++) {
      html += '<td><br></td>';
    }
    html += '</tr>';
  }
  html += '</tbody></table>';
  return html;
}

/**
 * Clipboard matchers must be attached on a live Quill instance (after init).
 * Call from p-editor (onInit) before relying on pasted/loaded tables.
 */
export function attachQuillTableClipboard(quill: any): void {
  const Quill = resolveQuill(quill);
  if (!quill || !ensureRegistered(Quill)) {
    return;
  }
  const Delta = Quill.import('delta');
  const clipboard = quill.getModule('clipboard');
  if (!clipboard || typeof clipboard.addMatcher !== 'function') {
    return;
  }
  clipboard.addMatcher('TABLE', (node: HTMLElement) =>
    new Delta().insert({ htmlTable: node.outerHTML })
  );
  clipboard.addMatcher('DIV.ql-html-table', (node: HTMLElement) => {
    const table = node.querySelector('table');
    return new Delta().insert({
      htmlTable: table ? table.outerHTML : node.innerHTML,
    });
  });
}

export function insertQuillTable(quill: any, rows = 3, cols = 3): void {
  if (!quill) {
    return;
  }
  const Quill = resolveQuill(quill);
  if (!ensureRegistered(Quill)) {
    return;
  }
  const range = quill.getSelection(true);
  const index = range ? range.index : Math.max(0, quill.getLength() - 1);
  quill.insertEmbed(index, 'htmlTable', defaultTableHtml(rows, cols), 'user');
  quill.insertText(index + 1, '\n', 'user');
  quill.setSelection(index + 2, 0, 'silent');
}

export function readQuillHtml(quill: any): string {
  if (!quill?.root) {
    return '';
  }
  let html = quill.root.innerHTML || '';
  if (html === '<p><br></p>' || html === '<p></p>') {
    return '';
  }
  return html
    .replace(/\scontenteditable=("true"|'true'|true)/gi, '')
    .replace(/\sdata-table-blot="[^"]*"/gi, '');
}

/**
 * Wire toolbar "table" button + clipboard matchers.
 * Optional onHtmlChange is invoked only when focus leaves the editor (not on each key),
 * so [(ngModel)] is not rewritten mid-edit (which resets the caret).
 */
export function bindQuillTableToolbar(
  quill: any,
  onHtmlChange?: (html: string) => void
): void {
  if (!quill) {
    return;
  }
  attachQuillTableClipboard(quill);
  const toolbar = quill.getModule('toolbar');
  if (toolbar) {
    toolbar.addHandler('table', () => insertQuillTable(quill));
  }
  if (typeof onHtmlChange === 'function') {
    // Sync table cell edits after the user leaves the editor — never on 'input'
    quill.root.addEventListener('focusout', (ev: FocusEvent) => {
      const next = ev.relatedTarget as Node | null;
      if (next && quill.root.contains(next)) {
        return;
      }
      onHtmlChange(readQuillHtml(quill));
    });
  }
}

/** Empty modules — clipboard matchers are attached in onInit once Quill exists. */
export function buildQuillTableModules(): Record<string, unknown> {
  return {};
}
