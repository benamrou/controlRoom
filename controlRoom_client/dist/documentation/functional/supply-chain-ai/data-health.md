# Data health

**Route:** `/ai/data-health` · Config: `/ai/data-health/config`

![Data health dashboard](assets/screenshots/data-health-dashboard.svg)

## Purpose

Detect **silent pipeline failures** (sales not loaded, receipt not processed, item without supplier, etc.) before replenishment and AI analysis confidently wrong numbers.

## Dashboard (S24)

- Cards grouped by **category** (Item master, Ranging, Orders, Receipts, Stock, Sales).
- **REALTIME** checks pulse when critical issues exist.
- **Run now** triggers `AI_RUN_DATA_CHECKS` for a tier.
- **Investigate** opens AI Assistant with skill and entities pre-loaded.

## Schedules

| Tier | Frequency | Examples |
|------|-----------|----------|
| REALTIME | ~5 min | Sales not loaded, receipt not loaded |
| HOURLY | Hourly | Order rejected, qty gap |
| NIGHTLY | 2am | Item master, ranging, dead stock |

## Configuration (S25)

Admins define checks: LIBQUERY count id, severity, drill skill — see functional config doc in [Technical catalog](technical/supply-chain-ai/libquery-catalog.md) (`AI0000085`–`89`).

## Who may use it

- **Analyst / operations:** dashboard, investigate.  
- **AI admin:** configuration screen.

## Related

- Classic [Alerts](functional/icr-standard/alerts.md) — avoid duplicate monitors without coordination.
