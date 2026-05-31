"use strict";

const composer = require("./ai.composer");
const lex = require("./ai.lexical");

module.exports = function (app, SQL) {
    let module = {};

    const Q = {
        SKILLS_ACTIVE: "AI0000061",
        VOCAB_BY_SKILL: "AI0000062",
        PLAYBOOK_BY_SKILL: "AI0000063",
        TEMPLATES_BY_SKILL: "AI0000064",
        DIAG_STEPS: "AI0000100",
        DIAG_CONCLUSION: "AI0000101"
    };

    const ENGINE_VENDOR_RESOLVE_CODE = "ENGINE_VENDOR_RESOLVE";

    // Below this fast-path skill score we record the question for admin curation
    // (see Phase 4 — "Pending phrasings").
    const UNRESOLVED_SCORE_THRESHOLD = 45;
    // Below this confidence we surface alternative skill chips in /route response
    // (Phase 5 — clarification chips).
    const ALTERNATIVES_CONFIDENCE_THRESHOLD = 50;

    function esc(str) { return String(str == null ? "" : str).replace(/'/g, "''").replace(/,/g, ";").replace(/\r|\n/g, " "); }

    /**
     * Phase 11 — true when an INTENT_PHRASE term implies a vendor/supplier
     * relation ("X from", "X by vendor", "X for supplier", …). Used by the
     * scoring dampener: such phrases shouldn't anchor a skill when the
     * question has no vendor reference, otherwise DSD-style skills grab
     * generic item-header queries on partial "item" overlap alone.
     *
     * Matches the trailing preposition only, so neutral phrases like
     * "promo at store" or "for site" stay unaffected.
     */
    function needsVendorContext(term) {
        const t = String(term || "").toLowerCase().trim();
        return /\bfrom$/.test(t)
            || /\bfrom\s+(supplier|vendor)\b/.test(t)
            || /\bby\s+(supplier|vendor)\b/.test(t)
            || /\bfor\s+(supplier|vendor)\b/.test(t);
    }
    function fakeRes() { return { json: function() {} }; }
    function firstArray(x) { return Array.isArray(x) ? x : []; }
    function pick(obj, up, low) { return obj && (obj[up] != null ? obj[up] : obj[low]); }
    function safeSqlLiteral(v) { return "'" + String(v == null ? "" : v).replace(/'/g, "''") + "'"; }
    function toSqlDateLiteral(v) { return "TO_DATE(" + safeSqlLiteral(v) + ", 'YYYY-MM-DD')"; }
    function normalizeSqlRows(data) {
        if (!data) { return []; }
        if (Array.isArray(data)) { return data; }
        if (Array.isArray(data.rows)) { return data.rows; }
        return [];
    }
    function runQuery(sql, user, sid, lang, req, res, cb) {
        const fr = fakeRes();
        const sqlEscaped = String(sql || "").replace(/'/g, "''");
        if (typeof SQL.executeQueryUsingMyCallBack === "function") {
            return SQL.executeQueryUsingMyCallBack(
                SQL.getNextTicketID(), sqlEscaped, "'{-1}'", user, sid, lang, req, fr,
                function (err, data) { cb(err, normalizeSqlRows(data)); }
            );
        }
        SQL.executeSQL(SQL.getNextTicketID(), sqlEscaped, {}, user, req, fr, function (err, data) {
            cb(err, normalizeSqlRows(data));
        });
    }
    function pickCtx(ctx, pname) {
        if (!ctx || !pname) { return null; }
        if (ctx[pname] != null && ctx[pname] !== "") { return ctx[pname]; }
        const low = String(pname).toLowerCase();
        for (const k of Object.keys(ctx)) {
            if (String(k).toLowerCase() === low) { return ctx[k]; }
        }
        return null;
    }

    function parseParamCatalog(parameters_json) {
        if (!parameters_json) { return []; }
        try {
            const raw = typeof parameters_json === "string" ? JSON.parse(parameters_json) : parameters_json;
            return Array.isArray(raw) ? raw : [];
        } catch (e) {
            return [];
        }
    }

    /**
     * Designer/admin declares binds in parameters_json [{ "name", "type", "required" }].
     * Engine merges ctx from execute body + entities + legacy fields and substitutes :bind in sql_text.
     * Remaining :name tokens are filled from ctx as STRING unless already inside a replaced fragment.
     */
    function applyParameterBindings(sqlText, parameters_json, ctx) {
        let sql = String(sqlText || "");
        const catalog = parseParamCatalog(parameters_json);
        const missing = [];
        const applied = {};

        function markMissing(pname) {
            if (pname && missing.indexOf(pname) < 0) { missing.push(pname); }
        }

        // TO_DATE(:param, 'YYYY-MM-DD')
        sql = sql.replace(/TO_DATE\(\s*:([a-zA-Z_][a-zA-Z0-9_]*)\s*,\s*'YYYY-MM-DD'\s*\)/gi, function (full, pname) {
            const v = pickCtx(ctx, pname);
            if (v == null || v === "") {
                markMissing(pname);
                return full;
            }
            applied[pname] = v;
            return toSqlDateLiteral(String(v).slice(0, 10));
        });

        catalog.forEach(function (def) {
            const pname = pick(def, "NAME", "name");
            if (!pname) { return; }
            const typ = String(pick(def, "TYPE", "type") || "STRING").toUpperCase();
            const re = new RegExp(":" + pname + "\\b", "gi");
            if (!re.test(sql)) { return; }
            re.lastIndex = 0;
            const v = pickCtx(ctx, pname);
            const req = def.required !== false;
            if (v == null || v === "") {
                if (req) {
                    markMissing(pname);
                } else {
                    // Optional and empty → render as NULL so SQL like
                    // "(:site_id IS NULL OR ...)" can short-circuit cleanly.
                    sql = sql.replace(re, "NULL");
                    applied[pname] = null;
                }
                return;
            }
            let lit;
            if (typ === "NUMBER" || typ === "INTEGER") {
                const n = Number(v);
                if (isNaN(n)) {
                    if (req) { markMissing(pname); }
                    return;
                }
                lit = String(n);
            } else {
                lit = safeSqlLiteral(v);
            }
            sql = sql.replace(re, lit);
            applied[pname] = v;
        });

        sql = sql.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)\b/g, function (full, pname) {
            const v = pickCtx(ctx, pname);
            if (v == null || v === "") {
                markMissing(pname);
                return full;
            }
            if (applied[pname] != null) { return full; }
            const lit = safeSqlLiteral(v);
            applied[pname] = v;
            return lit;
        });

        return { sql: sql, missing: missing, applied: applied };
    }

    function buildExecuteContext(req) {
        const body = req.body || {};
        const asOf = body.as_of_date || new Date().toISOString().slice(0, 10);
        const ctx = {
            supplier_id: body.supplier_id,
            retailer_id: body.retailer_id,
            site_id: body.site_id,
            intent_type: body.intent_type || "GENERAL",
            as_of_date: asOf,
            date_from: body.date_from || asOf,
            date_to: body.date_to || asOf,
            // Flag: true only when the caller explicitly supplied date range binds.
            // Used by pickExecutionTemplate to demote movement/log templates when
            // date_from/date_to come from the built-in default (today) rather than
            // the user's question — otherwise DSD_RECENT_MOVEMENTS scores as
            // bind-satisfied for any question that has site_id.
            _date_explicit: !!(body.date_from || body.date_to),
            vendor_text: body.vendor_text,
            question_text: body.question_text
        };
        // Issue 4 — relative date normalization. When the user says "last week" or
        // "past 7 days" and no explicit date range was passed, resolve it so
        // _date_explicit becomes true and MOVEMENT/HISTORY templates are not wrongly
        // demoted by the temporal guard in pickExecutionTemplate.
        if (!ctx._date_explicit && ctx.question_text) {
            if (typeof lex.extractRelativeDate === "function") {
                const relDate = lex.extractRelativeDate(ctx.question_text);
                if (relDate) {
                    ctx.date_from = relDate.date_from;
                    ctx.date_to   = relDate.date_to;
                    ctx._date_explicit = true;
                }
            }
        }
        const skip = { skill_id: 1, intent_type: 1, template_code: 1, bindings: 1, entities: 1 };
        Object.keys(body).forEach(function (k) {
            if (!skip[k] && body[k] != null && body[k] !== "") {
                ctx[k] = body[k];
            }
        });
        if (body.entities && typeof body.entities === "object") {
            Object.keys(body.entities).forEach(function (k) {
                const v = body.entities[k];
                if (v != null && v !== "") { ctx[k] = v; }
            });
        }
        if (body.bindings && typeof body.bindings === "object") {
            Object.assign(ctx, body.bindings);
        }
        return ctx;
    }

    /**
     * Legacy pass: named binds still supported without catalog entries.
     * Important: only substitute when the context value is a non-empty string —
     * otherwise the placeholder must be left intact so listUnboundPlaceholders
     * can flag it as missing (e.g. supplier_id when vendor resolution failed).
     */
    function renderTemplateSql(sqlText, ctx) {
        let sql = String(sqlText || "");
        function bindString(re, val) {
            if (val == null || val === "") { return; }
            sql = sql.replace(re, safeSqlLiteral(val));
        }
        function bindDate(reTo, reBare, val) {
            if (val == null || val === "") { return; }
            sql = sql.replace(reTo, toSqlDateLiteral(val));
            sql = sql.replace(reBare, safeSqlLiteral(val));
        }
        bindString(/:supplier_id\b/gi, ctx.supplier_id);
        bindString(/:vendor_text\b/gi, ctx.vendor_text);
        bindString(/:ean\b/gi, ctx.ean);
        bindString(/:lu_id\b/gi, ctx.lu_id);
        bindString(/:order_ref\b/gi, ctx.order_ref);
        bindString(/:site_id\b/gi, ctx.site_id);
        bindString(/:retailer_id\b/gi, ctx.retailer_id);
        bindDate(/TO_DATE\(\s*:as_of_date\s*,\s*'YYYY-MM-DD'\s*\)/gi, /:as_of_date\b/gi, ctx.as_of_date);
        bindDate(/TO_DATE\(\s*:date_from\s*,\s*'YYYY-MM-DD'\s*\)/gi, /:date_from\b/gi, ctx.date_from);
        bindDate(/TO_DATE\(\s*:date_to\s*,\s*'YYYY-MM-DD'\s*\)/gi, /:date_to\b/gi, ctx.date_to);
        return sql;
    }

    function listUnboundPlaceholders(sql) {
        const out = [];
        const re = /:([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
        const text = String(sql || "");
        let x;
        while ((x = re.exec(text)) !== null) {
            // Oracle non-capturing groups look like (?:vendor|…) — do not treat
            // the colon inside ?: as a bind placeholder (false :vendor / :for).
            if (x.index > 0 && text.charAt(x.index - 1) === "?") { continue; }
            if (out.indexOf(x[1]) < 0) { out.push(x[1]); }
        }
        return out;
    }

    function renderTemplateForExecution(sqlText, parameters_json, ctx) {
        const first = applyParameterBindings(sqlText, parameters_json, ctx);
        const afterLegacy = renderTemplateSql(first.sql, ctx);
        const fromCatalog = first.missing || [];
        const stillUnbound = listUnboundPlaceholders(afterLegacy);
        const merged = fromCatalog.concat(stillUnbound).filter(function (v, i, arr) {
            return arr.indexOf(v) === i;
        });
        return {
            sql: afterLegacy,
            missing: merged,
            applied: first.applied
        };
    }

    function templateSqlIncomplete(sqlText) {
        return /TODO_REPLACE|TODO:\s*REPLACE|PLACEHOLDER_VENDOR_BUYABLE/i.test(String(sqlText || ""));
    }

    /** RETRIEVAL must return item-ish columns, not only bind echo + NOTE from dual. */
    function retrievalRowsLookLikeNonAnswer(rows) {
        if (!rows || !rows.length) {
            return false;
        }
        const keys = Object.keys(rows[0] || {}).map(function (k) { return k.toUpperCase(); });
        const hasItemKey = keys.some(function (k) {
            return /ITEM|LU|ART|CODART|ARAC|EAN|CINR|CEXR/.test(k);
        });
        if (hasItemKey) {
            return false;
        }
        const noteVal = String(rows[0].NOTE || rows[0].note || "");
        if (noteVal && /TODO|PLACEHOLDER/i.test(noteVal)) {
            return true;
        }
        if (rows.length === 1 && keys.length <= 5 &&
            keys.every(function (k) { return /SUPPLIER|SITE|AS_OF|NOTE|RETAILER/i.test(k); })) {
            return true;
        }
        return false;
    }

    /**
     * List of bind names a template declares as required (catalog-driven).
     * Falls back to scanning the raw SQL for :name placeholders if catalog is empty.
     */
    function listRequiredBinds(template) {
        const catalog = parseParamCatalog(pick(template, "PARAMETERS_JSON", "parameters_json"));
        if (catalog.length) {
            return catalog
                .filter(function (def) {
                    if (!def || !pick(def, "NAME", "name")) { return false; }
                    return def.required !== false;
                })
                .map(function (def) { return String(pick(def, "NAME", "name")).toLowerCase(); });
        }
        // No catalog declared — fall back to placeholders found in the SQL.
        return listUnboundPlaceholders(pick(template, "SQL_TEXT", "sql_text"))
            .map(function (n) { return String(n).toLowerCase(); });
    }

    /** True when ctx already has a non-empty value for every required bind. */
    function templateBindsSatisfied(template, ctx) {
        const required = listRequiredBinds(template);
        for (let i = 0; i < required.length; i += 1) {
            const v = pickCtx(ctx, required[i]);
            if (v == null || v === "") { return false; }
        }
        return true;
    }

    /** Rough textual identity used by the picker. */
    function templatePhraseText(t) {
        return [
            pick(t, "TEMPLATE_CODE", "template_code"),
            pick(t, "TEMPLATE_LABEL", "template_label"),
            pick(t, "PURPOSE", "purpose")
        ].join(" ");
    }

    /**
     * Templates with code ENGINE_* are router-only; /execute uses business templates.
     * Picker now combines:
     *   - explicit "items by vendor" preference when a supplier is resolved
     *   - n-gram similarity between the question and template text
     *   - a hard penalty for templates whose required binds the engine cannot satisfy
     */
    function pickExecutionTemplate(list, intent_type, ctx, question_text) {
        const rows = list.filter(function (t) {
            return !/^ENGINE_/i.test(String(pick(t, "TEMPLATE_CODE", "template_code") || ""));
        });
        if (!rows.length) { return null; }

        const supplierResolved = !!pickCtx(ctx, "supplier_id");
        // vendor_text present (name extracted from question) even when the resolver
        // couldn't pin supplier_id (0-row match) — still a vendor-intent signal.
        const hasVendorIntent = supplierResolved || !!pickCtx(ctx, "vendor_text");
        const qSet = lex.phraseSet(question_text || "", 3);

        const scored = rows.map(function (t) {
            const code = String(pick(t, "TEMPLATE_CODE", "template_code") || "");
            const phraseSet = lex.phraseSet(templatePhraseText(t), 3);
            const overlap = lex.overlap(qSet, phraseSet);
            const sim = lex.jaccard(qSet, phraseSet);

            let score = overlap * 4 + Math.round(sim * 40);

            // Strong preference for "items by vendor" when supplier is resolved,
            // regardless of whether intent detection labelled this RETRIEVAL.
            if (supplierResolved && /BUYABLE|VENDOR_BUY|ITEMS_VENDOR|ORDERABLE/i.test(code)) {
                score += 30;
            }
            // Partial credit when vendor name was extracted but not yet resolved —
            // still prefer the buyable-items template over movement templates.
            if (!supplierResolved && hasVendorIntent && /BUYABLE|VENDOR_BUY|ITEMS_VENDOR|ORDERABLE/i.test(code)) {
                score += 20;
            }
            if (intent_type === "RETRIEVAL" && /BUYABLE|VENDOR_BUY|ITEMS_VENDOR|ORDERABLE/i.test(code)) {
                score += 10;
            }

            if (pickCtx(ctx, "order_ref") && !pickCtx(ctx, "lu_id") && /ORDER_REF_LOOKUP/i.test(code)) {
                score += 50;
            }
            if (pickCtx(ctx, "order_ref") && /BARCODE_LOOKUP|BARCODE/i.test(code)) {
                score -= 60;
            }
            if (pickCtx(ctx, "ean") && !pickCtx(ctx, "lu_id") && /BARCODE_LOOKUP|BARCODE/i.test(code)) {
                score += 45;
            }
            // After EAN→LU resolution, prefer the item card over another barcode read.
            if (pickCtx(ctx, "lu_id") && pickCtx(ctx, "ean") && /BARCODE_LOOKUP|BARCODE/i.test(code)) {
                score -= 55;
            }
            if (pickCtx(ctx, "lu_id") && pickCtx(ctx, "order_ref") && /ORDER_REF_LOOKUP/i.test(code)) {
                score -= 55;
            }
            if (pickCtx(ctx, "lu_id") && /ARTICLE_HEADER|FULL_ATTRIBUTES/i.test(code)) {
                score += 25;
            }

            // Bind-feasibility penalty: templates whose required binds we cannot
            // satisfy from ctx are demoted hard. Avoids picking a template that
            // demands :lu_id / :site_id when neither was extracted.
            if (!templateBindsSatisfied(t, ctx)) {
                score -= 50;
            }

            // Temporal-context guard: movement/receipt/log templates use date_from
            // and date_to, which buildExecuteContext always defaults to today. That
            // makes them appear bind-satisfied even for questions like "what items
            // can I buy from Lipari?" — demote them unless the user actually
            // mentioned a date range in this request.
            if (!ctx._date_explicit && /MOVEMENT|RECEIPT|HISTORY|LOG|RECENT/i.test(code)) {
                score -= 40;
            }

            return { row: t, score: score, overlap: overlap, sim: sim };
        }).sort(function (a, b) { return b.score - a.score; });

        // If the best score is non-negative, return it. Otherwise fall back to
        // the first row whose binds we *can* satisfy (avoids returning a
        // template that will only ask for missing binds).
        if (scored.length && scored[0].score >= 0) {
            return scored[0].row;
        }
        const feasible = scored.find(function (s) { return templateBindsSatisfied(s.row, ctx); });
        if (feasible) { return feasible.row; }
        return rows[0];
    }

    function executeLib(queryNum, paramsArray, user, sid, lang, req, res, cb) {
        const packed = "'{" + paramsArray.map(esc).join(",") + "}'";
        SQL.executeLibQueryUsingMyCallback(
            SQL.getNextTicketID(), queryNum, packed, user, sid, lang, req, res,
            function (err, data) { cb(err, firstArray(data)); }
        );
    }

    /**
     * Prefer the highest-ranked skill that actually has AI_SKILL_SQL_TEMPLATE rows.
     * Avoids picking the seed skill DSD_VENDOR (no templates) over DSD_VENDOR_RETAIL (full pack).
     */
    function firstScoredSkillWithTemplates(scored, index, user, sid, lang, req, res, cb) {
        if (!scored.length) {
            return cb(new Error("no scored skills"));
        }
        if (index >= scored.length) {
            return cb(null, scored[0], []);
        }
        const cand = scored[index];
        executeLib(Q.TEMPLATES_BY_SKILL, [cand.skill_id], user, sid, lang, req, res, function (tErr, rows) {
            if (!tErr && firstArray(rows).length) {
                return cb(null, cand, firstArray(rows));
            }
            return firstScoredSkillWithTemplates(scored, index + 1, user, sid, lang, req, res, cb);
        });
    }

    /** Stem-based unigrams (used by skill scorer + template picker). */
    function tokenize(text) {
        return lex.tokens(text);
    }

    /**
     * Intent detection — broadened to cover the natural phrasings analysts type.
     * RETRIEVAL recognises buy/order/purchase synonyms, "what item(s)", "which
     * items", "items I/we can buy", "orderable", "assortment from", etc.
     */
    function detectIntent(text) {
        const t = String(text || "").toLowerCase();
        const RETRIEVAL_PATTERNS = [
            /\b(which|what)\s+(item|items|article|articles|product|products|sku|skus)\b/,
            /\b(list|show|give|fetch|get)\s+(me\s+)?(the\s+)?(item|items|article|articles|product|products|sku|skus)\b/,
            /\b(can|could|may)\s+(we|i|you)\s+(buy|order|purchase|stock|carry|sell)\b/,
            /\b(items?|articles?|products?|skus?)\s+(we|i)?\s*(can|could|may)\s+(buy|order|purchase|carry)\b/,
            /\b(buy|order|purchase|orderable|buyable)\b[^.?]*\bfrom\b/,
            /\b(orderable|buyable|carryable|assortment|catalog(?:ue)?)\b/,
            /\bavailable\s+(item|items|article|articles|product|products|sku|skus)\b/,
            /\bwhat\s+can\s+(we|i)\s+(buy|order|purchase|carry|sell)\b/,
            /\blipari|catalog|range\b.*\bfrom\b/
        ];
        for (let i = 0; i < RETRIEVAL_PATTERNS.length; i += 1) {
            if (RETRIEVAL_PATTERNS[i].test(t)) { return "RETRIEVAL"; }
        }
        if (/\b(why|root\s+cause|blocked|issue|problem|failed|short\s+shipment|exception|not\s+received|unconfirmed|mismatch|variance|negative\s+stock|can.?t\s+order|cannot\s+order|unable\s+to\s+order|not\s+orderable|order\s+blocked|can.?t\s+place\s+order|not\s+able\s+to\s+order)\b/.test(t)) {
            return "DIAGNOSTIC";
        }
        if (/\b(how\s+is|performance|fill\s+rate|reliable|reliability|health|status\s+of\s+supplier|on[\-\s]time)\b/.test(t)) {
            return "ANALYSIS";
        }
        return "GENERAL";
    }

    function extractVendorText(text) {
        const raw = String(text || "");
        const stop = "(?:\\s+(?:for|at|in|to|the|with|and|or)\\s|\\s+store\\s|\\s+site\\s|\\s+warehouse\\s|\\?|$)";
        let m = raw.match(new RegExp("\\bbuy\\s+from\\s+([a-z0-9\\-\\s&\\.]+?)" + stop, "i"));
        if (m && m[1]) { return m[1].trim().replace(/[\s\.]+$/, ""); }
        m = raw.match(new RegExp("\\bfrom\\s+([a-z0-9\\-\\s&\\.]+?)" + stop, "i"));
        if (m && m[1]) { return m[1].trim().replace(/[\s\.]+$/, ""); }
        // "how is supplier LIPARI performing", "status of supplier UNILEVER"
        m = raw.match(/(?:supplier|vendor)\s+([a-z0-9\-\s&\.]+?)(?:\s+performing|\s+reliable|\s+health|\?|$)/i);
        if (m && m[1]) { return m[1].trim().replace(/[\s\.]+$/, ""); }
        // "what about MIDLAND", "how about UNILEVER"
        m = raw.match(/^(?:what|how)\s+about\s+([a-z0-9\-\s&\.]+?)(?:\s*\?|$)/i);
        if (m && m[1]) { return m[1].trim().replace(/[\s\.]+$/, ""); }
        return "";
    }

    /**
     * Pull a store / site identifier out of the question text. Recognises:
     *   "for store 7", "store 41", "store=041", "site 2200", "warehouse 12",
     *   "site_id 7", "in store 7", "@ store 7"
     * Returns the captured digits as a string (no left-padding) or "" when
     * no store reference is detected.
     */
    function extractSiteId(text) {
        const raw = String(text || "");
        const patterns = [
            /\b(?:store|site|warehouse)\s*(?:id|#|=|:)?\s*(\d{1,6})\b/i,
            /\bsite_id\s*(?:=|:)?\s*(\d{1,6})\b/i,
            /\bstore_id\s*(?:=|:)?\s*(\d{1,6})\b/i
        ];
        for (let i = 0; i < patterns.length; i += 1) {
            const m = raw.match(patterns[i]);
            if (m && m[1]) { return m[1]; }
        }
        return "";
    }

    /**
     * LU / article code from the question. Recognises:
     *   "item 100100", "article 100100", "codart 100100", "lu 100100",
     *   "artrac 100100", "cinr 100100", "product 100100", "sku 100100"
     * Always requires a keyword prefix so the result doesn't conflict
     * with site_id (short) or EAN (8–14 digits).
     */
    function extractLuId(text) {
        const raw = String(text || "").trim();
        const patterns = [
            /\b(?:item|article|codart|lu|lu_id|artrac|artcexr|cinr|artcexr)\s*(?:code|#|no\.?|=|:)?\s*(\d{4,8})\b/i,
            /\b(?:product|sku)\s*(?:code|#|no\.?)?\s*[:#=]?\s*(\d{4,8})\b/i
        ];
        for (let i = 0; i < patterns.length; i += 1) {
            const m = raw.match(patterns[i]);
            if (m && m[1]) { return m[1]; }
        }
        return "";
    }

    /**
     * EAN / UPC / GTIN from the question. Handles "ean 39978013736",
     * "barcode 0001234567890", and a bare 8–14 digit follow-up reply.
     */
    /**
     * Supplier order reference (ARTUC.ARAREFC) — "ref to order 857068004057".
     * Must run before extractEan so a 12-digit ref is not treated as UPC.
     */
    function extractOrderRef(text) {
        const raw = String(text || "").trim();
        const patterns = [
            /\b(?:ref\.?\s*to\s*order|reference\s+to\s*order|order\s+ref(?:erence)?)\s*(?:#|no\.?|number|code)?\s*[:#=]?\s*([0-9]{5,18})\b/i,
            /\b(?:ref\.?\s*to\s*order|reference\s+to\s*order)\s+([0-9]{5,18})\b/i
        ];
        for (let i = 0; i < patterns.length; i += 1) {
            const m = raw.match(patterns[i]);
            if (m && m[1]) { return m[1]; }
        }
        return "";
    }

    function extractEan(text) {
        const raw = String(text || "").trim();
        if (extractOrderRef(raw)) { return ""; }
        const patterns = [
            /\b(?:ean|upc|gtin|barcode|gencod)\s*(?:code|no\.?|number|#)?\s*[:#=]?\s*(\d{8,14})\b/i,
            /\bscanned\s+(?:ean|upc|barcode)\s*(\d{8,14})\b/i
        ];
        for (let i = 0; i < patterns.length; i += 1) {
            const m = raw.match(patterns[i]);
            if (m && m[1]) { return m[1]; }
        }
        if (/^\d{8,14}$/.test(raw)) { return raw; }
        return "";
    }

    /**
     * INTENT_PHRASE rows like "more about ean" must not score on shared
     * n-grams alone ("more about") when the question has no EAN/UPC token.
     */
    function intentPhraseDiscriminatorsSatisfied(term, questionText) {
        const t = String(term || "").toLowerCase();
        const q = String(questionText || "").toLowerCase();
        if (/\b(ean|upc|gtin|barcode|gencod)\b/.test(t)) {
            return /\b(ean|upc|gtin|barcode|gencod)\b/.test(q);
        }
        if (/ref\s*to\s*order|reference\s+to\s+order|order\s+ref/.test(t)) {
            return /\bref\b/.test(q) && /\border\b/.test(q);
        }
        return true;
    }

    /**
     * Phase 8 — turn BIND_HINT vocab rows into entity extractions.
     *
     * Designers add rows like:
     *   { term: "for store",     concept: "site_id" }
     *   { term: "from supplier", concept: "supplier_id" }
     *   { term: "as of",         concept: "as_of_date" }
     *
     * The helper finds the term in the question, captures the value token
     * that follows, and populates `entities[concept]` if not already set.
     * Works for any concept name (lowercase entity name) without needing
     * a Node deploy. Hardcoded extractors win first; this only fills gaps.
     *
     * Returns the same shape as `lex.extractBindsFromHints` plus a `_count`
     * convenience field used by the diagnose payload.
     */
    function buildBindHintsFromVocab(vocabRows) {
        return firstArray(vocabRows)
            .filter(function (v) {
                return String(pick(v, "TERM_TYPE", "term_type") || "").toUpperCase() === "BIND_HINT";
            })
            .map(function (v) {
                return {
                    term:    String(pick(v, "TERM", "term") || ""),
                    concept: String(pick(v, "CANONICAL_CONCEPT", "canonical_concept") || ""),
                    confidence_boost: Number(pick(v, "CONFIDENCE_BOOST", "confidence_boost") || 1)
                };
            })
            .filter(function (h) { return h.term && h.concept; });
    }

    function extractEntitiesFromBindHints(text, vocabRows, alreadyExtracted) {
        const hints = buildBindHintsFromVocab(vocabRows);
        // Phase 11 — defensive: if the loaded `lex` module pre-dates Phase 8
        // (extractBindsFromHints added then), skip the BIND_HINT pass instead
        // of crashing the whole route. Logging tells the operator to restart.
        if (typeof lex.extractBindsFromHints !== "function") {
            console.warn("ai.engine: lex.extractBindsFromHints missing — stale Node process. " +
                "Restart the server so ai.lexical.js (Phase 8) is reloaded.");
            return { entities: {}, matches: [] };
        }
        let result;
        try {
            result = lex.extractBindsFromHints(text, hints);
        } catch (e) {
            console.warn("ai.engine: lex.extractBindsFromHints threw — falling back to no-op.", String(e));
            return { entities: {}, matches: [] };
        }
        const entities = {};
        const matches = (result.matches || []).slice();
        Object.keys(result.entities || {}).forEach(function (concept) {
            if (alreadyExtracted && alreadyExtracted[concept] != null && alreadyExtracted[concept] !== "") {
                // Don't overwrite a value the hardcoded extractor already produced.
                // We still record the match (with used=false) for the playground.
                matches.forEach(function (m) {
                    if (m.concept === concept && m.used) { m.used = false; m.skipped_reason = "hardcoded_extractor_won"; }
                });
                return;
            }
            entities[concept] = result.entities[concept];
        });
        return { entities: entities, matches: matches };
    }

    module.route = function () {
        app.post("/api/ai/engine/route", function (req, res) {
            res.setHeader("Access-Control-Allow-Origin", "*");
            const retailer_id = req.body.retailer_id;
            const question_text = req.body.question_text;
            // Phase 5 — when the analyst clicks a "Try with: <skill>" chip in the
            // assistant, the client re-routes with one of the following hints set.
            const preferredSkillId = String(req.body.preferred_skill_id || "").trim();
            const preferredSkillCode = String(req.body.preferred_skill_code || "").trim().toUpperCase();
            if (!retailer_id || !question_text) {
                return res.status(400).json({ error: "retailer_id and question_text are required" });
            }

            const user = req.header("USER") || "SYSTEM";
            const sid  = "'{" + req.header("DATABASE_SID") + "}'";
            const lang = "'{" + req.header("LANGUAGE") + "}'";
            const fr = fakeRes();

            executeLib(Q.SKILLS_ACTIVE, ["-1"], user, sid, lang, req, fr, function (sErr, skills) {
                if (sErr) {
                    return res.status(500).json({
                        error: "AI0000061 unavailable",
                        hint: "Deploy deployment/database/SCRIPTS/ai_engine_libquery.sql on the ICR DB and restart the Node server.",
                        libquery: "AI0000061",
                        details: JSON.stringify(sErr)
                    });
                }
                if (!skills.length) {
                    return res.status(200).json({
                        intent_type: detectIntent(question_text),
                        confidence: 0,
                        selected_skill_id: null,
                        selected_skill_code: null,
                        requires_clarification: true,
                        requested_sql_templates: ["Define at least one active skill in AI_SKILL."],
                        message: "No active skills found."
                    });
                }

                executeLib(Q.VOCAB_BY_SKILL, ["-1"], user, sid, lang, req, fr, function (vErr, vocabRows) {
                    if (vErr) {
                        return res.status(500).json({
                            error: "AI0000062 unavailable",
                            hint: "Deploy deployment/database/SCRIPTS/ai_engine_libquery.sql on the ICR DB and restart the Node server.",
                            libquery: "AI0000062",
                            details: JSON.stringify(vErr)
                        });
                    }
                    // Phase 11 — playbook is auxiliary (small score boost only).
                    // If AI0000063 / AI_SKILL_PLAYBOOK_STEP is missing, log and
                    // continue with an empty playbook rather than failing the
                    // whole route.  Routing/scoring/vocab still work fully.
                    executeLib(Q.PLAYBOOK_BY_SKILL, ["-1"], user, sid, lang, req, fr, function (pErr, playbookRowsRaw) {
                        if (pErr) {
                            console.warn("ai.engine.route: AI0000063 unavailable — continuing with empty playbook.",
                                JSON.stringify(pErr).slice(0, 400));
                        }
                        const playbookRows = pErr ? [] : playbookRowsRaw;

                        const tokens = tokenize(question_text);
                        const intent = detectIntent(question_text);
                        const vendorText = extractVendorText(question_text);
                        const siteIdFromText = extractSiteId(question_text);
                        const orderRefFromText = extractOrderRef(question_text);
                        const eanFromText = orderRefFromText ? "" : extractEan(question_text);
                        const luIdFromText = extractLuId(question_text);
                        const questionPhrases = lex.phraseSet(question_text, 3);

                        // Phase 8 — designer-driven entity extraction from BIND_HINT vocab.
                        // Hardcoded extractors (extractVendorText, extractSiteId, extractEan,
                        // extractLuId) are checked first, so a designer's vocab row never
                        // overrides a value already captured by the regex layer.
                        const hardcodedExtracted = {
                            lu_id:      luIdFromText || null,
                            site_id:    siteIdFromText || null,
                            vendor_text: vendorText || null,
                            order_ref:  orderRefFromText || null,
                            ean:        eanFromText || null
                        };
                        const bindHintResult = extractEntitiesFromBindHints(
                            question_text,
                            vocabRows,
                            hardcodedExtracted
                        );
                        const bindHintEntities = bindHintResult.entities || {};
                        const bindHintExtractions = bindHintResult.matches || [];

                        function mergeRouteEntities(extra) {
                            const base = Object.assign({}, bindHintEntities);
                            Object.keys(hardcodedExtracted).forEach(function (k) {
                                const v = hardcodedExtracted[k];
                                if (v != null && v !== "") { base[k] = v; }
                            });
                            return Object.assign(base, extra || {});
                        }

                        const scored = skills.map(function (s) {
                            const sidSkill = pick(s, "SKILL_ID", "skill_id");
                            const code = pick(s, "SKILL_CODE", "skill_code");
                            const domain = String(pick(s, "DOMAIN", "domain") || "").toLowerCase();
                            let score = 10;
                            let vocabHits = 0;
                            let vocabBoost = 0;
                            let bestVocabTerm = null;
                            let bestVocabBoost = 0;

                            if (intent === "RETRIEVAL") { score += 8; }
                            if (vendorText && /dsd|supplier|vendor/.test(domain + " " + String(code || "").toLowerCase())) {
                                score += 12;
                            }
                            if (tokens.some(function (t) { return domain.indexOf(t) >= 0; })) { score += 6; }

                            // Vocabulary scoring uses lexical n-gram match (Phase 2).
                            // INTENT_PHRASE rows weigh more than plain SYNONYMs because they
                            // anchor a full intent ("what items can we buy from").
                            //
                            // Phase 11 dampener — INTENT_PHRASEs ending in a vendor-relation
                            // preposition ("…from", "…by vendor", "…for supplier") shouldn't
                            // anchor when the question has no vendor/supplier reference,
                            // otherwise DSD-style skills grab item-header queries like
                            // "tell me about item 100100" on partial "item" overlap alone.
                            const hasVendorCtx = !!(vendorText || bindHintEntities.supplier_id);
                            vocabRows
                                .filter(function (v) { return pick(v, "SKILL_ID", "skill_id") === sidSkill; })
                                .forEach(function (v) {
                                    const term = String(pick(v, "TERM", "term") || "");
                                    if (!term) { return; }
                                    const termSet = lex.phraseSet(term, 3);
                                    if (!termSet.size) { return; }
                                    const overlap = lex.overlap(termSet, questionPhrases);
                                    if (!overlap) { return; }
                                    const termType = String(pick(v, "TERM_TYPE", "term_type") || "SYNONYM").toUpperCase();
                                    if (termType === "INTENT_PHRASE"
                                        && !intentPhraseDiscriminatorsSatisfied(term, question_text)) {
                                        return;
                                    }
                                    const boost = Number(pick(v, "CONFIDENCE_BOOST", "confidence_boost") || 1);
                                    let multiplier = 4;
                                    if (termType === "INTENT_PHRASE") { multiplier = 9; }
                                    else if (termType === "BIND_HINT") { multiplier = 2; }
                                    else if (termType === "JARGON" || termType === "BRAND_TERM") { multiplier = 5; }
                                    if (termType === "INTENT_PHRASE"
                                        && !hasVendorCtx
                                        && needsVendorContext(term)) {
                                        multiplier = 2;
                                    }
                                    const localBoost = boost * multiplier * Math.min(overlap, termSet.size);
                                    vocabHits += 1;
                                    vocabBoost += localBoost;
                                    if (localBoost > bestVocabBoost) {
                                        bestVocabBoost = localBoost;
                                        bestVocabTerm = term;
                                    }
                                });
                            score += vocabBoost;

                            playbookRows
                                .filter(function (p) { return pick(p, "SKILL_ID", "skill_id") === sidSkill; })
                                .forEach(function (p) {
                                    const ct = String(pick(p, "COMPLAINT_TYPE", "complaint_type") || "").toLowerCase();
                                    if (ct && String(question_text).toLowerCase().indexOf(ct.replace(/_/g, " ")) >= 0) {
                                        score += 7;
                                    }
                                });

                            // Safeguard: keep conversational skills from swallowing domain questions
                            // unless conversational vocabulary actually matches the user text.
                            const convoSkill = /conversation/.test(domain + " " + String(code || "").toLowerCase());
                            if (convoSkill && vocabHits === 0) { score -= 18; }
                            if (!convoSkill && vocabHits > 0) { score += Math.min(8, vocabHits * 2); }

                            if (eanFromText && /ITEM_MASTER|ITEM_RETAIL/i.test(String(code || ""))) {
                                score += 18;
                            }

                            // Issue 2 — entity-presence bonuses. Mirror the vendorText +12
                            // for supplier-domain skills: give ITEM_MASTER/ITEM_RETAIL a boost
                            // when an item identifier or store-without-vendor was extracted, so
                            // they are not beaten by DSD/supplier skills on vocab overlap alone.
                            const luId = luIdFromText || bindHintEntities.lu_id;
                            if (luId && /ITEM_MASTER|ITEM_RETAIL/i.test(String(code || ""))) {
                                score += 15;
                            }
                            if (siteIdFromText && !vendorText && /ITEM_MASTER|ITEM_RETAIL/i.test(String(code || ""))) {
                                score += 8;
                            }

                            return {
                                skill_id: sidSkill,
                                skill_code: code,
                                score: Math.round(score),
                                vocab_hits: vocabHits,
                                best_vocab_term: bestVocabTerm
                            };
                        }).sort(function (a, b) { return b.score - a.score; });

                        // Phase 5 — explicit user pick wins over scoring. Boost the
                        // requested skill so it sits at index 0 while keeping the
                        // organic ordering for everyone else (so the alternatives
                        // still reflect what the engine *would* have chosen).
                        if (preferredSkillId || preferredSkillCode) {
                            const idx = scored.findIndex(function (s) {
                                if (preferredSkillId && String(s.skill_id || "") === preferredSkillId) { return true; }
                                if (preferredSkillCode && String(s.skill_code || "").toUpperCase() === preferredSkillCode) { return true; }
                                return false;
                            });
                            if (idx > 0) {
                                const picked = scored.splice(idx, 1)[0];
                                picked.score = Math.max(picked.score, scored[0].score + 5);
                                picked.user_override = true;
                                scored.unshift(picked);
                            } else if (idx === 0) {
                                scored[0].user_override = true;
                            }
                        }

                        return firstScoredSkillWithTemplates(scored, 0, user, sid, lang, req, fr, function (pickErr, top, tplRows) {
                            if (pickErr) {
                                return res.status(500).json({ error: "skill pick failed", details: String(pickErr) });
                            }
                            const confidence = Math.min(99, Math.max(25, top.score));

                            // Phase 4a — diagnostics emitted alongside every route response
                            // so the client can log low-confidence questions to
                            // AI_ENGINE_UNRESOLVED via LIBQUERY AI0000071.
                            const routingDiagnostics = {
                                normalized_text: lex.normalize(question_text),
                                top_skill_id:    top.skill_id,
                                top_skill_code:  top.skill_code,
                                top_score:       top.score,
                                second_skill_code: scored[1] ? scored[1].skill_code : null,
                                second_score:    scored[1] ? scored[1].score : null,
                                vocab_hits:      top.vocab_hits || 0,
                                best_vocab_term: top.best_vocab_term || null,
                                low_confidence:  top.score < UNRESOLVED_SCORE_THRESHOLD,
                                user_override:   !!top.user_override
                            };

                            if (!vendorText) {
                                const sendRouteResponse = function (diagAvailable) {
                                    routingDiagnostics.diagnostic_available = diagAvailable;
                                    routingDiagnostics.suggested_chain_skill_id = diagAvailable ? top.skill_id : null;
                                    return res.status(200).json({
                                        intent_type: intent,
                                        confidence,
                                        selected_skill_id: top.skill_id,
                                        selected_skill_code: top.skill_code,
                                        entities: mergeRouteEntities(),
                                        bind_hint_extractions: bindHintExtractions,
                                        requires_clarification: false,
                                        requested_sql_templates: [],
                                        alternatives: scored.slice(1, 4),
                                        routing_diagnostics: routingDiagnostics
                                    });
                                };
                                // Issue 5 — when DIAGNOSTIC intent, check whether the top skill
                                // has authored AI_DIAGNOSTIC_STEP rows. If yes, signal the client
                                // to call /diagnose-chain instead of /execute.
                                if (intent === "DIAGNOSTIC") {
                                    return executeLib(Q.DIAG_STEPS, [top.skill_id], user, sid, lang, req, fr, function (dsErr, dsRows) {
                                        sendRouteResponse(!dsErr && dsRows && dsRows.length > 0);
                                    });
                                }
                                return sendRouteResponse(false);
                            }

                            const tplList = firstArray(tplRows).map(function (t) {
                                return {
                                    template_code: pick(t, "TEMPLATE_CODE", "template_code"),
                                    sql_text: pick(t, "SQL_TEXT", "sql_text"),
                                    parameters_json: pick(t, "PARAMETERS_JSON", "parameters_json")
                                };
                            });
                            const resolveTpl = tplList.find(function (t) {
                                return String(t.template_code || "").toUpperCase() === ENGINE_VENDOR_RESOLVE_CODE;
                            });
                            if (!resolveTpl || !resolveTpl.sql_text) {
                                return res.status(200).json({
                                    intent_type: intent,
                                    confidence: Math.max(20, confidence - 15),
                                    selected_skill_id: top.skill_id,
                                    selected_skill_code: top.skill_code,
                                    entities: mergeRouteEntities({ vendor_text: vendorText }),
                                    bind_hint_extractions: bindHintExtractions,
                                    requires_clarification: true,
                                    candidate_options: [],
                                    requested_sql_templates: [
                                        "Add SQL template " + ENGINE_VENDOR_RESOLVE_CODE +
                                            " to skill " + top.skill_code + " (FOUDGENE vendor resolution)."
                                    ],
                                    message: "Vendor resolver template missing on selected skill."
                                });
                            }
                            const resolveRendered = renderTemplateForExecution(
                                resolveTpl.sql_text,
                                resolveTpl.parameters_json,
                                {
                                    vendor_text: vendorText,
                                    // Pass extracted vendor name as question_text too — older
                                    // ENGINE_VENDOR_RESOLVE variants use a WITH q CTE that
                                    // extracts vendor_guess from :question_text via Oracle regex.
                                    // When vendorText is already clean (e.g. "Midland"), passing
                                    // it here bypasses the Oracle regex step cleanly.
                                    // Newer templates that use :vendor_text directly ignore this.
                                    question_text: vendorText || question_text,
                                    retailer_id: retailer_id
                                }
                            );
                            if (resolveRendered.missing.length) {
                                return res.status(200).json({
                                    intent_type: intent,
                                    confidence: Math.max(20, confidence - 10),
                                    selected_skill_id: top.skill_id,
                                    selected_skill_code: top.skill_code,
                                    entities: mergeRouteEntities({ vendor_text: vendorText }),
                                    bind_hint_extractions: bindHintExtractions,
                                    requires_clarification: true,
                                    candidate_options: [],
                                    parameter_gaps: resolveRendered.missing,
                                    requested_sql_templates: resolveRendered.missing.map(function (n) {
                                        return "Missing bind :" + n + " for " + ENGINE_VENDOR_RESOLVE_CODE +
                                            " (declare in parameters_json and pass from route body / defaults).";
                                    }),
                                    message: "Vendor resolver has unbound parameters.",
                                    alternatives: scored.slice(1, 4)
                                });
                            }
                            return runQuery(resolveRendered.sql, user, sid, lang, req, res, function (rErr, resolved) {
                                if (rErr) {
                                    return res.status(200).json({
                                        intent_type: intent,
                                        confidence: Math.max(20, confidence - 20),
                                        selected_skill_id: top.skill_id,
                                        selected_skill_code: top.skill_code,
                                        entities: mergeRouteEntities({ vendor_text: vendorText }),
                                        bind_hint_extractions: bindHintExtractions,
                                        requires_clarification: true,
                                        candidate_options: [],
                                        human_summary: "I couldn't look up that supplier name right now. Check that GOLD is reachable and the supplier exists in FOUDGENE.",
                                        requested_sql_templates: [
                                            ENGINE_VENDOR_RESOLVE_CODE + " execution failed for '" + vendorText + "': " + String(rErr)
                                        ],
                                        message: "Vendor resolver execution error."
                                    });
                                }
                                const options = resolved.map(function (r) {
                                    return {
                                        supplier_id: pick(r, "SUPPLIER_ID", "supplier_id"),
                                        supplier_name: pick(r, "SUPPLIER_NAME", "supplier_name"),
                                        score: Number(pick(r, "SCORE", "score") || 0)
                                    };
                                }).filter(function (r) { return !!r.supplier_id; });

                                // Disambiguate when the user supplied an explicit supplier code
                                // alongside a name (e.g. "lipari 06966"). If exactly one option's
                                // FOUCNUF equals the embedded digits, treat that as the resolved
                                // vendor and skip clarification.
                                const codeMatch = String(vendorText || "").match(/\b(\d{3,})\b/);
                                const embeddedCode = codeMatch ? codeMatch[1].toUpperCase() : null;
                                const codeMatches = embeddedCode
                                    ? options.filter(function (o) {
                                        return String(o.supplier_id || "").toUpperCase() === embeddedCode;
                                    })
                                    : [];

                                let resolvedVendor = null;
                                let autoPickReason = null;
                                if (codeMatches.length === 1) {
                                    resolvedVendor = codeMatches[0];
                                    autoPickReason = "exact-code";
                                } else if (options.length === 1) {
                                    resolvedVendor = options[0];
                                    autoPickReason = "single-candidate";
                                } else if (options.length > 1) {
                                    const sorted = options.slice().sort(function (a, b) { return b.score - a.score; });
                                    const top1 = sorted[0];
                                    const top2 = sorted[1];
                                    if (top1.score >= 95 && (top1.score - top2.score) >= 15) {
                                        resolvedVendor = top1;
                                        autoPickReason = "score-gap";
                                    }
                                }

                                const ambiguous = !resolvedVendor && options.length > 0;
                                const clarification = (!resolvedVendor)
                                    ? composer.buildClarificationQuestion(options, vendorText)
                                    : null;
                                return res.status(200).json({
                                    intent_type: intent,
                                    confidence: resolvedVendor ? confidence : Math.max(20, confidence - 15),
                                    selected_skill_id: top.skill_id,
                                    selected_skill_code: top.skill_code,
                                    auto_pick_reason: autoPickReason,
                                    // Merge order matters: bind-hint values are seed defaults;
                                    // hardcoded extractor + FOUDGENE resolver values override
                                    // them so the canonical supplier_id wins over any
                                    // raw "from supplier 06966" capture.
                                    entities: mergeRouteEntities({
                                        vendor_text: vendorText,
                                        supplier_id: resolvedVendor ? resolvedVendor.supplier_id : (bindHintEntities.supplier_id || null),
                                        supplier_name: resolvedVendor ? resolvedVendor.supplier_name : null
                                    }),
                                    bind_hint_extractions: bindHintExtractions,
                                    requires_clarification: !resolvedVendor,
                                    human_clarification: clarification,
                                    candidate_options: options.slice(0, 5),
                                    requested_sql_templates: resolvedVendor ? [] : [
                                        ambiguous
                                            ? "Multiple vendor matches for '" + vendorText + "' — ask the user to pick one."
                                            : "No vendor match for '" + vendorText + "' (check FOUDGENE / " + ENGINE_VENDOR_RESOLVE_CODE + ")."
                                    ],
                                    alternatives: scored.slice(1, 4),
                                    routing_diagnostics: routingDiagnostics
                                });
                            });
                        });
                    });
                });
            });
        });
    };

    module.execute = function () {
        app.post("/api/ai/engine/execute", function (req, res) {
            res.setHeader("Access-Control-Allow-Origin", "*");
            const skill_id = req.body.skill_id;
            const intent_type = req.body.intent_type || "GENERAL";
            if (!skill_id) {
                return res.status(400).json({ error: "skill_id is required" });
            }

            const user = req.header("USER") || "SYSTEM";
            const sid  = "'{" + req.header("DATABASE_SID") + "}'";
            const lang = "'{" + req.header("LANGUAGE") + "}'";
            const fr = fakeRes();
            const ctx = buildExecuteContext(req);

            executeLib(Q.TEMPLATES_BY_SKILL, [skill_id], user, sid, lang, req, fr, function (tErr, templates) {
                if (tErr) {
                    return res.status(500).json({
                        error: "AI0000064 unavailable",
                        hint: "Deploy deployment/database/SCRIPTS/ai_engine_libquery.sql on the ICR DB and restart the Node server.",
                        libquery: "AI0000064",
                        details: JSON.stringify(tErr)
                    });
                }
                const list = templates.map(t => ({
                    template_code: pick(t, "TEMPLATE_CODE", "template_code"),
                    template_label: pick(t, "TEMPLATE_LABEL", "template_label"),
                    purpose: pick(t, "PURPOSE", "purpose"),
                    sql_text: pick(t, "SQL_TEXT", "sql_text"),
                    parameters_json: pick(t, "PARAMETERS_JSON", "parameters_json")
                }));

                const supplierResolved = pickCtx(ctx, "supplier_id");
                const requested = [];
                if (!list.length) {
                    requested.push("No SQL template defined for selected skill.");
                }
                if (!requested.length) {
                    let template = null;
                    const wantCode = req.body.template_code ? String(req.body.template_code).trim() : "";
                    if (wantCode) {
                        const up = wantCode.toUpperCase();
                        template = list.find(function (t) {
                            return String(t.template_code || "").toUpperCase() === up &&
                                !/^ENGINE_/i.test(String(t.template_code || ""));
                        });
                        if (!template) {
                            const gapComposed = composer.synthesize({
                                intent_type, template_code: up,
                                rows: [], cols: [], ctx,
                                parameter_gaps: ["template_code"]
                            });
                            return res.status(200).json({
                                success: false,
                                intent_type,
                                skill_id,
                                template_code_requested: up,
                                templates_available: list.map(function (t) {
                                    return {
                                        template_code: t.template_code,
                                        template_label: t.template_label,
                                        purpose: t.purpose
                                    };
                                }),
                                human_summary: "Template " + up + " is not defined on this skill. " +
                                    "Deploy ITEM_MASTER_RETAIL templates (ITM_ARTICLE_HEADER) or pick another template.",
                                requested_sql_templates: [
                                    "Template " + up + " not found on skill_id " + skill_id +
                                        ". Available: " + list.map(function (t) { return t.template_code; }).join(", ")
                                ],
                                evidence_facts: [gapComposed.summary],
                                result_columns: [],
                                result_rows: [],
                                result_count: 0
                            });
                        }
                    }
                    if (!template) {
                        template = pickExecutionTemplate(list, intent_type, ctx, pickCtx(ctx, "question_text"));
                    }
                    if (!template || !template.sql_text) {
                        return res.status(200).json({
                            success: true,
                            intent_type,
                            skill_id,
                            supplier_id: supplierResolved,
                            templates_available: list.map(t => ({
                                template_code: t.template_code,
                                template_label: t.template_label,
                                purpose: t.purpose
                            })),
                            requested_sql_templates: [
                                "No business SQL template after excluding ENGINE_* router templates. Add a DSD_* (or non-ENGINE) template."
                            ],
                            evidence_facts: ["Skill has only ENGINE_* templates or none suitable for execution."],
                            confidence: 40
                        });
                    }
                    if (templateSqlIncomplete(template.sql_text)) {
                        return res.status(200).json({
                            success: true,
                            intent_type,
                            skill_id,
                            supplier_id: supplierResolved,
                            templates_available: list.map(t => ({
                                template_code: t.template_code,
                                template_label: t.template_label,
                                purpose: t.purpose
                            })),
                            requested_sql_templates: [
                                "Template " + template.template_code +
                                    " is still a placeholder (TODO_REPLACE / incomplete). Replace sql_text with real GOLD SQL."
                            ],
                            evidence_facts: [
                                "Skill selected and templates loaded.",
                                "Execution skipped — template marked incomplete."
                            ],
                            confidence: 42,
                            result_columns: [],
                            result_rows: [],
                            result_count: 0
                        });
                    }
                    const rendered = renderTemplateForExecution(
                        template.sql_text,
                        template.parameters_json,
                        ctx
                    );
                    if (rendered.missing.length) {
                        const gapComposed = composer.synthesize({
                            intent_type, template_code: template.template_code,
                            rows: [], cols: [], ctx,
                            parameter_gaps: rendered.missing
                        });
                        return res.status(200).json({
                            success: true,
                            intent_type,
                            skill_id,
                            supplier_id: supplierResolved,
                            templates_available: list.map(t => ({
                                template_code: t.template_code,
                                template_label: t.template_label,
                                purpose: t.purpose
                            })),
                            template_code: template.template_code,
                            executed_sql: rendered.sql,
                            bind_context: ctx,
                            parameter_gaps: rendered.missing,
                            human_summary: gapComposed.summary,
                            requested_sql_templates: rendered.missing.map(function (n) {
                                return "Missing bind :" + n +
                                    " — pass in execute body / entities / bindings, or document in parameters_json.";
                            }),
                            evidence_facts: ["Skill matched. Query needs additional context before it can run."],
                            confidence: 52,
                            result_columns: [],
                            result_rows: [],
                            result_count: 0
                        });
                    }
                    return runQuery(rendered.sql, user, sid, lang, req, res, function (qErr, rows) {
                        if (qErr) {
                            return res.status(200).json({
                                success: true,
                                intent_type,
                                skill_id,
                                supplier_id: supplierResolved,
                                templates_available: list.map(t => ({
                                    template_code: t.template_code,
                                    template_label: t.template_label,
                                    purpose: t.purpose
                                })),
                                template_code: template.template_code,
                                executed_sql: rendered.sql,
                                bind_context: ctx,
                                error_message: String(qErr),
                                requested_sql_templates: ["Execution failed for template " + template.template_code + ": " + String(qErr)],
                                evidence_facts: [
                                    "Skill selected and templates loaded.",
                                    "Execution error returned from business SQL."
                                ],
                                confidence: 50
                            });
                        }
                        const cols = rows.length ? Object.keys(rows[0]) : [];
                        const nonAnswer = intent_type === "RETRIEVAL" && retrievalRowsLookLikeNonAnswer(rows);
                        const requestedPost = [];
                        if (nonAnswer) {
                            requestedPost.push(
                                "Retrieval returned no item columns — replace or extend template " + template.template_code +
                                    " so rows include item identifiers (e.g. LU / CODART), not only supplier echo."
                            );
                        }
                        const composed = composer.synthesize({
                            intent_type,
                            template_code: template.template_code,
                            rows: rows,
                            cols: cols,
                            ctx: ctx
                        });
                        return res.status(200).json({
                            success: true,
                            intent_type,
                            skill_id,
                            supplier_id: supplierResolved,
                            templates_available: list.map(t => ({
                                template_code: t.template_code,
                                template_label: t.template_label,
                                purpose: t.purpose
                            })),
                            template_code: template.template_code,
                            executed_sql: rendered.sql,
                            bind_context: ctx,
                            requested_sql_templates: requestedPost,
                            human_summary: composed.summary,
                            evidence_facts: composed.insights,
                            confidence: nonAnswer ? 48 : 86,
                            result_columns: cols,
                            result_rows: rows,
                            result_count: rows.length,
                            answer_quality: nonAnswer ? "PARTIAL_NON_ITEM_ROWS" : "OK"
                        });
                    });
                }

                return res.status(200).json({
                    success: true,
                    intent_type,
                    skill_id,
                    supplier_id: supplierResolved,
                    templates_available: list,
                    requested_sql_templates: requested,
                    evidence_facts: [
                        "Skill selected and templates loaded.",
                        requested.length ? "Designer input needed before final SQL execution." : "Engine ready for SQL execution stage."
                    ],
                    confidence: requested.length ? 55 : 82
                });
            });
        });
    };


    /**
     * Phase 6 — Phrasing Playground.
     *
     * POST /api/ai/engine/diagnose  { retailer_id, question_text }
     *
     * Returns the same scoring the live router does, but with a per-factor
     * breakdown for every active skill, the lexical pipeline output, the
     * extracted entities, and (for the top skill only) per-template bind
     * feasibility. Side-effect free: never calls ENGINE_VENDOR_RESOLVE,
     * never executes a business template — pure scoring.
     */
    module.diagnose = function () {
        app.post("/api/ai/engine/diagnose", function (req, res) {
            res.setHeader("Access-Control-Allow-Origin", "*");
            const retailer_id = req.body.retailer_id;
            const question_text = req.body.question_text;
            if (!retailer_id || !question_text) {
                return res.status(400).json({ error: "retailer_id and question_text are required" });
            }

            const user = req.header("USER") || "SYSTEM";
            const sid  = "'{" + req.header("DATABASE_SID") + "}'";
            const lang = "'{" + req.header("LANGUAGE") + "}'";
            const fr = fakeRes();

            executeLib(Q.SKILLS_ACTIVE, ["-1"], user, sid, lang, req, fr, function (sErr, skills) {
                if (sErr) {
                    return res.status(500).json({
                        error: "AI0000061 unavailable",
                        hint: "Deploy deployment/database/SCRIPTS/ai_engine_libquery.sql on the ICR DB and restart the Node server.",
                        libquery: "AI0000061",
                        details: JSON.stringify(sErr)
                    });
                }
                executeLib(Q.VOCAB_BY_SKILL, ["-1"], user, sid, lang, req, fr, function (vErr, vocabRows) {
                    if (vErr) {
                        return res.status(500).json({
                            error: "AI0000062 unavailable",
                            hint: "Deploy deployment/database/SCRIPTS/ai_engine_libquery.sql on the ICR DB and restart the Node server.",
                            libquery: "AI0000062",
                            details: JSON.stringify(vErr)
                        });
                    }
                    executeLib(Q.PLAYBOOK_BY_SKILL, ["-1"], user, sid, lang, req, fr, function (pErr, playbookRowsRaw) {
                        if (pErr) {
                            console.warn("ai.engine.diagnose: AI0000063 unavailable — continuing with empty playbook.",
                                JSON.stringify(pErr).slice(0, 400));
                        }
                        const playbookRows = pErr ? [] : playbookRowsRaw;

                        const tokens         = tokenize(question_text);
                        const intent         = detectIntent(question_text);
                        const vendorText     = extractVendorText(question_text);
                        const siteIdFromText = extractSiteId(question_text);
                        const orderRefFromText = extractOrderRef(question_text);
                        const eanFromText    = orderRefFromText ? "" : extractEan(question_text);
                        const luIdFromText   = extractLuId(question_text);
                        const questionPhrases = lex.phraseSet(question_text, 3);

                        // Phase 8 — bind-hint extraction (audited for the Playground).
                        const hardcodedExtracted = {
                            lu_id:      luIdFromText || null,
                            site_id:    siteIdFromText || null,
                            vendor_text: vendorText || null,
                            order_ref:  orderRefFromText || null,
                            ean:        eanFromText || null
                        };
                        const bindHintResult = extractEntitiesFromBindHints(
                            question_text,
                            vocabRows,
                            hardcodedExtracted
                        );
                        const bindHintEntities    = bindHintResult.entities || {};
                        const bindHintExtractions = bindHintResult.matches  || [];

                        // Score each skill, recording every factor that
                        // contributed to the total. Mirrors module.route's
                        // scorer but adds a `breakdown` array per skill.
                        const scored = skills.map(function (s) {
                            const sidSkill = pick(s, "SKILL_ID", "skill_id");
                            const code     = pick(s, "SKILL_CODE", "skill_code");
                            const name     = pick(s, "SKILL_NAME", "skill_name") || "";
                            const domain   = String(pick(s, "DOMAIN", "domain") || "").toLowerCase();

                            const breakdown = [];
                            const vocab_matches = [];
                            let score = 10;
                            breakdown.push({ factor: "base", delta: 10 });

                            if (intent === "RETRIEVAL") {
                                score += 8;
                                breakdown.push({ factor: "intent=RETRIEVAL", delta: 8 });
                            }
                            if (vendorText && /dsd|supplier|vendor/.test(domain + " " + String(code || "").toLowerCase())) {
                                score += 12;
                                breakdown.push({ factor: "vendor_text + supplier-ish domain", delta: 12 });
                            }
                            if (tokens.some(function (t) { return domain.indexOf(t) >= 0; })) {
                                score += 6;
                                breakdown.push({ factor: "token in domain", delta: 6 });
                            }

                            let vocabHits = 0;
                            // Phase 11 dampener — mirrors module.route. See note there.
                            const hasVendorCtxD = !!(vendorText || bindHintEntities.supplier_id);
                            vocabRows
                                .filter(function (v) { return pick(v, "SKILL_ID", "skill_id") === sidSkill; })
                                .forEach(function (v) {
                                    const term = String(pick(v, "TERM", "term") || "");
                                    if (!term) { return; }
                                    const termSet = lex.phraseSet(term, 3);
                                    if (!termSet.size) { return; }
                                    const overlap = lex.overlap(termSet, questionPhrases);
                                    if (!overlap) { return; }
                                    const termType = String(pick(v, "TERM_TYPE", "term_type") || "SYNONYM").toUpperCase();
                                    if (termType === "INTENT_PHRASE"
                                        && !intentPhraseDiscriminatorsSatisfied(term, question_text)) {
                                        return;
                                    }
                                    const boost    = Number(pick(v, "CONFIDENCE_BOOST", "confidence_boost") || 1);
                                    let multiplier = 4;
                                    if (termType === "INTENT_PHRASE") { multiplier = 9; }
                                    else if (termType === "BIND_HINT") { multiplier = 2; }
                                    else if (termType === "JARGON" || termType === "BRAND_TERM") { multiplier = 5; }
                                    let dampened = false;
                                    if (termType === "INTENT_PHRASE"
                                        && !hasVendorCtxD
                                        && needsVendorContext(term)) {
                                        multiplier = 2;
                                        dampened = true;
                                    }
                                    const localBoost = boost * multiplier * Math.min(overlap, termSet.size);
                                    score += localBoost;
                                    vocabHits += 1;
                                    breakdown.push({
                                        factor: "vocab " + termType + " '" + term + "' (overlap=" + overlap +
                                                ", boost=" + boost + ", x" + multiplier +
                                                (dampened ? ", dampened: needs vendor" : "") + ")",
                                        delta: Math.round(localBoost * 10) / 10
                                    });
                                    vocab_matches.push({
                                        term: term,
                                        term_type: termType,
                                        overlap: overlap,
                                        confidence_boost: boost,
                                        contribution: Math.round(localBoost * 10) / 10,
                                        dampened: dampened ? "needs_vendor_context" : null
                                    });
                                });

                            playbookRows
                                .filter(function (p) { return pick(p, "SKILL_ID", "skill_id") === sidSkill; })
                                .forEach(function (p) {
                                    const ct = String(pick(p, "COMPLAINT_TYPE", "complaint_type") || "").toLowerCase();
                                    if (ct && String(question_text).toLowerCase().indexOf(ct.replace(/_/g, " ")) >= 0) {
                                        score += 7;
                                        breakdown.push({ factor: "playbook complaint '" + ct + "'", delta: 7 });
                                    }
                                });

                            const convoSkill = /conversation/.test(domain + " " + String(code || "").toLowerCase());
                            if (convoSkill && vocabHits === 0) {
                                score -= 18;
                                breakdown.push({ factor: "conversational skill, no vocab match", delta: -18 });
                            }
                            if (!convoSkill && vocabHits > 0) {
                                const bump = Math.min(8, vocabHits * 2);
                                score += bump;
                                breakdown.push({ factor: "vocab hits multiplier", delta: bump });
                            }

                            // Issue 2 (mirrors module.route scorer)
                            const luId = luIdFromText || bindHintEntities.lu_id;
                            if (luId && /ITEM_MASTER|ITEM_RETAIL/i.test(String(code || ""))) {
                                score += 15;
                                breakdown.push({ factor: "lu_id entity present + item-domain skill", delta: 15 });
                            }
                            if (siteIdFromText && !vendorText && /ITEM_MASTER|ITEM_RETAIL/i.test(String(code || ""))) {
                                score += 8;
                                breakdown.push({ factor: "site_id present, no vendor, item-domain skill", delta: 8 });
                            }

                            return {
                                skill_id: sidSkill,
                                skill_code: code,
                                skill_name: name,
                                domain: domain,
                                score: Math.round(score),
                                vocab_hits: vocabHits,
                                vocab_matches: vocab_matches,
                                score_breakdown: breakdown
                            };
                        }).sort(function (a, b) { return b.score - a.score; });

                        // For the top skill (with templates), describe each
                        // template's bind feasibility against the resolved
                        // entity context. Helps designers spot "we'd pick
                        // this skill but no template can run yet".
                        // Phase 8 — bind-hint extracted entities feed feasibility
                        // alongside hardcoded extractors so designers see how their
                        // BIND_HINT rows close template gaps.
                        const ctxForFeasibility = Object.assign(
                            {
                                retailer_id: retailer_id,
                                vendor_text: vendorText,
                                site_id:     siteIdFromText
                            },
                            bindHintEntities
                        );

                        const finishWithTemplates = function (top, templates) {
                            const tplDiag = (templates || []).map(function (t) {
                                const code = String(pick(t, "TEMPLATE_CODE", "template_code") || "");
                                const required = listRequiredBinds(t);
                                const missing  = required.filter(function (n) {
                                    const v = pickCtx(ctxForFeasibility, n);
                                    return v == null || v === "";
                                });
                                return {
                                    template_code: code,
                                    template_label: pick(t, "TEMPLATE_LABEL", "template_label") || "",
                                    required_binds: required,
                                    missing_binds: missing,
                                    bind_status: missing.length === 0
                                        ? (/^ENGINE_/i.test(code) ? "FEASIBLE_RESOLVER" : "FEASIBLE")
                                        : "BIND_GAP"
                                };
                            });

                            return res.status(200).json({
                                question_text: question_text,
                                normalized_text: lex.normalize(question_text),
                                tokens: tokens,
                                intent_type: intent,
                                extracted_entities: Object.assign(
                                    {
                                        vendor_text: vendorText || null,
                                        site_id:     siteIdFromText || null
                                    },
                                    bindHintEntities
                                ),
                                bind_hint_extractions: bindHintExtractions,
                                top_skill_id:   top ? top.skill_id   : null,
                                top_skill_code: top ? top.skill_code : null,
                                top_score:      top ? top.score      : null,
                                low_confidence: top ? top.score < UNRESOLVED_SCORE_THRESHOLD : true,
                                skills: scored,
                                top_templates: tplDiag
                            });
                        };

                        if (!scored.length) {
                            return finishWithTemplates(null, []);
                        }
                        executeLib(Q.TEMPLATES_BY_SKILL, [scored[0].skill_id], user, sid, lang, req, fr, function (tErr, tplRows) {
                            if (tErr) {
                                return finishWithTemplates(scored[0], []);
                            }
                            return finishWithTemplates(scored[0], firstArray(tplRows));
                        });
                    });
                });
            });
        });
    };

    /**
     * Evaluate a single diagnostic step stop condition against the first row
     * returned by the step's SQL template.
     *
     * Operators: '=' (exact string), '!=' (not equal), '>' (numeric gt),
     *            '<' (numeric lt), '>=' (numeric gte), '<=' (numeric lte),
     *            'CONTAINS' (substring, case-insensitive).
     *
     * Row field lookup is case-insensitive so Oracle uppercase column names
     * work regardless of how the template aliased them.
     */
    function evaluateStopCondition(rows, field, operator, value) {
        if (!rows || !rows.length) { return false; }
        const row = rows[0];
        // Case-insensitive field lookup
        let rawVal = null;
        const fieldUp = String(field || "").toUpperCase();
        for (const k of Object.keys(row)) {
            if (String(k).toUpperCase() === fieldUp) { rawVal = row[k]; break; }
        }
        const op = String(operator || "=").trim().toUpperCase();
        // IS NULL / IS NOT NULL must be evaluated before the null guard below.
        if (op === "IS NULL")     { return rawVal === null || rawVal === undefined || String(rawVal).trim() === ""; }
        if (op === "IS NOT NULL") { return rawVal !== null && rawVal !== undefined && String(rawVal).trim() !== ""; }
        if (rawVal === null || rawVal === undefined) { return false; }
        const expected = String(value || "").trim();
        const actual = String(rawVal).trim();
        if (op === "="  || op === "EQ") { return actual === expected; }
        if (op === "!=" || op === "NEQ" || op === "<>") { return actual !== expected; }
        if (op === "CONTAINS") { return actual.toLowerCase().indexOf(expected.toLowerCase()) >= 0; }
        const numActual = parseFloat(actual);
        const numExpected = parseFloat(expected);
        if (isNaN(numActual) || isNaN(numExpected)) { return false; }
        if (op === ">" ) { return numActual >  numExpected; }
        if (op === "<" ) { return numActual <  numExpected; }
        if (op === ">=" || op === "GTE") { return numActual >= numExpected; }
        if (op === "<=" || op === "LTE") { return numActual <= numExpected; }
        return false;
    }

    /**
     * POST /api/ai/engine/diagnose-chain
     *
     * Rule-based diagnostic chain execution. Pure expert-system pattern:
     *   1. Load AI_DIAGNOSTIC_STEP for the chosen skill_id (AI0000090)
     *   2. Load AI_SKILL_SQL_TEMPLATE for the skill (AI0000064)
     *   3. Group steps by STEP_ORDER; execute each template once per group
     *   4. Evaluate stop conditions against returned rows
     *   5. First match → load AI_DIAGNOSTIC_CONCLUSION (AI0000091) → synthesize
     *
     * Request body:
     *   { skill_id, retailer_id, question_text, entities, bindings }
     * Response:
     *   { success, conclusion_key, severity, human_summary, evidence_facts,
     *     follow_up_hint, diagnostic_steps[], no_conclusion_reached }
     */
    module.diagnoseChain = function () {
        app.post("/api/ai/engine/diagnose-chain", function (req, res) {
            res.setHeader("Access-Control-Allow-Origin", "*");
            const { skill_id, retailer_id, question_text } = req.body;
            if (!skill_id || !retailer_id) {
                return res.status(400).json({ error: "skill_id and retailer_id are required" });
            }

            const user = req.header("USER") || "SYSTEM";
            const sid  = "'{" + req.header("DATABASE_SID") + "}'";
            const lang = "'{" + req.header("LANGUAGE") + "}'";
            const fr   = fakeRes();
            const ctx  = buildExecuteContext(req);

            // Step 1 — load diagnostic steps for this skill
            executeLib(Q.DIAG_STEPS, [skill_id], user, sid, lang, req, fr, function (stepsErr, stepRows) {
                if (stepsErr || !stepRows || !stepRows.length) {
                    return res.status(200).json({
                        success: false,
                        error: "No diagnostic steps defined for this skill.",
                        hint: "Deploy deployment/database/SCRIPTS/37_diagnostic_chain_tables.sql and the matching seed script."
                    });
                }

                // Step 2 — load SQL templates for the skill
                executeLib(Q.TEMPLATES_BY_SKILL, [skill_id], user, sid, lang, req, fr, function (tplErr, tplRows) {
                    if (tplErr || !tplRows || !tplRows.length) {
                        return res.status(200).json({
                            success: false,
                            error: "No SQL templates found for this skill.",
                            hint: "Ensure the skill has at least one AI_SKILL_SQL_TEMPLATE row."
                        });
                    }

                    // Build template lookup map { code → template }
                    const templateMap = {};
                    firstArray(tplRows).forEach(function (t) {
                        const code = pick(t, "TEMPLATE_CODE", "template_code");
                        if (code) { templateMap[String(code).toUpperCase()] = t; }
                    });

                    // Group steps by STEP_ORDER — same order may have multiple stop conditions
                    // for the same template. We run the template once and check all conditions.
                    const orderGroups = {};
                    firstArray(stepRows).forEach(function (s) {
                        const order = pick(s, "STEP_ORDER", "step_order");
                        if (order == null) { return; }
                        if (!orderGroups[order]) { orderGroups[order] = []; }
                        orderGroups[order].push(s);
                    });
                    const sortedOrders = Object.keys(orderGroups)
                        .map(Number)
                        .sort(function (a, b) { return a - b; });

                    const diagnosticSteps = [];   // audit trail per step
                    const allIssues = [];          // {conclusionKey, stepCtx, isHard, stepLabel}
                    let stepIdx = 0;
                    let chainAborted = false;

                    // Called once all steps are done (or a HARD stop fires).
                    // Loads every collected issue's conclusion in series, then synthesizes
                    // a multi-issue response via composer.synthesizeMultipleDiagnostics.
                    function finalizeDiagnosis() {
                        if (!allIssues.length) {
                            return res.status(200).json({
                                success: true,
                                no_conclusion_reached: true,
                                issues_found: 0,
                                human_summary: "The diagnostic chain completed all checks but found no blocking issue. The item appears to be correctly configured for ordering.",
                                evidence_facts: diagnosticSteps.map(function (ds) {
                                    return (ds.step_label || ds.template_code) + ": passed.";
                                }),
                                follow_up_hint: "If ordering is still blocked, check the order manually in GOLD or contact the supply chain team.",
                                diagnostic_steps: diagnosticSteps,
                                skill_id: skill_id
                            });
                        }

                        // Load each conclusion template in sequence, then synthesize
                        const conclusionPairs = [];
                        let cIdx = 0;

                        function loadNextConclusion() {
                            if (cIdx >= allIssues.length) {
                                // All conclusions loaded — synthesize multi-issue response
                                const synthesized = composer.synthesizeMultipleDiagnostics(
                                    diagnosticSteps,
                                    conclusionPairs,
                                    ctx
                                );
                                const hasHardStop = allIssues.some(function (i) { return i.isHard; });
                                return res.status(200).json({
                                    success: true,
                                    skill_id: skill_id,
                                    issues_found: allIssues.length,
                                    has_hard_stop: hasHardStop,
                                    conclusions: conclusionPairs.map(function (cp) {
                                        return {
                                            conclusion_key: cp.conclusionKey,
                                            severity: cp.conclusion
                                                ? String(cp.conclusion.SEVERITY || cp.conclusion.severity || "INFO")
                                                : "INFO",
                                            is_hard_stop: cp.isHard,
                                            step_label: cp.stepLabel
                                        };
                                    }),
                                    // Scalar fields for backward compat (single-issue path)
                                    conclusion_key: allIssues.length === 1 ? allIssues[0].conclusionKey : null,
                                    severity: synthesized.overall_severity || "INFO",
                                    human_summary: synthesized.summary,
                                    evidence_facts: synthesized.insights,
                                    follow_up_hint: synthesized.follow_up_hint,
                                    diagnostic_steps: diagnosticSteps,
                                    bind_context: ctx
                                });
                            }

                            const issue = allIssues[cIdx];
                            cIdx++;
                            executeLib(Q.DIAG_CONCLUSION, [issue.conclusionKey, retailer_id], user, sid, lang, req, fr, function (cErr, conclusionRows) {
                                let conclusion = null;
                                if (!cErr && conclusionRows && conclusionRows.length) {
                                    conclusion = conclusionRows[0];
                                }
                                conclusionPairs.push({
                                    conclusionKey: issue.conclusionKey,
                                    stepCtx: issue.stepCtx,
                                    isHard: issue.isHard,
                                    stepLabel: issue.stepLabel,
                                    conclusion: conclusion
                                });
                                loadNextConclusion();
                            });
                        }

                        loadNextConclusion();
                    }

                    function runNextOrder() {
                        if (stepIdx >= sortedOrders.length || chainAborted) {
                            // Distinguish "all steps skipped (missing params)" from normal completion
                            const allSkipped = diagnosticSteps.length > 0 &&
                                diagnosticSteps.every(function (ds) { return ds.skipped; });
                            if (allSkipped) {
                                const missingSet = {};
                                diagnosticSteps.forEach(function (ds) {
                                    if (ds.reason) {
                                        ds.reason.replace("Missing parameters: ", "").split(", ").forEach(function (p) {
                                            if (p.trim()) { missingSet[p.trim()] = true; }
                                        });
                                    }
                                });
                                const missingParams = Object.keys(missingSet);
                                return res.status(200).json({
                                    success: false,
                                    no_conclusion_reached: true,
                                    missing_params: missingParams,
                                    human_summary: "The diagnostic chain could not run — required context is missing: " +
                                        (missingParams.join(", ") || "unknown parameters") +
                                        ". Include the item code, store number, or other required detail in your question.",
                                    evidence_facts: [],
                                    follow_up_hint: "Provide: " + (missingParams.join(", ") || "the required context"),
                                    diagnostic_steps: diagnosticSteps,
                                    skill_id: skill_id
                                });
                            }

                            // All steps ran (or chain aborted by HARD stop) — collect results
                            return finalizeDiagnosis();
                        }

                        const order = sortedOrders[stepIdx];
                        stepIdx++;
                        const conditions = orderGroups[order];

                        // All conditions in this group use the same template_code (by design).
                        const templateCode = String(pick(conditions[0], "TEMPLATE_CODE", "template_code") || "").toUpperCase();
                        const stepLabel    = String(pick(conditions[0], "STEP_LABEL", "step_label") || "Step " + order);
                        const tpl = templateMap[templateCode];

                        if (!tpl) {
                            diagnosticSteps.push({
                                step_order: order,
                                step_label: stepLabel,
                                template_code: templateCode,
                                error: "Template not found in AI_SKILL_SQL_TEMPLATE."
                            });
                            return runNextOrder();
                        }

                        const sqlText = pick(tpl, "SQL_TEXT", "sql_text") || "";
                        const paramsJson = pick(tpl, "PARAMETERS_JSON", "parameters_json");
                        const rendered = applyParameterBindings(sqlText, paramsJson, ctx);

                        if (rendered.missing && rendered.missing.length) {
                            diagnosticSteps.push({
                                step_order: order,
                                step_label: stepLabel,
                                template_code: templateCode,
                                skipped: true,
                                reason: "Missing parameters: " + rendered.missing.join(", ")
                            });
                            return runNextOrder();
                        }

                        runQuery(rendered.sql, user, sid, lang, req, fakeRes(), function (qErr, rows) {
                            const auditEntry = {
                                step_order: order,
                                step_label: stepLabel,
                                template_code: templateCode,
                                rows: rows,
                                conditions_evaluated: conditions.length,
                                stopped_here: false,
                                issue_found: false,
                                matched_conclusion: null,
                                issue_type: null
                            };

                            if (qErr) {
                                auditEntry.error = String(qErr.message || qErr);
                                diagnosticSteps.push(auditEntry);
                                return runNextOrder();
                            }

                            // Accumulate all step result fields into ctx for token substitution
                            const stepCtx = Object.assign({}, ctx);
                            if (rows && rows.length) {
                                Object.keys(rows[0]).forEach(function (col) {
                                    stepCtx[col.toLowerCase()] = rows[0][col];
                                    stepCtx[col] = rows[0][col];
                                });
                            }

                            // Check each condition in this group
                            let matched = null;
                            for (let i = 0; i < conditions.length; i++) {
                                const cond = conditions[i];
                                const stopField    = pick(cond, "STOP_FIELD",    "stop_field");
                                const stopOperator = pick(cond, "STOP_OPERATOR", "stop_operator");
                                const stopValue    = pick(cond, "STOP_VALUE",    "stop_value");
                                const conclusionKey = pick(cond, "CONCLUSION_KEY", "conclusion_key");
                                // STEP_TYPE: HARD = abort chain on match; SOFT = record issue, continue
                                const stepType = String(pick(cond, "STEP_TYPE", "step_type") || "HARD").toUpperCase();
                                if (evaluateStopCondition(rows, stopField, stopOperator, stopValue)) {
                                    matched = { conclusionKey, stepCtx, stepType };
                                    break;
                                }
                            }

                            if (!matched) {
                                diagnosticSteps.push(auditEntry);
                                return runNextOrder();
                            }

                            // Condition matched — record issue
                            const isHard = matched.stepType === "HARD";
                            auditEntry.issue_found = true;
                            auditEntry.issue_type = matched.stepType;
                            auditEntry.matched_conclusion = matched.conclusionKey;
                            auditEntry.stopped_here = isHard;
                            diagnosticSteps.push(auditEntry);

                            allIssues.push({
                                conclusionKey: matched.conclusionKey,
                                stepCtx: matched.stepCtx,
                                isHard: isHard,
                                stepLabel: stepLabel
                            });

                            if (isHard) {
                                // HARD stop — abort remaining steps and finalize
                                chainAborted = true;
                                return finalizeDiagnosis();
                            }
                            // SOFT issue — record and continue to next step
                            return runNextOrder();
                        });
                    }

                    runNextOrder();
                });
            });
        });
    };

    module.route();
    module.execute();
    module.diagnose();
    module.diagnoseChain();
    return module;
};
