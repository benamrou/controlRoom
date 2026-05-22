# Alerts

## Purpose

ICR **alerts** monitor GOLD and operational data on a schedule (or live track) and notify users by **email** (Excel attachment) and/or **ICR text** (SMS-style message with row counts).

## Who may use it

**IT**, **Tech Services**, and **Data integrity**.

## Screens

| Screen | Route | Purpose |
|--------|-------|---------|
| Journal | `/alerts-journal` | History of alert runs |
| Watch dog | `/alerts-watch` | Watch configurations |
| Alerts management | `/alerts-icr` | Create/edit alert definitions |
| Filter config. | `/reportfilter` | Reporting filters tied to alert distribution |

## Alert types (conceptual)

- **Scheduled** — email with Excel at defined times.
- **Live track** — notify when condition hits during monitoring window.

## How a run works

1. A **cron script** or **Watch** shell calls `GET /api/notification/?PARAM=…` with headers (`USER`, `DATABASE_SID`, `LANGUAGE`, optional `SUBJECT_EXT`, `FILENAME_EXT`).
2. The server loads the alert row (`NOT0000001`), then uses **`ALTSQL`** from the database when present; otherwise it reads the XML file path in **`ALTFILE`**.
3. **`QUERY`** (first sheet) drives the **HTML preview** in the email body and the row count in the subject (`[N Object(s)]`).
4. Every **`QUERY`**, **`QUERY2`**, **`QUERY3`**, … becomes a **worksheet** in the `.xlsx` attachment (tab names from **`NAME`**, **`NAME2`**, …).
5. Optional **`FORMATXLS`** JSON on each sheet applies **conditional formatting**, number formats, and Excel auto-filters after the grid is built.

See [Alerts engine](technical/icr-standard/alerts-engine.md) for the full XML element reference and `FORMATXLS` schema.

## Configuration concepts

### Alert definitions (where the XML lives)

The query and Excel formatting are one **`<ROOT>` … `</ROOT>`** document (see [Alerts engine](technical/icr-standard/alerts-engine.md)). Everything else on the alert — subject, recipients, schedule, print options — is on the **`ALERTS`** row in the ICR database.

| Storage | Column | Preferred? | How you maintain it |
|---------|--------|------------|---------------------|
| **Database** | `ALTSQL` (CLOB) | **Yes — default for new and changed alerts** | **Alerts management** (`/alerts-icr`) — *SQL Query & Formatting (XML)* textarea; save with the alert row |
| **Server file** | `ALTFILE` (path) | Legacy / exception | Same screen: set file path and use the **File** control to open or sync XML under `controlRoom_server/server/alerts/` (e.g. `BELOW_XDAYS.xml`, `FCST_ZERO.xml`, `LOS_ATTRI_MOVEMENT.xml`) |

At run time, `notification.js` checks **`ALTSQL` first**. Only if it is empty does it read **`ALTFILE`** from disk. Prefer the database so definitions travel with backups, preprod/prod promotion, and the UI — without a separate deploy step for every SQL change.

File-based XML remains supported for older alerts and for operators who still edit repo files; the tool covers both, but **new work should go in `ALTSQL`**.

1. **Recipients** — users or groups on the alert schedule.
2. **Printing / format** — orientation, margins, freeze panes, etc. on the same `ALERTS` row (`ALTORIENTATION`, `ALTFREEZEHEADER`, …), separate from the XML body.
3. **Subject line** — base text from `ALTSUBJECT` on the alert row, plus **`SUBJECT_EXT`** from the HTTP header (scheduler scripts set this per warehouse, date range, etc.). XML tags **`HEADER`** / **`HEADERIFEMPTY`** are **documentation for operators** (what to put in `SUBJECT_EXT` when data exists vs. empty); the Node engine does not read them automatically.

## Example — warehouse fill rate (multi-sheet + Excel formatting)

