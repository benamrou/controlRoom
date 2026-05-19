# Supply Chain AI — Routing & Vocabulary Upgrade Deployment

This bundle ships:

- A pure-Node lexical layer (Porter stemmer + n-grams) in the engine.
- Engine routing improvements: broader intent detection, BUYABLE preference
  on resolved supplier, bind-feasibility penalty.
- Vocabulary types `INTENT_PHRASE` and `BIND_HINT` (relaxes
  `CHK_TERM_TYPE`).
- A "Pending phrasings" admin queue for analysts' wording the engine missed.
- Clarification chips on low-confidence routes; chip click forces a skill.
- A **Phrasing Playground** screen + `POST /api/ai/engine/diagnose` endpoint
  for designers to test the router without running SQL.
- **Auto-promote on repeat** — when the same `USER_OVERRIDE` phrasing is
  picked by enough distinct analysts, the queue can graduate it into
  `AI_SKILL_VOCABULARY` automatically with a conservative boost.
- **BIND_HINT-driven extraction** — `BIND_HINT` vocabulary rows now drive
  entity extraction (not only scoring). `term`="for store" + `concept`="site_id"
  populates `entities.site_id` from the value following the phrase. Designers
  can teach new bind patterns from Skill Studio without a Node deploy.
- **Heinens / DSD jargon pack** — 80+ baseline JARGON / ABBREVIATION /
  PROCESS_TERM / SYNONYM / INTENT_PHRASE rows so the engine handles the
  language analysts actually type (DSD, scanback, TPR, OTIF, fill rate,
  ranged, delisted, LU, CODART, ARTRAC, EAN, UPC, …).
- **Phase 10 — Item Retail v2** — seven SQL templates for the
  `ITEM_MASTER_RETAIL` skill that target Heinens' canonical model
  (`ARTRAC → ARTUV → ARTCOCA` and `AVEPRIX × AVETAR × AVESCOPE` with
  STRUCREL merchandise-hierarchy walk). Adds intent / synonym / bind-hint
  vocabulary so phrasings like "retail price", "promo price", "ean code",
  "all variants", "with retail", "with ean" route correctly.

The Node code (`ai.engine.js`, `ai.lexical.js`) is dependency-free — no
`npm install` step is required.  Restart the API server after `git pull`.

## Database deployment

Run in this order against the **ICR application schema** (where `LIBQUERY`
and the `AI_*` tables already live).

| # | Script | Purpose |
|---|---|---|
| 1 | `19_engine_vendor_resolve_upgrade.sql` | Update `ENGINE_VENDOR_RESOLVE` SQL with combined name+code matching (REGEXP_SUBSTR / REGEXP_REPLACE). |
| 2 | `20_buyable_items_site_filter_upgrade.sql` | Update `DSD_VENDOR_BUYABLE_ITEMS` to filter by `:site_id` via `pkresrel.isSiteBelongToNode`. |
| 3 | `21_skill_vocab_phrasing_pack.sql` | **Relaxes `CHK_TERM_TYPE`** to allow `INTENT_PHRASE` + `BIND_HINT`, resyncs the `vocab_id` IDENTITY, then `MERGE`s the analyst phrasing pack for `DSD_VENDOR_RETAIL` + `ITEM_RETAIL`. Idempotent. |
| 4 | `22_engine_unresolved_table.sql` | `CREATE TABLE AI_ENGINE_UNRESOLVED` + indexes (queue feeding the Pending Phrasings UI). |
| 5 | `ai_engine_unresolved_libquery.sql` | LIBQUERY entries `AI0000071..AI0000075` (insert / list / promote / dismiss / stamp). |
| 6 | `23_auto_promote_libquery.sql` | **Phase 7** — LIBQUERY entries `AI0000076..AI0000078` for auto-promote on repeat (list eligible / MERGE vocab / bulk stamp). No table/schema changes. |
| 7 | `24_bind_hint_pack_upgrade.sql` | **Phase 8** — top-up BIND_HINT vocabulary so `lex.extractBindsFromHints` covers analyst phrasings out-of-the-box (`store id`, `vendor code`, `as of`, `since`, `lu`/`codart`, …). Idempotent MERGE — safe to re-run. |
| 8 | `25_skill_vocab_heinens_jargon_pack.sql` | **Phase 9** — Heinens & grocery / DSD jargon baseline (DSD, scanback / SBK, TPR, OI / billback, OTIF, fill rate, ranged / delisted, LU / CODART / ARTRAC / EAN / UPC …) plus matching INTENT_PHRASE rows. Idempotent MERGE — safe to re-run. |
| 9 | `26_ai_skill_pack_item_retail_v2.sql` | **Phase 10** — Replaces / adds 7 templates on `ITEM_MASTER_RETAIL` (header, variants, EAN, barcode reverse-lookup, active retail with AVESCOPE priority, retail history, wide attributes). MERGEs the matching intent / synonym / bind-hint vocabulary. Idempotent: only touches its own template_codes and vocab keys. |
| 10 | `27_skill_vocab_item_master_freeform.sql` | **Phase 11 routing fix** — Strengthens `ITEM_MASTER_RETAIL` with ~25 free-form INTENT_PHRASEs (`tell me about item`, `what is item`, `info on item`, `lookup item`, `describe item`, …), `article`/`sku`/`product` SYNONYMs, Heinens/EU GOLD JARGON (`codart`, `cinr`, `cinv`, `artrac`, `lu`, `gencod`), and site-id BIND_HINTs. Pairs with the engine-side dampener in `ai.engine.js` (`needsVendorContext`) that prevents vendor-relation INTENT_PHRASEs from anchoring vendor skills on questions without a vendor reference. Idempotent MERGE — safe to re-run. |
| 11 | `28_v_gold_item_view.sql` | **V_GOLD_ITEM canonical item-card view** — `CREATE OR REPLACE VIEW V_GOLD_ITEM` joining `ARTRAC + ARTUV` with current orderable supplier context (`artuc + foudgene + fouccom` via `WITH ORDERABLE` CTE). One row per `(LU, active sale variant)` with code/desc/cat-mgr/orderable window/supplier/cost/EAN/pack/flow. Skill SQL templates can `SELECT * FROM V_GOLD_ITEM WHERE "Item code" = :lu_id` instead of repeating the join pyramid. DB link `@HEINENS_CEN_PROD` is hardcoded — swap to `@HEINENS_CEN_PROD` for prod. |

