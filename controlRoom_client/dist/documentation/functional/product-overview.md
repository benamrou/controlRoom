# Product overview

> **Executive PDF:** [Operation summary](functional/director-summary.md) — export with `npm run pdf:director` from `documentation/`.

## What Inventory Control Room is

ICR is Heinens' **control room** for supply chain operations. It sits beside GOLD ERP and gives teams a single web portal to:

- **Monitor** inventory, replenishment signals, and supplier performance (reporting dashboards, alerts).
- **Correct** master data and operational parameters at scale (mass-change box).
- **Run** helpdesk and warehouse quick fixes without a full GOLD UI session.
- **Integrate** Syndigo product content and space-planning dimensions into GOLD.
- **Ask operational questions** in plain language via **Supply Chain AI** (rule-based routing and SQL — no external LLM).

## Who uses ICR

| Role | Typical use |
|------|-------------|
| **Supply chain operation** | Reporting box, fill rate, supplier scorecards, data health summary, AI Assistant for exceptions |
| **Buyer / category** | Search, CAO, master data PPG, inventory follow-up |
| **Data integrity** | Mass-change box, alerts, Syndigo-to-MDM, unarchive invoice |
| **Helpdesk** | Robot automations, warehouse service restart, order urgency, warehouse toolkit |
| **Space planning** | Syndigo, SKU dimensions, item history, e-commerce pictures, item address load |
| **Warehouse** | Pallet release, picking unit fix, mass journal (read-only status) |
| **IT / tech services** | Batch schedule, query runner, alert configuration, environment setup |
| **AI designer / AI admin** | Retailer setup, context learning, skill studio, data health config |

## Two navigation modes

After login you work in **Standard** mode (classic ICR menu) or **AI** mode (Supply Chain AI menu). Users with AI admin or designer rights see a header toggle to switch modes. Both modes respect the same GOLD **environment** (preprod vs prod, central vs stock schema) selected in the header.

## What Supply Chain AI adds

Supply Chain AI is not a separate product — it is a module inside ICR that:

1. Connects to GOLD through configured DB links (`CORPENV`).
2. Learns retailer-specific business rules (context learning — 15 catalog items).
3. Routes analyst questions to **skills** (DSD vendor, item master, delivery exception, etc.).
4. Runs approved SQL templates and returns grounded summaries.
5. Monitors pipeline integrity (**Data health**) before trusting replenishment analytics.

Designers extend behavior through **Skill studio** (vocabulary + SQL templates) without changing Angular code for each new phrase.

## What this documentation covers

- **Functional** sections explain business purpose, workflows, and who may run each screen.
- **Technical** sections explain architecture, LIBQUERY, deployment order, and integration points for IT.

Start with [Getting started](functional/getting-started.md) and the [Module index](icr-module-index.md).
