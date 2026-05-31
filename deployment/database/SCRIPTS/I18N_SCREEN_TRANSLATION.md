# ICR screen translation (French i18n)

Inventory Control Room UI strings are stored in Oracle **`TRA_LABELS`** and resolved at runtime by Angular **`LabelService`** + the **`lbl`** pipe. Menus use a separate table **`ICR_MENU_LABEL`**.

This document records **what has been done**, the **rules** to follow when adding or changing labels, and **what is still in progress**.

---

## Architecture

```
Login / language switch
  → LabelService.loadForLanguage()  (LIBQUERY LAB0000002)
  → labelMap keyed by TLAID
  → templates: {{ 'S11.TITLE' | lbl:'Supplier dashboard' }}
  → revision$ bumps on reload so lbl pipe re-renders

Sidebar / header menus (separate path)
  → SET0000040 / SET0000041 + ICR_MENU_LABEL join on user language
  → MenuAccessService
```

| Layer | Location |
|--------|----------|
| Label bundle (read) | `LIBQUERY` **`LAB0000002`** — all `TRA_LABELS` rows for one `TLALANGUE` |
| Label admin / CSV | `DIC0000013`–`0015`, Dictionary screen |
| Angular service | `controlRoom_client/src/app/shared/services/labels/labels.service.ts` |
| Pipe | `controlRoom_client/src/app/shared/pipes/lbl.pipe.ts` (`I18nModule`) |
| Page titles module | `PageHeaderModule` re-exports `I18nModule` |

**Languages:** `us_US`, `en_GB`, `fr_FR` (seed all three in deploy scripts).

---

## Database rules (`TRA_LABELS`)

| Rule | Detail |
|------|--------|
| **`TLAID` max length** | **15 characters** — longer keys cause `ORA-12899`. |
| **`TLADESC` max length** | **100 characters** — split long copy across multiple keys if needed. |
| **SQL literals** | No `&` in string literals; use `SET DEFINE OFF` at top of deploy scripts. |
| **Idempotent deploy** | Use `MERGE` per `(TLAID, TLALANGUE)`; scripts are safe to re-run. |
| **`TLASCREEN`** | Set to `SCR00000000xx` for screen-owned keys, `ROUTE` for route-only pages, `COMMON` for shared chrome. |

---

## Key naming conventions

### 1. Screen codification `Sxx`

Each ICR screen has a numeric id matching the app (e.g. **S11** = Supplier dashboard, **SCR0000000011**).

| Key pattern | Use |
|-------------|-----|
| **`Sxx.TITLE`** | Page header (`app-page-header` `[heading]`) |
| **`Sxx.BTN.SRCH`** | Search button |
| **`Sxx.LBL.*`** | Field labels (`WHS`, `SUP`, `PST`, …) |
| **`Sxx.PLH.*`** | Input placeholders |
| **`Sxx.TAB.SRCH`** | Tab header “Search” where used |
| **`Sxx.DLG.UPD`** | “Update completed” dialog (per screen, not `MU.DLG.UPD` on mass screens) |
| **`Sxx.MU.*`** | Mass-update **screen-specific** wizard copy (intro, columns, execute question) |

**Rule:** Every visible string on a screen should use **`Sxx.*`** keys owned by that screen. Do **not** reuse another screen’s `Sxx` keys for different UI.

### 2. Route-only pages `RT.*`

Screens without a dedicated `SCR` id in Angular use short route keys:

| Key | Example |
|-----|---------|
| **`RT.SRCH.*`** | Corporate Inquiry |
| **`RT.CAO.*`** | CGO Setting (title `RT.CAOSET` in script 83) |
| **`RT.SCH.*`** | Supplier schedule by contract (`RT.SCHCTR` title) |
| **`RT.FPK.*`** | Picking unit change (`RT.FIXPK` title) |
| **`RT.INV.*`** | Inventory follow-up |
| **`RT.AOD.*`** | Automatic Order Dashboard body (`RT.AODASH` title) |
| **`RT.WHSBOX` / `RT.RPTBOX`** | Warehouse / Reporting toolboxes |