### Re-runnability

- `21_skill_vocab_phrasing_pack.sql` — re-run safe (constraint check is
  guarded; `MERGE` is keyed on `(skill_id, term_type, LOWER(TRIM(term)))`).
- `22_engine_unresolved_table.sql` — drop+create if re-running:
  ```sql
  DROP TABLE AI_ENGINE_UNRESOLVED PURGE;
  ```
- `ai_engine_unresolved_libquery.sql` — re-run safe (deletes its IDs first).
- `23_auto_promote_libquery.sql` — re-run safe (deletes its IDs first; the
  MERGE in `AI0000077` is itself idempotent so re-promoting the same phrasing
  is a no-op).
- `24_bind_hint_pack_upgrade.sql` — re-run safe (MERGE keyed on
  `(skill_id, term_type, LOWER(TRIM(term)))`).
- `25_skill_vocab_heinens_jargon_pack.sql` — re-run safe (same MERGE key).
- `26_ai_skill_pack_item_retail_v2.sql` — re-run safe (DELETEs only the
  seven template_codes it owns, then re-INSERTs; MERGEs vocab additions
  keyed on `(skill_id, term_type, LOWER(TRIM(term)))`).
- `27_skill_vocab_item_master_freeform.sql` — re-run safe (only MERGE on
  the same vocab key; status UPDATE is conditional). Companion engine
  change: `controlRoom_server/.../ai.engine.js` `needsVendorContext()`
  dampener — restart Node so the new function loads. Both `route` and
  `diagnose` emit a `dampened: "needs_vendor_context"` flag per match
  that the AI Assistant's Engine Diagnostics card renders as a yellow
  strike-through chip on the offending vocab term.
- `28_v_gold_item_view.sql` — re-run safe (`CREATE OR REPLACE VIEW`).
  Validate after deploy with `SELECT status FROM USER_OBJECTS WHERE
  object_name='V_GOLD_ITEM'` (must be `VALID`). The hardcoded site `7`
  in the `Flow` subquery's `pkresrel.isSiteBelongToNode(...,7,arasite,'1')`
  call is from the upstream definition — confirm it matches the Heinens
  reference site node before promoting to prod.

## LIBQUERY id allocation (ICR)

Verify after deploy:

```sql
SELECT QUERYNUM, QUERYTITLE
  FROM LIBQUERY
 WHERE QUERYNUM LIKE 'AI%'
 ORDER BY QUERYNUM;
```

Expected ranges (no collisions):

