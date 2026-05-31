"use strict";

/**
 * Lightweight, pure-Node lexical helpers for the Supply Chain AI engine.
 *
 *   - normalize(text)          : lowercases, strips punctuation, collapses whitespace
 *   - stem(token)              : Porter stemmer (compact implementation)
 *   - tokens(text)             : normalized + stemmed unigrams (excludes stopwords)
 *   - ngrams(arrayOfWords, n)  : 1..n grams joined by single space
 *   - phraseSet(text, maxN)    : Set of stemmed n-grams from a question or vocabulary term
 *   - jaccard(setA, setB)      : 0..1 set similarity
 *   - overlap(setA, setB)      : intersection count (raw)
 *
 * No external dependencies. ~350 lines, all pure functions, no allocations
 * per call beyond the returned structures.
 */

const STOPWORDS = new Set([
    "a", "an", "the",
    "is", "are", "was", "were", "be", "been", "being", "am",
    "do", "does", "did", "doing",
    "have", "has", "had", "having",
    "to", "of", "in", "on", "at", "by", "for", "with", "from", "into", "over", "under",
    "and", "or", "but", "if", "then", "else", "than", "so",
    "i", "we", "you", "he", "she", "it", "they", "me", "us", "him", "her", "them",
    "my", "our", "your", "his", "their", "its",
    "this", "that", "these", "those",
    "as", "about", "via",
    "?", "!", ".", ","
]);

