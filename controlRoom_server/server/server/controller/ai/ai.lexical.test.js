"use strict";

/**
 * Standalone smoke / regression test for ai.lexical.js.
 *
 * Run from controlRoom_server:
 *     node server/server/controller/ai/ai.lexical.test.js
 *
 * Or directly inside the same folder:
 *     node ai.lexical.test.js
 *
 * No external test framework — it's intentionally lightweight so you can
 * sanity-check the lexical layer without installing dev deps in production.
 * Exits with code 1 if any expectation fails.
 */

const lex = require("./ai.lexical");

let passed = 0;
let failed = 0;
const failures = [];

function check(label, actual, expected) {
    const a = JSON.stringify(actual);
    const e = JSON.stringify(expected);
    if (a === e) {
        passed += 1;
    } else {
        failed += 1;
        failures.push({ label: label, actual: a, expected: e });
    }
}

function assert(label, cond) {
    if (cond) { passed += 1; }
    else      { failed += 1; failures.push({ label: label, actual: "false", expected: "true" }); }
}

/* ------------------------------------------------------------------------- */
/* Porter stem — known reference cases                                        */
/* ------------------------------------------------------------------------- */
[
    ["items",        "item"],
    ["item",         "item"],
    ["articles",     "articl"],
    ["article",      "articl"],
    ["buying",       "bui"],
    ["buyable",      "buyabl"],
    ["orderable",    "order"],
    ["orders",       "order"],
    ["ordering",     "order"],
    ["purchase",     "purchas"],
    ["purchasing",   "purchas"],
    ["assortment",   "assort"],
    ["catalog",      "catalog"],
    ["catalogue",    "catalogu"],
    ["promotion",    "promot"],
    ["promotional",  "promot"],
    ["allowance",    "allow"],
    ["allowances",   "allow"]
].forEach(function (pair) {
    check("stem(" + pair[0] + ")", lex.stem(pair[0]), pair[1]);
});

/* ------------------------------------------------------------------------- */
/* normalize — punctuation strip, whitespace collapse                         */
/* ------------------------------------------------------------------------- */
check("normalize 'What items?!'", lex.normalize("What items?!"), "what items");
check("normalize spaces",          lex.normalize("  hello   world  "), "hello world");
check("normalize empty",           lex.normalize(""), "");
check("normalize null",            lex.normalize(null), "");

/* ------------------------------------------------------------------------- */
/* tokens — stopwords filtered, digits kept, words stemmed                    */
/* ------------------------------------------------------------------------- */
check("tokens 'from the supplier'", lex.tokens("from the supplier"), ["supplier"]);
check("tokens with digits",          lex.tokens("for store 7"),        ["store", "7"]);
check("tokens 'what items can we buy from lipari'",
      lex.tokens("what items can we buy from lipari"),
      ["what", "item", "can", "bui", "lipari"]);

/* ------------------------------------------------------------------------- */
/* n-grams — sizes 1..3 by default                                            */
/* ------------------------------------------------------------------------- */
const grams = lex.ngrams(["a", "b", "c"], 3);
check("ngrams a b c (1..3)", grams,
    ["a", "b", "c", "a b", "b c", "a b c"]);

/* ------------------------------------------------------------------------- */
/* phraseSet + jaccard — vocabulary-style similarity                          */
/* ------------------------------------------------------------------------- */
const q = lex.phraseSet("what items can we buy from lipari for store 7", 3);
const v = lex.phraseSet("what items can we buy from",                  3);
const j = lex.jaccard(q, v);
assert("jaccard(q, vocab term) > 0.20", j > 0.20);
assert("phraseSet drops stopwords",    !q.has("from") && !v.has("from"));
assert("phraseSet keeps numeric site",  q.has("7") || q.has("store 7"));

const overlap = lex.overlap(q, v);
assert("overlap(q, vocab term) >= 4 grams", overlap >= 4);

