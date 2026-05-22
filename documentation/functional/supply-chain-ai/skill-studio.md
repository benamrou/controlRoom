# Skill studio

## Purpose

**Designers** author and maintain how the AI engine understands language and runs SQL — without Node deploys for each new phrase.

## Screens

| Screen | Route | Purpose |
|--------|-------|---------|
| Template skill library | `/ai/skill-studio/library` | Browse skill templates |
| Skill builder | `/ai/skill-studio/builder` | Edit skill, vocabulary, SQL templates, parameters JSON |
| Pending phrasings | `/ai/skill-studio/pending-phrasings` | Curate low-confidence / thumbs-down phrases |
| Phrasing playground | `/ai/skill-studio/playground` | Test routing diagnostics (`/api/ai/engine/diagnose`) |

## What designers edit

- **Vocabulary** — `INTENT_PHRASE`, `JARGON`, `BIND_HINT`, `SYNONYM`, boosts.
- **SQL templates** — Oracle SQL with `:binds`; `parameters_json` for types/required flags.
- **Playbook** — conversational hints (where enabled).

## BIND_HINT example

Phrase `store id` → entity `site_id` so analysts can type “item 100100 at store 10” without code changes.

## Curation loop

1. Analyst misses route → logged to unresolved queue.  
2. Designer promotes phrase to vocabulary or adjusts skill.  
3. Optional **auto-promote** on repeated overrides.

## Who may use it

`USERAIDESIGNER` or `USERAIADMIN`.

## Technical

LIBQUERY `AI0000040`–`AI0000060`, engine reads `AI0000061`–`64` — [AI LIBQUERY catalog](technical/supply-chain-ai/libquery-catalog.md)