| Range | Module |
|---|---|
| `AI0000001`..`AI0000016` | Retailer setup, S01–S03 (`libquery/ai_libquery.pde`) |
| `AI0000020`..`AI0000033` | Schema discovery (`libquery/ai_libquery.pde`) |
| `AI0000040`, `AI0000044`..`AI0000060` | Skill builder (`ai_skill_builder_libquery.sql`) |
| `AI0000061`..`AI0000064` | AI engine reads (`ai_engine_libquery.sql`) |
| `AI0000070` | Engine feedback 👍/👎 (`ai_engine_feedback_libquery.sql`) |
| `AI0000071`..`AI0000075` | Engine unresolved + promote (`ai_engine_unresolved_libquery.sql`) |
| `AI0000076`..`AI0000078` | **NEW** Engine auto-promote on repeat (`23_auto_promote_libquery.sql`) |

Free for future use: `AI0000017..0000019`, `AI0000034..0000039`,
`AI0000041..0000043`, `AI0000065..0000069`, `AI0000079..`.

## Smoke test after deploy

```sql
-- Vocabulary pack landed (expect JARGON / ABBREVIATION rows after Phase 9)
SELECT term_type, COUNT(*) AS rows_
  FROM AI_SKILL_VOCABULARY
 WHERE skill_id IN ('E1D2C3B4-A5B6-7890-CDEF-1234567890AB',
                    'F1E2D3C4-B5A6-7890-CDEF-1234567890AB')
 GROUP BY term_type;

-- New LIBQUERY rows landed
SELECT QUERYNUM, QUERYTITLE
  FROM LIBQUERY
 WHERE QUERYNUM IN ('AI0000071','AI0000072','AI0000073','AI0000074','AI0000075',
                    'AI0000076','AI0000077','AI0000078')
 ORDER BY QUERYNUM;

-- Unresolved table reachable
DESC AI_ENGINE_UNRESOLVED;
SELECT COUNT(*) FROM AI_ENGINE_UNRESOLVED;

-- Auto-promote eligibility preview (no DML, just the read)
-- :param1=retailer (or -1), :param2=min users, :param3=min hits, :param4=lookback days
-- Use the assistant's "Find auto-promotable" dialog or:
SELECT *
  FROM TABLE(SQL_TEXT_FROM_LIBQUERY('AI0000076', '-1', '1', '1', '365'));
-- (or just call the LIBQUERY via the admin UI — the SQL is also copy-paste
-- friendly inside `23_auto_promote_libquery.sql`)

-- Phase 10 — item retail v2 templates landed (expect 7 codes)
SELECT template_code,
       DBMS_LOB.GETLENGTH(sql_text)        AS sql_len,
       DBMS_LOB.GETLENGTH(parameters_json) AS params_len
  FROM AI_SKILL_SQL_TEMPLATE
 WHERE skill_id = 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB'
   AND UPPER(template_code) IN ('ITM_ARTICLE_HEADER','ITM_VARIANTS','ITM_EAN_FOR_LU',
                                 'ITM_BARCODE_LOOKUP','ITM_RETAIL_ACTIVE',
                                 'ITM_RETAIL_HISTORY','ITM_FULL_ATTRIBUTES')
 ORDER BY template_code;

-- Phase 10 — vocabulary for ITEM_RETAIL got the new INTENT_PHRASE rows
SELECT canonical_concept, COUNT(*) AS rows_
  FROM AI_SKILL_VOCABULARY
 WHERE skill_id = 'F1E2D3C4-B5A6-7890-CDEF-1234567890AB'
   AND term_type = 'INTENT_PHRASE'
   AND canonical_concept IN ('ITEM_RETAIL_AMOUNT','ITEM_PROMO_RETAIL',
                              'ITEM_RETAIL_HISTORY','ITEM_EAN',
                              'ITEM_VARIANTS','ITEM_FULL_ATTRIBUTES')
 GROUP BY canonical_concept
 ORDER BY canonical_concept;
```

## Server / client smoke test

```bash
# Engine + lexical files parse cleanly
cd controlRoom_server/server/server/controller/ai
node --check ai.engine.js
node --check ai.lexical.js

# Lexical regression (49 cases — adds BIND_HINT extraction in Phase 8)
node ai.lexical.test.js
```

Then ask any well-known question from the assistant — confirm the
`routing_diagnostics` block is present in the `/api/ai/engine/route` JSON
response and that the side menu now shows **Skill studio → Pending phrasings**.

## Rollback

If routing regressions appear, you can revert to the pre-lexical engine
without touching SQL:

```bash
git revert <commit_for_ai.engine.js>
git revert <commit_for_ai.lexical.js>
# restart Node
```

The new vocabulary rows and `AI_ENGINE_UNRESOLVED` rows are harmless to
leave in place — the older engine simply ignores them.