Keep **`TLAID` ≤ 15** — prefer `RT.SCH.PLH.COD` not `RT.SCHCTR.PLH.CODE`.

### 3. Shared chrome only — `CMN.*` and `MU.*`

Use **`CMN.*`** only for controls that are identical on many screens:

- `CMN.OK`, `CMN.CANCEL`, `CMN.SAVE`, `CMN.CSV`, `CMN.SEARCH`, `CMN.UPD.COMP`, …

Use **`MU.*`** only for the **shared mass-update wizard shell** (steps, recap dialog, template/browse/confirm buttons, link date, trace checkbox):

- `MU.BTN.TMPL`, `MU.BTN.BRWS`, `MU.BTN.CNFM`, `MU.BTN.VALD`, `MU.STP0.LBL`, `MU.DLG.RCP`, `MU.RCP.TOT`, …

**Do not put screen-specific sentences in `CMN.*` or `MU.*`.**  
Example (wrong): one `RPT.LBL.WHS` for every reporting search panel.  
Example (right): `S10.LBL.WHS`, `S11.LBL.WHS`, `S17.LBL.WHS`.

### 4. Menus — `ICR_MENU_LABEL`

- Sidebar and profile menu text: **`ICR_MENU_LABEL`** (`MENU_CODE` + `MLLANGUE`), not `TRA_LABELS`.
- Scripts: **`76_ai_menu_labels_i18n.sql`**, **`82_icr_menu_labels_standard.sql`**.

### 5. Colliding screen numbers

Two routes may share the same `SCR` id in legacy code. Use a **suffix sub-prefix**:

| Screens | Prefix | Notes |
|---------|--------|--------|
| Category Manager + SKU Dimension | **`S13.CM.*`** vs **`S13.SKU.*`** | Both `SCR0000000013` |
| Item attribute + Item retail | **`S16.ATTR.*`** vs **`S16.RTL.*`** | Both `SCR0000000016` |

For collision prefixes, **omit extra `.MU.`** in the key (use `S13.CM.SEL`, not `S13.CM.MU.SEL`) so `TLAID` stays ≤ 15.

### 6. Mass-update per-screen body keys

| Suffix | Meaning |
|--------|---------|
| **`.SEL`** | First line: “Select your … file change.” |
| **`.XLS`** | “The XLS(x) Excel file should contain N columns:” |
| **`.CA` … `.CJ`** | Column list items (`COLUMN A: …`) |
| **`.CNM`** | Column header names line after `MU.FILE.HINT` |
| **`.WHEN`** | “When do you want to execute …?” |
| **`.STP0`** | Step 0 title passed to `buildMassUpdateMenuItems()` |

Helper: `controlRoom_client/src/app/shared/i18n/mass-update-i18n.helper.ts`

```typescript
buildMassUpdateMenuItems(this._labels, this._labels.text('S13.CM.STP0', 'Select your …'));
```

Subscribe to **`this._labels.revision$`** and rebuild `menuItems` on language change (pattern in mass-update `.ts` files).

---

## Angular rules

### Template

```html
<!-- Static attribute -->
<button pButton [label]="'S11.BTN.SRCH' | lbl:'SEARCH'"></button>

<!-- Interpolation -->
<span>{{ 'S11.LBL.WHS' | lbl:'Warehouse :' }}</span>

<!-- Placeholder -->
<input [placeholder]="'S11.PLH.CODE' | lbl:'Enter a code or a description'" />

<!-- Page title -->
<app-page-header [heading]="'S11.TITLE' | lbl:'Supplier dashboard'" …>
```

- Always provide an **English fallback** as the second `lbl` argument (shown if the key is missing in DB).
- Import **`I18nModule`** (or `PageHeaderModule`) in the feature module.

