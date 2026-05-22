# Syndigo

## Purpose

**Syndigo** integration brings product content (attributes, images, dimensions) from the Syndigo network into Heinens MDM/GOLD. The three screens mirror the content lifecycle: find → collect → publish.

## Who may use it

**Helpdesk**, **IT**, **Space planning**, and **Data integrity** (see menu flag matrix). Space planners often use Search and Collect; data integrity owns MDM push quality.

## Screens

### Search (`/syndigosearch`)

Look up Syndigo products and link them to GOLD items. Used to verify GTIN/EAN alignment before collect or update.

### Collect (`/syndigocollect`)

**Collect** assets and attribute payloads from Syndigo into the staging area ICR uses before GOLD update.

### Syndigo to MDM (`/syndigoupdate`)

Pushes approved content into MDM/GOLD. May chain **SKU dimension** (tool 7) and **SKU images** (tool 11) import executions — coordinate with [SKU dimension](functional/icr-standard/mass-change-screens.md) mass process when bulk files are involved.

## Workflow (recommended)

1. Search — confirm correct Syndigo record and GOLD LU.
2. Collect — download/sync content.
3. Review in MDM/staging (outside ICR if your process requires).
4. Syndigo to MDM — execute push in preprod first.
5. Validate in GOLD (Search or AI Assistant item card).

## Related

- [Space Planning](functional/icr-standard/space-planning.md) — dimensions and pictures  
- [Mass-change screens](functional/icr-standard/mass-change-screens.md) — SKU dimension / images tools