Production pattern: warehouse fill rate by category (same structure as **`WHS_FILL_RATE_CAT.xml`** on disk — two worksheets, recap row). Store the XML in **`ALTSQL`** when maintaining via the UI; the file is the historical reference. A richer variant adds **`TABCOLORXLS`**, **`FORMATXLS`**, and conditional rules (red/green on short quantities, bold green recap row, percent formats).

**Typical `PARAM` usage:** `PARAM=<alert_id>&PARAM=<warehouse_site_id>&PARAM=…` — bind as `:param1`, `:param2`, … in SQL (same order as `PARAM` values after the alert id).

**Scheduler call (simplified):**

```bash
curl -s \
  -H 'USER: alert' \
  -H 'DATABASE_SID: HEINENS_CUSTOM_PROD' \
  -H 'LANGUAGE: HN' \
  -H 'SUBJECT_EXT: for Grocery whs #90061' \
  'http://localhost:8092/api/notification/?PARAM=BUY0000000006&PARAM=90061&PARAM=2026-05-19' \
  -L
```

**XML shape (abbreviated — full SQL omitted):**

```xml
<ROOT>
  <TABCOLORXLS>BE2528</TABCOLORXLS>
  <NAME>Fill rate by Cat.</NAME>
  <QUERY>
    /* Sheet 1: recap row (Notes = 'Recap') UNION detail by category */
    SELECT … AS "Category code desc.", … AS "Fill rate", … AS "Notes" FROM …
  </QUERY>
  <FORMATXLS>
  {
    "conditionalRule": [
      {
        "easeRule": { "repeat": "1", "lineStart": "6", "columnStart": "AA", "columnEnd": "AD", "every": "1" },
        "style": { "numFmt": "0.00%" }
      },
      {
        "easeRule": { "repeat": "0", "lineStart": "5", "columnStart": "A", "columnEnd": "J" },
        "rules": [{
          "ref": "A5:J99999",
          "rule": [{
            "type": "expression",
            "formulae": ["$J5=\"Recap\""],
            "style": { "font": { "bold": "true", "size": "12" },
                       "fill": { "type": "pattern", "pattern": "solid",
                                 "bgColor": { "argb": "ffB7DE2F" } } }
          }]
        }]
      },
      {
        "easeRule": { "repeat": "1", "lineStart": "6", "columnStart": "AA", "columnEnd": "AD", "every": "1" },
        "rules": [{
          "ref": "",
          "rule": [
            { "priority": "1", "type": "containsText", "operator": "containsText", "text": "-",
              "style": { "fill": { "bgColor": { "argb": "fff44336" } } } } },
            { "priority": "2", "type": "containsText", "operator": "notContainsBlanks",
              "style": { "fill": { "bgColor": { "argb": "ffa4ffa4" } } } } }
          ]
        }]
      }
    ]
  }
  </FORMATXLS>

  <NAME2>Fill rate by Cat. Vendor</NAME2>
  <QUERY2>
    /* Sheet 2: same metrics at supplier level */
    SELECT … FROM …
  </QUERY2>
  <TABCOLORXLS2>244062</TABCOLORXLS2>
  <FORMATXLS2>{ "conditionalRule": [ … ] }</FORMATXLS2>

  <HEADER>Warehouse fill rate by cat</HEADER>
  <HEADERIFEMPTY>No Warehouse fill rate by cat</HEADERIFEMPTY>
</ROOT>
```

**What analysts see:** email subject like `Warehouse Fill Rate for Grocery whs #90061 [142 Object(s)]`, HTML table from sheet 1, attachment with red/green **NS** (not-shipped) cells, **Recap** row highlighted, and a second tab for vendor breakdown.

## Relationship to Supply Chain AI Data health

| Alerts (classic ICR) | Data health (AI module) |
|----------------------|-------------------------|
| User-defined XML/query alerts | Catalog-driven checks with Investigate → AI Assistant |
| Long-standing operational monitors | Pipeline integrity before analytics |

Both can fire on similar issues (e.g. negative inventory); avoid duplicate definitions without coordination.

## Technical

[Alerts engine](technical/icr-standard/alerts-engine.md)
