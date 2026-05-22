# Context learning

**Route:** `/ai/context-learning`

## Purpose

Capture **15 knowledge catalog items** (P1–P3) that define how this retailer interprets GOLD data — e.g. what “active item”, “DSD eligible”, and “promotion active” mean in SQL.

## Priority tiers

**P1 (required before view generation):**  
ITEM_ACTIVE, ITEM_INACTIVE, STOCK_AVAILABLE, PROMOTION_ACTIVE, POS_SALES

**P2–P3:** Supplier hold, recall, lead time, ranging, PO status, waste, new item, shelf life, site codes, upcoming promo, DSD eligible, etc.

## Workflow

1. Start session per retailer.
2. Answer guided Q&A; propose and validate SQL conditions.
3. Lock item when confidence ≥ 95% — may trigger `AI_GENERATE_ACTIVE_ITEM_VIEW` for per-retailer active item view.

## Who may use it

AI admin / designer with retailer knowledge from business SMEs.

## Outcome

Locked context feeds AI skills and `V_GOLD_ACTIVE_ITEM_{RETAILER_ID}` — analysts get consistent “active assortment” definition in Assistant and templates.
