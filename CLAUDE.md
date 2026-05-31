# Supply Chain AI — Claude Context File

## Project overview
Adding a Supply Chain AI module to the Inventory Control Room (ICR) application for Heinens Grocery Store.
The AI engine learns retailer-specific GOLD ERP business rules through a Q&A-driven context learning process,
then generates per-retailer Oracle views and operational intelligence.

---

## Repository
- GitHub: https://github.com/benamrou/controlRoomIA
- Local: /Users/bbsymphony/Workspace/controlRoomIA/controlRoomIA

---

## Tech stack
| Layer | Technology |
|---|---|
| Frontend | Angular 14, PrimeNG 14.1.1 |
| Backend | Node.js, Express 4 |
| Database | Oracle (ICR app DB + GOLD ERP DB via DB link) |
| ORM | oracledb 6 via SQL utility (SQL.executeQuery etc.) |

---

## ⚠️ Architecture rules — MANDATORY

### 1. All data access via LIBQUERY
Every query — GET and POST/DML — must be stored in the LIBQUERY table.
No inline SQL is permitted in Angular services, components, or Node.js controllers.

**GET queries (read-only):**
```typescript
// Angular service — always use QueryService
this._query.getQueryResult('AI0000001', [param1, param2]);
// Pass ['-1'] for queries with no parameters (QueryService requires at least one param)
```

**POST/DML queries (writes):**
```typescript
// Angular service — always use QueryService
this._query.postQueryResult('AI0000007', [{ COL1: val1, COL2: val2 }]);
// Body sent as { values: [{...}] } by QueryService internally
```

**LIBQUERY table structure (ICR app DB):**
| Column | Meaning |
|---|---|
| QUERYID | Numeric PK — **no Oracle sequence**. Always set with `(SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY)` as a subquery inside each INSERT's SELECT list, never as a VALUES literal. |
| QUERYNUM | External ID used in client (e.g. AI0000001) |
| QUERYTITLE | Short display title (VARCHAR2) |
| QUERYDESC | Longer description of params and purpose |
| QUERYSQL | The full SQL stored as CLOB |
| QUERYPARAM | Colon-separated param descriptions (e.g. `:param1=retailer_id`) |
| QUERYRESULT | Comma-separated output column list |
| QUERYTYPE | **0 = SQL stored in QUERYSQL** (SELECT, MERGE, DML — use for all `QueryService` / `CALLQUERY` entries). **1** = resolved via PKQUERYMANAGER package (not inline SQL). **2** = Widget |
| QUERYUPDATE | 0 = read (SELECT), 1 = DML |
| QUERYACCESS | 1 = Everyone, 0 = Admin only |

**QUERYTYPE rule:** Any LIBQUERY whose body is a `SELECT` (or other SQL text in `QUERYSQL`) executed through `GET /api/request/` or POST DML must set **`QUERYTYPE = 0`**. Do **not** use `QUERYTYPE = 1` for stored SELECT text — that path is for package-resolved queries, not `QUERYSQL` literals. Pair with `QUERYUPDATE`: `0` for reads, `1` for writes.

**USERSROOM (Settings `SET0000020`–`SET0000024`):** Heinens ICR uses **`USERCORPID`** (FK to `CORPORATE.CORPID`). Join `LEFT JOIN CORPORATE c ON c.CORPID = u.USERCORPID`. Legacy `00_usersroom_table.sql` shows `USERCORP` (VARCHAR2 corp code) — do **not** use that on Heinens (ORA-00904). **`USERPASS`** is stored **Base64-encoded** in the DB (`base64_encode` / ICR login convention); the Settings UI and the header **Change password** dialog send plain text and `SettingsAdminService.encodePassword()` encodes before POST. Never pre-fill or decode password in the admin form. **`USERTYPE`**: `0` = standard user, `1` = **ICR admin** — unlocks General Settings admin sidebar (`ADMIN` flag rule in `SET0000040` / `USERTYPE = 1`); editable on **Users & Profiles** (`SET0000020`–`0022` include `USERTYPE`). Separate from **IT** flag and **AI admin** flags.

**LIBQUERY deployment pattern (canonical):**
```sql
-- Always DELETE first (idempotent), then INSERT — never MERGE on LIBQUERY itself
DELETE FROM LIBQUERY WHERE QUERYNUM IN ('AI0000080', 'AI0000081', ...);

INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000080',
       'Short title',
       'Description. :param1=retailer_id.',
       q'[SELECT ... FROM ... WHERE ... = :param1]',
       ':param1=retailer_id',
       'COL1,COL2,COL3',
       1, 0, 0    -- QUERYACCESS, QUERYTYPE, QUERYUPDATE (SELECT: TYPE 0, UPDATE 0)
  FROM dual;
-- DML example (MERGE/DELETE): use 1, 0, 1 or 0, 0, 1 for QUERYACCESS, QUERYTYPE, QUERYUPDATE
-- Repeat INSERT for each subsequent entry — each subquery runs fresh and returns MAX+1
COMMIT;
```
The subquery `(SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY)` is evaluated at execution time per INSERT, so each row gets the next available integer without a sequence.

**GET bind placeholders (`PKREQUESTMANAGER.CALLQUERY` / `LIBQUERY.QUERYSQL`):** Use `:param1`, `:param2`, … in order for each HTTP `PARAM` appended by `QueryService.getQueryResult` (first array element → `:param1`, second → `:param2`, etc.). Do **not** use positional `:1`, `:2` in LIBQUERY text for this stack — they will not match how parameters are bound.

**Canonical repo folder — full AI LIBQUERY set:** `deployment/database/SCRIPTS/libquery/`  
Load those definitions into the ICR `LIBQUERY` table (tool-specific exports such as `.pde`, or companion `.sql` if you add them). The table below is a **quick reference** for the original core ids (S01–S03); S02, skill studio, catalog extensions, and other `AI0000…` ids live in that bundle.

**AI LIBQUERY entries — core (S01–S03 + connection test):**
> ⚠️ This table is the **core slice only**. The engine, schema discovery, skill studio, feedback loop, and auto-promote queue all add more QUERYNUMs in the `AI0000020`–`AI0000078` range. See **"AI LIBQUERY — extended ranges"** below for the index, and the individual deployment scripts for the canonical body.

| QUERYNUM | Operation | Type |
|---|---|---|
| AI0000001 | CORPENV GOLD environments (S01 dropdown) | GET |
| AI0000002 | Retailer list | GET |
| AI0000003 | Single retailer | GET |
| AI0000004 | Context status — 15 items + confidence | GET |
| AI0000005 | Knowledge catalog | GET |
| AI0000006 | Active item view status | GET |
| AI0000007 | Save retailer config | POST |
| AI0000008 | Start context session | POST |
| AI0000009 | Save Q&A answer | POST |
| AI0000010 | Propose SQL condition | POST |
| AI0000011 | Validate and store SQL condition | POST |
| AI0000012 | Lock context item (triggers Oracle trigger) | POST |
| AI0000013 | Mark connection tested | POST |

**AI LIBQUERY — extended ranges (deploy script owns the body):**
| Range | Owner script | Purpose |
|---|---|---|
| `AI0000020`–`AI0000024` | `libquery/` bundle | S02 Schema Discovery — UI reads, tag lookups |
| `AI0000025`–`AI0000028`, `AI0000031`, `AI0000033` | `libquery/` bundle | S02 — env resolution, scan log, local MERGE |
| `AI0000040`, `AI0000044`–`AI0000060` | `ai_skill_builder_libquery.sql` | S20/S21 Skill Studio — template catalog, skill-by-id, bundle GETs (`44`/`46–50`) + bundle POST DML (`45`, `51–60`) |
| `AI0000061`–`AI0000064` | `ai_engine_libquery.sql` | AI engine — active skills, vocabulary, playbook, SQL templates (router/executor reads) |
| `AI0000070` | `ai_engine_feedback_libquery.sql` | S14 thumbs up/down → `AI_ENGINE_INTERACTION_LOG` |
| `AI0000071`–`AI0000075` | `ai_engine_unresolved_libquery.sql` | Phrasing curation queue — insert unresolved, list pending, promote, dismiss, stamp |
| `AI0000076`–`AI0000078` | `23_auto_promote_libquery.sql` | Phase 7 auto-promote on repeat — list eligible, MERGE into `AI_SKILL_VOCABULARY`, bulk-stamp `USER_OVERRIDE` |

> **Cleanup note:** `AI0000029` / `AI0000030` / `AI0000032` were removed from LIBQUERY after S02 remote reads moved into `ai.schema.js` dynamic SQL (binds after `@dblink` are invalid in Oracle).

Skill studio (S20/S21 — `deployment/database/SCRIPTS/ai_skill_builder_libquery.sql`): **AI0000040** template catalog GET; **AI0000044** skill-by-id GET; **AI0000046–AI0000050** bundle GETs. **POST DML (AI0000045, AI0000051–60):** `CALLQUERY` binds **` :param1` = `REQUEST_QUERY_BODY.REQUESTID`** (after Node inserts the JSON body). `QUERYSQL` reads **`requestbody`** and expands **`JSON_TABLE(..., '$.values[*]' COLUMNS(... PATH '$."COL"'))`** (same pattern as `TRA_PARAMETERS`). Angular still sends **`{ values: [{ … }] }`** with **uppercase** keys in each row object.

Engine curation loop (`deployment/database/SCRIPTS/ai_engine_unresolved_libquery.sql` + `23_auto_promote_libquery.sql`):
- **AI0000071** insert unresolved (engine logs misses + thumbs-down + chip `USER_OVERRIDE`); **AI0000072** list pending; **AI0000073** promote → vocab; **AI0000074** dismiss; **AI0000075** stamp promoted.
- **Phase 7 auto-promote on repeat:** **AI0000076** GET eligible candidates (params: retailer, min distinct users, min hits, lookback days); **AI0000077** POST DML — `MERGE` into `AI_SKILL_VOCABULARY` (idempotent on `skill_id + LOWER(term) + term_type`, default boost 1.0 vs 1.5 for manual); **AI0000078** POST DML — bulk stamp every USER_OVERRIDE row matching `(NORMALIZED_TEXT, SECOND_SKILL_CODE, RETAILER_ID)` with `PROMOTED_BY='AUTO_PROMOTE'`. Triggered from the **Skill studio → Pending phrasings → Auto-promote eligible** dialog.

**Phase 8 — BIND_HINT-driven extraction:** `BIND_HINT` vocabulary rows now drive **entity extraction**, not only scoring. The engine builds a hint list from every active `BIND_HINT` row (`term` + `canonical_concept` lowercase entity name like `site_id` / `supplier_id` / `as_of_date` / `lu_id`) and passes it to `lex.extractBindsFromHints(question, hints)` (in `ai.lexical.js`). The captured value following each hint phrase populates `entities[concept]` if the hardcoded extractors (`extractVendorText`, `extractSiteId`) didn't already set it. Both `/route` and `/diagnose` responses include `bind_hint_extractions` for full audit (term, concept, value, kind: number/date/string, used flag). The Phrasing Playground renders the audit table. Designers can therefore teach new bind patterns (e.g. `store id` → `site_id`, `vendor code` → `supplier_id`, `lu`/`codart` → `lu_id`) **from Skill Studio with no Node deploy**. Seed data: `deployment/database/SCRIPTS/24_bind_hint_pack_upgrade.sql` (re-runnable MERGE).

**Phase 9 — Heinens / DSD jargon pack:** baseline grocery + DSD + GOLD ERP terminology so the engine handles the language analysts actually type. `deployment/database/SCRIPTS/25_skill_vocab_heinens_jargon_pack.sql` seeds 80+ rows on `DSD_VENDOR_RETAIL` and `ITEM_RETAIL`: JARGON (`dsd`, `scanback`, `tpr`, `off invoice`, `billback`, `planogram`, `otif`, `fill rate`, `lead time`, `filière`, `foudgene`, `foucnuf`); ABBREVIATION (`sbk`, `oi`, `pog`, `ean`, `upc`, `gtin`); PROCESS_TERM (`ranged`, `ranging`, `delisted`, `delisting`, `authorized`, `authorised`); GOLD jargon (`lu`, `logical unit`, `codart`, `artrac`, `artul`, `artuc`, `artsite`); plus 25+ INTENT_PHRASE rows (`do we still range`, `active dsd assortment from`, `scanback items from`, `whats the fill rate for`, `who supplies item`, `is article ranged`, `lookup codart`, …). Idempotent MERGE — safe to re-run.

**V_GOLD_ITEM canonical item-card view:** `deployment/database/SCRIPTS/28_v_gold_item_view.sql` — `CREATE OR REPLACE VIEW V_GOLD_ITEM` on the ICR DB joining `ARTRAC + ARTUV` (one row per LU × active sale variant) with current orderable supplier context (`WITH ORDERABLE AS (SELECT * FROM artuc + foudgene + fouccom)`). Exposes flat columns: `"Item code"`, `"Item desc."`, `"Cat. Mgr"`, `"Orderable since/until"`, `"Supplier code/desc"`, `"Contrac"`, `"Addres chain"`, `"Cost"`, `"Ord./Rec."`, `"Ref. to order"`, `"SV"`, `"Barcode"`, `"Pack"`, `"Flow"` (DSD / Allotment / Warehouse), `"Created on/by"`. Skill SQL templates should prefer `SELECT * FROM V_GOLD_ITEM WHERE "Item code" = :lu_id` over re-joining ARTRAC/ARTUV/ARTUC/FOUDGENE/FOUCCOM/TARPRIX manually. DB link `@HEINENS_CEN_PROD` is hardcoded (must match `CORPENV.ENVDBLINK`). Re-run safe (`CREATE OR REPLACE`).

**Phase 11 — vendor-context dampener + item-header vocab top-up:** Two paired fixes for "tell me about item 100100 at store 10" routing to `DSD_VENDOR_RETAIL` instead of `ITEM_MASTER_RETAIL`. (a) **Engine** (`ai.engine.js` — `needsVendorContext(term)`): INTENT_PHRASEs ending in vendor-relation suffixes (`… from`, `… from supplier`, `… by vendor`, `… for supplier`) have their multiplier dropped from 9× to 2× **when the question has neither `vendor_text` nor `supplier_id` extracted**. Applies in both `/route` and `/diagnose`; `/diagnose` emits `dampened: "needs_vendor_context"` on each affected `vocab_matches[]` entry so the AI Assistant's Engine Diagnostics card strikes them through visually. (b) **Vocabulary** (`deployment/database/SCRIPTS/27_skill_vocab_item_master_freeform.sql`): top-up of ~25 strong free-form INTENT_PHRASEs on `ITEM_MASTER_RETAIL` (`tell me about item`, `what is item`, `info on item`, `lookup item`, `describe item`, …), plus `article`/`sku`/`product` SYNONYMs, Heinens/EU GOLD JARGON (`codart`, `cinr`, `cinv`, `artrac`, `lu`, `gencod`), and site-id BIND_HINTs. Idempotent MERGE — safe to re-run. **AI Assistant** also widened the candidate cap from top-5 to top-10 so you can see when the right skill is just below the partial-match pile.

### 2. Permitted backend custom routes (exceptions to LIBQUERY)
These Node.js routes exist because the work is procedural or not expressible as a single LIBQUERY call:

| Route | Reason |
|---|---|
| `POST /api/ai/retailer/ping-dblink` | Dynamic SQL: `SELECT COUNT(*) FROM ALL_TABLES@{runtime_dblink}` — DB link name resolved at runtime |
| `POST /api/ai/view/generate` | Oracle stored procedure: `BEGIN AI_GENERATE_ACTIVE_ITEM_VIEW(:id); END;` |
| `POST /api/ai/schema/scan` | **S02:** orchestration — `SQL.executeSQL` for remote `ALL_*@dblink` (binds after `@` are invalid in Oracle); batched `executeLibQuery` for local ICR MERGE (AI0000028/31/33, logs AI0000026/27); **ORA-01729** if remote reads were only in LIBQUERY |
| `POST /api/ai/engine/route` / `POST /api/ai/engine/execute` | **S14/S15:** AI engine orchestration; router/executor **reads** use LIBQUERY (`AI0000061`–`AI0000064`). Vendor resolution SQL is **`ENGINE_VENDOR_RESOLVE`** in `AI_SKILL_SQL_TEMPLATE` (executed from Node with the same **bind pipeline** as business templates, not `AI0000065`). |
| `POST /api/ai/engine/diagnose` | **S23 Phrasing Playground:** side-effect-free routing diagnostics — same scoring as `/route`, returns score breakdown per skill, vocabulary hits, lexical pipeline output, and bind feasibility for top skill's templates. No SQL execution. |

All other backend SQL must be in LIBQUERY.

### AI engine — end-to-end call flow (single source of truth)
When debugging a misrouted question or a missing bind, walk this sequence in order. Every component below has its own subsection but only this paragraph wires them together.

