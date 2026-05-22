# Computer ordering (CAO)

## Purpose

**Computer-assisted ordering (CAO)** parameters drive automatic replenishment proposals in GOLD. ICR exposes configuration and gap detection for buyers and data integrity.

## Screens

| Screen | Route | Purpose |
|--------|-------|---------|
| CAO setting | `/caoconfig` | View and maintain CAO parameters by vendor/store scope |
| CAO missing | `/caomissing` | Find missing CAO parameters (e.g. mass-generate scenarios noted in release 4.6.07) |

## Who may use it

**Buyer** and **Data integrity**.

## Business notes

Missing CAO rows often surface as “no order generated” store complaints — use **CAO missing** before changing ARTREAP manually in GOLD.

## Related

- [Reporting — Automatic Order scorecard](functional/icr-standard/reporting-box.md)  
- Supply Chain AI `REPLEN_NOT_TRIGGERED` diagnostic (when deployed)
