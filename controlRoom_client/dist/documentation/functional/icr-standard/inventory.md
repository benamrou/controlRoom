# Inventory

## Purpose

Monitor and manage **inventory position** and **third-party counting** activities across the GOLD-linked environment.

## Who may use it

**Buyer**, **Helpdesk**, **IT**, and **Data integrity** flags (see [Navigation and access](functional/navigation-and-access.md)).

## Screens

### Inventory follow-up (`/inventory`)

Operational view of stock follow-up — exceptions, layers, or site-level issues depending on widget configuration. Used by buyers and helpdesk to answer “what is wrong with inventory for this item/site?” before escalating to mass stock-layer changes.

### Third-Party counting (`/counting`)

Supports **external counting** processes — importing or reconciling count events with GOLD. Used during physical inventory programs or third-party audit cycles.

## Business notes

- Always align with the **selected GOLD environment**; central vs stock schema affects which sites appear.
- Persistent corrections at scale belong in [Mass-change → Stock layer](functional/icr-standard/mass-change-screens.md), not one-off counting UI, unless your runbook says otherwise.
- Supply Chain AI **stock** skills (when deployed) complement this area — see [Data health](functional/supply-chain-ai/data-health.md) for pipeline checks (e.g. negative stock, sales not loaded).
