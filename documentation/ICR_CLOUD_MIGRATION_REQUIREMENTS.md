# Inventory Control Room (ICR) — Technical Requirements & Functional Coverage

**Purpose:** High-level reference for relocating ICR to a dedicated, secure cloud environment — separate from core GOLD ERP application tiers — while preserving operational capabilities for Heinens supply chain teams.

**Audience:** Infrastructure, security, application owners, and project sponsors.

**Scope:** Architecture, dependencies, access model, and functional coverage. Not a version-pinned install guide.

---

## 1. Executive summary

**Inventory Control Room (ICR)** is Heinens’ web-based **control room** for supply chain operations. It sits **alongside** the GOLD ERP landscape: analysts and IT use ICR to monitor exceptions, run bulk corrections, integrate Syndigo product content, schedule alerts, and (via **Supply Chain AI**) ask operational questions in plain language — with answers grounded in approved SQL, not external generative AI.

ICR is **not** a replacement for GOLD. It is an operational portal, batch orchestration layer, and integration hub that reads and writes GOLD data through controlled paths (Oracle DB links, import pipelines, LIBQUERY catalog).

**Cloud positioning recommendation:** Treat ICR as a **distinct application tier** in cloud:

- Own compute for **Node.js API** and **static web** assets  
- Network access to **ICR Oracle** (application database) and **GOLD Oracle** (via DB links configured in `CORPENV`)  
- Isolated from ERP batch/OLTP hosts where possible, with firewall rules allowing only required Oracle, SMTP, and internal integration ports  

---

## 2. Solution architecture (high level)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Users (browsers) — buyers, data integrity, helpdesk, IT, AI designers │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ HTTPS
┌───────────────────────────────▼─────────────────────────────────────────┐
│  Web tier — static Angular SPA                                          │
│  Deployed under e.g. /icr/ (Apache, IIS, or Java app server webapps)   │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ REST API (JSON)
┌───────────────────────────────▼─────────────────────────────────────────┐
│  Application tier — Node.js (Express)                                   │
│  Multiple processes: interactive API, batch execution, alerts/cron        │
└───────────────┬─────────────────────────────┬───────────────────────────┘
                │                             │
