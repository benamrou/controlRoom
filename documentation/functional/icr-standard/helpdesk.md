# Helpdesk

## Purpose

The Helpdesk menu gives operations and IT-adjacent staff **fast corrective actions** on GOLD and warehouse services without navigating full ERP menus. It is aimed at **incident response** and **repeatable fixes**, not bulk master-data maintenance (use [Mass-change box](functional/icr-standard/mass-change-box.md) for that).

## Who may use it

Users with the **Helpdesk** flag (`USERHELPDESK`) see this group. Individual screens may also appear for IT or warehouse roles via overlapping flag rules.

## Screens

### Robot (`/robot`)

Runs predefined **automation robots** — scripted checks and fixes configured on the server (batch/XML definitions under `controlRoom_server/server/`). Use when runbooks point to a named robot for a recurring issue.

**Typical use:** trigger a validated remediation after helpdesk ticket classification.

### Warehouse all services (`/whsrestartservices`)

Restarts **warehouse (GWR) services** as a group. High impact — use only when warehouse operations confirm a service hang or post-maintenance recovery.

### Services center (`/servicescenter`)

Operational **service control center** for starting/stopping or monitoring ICR-related services (implementation uses shared process/widget services).

### Order urgency (`/orderurgent`)

Marks or processes **urgent purchase orders** per business rules — used when stores or vendors need escalation outside normal CAO cycles.

## Operating guidelines

1. Confirm **environment** (preprod vs prod) in the header before any action.
2. Prefer **Robot** when a named runbook exists; avoid ad-hoc restarts without ops approval.
3. Document ticket ID and action in your helpdesk system — ICR journal/alerts may not replace ITSM records.
4. If a fix requires bulk data correction, hand off to **Data integrity** for mass-change.

## Related

- [Warehouse box](functional/icr-standard/warehouse-box.md) — pallet and picking tools  
- [I.T. operations](functional/icr-standard/it-operations.md) — batch and query runner  
- [Technical: Helpdesk & batch](technical/icr-standard/helpdesk-and-batch.md)