function normalize(text) {
    return String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/* -------------------------------------------------------------------------
 * Porter stemmer (English) — compact ES5-friendly implementation.
 * Adapted to a single function so it can run inside Node without deps.
 * Reference: M.F. Porter, "An algorithm for suffix stripping", 1980.
 * ------------------------------------------------------------------------- */

const VOWEL = /[aeiouy]/;
const CONSONANT = /[^aeiouy]/;

function isConsonant(w, i) {
    const c = w[i];
    if (c === "a" || c === "e" || c === "i" || c === "o" || c === "u") { return false; }
    if (c === "y") {
        return i === 0 ? true : !isConsonant(w, i - 1);
    }
    return true;
}

function measure(w) {
    let n = 0;
    let i = 0;
    while (i < w.length && isConsonant(w, i)) { i += 1; }
    while (i < w.length) {
        while (i < w.length && !isConsonant(w, i)) { i += 1; }
        if (i >= w.length) { return n; }
        n += 1;
        while (i < w.length && isConsonant(w, i)) { i += 1; }
    }
    return n;
}

function containsVowel(w) {
    for (let i = 0; i < w.length; i += 1) {
        if (!isConsonant(w, i)) { return true; }
    }
    return false;
}

function endsWithDoubleConsonant(w) {
    if (w.length < 2) { return false; }
    const a = w[w.length - 1];
    const b = w[w.length - 2];
    if (a !== b) { return false; }
    return isConsonant(w, w.length - 1);
}

function endsCVC(w) {
    if (w.length < 3) { return false; }
    if (!isConsonant(w, w.length - 1)) { return false; }
    if (isConsonant(w, w.length - 2)) { return false; }
    if (!isConsonant(w, w.length - 3)) { return false; }
    const last = w[w.length - 1];
    if (last === "w" || last === "x" || last === "y") { return false; }
    return true;
}

function replaceSuffix(w, suffix, repl) {
    return w.slice(0, w.length - suffix.length) + repl;
}

function step1a(w) {
    if (w.endsWith("sses")) { return replaceSuffix(w, "sses", "ss"); }
    if (w.endsWith("ies"))  { return replaceSuffix(w, "ies",  "i");  }
    if (w.endsWith("ss"))   { return w; }
    if (w.endsWith("s") && w.length > 1) { return w.slice(0, -1); }
    return w;
}

function step1b(w) {
    if (w.endsWith("eed")) {
        const stem = w.slice(0, -3);
        if (measure(stem) > 0) { return stem + "ee"; }
        return w;
    }
    let stem = null;
    if (w.endsWith("ed") && containsVowel(w.slice(0, -2))) {
        stem = w.slice(0, -2);
    } else if (w.endsWith("ing") && containsVowel(w.slice(0, -3))) {
        stem = w.slice(0, -3);
    }
    if (!stem) { return w; }
    if (stem.endsWith("at") || stem.endsWith("bl") || stem.endsWith("iz")) { return stem + "e"; }
    if (endsWithDoubleConsonant(stem)) {
        const last = stem[stem.length - 1];
        if (last !== "l" && last !== "s" && last !== "z") {
            return stem.slice(0, -1);
        }
        return stem;
    }
    if (measure(stem) === 1 && endsCVC(stem)) { return stem + "e"; }
    return stem;
}

function step1c(w) {
    if (w.endsWith("y") && containsVowel(w.slice(0, -1))) {
        return w.slice(0, -1) + "i";
    }
    return w;
}

const STEP2_MAP = [
    ["ational", "ate"],
    ["tional",  "tion"],
    ["enci",    "ence"],
    ["anci",    "ance"],
    ["izer",    "ize"],
    ["abli",    "able"],
    ["alli",    "al"],
    ["entli",   "ent"],
    ["eli",     "e"],
    ["ousli",   "ous"],
    ["ization", "ize"],
    ["ation",   "ate"],
    ["ator",    "ate"],
    ["alism",   "al"],
    ["iveness", "ive"],
    ["fulness", "ful"],
    ["ousness", "ous"],
    ["aliti",   "al"],
    ["iviti",   "ive"],
    ["biliti",  "ble"]
];

function step2(w) {
    for (let i = 0; i < STEP2_MAP.length; i += 1) {
        const pair = STEP2_MAP[i];
        if (w.endsWith(pair[0])) {
            const stem = w.slice(0, w.length - pair[0].length);
            if (measure(stem) > 0) { return stem + pair[1]; }
            return w;
        }
    }
    return w;
}

const STEP3_MAP = [
    ["icate", "ic"],
    ["ative", ""],
    ["alize", "al"],
    ["iciti", "ic"],
    ["ical",  "ic"],
    ["ful",   ""],
    ["ness",  ""]
];

function step3(w) {
    for (let i = 0; i < STEP3_MAP.length; i += 1) {
        const pair = STEP3_MAP[i];
        if (w.endsWith(pair[0])) {
            const stem = w.slice(0, w.length - pair[0].length);
            if (measure(stem) > 0) { return stem + pair[1]; }
            return w;
        }
    }
    return w;
}

const STEP4_SUFFIXES = [
    "al", "ance", "ence", "er", "ic", "able", "ible", "ant", "ement", "ment", "ent",
    "ou", "ism", "ate", "iti", "ous", "ive", "ize"
];

function step4(w) {
    for (let i = 0; i < STEP4_SUFFIXES.length; i += 1) {
        const sfx = STEP4_SUFFIXES[i];
        if (w.endsWith(sfx)) {
            const stem = w.slice(0, w.length - sfx.length);
            if (measure(stem) > 1) { return stem; }
            return w;
        }
    }
    if (w.endsWith("ion")) {
        const stem = w.slice(0, -3);
        const last = stem.length ? stem[stem.length - 1] : "";
        if (measure(stem) > 1 && (last === "s" || last === "t")) { return stem; }
    }
    return w;
}

function step5a(w) {
    if (!w.endsWith("e")) { return w; }
    const stem = w.slice(0, -1);
    const m = measure(stem);
    if (m > 1) { return stem; }
    if (m === 1 && !endsCVC(stem)) { return stem; }
    return w;
}

function step5b(w) {
    if (measure(w) > 1 && endsWithDoubleConsonant(w) && w.endsWith("l")) {
        return w.slice(0, -1);
    }
    return w;
}

function stem(token) {
    let w = String(token || "").toLowerCase();
    if (w.length < 3) { return w; }
    w = step1a(w);
    w = step1b(w);
    w = step1c(w);
    w = step2(w);
    w = step3(w);
    w = step4(w);
    w = step5a(w);
    w = step5b(w);
    return w;
}

/* -------------------------------------------------------------------------
 * Tokenization, n-grams, set similarity
 * ------------------------------------------------------------------------- */

function rawTokens(text) {
    return normalize(text)
        .split(" ")
        .filter(function (t) { return t.length > 0; });
}

function tokens(text) {
    const out = [];
    const raw = rawTokens(text);
    for (let i = 0; i < raw.length; i += 1) {
        const t = raw[i];
        if (STOPWORDS.has(t)) { continue; }
        // Keep digit-only tokens as-is (e.g. supplier/site codes).
        if (/^\d+$/.test(t)) { out.push(t); continue; }
        if (t.length < 2) { continue; }
        out.push(stem(t));
    }
    return out;
}

function ngrams(words, maxN) {
    const out = [];
    const n = Math.max(1, Math.min(maxN || 3, 5));
    for (let size = 1; size <= n; size += 1) {
        for (let i = 0; i + size <= words.length; i += 1) {
            out.push(words.slice(i, i + size).join(" "));
        }
    }
    return out;
}

function phraseSet(text, maxN) {
    const set = new Set();
    const t = tokens(text);
    const grams = ngrams(t, maxN || 3);
    for (let i = 0; i < grams.length; i += 1) {
        set.add(grams[i]);
    }
    return set;
}

function intersectionCount(setA, setB) {
    let n = 0;
    setA.forEach(function (v) { if (setB.has(v)) { n += 1; } });
    return n;
}

function jaccard(setA, setB) {
    if (!setA.size || !setB.size) { return 0; }
    const inter = intersectionCount(setA, setB);
    const union = setA.size + setB.size - inter;
    return union === 0 ? 0 : inter / union;
}

/* -------------------------------------------------------------------------
 * Phase 8 — BIND_HINT-driven entity extraction
 *
 * extractBindsFromHints(text, hints)
 *   text  : raw question text
 *   hints : [{ term, concept }, ...]   (already filtered to BIND_HINT vocab)
 *           term    : the phrase to look for ("for store", "from supplier")
 *           concept : the entity name to populate ("site_id", "supplier_id")
 *
 * Returns { entities, matches } where:
 *   entities[concept] = first captured value for that concept
 *   matches           = full audit trail (term, concept, value, kind, used,
 *                       captured_at character index)
 *
 * Kind heuristic:
 *   - all-digit token       -> "number"
 *   - YYYY-MM-DD or like    -> "date"
 *   - otherwise             -> "string"
 *
 * Hints are sorted by length descending so multi-word terms beat their
 * substrings ("from the supplier" beats "supplier"). The function never
 * overwrites an entity already populated by an earlier (longer) hint.
 *
 * Pure function — no allocations beyond the returned arrays/objects.
 * ------------------------------------------------------------------------- */

function escapeRegex(s) {
    return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function classifyBindValue(raw) {
    if (/^\d+$/.test(raw)) { return "number"; }
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) { return "date"; }
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(raw)) { return "date"; }
    return "string";
}

