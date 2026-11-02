# Mass-load architecture

## Pattern

Mass-change screens do **not** use `QueryService` per screen for GOLD DML. They use the **TRA / import tool** pipeline + `PKMASSCHANGE` package:

```
Angular screen (toolID, templateID)
    → ImportService.getTemplate(templateID)
    → User uploads Excel
    → ImportService.postExecution(file, toolID, …)     # check → JSON_CHECK
    → ImportService.executePlan(userId, toolID)        # may run GOLD jobs after execute
    → PKMASSCHANGE.MAIN_* → tool-specific *_CHECK / *_EXECUTE / *_COLLECTERROR
    → GOLD tables via @dblink (from header CORPENV)
    → Journal (/massjournal) records status / errors
```

**LIBQUERY exception:** Mass-load **settings** CRUD (`ICR_MASSLOAD_RULE`) uses `QueryService` + `MAS0000100`–`MAS0000104`. Runtime execute still reads the table **directly in PL/SQL** (not via LIBQUERY).

---

## Quick deploy cheat sheet (new tool or rule change)

| Step | What |
|------|------|
| 1 | Excel template under `controlRoom_server/server/templates/ICR_TEMPLATE###.xlsx` |
| 2 | Angular screen under `pages/mass.update/<name>/` — set `toolID` + `templateID` |
| 3 | Wire `ImportService.executePlan` case for the toolID (GOLD jobs if any) |
| 4 | `PKMASSCHANGE` — `*_CHECK` / `*_EXECUTE` / `*_COLLECTERROR` + `MAIN_*` cases |
| 5 | Menu + journal: `PARAMETERS` PARAMID=**33** + `TRA_ENTRIES` (business title) + `ICR_MENU_*` |
| 6 | Prefer Excel columns for per-row interface defaults (see tool 24) |
| 7 | Document row in [mass-load-catalog](technical/icr-standard/mass-load-catalog.md) |

Do **not** put inline SQL in Angular. Vendor codes: use **as entered** (no `AO` strip) unless a tool explicitly documents otherwise.

