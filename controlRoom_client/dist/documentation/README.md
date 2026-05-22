# Inventory Control Room (ICR) — Documentation

ICR is Heinens' supply chain operations portal: inventory follow-up, mass master-data loads, helpdesk tooling, Syndigo and space planning, reporting, alerts, and the **Supply Chain AI** module on top of GOLD ERP.

This site is organized for two audiences:

| Audience | Section | You will find |
|----------|---------|----------------|
| **Supply chain operation / analyst** | [Functional](functional/product-overview.md) | What each menu does, who can use it, typical workflows, business rules |
| **IT director / architect / developer** | [Technical](technical/architecture-overview.md) | Architecture, LIBQUERY, deployment, APIs, data integration |

**Quick links**

- [Operation summary](functional/director-summary.md) — one-page brief; **PDF:** `cd documentation && npm run pdf:director`
- [Module index](icr-module-index.md) — every menu route mapped to code and access flags
- [Getting started](functional/getting-started.md) — login, environment, navigation
- [Mass-change SME reference](functional/icr-standard/mass-change-sme-reference.md) — column specs & sign-off
- [Release notes](release/release.md)

## In the ICR app

Profile menu → **Documentation** opens the in-app route **`/documentation`** (Docsify under `/icr/documentation/`). Rebuild and deploy `controlRoom_client` — see [DEPLOY.md](DEPLOY.md).

## View & export

See **[PDF & offline guide](offline-and-pdf.md)** — Docsify in the app, PDF export, included wireframes, and how to capture real screenshots.

```bash
cd documentation
npm install
npm run serve          # optional: preview markdown only (port 9000)
npm run pdf:html       # single HTML → Print to PDF in browser (works on any Node)
npm run pdf:all        # automated PDFs via Puppeteer (Node 20+ recommended)
```

**Engineering reference (not in this site):** `CLAUDE.md` at the repository root — detailed deploy scripts, AI query IDs, and implementation notes for developers.