```
HTTP request                 ai.engine.js                              ai.lexical.js                          DB (LIBQUERY/skills)
────────────────────────     ─────────────────────────────────────     ─────────────────────────────────      ─────────────────────────
POST /api/ai/engine/route  ▶ readActiveSkills      ─────────────────────────────────────────────────────▶    AI0000061 → AI_SKILL
{question_text,            ▶ readVocabulary        ─────────────────────────────────────────────────────▶    AI0000062 → AI_SKILL_VOCABULARY
 retailer_id, …}           ▶ readPlaybook (best-effort, tolerated)─────────────────────────────────────▶    AI0000063 (optional)
                           ▶ extractVendorText / extractSiteId  (hardcoded regex first)
                           ▶ extractEntitiesFromBindHints ───▶ lex.extractBindsFromHints(question, hints)
                                                              (fills site_id, supplier_id, as_of_date, lu_id, …)
                           ▶ detectIntent (RETRIEVAL / GENERAL)
                           ▶ scoreSkills:
                              for each (skill × vocab term):
                                  questionSet = lex.phraseSet(question, 3)
                                  termSet     = lex.phraseSet(term, 3)
                                  hits        = lex.overlap(termSet, questionSet)
                                  multiplier  = termType weight × boost
                                  if INTENT_PHRASE && needsVendorContext(term) && !vendorCtx:
                                      multiplier = 2     ← Phase 11 dampener
                                  score      += hits × multiplier
                              + domain match bonus, + intent match bonus
                           ▶ top = scored[0]; low_confidence = top.score < UNRESOLVED_SCORE_THRESHOLD (45)
                           ▶ if intent==RETRIEVAL && vendor_text present:
                                 fetch ENGINE_VENDOR_RESOLVE template ─────────────────────────────────▶    AI0000064 → AI_SKILL_SQL_TEMPLATE
                                 render binds, run on GOLD ─▶ candidate_options (1, 2+, or 0 rows)
◀ response {confidence, selected_skill, entities, bind_hint_extractions, alternatives, routing_diagnostics, candidate_options?}

POST /api/ai/engine/execute▶ buildExecuteContext (merge body + entities + bindings)
{skill_id, question_text,  ▶ readTemplatesBySkill ─────────────────────────────────────────────────────▶    AI0000064 (templates for chosen skill)
 entities, …}              ▶ pickExecutionTemplate (skip ENGINE_*, score by bind feasibility)
                           ▶ renderTemplateForExecution (apply parameters_json, fill :name literals)
                           ▶ if gaps → return parameter_gaps + composer.synthesize(gap branch)
                           ▶ runQuery on GOLD ──────────────────────────────────────────────────────────▶    GOLD ERP via @DB_LINK
                           ▶ composer.synthesize({rows, cols, ctx, template_code, intent_type})
                              → {summary, insights, follow_up_hint}
◀ response {human_summary  ← composer.summary,
            evidence_facts ← composer.insights,        ← ⚠️ field rename (see ai.composer.js section)
            follow_up_hint ← composer.follow_up_hint,
            result_columns, result_rows, executed_sql, bind_context, template_code, skill_code}

POST /api/ai/engine/diagnose ▶ same lexical + scoring path as /route, no resolver, no execution.
                              Returns vocab_matches[] with dampened flag, score breakdown,
                              entity extraction trace, template bind feasibility per skill.
```

**Tuning constants (top of `ai.engine.js`):**
- **`UNRESOLVED_SCORE_THRESHOLD = 45`** — top skill scoring **below** this value sets `routing_diagnostics.low_confidence = true`. The S14 assistant uses that flag to (a) log the question to `AI_ENGINE_UNRESOLVED` (via `AI0000071`) so it appears in **Skill Studio → Pending phrasings**, and (b) render clarification chips for `alternatives[]`. Raise it to be more aggressive about flagging weak routes; lower it to keep the curation queue lean.
- **`ALTERNATIVES_CONFIDENCE_THRESHOLD = 50`** — declared as the future enforcement point for "only show clarification chips below this confidence." Currently `ai.engine.js` always emits `alternatives: scored.slice(1, 4)` on every `/route`, and the **client** decides whether to render chips based on `routing_diagnostics.low_confidence` (i.e. the 45 threshold). The 50 value coincidentally matches the AI Assistant's amber-band color (`< 50` = amber gauge in `ai.assistant.component.ts`). If you want server-side gating, wire this constant into the response shape — don't change the client.

### AI engine — designer SQL, `parameters_json`, and binds (`ai.engine.js`)
- **LIBQUERY:** `AI0000061` active skills, `AI0000062` vocab, `AI0000063` playbook, `AI0000064` SQL templates (includes `sql_text` and `parameters_json`).
- **No per-bind Node edits:** Templates use Oracle-style **`:name`** placeholders. The engine merges **`buildExecuteContext(req)`**: top-level execute `body` fields (except `skill_id`, `intent_type`, `template_code`, `entities`, `bindings`), plus **`entities`** and **`bindings`**, then applies **`parameters_json`** (catalog: `name`, `type` STRING/NUMBER/INTEGER, `required`) and a legacy pass for common names (`supplier_id`, `vendor_text`, `retailer_id`, dates). **`renderTemplateForExecution`** runs for both **`/route`** (resolver) and **`/execute`**. If literals cannot be applied, the response returns **`parameter_gaps`** and **`requested_sql_templates`** and SQL is not run.
- **`ENGINE_*` templates:** Router-only. **`/execute`** picks a non-`ENGINE_` template; optional **`template_code`** in the execute body forces a specific business template.
- **Retrieval:** `intent_type === RETRIEVAL` still requires a resolved **`supplier_id`** in context (body or `entities`) before running list SQL.
- **GOLD in template text:** Prefer **`TABLE@DB_LINK`** as exposed by the retailer link; avoid hardcoding a **`CEN.`** prefix on remote objects when the link already resolves the correct schema (otherwise ORA-00942).
- **Repo seeds:** e.g. `deployment/database/SCRIPTS/12_ai_skill_pack_dsd_vendor_retail.sql` (`ENGINE_VENDOR_RESOLVE`, `DSD_VENDOR_BUYABLE_ITEMS`, …).
- **Conversational skill seed:** `deployment/database/SCRIPTS/14_ai_skill_pack_conversational_assistant.sql` adds `CONVERSATIONAL_ASSISTANT` as a normal skill (vocab + playbook + SQL template `CONV_SMALLTALK_RESPONSE`), so discussion prompts route/execute through the same engine path as DSD/ITEM.

### AI engine — `ai.composer.js` (response synthesis)
- **Location:** `controlRoom_server/server/server/controller/ai/ai.composer.js`. Pure Node, no DB, no LLM. **`require`d by `ai.engine.js`** — never registered as an Express controller. Loaded once at module-init via `const composer = require("./ai.composer")`.
- **Why it exists:** raw SQL rows are not a user-facing answer. The composer turns `{ rows, cols, ctx, template_code, intent_type }` into the **operational sentence** the chat bubble shows + 1–3 evidence insights (counts, anomalies, ROWNUM caps, status distributions, ordered-qty totals). It also formats clarification questions when the resolver returns multiple vendor candidates.
- **Public API:**
  - **`composer.synthesize({ intent_type, template_code, rows, cols, ctx, parameter_gaps?, candidate_options?, vendor_text? })`** → `{ summary: string, insights: string[], follow_up_hint: string|null }`. Used by the `/execute` happy path and the `parameter_gaps` branch (so even a missing-bind response gets a human sentence).
  - **`composer.buildClarificationQuestion(options, vendorText)`** → string. Used when `ENGINE_VENDOR_RESOLVE` returns 2+ candidates so the assistant can ask "Did you mean Lipari (06966) or Lipari Foods (06967)?".
- **All conclusions are grounded** — `summary`, `insights`, and `follow_up_hint` are computed from the actual rows/columns and the execute `ctx`. The composer never fabricates supplier names, dates, or counts.
- **What the engine passes through into the API response (field-rename map — ⚠️ READ THIS):** the composer's output keys are **renamed** by `ai.engine.js` before the JSON response is sent. If you grep for `insights` in the Angular component you will not find it — the field is called **`evidence_facts`** on the wire.

  | Composer return key | API response field (in `/execute` JSON) | Angular reads |
  |---|---|---|
  | `summary`             | `human_summary` | `exec?.human_summary` |
  | `insights` (string[]) | **`evidence_facts`** | `exec?.evidence_facts` |
  | `follow_up_hint`      | `follow_up_hint` | `exec?.follow_up_hint` |
  | `buildClarificationQuestion(...)` (separate API) | `clarification` | rendered when `requires_clarification: true` |

  The rename happens at the `evidence_facts: composed.insights` line in `module.execute`. The historical reason is that the API contract pre-dates the composer module — `evidence_facts` was already in the response shape when synthesis was inlined. Don't rename either side without coordinating: the AI Assistant, the playground, the export buttons, and any external `/execute` consumer all read `evidence_facts`.

### AI engine — `ai.lexical.js` (lexical pipeline)
- **Location:** `controlRoom_server/server/server/controller/ai/ai.lexical.js`. Pure-Node, dependency-free port of the routing helpers (Porter stem, tokenizer, n-grams, phrase sets, BIND_HINT extractor) so the engine doesn't need an LLM or external NLP service. **`require`d by `ai.engine.js`** as `const lex = require("./ai.lexical")`.
- **Why it exists:** scoring and entity extraction both need stable, repeatable text-normalization. Keeping it in one module means designers can write skill vocabulary (`INTENT_PHRASE`, `JARGON`, `BIND_HINT`) without thinking about case, accents, plurals, or word order — the same normalization runs on both sides.
- **Public API (`module.exports`):**
  - **`normalize(text)`** → lowercased, accent-stripped, punctuation-collapsed string. Used for `normalized_text` written to `AI_ENGINE_UNRESOLVED.NORMALIZED_TEXT` so duplicates collapse in the curation queue.
  - **`stem(word)`** → Porter-stemmed form (`"ranged"` → `"rang"`, `"suppliers"` → `"supplier"`).
  - **`tokens(text)`** → tokenized + stopword-filtered + stemmed array. Drives Skill Studio's lexical-pipeline view.
  - **`ngrams(words, maxN)`** → unigrams + bigrams + trigrams up to `maxN`.
  - **`phraseSet(text, maxN)`** → `Set<string>` of all n-grams from the text. The engine builds one for the question and one for each vocab term, then computes overlap.
  - **`jaccard(setA, setB)`** / **`overlap(setA, setB)`** → similarity primitives used by the skill scorer.
  - **`extractBindsFromHints(rawText, hints)`** → `{ entities: { site_id, supplier_id, as_of_date, lu_id, … }, matches: [{ term, concept, value, kind, used, offset }] }`. `hints` is the array of `{ term, concept }` rows built from every active `BIND_HINT` vocab entry; the function looks for each hint phrase in the raw question and captures the token immediately following it. `kind` is `"number" | "date" | "string"`; `used: true` means the value was promoted into `entities` (hardcoded extractors win first — see `extractVendorText` / `extractSiteId` in `ai.engine.js`). The `matches` array is surfaced as `bind_hint_extractions` in `/route` and `/diagnose` for full audit.
  - **`STOPWORDS`** → the set the tokenizer filters against (exposed so tests and the Phrasing Playground can render it).
- **Defensive guard in `ai.engine.js`:** `extractEntitiesFromBindHints` does `typeof lex.extractBindsFromHints === "function"` before calling, and wraps the call in `try/catch`. This was added after a stale Node process (Phase 8 module not yet reloaded) crashed `/route` with `TypeError: lex.extractBindsFromHints is not a function`. The guard degrades to no-op BIND_HINT extraction instead of a 500, but the hardcoded extractors continue to work. **If you see the warning in server logs, restart Node — not a bug.**
- **Tests:** `controlRoom_server/server/server/controller/ai/ai.lexical.test.js` covers the public API. Run with `node ai.lexical.test.js` from that directory.

### Designer vs runtime (UI)
| Role | Where | What |
|---|---|---|
| Admin / designer | **Skill Studio → Skill Builder** (`/ai/skill-studio/builder` or `/ai/skill-studio/builder/:skillId`) — **SQL templates** tab | Paste **`SQL text`**, set **`Parameters JSON`** (`[{ "name", "type", "required" }]`), save via skill bundle LIBQUERY (AI0000048 / AI0000055). |
| Analyst / tester | **S14 AI Assistant** (`/ai/assistant`) or any client calling **`POST /api/ai/engine/execute`** | Supply runtime values: execute **body** (`retailer_id`, `supplier_id`, dates, …), **`entities`** (e.g. from **`/route`**), or **`bindings`**. The assistant forwards **`entities`** and **`question_text`** after route. There is no separate form for arbitrary `bindings` in the assistant today — use the API or extend the client. |

**S02 LIBQUERY (ICR):** `AI0000020`–`AI0000024` (UI reads / tags), `AI0000025`–`AI0000027` (env + scan log), `AI0000028`/`AI0000031`/`AI0000033` (local MERGE). **`AI0000029`/`AI0000030`/`AI0000032`** (remote `ALL_*@link`) are optional if the Node scan uses `executeSQL` for those reads — otherwise QUERYSQL must use dynamic SQL (not `@:bind`). Ship definitions in `deployment/database/SCRIPTS/libquery/` with `ai.schema.js`.

### 3. QueryService pattern
```typescript
// Import
import { QueryService } from '../query/query.service';

// GET — array order maps to :param1, :param2, … in LIBQUERY.QUERYSQL
this._query.getQueryResult('AIXXXXXXX', [param1, param2]);
// Always pass at least one param — use '-1' as placeholder if none needed

// POST — body is stored in REQUEST_QUERY_BODY; LIBQUERY DML uses :param1 = REQUESTID + JSON_TABLE on requestbody
this._query.postQueryResult('AIXXXXXXX', [{ KEY: value, KEY2: value2 }]);
// QueryService wraps as { values: [{...}] } automatically; URL includes PARAM placeholder for CALLQUERY
```

### 4. CORPENV / schema resolution
- Connection details for GOLD DB live in CORPENV table (ENVIP, ENVPORT, ENVDBLINK, ENVGOLDSCHEMA)
- AI_RETAILER_CONFIG links to CORPENV via CORPENV_ID (FK to CORPENV.ENVID)
- Schema prefix stored in CORPENV.ENVGOLDSCHEMA (e.g. HNU → HNUCEN / HNUGWR, HNP → HNPCEN / HNPGWR)
- NEVER duplicate connection info in AI tables — always read from CORPENV

### 5. View generation
- Per-retailer views: `V_GOLD_ACTIVE_ITEM_{RETAILER_ID}`
- Generated by Oracle procedure: `AI_GENERATE_ACTIVE_ITEM_VIEW(p_retailer_id)`
- Triggered automatically via Oracle trigger `AI_ITEM_ACTIVE_LOCK_TRIGGER` when ITEM_ACTIVE is locked at ≥95% confidence
- WHERE clause is 100% learned — never hardcoded

---

## Database deployment (ICR app DB)
Scripts live in `deployment/database/SCRIPTS/`. Deploy in **this exact order** — later scripts MERGE into rows or columns produced by earlier ones, and skipping any phase past 11 will silently degrade routing/scoring/UI. All MERGE-based scripts are re-runnable; full-table scripts are noted.

