# Reporting box

## Purpose

Executive and operational **dashboards** for ordering, suppliers, warehouse replenishment quality, accounts payable receiving, and fill rate — without exporting to a separate BI tool for day-to-day monitoring.

## Who may use it

**IT**, **Tech Services**, and **Data integrity** (per menu rules). Supply chain operations staff typically receive access via data integrity or a custom profile.

## Screens

| Screen | Route | Business question |
|--------|-------|-------------------|
| Automatic Order | `/scorecardcao` | How is CAO performing vs targets? |
| PI adjustment | `/dashboardcycle` | Periodic inventory adjustment dashboard |
| Supplier service | `/dashboardsupplier` | Supplier on-time / service KPIs |
| Whs Repl. | `/qualitywhsreplenishment` | Warehouse replenishment quality |
| Smart UBD | `/smartubd` | Use-by date risk (UBD) |
| AP Receiving | `/dashboardreception` | Accounts payable receiving status |
| DSD / Warehouse fill rate | `/fillrate` | Fill rate by channel |

## How operations uses this

1. Start with **fill rate** and **supplier service** for weekly ops reviews.
2. Drill exceptions via [Search](functional/icr-standard/search-and-inquiry.md) or [AI Assistant](functional/supply-chain-ai/ai-assistant.md).
3. Use [Data health](functional/supply-chain-ai/data-health.md) for **pipeline** failures (data not loaded) vs **performance** KPIs here.

## Technical

Dashboards use **widget SQL** / LIBQUERY widgets configured per environment — see [Technical architecture](technical/architecture-overview.md).