function extractBindsFromHints(rawText, hints) {
    const text = String(rawText || "").toLowerCase();
    const entities = {};
    const matches = [];
    if (!text || !Array.isArray(hints) || !hints.length) {
        return { entities: entities, matches: matches };
    }

    const sorted = hints
        .filter(function (h) { return h && h.term && h.concept; })
        .map(function (h) {
            return {
                term: String(h.term).toLowerCase().trim(),
                concept: String(h.concept).toLowerCase().trim()
            };
        })
        .filter(function (h) { return h.term.length > 0 && h.concept.length > 0; })
        .sort(function (a, b) { return b.term.length - a.term.length; });

    sorted.forEach(function (h) {
        // \b<term>\b followed by optional connectors (#, =, :, "no", "nr", "code")
        // then the value token (alnum / dash / slash / dot).
        // We allow up to two filler words like "the", "is", "number" between
        // the hint and the value: "from the supplier no 06966".
        const fillers = "(?:\\s*(?:the|is|number|no|nr|code|id|#|=|:)\\s*){0,3}";
        const re = new RegExp(
            "\\b" + escapeRegex(h.term) + "\\b" +
            "[\\s:#=,\\.]*" + fillers +
            "([a-z0-9_\\-/\\.]+)",
            "i"
        );
        const m = text.match(re);
        if (!m || !m[1]) { return; }

        let value = m[1];

        // If the captured value is itself a stopword/filler word, skip
        // (avoids "for store the produce" → site_id="the").
        if (STOPWORDS.has(value)) { return; }

        const kind = classifyBindValue(value);

        // Strip a leading zero on numeric ids? No — vendor codes (06966) are
        // significant. Leave the raw token alone.
        const used = entities[h.concept] == null;
        if (used) { entities[h.concept] = value; }

        matches.push({
            term: h.term,
            concept: h.concept,
            value: value,
            kind: kind,
            used: used,
            offset: m.index != null ? m.index : null
        });
    });

    return { entities: entities, matches: matches };
}

