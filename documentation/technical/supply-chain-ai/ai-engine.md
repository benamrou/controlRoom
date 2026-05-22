# AI engine

## Location

`controlRoom_server/server/server/controller/ai/`

| File | Role |
|------|------|
| `ai.engine.js` | Routes: `/route`, `/execute`, `/diagnose`, `/diagnose-chain` |
| `ai.lexical.js` | Normalize, stem, n-grams, `extractBindsFromHints` |
| `ai.composer.js` | `synthesize`, `synthesizeDiagnostic`, clarification text |
| `ai.schema.js` | Schema scan orchestration |
| `ai.retailer.js` | ping-dblink |
| `ai.view.js` | `AI_GENERATE_ACTIVE_ITEM_VIEW` |

Registered in `server_admin.js`.

## Call flow — route

```
POST /api/ai/engine/route
  → readActiveSkills (AI0000061)
  → readVocabulary (AI0000062)
  → readPlaybook (AI0000063, optional)
  → extractVendorText, extractSiteId, extractEntitiesFromBindHints
  → detectIntent (RETRIEVAL / GENERAL / DIAGNOSTIC)
  → scoreSkills (lexical overlap × weights; Phase 11 vendor dampener)
  → optional ENGINE_VENDOR_RESOLVE on GOLD (AI0000064 template)
  → response: selected_skill, entities, alternatives, routing_diagnostics
```

**Threshold:** `UNRESOLVED_SCORE_THRESHOLD = 45` → `low_confidence`.

## Call flow — execute

```
POST /api/ai/engine/execute
  → buildExecuteContext (body + entities + bindings)
  → readTemplatesBySkill (AI0000064)
  → pickExecutionTemplate (skip ENGINE_*; bind feasibility)
  → renderTemplateForExecution (:name literals)
  → runQuery on GOLD @ DB link
  → composer.synthesize → human_summary, evidence_facts, follow_up_hint
```

**API rename:** composer `insights` → response `evidence_facts`.

## Call flow — diagnose-chain

```
POST /api/ai/engine/diagnose-chain
  → AI0000100 steps ordered
  → run templates until stop condition
  → AI0000101 conclusion template
  → synthesizeDiagnostic
```

## Custom routes rationale

Engine orchestration is multi-step; reads use LIBQUERY; GOLD execution uses same bind pipeline as templates.

## Client

`ai.assistant.component.ts` — route then execute; enrichment override for `ITM_FULL_ATTRIBUTES`; admin-only diagnostics when `USERAIADMIN`.

## Tuning

| Constant | Value | Effect |
|----------|-------|--------|
| `UNRESOLVED_SCORE_THRESHOLD` | 45 | Unresolved queue + clarification chips |
| `ALTERNATIVES_CONFIDENCE_THRESHOLD` | 50 | Reserved for server-side chip gating |

## Tests

`ai.lexical.test.js` — run from controller directory:

```bash
node ai.lexical.test.js
```

## Full reference

Repository root `CLAUDE.md` — engine sections, skill packs, deploy phases.
