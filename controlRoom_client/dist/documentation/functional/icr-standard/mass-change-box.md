# Mass-change box

![Mass-change workflow](assets/screenshots/mass-change-workflow.svg)

## Purpose

The mass-change box lets **data integrity** (and selected warehouse users for monitoring) apply **bulk updates** to GOLD master data and related objects using controlled Excel templates. Each screen is a separate business process (attributes, hierarchy, PO push, stock layer, etc.) with the same overall workflow.

## Who may use it

| Access | What you see |
|--------|----------------|
| **Data integrity** flag or `DATA_INTEGRITY` profile | All mass-change routes in the sidebar |
| **Warehouse** flag | **Journal only** — track executions, not launch loads |

Buyers and helpdesk users do not receive the full mass-change menu unless explicitly granted data integrity rights.

## Standard workflow (every screen)

1. **Download template** — button loads the official `ICR_TEMPLATE###` Excel layout for that tool.
2. **Fill data** — follow column headers; use preprod for trials.
3. **Upload file** — ICR validates structure and business rules server-side.
4. **Review validation** — fix errors in the spreadsheet; re-upload if needed.
5. **Execute** — immediate or **scheduled** run (depending on screen).
6. **Confirm in Journal** — open [Journal](functional/icr-standard/mass-change-screens.md#journal) (`/massjournal`) for status, scope, and errors.

## When to use mass load vs GOLD

| Use mass-change when… | Use GOLD native maintenance when… |
|------------------------|-------------------------------------|
| Hundreds/thousands of rows | Single-item correction |
| Repeatable file from vendor/MDM | Real-time desk investigation |
| Change is approved and auditable | Emergency one-off with full GOLD trace |

## Environment

Mass loads honor the **header GOLD environment**. Running against production requires appropriate change control. Wrong environment is a common cause of “successful” loads that do not appear where analysts expect.

## Screen catalog

- [Mass-change screens](functional/icr-standard/mass-change-screens.md) — quick route index  
- **[Mass-change SME reference](functional/icr-standard/mass-change-sme-reference.md)** — column specs, business rules, sign-off checklist (for data integrity SMEs)

![Mass journal](assets/screenshots/mass-journal.svg)

## Related

- [Alerts](functional/icr-standard/alerts.md) — may fire on data anomalies mass load is meant to fix  
- [Technical: Mass-load architecture](technical/icr-standard/mass-load-architecture.md)