### TypeScript (dynamic columns, charts, toasts)

```typescript
constructor(private _labels: LabelService) {}

private t(key: string, fb: string): string {
  return this._labels.text(key, fb);
}

ngOnInit() {
  this._labels.revision$.subscribe(() => this.refreshTableLabels());
}
```

Use for `col.header`, chart titles, and `MessageService` summaries — not only HTML.

### CSS

- Scope component styles with **`:host ::ng-deep`**.
- **Never** use global selectors like `.p-tabview …` at file root without `:host` — they leak to other screens (e.g. Next PPG crimson tabs broke Alert Log Journal; fixed by scoping `next.ppg.component.scss`).

### After DB or client changes

1. Deploy SQL scripts on ICR DB.
2. Restart **`ng serve`** and hard-refresh the browser (language switch alone does not load new TypeScript).

---

## Deploy script order (i18n-related)

Run on **ICR app DB** in order (later scripts MERGE over earlier rows):

| Order | Script | Purpose |
|------:|--------|---------|
| 1 | `65_language_and_menu_label_ddl.sql` | DDL `LANGUAGE`, `ICR_MENU_LABEL` (once) |
| 2 | `66_menu_label_libquery.sql` | Menu LIBQUERY + `SET0000040` language |
| 3 | `67_tra_labels_bulk_libquery.sql` | `LAB0000002`, dictionary LIBQUERY |
| 4 | `68_menu_label_us_us_seed.sql` | Menu `us_US` seed |
| 5 | `69`–`74` | Settings / AI / language display seeds |
| 6 | `75`–`78` | AI titles + body (phase 5–6) |
| 7 | `79_tra_labels_settings_phase6.sql` | Settings body |
| 8 | `80_tra_labels_icr_screen_titles.sql` | **`Sxx.TITLE`** for all screens |
| 9 | `81_tra_labels_icr_common_ui.sql` | Login, `MU.DLG.*`, recap shell |
| 10 | `82_icr_menu_labels_standard.sql` | Standard sidebar French menus |
| 11 | `83_tra_labels_icr_titles_patch.sql` | Title patches + `RT.*` titles |
| 12 | `84_tra_labels_icr_body_common.sql` | **`CMN.*`**, shared **`MU.*`** wizard |
| 13 | `85_tra_labels_mass_update_body.sql` | Extra `MU.*` (buttons, when, file hint) |
| 14 | `86_tra_labels_reporting_body.sql` | Reporting S02/S04/S10/S11/S17 bodies |
| 15 | `87_tra_labels_ops_body.sql` | Ops, schedules, `RT.CAO`/`RT.SCH`/`RT.FPK` |
| 16 | `88_tra_labels_ai_stubs_body.sql` | AI stub screens S71–S86 |
| 17 | `89_tra_labels_icr_per_screen_search.sql` | Per-screen search keys (no `RPT.*`) |
| 18 | `90_tra_labels_icr_body_phase10.sql` | S09 journal, S11 cards/columns, S04 filter, … |
| 19 | `91_tra_labels_mass_update_screens.sql` | Per-screen mass wizard body (`Sxx.MU.*`, `S13.CM.*`, `S13.SKU.*`, `S16.ATTR.*`, `S16.RTL.*`) — 204 keys |

**Cancelled / do not use:** `89_tra_labels_icr_body_phase9.sql` (consolidated `RPT.*` / `CMN.TAB.SRCH` — rejected).

---

## Work completed

### Phase 1 — Foundation

- [x] `LANGUAGE` + `ICR_MENU_LABEL` DDL; menu LIBQUERY; `LAB0000002` label bundle.
- [x] `LabelService`, `lbl` pipe, `revision$` on language switch.
- [x] Settings: language dropdown, Dictionary CSV/coverage, menu translation tab.
- [x] Widget library + dashboard widget labels (`70`, `71`).

### Phase 2 — Screen titles and menus