/* ------------------------------------------------------------------------- */
/* Stemmer collapses past tense / gerund / plural to one form                 */
/* ------------------------------------------------------------------------- */
function variantsCollapse(label, words) {
    const stems = words.map(function (w) { return lex.stem(w); });
    const allSame = stems.every(function (s, i, arr) { return s === arr[0]; });
    assert(label + " collapse to one root (=" + stems[0] + ")", allSame);
}
// Note: Porter does NOT collapse 'buyer'/'buyers' onto 'bui' (the measure of
// 'buy' is 1, so the -er suffix isn't strippable). That's fine — what we need
// is for the verb forms users actually type to share a root.
variantsCollapse("buy / buys / buying",                ["buy", "buys", "buying"]);
variantsCollapse("order / orders / ordering",          ["order", "orders", "ordering"]);
variantsCollapse("purchase / purchases / purchasing",  ["purchase", "purchases", "purchasing"]);
variantsCollapse("ship / ships / shipping / shipped",  ["ship", "ships", "shipping", "shipped"]);

/* ------------------------------------------------------------------------- */
/* Stopword set sanity                                                        */
/* ------------------------------------------------------------------------- */
assert("STOPWORDS contains 'from'", lex.STOPWORDS.has("from"));
assert("STOPWORDS contains 'the'",  lex.STOPWORDS.has("the"));
assert("STOPWORDS does not contain 'item'", !lex.STOPWORDS.has("item"));

/* ------------------------------------------------------------------------- */
/* Phase 8 — extractBindsFromHints                                            */
/* ------------------------------------------------------------------------- */
const STD_HINTS = [
    { term: "for store",     concept: "site_id" },
    { term: "at store",      concept: "site_id" },
    { term: "in store",      concept: "site_id" },
    { term: "for site",      concept: "site_id" },
    { term: "from supplier", concept: "supplier_id" },
    { term: "from vendor",   concept: "supplier_id" },
    { term: "from the supplier", concept: "supplier_id" },
    { term: "as of",         concept: "as_of_date" },
    { term: "as of date",    concept: "as_of_date" }
];

function extract(text) {
    return lex.extractBindsFromHints(text, STD_HINTS);
}

check(
    "bind hint: for store 7 → site_id",
    extract("list orderable items from lipari for store 7").entities,
    { site_id: "7" }
);
check(
    "bind hint: from supplier 06966 → supplier_id",
    extract("which items from supplier 06966").entities,
    { supplier_id: "06966" }
);
check(
    "bind hint: 'from the supplier nr 06966' beats 'from supplier'",
    extract("items from the supplier nr 06966").entities,
    { supplier_id: "06966" }
);
check(
    "bind hint: combined site + supplier",
    extract("orderable items from supplier 06966 for store 7").entities,
    { supplier_id: "06966", site_id: "7" }
);
check(
    "bind hint: 'as of 2026-05-10' → as_of_date",
    extract("inventory as of 2026-05-10").entities,
    { as_of_date: "2026-05-10" }
);
check(
    "bind hint: 'as of date 2026-05-10' (longer beats shorter)",
    extract("snapshot as of date 2026-05-10").entities,
    { as_of_date: "2026-05-10" }
);
check(
    "bind hint: 'in store 41' (filler match)",
    extract("show me items in store 41").entities,
    { site_id: "41" }
);

const m = extract("for store 7 from supplier 06966");
assert("bind hint: matches array has 2 entries", m.matches.length === 2);
assert("bind hint: site_id classified as number",
    m.matches.find(function (x) { return x.concept === "site_id"; }).kind === "number");

// Negative: hint phrase but no value following.
check(
    "bind hint: hint without trailing value yields empty entities",
    extract("nothing about store interesting here").entities,
    {}
);

// Negative: empty inputs.
check("bind hint: empty hints", lex.extractBindsFromHints("for store 7", []).entities, {});
check("bind hint: empty text",  lex.extractBindsFromHints("", STD_HINTS).entities, {});

/* ------------------------------------------------------------------------- */
/* Report                                                                     */
/* ------------------------------------------------------------------------- */
console.log("\nai.lexical regression");
console.log("---------------------");
console.log("passed: " + passed);
console.log("failed: " + failed);
if (failures.length) {
    console.log("\nFailures:");
    failures.forEach(function (f) {
        console.log("  - " + f.label);
        console.log("      expected: " + f.expected);
        console.log("      actual:   " + f.actual);
    });
    process.exit(1);
}
console.log("\nALL CHECKS PASSED");
