# PDF exports

> Overview: [PDF & offline guide](offline-and-pdf.md) — Docsify, screenshots, and when to use each export option.

Generated files (not committed by default — run export locally).

## Build

### Option A — Browser print (fastest, no Chromium download)

```bash
cd documentation
npm install
npm run pdf:html
open pdf/icr-print-pack.html   # File → Print → Save as PDF
```

### Option B — Automated PDF (`md-to-pdf` + Puppeteer)

```bash
cd documentation
npm install
npm run pdf:all
```

First run downloads Chromium (~150MB). **Node 20+** recommended; on Node 17 use Option A.

Single documents:

```bash
npm run pdf:director    # Executive summary
npm run pdf:mass-sme    # Mass-change SME reference (column specs)
```

## Output

| File | Audience |
|------|----------|
| `director-summary.pdf` | Supply chain operation |
| `mass-change-sme-reference.pdf` | Data integrity SMEs |
| `product-overview.pdf` | All stakeholders |
| `architecture-overview.pdf` | IT / architect |

Requires Chromium (bundled by `md-to-pdf` on first run).

## Interactive site

```bash
npm run serve   # http://localhost:9000 — authoring only
```

In Heinens: profile menu → **Documentation** (`/icr/documentation` inside the Angular app).