- [x] **`Sxx.TITLE`** on ~90+ screens via `app-page-header`.
- [x] French **`ICR_MENU_LABEL`** for AI (`76`) and standard ICR (`82`).
- [x] Dynamic sidebar + header profile menu (`SET0000040` / `0041`).

### Phase 3 — Body labels (per-screen policy)

- [x] Shared **`CMN.*`** / wizard **`MU.*`** (`84`, `85`, `81`).
- [x] Reporting / ops / AI stubs (`86`–`88`).
- [x] Per-screen search panels **`Sxx.BTN.SRCH`**, **`Sxx.LBL.*`**, **`Sxx.PLH.*`** (`89`) — no cross-screen `RPT.*`.
- [x] Phase 10 (`90`): S09 mass journal, S11 supplier dashboard KPIs + table headers (TS + HTML), S17 UBD, S04 cycle filter, S41 report filter, RT.AOD dashboard, S35/S31/S40/S05 samples.
- [x] ~20 mass-update wizard screens: shared shell (`MU.*`, recap dialog, `buildMassUpdateMenuItems`, `revision$`) plus per-screen body (`SEL`, `XLS`, `CA`–`CJ`, `CNM`, `WHEN`, `STP0`) in HTML and script **`91`**.
- [x] S14 AI Assistant UX gating (`USERAIADMIN`) documented in `CLAUDE.md`.
- [x] Alert Log Journal tab styling leak fixed (`next.ppg` / `robot` global `.p-tabview` scoped).

### Angular modules

- Mass-update screens import `PageHeaderModule` (includes `lbl`).
- `FilterModule` imports `I18nModule` for S04 cycle dashboard filter panels.

---

## Work in progress (May 2026)

### Still English (typical gaps)

- Schedule screens: Validate / Review schedules / GENERATE buttons.
- Warehouse toolkit warning paragraphs.
- Syndigo form fields.
- `col.header` in `.ts` on many grids (only S11 supplier dashboard done as reference).
- Mass-update toasts / `msgFinalDisplayed` strings in `.ts`.
- Alert Log Journal inner card (title in card header still hardcoded; tabs fixed).
- Item brand (`S06`) — different layout, not mass wizard.

---

## Quick checklist for a new screen

1. Add **`Sxx.TITLE`** (and `Sxx.DLG.UPD` if needed) in `80` or a new numbered script.
2. List every English string in `.html` and `.ts`.
3. Add **`Sxx.LBL.*` / `Sxx.BTN.*`** keys (≤15 chars, ≤100 char desc).
4. Wire `{{ 'Sxx.KEY' | lbl:'English fallback' }}` or `[label]="'Sxx.KEY' | lbl:'…'"`.
5. Import **`I18nModule`** in the feature module.
6. For dynamic headers: inject **`LabelService`**, refresh on **`revision$`**.
7. MERGE **`us_US`**, **`en_GB`**, **`fr_FR`** in SQL.
8. Deploy script, restart Angular, test `fr_FR`.

---

## Reference — key files

| Path | Role |
|------|------|
| `deployment/database/SCRIPTS/I18N_SCREEN_TRANSLATION.md` | This document |
| `deployment/database/SCRIPTS/80–91_tra_labels_*.sql` | Label seeds |
| `controlRoom_client/src/app/shared/services/labels/labels.service.ts` | Runtime lookup |
| `controlRoom_client/src/app/shared/pipes/lbl.pipe.ts` | Template pipe |
| `controlRoom_client/src/app/shared/i18n/mass-update-i18n.helper.ts` | Mass wizard steps |
| `controlRoom_client/scripts/wire-mass-update-i18n.js` | Regenerate `91` + patch mass HTML/TS |
| `CLAUDE.md` | Broader project context (AI, LIBQUERY, menus) |

---

*Last updated: May 2026 — mass-update script 91 generated; deploy after `90` on ICR DB.*
