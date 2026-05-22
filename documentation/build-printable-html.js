#!/usr/bin/env node
/**
 * Build a single printable HTML file (no Puppeteer).
 * Open in Chrome → Print → Save as PDF.
 */
const fs = require('fs');
const path = require('path');

const root = __dirname;
const outDir = path.join(root, 'pdf');
const files = [
  { title: 'Operation summary', file: 'functional/director-summary.md' },
  { title: 'Product overview', file: 'functional/product-overview.md' },
  { title: 'Mass-change SME reference', file: 'functional/icr-standard/mass-change-sme-reference.md' },
];

function mdToSimpleHtml(md) {
  let html = md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\|(.+)\|/g, (line) => {
      if (line.includes('---')) return '';
      const cells = line.split('|').filter(Boolean).map((c) => c.trim());
      if (!cells.length) return line;
      return '<tr>' + cells.map((c) => `<td>${c}</td>`).join('') + '</tr>';
    });
  html = html.replace(/(<tr>[\s\S]*?<\/tr>)+/g, (m) => `<table>${m}</table>`);
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
    const abs = path.join(root, path.dirname(files.find((f) => html.includes(alt))?.file || '.'), src);
    const rel = src.startsWith('http') ? src : path.relative(root, path.normalize(path.join(root, path.dirname('functional'), src))).replace(/^\.\.\//, '');
    return `<figure><img src="${rel}" alt="${alt}" style="max-width:100%"/><figcaption>${alt}</figcaption></figure>`;
  });
  // Fix image paths from functional/ and functional/icr-standard/
  html = html.replace(/\.\.\/\.\.\/assets\//g, 'assets/');
  html = html.replace(/\.\.\/assets\//g, 'assets/');
  html = html.replace(/\n/g, '<br/>\n');
  return html;
}

function readMd(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

let body = '';
for (const { title, file } of files) {
  const md = readMd(file);
  const base = path.dirname(file);
  let section = md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  section = section.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
    const resolved = path.join(root, base, src).replace(/\\/g, '/');
    const webPath = path.relative(root, resolved);
    return `<p><img src="${webPath}" alt="${alt}" style="max-width:90%"/></p>`;
  });
  section = section.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>');
  body += `<section class="page-break"><h1 class="doc-title">${title}</h1>${section}</section>`;
}

const template = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/>
<title>ICR Documentation — Printable pack</title>
<link rel="stylesheet" href="pdf/style.css"/>
<style>
  body { max-width: 800px; margin: 2em auto; padding: 0 1em; }
  .page-break { page-break-before: always; }
  .page-break:first-child { page-break-before: avoid; }
  .doc-title { border-bottom: 2px solid #2b6cb0; }
  @media print { .no-print { display: none; } }
</style>
</head><body>
<p class="no-print"><strong>Print to PDF:</strong> File → Print → Save as PDF (Chrome/Edge recommended).</p>
${body}
</body></html>`;

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, 'icr-print-pack.html');
fs.writeFileSync(out, template);
console.log('Wrote', out);