/**
 * Relative date resolution — converts common English temporal expressions
 * to absolute YYYY-MM-DD ranges so buildExecuteContext can set _date_explicit=true
 * and MOVEMENT/HISTORY/LOG templates are not wrongly demoted by the temporal guard.
 *
 * Returns { date_from, date_to } or null when no relative date is detected.
 */
function extractRelativeDate(text) {
    const t = String(text || "").toLowerCase();
    const now = new Date();
    function fmt(d) {
        return d.getFullYear() + "-"
            + String(d.getMonth() + 1).padStart(2, "0") + "-"
            + String(d.getDate()).padStart(2, "0");
    }
    function dayOffset(d, n) {
        const r = new Date(d);
        r.setDate(r.getDate() + n);
        return r;
    }

    if (/\byesterday\b/.test(t)) {
        const y = dayOffset(now, -1);
        return { date_from: fmt(y), date_to: fmt(y) };
    }
    if (/\btoday\b/.test(t)) {
        return { date_from: fmt(now), date_to: fmt(now) };
    }
    if (/\blast\s+week\b/.test(t)) {
        // Mon–Sun of the previous calendar week
        const dayOfWeek = now.getDay() || 7;           // 1=Mon .. 7=Sun
        const startOfThisWeek = dayOffset(now, -(dayOfWeek - 1));
        const end   = dayOffset(startOfThisWeek, -1);  // last Sunday
        const start = dayOffset(startOfThisWeek, -7);  // last Monday
        return { date_from: fmt(start), date_to: fmt(end) };
    }
    if (/\bthis\s+week\b/.test(t)) {
        const dayOfWeek = now.getDay() || 7;
        const start = dayOffset(now, -(dayOfWeek - 1));
        return { date_from: fmt(start), date_to: fmt(now) };
    }
    if (/\bthis\s+month\b/.test(t)) {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { date_from: fmt(start), date_to: fmt(now) };
    }
    if (/\blast\s+month\b/.test(t)) {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end   = new Date(now.getFullYear(), now.getMonth(), 0);
        return { date_from: fmt(start), date_to: fmt(end) };
    }
    // "last N days" / "past N days"
    const m = t.match(/\b(?:last|past)\s+(\d+)\s+days?\b/);
    if (m) {
        const n = parseInt(m[1], 10);
        if (!isNaN(n) && n > 0 && n <= 3650) {
            return { date_from: fmt(dayOffset(now, -n)), date_to: fmt(now) };
        }
    }
    // "last N weeks"
    const mw = t.match(/\b(?:last|past)\s+(\d+)\s+weeks?\b/);
    if (mw) {
        const n = parseInt(mw[1], 10);
        if (!isNaN(n) && n > 0) {
            return { date_from: fmt(dayOffset(now, -n * 7)), date_to: fmt(now) };
        }
    }
    return null;
}

module.exports = {
    normalize: normalize,
    stem: stem,
    tokens: tokens,
    ngrams: ngrams,
    phraseSet: phraseSet,
    jaccard: jaccard,
    overlap: intersectionCount,
    extractBindsFromHints: extractBindsFromHints,
    extractRelativeDate: extractRelativeDate,
    STOPWORDS: STOPWORDS
};
