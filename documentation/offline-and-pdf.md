# PDF & offline documentation

How to **read** ICR docs in the app, **export PDFs** for meetings and SMEs, and **refresh screenshots** when the UI changes.

---

## Docsify (interactive site)

ICR documentation is a **Docsify** static site: markdown files + `index.html`, no build step for content.

| Where | URL / path |
|-------|------------|
| **Production (preferred)** | Profile menu → **Documentation** → in-app route `/documentation` embeds Docsify at `/icr/documentation/` |
| **Authoring only** | `cd documentation && npm run serve` → `http://localhost:9000` |
| **Inside dev Angular** | `ng serve` → `http://localhost:4200/documentation` (after login) |

**Deploy:** Docs are copied into the Angular build (`angular.json` assets). Rebuild `controlRoom_client` and deploy `dist/` — see [DEPLOY.md](DEPLOY.md).

**Not fully offline:** `index.html` loads Docsify, theme, and plugins from **unpkg CDN**. The deployed site needs network access for those scripts (markdown and images are local under `/icr/documentation/`). For air-gapped or offline briefings, use **PDF export** below.

**Troubleshooting 404s:** Keep `relativePath: false` in `index.html` so sidebar paths resolve from `/icr/documentation/` (not `functional/functional/...`). Rebuild the client, confirm `basePath`, and run `./validate-sidebar.sh`.

---

## PDF export

Use PDFs when you need email attachments, printouts, or offline packs without relying on the live Docsify site.

### Option A — Browser print (fastest)

No Chromium download; works on any Node version.

```bash
cd documentation
npm install
npm run pdf:html
```

Open `pdf/icr-print-pack.html` in Chrome or Edge → **File → Print → Save as PDF**. The pack merges the operation summary, product overview, and mass-change SME reference into one printable HTML file.

### Option B — Automated PDFs (`md-to-pdf`)

```bash
cd documentation
npm install
npm run pdf:all          # full set
npm run pdf:director     # operation summary only
npm run pdf:mass-sme     # mass-change column specs
```

First run downloads Chromium (~150 MB). **Node 20+** recommended; on older Node, use Option A.

| Output (`documentation/pdf/`) | Audience |
|-------------------------------|----------|
| `director-summary.pdf` | Supply chain operation |
| `product-overview.pdf` | All stakeholders |
| `mass-change-sme-reference.pdf` | Data integrity SMEs |
| `mass-change-box.pdf` | Mass-change operators |
| `supply-chain-ai-overview.pdf` | AI module intro |
| `architecture-overview.pdf` | IT / architect |

Generated PDFs are gitignored; run export locally before distribution. Detail: [PDF export guide](pdf/README.md).

---

## Included assets

Illustrations live in `documentation/assets/screenshots/`. Pages reference them with relative paths from `functional/` (e.g. `../../assets/screenshots/...`).

| File | Used on | Type |
|------|---------|------|
| `navigation-modes.svg` | Getting started, operation summary | Wireframe — Standard / AI / Admin sidebar |
| `mass-change-workflow.svg` | Mass-change box, SME reference | Wireframe — upload → validate → journal |
| `mass-journal.svg` | Mass-change box | Wireframe — journal calendar |
| `ai-assistant.svg` | AI Assistant | Wireframe — chat + results |
| `data-health-dashboard.svg` | Data health | Wireframe — category cards |

Wireframes match current layout (header, sidebar, stepper). They ship in the repo and in `dist/documentation/assets/screenshots/` after each client build.

**Docsify:** Images render in the site automatically. **Zoom:** click to enlarge (`zoom-image` plugin in `index.html`).

---

## Capture real screenshots (recommended)

Replace wireframes with production PNGs when you want training material that matches Heinens preprod/prod.

1. Log in to ICR **preprod** with a role that can open the target screen.
2. Browser **zoom 100%**, viewport width **≥ 1280px**.
3. Capture PNG; avoid personal data in grids (test items or blur).
4. Save under `documentation/assets/screenshots/`.
5. Update the markdown image path from `.svg` to `.png`:

```markdown
![AI Assistant](assets/screenshots/ai-assistant-turn.png)
```

| Suggested filename | Screen | Route |
|--------------------|--------|-------|
| `mass-change-item-attribute.png` | Item attribute — step 0 + recap | `/itemattribute` |
| `mass-journal-calendar.png` | Mass journal calendar | `/massjournal` |
| `ai-assistant-turn.png` | AI Assistant with a result turn | `/ai/assistant` |
| `data-health-cards.png` | Data health dashboard | `/ai/data-health` |
| `menu-standard-ai.png` | Standard vs AI sidebar | header AI toggle |
| `syndigo-search.png` | Syndigo search | `/syndigosearch` |
| `space-sku-dim.png` | SKU information | `/spaceitemdimreporting` |

After adding PNGs, rebuild the Angular client so `dist/documentation/assets/screenshots/` includes them. PDF export (`pdf:html` / `pdf:all`) picks up images via relative paths in markdown.

Full checklist: [Screenshot capture guide](assets/screenshots/README.md).

---

## Quick reference

| Goal | Command / action |
|------|------------------|
| Edit markdown | Any editor under `documentation/` |
| Preview locally | `npm run serve` (port 9000) |
| Preview in ICR | `ng serve` → Documentation menu |
| One printable pack | `npm run pdf:html` |
| Executive PDF | `npm run pdf:director` |
| Validate sidebar links | `./validate-sidebar.sh` |
| Deploy docs with app | `npm run build` in `controlRoom_client/` |
