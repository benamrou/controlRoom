"use strict";

/**
 * AI Response Composer
 *
 * Converts raw SQL execution results into natural operational language.
 * All conclusions are grounded in actual row data — no fabrication.
 *
 * Usage:
 *   const composer = require('./ai.composer');
 *   const human = composer.synthesize({ intent_type, template_code, rows, cols, ctx, parameter_gaps });
 *   // human.summary  → string for the chat bubble
 *   // human.insights → string[] for evidence panel (max 3, operational tone)
 *   // human.follow_up_hint → optional clarification question
 */

module.exports = (function () {

    // ── Helpers ────────────────────────────────────────────────────────────────

    function supplierPhrase(ctx) {
        if (ctx.supplier_name) { return ctx.supplier_name + (ctx.supplier_id ? " (" + ctx.supplier_id + ")" : ""); }
        if (ctx.supplier_id)   { return "supplier " + ctx.supplier_id; }
        if (ctx.vendor_text)   { return '"' + ctx.vendor_text + '"'; }
        return "the selected supplier";
    }

    function datePhrase(ctx) {
        if (ctx.date_from && ctx.date_to && ctx.date_from !== ctx.date_to) {
            return "between " + ctx.date_from + " and " + ctx.date_to;
        }
        if (ctx.as_of_date) { return "as of " + ctx.as_of_date; }
        return "for the period in scope";
    }

    function sitePhrase(ctx) {
        return ctx.site_id ? "store " + ctx.site_id : "the selected store";
    }

    function items(n)   { return n === 1 ? "1 item"  : n + " items"; }
    function rowStr(n)  { return n === 1 ? "1 row"   : n + " rows"; }
    function orders(n)  { return n === 1 ? "1 order" : n + " orders"; }

    function colsUpper(row) {
        return Object.keys(row || {}).map(function (k) { return k.toUpperCase(); });
    }

    function hasAny(cols, patterns) {
        return cols.some(function (c) {
            return patterns.some(function (p) { return c.includes(p); });
        });
    }

    function firstText(row, keys) {
        for (var i = 0; i < keys.length; i++) {
            var v = row[keys[i]] || row[keys[i].toLowerCase()];
            if (v != null && String(v).trim()) { return String(v).trim(); }
        }
        return null;
    }

    // ── Anomaly detection ──────────────────────────────────────────────────────

    /**
     * Detect when a result set was likely capped by ROWNUM <= N.
     * We flag it when count === 200 or count === 500 (common caps in the SQL pack).
     */
    function detectRowCap(count) {
        if (count === 200 || count === 500) {
            return "Results may be limited to " + count + " rows — the actual count could be higher. Narrow the date range or supplier filter for a complete picture.";
        }
        return null;
    }

    /**
     * Detect status distribution anomalies across a STATUS or ETAT column.
     */
    function analyzeStatusColumn(rows, colName) {
        var counts = {};
        rows.forEach(function (r) {
            var v = String(r[colName] || r[colName.toLowerCase()] || "UNKNOWN");
            counts[v] = (counts[v] || 0) + 1;
        });
        var entries = Object.keys(counts).map(function (k) { return { status: k, n: counts[k] }; });
        entries.sort(function (a, b) { return b.n - a.n; });
        return entries;
    }

    // ── Template-family detectors ──────────────────────────────────────────────

    function isBuyableItems(code)   { return /BUYABLE|ITEMS_VENDOR|VENDOR_BUY/i.test(code); }
    function isMovements(code)      { return /MOVEMENT|STOMVT|RECEIPT|MVT|RECEIVING_ACTIVITY/i.test(code); }
    function isPurchaseOrders(code) { return /PO_OPEN|CDEENTCDE|ORDER_LINE|PO_LINE/i.test(code); }
    // ITM_ARTICLE_HEADER / ITM_FULL_ATTRIBUTES are V_GOLD_ITEM cards, not ARTSITE
    // status snapshots. Match them BEFORE the broader isArticleStatus detector
    // (which would otherwise grab them on the bare /ARTICLE/ token).
    function isItemCard(code)       { return /^ITM_(ARTICLE_HEADER|FULL_ATTRIBUTES)$/i.test(String(code)); }
    function isOrderRefLookup(code) { return /^ITM_ORDER_REF_LOOKUP$/i.test(String(code)); }
    function isArticleStatus(code)  { return !isItemCard(code) && /ARTICLE|ARTSITE|STATUS|ETAT|ARTRAC/i.test(code); }
    function isStockNegative(code)  { return /NEGATIVE|STOCK_CURRENT|STOCK_LAYER|STOCK_REPLEN/i.test(code); }
    function isVendorLookup(code)   { return /VENDOR_CODE|VENDOR_LOOKUP|FOUDGENE/i.test(code); }
    function isConversational(code) { return /SMALLTALK|CONV_|CONVERSATIONAL/i.test(code); }
    function isDsdDiag(code)        { return /DSD_PO|DSD_SITE|DSD_ARTICLE|DSD_TEMP/i.test(code); }

    // ── Per-template response builders ─────────────────────────────────────────

    function buildBuyableItemsResponse(rowCount, ctx) {
        var sp = supplierPhrase(ctx);
        var dp = datePhrase(ctx);
        if (rowCount === 0) {
            return "No buyable items found for " + sp + " " + dp + ". " +
                   "This could mean the supplier is not active in GOLD for that date, " +
                   "the supplier code needs verifying, or the as-of date falls outside the item range.";
        }
        var cap = detectRowCap(rowCount);
        var summary = "I found " + items(rowCount) + " in GOLD currently linked to " + sp + " " + dp + ". " +
                      "All matching rows are in the table — scroll to review the full list.";
        if (cap) { summary += " Note: " + cap; }
        return summary;
    }

    function buildMovementsResponse(rowCount, rows, ctx) {
        var sp = supplierPhrase(ctx);
        var dp = datePhrase(ctx);
        if (rowCount === 0) {
            return "No stock movements found for " + sp + " " + dp + ". " +
                   "Either no deliveries were processed during that period, or the date range needs widening.";
        }
        var cols = colsUpper(rows[0]);
        var hasType = hasAny(cols, ["TYPMVT", "TYPMOUVEMENT", "MOVEMENT_TYPE"]);
        var typeMap = {};
        if (hasType) {
            rows.forEach(function (r) {
                var t = String(r.TYPMVT || r.typmvt || r.MOVEMENT_TYPE || "?");
                typeMap[t] = (typeMap[t] || 0) + 1;
            });
        }
        var typeDetail = "";
        if (Object.keys(typeMap).length > 1) {
            typeDetail = " Movement breakdown: " +
                Object.keys(typeMap).map(function (t) { return t + " ×" + typeMap[t]; }).join(", ") + ".";
        }
        var cap = detectRowCap(rowCount);
        return "I found " + rowStr(rowCount) + " of stock movement activity for " + sp + " " + dp + "." +
               typeDetail +
               (cap ? " " + cap : "");
    }

    function buildPurchaseOrdersResponse(rowCount, rows, ctx) {
        var sp = supplierPhrase(ctx);
        if (rowCount === 0) {
            return "No open purchase orders found for " + sp + ". " +
                   "Either all orders were received and closed, or this supplier has no active orders in the system.";
        }
        var cols = colsUpper(rows[0]);
        var hasStatus = hasAny(cols, ["DCDETAT", "STATUT", "STATUS", "ETAT"]);
        var statusDetail = "";
        if (hasStatus) {
            var col = cols.find(function (c) { return /DCDETAT|STATUT|STATUS|ETAT/.test(c); });
            if (col) {
                var dist = analyzeStatusColumn(rows, col);
                if (dist.length > 1) {
                    statusDetail = " Status breakdown: " + dist.map(function (d) { return "status " + d.status + " (" + d.n + ")"; }).join(", ") + ".";
                }
            }
        }
        return "I found " + orders(rowCount) + " open for " + sp + "." + statusDetail;
    }

    function isFlagOn(v) {
        if (v == null) { return false; }
        var s = String(v).trim().toUpperCase();
        return s === "Y" || s === "YES" || s === "1" || s === "TRUE";
    }

    /**
     * Build the natural-language line for ITM_ARTICLE_HEADER and ITM_FULL_ATTRIBUTES.
     * Both templates return the V_GOLD_ITEM card; ITM_FULL_ATTRIBUTES adds optional
     * enrichments gated by include_ean / include_retail / include_history flags.
     *
     * The composer wants to read like the assistant is incrementally building one
     * artifact: "Item 100100 — Bob's 24oz BBQ. Enriched with retail at store 10."
     * — not a fresh statistic each time.
     */
    function buildItemCardResponse(template_code, rowCount, rows, ctx) {
        var luFromCtx = ctx.lu_id || ctx.LU_ID || null;
        var luFromRow = rowCount && rows && rows[0]
            ? (rows[0]["Item code"] || rows[0]["item_code"] || rows[0].ITEM_CODE)
            : null;
        var lu = luFromCtx || luFromRow || "the item";
        var descFromRow = rowCount && rows && rows[0]
            ? (rows[0]["Item desc."] || rows[0]["item_desc."] || rows[0]["Item desc"])
            : null;
        var label = descFromRow ? (lu + " — " + String(descFromRow).trim()) : ("item " + lu);

        if (rowCount === 0) {
            return "No active sale variant found in GOLD for item " + lu + ". " +
                   "Verify the LU exists in ARTRAC and has at least one ARTUV row with ARVETAT = 1.";
        }

        var rowsPart = rowCount === 1
            ? "Showing the active sale variant for " + label + "."
            : "Showing " + rowCount + " active sale variants for " + label + ".";

        if (!/^ITM_FULL_ATTRIBUTES$/i.test(String(template_code))) {
            return rowsPart + " The V_GOLD_ITEM card is in the table below — supplier, contract, cost, barcode, pack, flow. Ask to add reference to order, retail, or EAN codes to grow the table.";
        }

        // ITM_FULL_ATTRIBUTES — call out the enrichments that are turned on
        var added = [];
        if (isFlagOn(ctx.include_retail)) {
            var sp = ctx.site_id ? ("retail at store " + ctx.site_id) : "retail (no store provided — values will be blank)";
            added.push(sp);
        }
        if (isFlagOn(ctx.include_ean))         { added.push("all active EAN codes"); }
        if (isFlagOn(ctx.include_history))     { added.push("90-day price-change count"); }
        if (isFlagOn(ctx.include_order_ref))   { added.push("order reference (Ord./Rec. and Ref. to order)"); }

        if (!added.length) {
            return rowsPart + " No enrichments turned on yet — ask for order reference, retail, EAN, or price history to add columns.";
        }
        var enrichSentence = "Enriched with " + added.join(", ") + ".";
        return rowsPart + " " + enrichSentence;
    }

    function buildArticleStatusResponse(rowCount, rows, ctx) {
        var sp = sitePhrase(ctx);
        if (rowCount === 0) {
            return "No article status found for " + sp + " with the given filters. " +
                   "Verify the article LU and site code in GOLD.";
        }
        return "Article status retrieved for " + sp + " — " + rowStr(rowCount) + " returned. Review the table for current ETAT values.";
    }

    function buildVendorLookupResponse(rowCount, rows, ctx) {
        if (rowCount === 0) {
            return "I couldn't find a vendor code matching \"" + (ctx.vendor_text || ctx.supplier_id || "that name") + "\" in GOLD. " +
                   "Try an exact match or check the vendor name in FOUDGENE.";
        }
        var first = rows[0];
        var code = first.FOUCNUF || first.foucnuf || first.SUPPLIER_ID || "";
        var name = first.FOULIBL || first.foulibl || first.SUPPLIER_NAME || "";
        if (rowCount === 1) {
            return "Found the vendor: " + (name || code) + (code ? " — code " + code : "") + ".";
        }
        return "I found " + rowCount + " vendor entries matching that search. The closest match is " +
               (name || code) + (code ? " (" + code + ")" : "") + ". Review the full list below.";
    }

    function buildConversationalResponse(rows) {
        if (!rows.length) { return null; }
        var text = firstText(rows[0], ["ANSWER_TEXT", "answer_text", "ANSWER", "answer"]);
        return text || null;
    }

    function buildDsdDiagResponse(rowCount, rows, ctx) {
        var sp = supplierPhrase(ctx);
        if (rowCount === 0) {
            return "No issues found for " + sp + " with the current filters. " +
                   "The DSD site and article status look clean for this query.";
        }
        return "I found " + rowStr(rowCount) + " for the DSD diagnostic on " + sp + ". " +
               "Review the evidence table — look for status codes indicating blocked or unconfirmed deliveries.";
    }

    // ── Missing parameter humanization ─────────────────────────────────────────

    var FRIENDLY_PARAM_NAMES = {
        site_id:      "Which store are you checking?",
        retailer_id:  "Which retailer should I use?",
        supplier_id:  "Which supplier are you looking for?",
        vendor_text:  "What is the supplier name?",
        date_from:    "What is the start date for this query?",
        date_to:      "What is the end date?",
        as_of_date:   "What date should I use as the reference?",
        lu_id:        "What is the article LU code?",
        ean:          "What is the EAN / UPC / barcode number?",
        order_ref:    "What is the supplier reference to order number?",
        question_text:"Can you rephrase the question?"
    };

    function humanizeParameterGaps(gaps) {
        if (!gaps || !gaps.length) { return null; }
        var questions = gaps.map(function (g) {
            return FRIENDLY_PARAM_NAMES[g] || FRIENDLY_PARAM_NAMES[g.toLowerCase()] || ('What is the value for "' + g + '"?');
        });
        if (questions.length === 1) { return questions[0]; }
        return "I need a few more details: " + questions.join(" ");
    }

    // ── Clarification question builder ─────────────────────────────────────────

    /**
     * Build a targeted clarification question when the router found multiple vendor matches.
     */
    function buildClarificationQuestion(candidateOptions, vendorText) {
        if (!candidateOptions || !candidateOptions.length) { return null; }
        if (candidateOptions.length === 1) {
            var o = candidateOptions[0];
            return "Just to confirm — did you mean " + (o.supplier_name || o.supplier_id) +
                   (o.supplier_id ? " (code " + o.supplier_id + ")" : "") + "?";
        }
        var names = candidateOptions.slice(0, 4).map(function (o) {
            return (o.supplier_name || o.supplier_id) + (o.supplier_id ? " (" + o.supplier_id + ")" : "");
        });
        return "I found " + candidateOptions.length + " suppliers matching " +
               (vendorText ? '"' + vendorText + '"' : "that name") + ". Which one did you mean?\n• " +
               names.join("\n• ");
    }

    // ── Operational insights ───────────────────────────────────────────────────

    /**
     * Generate up to 3 evidence-panel insights from the result set.
     * These replace robotic "Business SQL executed on template X" strings.
     */
    function buildInsights(intent_type, template_code, rows, ctx) {
        var insights = [];
        var count = rows.length;
        var sp = supplierPhrase(ctx);

        if (isMovements(template_code) && count > 0) {
            var cols = colsUpper(rows[0]);
            var dateCol = cols.find(function (c) { return /DATMVT|DATE|STMDMVT/.test(c); });
            if (dateCol) {
                var col = dateCol.toLowerCase();
                var dates = rows.map(function (r) { return String(r[col] || ""); }).filter(Boolean).sort();
                if (dates.length > 1) {
                    insights.push("Activity spans " + dates[0].slice(0, 10) + " → " + dates[dates.length - 1].slice(0, 10));
                }
            }
        }

        if (isPurchaseOrders(template_code) && count > 0) {
            var cols2 = colsUpper(rows[0]);
            var qtyCol = cols2.find(function (c) { return /QTE|QTY|QUANTITY|QTEC/.test(c); });
            if (qtyCol) {
                var col2 = qtyCol.toLowerCase();
                var total = rows.reduce(function (s, r) { return s + (Number(r[col2]) || 0); }, 0);
                if (total > 0) { insights.push("Total ordered quantity: " + total.toLocaleString() + " units across " + count + " lines"); }
            }
        }

        if (isBuyableItems(template_code)) {
            if (count === 0) {
                insights.push("No active item range found for " + sp + " on the as-of date — verify ARADDEB/ARADFIN range in ARTUC");
            } else if (count >= 200) {
                insights.push("Large catalog: " + count + "+ items — consider filtering by category or narrowing the date");
            }
        }

        if (insights.length === 0 && count > 0) {
            insights.push(count + " record" + (count === 1 ? "" : "s") + " returned from GOLD");
        }

        return insights.slice(0, 3);
    }

    // ── Main synthesizer ───────────────────────────────────────────────────────

    /**
     * @param {object} opts
     * @param {string}   opts.intent_type
     * @param {string}   opts.template_code
     * @param {object[]} opts.rows
     * @param {string[]} opts.cols
     * @param {object}   opts.ctx           — execute context (supplier_id, site_id, dates, …)
     * @param {string[]} [opts.parameter_gaps]
     * @param {object[]} [opts.candidate_options]  — from route (multiple vendor matches)
     * @param {string}   [opts.vendor_text]
     * @returns {{ summary: string, insights: string[], follow_up_hint: string|null }}
     */
    function synthesize(opts) {
        var intent_type       = String(opts.intent_type || "GENERAL").toUpperCase();
        var template_code     = String(opts.template_code || "");
        var resultRows        = Array.isArray(opts.rows) ? opts.rows : [];
        var ctx               = opts.ctx || {};
        var parameter_gaps    = Array.isArray(opts.parameter_gaps) ? opts.parameter_gaps : [];
        var candidate_options = Array.isArray(opts.candidate_options) ? opts.candidate_options : [];
        var vendor_text       = opts.vendor_text || ctx.vendor_text || "";

        // Parameter gaps take highest priority — we can't run until these are answered
        if (parameter_gaps.length) {
            var gapQuestion = humanizeParameterGaps(parameter_gaps);
            return {
                summary: gapQuestion || "I need a bit more information before I can run this query.",
                insights: [],
                follow_up_hint: null
            };
        }

        // Clarification needed for vendor ambiguity
        if (candidate_options.length > 1 && !ctx.supplier_id) {
            var clarQ = buildClarificationQuestion(candidate_options, vendor_text);
            return {
                summary: clarQ || "I found multiple matches — please confirm which supplier you meant.",
                insights: [],
                follow_up_hint: null
            };
        }

        // Conversational skills return a pre-built answer in the first row
        if (isConversational(template_code)) {
            var convText = buildConversationalResponse(resultRows);
            if (convText) {
                return { summary: convText, insights: [], follow_up_hint: null };
            }
        }

        // Check for a direct answer_text column (conversational / CASE-based templates)
        if (resultRows.length) {
            var directText = firstText(resultRows[0], ["ANSWER_TEXT", "answer_text"]);
            if (directText && !/^(SELECT|FROM|WHERE)/i.test(directText)) {
                return { summary: directText, insights: [], follow_up_hint: null };
            }
        }

        // Route to template-specific builders
        var summary;
        if (isBuyableItems(template_code)) {
            summary = buildBuyableItemsResponse(resultRows.length, ctx);
        } else if (isMovements(template_code)) {
            summary = buildMovementsResponse(resultRows.length, resultRows, ctx);
        } else if (isPurchaseOrders(template_code)) {
            summary = buildPurchaseOrdersResponse(resultRows.length, resultRows, ctx);
        } else if (isStockNegative(template_code)) {
            summary = resultRows.length === 0
                ? "No stock anomalies found for " + sitePhrase(ctx) + " — stock levels look normal for the current filters."
                : "Found " + rowStr(resultRows.length) + " with negative stock at " + sitePhrase(ctx) + ". " +
                  "These items need investigation — negative stock usually indicates unconfirmed receipts, shrinkage, or a data entry issue. See the table for article codes.";
        } else if (isItemCard(template_code)) {
            summary = buildItemCardResponse(template_code, resultRows.length, resultRows, ctx);
        } else if (isOrderRefLookup(template_code)) {
            var ref = ctx.order_ref || ctx.ORDER_REF || "that reference";
            summary = resultRows.length === 0
                ? "No active ARTUC row matched reference to order " + ref + ". " +
                  "Check the number on the supplier contract or try the item LU / EAN instead."
                : "Resolved reference to order " + ref + " to " + rowStr(resultRows.length) +
                  " — see item LU in the table.";
        } else if (isArticleStatus(template_code)) {
            summary = buildArticleStatusResponse(resultRows.length, resultRows, ctx);
        } else if (isVendorLookup(template_code)) {
            summary = buildVendorLookupResponse(resultRows.length, resultRows, ctx);
        } else if (isDsdDiag(template_code)) {
            summary = buildDsdDiagResponse(resultRows.length, resultRows, ctx);
        } else if (resultRows.length === 0) {
            summary = "The query ran successfully but returned no results for the current filters. " +
                      "Try widening the date range, verifying the supplier code, or adjusting the site filter.";
        } else {
            summary = "I found " + rowStr(resultRows.length) + " matching your query. " +
                      "The full result set is in the table below.";
        }

        var insights = buildInsights(intent_type, template_code, resultRows, ctx);
        return { summary: summary, insights: insights, follow_up_hint: null };
    }

    /**
     * Rule-based diagnostic chain synthesis.
     *
     * Substitutes {token} placeholders in conclusion templates using a flat
     * token map built from ctx + the accumulated step result fields. Returns
     * the same shape as synthesize() so the engine can use the same wire format.
     *
     * @param {Array}  stepResults   - audit trail from diagnoseChain (per-step objects)
     * @param {Object} conclusion    - row from AI_DIAGNOSTIC_CONCLUSION (may be null)
     * @param {Object} ctx           - merged execute context + accumulated row fields
     */
    function synthesizeDiagnostic(stepResults, conclusion, ctx) {
        // Build flat token map: ctx values + step result row fields
        // Later steps overwrite earlier ones so the deepest reached state wins.
        var tokenMap = {};
        Object.keys(ctx || {}).forEach(function (k) {
            if (ctx[k] != null && ctx[k] !== "") {
                tokenMap[k.toLowerCase()] = String(ctx[k]);
            }
        });
        (stepResults || []).forEach(function (s) {
            (s.rows || []).forEach(function (row) {
                Object.keys(row).forEach(function (col) {
                    if (row[col] != null) {
                        tokenMap[col.toLowerCase()] = String(row[col]);
                    }
                });
            });
        });

        // Compute a "days until PO" helper if next_po_date / earliest_po_date present
        var poDateKey = tokenMap["next_po_date"] || tokenMap["earliest_po_date"];
        if (poDateKey) {
            try {
                var poD = new Date(poDateKey);
                var today = new Date();
                var diff = Math.round((poD - today) / (1000 * 60 * 60 * 24));
                if (!isNaN(diff)) { tokenMap["days"] = String(diff > 0 ? diff : 0); }
            } catch (e) { /* ignore */ }
        }

        function substitute(template) {
            if (!template) { return ""; }
            return String(template).replace(/\{([^}]+)\}/g, function (match, key) {
                var val = tokenMap[key.toLowerCase()];
                return val != null ? val : match;
            });
        }

        if (!conclusion) {
            // No matched conclusion — return generic fallback
            var stepLabels = (stepResults || [])
                .filter(function (s) { return s.stopped_here; })
                .map(function (s) { return s.step_label || s.template_code; });
            return {
                summary: "The diagnostic chain completed but no specific conclusion template was found. The issue may require manual investigation.",
                insights: stepLabels.length
                    ? ["Diagnostic stopped at: " + stepLabels[0]]
                    : ["All steps completed without a matching stop condition."],
                follow_up_hint: null,
                severity: "WARNING"
            };
        }

        function col(obj, up, low) { return obj && (obj[up] != null ? obj[up] : obj[low]); }
        var summaryTmpl  = col(conclusion, "SUMMARY_TEMPLATE",   "summary_template")  || "";
        var evidenceTmpl = col(conclusion, "EVIDENCE_TEMPLATE",  "evidence_template") || "";
        var followUpTmpl = col(conclusion, "FOLLOW_UP_TEMPLATE", "follow_up_template") || "";
        var severity     = col(conclusion, "SEVERITY", "severity") || "INFO";

        var summary  = substitute(summaryTmpl);
        var evidence = substitute(evidenceTmpl);
        var followUp = substitute(followUpTmpl) || null;

        // Evidence template uses pipe-separated sentences → evidence_facts[]
        var insights = evidence
            ? evidence.split("|").map(function (s) { return s.trim(); }).filter(Boolean)
            : [];

        return {
            summary: summary || "Diagnostic complete.",
            insights: insights,
            follow_up_hint: followUp || null,
            severity: severity
        };
    }

    /**
     * Multi-issue diagnostic synthesis.
     *
     * Called when the HARD/SOFT chain collects more than one stop condition.
     * Each entry in conclusionPairs has: { conclusionKey, stepCtx, isHard, stepLabel, conclusion }.
     *
     * Returns the same outer shape as synthesizeDiagnostic() plus overall_severity.
     */
    function synthesizeMultipleDiagnostics(stepResults, conclusionPairs, ctx) {
        if (!conclusionPairs || !conclusionPairs.length) {
            return {
                summary: "The diagnostic chain completed but no specific blocking issue was identified.",
                insights: [],
                follow_up_hint: null,
                overall_severity: "INFO"
            };
        }

        // Build shared token map from ctx + all step rows (later rows overwrite earlier)
        var tokenMap = {};
        Object.keys(ctx || {}).forEach(function (k) {
            if (ctx[k] != null && ctx[k] !== "") { tokenMap[k.toLowerCase()] = String(ctx[k]); }
        });
        (stepResults || []).forEach(function (s) {
            (s.rows || []).forEach(function (row) {
                Object.keys(row).forEach(function (col) {
                    if (row[col] != null) { tokenMap[col.toLowerCase()] = String(row[col]); }
                });
            });
        });

        var severityRank = { CRITICAL: 3, WARNING: 2, INFO: 1 };
        var overallSeverity = "INFO";
        var allInsights = [];
        var summaryParts = [];
        var firstFollowUp = null;

        conclusionPairs.forEach(function (cp, idx) {
            // Per-issue token map merges shared map with this step's own ctx fields
            var localMap = Object.assign({}, tokenMap);
            Object.keys(cp.stepCtx || {}).forEach(function (k) {
                if (cp.stepCtx[k] != null) { localMap[k.toLowerCase()] = String(cp.stepCtx[k]); }
            });

            function sub(template) {
                if (!template) { return ""; }
                return String(template).replace(/\{([^}]+)\}/g, function (m, key) {
                    var v = localMap[key.toLowerCase()];
                    return v != null ? v : m;
                });
            }

            var conclusion = cp.conclusion;
            if (!conclusion) {
                summaryParts.push((idx + 1) + ". Issue at \"" + (cp.stepLabel || cp.conclusionKey) + "\" — no conclusion template found.");
                return;
            }

            function col(obj, up, low) { return obj && (obj[up] != null ? obj[up] : obj[low]); }
            var sev         = String(col(conclusion, "SEVERITY",          "severity")         || "INFO").toUpperCase();
            var summaryTmpl = col(conclusion, "SUMMARY_TEMPLATE",  "summary_template")  || "";
            var evidTmpl    = col(conclusion, "EVIDENCE_TEMPLATE",  "evidence_template") || "";
            var fuTmpl      = col(conclusion, "FOLLOW_UP_TEMPLATE", "follow_up_template") || "";

            if ((severityRank[sev] || 0) > (severityRank[overallSeverity] || 0)) {
                overallSeverity = sev;
            }

            var label = cp.isHard ? "[BLOCKING — " + sev + "] " : "[" + sev + "] ";
            summaryParts.push((idx + 1) + ". " + label + sub(summaryTmpl));

            if (evidTmpl) {
                sub(evidTmpl).split("|").map(function (s) { return s.trim(); }).filter(Boolean).forEach(function (e) {
                    allInsights.push(e);
                });
            }
            if (fuTmpl && !firstFollowUp) { firstFollowUp = sub(fuTmpl); }
        });

        var luId   = tokenMap["lu_id"]   || "the item";
        var siteId = tokenMap["site_id"] || "the store";
        var n = conclusionPairs.length;
        var intro = n === 1
            ? "1 ordering issue found for item " + luId + " at store " + siteId + ":"
            : n + " ordering issues found for item " + luId + " at store " + siteId + ":";

        return {
            summary: intro + "\n\n" + summaryParts.join("\n\n"),
            insights: allInsights.slice(0, 12),
            follow_up_hint: firstFollowUp,
            overall_severity: overallSeverity
        };
    }

    return {
        synthesize: synthesize,
        synthesizeDiagnostic: synthesizeDiagnostic,
        synthesizeMultipleDiagnostics: synthesizeMultipleDiagnostics,
        humanizeParameterGaps: humanizeParameterGaps,
        buildClarificationQuestion: buildClarificationQuestion
    };
})();
