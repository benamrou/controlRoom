# AI Assistant

**Route:** `/ai/assistant`

![AI Assistant layout](assets/screenshots/ai-assistant.svg)

## Purpose

Primary **analyst** screen: ask operational questions in plain language, get routed to a skill, see SQL-backed answers and optional result tables.

## Typical questions

- “What DSD items can we buy from Lipari at store 7?”
- “Tell me about item 100100.”
- “Why is item 100100 not shipping from the warehouse?” (diagnostic chain when deployed)

## How it works (analyst view)

1. You type a question; optional context (retailer, site, vendor) in **Active context**.
2. ICR **routes** to the best skill (or asks clarification if confidence is low).
3. ICR **executes** approved SQL on GOLD and shows a **summary** plus evidence bullets.
4. Low confidence → pick an alternative skill chip or refine wording.

## Item card enrichment

After an item header result, you can say **“add retail price”**, **“add EAN codes”** — the assistant re-runs a richer template on the same item (may ask **which store** for retail).

## Roles

| User | Experience |
|------|------------|
| Analyst | Chat, results, enrichment chips, thumbs up/down |
| AI admin | + Engine diagnostics, SQL artifacts, designer retry panel |

## Feedback

Thumbs down and weak routes feed **Pending phrasings** for designers to promote better vocabulary.

## Related

- [Skill studio](functional/supply-chain-ai/skill-studio.md)  
- [Data health](functional/supply-chain-ai/data-health.md) — Investigate button pre-loads context  
- [Technical: AI engine](technical/supply-chain-ai/ai-engine.md)
