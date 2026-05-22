# Warehouse box

## Purpose

Quick **warehouse floor** tools on the GWR/stock side: picking units, pallets, labels, and production numbers.

## Who may use it

**Helpdesk** and **Warehouse** flags.

## Screens

| Screen | Route | Use |
|--------|-------|-----|
| Fix Picking unit | `/fixpickingunit` | Correct picking unit assignment when WMS/GOLD mismatch blocks picks |
| Release pallet | `/releasepallet` | Release held pallets blocking movement |
| Pallet label | `/palletlabel` | Reprint or generate pallet labels |
| Production number | `/productionnumber` | Maintain production lot references on warehouse flows |

## Safety

These screens can affect **live picking and shipping**. Confirm site/warehouse context with operations before executing in production.

## Related

- [Helpdesk — Warehouse all services](functional/icr-standard/helpdesk.md)  
- Supply Chain AI warehouse skills (future) — schema via S02 on GWR