```
── Phase 0 — Core schema + S01–S03 ─────────────────────────────────────────
00_retailer_config.sql                       — AI_RETAILER_CONFIG + ALTER CORPENV ADD ENVGOLDSCHEMA + view + trigger
04_ai_core_tables.sql                        — AI_DECISION_LOG, AI_AUTONOMY_CONFIG, …
05_learning_identification.sql
07_learning_context.sql                      — AI_CONTEXT_KNOWLEDGE_CATALOG (15 items), sessions, AI_RETAILER_CONTEXT
08_skill_engine.sql                          — AI_SKILL*, AI_SKILL_VOCABULARY, AI_SKILL_SQL_TEMPLATE
09_view_generator.sql                        — AI_GENERATE_ACTIVE_ITEM_VIEW (uses ENVDBLINK from CORPENV)
10_active_item_view.sql                      — AI_GENERATE_ACTIVE_ITEM_VIEW + AI_ITEM_ACTIVE_LOCK_TRIGGER

── LIBQUERY bundles ────────────────────────────────────────────────────────
libquery/                                    — Full Supply Chain AI LIBQUERY bundle (all QUERYNUMs used by the app)
ai_engine_libquery.sql                       — Engine reads AI0000061–AI0000064
ai_skill_builder_libquery.sql                — Skill Studio AI0000040/0044–0060
ai_engine_feedback_libquery.sql              — Feedback AI0000070
ai_engine_unresolved_libquery.sql            — Curation queue AI0000071–AI0000075
11_libquery_entries.sql                      — Legacy minimal 13 entries — SKIP if libquery/ bundle loaded

── Phase 1 — Skill packs (vocab + templates) ───────────────────────────────
12_ai_skill_pack_dsd_vendor_retail.sql       — DSD_VENDOR_RETAIL + ENGINE_VENDOR_RESOLVE
13_ai_skill_pack_item_retail.sql             — ITEM_RETAIL (v1 — superseded by 26 for ITEM_MASTER_RETAIL)
14_ai_skill_pack_conversational_assistant.sql — CONVERSATIONAL_ASSISTANT skill
14_ai_skill_pack_gold_central_hq_store.sql   — GOLD central HQ-store reasoning skill
15_ai_skill_pack_gold_mobility_store.sql     — store-mobility skill
16_ai_skill_pack_gold_stock_warehouse.sql    — warehouse stock skill
16_engine_interaction_log.sql                — AI_ENGINE_INTERACTION_LOG table (feedback target)
17_remove_skill_GOLD_CEN_ITEM_ART_ALIV_AVEN.sql — retire deprecated skill
18_ai_skill_pack_operational_reasoning.sql   — SUPPLIER_HEALTH, STOCK_VARIANCE, DELIVERY_EXCEPTION skills

── Phase 2 — Engine resolver/template tuning ───────────────────────────────
19_engine_vendor_resolve_upgrade.sql         — ENGINE_VENDOR_RESOLVE handles "lipari 06966" / "06966 lipari" / code-only / name-only
20_buyable_items_site_filter_upgrade.sql     — DSD_VENDOR_BUYABLE_ITEMS gets pkresrel.isSiteBelongToNode site filter

── Phase 3 (intentionally absent) ──────────────────────────────────────────
-- Phase 3 was internal Node-only work (pure-Node lexical layer in ai.lexical.js:
-- Porter stem, n-grams, phrase sets, bind-feasibility penalty in pickExecutionTemplate).
-- No SQL deployment artifacts — code change only. Numbering skips from 2 to 4
-- on purpose; do not insert anything here.

── Phase 4–7 — Curation loop + vocabulary upgrades ─────────────────────────
21_skill_vocab_phrasing_pack.sql             — vocab top-up for DSD + ITEM (INTENT_PHRASE / SYNONYM)
22_engine_unresolved_table.sql               — AI_ENGINE_UNRESOLVED table (curation queue target)
23_auto_promote_libquery.sql                 — AI0000076–AI0000078 (auto-promote on repeat-USER_OVERRIDE)

── Phase 8–9 — BIND_HINT extraction + Heinens jargon ───────────────────────
24_bind_hint_pack_upgrade.sql                — BIND_HINT rows that feed lex.extractBindsFromHints (site_id, supplier_id, as_of_date, lu_id)
25_skill_vocab_heinens_jargon_pack.sql       — 80+ JARGON/ABBREVIATION/PROCESS_TERM/INTENT_PHRASE rows on DSD + ITEM

── Phase 10–11 — Item-master v2 + canonical view + routing dampener ────────
26_ai_skill_pack_item_retail_v2.sql          — ITEM_MASTER_RETAIL skill (replaces 13's ITEM_RETAIL): 7 templates incl. ITM_ARTICLE_HEADER
27_skill_vocab_item_master_freeform.sql      — free-form INTENT_PHRASEs ("tell me about item", "info on item", …) on ITEM_MASTER_RETAIL
28_v_gold_item_view.sql                      — CREATE OR REPLACE VIEW V_GOLD_ITEM (ARTRAC + ARTUV + ORDERABLE join)
                                               Used by ITM_ARTICLE_HEADER template.

── Phase 12 — Conversational enrichment for the item card ──────────────────
29_ai_skill_item_master_enriched.sql         — V_GOLD_ITEM gains "Variant CINV" column;
                                               NOTE: this script number collides with the data health script below.
                                               Run the data health DDL first (commented block), then this script.

── Phase 13 — S24/S25 AI Data Health ───────────────────────────────────────
29_data_health_libquery.sql                  — LIBQUERY AI0000080–AI0000089 (DELETE+INSERT pattern, NVL(MAX(QUERYID),0)+1)
                                               DDL for AI_DATA_CHECK_DEF + AI_DATA_CHECK_RESULT + AI_RUN_DATA_CHECKS
                                               in commented block at bottom — uncomment and run once before the INSERTs.
                                               Angular: src/app/pages/supply-chain-ai/operations/data-health/ (S24 + S25)
                                               Service: src/app/shared/services/ai/ai.data.health.service.ts

── Phase 14 — ICR menu access + Settings admin ─────────────────────────────
34_settings_users_corporate_libquery.sql     — SET0000001–0034 + SET0000024: corporate, environment, USERSROOM (incl. USERTYPE), user–env matrix, self-service password change
35_menu_access_libquery.sql                  — ICR_MENU_* DDL (commented block, run once), catalog seed, SET0000040–0045, HDR_USER_* profile dropdown rows
                                               ⚠️ Full run DELETEs/reseeds ICR_MENU_ENTRY + rules (dev-friendly). Use incremental block at file bottom on prod.
36_menu_access_admin_libquery.sql            — SET0000046–0054: menu admin CRUD + ROUTE_SET_MENU seed (deploy after 35)
52_users_usertype_libquery_upgrade.sql       — PATCH: SET0000020–0022 only (USERTYPE on existing DBs that deployed 34 before USERTYPE)
53_user_change_password_libquery.sql       — PATCH: SET0000024 only (self-service password change)
54_header_user_profile_menu.sql              — PATCH: HDR_USER_* catalog + FLAG ALL rules + upgraded SET0000041 (ROUTE_PATH, SORT_ORDER, full flag grants)

── Phase 12 — Conversational enrichment for the item card (continued) ──────
29_ai_skill_item_master_enriched.sql         — V_GOLD_ITEM gains "Variant CINV" column;
                                               ITM_FULL_ATTRIBUTES rebased on V_GOLD_ITEM
                                               (header + optional EAN LISTAGG / retail / 90d count);
                                               22 INTENT_PHRASEs ("add retail price", "and the ean", …)
                                               that route enrichment requests to ITM_FULL_ATTRIBUTES.
                                               Paired with assistant client-side override that forces
                                               template_code + include_* flags on continuation turns.

── Last ────────────────────────────────────────────────────────────────────
06_scheduler.sql                             — Nightly jobs (deploy AFTER everything else — references skill tables)
```

> **Code dependency:** Scripts 24 and the BIND_HINT extraction pipeline assume `ai.lexical.js` exports `extractBindsFromHints` (Phase 8). If a Node process is older than that, the engine logs a warning and silently skips BIND_HINT extraction — restart Node. Scripts 26 and 28 assume `V_GOLD_ITEM` exists on the schema the DB link resolves to (script 28 creates it as `@HEINENS_CEN_PROD`).