┌───────────────▼──────────────┐   ┌──────────▼──────────────────────────┐
│  ICR Oracle (application DB) │   │  GOLD Oracle (ERP)                  │
│  LIBQUERY, users, menus,     │   │  Items, stock, PO, suppliers, …     │
│  journals, AI metadata, …      │   │  Access via DB link per environment │
└──────────────────────────────┘   └─────────────────────────────────────┘
```

### Technology stack (summary)

| Layer | Technology | Role |
|-------|------------|------|
| Frontend | Angular, PrimeNG | SPA UI, role-based menus, mass-load wizards, AI screens |
| API | Node.js, Express | Authentication, LIBQUERY execution, file import, batch, alerts |
| App database | Oracle | SQL catalog (`LIBQUERY`), users, menus, audit, AI configuration |
| ERP data | Oracle GOLD | Business data via `CORPENV` DB links (central / stock schemas) |
| AI engine | In-process Node (no external LLM) | Rule-based routing, SQL templates, diagnostics |

---

## 3. Deployment model (current pattern)

### 3.1 Frontend

- Built as static assets (`ng build`) and copied to the web server document root, typically **`webapps/icr/`** or equivalent virtual directory **`/icr/`**.
- **Apache / IIS:** URL rewriting sends non-file routes to `index.html` (SPA). `web.config` is included for IIS.
- **Historical note:** Some environments used Apache Tomcat/TomEE as the servlet container hosting the static `icr` folder; Heinens OCI production deploy scripts reference **Apache Tomcat** paths. Functionally this is **static file hosting** plus reverse proxy to Node — not a Java application runtime for ICR logic.
- Embedded **documentation** site is bundled under `/icr/documentation/` at build time.

### 3.2 Backend (Node.js)

ICR runs **one codebase** (`server_admin.js`) in **several OS processes**, each bound to a port:

| Process role | Typical port | Purpose |
|--------------|--------------|---------|
| Main API | 8090 or 8093 | Interactive UI, login, LIBQUERY, imports |
| Batch execution | 8091 | Mass-change and scheduled batch jobs |
| Alerts / scheduler | 8092 (`CRONTAB` mode) | Report generation, email, cron-driven alert execution |

Processes are started via shell scripts (`start_backend.sh`, PM2, or `nohup`) and expect environment files (e.g. `envICR`, `ICR_SERVER` path).

**Client configuration** points the browser to these URLs (`serverURL`, `serverBatchURL`) per environment (dev, UAT, prod).

### 3.3 Database

- **ICR application schema** holds metadata, security, menus, query definitions, mass-load templates, alert definitions, Supply Chain AI tables, and journals.
- **GOLD** is reached through **Oracle database links** defined per corporate environment row (`CORPENV`: link name, schema prefix, connection attributes). ICR does not embed GOLD connection strings in the Angular client.

### 3.4 Deployment access — SSH and automation

**Yes — server SSH (or equivalent secure shell) is required** for operations and typical releases:

- Deploy scripts use **`ssh`** + **`rsync`** to push `dist/*` to the web tier on the target host.
- Backend deployment copies server code, runs `npm install`, and restarts Node processes.
- **OS-level cron** on the application server triggers watchdog scans, alert schedules, and helper shell scripts.
- The Node application **executes local bash scripts** on the app server (alerts `SALTSHELL`, batch/crontab, watchdog) via `child_process` — this is **not** SSH into GOLD; it is **local shell** on the ICR host.

**Implication for cloud:** Provide a Linux VM or container host with:

- SSH (or CI/CD agent) for deploy and support  
- Ability to run **multiple long-lived Node processes** and **cron**  
- Writable directories for **logs**, **uploads**, **temp scripts**, and alert XML/SQL artifacts  

---

## 4. Network and integration requirements

### 4.1 Inbound

| Source | Destination | Purpose |
|--------|-------------|---------|
| Corporate users (HTTPS) | Web tier `/icr/` | UI |
| Browser (HTTPS/HTTP) | Node API ports (8090–8093) | REST API (often same host or reverse-proxied) |

### 4.2 Outbound / east-west

| From | To | Purpose |
|------|-----|---------|
| Node processes | ICR Oracle (TCP listener) | All application SQL |
| Node / Oracle (DB link) | GOLD Oracle | ERP reads/writes per environment |
| Node (alerts) | SMTP / mail relay | Scheduled and on-demand report emails |
| Optional | Syndigo / external APIs | Product content (Syndigo flows — confirm endpoints per env) |
| Optional | File shares | Alert XML definitions, mass-load file drop zones (environment-specific) |

### 4.3 Separation from core ERP

| Concern | ICR cloud tier | GOLD ERP tier |
|---------|----------------|---------------|
| Application runtime | Node.js + static web | GOLD application servers / batch |
| Primary data store | ICR Oracle schema | GOLD Oracle |
| User-facing portal | ICR only | GOLD fat client / other channels |
| Bulk operational changes | ICR mass-change + journals | Effected in GOLD via controlled pipelines |

Firewall design should allow ICR → GOLD **database** connectivity (DB link or equivalent secure path), **not** broad admin access from ICR hosts into ERP application servers unless explicitly required for legacy shell integrations.

---

## 5. Security and compliance (high level)

- **Authentication:** Application users in `USERSROOM`; passwords stored encoded; session via ICR login API.
- **Authorization:** Data-driven menus (`ICR_MENU_ENTRY`, flag rules, optional access profiles). Route guards on every business screen.
- **SQL governance:** Nearly all reads/writes go through **`LIBQUERY`** catalog — reduces ad hoc SQL in application code.
- **Supply Chain AI:** **No external LLM APIs**; routing and answers are rule-based with SQL evidence. Suitable for policies that restrict cloud AI services.
- **Environment separation:** Header **environment selector** (preprod vs prod, central vs stock). Operational risk if users run mass loads against wrong env — enforce access matrix and change control.
- **Secrets:** DB credentials and link configuration in server/DB config — **not** in the Angular bundle.

---

## 6. Functional coverage

### 6.1 Core operational areas (Standard menu)

| Domain | Capabilities |
|--------|----------------|
| **Dashboard & search** | Landing dashboard, enterprise search across GOLD objects |
| **Inventory & counting** | Stock follow-up, third-party counting status |
| **Computer ordering (CAO)** | CAO configuration, missing-CAO analysis |
| **Master data** | Retail by PPG, next PPG, e-commerce descriptions |
| **Syndigo** | Product search, content collect, push to MDM/GOLD |
| **Space planning** | E-commerce pictures, item history, SKU dimensions, item address load |
| **Mass-change box** | Bulk updates: hierarchy, attributes, descriptions, barcodes, retail, PO, stock layers, supplier data, etc. — with **execution journal** and audit |
| **Reporting box** | CAO scorecard, fill rate, supplier service, warehouse replenishment, AP receiving, PI adjustments |
| **Alerts** | Alert/report definition, distribution lists, scheduling, execution journal, critical watchdog |
| **Helpdesk & warehouse** | Robot automations, service restarts, order urgency, pallet release, picking fixes |
| **IT operations** | Batch schedule, job execution, query runner, preset reports, Vega/unix runner |
| **Finance / EDI** | Invoice unarchive, store ASN (where enabled) |
| **Supplier schedule** | Holiday and schedule generation (tech services) |

### 6.2 Supply Chain AI module (separate menu mode)

| Area | Capabilities |
|------|----------------|
| Platform setup | Retailer & GOLD connection, schema discovery, context learning (15 catalog items) |
| Skill studio | Skill library, SQL templates, vocabulary, pending phrasings, phrasing playground |
| Operations | **AI Assistant** (route → execute), **Data health** dashboard and config, pipeline integrity checks |
| Governance | Designer/admin flags; feedback and curation queue; no external AI vendor |

### 6.3 Administration

| Area | Capabilities |
|------|----------------|
| Corporate & environments | Customer/corp/env setup, user–environment matrix |
| Users & profiles | Flags (buyer, IT, data integrity, AI admin, …), ICR admin type, access profiles |
| Menu & access | Menu catalog, flag rules, profile menu grants |
| Query library | LIBQUERY maintenance (admin) |
| Dictionary | UI labels (`TRA_LABELS`) and technical object help text |

### 6.4 Primary personas

| Persona | Typical use |
|---------|-------------|
| Supply chain / buyer | Search, inventory, CAO, reporting, AI Assistant |
| Data integrity | Mass-change, Syndigo, alerts, data health |
| Helpdesk / warehouse | Robot, warehouse toolkit, urgency |
| Space planning | Syndigo, dimensions, item history |
| IT / tech services | Batch schedule, query runner, alert configuration |
| AI designer / admin | Retailer setup, skills, context learning, menu admin |

---

## 7. Non-functional requirements for cloud hosting

### 7.1 Compute

- **Web:** Static hosting or lightweight reverse proxy (Apache, IIS, nginx, or object storage + CDN with API proxy).
- **Node:** Linux VM or container(s) with enough memory for:
  - Main API (moderate heap)
  - Batch worker (moderate)
  - **Alerts worker (higher heap** — report generation, Excel, email; production configs use multi-GB heap for alert process)

### 7.2 Storage

- Application logs (per-user, per-module, rotated by date)
- Upload staging for mass-change Excel files
- Temp directory for alert shell scripts and generated attachments
- Optional: shared mount if multiple nodes (otherwise single-instance or sticky sessions)

### 7.3 Database

- Dedicated **ICR Oracle** instance or pluggable database — schema ownership for LIBQUERY and app tables
- Connectivity to **GOLD** via supported Oracle network path (DB link from ICR DB or equivalent approved pattern)
- Backup/restore and DR aligned with operational RPO for journals and config — distinct from GOLD ERP DR if desired

### 7.4 Scheduling

- **OS cron** on app server (watchdog, alert triggers)
- **Internal Node CRONTAB** process for alert schedule polling
- **Oracle DBMS_SCHEDULER** jobs in ICR schema (e.g. data health checks, nightly maintenance) — Node not involved

### 7.5 Email

- SMTP relay access for operational alerts and report distribution

### 7.6 High availability (optional)

- Current design is **multi-process on one host** — cloud HA would require load balancer + multiple Node instances for API port, shared or externalized session strategy, and clear ownership of singleton roles (batch port 8091, alert port 8092). Plan explicitly before multi-instance deploy.

---

## 8. Cloud migration checklist (summary)

| # | Workstream | Key actions |
|---|------------|-------------|
| 1 | **Landing zone** | Dedicated subscription/VNet; no co-hosting with GOLD app servers |
| 2 | **Web tier** | Host `/icr/` static build; TLS termination; SPA rewrite rules |
| 3 | **API tier** | Node LTS runtime; 3 process roles; env vars (`ICR_SERVER`, DB TNS); `npm install` |
| 4 | **Database** | Migrate/provision ICR Oracle; run deployment scripts in order; configure `CORPENV` + DB links to GOLD |
| 5 | **Network** | Allow ICR → ICR DB, ICR DB → GOLD (links), SMTP; deny unnecessary ERP admin ports |
| 6 | **Identity** | Corporate SSO integration (if desired) — today native ICR users in `USERSROOM` |
| 7 | **Ops access** | SSH/bastion or CI/CD for deploy; cron for watchdog; log aggregation |
| 8 | **Secrets** | Key vault for DB passwords, SMTP, any Syndigo credentials |
| 9 | **Validation** | Login, menu load, mass journal, batch job on CEN domain, alert test, AI Assistant smoke test, Syndigo search (if used) |
| 10 | **Cutover** | DNS/load balancer to cloud web + API; freeze legacy host; user comms on environment header |

---

## 9. Repository and documentation references

| Resource | Location |
|----------|----------|
| Architecture overview | `documentation/technical/architecture-overview.md` |
| Deployment runbook | `documentation/technical/deployment-runbook.md` |
| Security & AI policy | `documentation/technical/security-and-data-policy.md` |
| Module / route index | `documentation/icr-module-index.md` |
| Product overview | `documentation/functional/product-overview.md` |
| Engineering deep reference | `CLAUDE.md` (internal) |
| Client deploy example | `controlRoom_client/deploy_HEINENS_OCI_*.sh` (ssh + rsync) |
| Backend startup | `controlRoom_server/server/start_backend*.sh` |

---

## 10. Document control

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2026 | Initial cloud migration requirements summary (Heinens ICR) |

---

*This document describes the Inventory Control Room application as implemented in the controlRoom repository. Environment-specific hostnames, ports, and credentials are maintained in operations runbooks and server configuration — not in source control.*
