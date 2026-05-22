# ICR module index

Master map of **menu label → route → access → Angular code**. Source of truth for menu seeds: `deployment/database/SCRIPTS/35_menu_access_libquery.sql`. Routes: `controlRoom_client/src/app/app-routing.module.ts`.

## How to read this table

| Column | Meaning |
|--------|---------|
| **Route** | URL path after login (e.g. `/massjournal`) |
| **Access** | `USERSROOM` flag and/or profile that unlocks the menu (see [Navigation and access](functional/navigation-and-access.md)) |
| **Code** | Primary Angular folder under `pages/` |

---

## Header (all authenticated users)

| Menu | Route / action | Code |
|------|----------------|------|
| GOLD environment | Header dropdown | `layouts/header/` + `UserService` |
| AI mode toggle | Switches Standard ↔ AI sidebar | `HDR_AI_TOGGLE` — `USERAIADMIN` or `USERAIDESIGNER` |
| Profile menu | Change password, logout, … | `MenuAccessService` + `SET0000041` |
| Change password | Dialog | `SET0000024` |
| Documentation | New tab → `/documentation/` same Apache port | `HDR_USER_DOCUMENTATION` |

---

## Standard menu

| Group | Screen | Route | Access (typical) | Code |
|-------|--------|-------|------------------|------|
| — | Dashboard | `/dashboard` | All | `pages/dashboard/` |
| Inventory | Inventory follow-up | `/inventory` | Buyer, Helpdesk, IT, Data integrity | `pages/inventory/stock/` |
| Inventory | Third-Party counting | `/counting` | Buyer, Helpdesk, IT, Data integrity | `pages/inventory/counting/` |
| Computer Ordering | CAO setting | `/caoconfig` | Buyer, Data integrity | `pages/cao/configuration/` |
| Computer Ordering | CAO missing | `/caomissing` | Buyer, Data integrity | `pages/cao/missing/` |
| Supplier schedule | Holiday / Mgt / Generate | `/holiday`, `/schedule`, `/generateschedule` | Tech Services | `pages/schedule/` |
| — | Search | `/search` | Most roles | `pages/search/` |
| Master data | Retail by PPG / Next PPG / eCommerce desc | `/ppgretail`, `/nextppg`, `/ecommdesc` | Buyer, Space | `pages/mdm/` |
| Syndigo | Search / Collect / Syndigo to MDM | `/syndigosearch`, `/syndigocollect`, `/syndigoupdate` | Helpdesk, IT, Space, Data integrity | `pages/syndigo/` |
| Space Planning | E-commerce picture / Item history / SKU info / Item address load | `/ecommercepicture`, `/spaceitemreporting`, `/spaceitemdimreporting`, `/itemaddress` | Space (`USERSPACEPLANNING`) | `pages/space.planning/` |
| Account Payable | Unarchive | `/unarchiveinvoice` | Data integrity | `pages/finance/unarchive/` |
| Warehouse box | Fix picking / Release pallet / Pallet label / Production number | `/fixpickingunit`, `/releasepallet`, `/palletlabel`, `/productionnumber` | Helpdesk, Warehouse | `pages/warehouse/toolkit/` |
| I.T. | Batch / Vega / Job execution / Query / Preset report | `/batchschedule`, `/vega`, `/unixrunner`, `/queryrunner`, `/presetquery` | IT, Data integrity | `pages/it/` |
| Helpdesk | Robot / WHS services / Services center / Order urgency | `/robot`, `/whsrestartservices`, `/servicescenter`, `/orderurgent` | Helpdesk | `pages/robot/`, `pages/warehouse/restart.services/`, `pages/helpdesk/`, `pages/order/urgent/` |
| EDI | Store ASN | `/ediasn` | Per flag rules | `pages/edi/asn/` |
| Hierarchy | Available node | `/availableMH` | IT, Warehouse, Data integrity | `pages/mdm/available.mh/` |
| Mass-change | Journal + 17 load screens | `/massjournal`, `/itemhierarchy`, … | Data integrity (full); Warehouse (journal only) | `pages/mass.update/` |
| Reporting | Scorecard CAO, PI adjustment, Supplier service, Whs Repl., Smart UBD, AP Receiving, Fill rate | `/scorecardcao`, … | IT, Tech, Data integrity | `pages/reporting/` |
| Alerts | Journal / Watch dog / Management / Filter config | `/alerts-journal`, `/alerts-watch`, `/alerts-icr`, `/reportfilter` | IT, Tech, Data integrity | `pages/alerts/` |

**Mass-change routes (detail):** [Mass-change screens](functional/icr-standard/mass-change-screens.md) · [Technical catalog](technical/icr-standard/mass-load-catalog.md)

**Not in menu (code exists):** `/itemretail` — Item retail mass load; use direct URL or add `ICR_MENU_ENTRY` if product requires sidebar link.

---

## Supply Chain AI menu (`MENU_MODE = AI`)

| Screen | Route | Access | Code |
|--------|-------|--------|------|
| Retailer & GOLD setup | `/ai/retailer-setup` | AI admin / designer | `pages/supply-chain-ai/platform/retailer-setup/` |
| Schema discovery | `/ai/schema-discovery` | AI admin / designer | `pages/supply-chain-ai/platform/schema-discovery/` |
| Context learning | `/ai/context-learning` | AI admin / designer | `pages/supply-chain-ai/platform/context-learning/` |
| Skill library / builder / pending / playground | `/ai/skill-studio/*` | AI admin / designer | `pages/supply-chain-ai/skill-studio/` |
| Data health / config | `/ai/data-health`, `/ai/data-health/config` | AI admin (+ config admin) | `pages/supply-chain-ai/operations/data-health/` |
| AI Assistant | `/ai/assistant` | AI admin / designer (analyst access via flags) | `pages/supply-chain-ai/inquiry/ai-assistant/` |

---

## Admin settings (`MENU_MODE = ADMIN`)

| Screen | Route | Access | Code |
|--------|-------|--------|------|
| Retailer & Access | `/settingcustomer` | `USERTYPE = 1` (ICR admin) | `pages/admin/setting-customer/` |
| Users & Profiles | `/settingusers` | ICR admin | `pages/admin/setting-users/` |
| Menu & access | `/settingmenu` | ICR admin | `pages/admin/setting-menu-access/` |
| Query Library | `/settingquery` | ICR admin | `pages/admin/query.library/` |
| Dictionary | `/settinglabel` | ICR admin | `pages/admin/dictionary/` |

---

## API patterns by module age

| Pattern | Used by | Technical doc |
|---------|---------|---------------|
| **LIBQUERY** (`QueryService`) | Settings, Supply Chain AI, newer screens | [LIBQUERY contract](technical/libquery-contract.md) |
| **Import / TRA tools** (`ImportService`, `toolID`) | Mass-change box, some Syndigo flows | [Mass-load architecture](technical/icr-standard/mass-load-architecture.md) |
| **Widgets / Process** (`WidgetService`, `ProcessService`) | Journal, batch schedule, dashboards | [Environment & batch jobs](technical/environment-and-batch-jobs.md) |
| **Custom Express routes** | AI engine, schema scan, ping DB link | [AI engine](technical/supply-chain-ai/ai-engine.md) |
