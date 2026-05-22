# Supply Chain Operation — ICR & AI summary

> **One-page executive view.** Export to PDF: `npm run pdf:director` from `documentation/`.

![Navigation modes](assets/screenshots/navigation-modes.svg)

## What ICR delivers

| Capability | Business value |
|------------|----------------|
| **Inventory & counting** | See exceptions and third-party count status without GOLD UI training |
| **Mass-change box** | Controlled bulk master-data fixes (attributes, hierarchy, PO, stock, retail) with journal audit |
| **Helpdesk & warehouse tools** | Faster incident response (services, pallets, picking) |
| **Syndigo & space planning** | Product content and planogram data in sync with GOLD |
| **Reporting box** | CAO scorecard, fill rate, supplier service, AP receiving — weekly ops review |
| **Alerts** | Scheduled and live operational notifications |
| **Supply Chain AI** | Plain-language Q&A and pipeline health — **rule-based, auditable SQL** (no external AI API) |

## Supply Chain AI in one minute

1. **Setup** (IT/designer): connect retailer to GOLD, learn 15 context rules, publish skills.  
2. **Daily use** (analyst): **AI Assistant** — “What can we buy from vendor X at store Y?”  
3. **Governance** (operations): **Data health** — red/yellow cards before trusting replenishment KPIs; **Investigate** opens Assistant on the issue.

![Data health](assets/screenshots/data-health-dashboard.svg)

## Roles and access (simplified)

| Role | Gets |
|------|------|
| Buyer | Search, inventory, CAO, PPG |
| Data integrity | Mass-change, Syndigo, reporting, alerts |
| Helpdesk | Robot, warehouse restarts, urgency |
| Space planning | Syndigo, dimensions, item history |
| AI designer | Skill studio, context learning |
| Operation / manager | Reporting + data health + Assistant (via profile/flags IT assigns) |

Access is **data-driven** (flags + profiles). Users must **re-login** after access changes.

## Risk controls operations should enforce

| Risk | Control |
|------|---------|
| Mass load on wrong environment | Preprod sign-off; header env check on recap |
| Duplicate PO / stock loads | Change ticket + journal execution ID |
| Silent pipeline failure | Data health REALTIME tier (sales, receipts) |
| Mis-routed AI answers | Designer maintains vocabulary; pending phrasing queue |

## Where to read more

| Topic | Document |
|-------|----------|
| Mass-change column specs (SME) | [Mass-change SME reference](functional/icr-standard/mass-change-sme-reference.md) |
| Full product map | [Module index](icr-module-index.md) |
| Analyst guide | [Getting started](functional/getting-started.md) |
| IT architecture | [Architecture overview](technical/architecture-overview.md) |

---

*Heinens Inventory Control Room — documentation aligned to application code May 2026.*