**UI copy:** No technical information on any mass-load screen (no GOLD table/column names, no package/job names). Plain business language only — see [mass-change screens](functional/icr-standard/mass-change-screens.md#ux-rule--no-technical-information-on-screen).

---

## Changes so far (tool 24 + settings) — skim this first

| Change | Why / where |
|--------|-------------|
| Tool **24** Store/Whs returns | Excel → validate → `INTDETRET` → dual `psint41p` (0 then 10) |
| Vendor **as entered** | Removed `AO%` / LTRIM rewrite — `TRIM` only in CHECK |
| QTY in **SKU** | Buyer template; not forced to cases |
| ARTUC **orderable** (any period) | Expired OA still OK if site/vendor/item/LV matched |
| `IRFCEXRET` | `PKDSD.generateBL(1)` once per SITE+VENDOR group |
| `IRFCNUM` / `IRFNFILF` | Latest OA (+ FOUCCOM); fallback `vendor\|\|'CC'` / `0` |
| Excel defaults | `COMPENSATION`→`IRFTMODE`, `PHYSICAL`→`IRFRPHY`, `REASON`→`IRFMOTI` |
| Package constants | `IRFTYPE=1`, `IRFDEVI=840`, `IRFCONS=0` (not in Excel) |
| ~~`ICR_MASSLOAD_RULE`~~ | **Retired** — drop via `126_drop_icr_massload_rule.sql` |
| Menu | `ROUTE_LOADRETURN` under `GRP_MASS` (`ROUTE_SET_MASSLOAD` removed by 126) |
| PL/SQL compile | Nested procs **after** TYPE/cursor declare (`PLS-00103`) |

Scripts: `121` menu/PARAM/labels → `122`/`111`/`125` package → `123` TRA_TECHOBJ → `126` drop rules table → Angular rebuild + re-login.

---

## Key client files

| File | Role |
|------|------|
| `shared/services/inout/import.service.ts` | Template download, post execution, `executePlan` (per-tool GOLD jobs) |
| `pages/mass.update/*/**.component.ts` | Per-tool `templateID` + `toolID` |
| `pages/mass.update/journal/massjournal.component.ts` | Calendar/tree of executions |
| `pages/admin/setting-massload-rules/` | *(legacy)* Mass-load settings — retire with script `126` |
| `shared/services/massupdate/massload.rules.service.ts` | *(legacy)* `MAS0000100`–`MAS0000104` |

---

## toolID / PARAM 33 / TRA_ENTRIES

- **toolID** = `PARAMETERS.PARAMENTRY` where `PARAMID = 33`.
- **Business title** (UI / journal / Mass-load settings dropdown) = `TRA_ENTRIES.TENTRYDESC` (`TENTRYPARAMID = 33`, `TENTRYID = PARAMENTRY`).
- **`PARAMCHAR1`** often holds a Pro*C / job name — **do not** use it as the display label (see `MAS0000104`).

Journal Angular loads titles via `ParamService.getParam('33')` → `TENTRYDESC`.

---

## Templates

`ICR_TEMPLATE001` … — Excel layouts on the server; `getTemplate` fails if file missing.

Recent:

| Template | Tool | Screen |
|----------|------|--------|
| ICR_TEMPLATE021 | 22 | Reference to order |
| ICR_TEMPLATE022 | 23 | New Item PPG |
| ICR_TEMPLATE023 | 24 | Store/Whs returns |

---

## Tool 24 — Store/Whs returns (current reference implementation)

| Item | Value |
|------|--------|
| Route | `/loadreturn` |
| Screen | `SCR0000000092` · `pages/mass.update/load.return/` |
| Template | `ICR_TEMPLATE023` — `SITE,VENDOR_CODE,ITEM_CODE,LV,QTY,COMPENSATION,PHYSICAL,REASON` (QTY in **SKU**) |
| toolID | **24** |
| Check | `LOADRETURN_CHECK` — site / vendor as entered / item+LV / qty / compensation+physical+reason / orderable ARTUC |
| Execute | `LOADRETURN_EXECUTE` → `INTDETRET@dblink` |
| Jobs | `ImportService` dual `psint41p` — class **0** then **10** (`… 0|10 -1 -1 <lang> 1`) |
| BL | `IRFCEXRET` = `PKDSD.generateBL(1)` once per SITE+VENDOR group |
| Contract | `IRFCNUM` / `IRFNFILF` from latest ARTUC OA (+ FOUCCOM); fallback `vendor\|\|'CC'` / `0` |
| From Excel | `COMPENSATION`→`IRFTMODE`, `PHYSICAL`→`IRFRPHY`, `REASON`→`IRFMOTI` |
| Package constants | `IRFTYPE=1`, `IRFDEVI=840`, `IRFCONS=0` |

Typical Excel values (buyer chooses per row):

| Site type | COMPENSATION | PHYSICAL | REASON |
|-----------|-------------:|---------:|-------:|
| Store | 4 (credit request) | 3 (return destruction) | 3 (corporate request) |
| Warehouse | 4 (credit request) | 2 (financial return) | 703 (allotment error) |

Code lists: COMPENSATION **3** sending invoice / **4** credit request; PHYSICAL **1** physical return / **2** financial return / **3** return destruction; REASON **3** corporate request / **703** allotment error.

### Deploy order (tool 24)

```
121_mass_load_return.sql                 — menu / PARAM 33/24 / TRA_ENTRIES / labels (8 columns)
122 or 111 or 125_…_excel.sql            — LOADRETURN_* package body
123_tra_techobj_load_return.sql          — TRA_TECHOBJ if used
126_drop_icr_massload_rule.sql           — DROP ICR_MASSLOAD_RULE + retire MAS000010x / settings menu
Redeploy server template ICR_TEMPLATE023.xlsx
Angular rebuild + re-login
```

Canonical package body: `111_pkmasschange_ref_to_order.sql` (LOADRETURN_* at end). Patch copy: `125_pkmasschange_load_return_excel.sql`.

### PL/SQL declare order (compile trap)

Inside `LOADRETURN_EXECUTE`: **types / vars / cursor first**, then nested `PROCEDURE`/`FUNCTION`, then `BEGIN`. Nested subprograms before `TYPE` → `PLS-00103`.

### CALLQUERY / DBMS_SQL return trap (ORA-06561)

`CALLQUERY` runs the CLOB returned by CHECK / EXECUTE / COLLECTERROR via `DBMS_SQL.PARSE`. Only statements that **start with** `SELECT`, `INSERT`, `UPDATE`, `DELETE`, … are accepted. Bare `WITH …`, `MERGE`, `ERROR …`, or `-2` → **ORA-06561** (or ORA-00900 for `-2`).

| Path | Rule |
|---|---|
| MERGE into `JSON_CHECK` / `JSON_INBOUND` | `EXECUTE IMMEDIATE` inside the package (never return MERGE) |
| CHECK / COLLECTERROR success | `SELECT * FROM ( WITH … SELECT … FROM CHECK_RESULT )` |
| EXECUTE / COLLECTERROR failure | `SELECT '…' COMMENTS FROM DUAL` — never `'ERROR …'` or `TO_CLOB(-2)` |

---

## Scheduling

Several components support **immediate vs scheduled** execution (`scheduleFlag`, `scheduleDate`) — journal shows outcome.

## Syndigo overlap

`syndigoupdate.component.ts` reuses import tools **7** and **11** for dimension and image pushes.

## Extension guidelines

1. Add server TRA/tool definition and template file.  
2. Clone Angular mass component; set `templateID` / `toolID`.  
3. Wire `ImportService.executePlan` if GOLD jobs are required.  
4. Add `PKMASSCHANGE` check/execute/collect + MAIN cases.  
5. Add `ICR_MENU_ENTRY` under `GRP_MASS` + flag rules (`DATAINTEGRITY` / `BUYER` as needed).  
6. Seed PARAM 33 + `TRA_ENTRIES` **business title**.  
7. Prefer Excel columns for per-row GOLD interface defaults when buyers must vary them.  
8. Document in [mass-load-catalog](technical/icr-standard/mass-load-catalog.md).

Do not add inline SQL in Angular for new mass screens.

## Related

- [Functional: Mass-change box](functional/icr-standard/mass-change-box.md)  
- [Mass-change screens](functional/icr-standard/mass-change-screens.md)  
- [Mass-load catalog](technical/icr-standard/mass-load-catalog.md)  
- [Environment & batch jobs](technical/environment-and-batch-jobs.md)