> **Hardcoded DB link in V_GOLD_ITEM:** `28_v_gold_item_view.sql` hardcodes `@HEINENS_CEN_PROD` and site `7` (in the `Flow` subquery's `isSiteBelongToNode(1, 7, …)` call). Change the link or site id if your CORPENV row differs.

> **Server restart required** after first deploying scripts 22 / 23 / 24 / 27 / 28 / 29 because `ai.engine.js`, `ai.lexical.js`, and `ai.composer.js` read schema/vocab/template-detector regex they didn't see at boot. Pure-data MERGE scripts (21, 25) take effect on the next request. **Script 29 also requires an Angular rebuild** to pick up the assistant's new `buildEnrichmentOverride` path and the enrichment chips.

### Initial data setup
```sql
-- 1. Set GOLD schema prefix on CORPENV rows
UPDATE CORPENV SET ENVGOLDSCHEMA = 'HNU' WHERE ENVID = <preprod_envid>;
UPDATE CORPENV SET ENVGOLDSCHEMA = 'HNP' WHERE ENVID = <prod_envid>;

-- 2. Register retailer
INSERT INTO AI_RETAILER_CONFIG (RETAILER_ID, RETAILER_CODE, RETAILER_NAME, CORPENV_ID, CREATED_BY)
VALUES ('HNU_PREPROD', 'HNU', 'Heinens Grocery Store', <preprod_envid>, 'ADMIN');

-- 3. Grant AI admin to test user
UPDATE USERS SET USERAIADMIN = 1 WHERE USERLOGIN = 'abe';
COMMIT;
```

---

## Frontend screens
All screens under: `src/app/pages/supply-chain-ai/`

| Screen | Path | Status |
|---|---|---|
| S01 Retailer & GOLD Setup | platform/retailer-setup | Active |
| S02 Schema Discovery | platform/schema-discovery | Active |
| S03 Context Learning | platform/context-learning | Active |
| S20 Skill Library | ai/skill-studio/library | Active |
| S21 Skill Builder | ai/skill-studio/builder, ai/skill-studio/builder/:id | Active |
| S22 Pending Phrasings | ai/skill-studio/pending-phrasings | Active (admin curation queue, AI0000072–0075) |
| S23 Phrasing Playground | ai/skill-studio/playground | Active (POST /api/ai/engine/diagnose — score breakdown + bind feasibility) |
| S14 AI Assistant | ai/assistant | Active (route → execute; clarification chips on low confidence) |
| S24 AI Data Health | ai/data-health | Active — card grid, summary bar, critical banner, Run now, Investigate bridge |
| S25 Data Health Config | ai/data-health/config | Active — table CRUD, Add/Edit dialog, Verify button, enable toggle, delete |
| S04–S19, S15 (other) | (various) | Stubs / partial |

### Angular module pattern
Every AI screen module must import PrimeNG modules it uses explicitly.
Do not rely on app.module.ts PrimeNG imports.

### Admin settings screens (General Settings)

| Screen | Route | Component / module | LIBQUERY (via `SettingsAdminService`) |
|---|---|---|---|
| Users & Profiles | `/settingusers` | `pages/admin/setting-users/` · `SettingUsersModule` | `SET0000001` (corp dropdown), `SET0000020`–`0024` (users + admin password MERGE), `SET0000030`–`0034` (env access) |
| Menu & access | `/settingmenu` | `pages/admin/setting-menu-access/` · `SettingMenuAccessModule` | `SET0000046`–`0054` (catalog, rules, profiles, profile menus) |
| Customer / Corp / Env | `/settingcustomer`, etc. | existing settings pages | `SET0000001`–`0013` |

No custom Node routes — all reads/writes go through `QueryService` + LIBQUERY.

---

## ICR Settings — Menu, Users & Access Profiles

Data-driven navigation replaces the hard-coded sidebar and **user profile dropdown** for Heinens ICR. Admins maintain the menu catalog, flag-based rules, and optional access profiles; user records in **`USERSROOM`** supply capability flags, optional **`USERPROF`**, and **`USERTYPE`** (ICR admin). At login the client loads the **effective menu** (`SET0000040`) and **header rows** (`SET0000041`), then renders three sidebar trees (Standard / AI / Admin), the **Ahmed B.–style profile menu** (data-driven), and the AI mode toggle button.

### End-to-end flow

```
Login (login.component.ts)
  → getInfo → getEnvironment → MenuAccessService.load(userId)
       SET0000040 (sidebar nodes, MENU_TYPE <> HEADER)
       SET0000041 (HEADER rows — profile dropdown + HDR_AI_TOGGLE)
  → sidebar-menu.component             standardTree | aiTree | adminTree
  → header.component                   profileMenu$ | async (SET0000041, excl. AI toggle)
  → AuthentificationGuard              canAccessRoute(path)

Browser refresh (app.component.ts)
  → getInfo → getEnvironment (if sid empty) → menuAccess.load()   — menu not tied to env dropdown switch

Admin changes (Menu & access or Users)
  → LIBQUERY DML on ICR_* / USERSROOM
  → User must log out and back in for SET0000040 / SET0000041 to reflect new grants
```

### Database objects (ICR app DB)

| Table | Purpose |
|---|---|
| `ICR_MENU_ENTRY` | Menu catalog: `MENU_CODE` PK, `PARENT_CODE`, `MENU_TYPE` (`GROUP` \| `ROUTE` \| `LABEL` \| `HEADER`), `MENU_MODE` (`STANDARD` \| `AI` \| `ADMIN` \| `BOTH`), `ROUTE_PATH`, `ICON_CLASS`, `LABEL_TEXT`, `SORT_ORDER`, `EXPAND_KEY`, `ACTIVE` |
| `ICR_MENU_ACCESS_RULE` | Legacy flag rules: `(MENU_CODE, FLAG_NAME)` — which `USERSROOM` flag unlocks the node |
| `ICR_ACCESS_PROFILE` | Named profiles: `PROFILE_ID`, `PROFILE_CODE`, `PROFILE_NAME`, `ACTIVE` |
| `ICR_PROFILE_MENU` | Profile grants: `(PROFILE_ID, MENU_CODE, GRANTED)` |
| `USERSROOM` | Users (not `USERS`). Heinens uses **`USERCORPID`** → `CORPORATE.CORPID`. **`USERPROF`** → `ICR_ACCESS_PROFILE.PROFILE_ID` (nullable). |
| `CORPORATE` / `CORPENV` | Corporate and environment setup (existing ICR tables) |

DDL for `ICR_*` tables is in the commented block at the top of `35_menu_access_libquery.sql` (run once if `ORA-00942`).

### Effective access rule (SET0000040)

A menu row is visible when **`ACTIVE = 1`** and **`MENU_TYPE <> 'HEADER'`** (header rows use `SET0000041`) and **either**:

1. **Flag rule match** — exists `ICR_MENU_ACCESS_RULE` for that `MENU_CODE` where:
   - `ALL`, or
   - flag matches a `USERSROOM` column (`BUYER` → `USERBUYER`, `HELPDESK` → `USERHELPDESK`, `IT` → `USERIT`, `DATAINTEGRITY` → `USERDATAINTEGRITY`, `TECH` → `USERSTECH`, `WAREHOUSE` → `USERWAREHOUSE`, `SPACE` → `USERSPACEPLANNING`, `AIADMIN` → `USERAIADMIN`, `AIDESIGNER` → `USERAIDESIGNER`, `ADMIN` → `USERTYPE = 1`), or
2. **Profile grant** — `USERPROF` is not null and `ICR_PROFILE_MENU` has `GRANTED = 1` for that profile + menu code.

Flag rules and profile grants are **OR** — either path is enough. Profiles are useful for curated bundles (e.g. Space planning team); flags remain the primary legacy model.

### Seeded access profiles (`35_menu_access_libquery.sql`)

| PROFILE_ID | PROFILE_CODE | Typical use |
|---|---|---|
| 1 | `FULL_IT` | IT full access (incl. admin settings routes) |
| 2 | `BUYER` | Buyer |
| 3 | `HELPDESK` | Helpdesk |
| 4 | `AI_DESIGNER` | Supply Chain AI designer |
| 5 | `AI_ADMIN` | Supply Chain AI administrator |
| 6 | `SPACE_PLANNING` | Search, Master data, Syndigo, Space Planning group |
| 7 | `TECH_SERVICES` | Tech Services (`USERSTECH` + `TECH` flag rules) |
| 8 | `DATA_INTEGRITY` | Data Integrity (`USERDATAINTEGRITY` + matching flag rules) |

Incremental patches at the bottom of `35_menu_access_libquery.sql` add profiles 7/8, `TECH` rules, and profile-menu rows on existing DBs without re-running the full catalog DELETE.

### LIBQUERY — Settings & menu (`SET00000xx`)

**Corporate / environment / users** — `34_settings_users_corporate_libquery.sql`:

| QUERYNUM | Operation |
|---|---|
| `SET0000001`–`0004` | Corporate list, get, MERGE, delete |
| `SET0000010`–`0013` | Environment list, get, MERGE, delete |
| `SET0000020` | User list (`:param1` corp id or `-1`, `:param2` active or `-1`; includes `USERTYPE`) |
| `SET0000021` | User by id + `USERAPPLI` (includes `USERTYPE`; never pre-fill `USERPASS` in UI) |
| `SET0000022` | User MERGE (`USERSROOM`; password Base64 when `UPDATE_PASS=1`; includes `USERTYPE`) |
| `SET0000023` | User delete |
| `SET0000024` | **Self-service change password** — POST PL/SQL: verify `CURRENT_PASS`, set `NEW_PASS` (both Base64 from client). `QUERYACCESS=1`. Body: `{USERID, USERAPPLI, CURRENT_PASS, NEW_PASS}` |
| `SET0000030`–`0032`, `0034` | User–environment access list, MERGE, delete, matrix |

**Runtime menu** — `35_menu_access_libquery.sql`:

| QUERYNUM | Operation |
|---|---|
| `SET0000040` | Effective sidebar menu for `:param1` = `USERID` (`MENU_TYPE <> 'HEADER'`) |
| `SET0000041` | **Header menu** for `:param1` = `USERID` — all `MENU_TYPE = 'HEADER'` rows user may see. Returns `MENU_CODE, LABEL_TEXT, ICON_CLASS, ROUTE_PATH, SORT_ORDER`. Same flag/profile OR logic as `SET0000040` |
| `SET0000042` | Active access profiles list (dropdowns) |
| `SET0000043` | Full active menu catalog (read-only helper) |
| `SET0000044` | Profile menu grants for `:param1` = `PROFILE_ID` |
| `SET0000045` | MERGE single profile menu grant (POST body) |

**Menu admin CRUD** — `36_menu_access_admin_libquery.sql` (after 35):

| QUERYNUM | Operation |
|---|---|
| `SET0000046` | Menu catalog for admin (`:param1` active filter: `-1` / `0` / `1`) |
| `SET0000047` | MERGE menu entry |
| `SET0000048` | Deactivate menu entry (`ACTIVE = 0`) |
| `SET0000049` | List all flag rules |
| `SET0000050` | Insert flag rule |
| `SET0000051` | Delete flag rule |
| `SET0000052` | MERGE access profile |
| `SET0000053` | Next `PROFILE_ID` for new profile |
| `SET0000054` | Replace all profile menu grants (bulk: `PROFILE_ID` + comma-separated `MENU_CODES`) |

All admin menu LIBQUERY entries use **`QUERYACCESS = 0`** (admin-only). Runtime `SET0000040` / `0041` use **`QUERYACCESS = 1`**.

### Angular services

| Service | Path | Role |
|---|---|---|
| `SettingsAdminService` | `shared/services/settings/settings.admin.service.ts` | All `SET00000xx` calls; `toRows()` normalizes LIBQUERY responses; `encodePassword()` Base64 before `SET0000022` / `SET0000024`; `changeOwnPassword()` for header dialog |
| `MenuAccessService` | `shared/services/menu/menu-access.service.ts` | Post-login `load()` → sidebar trees + `profileMenu$` + `showAiModeToggle()`; `canAccessRoute()` |
| `QueryService` | `shared/services/query/query.service.ts` | HTTP to `GET/POST` LIBQUERY; `param ?? []`; `DATABASE_SID` / language from `userInfo` or `localStorage` (`ICRSID`, `ICRLanguage`) |

`SettingsAdminService` query id constants include `USER_LIST` (`SET0000020`), `USER_CHANGE_PASSWORD` (`SET0000024`), `PROFILE_LIST` (`SET0000042`), `MENU_CATALOG` (`SET0000046`), `PROFILE_MENUS_REPLACE` (`SET0000054`), etc.

### Screen — Users & Profiles (`/settingusers`)

**Files:** `controlRoom_client/src/app/pages/admin/setting-users/`

**Tabs:**

1. **Users** — Search by corporate + active; table with edit/delete; Add user / duplicate user dialogs.
   - **User type** dropdown (`USERTYPE`): Standard (0) vs **ICR admin (General Settings)** (1). Re-login required after change. Table column **User type**.
   - Access flags (checkboxes, numeric 0/1): Data integrity, IT, Buyer, Helpdesk, Warehouse, Space planning, Tech Services, AI admin, AI designer.
   - **Access profile** dropdown (`USERPROF`) from `SET0000042` — optional; when set, menu comes from profile grants as well as flags.
   - Password (admin): plain text in UI; `encodePassword()` + `UPDATE_PASS` on save. Never pre-fill existing password from `SET0000021`.
   - Corporate: `USERCORPID` (not legacy `USERCORP` varchar).

2. **Environment access** — Matrix of user × environment (`SET0000034` / `SET0000031` / `SET0000032`).

**Pattern:** Toolbar above table for Corporate/Status filters; table caption = global search only (Query Library style).

### Screen — Menu & access (`/settingmenu`)

**Files:** `controlRoom_client/src/app/pages/admin/setting-menu-access/`

**Route:** General Settings → **Menu & access** (`ROUTE_SET_MENU`, `MENU_MODE = ADMIN`, `ADMIN` flag rule). Registered in `app-routing.module.ts`.

**Tabs:**

| Tab | What it manages |
|---|---|
| **Menu catalog** | `ICR_MENU_ENTRY` — add/edit/deactivate rows; **Show** filter (All / Active / Inactive) in toolbar above table; caption = Refresh, Add entry, search |
| **Flag rules** | `ICR_MENU_ACCESS_RULE` — which flag unlocks which `MENU_CODE` |
| **Profiles** | `ICR_ACCESS_PROFILE` — profile id/code/name/active |
| **Profile menus** | Bulk checkbox grid per profile → `SET0000054` replaces all grants; profile dropdown uses cached `profileDropdownOptions` (not a template method — avoids PrimeNG change-detection freeze) |

**Menu types:** `GROUP` (expandable), `ROUTE` (navigates to `ROUTE_PATH`), `LABEL` (section heading in AI menu), `HEADER` (top bar — profile dropdown and toolbar actions; **not** in `SET0000040` sidebar tree).

**Seeded `HEADER` profile dropdown** (`35_menu_access_libquery.sql` or patch `54_header_user_profile_menu.sql`):

| MENU_CODE | LABEL | SORT | Client action |
|---|---|---|---|
| `HDR_AI_TOGGLE` | AI mode toggle | 0 | Toolbar button only (`showAiModeToggle()`); excluded from profile dropdown |
| `HDR_USER_PROFILE` | Profile | 10 | Placeholder (read-only users: `type == '2'` disabled) |
| `HDR_USER_CHANGE_PASSWORD` | Change password | 20 | Opens header dialog → `SET0000024` |
| `HDR_USER_INBOX` | Inbox | 30 | Placeholder |
| `HDR_USER_SETTINGS` | Settings | 40 | Placeholder |
| `HDR_USER_SWITCH_MENU` | Switch Menu | 50 | `rltAndLtr()` |
| `HDR_USER_LOGOUT` | Log Out | 60 | `onLoggedout()` + `/login` (`ROUTE_PATH`) |

Default access: **`ALL`** flag rule on each `HDR_USER_*` row. Admins may add/deactivate/reorder via **Menu catalog** (`MENU_TYPE = HEADER`). If `SET0000041` fails or returns no profile rows, `MenuAccessService` falls back to a built-in list and **always injects** `HDR_USER_CHANGE_PASSWORD` if missing.

**UI notes:** Query Library–style `CREATE_Button` on catalog; horizontal `action-buttons` on all tabs; link to Users & Profiles for assigning `USERPROF` and `USERTYPE`.

### Header — user profile dropdown & change password

**Files:** `controlRoom_client/src/app/layouts/header/header.component.ts|html`

- Profile menu rendered from `menuAccess.profileMenu$ | async` (not hardcoded HTML).
- **Change password** dialog: current / new / confirm; calls `SettingsAdminService.changeOwnPassword()` → `SET0000024`.
- Password rules: plain text in UI; Base64 in DB; `SET0000024` verifies `CURRENT_PASS` before update.
- **Not** the same as admin **Users & Profiles** password field (`SET0000022` + `UPDATE_PASS`, admin-only `QUERYACCESS=0` on user MERGE).

**Deploy:** `53_user_change_password_libquery.sql` + `54_header_user_profile_menu.sql` (or full `34` + `35`). **Angular rebuild required** (`ng serve` restart + hard refresh) — logout alone does not load new client code.

**Troubleshooting:** Console after login should log `[MenuAccess] profile menu { fromDb, shown, codes }` with `HDR_USER_CHANGE_PASSWORD`. If `SET0000041 request failed`, check `ICRSID` in `localStorage`, run `getEnvironment` before menu load (F5 path in `app.component.ts`), and confirm upgraded `SET0000041` `QUERYRESULT` includes `ROUTE_PATH,SORT_ORDER`.

### Dynamic sidebar

| File | Role |
|---|---|
| `layouts/sidebar/sidebar-menu/` | Renders `menuAccess.standardTree`, `aiTree`, `adminTree` |
| `layouts/sidebar/sidebar.component.html` | Host; legacy static HTML kept in `sidebar.legacy.component.html` for reference |
| `layouts/header/header.component.ts` | `profileMenu$` dropdown; `showAiModeToggle()` for `HDR_AI_TOGGLE`; change-password dialog |
| `pages/login/login.component.ts` | `getInfo` → `getEnvironment` → `menuAccess.load()` after login |
| `app.component.ts` | F5: `getEnvironment` then `menuAccess.load()` if menu not ready (independent of header env switch) |
| `shared/services/authentification/authentification.guard.component.ts` | Route guard uses `canAccessRoute()` |

Top-level `ROUTE` items use the same `list-group-item` + `<span>` styling as groups; `menuIconClass()` normalizes `fa` → `fas` and strips `fa-fw`.

### Operational notes

- **Re-login required** after changing flag rules, profile grants, `USERPROF`, `USERTYPE`, or user flags — `MenuAccessService` loads once per session.
- **Header profile menu** changes (catalog / flag rules for `HDR_USER_*`) also require re-login. **Angular code changes** require `ng serve` restart — not just re-login.
- **`SET0000041` on existing DBs:** run `54_header_user_profile_menu.sql` if profile dropdown is empty or missing Change password.
- **`USERTYPE` on existing DBs:** run `52_users_usertype_libquery_upgrade.sql` if `SET0000020`–`0022` lack `USERTYPE`.
- **`35_menu_access_libquery.sql` full run** wipes `ICR_MENU_ENTRY` / rules and reseeds — use the **incremental block at file bottom** on production when adding profiles/flags only.
- **`ORA-00942`** on menu load → run DDL block in script 35 once.
- **`ORA-00904` on users** → deploy `34_settings_users_corporate_libquery.sql`; confirm `USERCORPID` not `USERCORP`.
- **Assigning menu access to a user:** set flags on Users tab **and/or** pick an access profile; for profile-only users ensure `ICR_PROFILE_MENU` rows exist (Profile menus tab).

---

## Backend controllers
Location: `controlRoom_server/server/server/controller/ai/`

Active controllers (registered in `server_admin.js`):
```javascript
let aiRetailer = require('./server/controller/ai/ai.retailer')(app, SQL);  // POST /api/ai/retailer/ping-dblink
let aiView     = require('./server/controller/ai/ai.view')(app, SQL);      // POST /api/ai/view/generate
let aiSchema   = require('./server/controller/ai/ai.schema')(app, SQL);    // POST /api/ai/schema/scan
                                                                           // GET  /api/ai/schema/scan-status
let aiEngine   = require('./server/controller/ai/ai.engine')(app, SQL);    // POST /api/ai/engine/route
                                                                           // POST /api/ai/engine/execute
                                                                           // POST /api/ai/engine/diagnose
```

**Internal modules (`require`d, not registered as Express controllers):**
- `ai.composer.js` — pulled in by `ai.engine.js` (`const composer = require("./ai.composer")`). Turns SQL result rows into the natural-language summary the assistant renders.
- `ai.lexical.js` — pulled in by `ai.engine.js` (`const lex = require("./ai.lexical")`). Pure-Node lexical pipeline (normalize / stem / n-grams / phrase sets / BIND_HINT extraction).

See the **AI engine — `ai.composer.js` (response synthesis)** and **AI engine — `ai.lexical.js` (lexical pipeline)** sections above for the public API of each.

`ai.schema.js` — **S02** only: `POST /api/ai/schema/scan` resolves env and logs with LIBQUERY (`AI0000025`–`AI0000028`, `AI0000031`, `AI0000033`) and executes remote dictionary SELECTs through `EXECUTEQUERY` with dynamic `@dblink` SQL for table/column/sample discovery. Reads still use LIBQUERY from Angular (`AI0000020`–`0024`, `AI0000022`). `GET /api/ai/schema/scan-status` is a thin LIBQUERY wrapper used by the S02 polling UI.  
S02 cleanup: `AI0000029` / `AI0000030` / `AI0000032` removed from LIBQUERY after moving remote reads into `ai.schema.js`.

---

## 15 Knowledge catalog items
**P1 — Required (must be locked before view generation):**
ITEM_ACTIVE, ITEM_INACTIVE, STOCK_AVAILABLE, PROMOTION_ACTIVE, POS_SALES

**P2 — Core:**
SUPPLIER_HOLD, ITEM_RECALL, LEAD_TIME, ITEM_RANGED, OPEN_PO_STATUS, WASTE_MOVEMENTS

**P3 — Enhanced:**
NEW_ITEM, SHELF_LIFE_MEANING, SITE_TYPE_CODES, PROMO_UPCOMING, DSD_ELIGIBLE

---

## GOLD schema key tables
ARTUL (LU), ARTRAC (article trace / item master), ARTSITE (item-site), ARTREAP (replen params),
STOCOUCH (stock layers), STOMVT (movements), CDEENTCDE/CDEDETCDE (PO),
OPRARTSIT (promo), FOUFILIE (filière), WSUPPCALDATA (supplier calendar),
WGENBESWAR (GWR anomalies), DOCKPLAN (dock)

### Heinens GOLD — Item, variant, EAN, retail (`ITEM_MASTER_RETAIL` skill, Phase 10)
| Table        | Key columns                                                          | Purpose                                                              |
|--------------|----------------------------------------------------------------------|----------------------------------------------------------------------|
| `ARTRAC`     | `ARTCINR` (CINR), `ARTCEXR` (LU code shown to users)                 | Item master.                                                         |
| `ARTUV`      | `ARVCINV` (CINV), `ARVCEXR`, `ARVCEXV`, `ARVCINR` → `ARTCINR`        | Sale variant (consumer pack). One CINR has 1..N CINVs.               |
| `ARTCOCA`    | `ARCCINV` → `ARVCINV`, `ARCCODE` (EAN/UPC), `ARCDDEB / ARCDFIN`      | EAN/UPC catalog per variant (1..N). Helper `pkartcoca.Get_Arccode`. |
| `AVEPRIX`    | `AVICINV` → `ARVCINV`, `AVINTAR` → `AVENTAR`, `AVIPRIX`, `AVIMULTI`, `AVIDDEB/AVIDFIN` | Price line: retail amount + multi-buy qty per (variant × tariff × period). |
| `AVETAR`     | `AVENTAR` (PK), `AVESTAT` (1 = regular, 2 = promotion), `AVEDDEB/AVEDFIN` | Tariff / price-list header.                                          |
| `AVESCOPE`   | `AVONTAR` → `AVENTAR`, `AVORESCINT` (site OR network), `AVOSTRCINT` (merch struct node — informational at Heinens, NOT used for filtering), `AVOPRIO` (closest to 1 wins), `AVODDEB/AVODFIN` | Says where a tariff applies and at what priority.                    |
| `STRUCOBJ`   | `sobcint`, `sobcext`, `sobidniv`                                     | Merchandise node descriptors. Helper `pkstrucobj.get_desc`.          |

**Active retail resolution rule (Heinens).** For variant *V* at store *S* on date *D*: join `AVEPRIX × AVETAR × AVESCOPE`, keep rows whose three periods all contain *D* and where `AVORESCINT = S` (or `pkresrel.isSiteBelongToNode(1, S, AVORESCINT, '1') = 1`). **No merchandise-hierarchy filter is applied** — Heinens scopes prices by site/network only. Order `AVOPRIO ASC, AVESTAT DESC (promo before regular), AVIDDEB DESC` and take row 1. Implemented in `ITM_RETAIL_ACTIVE` and reused inside `ITM_FULL_ATTRIBUTES`.

**`ITEM_MASTER_RETAIL` template inventory** (script `26_ai_skill_pack_item_retail_v2.sql`). Before authoring a new ITM_* template, check that none of these already cover the question — `ITEM_MASTER_RETAIL` already has full coverage for the LU↔variant↔EAN↔retail axis:

| Template code | Binds | Returns |
|---|---|---|
| `ITM_ARTICLE_HEADER` | `lu_id` | One row per (LU × active sale variant) from **`V_GOLD_ITEM`**: code, desc, cat. mgr, orderable window, current supplier, contract, cost, ord./rec., barcode, pack, flow. The entry point for "tell me about item X". |
| `ITM_VARIANTS` | `lu_id` | Every `ARTUV` row (sale variant) for the LU with description. |
| `ITM_EAN_FOR_LU` | `lu_id`, `as_of_date?` | All active EAN/UPC codes per variant (walks `ARTRAC → ARTUV → ARTCOCA`). |
| `ITM_BARCODE_LOOKUP` | `ean`, `as_of_date?` | Reverse lookup — scanned EAN → variant → LU (`FETCH FIRST 20 ROWS ONLY`). |
| `ITM_RETAIL_ACTIVE` | `lu_id`, `site_id`, `as_of_date?` | Best-priority active retail per variant at store, applying the priority rule above. |
| `ITM_RETAIL_HISTORY` | `lu_id`, `date_from?`, `date_to?`, `site_id?` | Raw `AVEPRIX/AVETAR/AVESCOPE` rows for the audit trail — no priority resolution. Defaults to SYSDATE−90 / SYSDATE+30. |
| `ITM_FULL_ATTRIBUTES` | `lu_id`, `include_ean? (Y/N)`, `include_retail? (Y/N)` + `site_id` if retail, `include_history? (Y/N)` | **Rebased on `V_GOLD_ITEM` (script 29).** Returns the full V_GOLD_ITEM card (header / supplier / cost / barcode / pack / flow) **plus** optional `"All EANs"` (LISTAGG), `"Retail amount/multi-buy/kind/priority"` (best-priority at `site_id`), and `"Price changes (90d)"` count. Used by the conversational-enrichment flow — see below. Each `include_*` flag is independent; unused ones skip their joins via `CASE` gates and the `OUTER APPLY`'s `:include_retail = 'Y'` predicate. |

### Phase 12 — Conversational enrichment for the item card

The user asks "tell me about item 100100" → `ITM_ARTICLE_HEADER` fires → the assistant shows the V_GOLD_ITEM card. The user then types "add retail price" / "and the EAN" / "include price history" / "consolidate everything" — the assistant **does NOT open a second result table**. Instead, it pivots to `ITM_FULL_ATTRIBUTES`, turns on the corresponding `include_*` flag, and re-runs against `V_GOLD_ITEM` so the same single table grows extra columns. Repeating the pattern lets the analyst keep stacking columns until the consolidated card has everything they need.

**Three coordinated pieces make this work:**

1. **`V_GOLD_ITEM` exposes `"Variant CINV"`** (script 29 — `CREATE OR REPLACE`). The ARTUV join was already there; we just added the column to the projection so `ITM_FULL_ATTRIBUTES` can join `AVEPRIX` / `ARTCOCA` / `AVEPRIX` history at the same grain as the V_GOLD_ITEM row. The column is named conspicuously so analysts skim past it.
2. **`ITM_FULL_ATTRIBUTES` `SELECT g.*` from `V_GOLD_ITEM`** + `CASE WHEN UPPER(NVL(:include_ean,'N')) = 'Y'` gates on three independent enrichment columns. Costs the same as `ITM_ARTICLE_HEADER` when all flags are 'N'.
3. **Client-side enrichment override** in `ai.assistant.component.ts` — `buildEnrichmentOverride(route, questionText)` runs **after `/route` returns and before `/execute`**:
   - Requires (a) a continuation marker (`and|add|also|plus|with|include|enrich|consolidate|merge`), (b) at least one enrichment keyword (`retail|ean|upc|barcode|price history|…`), and (c) an `lu_id` already in `currentSessionContext.entities`.
   - Returns `{ skill_id, template_code, bindings, entities }` and the caller overrides **all four** on the execute payload (see "Skill-id override" below — both `skill_id` AND `template_code` must be overridden, not just the template).
   - Merges `bindings.include_*` flags with prior bindings (additive — turn 2 adds retail, turn 3 adds EAN, the table grows monotonically).
   - When `include_retail = 'Y'` but no `site_id` is bound yet, the assistant prompts "For which store should I look up retail?" and stashes the requested flags **plus the owning skill_id** in `pendingEnrichment`. The user's next reply (`store 10` or bare `10`) resumes the same enrichment.
4. **Branch A tightening — `pendingEnrichment` is `site_id`-only.** When the stash is set, the next turn only resumes the enrichment if the user's reply *looks like a site code* (bare 1–5 digits, `store N`, `site N`, `at N`). Any other input — a brand-new question, a different item — clears the stash and lets `/route` run normally. Prevents the user from being trapped in the pending state when they change topics.

#### Skill-id override (critical — the silent failure mode)

The user's reply to the site-id prompt (`"7"`) and short continuation phrases (`"add retail"`, `"and the ean"`) carry **too little signal for `/route` to land on `ITEM_MASTER_RETAIL`**. The router picks whatever vocab is closest — e.g. `DSD_VENDOR_RETAIL` because `"retail"` is in its phrases, or `CONVERSATIONAL_ASSISTANT` because a bare digit looks like small talk. The `/execute` endpoint then looks up `template_code` **inside the routed skill** (`AI_SKILL_SQL_TEMPLATE` is keyed on `(skill_id, template_code)`). If `ITM_FULL_ATTRIBUTES` doesn't live there, the engine falls back to a feasible template that matches the supplied binds — for `lu_id`→`ARVCEXR` + `site_id`→`SITSITE`, that's `DSD_ARTICLE_SITE_STATUS`. The result is correctly bound, prettily summarized by the composer, and **the wrong query**.

To prevent that, `processInquiry` overrides **both** fields on the execute payload when an enrichment is active:

```typescript
skill_id: enrichmentOverride
    ? enrichmentOverride.skill_id          // ← forced to ITEM_MASTER_RETAIL
    : route?.selected_skill_id,
// ...
if (enrichmentOverride) {
    execPayload.template_code = enrichmentOverride.template_code;  // 'ITM_FULL_ATTRIBUTES'
}
```

The `skill_id` is sourced from:
- `pendingEnrichment.skill_id` (Branch A) — stashed at the moment we asked for the store code.
- `findLastItemCardSkillId()` (Branch B + Branch A fallback) — walks `chatTurns` backwards for the most recent assistant turn whose `meta.template_code` is `ITM_ARTICLE_HEADER` or `ITM_FULL_ATTRIBUTES` and reads its `meta.feedback.skill_id`. If no item-card turn is in history, `buildEnrichmentOverride` returns `null` and we fall back to normal routing.

#### `feedback.skill_id` must record the *executed* skill, not the *routed* one

Linked to the above: `handleExecuteResponse` writes `feedback.skill_id = exec.skill_id || exec.selected_skill_id || route.selected_skill_id || …`. On enrichment turns the client forced `skill_id` to `ITEM_MASTER_RETAIL`, and the `/execute` response echoes it back. That echoed value is what `findLastItemCardSkillId()` reads on the *next* continuation. If we recorded `route.selected_skill_id` instead, the next continuation would read the (wrong) DSD_VENDOR_RETAIL and the cycle of falling back to `DSD_ARTICLE_SITE_STATUS` would repeat indefinitely.

**Follow-up chips** on an `ITM_ARTICLE_HEADER` turn are `"Add retail price"`, `"Add EAN codes"`, `"Add price history"`. On an `ITM_FULL_ATTRIBUTES` turn the chips show only the flags **not yet on** plus a `"Show full price history"` escape hatch (which routes to `ITM_RETAIL_HISTORY` and renders a separate stacked table — that's M:N per variant and would visually break the card if merged in).

**Vocabulary** (script 29 — idempotent MERGE) adds 22 new `INTENT_PHRASE` rows on `ITEM_MASTER_RETAIL` for enrichment-style phrasings ("add retail price", "and the ean", "plus the ean", "consolidate the result", "full item card", …), all with `canonical_concept = 'ITEM_FULL_ATTRIBUTES'` and boosts 1.3–1.6 so they outrank the older single-template phrasings when the user is enriching. The chip text matches these phrases exactly so chip clicks route deterministically.

**Composer copy** (`ai.composer.js`) — `isItemCard()` matches `^ITM_(ARTICLE_HEADER|FULL_ATTRIBUTES)$` and renders human summaries like "Showing the active sale variant for 100100 — 24OZ BOBS BBQ. Enriched with retail at store 10, all active EAN codes." The summary lists which `include_*` flags fed the run from the execute `ctx`. **Important bug fix from script 29:** `isArticleStatus()` previously matched `/ARTICLE/i` and silently captured `ITM_ARTICLE_HEADER`, producing the wrong "Article status retrieved... ETAT" copy — now `isItemCard` matches first and `isArticleStatus` excludes it.

**Reset semantics:** `resetConversation` clears both `pendingEnrichment` and `currentSessionContext.bindings`, so a fresh question starts with no flags. To remove a single flag mid-conversation, the user can ask "start over" — there's no per-flag toggle today (v1 scope).

**Schema gotcha — `AI_SKILL_SQL_TEMPLATE.PURPOSE` is `VARCHAR2(200)`.** Hit twice now (scripts 26 and 29) with `ORA-12899: value too large for column ... PURPOSE (actual: 249/258, maximum: 200)`. Keep `purpose` strings ≤200 chars — abbreviate aggressively (`SV` for sale variant, `90d` for 90-day, `priority` instead of `best-priority`, slash-list instead of comma-list, no trailing prose). The column documents the SQL for designers; verbose detail belongs in the file header comment, not in the row.

---

## S24 AI Data Health — pipeline integrity monitor

**Purpose:** Detect silent data pipeline failures before they corrupt business analysis. This screen is the prerequisite for S08/S09/S11 — running replenishment or blocker analysis on top of missing sales data or unloaded receipts produces wrong answers confidently.

**Route:** `src/app/pages/supply-chain-ai/operations/data-health/` · path `ai/data-health`

**Access:** Admin + SC Manager (same role gate as S08)

---

### Issue taxonomy — by pipeline stage

Each stage can fail silently. Checks are organised by flow stage, not by GOLD table.

```
[1] Item master → [2] Ranging/allocation → [3] Orders → [4] Receipts → [5] Stock → [6] Sales
```

| Stage | Check code | Issue | Severity | Schedule |
|---|---|---|---|---|
| Item master | `ITEM_NO_SUPPLIER` | Active item, no active supplier in ARTUC (expired or empty) | WARNING | NIGHTLY |
| Item master | `ITEM_NO_BARCODE` | Active item, no ARTCOCA barcode row | WARNING | NIGHTLY |
| Item master | `ITEM_NO_RETAIL` | Active item, no active AVEPRIX row at any store | WARNING | NIGHTLY |
| Ranging | `ITEM_NO_SITE` | Item in ARTRAC with no ARTSITE row at any store | WARNING | NIGHTLY |
| Ranging | `ITEM_NOT_IN_WH` | Item ranged at store but no warehouse allocation / not sent to WH | WARNING | NIGHTLY |
| Orders | `ORDER_REJECTED` | CDEDETCDE line with supplier rejection code, unresolved | WARNING | HOURLY |
| Orders | `ORDER_OVERDUE` | PO expected delivery date passed, no STOMVT receipt movement | CRITICAL | HOURLY |
| Orders | `ORDER_NO_ACK` | PO sent to supplier, no acknowledgment after 48h | WARNING | HOURLY |
| Receipts | `RECEIPT_NOT_LOADED` | DOCKPLAN entry with no corresponding STOMVT receipt movement | CRITICAL | REALTIME |
| Receipts | `RECEIPT_NO_PO` | STOMVT receipt movement with no matching CDEENTCDE PO | WARNING | HOURLY |
| Receipts | `RECEIPT_QTY_GAP` | Received qty differs from ordered qty by > threshold | WARNING | HOURLY |
| Stock | `STOCK_NEGATIVE` | STOCOUCH negative stock layers | WARNING | NIGHTLY |
| Stock | `STOCK_NO_PO` | Item below reorder point, on-hand zero, no open PO | CRITICAL | NIGHTLY |
| Sales | `SALES_NOT_LOADED` | No STOMVT type 1/10 movements for active store > 24h | CRITICAL | REALTIME |
| Sales | `SALES_UNKNOWN_EAN` | EAN scanned at POS with no matching ARTCOCA row | WARNING | HOURLY |
| Sales | `SALES_DEAD_STOCK` | Active item at active store — zero sales 30+ days | INFO | NIGHTLY |

---

### Three-tier schedule

| Tier | Frequency | Checks | Reason |
|---|---|---|---|
| REALTIME | Every 5 min | `SALES_NOT_LOADED`, `RECEIPT_NOT_LOADED` | Feed failures need immediate detection — a broken POS feed at 9am is a P1 incident |
| HOURLY | Every hour | All ORDER_* and RECEIPT_*, `SALES_UNKNOWN_EAN` | Order/delivery window is hours; catching rejections quickly avoids stock gaps |
| NIGHTLY | 2am | All ITEM_*, RANGING_*, STOCK_*, `SALES_DEAD_STOCK` | These change slowly; nightly is sufficient and avoids GOLD load during business hours |

---

### DB objects — ICR app DB (no new GOLD objects)

```sql
-- Check definitions (static config, seeded at deploy time)
CREATE TABLE AI_DATA_CHECK_DEF (
    CHECK_CODE        VARCHAR2(40)   NOT NULL,  -- e.g. SALES_NOT_LOADED
    RETAILER_ID       VARCHAR2(50)   NOT NULL,
    CATEGORY          VARCHAR2(30)   NOT NULL,  -- ITEM_MASTER / RANGING / ORDER / RECEIPT / STOCK / SALES
    CHECK_NAME        VARCHAR2(200)  NOT NULL,
    SEVERITY          VARCHAR2(10)   NOT NULL,  -- CRITICAL / WARNING / INFO
    SCHEDULE_TIER     VARCHAR2(10)   NOT NULL,  -- REALTIME / HOURLY / NIGHTLY
    LIBQUERY_COUNT    VARCHAR2(20)   NOT NULL,  -- LIBQUERY id returning COUNT(*) of affected rows
    LIBQUERY_DETAIL   VARCHAR2(20),             -- LIBQUERY id returning the affected row list (drill-down)
    DRILL_SKILL_CODE  VARCHAR2(100),            -- AI skill to invoke on "Investigate" button
    ACTIVE            NUMBER(1)      DEFAULT 1,
    CONSTRAINT pk_ai_data_check_def PRIMARY KEY (CHECK_CODE, RETAILER_ID)
);

-- Check results (written by scheduler, read by dashboard)
CREATE TABLE AI_DATA_CHECK_RESULT (
    CHECK_CODE        VARCHAR2(40)   NOT NULL,
    RETAILER_ID       VARCHAR2(50)   NOT NULL,
    RUN_AT            TIMESTAMP      NOT NULL,
    ISSUE_COUNT       NUMBER         NOT NULL,
    PREV_COUNT        NUMBER,                  -- previous run count (delta trend)
    SEVERITY_FLAG     VARCHAR2(10),            -- computed: CRITICAL if REALTIME tier and count > 0
    SAMPLE_IDS        VARCHAR2(4000),          -- LISTAGG of first 20 affected entity IDs (fast preview tooltip)
    CONSTRAINT pk_ai_data_check_result PRIMARY KEY (CHECK_CODE, RETAILER_ID, RUN_AT)
);

-- Only keep last 30 days of results per check (purged by nightly job)
```

**Deploy scripts:**
- `deployment/database/SCRIPTS/29_data_health_libquery.sql` — LIBQUERY entries AI0000080–AI0000089 (DDL for `AI_DATA_CHECK_DEF`, `AI_DATA_CHECK_RESULT`, and `AI_RUN_DATA_CHECKS` procedure skeleton included as commented blocks at the bottom)
- Angular files: `src/app/pages/supply-chain-ai/operations/data-health/` (S24) + `config/` (S25), service `src/app/shared/services/ai/ai.data.health.service.ts`

---

### LIBQUERY entries

New range `AI0000080`–`AI0000099` reserved for S24 data health checks.

**S24 — dashboard reads (AI0000080–AI0000084):**

| QUERYNUM | Operation | Type |
|---|---|---|
| AI0000080 | Latest result per check — dashboard summary cards (grouped by category) | GET |
| AI0000081 | Result history for one check — trend data (last 30 runs) | GET |
| AI0000082 | Drill-down: affected entity IDs for a specific check + run | GET |
| AI0000083 | Check definitions active for retailer — S24 uses to render category groups | GET |
| AI0000084 | Manual trigger — `BEGIN AI_RUN_DATA_CHECKS(:param1, :param2); END;` | POST (QUERYUPDATE=1) |

**S25 — configuration CRUD (AI0000085–AI0000089):**

| QUERYNUM | Operation | Type |
|---|---|---|
| AI0000085 | All check definitions for retailer (config list, includes inactive) | GET |
| AI0000086 | Single check definition by CHECK_CODE | GET |
| AI0000087 | MERGE check definition — insert or update | POST (QUERYUPDATE=1) |
| AI0000088 | Toggle ACTIVE flag | POST (QUERYUPDATE=1) |
| AI0000089 | Delete check definition (admin only, QUERYACCESS=0) | POST (QUERYUPDATE=1) |

**No custom backend route.** All S24 data access goes through LIBQUERY:
- Scheduled runs are executed **entirely within Oracle** — the scheduler job (`06_scheduler.sql`) calls the `AI_RUN_DATA_CHECKS(p_tier, p_retailer_id)` PL/SQL procedure directly on the defined schedule. Node is not involved.
- Dashboard reads use standard LIBQUERY GETs (AI0000081–0083).
- The manual "Run now" button calls AI0000084 via `postQueryResult('AI0000084', [{ TIER: tier, RETAILER_ID: retailerId }])` — same pattern as any other POST DML entry. The stored procedure handles all the iteration and inserts internally.

### Oracle procedure (skeleton in `29_data_health_libquery.sql` commented block)

```sql
CREATE OR REPLACE PROCEDURE AI_RUN_DATA_CHECKS (
    p_tier        IN VARCHAR2,   -- 'REALTIME' | 'HOURLY' | 'NIGHTLY'
    p_retailer_id IN VARCHAR2
) AS
    -- Iterates AI_DATA_CHECK_DEF for the given tier + retailer,
    -- executes each check's SQL dynamically, writes count + sample IDs
    -- into AI_DATA_CHECK_RESULT. Called by Oracle scheduler jobs and
    -- by AI0000084 LIBQUERY POST from the "Run now" button.
BEGIN
    ...
END;
```

The scheduler entries in `06_scheduler.sql` call this procedure on three intervals:
```sql
-- REALTIME checks (every 5 minutes)
DBMS_SCHEDULER.CREATE_JOB(job_name=>'AI_DATA_HEALTH_REALTIME', repeat_interval=>'FREQ=MINUTELY;INTERVAL=5', job_action=>'BEGIN AI_RUN_DATA_CHECKS(''REALTIME'', ''HNU_PREPROD''); END;');
-- HOURLY checks
DBMS_SCHEDULER.CREATE_JOB(job_name=>'AI_DATA_HEALTH_HOURLY',   repeat_interval=>'FREQ=HOURLY',              job_action=>'BEGIN AI_RUN_DATA_CHECKS(''HOURLY'',   ''HNU_PREPROD''); END;');
-- NIGHTLY checks (2am)
DBMS_SCHEDULER.CREATE_JOB(job_name=>'AI_DATA_HEALTH_NIGHTLY',  repeat_interval=>'FREQ=DAILY;BYHOUR=2',      job_action=>'BEGIN AI_RUN_DATA_CHECKS(''NIGHTLY'',  ''HNU_PREPROD''); END;');
```

---

### AI resolution bridge

Each issue card has an **Investigate** button. It opens the AI assistant (S14) with:

```typescript
// pre-loaded context injected before the user types
currentSessionContext.entities = {
    ...entityFromCheckResult   // e.g. { supplier_id: '06966' } for an ORDER check
};
// first turn pre-populated (not sent yet — user sees it in the composer)
composerText = checkDef.drill_skill_code
    ? buildInvestigatePrompt(checkResult)  // e.g. "Why are Lipari receipts not confirmed?"
    : '';
// skill pre-selected via preferred_skill_id
routePayload.preferred_skill_id = resolveSkillId(checkDef.drill_skill_code);
```

**Drill skill map** (configured in `AI_DATA_CHECK_DEF.DRILL_SKILL_CODE`):

| Check category | Skill invoked |
|---|---|
| ITEM_MASTER, RANGING | `ITEM_MASTER_RETAIL` |
| ORDER, RECEIPT | `DELIVERY_EXCEPTION` |
| STOCK | `STOCK_VARIANCE` |
| SALES | `DSD_VENDOR_RETAIL` or `ITEM_MASTER_RETAIL` depending on check |

---

### Dashboard layout (S24)

```
┌─────────────────────────────────────────────────────────────────┐
│  AI Data Health  ·  Heinens PREPROD  ·  Last run: 09:47         │
│  ● 2 CRITICAL   ◐ 9 WARNING   ○ 4 INFO         [Run now]        │
└─────────────────────────────────────────────────────────────────┘

  ITEM MASTER              RANGING / ALLOCATION
  ─────────────────────    ───────────────────────
  ◐ No supplier  47 items  ◐ Not in warehouse  12 items
  ○ No barcode    8 items  [Investigate →]
  [Investigate →]

  ORDERS                   RECEIPTS
  ─────────────────────    ───────────────────────
  ◐ Rejected     12 lines  ● Not loaded   3 docs   ← REALTIME
  ◐ Overdue       6 POs    ◐ Qty gap      4 docs
  [Investigate →]          [Investigate →]

  STOCK                    SALES
  ─────────────────────    ───────────────────────
  ◐ Negative      8 items  ● No POS feed  Store 041  ← REALTIME
  ● No PO, zero   3 items  ◐ Unknown EAN  23 scans
  [Investigate →]          [Investigate →]
```

REALTIME checks show a pulsing indicator when `ISSUE_COUNT > 0` and last run was < 10 min ago. Trend delta (▲/▼ vs previous run) shown next to each count.

---

### Deployment order

Add to the main deploy sequence after script 28:

```
29_data_health_libquery.sql  — LIBQUERY AI0000080–AI0000089
                               DDL (AI_DATA_CHECK_DEF, AI_DATA_CHECK_RESULT, AI_RUN_DATA_CHECKS)
                               is in the commented block at the bottom — uncomment and run once.
```

Angular modules (`AiDataHealthModule`, `AiDataHealthConfigModule`) and routes (`ai/data-health`, `ai/data-health/config`) are already wired in `app.module.ts` and `app-routing.module.ts`. No new backend routes — all S24/S25 data access goes through LIBQUERY.

---

## S25 AI Data Health Configuration

**Purpose:** Admin screen to manage the `AI_DATA_CHECK_DEF` catalog without a database deployment. An admin enters a LIBQUERY count query ID, fills in the metadata, and the check immediately appears in S24. Existing checks can be edited, enabled, or disabled at any time.

**Route:** `src/app/pages/supply-chain-ai/operations/data-health/config/` · path `ai/data-health/config`

**Access:** Admin only (`USERAIADMIN = 1`). Linked from S24 via a "Configure checks" button (top-right, admin-gated).

---

### Screen layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Data Health Configuration  ·  Heinens PREPROD  [+ Add check]   │
└─────────────────────────────────────────────────────────────────┘

 Filter: [All categories ▾]  [All severities ▾]  [Active only ☑]

 ┌────────────────┬──────────────┬──────────┬──────────┬──────────┬────────────────────┐
 │ Check          │ Category     │ Severity │ Schedule │ Active   │ Actions            │
 ├────────────────┼──────────────┼──────────┼──────────┼──────────┼────────────────────┤
 │ SALES_NOT_LOADED│ SALES       │ CRITICAL │ REALTIME │ ● ON     │ [Edit] [Test] [⋮]  │
 │ ITEM_NO_SUPPLIER│ ITEM_MASTER │ WARNING  │ NIGHTLY  │ ● ON     │ [Edit] [Test] [⋮]  │
 │ RECEIPT_QTY_GAP │ RECEIPT     │ WARNING  │ HOURLY   │ ○ OFF    │ [Edit] [Test] [⋮]  │
 └────────────────┴──────────────┴──────────┴──────────┴──────────┴────────────────────┘
```

**Add / Edit form (slide-in panel or inline row expand):**

```
Check code *        [SALES_NOT_LOADED         ]  ← auto-uppercased, no spaces
Check name *        [No POS movements > 24h   ]
Category *          [SALES              ▾]
Severity *          [CRITICAL           ▾]
Schedule tier *     [REALTIME           ▾]

Count LIBQUERY *    [AI0000084          ]  ← required — the COUNT query
                    [ Verify ]             ← button: runs the LIBQUERY, shows returned count
                    "Query returned: 3 rows"  ← inline preview after verify

Detail LIBQUERY     [AI0000085          ]  ← optional — drill-down rows
                    [ Verify ]

Drill skill code    [DSD_VENDOR_RETAIL   ▾]  ← optional — AI skill for Investigate button

Active              [● ON               ]  ← toggle

[ Save ]  [ Cancel ]
```

---

### Key UX rules

**Verify button (before save):** Calls the COUNT LIBQUERY with a neutral param (`-1`) and shows the raw return count inline. This lets the admin confirm they entered the right LIBQUERY ID before saving. If the LIBQUERY doesn't exist or returns an error, the field is flagged red and Save is blocked.

**Check code:** Auto-uppercased, underscores only, validated unique per retailer on save. Cannot be changed after first save (it is the PK) — edit creates a copy with a new code if needed.

**Active toggle:** Available directly on the list row (no need to open the edit form) — one click to disable a noisy check during an investigation, one click to re-enable.

**Test button:** Runs `AI0000084` scoped to this single check code only. Returns the current count and sample IDs in a toast or inline panel — gives the admin confidence the check is working before enabling it on the live dashboard.

**Delete:** Available in the `[⋮]` overflow menu, admin-only (QUERYACCESS=0 on AI0000089). Soft approach recommended: disable first, delete after confirming the check is not needed.

---

### LIBQUERY — S25 detail

**AI0000085 — GET all checks for retailer (config list):**
```sql
SELECT CHECK_CODE, CHECK_NAME, CATEGORY, SEVERITY, SCHEDULE_TIER,
       LIBQUERY_COUNT, LIBQUERY_DETAIL, DRILL_SKILL_CODE, ACTIVE
FROM   AI_DATA_CHECK_DEF
WHERE  RETAILER_ID = :param1
ORDER  BY CATEGORY, SEVERITY DESC, CHECK_CODE
```

**AI0000087 — POST MERGE check definition:**
```sql
MERGE INTO AI_DATA_CHECK_DEF d
USING (SELECT :param1 CHECK_CODE, :param2 RETAILER_ID FROM DUAL) s
ON    (d.CHECK_CODE = s.CHECK_CODE AND d.RETAILER_ID = s.RETAILER_ID)
WHEN MATCHED THEN UPDATE SET
    CHECK_NAME = requestbody."CHECK_NAME", CATEGORY = requestbody."CATEGORY",
    SEVERITY = requestbody."SEVERITY", SCHEDULE_TIER = requestbody."SCHEDULE_TIER",
    LIBQUERY_COUNT = requestbody."LIBQUERY_COUNT", LIBQUERY_DETAIL = requestbody."LIBQUERY_DETAIL",
    DRILL_SKILL_CODE = requestbody."DRILL_SKILL_CODE", ACTIVE = requestbody."ACTIVE"
WHEN NOT MATCHED THEN INSERT (CHECK_CODE, RETAILER_ID, CHECK_NAME, CATEGORY,
    SEVERITY, SCHEDULE_TIER, LIBQUERY_COUNT, LIBQUERY_DETAIL, DRILL_SKILL_CODE, ACTIVE)
VALUES (requestbody."CHECK_CODE", requestbody."RETAILER_ID", requestbody."CHECK_NAME", ...)
```
Angular sends `postQueryResult('AI0000087', [{ CHECK_CODE, RETAILER_ID, CHECK_NAME, CATEGORY, SEVERITY, SCHEDULE_TIER, LIBQUERY_COUNT, LIBQUERY_DETAIL, DRILL_SKILL_CODE, ACTIVE }])`.

**AI0000088 — POST toggle ACTIVE:**
```sql
UPDATE AI_DATA_CHECK_DEF
SET    ACTIVE = requestbody."ACTIVE"
WHERE  CHECK_CODE  = requestbody."CHECK_CODE"
AND    RETAILER_ID = requestbody."RETAILER_ID"
```
Angular sends `postQueryResult('AI0000088', [{ CHECK_CODE, RETAILER_ID, ACTIVE: 0 | 1 }])`.

---

### What does NOT go in S25

- **The COUNT SQL itself** is authored in LIBQUERY (S21 Skill Builder pattern or direct DB insert). S25 only stores the LIBQUERY ID that points to it — not the SQL. This keeps the separation clean: S25 is the catalog manager, LIBQUERY is the SQL store.
- **Scheduler interval changes** — the three Oracle scheduler jobs (REALTIME/HOURLY/NIGHTLY) run all checks of that tier. Adding a new NIGHTLY check just means it gets picked up on the next 2am run automatically — no scheduler change needed.

---

### Deployment order

```
29_data_health_libquery.sql  — LIBQUERY AI0000080–AI0000089 (DELETE+INSERT, NVL(MAX(QUERYID),0)+1)
                               DDL for AI_DATA_CHECK_DEF + AI_DATA_CHECK_RESULT tables,
                               AI_RUN_DATA_CHECKS procedure, and scheduler job stubs
                               are in the commented block — uncomment and run once before the LIBQUERY inserts.
```

S24 and S25 share the same deployment script. S25 is the config surface; S24 is the read surface.

---

## S14 AI Assistant — result consolidation (Phase 12, item augmentation)

**Design decision: Option A — re-execute `ITM_FULL_ATTRIBUTES` with accumulated flags.**

When an analyst is looking at an item result and asks to add columns ("add retail price", "with EAN codes", "include reference to order"), the assistant does **not** run a second independent query. Instead it re-executes `ITM_FULL_ATTRIBUTES` for the same `lu_id` with a growing set of `include_*` flags, replacing the working result in place. This avoids client-side join complexity and keeps cardinality clean (EANs are LISTAGG'd into one cell inside the template, so the row count stays 1-per-variant).

### Trigger condition — AUGMENT intent

Detected when **all three** are true:
1. An `activeItemQuery` is already stored in `currentSessionContext` (set when any `ITM_*` template executes successfully).
2. The user's message contains augmentation language: `add`, `include`, `also`, `with`, `show me also`, `plus`, `and the`.
3. The message references a column domain: `retail` / `price` / `ean` / `barcode` / `reference` / `order ref` / `ord.` / `rec.` — **without** a new item identifier (if a new LU code appears, it is a new query, not augmentation).

### Session state added to `currentSessionContext`

```typescript
activeItemQuery: {
    lu_id: string;              // item being discussed
    include_ean: 'Y' | 'N';    // accumulated flag
    include_retail: 'Y' | 'N'; // accumulated flag
    include_history: 'Y' | 'N';
    site_id?: string;           // required if include_retail = 'Y'
    as_of_date?: string;
} | null
```

Set to `null` when a new question resets the conversation. Set when any `ITM_*` template runs successfully (lu_id extracted from the executed bind context). Flags start at `N` and flip to `Y` as the user asks for each dimension.

### Execution flow

```
User: "tell me about item 100100"
  → routes ITEM_MASTER_RETAIL → executes ITM_ARTICLE_HEADER
  → stores: activeItemQuery = { lu_id: '100100', include_ean: 'N', include_retail: 'N', … }
  → chat bubble shows V_GOLD_ITEM result (header)

User: "add retail price"
  → AUGMENT intent detected (no new lu_id, contains "add retail")
  → if site_id not in context → prompt "Which store?" (pause flow)
  → site_id available → flip include_retail = 'Y'
  → re-execute ITM_FULL_ATTRIBUTES with lu_id=100100, include_retail=Y, include_ean=N
  → right panel "Detailed results" card updates in place (NOT a new chat bubble row)

User: "also add EAN codes"
  → flip include_ean = 'Y'
  → re-execute ITM_FULL_ATTRIBUTES with include_retail=Y, include_ean=Y
  → result grows by one EAN column (LISTAGGd per variant inside the template)
```

### UX: result replaces in the right-panel card, not the chat

The chat log gets a short text turn ("Added retail price to the item view.") but the data table update goes to the right-panel "Detailed results" card, which already replaces on each run. The chat bubble does **not** grow a new inline table for augment turns — this keeps the conversation readable.

### Risks and constraints

| Risk | Mitigation |
|---|---|
| `site_id` missing when user asks for retail | Detect before re-executing; push "Which store are you checking?" as an assistant turn and wait |
| "Reference to order" (`Ord./Rec.` column) is already in `V_GOLD_ITEM` | No new flag needed — already returned by `ITM_ARTICLE_HEADER` / `ITM_FULL_ATTRIBUTES` base |
| "Add supplier details" → different skill domain | Not an AUGMENT — route normally; `activeItemQuery` is preserved so a subsequent item question still works |
| EAN LISTAGG truncation (Oracle 4000-char limit) | Edge case: items with 20+ EANs (bulk packs). Add `SUBSTR(..., 1, 3900)` guard in the template |
| `include_history` flag requires date range | If user asks "add price history", prompt for date range or default to SYSDATE−90/+30 |

### What does NOT need to change

- `ai.engine.js` routing and execution — AUGMENT goes through the same `/route` + `/execute` path; the engine just receives `ITM_FULL_ATTRIBUTES` as the forced `template_code` and the accumulated flags in `entities`/`bindings`.
- `AI_SKILL_SQL_TEMPLATE` — `ITM_FULL_ATTRIBUTES` already handles all flag combinations.
- `V_GOLD_ITEM` — no change needed; `ITM_FULL_ATTRIBUTES` joins it directly.

### What does need to change

| Layer | Change |
|---|---|
| `ai.assistant.component.ts` | Detect AUGMENT intent client-side; maintain `activeItemQuery` in `currentSessionContext`; build execute payload with `template_code: 'ITM_FULL_ATTRIBUTES'` + accumulated flags |
| `ai.engine.js` `/route` | Optionally: add AUGMENT as a recognized `intent_type` so routing diagnostics label it correctly (not strictly required — the assistant can bypass scoring with a forced `template_code`) |
| `ai.assistant.component.html` | Suppress new inline result table for AUGMENT turns; show short text only in chat bubble; right-panel card updates automatically |
| Vocabulary (optional) | Add `INTENT_PHRASE` rows on `ITEM_MASTER_RETAIL` for "add retail", "include ean", "with barcode" so the playground shows correct routing even when the augment is fired from the engine rather than client-side |

---

## S14 AI Assistant — UX improvement plan

The assistant serves two very different audiences (analysts and admin/designers) in the same viewport. The plan below separates the two roles and progressively cleans up the analyst experience. Items are ordered by impact-to-effort ratio.

| # | Change | Audience | Status |
|---|---|---|---|
| 1 | Gate Engine diagnostics, Designer panel, Requested SQL artifacts, and Detailed results right-panel card behind `USERAIADMIN = 1` | Analyst / Admin | **Done** |
| 2 | Commit to chat-bubble-only result pattern for analysts — right-panel Detailed results card is admin-only; non-admins get the inline per-turn result table | Analyst / Admin | **Done** |
| 2b | Rename chat panel heading from "S14 Conversation" to "Supply Chain Assistant"; replace developer subtitle with analyst-facing copy | Analyst | **Done** |
| 3 | Move evidence facts into the chat bubble below `human_summary`; remove the standalone right-panel "Evidence facts" card | Analyst | Pending |
| 4 | Replace raw skill codes on clarification chips (`DSD_VENDOR_RETAIL`) with human-readable skill name / domain | Analyst | Pending |
| 5 | Reframe or gate the routing confidence gauge — show a simple "understood / unsure / no match" indicator to analysts; show the full SVG arc gauge to admins only | Analyst / Admin | Pending |
| 6 | Add 3–4 example prompt chips to the empty composer state (clicking fills the textarea) | Analyst | Pending |
| 7 | Humanize Active context entity keys — display `supplier_id` as **Supplier**, `site_id` as **Store**, `lu_id` as **Item (LU)**, etc. | Analyst | Pending |
| 8 | Add a "New conversation" icon button to the chat header (visible once turns exist, beside Export session) | Analyst | Pending |
| 9 | Surface `Enter to send · Shift+Enter for newline` hint below the composer textarea | Analyst | Pending |
| 10 | Strip `template_code` / `skill_code` technical badges and SQL debug toggle from inline bubble result headers for non-admins | Analyst / Admin | **Done** (part of #1) |

### What was implemented (#1, #2, #10)

**Files changed:**
- `src/app/pages/supply-chain-ai/inquiry/ai-assistant/ai.assistant.component.ts`
- `src/app/pages/supply-chain-ai/inquiry/ai-assistant/ai.assistant.component.html`

**TypeScript changes:**
- Imported `UserService` from `src/app/shared/services`
- Injected `private _userSvc: UserService` in the constructor
- Added `isAiAdmin = false` as a class property, set in `ngOnInit` via `Number(this._userSvc.userInfo?.aiAdmin) === 1` — plain property (not a getter) to avoid Angular incremental-build cache skipping the template recompile

**Template guards added (`*ngIf="isAiAdmin && ..."`):**
| Element | Condition before | Condition after |
|---|---|---|
| Engine diagnostics `p-card` | `hasDebugInfo()` | `isAiAdmin && hasDebugInfo()` |
| Requested SQL artifacts `p-card` | `requestedSql.length` | `isAiAdmin && requestedSql.length` |
| Adjust & extend / Designer panel `p-card` | `showDesignerPanel` | `isAiAdmin && showDesignerPanel` |
| Detailed results right-panel `p-card` | `!requestedSql.length && resultColumns.length` | `isAiAdmin && !requestedSql.length && resultColumns.length` |
| `template_code` badge in bubble header | `t.meta?.template_code` | `isAiAdmin && t.meta?.template_code` |
| `skill_code` badge in bubble header | `t.meta?.skill_code` | `isAiAdmin && t.meta?.skill_code` |
| SQL debug toggle button in bubble | `turnHasDebug(t)` | `isAiAdmin && turnHasDebug(t)` |

**Analyst experience (non-admin):** clean chat with inline result table per turn, enrichment chips, follow-up suggestions, thumbs feedback, active context editor. Right panel shows only "What we found", investigation timeline, evidence facts, and active context.

**Admin experience (`USERAIADMIN = 1`):** full view — all cards visible including engine diagnostics, skill score breakdown, vocab match chips, bind feasibility table, executed SQL, designer retry panel, and the dedicated right-panel Detailed results table with CSV/Excel export.

**Build note:** After deploying these changes, clear the Angular build cache and do a full restart of `ng serve`:
```bash
rm -rf controlRoom_client/.angular/cache
ng serve
```
Angular's incremental AOT compiler caches compiled template bytecode; a plain property is safer than a getter here because it avoids the incremental-build mismatch where the TypeScript change compiles but the template recompile is skipped.

---

## Diagnostic Chain Architecture — Rule-based Analytical Engine

### Why no LLM

The Node.js server is cloud-hosted with restricted disk space and access. External LLM APIs (Anthropic, OpenAI, etc.) are prohibited by company data policy. Local LLM (Ollama) is not viable due to disk constraints. **All analytical synthesis is therefore rule-based** — no ML model of any kind.

This is viable because the GOLD ERP supply chain diagnostic space is finite and enumerable. "Why is item X not shipping?" has ~8–12 known root causes. Expert-system pattern matching on structured SQL evidence produces accurate, auditable, deterministic answers for every authored branch.

---

### Design principle: data retrieval vs. analytical diagnosis

| Request type | Example | Engine path |
|---|---|---|
| **Retrieval** | "What DSD items can we buy from Lipari at store 7?" | Existing: single skill → single template → SQL → composer summary |
| **Diagnostic** | "Why is item 100100 not shipping from the warehouse?" | New: diagnostic chain → sequential SQL steps → rule match → conclusion template |

The routing layer detects intent type. `DIAGNOSTIC` intent (triggered by `why`, `what's blocking`, `root cause`, `why isn't`, `what happened to`) routes to `executeDiagnosticChain()` instead of `pickExecutionTemplate()`.

---

### New DB objects (ICR app DB)

```sql
-- Ordered SQL steps for a diagnostic skill
CREATE TABLE AI_DIAGNOSTIC_STEP (
    SKILL_ID        VARCHAR2(100)  NOT NULL,   -- FK to AI_SKILL.SKILL_ID
    STEP_ORDER      NUMBER(3)      NOT NULL,   -- execution order within skill
    TEMPLATE_CODE   VARCHAR2(100)  NOT NULL,   -- FK to AI_SKILL_SQL_TEMPLATE.TEMPLATE_CODE
    STOP_FIELD      VARCHAR2(100),             -- result column to evaluate (e.g. 'STOCK')
    STOP_OPERATOR   VARCHAR2(10),             -- =, !=, >, <, IS NULL, IS NOT NULL
    STOP_VALUE      VARCHAR2(200),            -- value to compare against (e.g. '0', 'WH')
    CONCLUSION_KEY  VARCHAR2(100),            -- FK to AI_DIAGNOSTIC_CONCLUSION if stop condition met
    STEP_LABEL      VARCHAR2(200),            -- human label shown in evidence chain (e.g. 'DC stock check')
    STEP_TYPE       VARCHAR2(10)   DEFAULT 'HARD' NOT NULL,  -- HARD = abort chain; SOFT = record issue, continue
    CONSTRAINT pk_ai_diag_step PRIMARY KEY (SKILL_ID, STEP_ORDER, CONCLUSION_KEY),
    CONSTRAINT chk_diag_step_type CHECK (STEP_TYPE IN ('HARD','SOFT'))
);

-- Conclusion templates with data field substitution
CREATE TABLE AI_DIAGNOSTIC_CONCLUSION (
    CONCLUSION_KEY      VARCHAR2(100)  NOT NULL,
    RETAILER_ID         VARCHAR2(50)   NOT NULL,
    SUMMARY_TEMPLATE    VARCHAR2(2000) NOT NULL,  -- {lu_id}, {site_id}, {supplier}, {po_number}, {days} etc.
    EVIDENCE_TEMPLATE   VARCHAR2(4000),           -- pipe-separated evidence bullet templates
    FOLLOW_UP_TEMPLATE  VARCHAR2(500),            -- follow-up hint text (optional)
    SEVERITY            VARCHAR2(10)   DEFAULT 'WARNING',  -- CRITICAL / WARNING / INFO
    CONSTRAINT pk_ai_diag_conc PRIMARY KEY (CONCLUSION_KEY, RETAILER_ID)
);
```

Deploy script: `37_diagnostic_chain_tables.sql` (DDL only, after script 36). Script includes an idempotent `ALTER TABLE` patch block that adds `STEP_TYPE` to existing DBs that already ran the CREATE TABLE.

---

### Engine changes (`ai.engine.js`)

**New exported route:** `POST /api/ai/engine/diagnose-chain`

```
POST /api/ai/engine/diagnose-chain
{ question_text, retailer_id, skill_id, entities, site_id, lu_id, … }
  ↓
readDiagnosticSteps(skill_id)          ← AI0000100 — ordered steps for skill (includes STEP_TYPE)
  ↓
for each step in order:
    renderTemplateForExecution(step.template_code, ctx)
    runQuery on GOLD
    evaluate stop condition against result rows
    if condition matched:
        STEP_TYPE = HARD  → record in allIssues[], set chainAborted=true, call finalizeDiagnosis()
        STEP_TYPE = SOFT  → record in allIssues[], continue to next step
    else → continue to next step
  ↓
finalizeDiagnosis():
    load AI_DIAGNOSTIC_CONCLUSION for each issue in allIssues[] (series async)    ← AI0000101
    synthesizeMultipleDiagnostics(stepResults, conclusionPairs, ctx)               ← ai.composer.js
  ↓
response: {
    diagnostic_steps: [{ step_label, template_code, rows,
                         stopped_here: bool,   ← true only for HARD stops
                         issue_found: bool,    ← true for both HARD and SOFT matches
                         issue_type: 'HARD'|'SOFT' }],
    issues_found,          ← count of matched conditions
    has_hard_stop,         ← true if any HARD step fired
    conclusions[],         ← per-issue: { conclusion_key, severity, is_hard_stop, step_label }
    conclusion_key,        ← null when issues_found > 1 (scalar for backward compat)
    severity,              ← overall: max severity across all matched conclusions
    human_summary,         ← numbered list when multiple issues
    evidence_facts[],      ← combined bullets from all matched conclusion templates
    follow_up_hint,
    bind_context
}
```

**HARD vs SOFT step classification:**
- **HARD** — aborts the chain immediately. Use when the issue makes all remaining checks meaningless (e.g. item not in ARTRAC — supplier/cost/ranging checks would all return 0 by JOIN cascade, not genuine independent issues).
- **SOFT** — records the issue and continues. Use when multiple issues can coexist independently (e.g. not ranged + no active supplier + no delivery schedule are three separate root causes that each need their own fix).
- Default is `HARD` (backward compatible with existing chains that don't set `STEP_TYPE`).

**DIAGNOSTIC intent detection** — added to `detectIntent()` in `ai.engine.js`:

```javascript
const DIAGNOSTIC_TRIGGERS = /\b(why|why isn'?t|why aren'?t|what'?s blocking|root cause|
    what happened to|not shipping|not receiving|not ordered|not ranged|
    blocked|missing|failed|overdue|unresolved|can.?t\s+order|cannot\s+order|
    order\s+blocked|not\s+orderable)\b/i;

if (DIAGNOSTIC_TRIGGERS.test(question)) return 'DIAGNOSTIC';
```

When intent is `DIAGNOSTIC`, the router checks if the matched skill has any `AI_DIAGNOSTIC_STEP` rows. If yes, the assistant calls `/diagnose-chain` instead of `/execute`.

---

### Composer changes (`ai.composer.js`)

**`synthesizeDiagnostic(stepResults, conclusion, ctx)`** — single-issue path (still used internally by the multi-issue synthesizer for each individual conclusion):
1. Builds token map from ctx + all step row fields
2. Substitutes `{token}` placeholders in `SUMMARY_TEMPLATE`, `EVIDENCE_TEMPLATE` (pipe-split → `evidence_facts[]`), `FOLLOW_UP_TEMPLATE`
3. Falls back to a generic "no matched conclusion" message if `conclusion` is null

**`synthesizeMultipleDiagnostics(stepResults, conclusionPairs, ctx)`** — multi-issue path (called by `finalizeDiagnosis()` in the engine):
- `conclusionPairs`: array of `{ conclusionKey, stepCtx, isHard, stepLabel, conclusion }` — one per matched condition
- Builds a per-issue token map (shared ctx overridden by each step's own row fields)
- Labels: HARD stops show `[BLOCKING — SEVERITY]`; SOFT issues show `[SEVERITY]`
- Summary = intro sentence + numbered list of all issue summaries
- `evidence_facts[]` = combined bullets from all matched conclusion templates (capped at 12)
- `overall_severity` = max across all conclusions (`CRITICAL > WARNING > INFO`)
- `follow_up_hint` = first non-null hint from any conclusion

**Token substitution** — `{field}` is case-insensitive match against the flat token map. Any column returned by a diagnostic step SQL becomes a substitution token automatically (e.g. `{SUPPLIER_CODE}`, `{NEXT_DELIVERY}`, `{COST_AMOUNT}`). Per-issue tokens use the step's own `stepCtx` merged over the shared ctx, so supplier-specific tokens resolve correctly even when multiple steps return different supplier rows.

---

### LIBQUERY entries for diagnostic chain

Range `AI0000080`–`AI0000099` is reserved for S24/S25 Data Health.
Diagnostic chain infrastructure starts at `AI0000100`.

| QUERYNUM | Operation |
|---|---|
| AI0000100 | GET ordered steps for skill — returns `STEP_ORDER, TEMPLATE_CODE, STEP_LABEL, STOP_FIELD, STOP_OPERATOR, STOP_VALUE, CONCLUSION_KEY, NVL(STEP_TYPE,'HARD') AS STEP_TYPE` |
| AI0000101 | GET conclusion template — `CONCLUSION_KEY = :param1 AND (RETAILER_ID = :param2 OR RETAILER_ID = 'TEMPLATE')` — prefers retailer-specific over TEMPLATE rows |
| AI0000102 | GET all diagnostic skills (have at least one step) — for S14 skill picker |
| AI0000103 | POST — MERGE diagnostic step including `STEP_TYPE` (designer authors via Skill Studio). `NVL(r."STEP_TYPE",'HARD')` guards against older clients that don't send the field. |
| AI0000104 | POST — MERGE conclusion template (designer authors via Skill Studio) |
| AI0000105 | POST — DELETE diagnostic step |
| AI0000106 | POST — log diagnostic chain run result → `AI_ENGINE_INTERACTION_LOG` (same feedback target as S14) |

**Redeploy note:** Re-run `38_diagnostic_chain_libquery.sql` (DELETE+INSERT) to pick up the `STEP_TYPE` additions to `AI0000100` and `AI0000103`.

---

### S14 UI — diagnostic result rendering

Diagnostic turns render differently from retrieval turns. Instead of a flat result table, the analyst sees a collapsible step-by-step evidence chain followed by the conclusion.

```
┌────────────────────────────────────────────────────────────────┐
│ Supply Chain Assistant                                          │
├────────────────────────────────────────────────────────────────┤
│ You: Why is item 100100 not shipping from the warehouse?        │
│                                                                 │
│ Assistant:                                                      │
│ ┌─ Diagnostic: WH_SHIPPING_BLOCKED ──────────────────────────┐ │
│ │ ✓ Step 1 — Ranging check       Item ranged at store 7      │ │
│ │ ✓ Step 2 — Flow check          Warehouse flow confirmed    │ │
│ │ ● Step 3 — DC stock check      0 units on-hand ← stopped  │ │
│ │   Step 4 — Pick order check    (skipped)                   │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ DC stock is zero. PO 99821 is due 2026-05-20 (2 days).         │
│ Replenishment parameters are set correctly (min 6, max 24).    │
│ No emergency action available — stock arrives Thursday.         │
│                                                                 │
│ Evidence:                                                       │
│ · DC on-hand: 0 units (STOCOUCH)                               │
│ · Inbound PO 99821 — 48 units due 2026-05-20                   │
│ · ARTREAP min/max: 6 / 24 units (configured correctly)         │
│                                                                 │
│ Want me to check which stores are critically low on this item? │
└────────────────────────────────────────────────────────────────┘
```

Step cards are collapsible (admin sees result rows per step; analyst sees label + outcome only).

**Multi-issue rendering (HARD/SOFT):** When the chain finds multiple issues, the severity row in the chat bubble shows a count badge ("N issues") and a "Hard stop" badge if any HARD condition fired. The step audit trail shows `HARD STOP` (red) or `ISSUE` (amber) per step. The `human_summary` text contains a numbered list of all issues with severity labels (`[CRITICAL]`, `[WARNING]`, `[BLOCKING — CRITICAL]` for HARD stops). Angular component (`handleDiagnosticChainResponse`) reads `chain.issues_found`, `chain.has_hard_stop`, and `chain.conclusions[]`.

---

### Skill Studio extension — Diagnostic Branch Authoring (S21)

The Skill Builder **Diagnostic Steps** tab (`ai.skill.builder.component`) lets designers author the chain without a DB deploy:
- Add/reorder steps (each step = a template from the skill's SQL templates tab)
- Set stop condition (`field`, `operator`, `value`)
- Set **Step type**: `HARD` (abort chain on match) or `SOFT` (record issue, continue) — dropdown with explanatory copy
- Assign conclusion key (must match a row in `AI_DIAGNOSTIC_CONCLUSION`)
- Author/edit conclusion templates (summary + evidence bullets + follow-up)
- Step list table now shows a `Type` column (`HARD` / `SOFT`)

Save calls `AI0000103` which MERGEs `STEP_TYPE` into `AI_DIAGNOSTIC_STEP`. No code deploy required after changing a step's type.

---

### Diagnostic skills — deployment order

```
37_diagnostic_chain_tables.sql          — DDL: AI_DIAGNOSTIC_STEP (with STEP_TYPE) + AI_DIAGNOSTIC_CONCLUSION
                                           Includes ALTER TABLE patch for existing DBs (adds STEP_TYPE if missing)
38_diagnostic_chain_libquery.sql        — LIBQUERY AI0000100–AI0000106
                                           AI0000100 returns STEP_TYPE; AI0000103 saves STEP_TYPE
39_diagnostic_wh_shipping_blocked.sql   — Steps + conclusions: WH_SHIPPING_BLOCKED (all HARD — existing chain)
40_diagnostic_replen_not_triggered.sql  — Steps + conclusions: REPLEN_NOT_TRIGGERED (all HARD)
41_diagnostic_receipt_not_processing.sql — Steps + conclusions: RECEIPT_NOT_PROCESSING (all HARD)
42_diagnostic_item_not_ranged.sql       — Steps + conclusions: ITEM_NOT_RANGED (all HARD)
43_diagnostic_price_not_loading.sql     — Steps + conclusions: PRICE_NOT_LOADING (all HARD)
50_diagnostic_item_order_blocked.sql    — ITEM_ORDER_BLOCKED: Step 1 HARD (item inactive),
                                           Steps 2–6 SOFT (ranging, supplier, cost, schedule, orderable assortment)
                                           Skill ID: DA000002-D100-4A00-8200-D20000000002
```

Each script is idempotent (DELETE+INSERT for skill/vocab/template rows; existing chains use all-HARD steps and remain backward compatible — `STEP_TYPE DEFAULT 'HARD'` means the engine treats them identically to before).

---

## Operational Skill Roadmap — All Domains

> **LLM constraint:** No external LLM API. No local model. All analytical synthesis via rule-based diagnostic chains (`AI_DIAGNOSTIC_STEP` + `AI_DIAGNOSTIC_CONCLUSION`). Retrieval skills use the existing single-template path. **No architecture change required for retrieval skills.** Only diagnostic/WHY skills use the new chain path.

### Phase A — Foundation (now, ~8 weeks)

Covers the analyst's daily morning review. High volume, well-understood queries. All retrieval path. Diagnostic infrastructure + first 5 chains.

**Retrieval skills (existing or straightforward to add):**

| Skill | Status | Script |
|---|---|---|
| `ITEM_MASTER_RETAIL` — header, variants, EAN, retail, history, full attributes | Done | 26, 29 |
| `DSD_VENDOR_RETAIL` — assortment by vendor | Done | 12 |
| `DSD_VENDOR_BUYABLE_ITEMS` — buyable items with site filter | Done | 12, 20 |
| `SUPPLIER_HEALTH` — fill rate, on-time, rejections | Done | 18 |
| `STOCK_VARIANCE` — DC + store stock position | Done | 18 |
| `DELIVERY_EXCEPTION` — dock and receipt blocking issues | Done | 18 |
| `ORDER_STATUS` — PO status, acknowledgment, overdue | Build | 37 |
| `ITEM_RANGING_STATUS` — ranged stores for an item | Build | 38 |
| `REPLEN_PARAMS` — ARTREAP min/max/cycle for item × store | Build | 39 |
| `PROMOTION_ACTIVE` — live promotions at store or network | Build | 40 |
| `INBOUND_RECEIVING` — what was received, from whom, when | Build | 41 |

**Diagnostic infrastructure:**

| Component | Status | Script |
|---|---|---|
| `AI_DIAGNOSTIC_STEP` + `AI_DIAGNOSTIC_CONCLUSION` tables (with `STEP_TYPE`) | Done | 37 |
| LIBQUERY AI0000100–AI0000106 (AI0000100/103 updated for STEP_TYPE) | Done | 38 |
| `ai.engine.js` — DIAGNOSTIC intent, `module.diagnoseChain()`, HARD/SOFT accumulator | Done | (Node) |
| `ai.composer.js` — `synthesizeDiagnostic()` + `synthesizeMultipleDiagnostics()` | Done | (Node) |
| S14 UI — step evidence chain rendering | Build | (Angular) |

**Diagnostic chains (Phase A):**

| Chain skill | Root causes authored | Script |
|---|---|---|
| `WH_SHIPPING_BLOCKED` | Not ranged / wrong flow / DC stockout (PO coming) / DC stockout (no PO) / stock exists no pick / pick exists no transport | 32 |
| `REPLEN_NOT_TRIGGERED` | Params missing / safety stock not breached / supplier calendar gap / open PO already covering / item on hold | 33 |
| `RECEIPT_NOT_PROCESSING` | No dock booking / delivery not booked / PO mismatch / receiving incomplete / qty variance held | 34 |
| `ITEM_NOT_RANGED` | Never ranged / delisted / ranging in progress / wrong store format | 35 |
| `PRICE_NOT_LOADING` | No AVEPRIX row / tariff expired / scope gap (store not in any network) / promotion overriding and expired | 36 |

---

### Phase B — Operational Depth (~Q3 2026)

Fills out the analyst day — order management, warehouse floor, cross-store, supplier performance.

**Retrieval skills:**

| Skill | Domain | Script |
|---|---|---|
| `ORDER_FILL_RATE` | Orders | 42 |
| `ORDER_REJECTED_LINES` | Orders | 42 |
| `OPEN_PO_BY_ITEM` | Orders | 42 |
| `ORDER_HISTORY` | Orders | 43 |
| `SUPPLIER_LEAD_TIME` | Supplier | 43 |
| `SUPPLIER_CONTRACT_STATUS` | Supplier | 43 |
| `PROMOTION_PIPELINE` | Pricing | 44 |
| `PRICE_COMPLIANCE` | Pricing | 44 |
| `PRICE_ANOMALY` | Pricing | 44 |
| `STOCK_NEGATIVE` | Inventory | 45 |
| `STOCK_NO_PO` | Inventory | 45 |
| `DEAD_STOCK` | Inventory | 45 |
| `STOCK_AGING` | Inventory | 45 |
| `RECEIPT_VS_PO` | Receiving | 46 |
| `DOCK_SCHEDULE` | Receiving | 46 |
| `RECEIVING_EXCEPTIONS` | Receiving | 46 |
| `WH_STOCK_POSITION` | Warehouse | 47 |
| `WH_RECEIVING_QUEUE` | Warehouse | 47 |
| `WH_OUTBOUND_ALLOCATION` | Warehouse | 48 |
| `WH_REPLEN_TO_STORE` | Warehouse | 48 |
| `WH_BACKORDER_STATUS` | Warehouse | 48 |
| `NETWORK_STOCK_IMBALANCE` | Cross-store | 49 |
| `LATERAL_TRANSFER_HISTORY` | Cross-store | 49 |
| `NETWORK_OUT_OF_STOCK` | Cross-store | 50 |
| `NETWORK_NEW_ITEM_ROLLOUT` | Cross-store | 50 |
| `SAFETY_STOCK_BREACH` | Replenishment | 51 |
| `SUPPLIER_CALENDAR` | Replenishment | 51 |
| `SALES_VELOCITY` | Sales | 52 |
| `TOP_SELLERS` | Sales | 52 |
| `SLOW_MOVERS` | Sales | 52 |
| `COST_VS_RETAIL` | Financial | 53 |
| `RETURNS_AND_CREDITS` | Logistics | 54 |
| `LATERAL_MOVEMENTS` | Logistics | 54 |
| `ALLOCATION_STATUS` | Logistics | 54 |
| `ITEM_LISTING_PIPELINE` | Assortment | 55 |
| `ITEM_DELISTING_PIPELINE` | Assortment | 55 |
| `ASSORTMENT_OVERLAP` | Assortment | 55 |
| `ITEM_RANGING_STATUS` (network view) | Assortment | 55 |

**Diagnostic chains (Phase B):**

| Chain skill | Domain | Script |
|---|---|---|
| `ORDER_BLOCKED` | Orders — PO stuck: rejected / no ack / supplier hold | 56 |
| `STOCK_VARIANCE_ROOT_CAUSE` | Inventory — negative / shrink / adjustment gap | 57 |
| `SUPPLIER_PERFORMANCE_ISSUE` | Supplier — chronic late / chronic short / rejection pattern | 58 |
| `PROMOTION_EXECUTION_FAIL` | Pricing — stock not ready / price not loaded / wrong scope | 59 |
| `NETWORK_IMBALANCE_ROOT_CAUSE` | Cross-store — why store A has excess while store B is OOS | 60 |

**HQ Overwatch retrieval skills:**

| Skill | What it answers |
|---|---|
| `HQ_CRITICAL_OOS` | Top critical SKUs OOS network-wide, no PO covering |
| `HQ_SUPPLIER_SCORECARD` | Top 10 suppliers by on-time, fill rate, rejection rate |
| `HQ_ORDER_BACKLOG` | Open PO value by supplier, overdue summary |
| `HQ_PROMOTION_EXECUTION` | Promotions live this week — stock readiness by store |
| `HQ_RANGING_COMPLIANCE` | % active items ranged at ≥90% eligible stores |
| `HQ_COST_CHANGE_ALERTS` | Supplier cost changes effective this week |

All HQ skills target `AI_SKILL` with `skill_type = 'HQ_OVERWATCH'` — same engine path, different vocabulary routing.

**Warehouse Overwatch retrieval skills:**

| Skill | What it answers |
|---|---|
| `WH_DOCK_OVERWATCH` | Dock bookings today — confirmed vs. pending, conflicts |
| `WH_UNPROCESSED_RECEIPTS` | Deliveries at dock with no receiving transaction yet |
| `WH_PICK_BACKLOG` | Unfulfilled store orders in pick queue >4h |
| `WH_OUTBOUND_READINESS` | Tomorrow's replenishment wave — allocated / picked / short |
| `WH_ANOMALY_SUMMARY` | WGENBESWAR flags today — counts by category, unresolved |

> **HNPSTK schema note:** Phase B warehouse skills must be validated against the actual schema structure via S02 Schema Discovery against the GWR/STK schema before SQL authoring. GWR warehouse table names (STOCKPICK, STOCKEMPLACE, STOCKRECEPTION, STOCKRESERV) must be confirmed — they may differ from GOLD canonical documentation depending on Heinens' installation. Run S02 against HNPGWR / HNPSTK before scripting Phase B warehouse SQL.

---

### Phase C — Analytics & Optimization (~Q4 2026)

Strategic layer — optimization signals, trend analysis, financial performance. Lower daily frequency, higher business value per query.

**Retrieval skills:**

| Skill | Domain |
|---|---|
| `CATEGORY_PERFORMANCE` | Category management |
| `PROMOTIONAL_EFFECTIVENESS` | Promo analytics |
| `MARKDOWN_CANDIDATES` | Pricing optimization |
| `SUPPLIER_ONBOARDING` | Supplier management |
| `SUPPLIER_CREDIT_TERMS` | Supplier financial |
| `FORECAST_VS_ACTUAL` | Demand planning |
| `LEAD_TIME_VARIANCE` | Replenishment analytics |
| `SERVICE_LEVEL` | Replenishment analytics |
| `COVERAGE_DAYS` | Replenishment analytics |
| `REPLEN_ANOMALY` | Replenishment (WGENBESWAR) |
| `STORE_CLUSTER_COMPARISON` | Cross-store analytics |
| `CROSS_STORE_VELOCITY` | Cross-store analytics |
| `ALLOCATION_NETWORK_SPLIT` | Logistics analytics |
| `SALES_BY_CATEGORY` | Sales analytics |
| `MARGIN_BY_SUPPLIER` | Financial analytics |
| `CONTRACT_COMPLIANCE` | Financial analytics |
| `SCANBACK_TRACKING` | Financial analytics |
| `BILLBACK_ACCRUAL` | Financial analytics |
| `WH_THROUGHPUT` | Warehouse analytics |
| `WH_CAPACITY_STATUS` | Warehouse capacity |
| `WH_RECEIVING_FORECAST` | Warehouse planning |
| `WH_EXPIRY_RISK` | Warehouse perishables |
| `BATCH_LOT_TRACE` | Traceability / recall |
| `NETWORK_PROMOTER_READINESS` | Cross-store promo |
| `SUPPLIER_CATALOG_GAPS` | Supplier assortment |
| `HQ_SLOW_MOVER_WATCHLIST` | HQ overwatch |
| `HQ_NEW_SUPPLIER_PIPELINE` | HQ overwatch |
| `HQ_EXPIRY_NETWORK` | HQ overwatch |
| `HQ_REPLEN_EXCEPTION` | HQ overwatch |

**Diagnostic chains (Phase C):**

| Chain skill | Domain |
|---|---|
| `REPLEN_OPTIMIZATION_SIGNAL` | Why is stock turn low? Coverage days too high? Min/max misaligned with velocity? |
| `SHRINK_ROOT_CAUSE` | Inventory adjustment pattern — systemic damage / theft signal / count error? |
| `CATEGORY_UNDERPERFORM` | Category below network average — assortment gap / ranging issue / price position? |
| `BATCH_RECALL_TRACE` | Where is lot X right now? DC / stores / sold? What was done? |
| `HQ_WEEKLY_BRIEF` | Multi-domain synthesis — critical issues only by domain (multi-chain orchestration) |

> **HQ_WEEKLY_BRIEF** is the most complex Phase C item. It orchestrates 4–6 diagnostic chains in parallel and synthesizes a priority-ordered briefing. Implemented as a meta-chain that calls sub-chains and aggregates their conclusions. Scope carefully — this is the closest thing to an "agent" pattern in this architecture.

---

### Skill count summary

| Phase | Retrieval skills | Diagnostic chains | Total |
|---|---|---|---|
| Done (built) | 22 | 0 | 22 |
| Phase A (build) | 11 | 5 | 16 |
| Phase B | 36 | 5 | 41 |
| Phase C | 29 | 5 | 34 |
| **Grand total** | **98** | **15** | **113** |

---

### Deployment script numbering — full sequence

```
── Diagnostic chain infrastructure ────────────────────────────────────────
37_diagnostic_chain_tables.sql          — AI_DIAGNOSTIC_STEP (STEP_TYPE col) + AI_DIAGNOSTIC_CONCLUSION DDL
                                           + ALTER TABLE patch for existing DBs
38_diagnostic_chain_libquery.sql        — AI0000100–AI0000106 (AI0000100/103 include STEP_TYPE)

── Phase A diagnostic seeds (all-HARD — existing chains) ──────────────────
39_diagnostic_wh_shipping_blocked.sql
40_diagnostic_replen_not_triggered.sql
41_diagnostic_receipt_not_processing.sql
42_diagnostic_item_not_ranged.sql
43_diagnostic_price_not_loading.sql

── Phase A retrieval skill packs ──────────────────────────────────────────
44_skill_pack_order_management.sql       — ORDER_STATUS, OPEN_PO_BY_ITEM
45_skill_pack_item_ranging.sql           — ITEM_RANGING_STATUS
46_skill_pack_replen_params.sql          — REPLEN_PARAMS
47_skill_pack_promotions_active.sql      — PROMOTION_ACTIVE
48_skill_pack_inbound_receiving.sql      — INBOUND_RECEIVING

── Procurement diagnostic (HARD/SOFT mixed) ───────────────────────────────
50_diagnostic_item_order_blocked.sql     — ITEM_ORDER_BLOCKED: why can't store X order item Y?
                                           Step 1 HARD (item active), Steps 2–6 SOFT
                                           (ranging, supplier, cost, schedule, orderable assortment)

── Phase B retrieval skill packs ──────────────────────────────────────────
49_data_health_resolution_upgrade.sql    — (existing)
51_skill_pack_supplier_depth.sql         — LEAD_TIME, CONTRACT_STATUS
51_skill_pack_pricing_depth.sql          — PROMOTION_PIPELINE, PRICE_COMPLIANCE, PRICE_ANOMALY
52_skill_pack_inventory_depth.sql        — STOCK_NEGATIVE, STOCK_NO_PO, DEAD_STOCK, STOCK_AGING
53_skill_pack_receiving_depth.sql        — RECEIPT_VS_PO, DOCK_SCHEDULE, RECEIVING_EXCEPTIONS
54_skill_pack_warehouse_ops.sql          — WH_STOCK_POSITION, WH_RECEIVING_QUEUE (GWR schema)
55_skill_pack_warehouse_alloc.sql        — WH_OUTBOUND_ALLOCATION, WH_REPLEN_TO_STORE, WH_BACKORDER
56_skill_pack_cross_store.sql            — NETWORK_STOCK_IMBALANCE, LATERAL_TRANSFER_HISTORY
57_skill_pack_cross_store_oos.sql        — NETWORK_OUT_OF_STOCK, NETWORK_NEW_ITEM_ROLLOUT
58_skill_pack_replen_depth.sql           — SAFETY_STOCK_BREACH, SUPPLIER_CALENDAR
59_skill_pack_sales.sql                  — SALES_VELOCITY, TOP_SELLERS, SLOW_MOVERS
60_skill_pack_financial.sql              — COST_VS_RETAIL
61_skill_pack_logistics.sql              — RETURNS_AND_CREDITS, LATERAL_MOVEMENTS, ALLOCATION_STATUS
62_skill_pack_assortment_depth.sql       — LISTING/DELISTING PIPELINE, ASSORTMENT_OVERLAP
63_diagnostic_order_blocked.sql
64_diagnostic_stock_variance_root.sql
65_diagnostic_supplier_performance.sql
66_diagnostic_promotion_fail.sql
67_diagnostic_network_imbalance.sql

── Phase B overwatch packs ────────────────────────────────────────────────
68_skill_pack_hq_overwatch.sql           — HQ_CRITICAL_OOS, SUPPLIER_SCORECARD, ORDER_BACKLOG etc.
69_skill_pack_wh_overwatch.sql           — WH_DOCK_OVERWATCH, UNPROCESSED_RECEIPTS etc.

── Phase C ────────────────────────────────────────────────────────────────
70–99  (reserved for Phase C retrieval + diagnostic scripts)
```

---

## Progress
- [x] DB schema deployed (00, 04–11)
- [x] LIBQUERY entries deployed (AI0000001–AI0000013)
- [x] Backend: ai.retailer.js (ping-dblink), ai.view.js (generate)
- [x] Frontend: S01 Retailer Setup, S03 Context Learning
- [x] S02 Schema Discovery
- [x] S02 validated in PREPROD (multi-schema scan: tables, columns, comments captured)
- [~] S08 Dashboard started (retailer selector + context/view KPI cards wired to existing LIBQUERY status)
- [ ] S08 Dashboard, S09 Blockers, S11 Recommendations
- [x] S14 AI Assistant (engine route/execute, Skill Builder SQL + `parameters_json`, execute context merges body/entities/bindings)
- [x] S14 UX role separation — Engine diagnostics, Designer panel, Requested SQL, Detailed results right-panel card gated behind `USERAIADMIN`; technical badges + SQL debug toggle hidden for analysts; non-admins see results inline in chat bubbles only (UX plan #1, #2, #10 — see "S14 AI Assistant — UX improvement plan")
- [x] Pure-Node routing upgrade (no LLM): Porter stem + n-grams (`ai.lexical.js`), bind-feasibility penalty in `pickExecutionTemplate`, broadened `detectIntent`, `INTENT_PHRASE` / `BIND_HINT` vocabulary types in `AI_SKILL_VOCABULARY`
- [x] Phrasing feedback loop: `AI_ENGINE_UNRESOLVED` table (script `22_engine_unresolved_table.sql`), LIBQUERY `AI0000071–AI0000075` (`ai_engine_unresolved_libquery.sql`), Skill Studio "Pending phrasings" admin screen, assistant logs low-confidence routes + thumb-down
- [x] Clarification chips on low-confidence routes — assistant exposes `routing_diagnostics.alternatives`; click forwards `preferred_skill_id` to `/api/ai/engine/route` so the engine bypasses the scorer
- [x] S23 Phrasing Playground — designer-facing routing diagnostics screen; `POST /api/ai/engine/diagnose` returns score breakdown, vocabulary hits, lexical pipeline, bind feasibility (no DB writes, no resolver, no execution)
- [x] S14 share/adjust/learn/extend — copy answer, export session, active context editor, teach-correct-skill after thumb-down, showDesignerPanel on low-confidence
- [ ] S14 result consolidation (Phase 12) — AUGMENT intent: re-execute ITM_FULL_ATTRIBUTES with accumulated include_* flags when analyst says "add retail / EAN / reference to order" on an active item result
- [x] Diagnostic chain infrastructure — `AI_DIAGNOSTIC_STEP` (with `STEP_TYPE` HARD/SOFT) + `AI_DIAGNOSTIC_CONCLUSION` tables (script 37), LIBQUERY AI0000100–AI0000106 (script 38, updated AI0000100/103 for STEP_TYPE), `module.diagnoseChain()` in `ai.engine.js` with HARD/SOFT accumulator + `finalizeDiagnosis()`, `synthesizeDiagnostic()` + `synthesizeMultipleDiagnostics()` in `ai.composer.js`, DIAGNOSTIC intent detection, S14 multi-issue rendering (count badge, HARD/SOFT step audit tags, numbered summary)
- [x] Phase A diagnostic seeds — WH_SHIPPING_BLOCKED (39), REPLEN_NOT_TRIGGERED (40), RECEIPT_NOT_PROCESSING (41), ITEM_NOT_RANGED (42), PRICE_NOT_LOADING (43) — all HARD steps (existing behavior)
- [x] ITEM_ORDER_BLOCKED diagnostic (50) — procurement chain: Step 1 HARD (item inactive → abort), Steps 2–6 SOFT (ranging, supplier contract, cost, delivery schedule, orderable assortment — all reported simultaneously)
- [x] Phase A retrieval skill packs — ORDER_STATUS + OPEN_PO_BY_ITEM (44), ITEM_RANGING_STATUS (45), REPLEN_PARAMS (46), PROMOTION_ACTIVE (47), INBOUND_RECEIVING (48)
- [x] Skill Studio — Diagnostic Steps tab (S21): step authoring with STEP_TYPE dropdown (HARD/SOFT), conclusion template editor, step list shows Type column; `AI0000103` saves STEP_TYPE
- [x] S24 AI Data Health — card grid by check, summary bar (total/passing/issues/critical), critical banner, tier filter, Run now (AI0000084 → AI_RUN_DATA_CHECKS), Investigate bridge to S14 with skill + entity context pre-loaded
- [x] S25 Data Health Configuration — table CRUD, Add/Edit dialog (check code, name, LIBQUERY #, tier, severity, skill code, entity key), Verify button tests LIBQUERY live before save, inline enable/disable toggle, confirm-before-delete; all via LIBQUERY AI0000085–AI0000089, no backend route
- [x] LIBQUERY deployment pattern documented — DELETE+INSERT, QUERYID = NVL(MAX(QUERYID),0)+1 subquery, full column list (QUERYID/QUERYNUM/QUERYTITLE/QUERYDESC/QUERYSQL/QUERYPARAM/QUERYRESULT/QUERYACCESS/QUERYTYPE/QUERYUPDATE)
- [x] ICR dynamic menu — `ICR_MENU_*` tables, `SET0000040`/`0041`, `MenuAccessService`, `app-sidebar-menu`, route guard
- [x] Users & Profiles admin (`/settingusers`) — `USERSROOM` CRUD `SET0000020`–`0023`, access flags + `USERPROF` + **`USERTYPE`** (ICR admin / General Settings), env access matrix
- [x] Menu & access admin (`/settingmenu`) — catalog, flag rules, profiles, profile menus `SET0000046`–`0054`; **`MENU_TYPE = HEADER`** for profile dropdown + AI toggle
- [x] Header profile menu (data-driven) — `HDR_USER_*` seeds in `35` / patch `54`, `SET0000041`, `MenuAccessService.profileMenu$`, `header.component` `*ngFor` (replaces hardcoded Profile/Inbox/… list)
- [x] Self-service **Change password** — `SET0000024` (`53_user_change_password_libquery.sql`), header dialog, `SettingsAdminService.changeOwnPassword()`; `QueryService` sid/language fallbacks + `param ?? []`
- [ ] S15 Domain Investigation (and richer assistant UX: template picker)
- [ ] Phase B skill packs (scripts 42–62) — order depth, supplier depth, pricing depth, inventory depth, receiving depth, warehouse ops (GWR/HNPSTK), warehouse overwatch, cross-store, replenishment depth, sales, financial, logistics, assortment depth, HQ overwatch
- [ ] Phase B diagnostic chains (scripts 56–60) — ORDER_BLOCKED, STOCK_VARIANCE_ROOT_CAUSE, SUPPLIER_PERFORMANCE_ISSUE, PROMOTION_EXECUTION_FAIL, NETWORK_IMBALANCE_ROOT_CAUSE
- [ ] Phase C skill packs + diagnostic chains (scripts 63–89) — analytics, optimization, traceability, HQ_WEEKLY_BRIEF meta-chain
