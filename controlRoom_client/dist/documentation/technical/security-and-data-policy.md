# Security and data policy

## LLM / AI policy

Supply Chain AI is **rule-based**:

- No calls to Anthropic, OpenAI, or other external inference APIs.
- No on-server local LLM (disk/policy constraints).
- Routing uses `ai.lexical.js` (stem, n-grams, vocabulary overlap).
- Answers use `ai.composer.js` templates filled from **actual SQL rows**.

Architectural reviews should treat the engine as an **expert system + SQL executor**, not generative AI.

## Credentials

- GOLD passwords and DB links live in **CORPENV** / server config — not in Angular.
- `USERSROOM.USERPASS` stored **Base64-encoded**; admin MERGE encodes on save; self-service `SET0000024` same encoding.
- Never log raw passwords or full connection strings in client console.

## Data residency

Query execution runs on ICR app server → Oracle → GOLD via DB link. Data does not leave this chain for AI routing/synthesis.

## Access control

- Menu: `ICR_MENU_ENTRY` + rules + profiles (`SET0000040`).
- Route guard on every `app-routing` business route.
- Admin queries `QUERYACCESS = 0` on sensitive SET/AI DML.

## Audit

- Mass journal and alert journal retain execution history.
- `AI_ENGINE_INTERACTION_LOG` / unresolved queue for AI feedback.
- Designers change skills in DB — version via deploy scripts and change control.

## Hardening checklist

- [ ] Restrict Query runner to IT-only flag  
- [ ] Separate preprod/prod CORPENV; train users on header indicator  
- [ ] Re-login after privilege changes  
- [ ] Do not expose `QUERYACCESS=0` queries to general roles
