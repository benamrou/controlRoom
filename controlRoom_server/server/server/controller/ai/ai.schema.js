/**
 * AI Schema Discovery Controller
 * Based on user-provided version with batched parallel execution (10 concurrent).
 * Captures: ALL_TABLES + ALL_TAB_COMMENTS + ALL_TAB_COLUMNS + ALL_COL_COMMENTS + sample values
 */
"use strict";

module.exports = function (app, SQL) {

    const module = {};
    const Q = {
        RESOLVE_ENV: "AI0000025",
        OPEN_SCAN_LOG: "AI0000026",
        CLOSE_SCAN_LOG: "AI0000027",
        UPSERT_TABLE: "AI0000028",
        UPSERT_COLUMN: "AI0000031",
        UPSERT_SAMPLE_VALUE: "AI0000033",
        SCAN_STATUS: "AI0000022"
    };
    const GOLD_SCHEMAS   = ['CEN', 'GWR', 'STK'];
    const CODE_SUFFIXES  = ['ETAT','TYPE','STAT','COD','CAT','NAT','MODE','FLAG','IND','TYP','GRP'];
    const MAX_CODE_LEN   = 15;
    const MAX_SAMPLE     = 20;
    const BATCH_SIZE     = 10;   // concurrent MERGE operations
    const TASK_TIMEOUT_MS = 45000;
    /** Hard safety cap for any free-text segment passed to CALLQUERY param payloads. */
    const CALLQUERY_TEXT_MAX = 120;

    function isCodeColumn(colName, dataType, dataLength) {
        if (dataType !== 'VARCHAR2') return false;
        if (dataLength > MAX_CODE_LEN) return false;
        var up = (colName || '').toUpperCase();
        return CODE_SUFFIXES.some(function(s) { return up.endsWith(s); });
    }

    function esc(str) { return (str || '').replace(/'/g, "''"); }

    /** LIBQUERY params are comma-split; strip commas from free-text summaries. */
    function escParamSegment(str) {
        return String(str == null ? '' : str).replace(/,/g, ';').replace(/\r|\n/g, ' ');
    }

    function summarizeErr(err) {
        if (err == null) { return ''; }
        try {
            if (typeof err === 'string') { return err; }
            return JSON.stringify(err);
        } catch (e) {
            return String(err);
        }
    }

    function fakeRes() { return { json: function() {} }; }

    /**
     * GOLD may span two physical DBs: central (CEN/GWR) vs stock (STK).
     * CORPENV should expose ENVDBLINK (central) and ENVSTKDBLINK (stock).
     * Extend LIBQUERY AI0000025 to SELECT both columns (aliases must match).
     */
    function pickEnvField(row, names) {
        if (!row) { return ''; }
        for (var i = 0; i < names.length; i++) {
            var k = names[i];
            var v = row[k];
            if (v != null && String(v).trim() !== '') { return String(v).trim(); }
            var kl = k.toLowerCase();
            v = row[kl];
            if (v != null && String(v).trim() !== '') { return String(v).trim(); }
        }
        return '';
    }

    function resolveGoldDbLink(schemaOwner, envRow) {
        if (!envRow) { return ''; }
        var o = (schemaOwner || '').toUpperCase();
        var central = pickEnvField(envRow, ['ENVCENTRALDBLINK', 'CENTRAL_ENVDBLINK', 'ENVDBLINK']);
        var stk = pickEnvField(envRow, ['ENVSTKDBLINK', 'STK_ENVDBLINK', 'ENVDBLINK_STK']);
        if (o.endsWith('STK')) {
            /* Never use central link for *STK — objects live on stock DB; fallback causes ORA-00942. */
            return stk;
        }
        return central;
    }

    /**
     * runBatch — execute an array of functions (each accepts a done callback)
     * in groups of BATCH_SIZE, waiting for each group to complete before the next.
     */
    function runBatch(tasks, batchSize, onAllDone) {
        if (!tasks || tasks.length === 0) { onAllDone(); return; }
        var i = 0;

        function nextGroup() {
            if (i >= tasks.length) { onAllDone(); return; }
            var group = tasks.slice(i, i + batchSize);
            i += batchSize;
            var remaining = group.length;

            group.forEach(function(task) {
                var settled = false;
                var timeout = setTimeout(function() {
                    if (settled) { return; }
                    settled = true;
                    remaining--;
                    if (remaining === 0) { nextGroup(); }
                }, TASK_TIMEOUT_MS);

                function done() {
                    if (settled) { return; }
                    settled = true;
                    clearTimeout(timeout);
                    remaining--;
                    if (remaining === 0) { nextGroup(); }
                }

                try {
                    task(done);
                } catch (e) {
                    done();
                }
            });
        }

        nextGroup();
    }

    /**
     * ORA-01729: Oracle does not allow a bind variable immediately after @ (e.g. ALL_TABLES@:b).
     * Remote data-dictionary reads therefore use validated identifier concatenation + binds for literals only.
     */
    function oraIdent(x) {
        var s = String(x == null ? "" : x).trim();
        if (!/^[A-Za-z][A-Za-z0-9_$]{0,127}$/.test(s)) {
            return null;
        }
        return s;
    }

    function pick(obj, name) {
        if (!obj) { return undefined; }
        if (obj[name] !== undefined && obj[name] !== null) { return obj[name]; }
        var low = name.toLowerCase();
        if (obj[low] !== undefined && obj[low] !== null) { return obj[low]; }
        return undefined;
    }

    function pickStr(obj, name, def) {
        var v = pick(obj, name);
        if (v === undefined || v === null) { return def == null ? "" : String(def); }
        return String(v);
    }

    function pickNum(obj, name, def) {
        var v = pick(obj, name);
        if (v === undefined || v === null || v === "") { return def; }
        var n = Number(v);
        return isNaN(n) ? def : n;
    }

    /** PKREQUESTMANAGER splits LIBQUERY params on commas — strip commas (and escape quotes) in each segment. */
    function seg(str) {
        return esc(escParamSegment(str));
    }

    /**
     * Robust CALLQUERY-safe segment:
     * - remove commas/newlines
     * - escape single quotes
     * - truncate to bounded size
     */
    function segLimit(str, maxLen) {
        var lim = Number(maxLen || CALLQUERY_TEXT_MAX);
        var s = esc(escParamSegment(str));
        if (s.length > lim) {
            return s.substring(0, lim);
        }
        return s;
    }

    function normalizeSqlRows(data) {
        if (!data) { return []; }
        if (Array.isArray(data)) { return data; }
        if (data.rows && Array.isArray(data.rows)) { return data.rows; }
        return [];
    }

    function runRemoteSelect(sql, user, sid, lang, req, fr, cb) {
        var sqlEscaped = String(sql || "").replace(/'/g, "''");
        if (typeof SQL.executeQueryUsingMyCallBack === "function") {
            return SQL.executeQueryUsingMyCallBack(
                SQL.getNextTicketID(),
                sqlEscaped,
                "'{-1}'",
                user, sid, lang, req, fr,
                function (err, data) {
                    cb(err, normalizeSqlRows(data));
                }
            );
        }
        // Fallback path (older stacks): still try executeSQL.
        SQL.executeSQL(SQL.getNextTicketID(), sqlEscaped, {}, user, req, fr, function (err, data) {
            cb(err, normalizeSqlRows(data));
        });
    }

    function fetchRemoteAllTables(owner, dblink, user, sid, lang, req, fr, cb) {
        var o = oraIdent(owner);
        var l = oraIdent(dblink);
        if (!o || !l) {
            return cb(new Error("invalid owner or database link for remote ALL_TABLES"));
        }
        var sql =
            "SELECT t.OWNER AS OWNER, t.TABLE_NAME AS TABLE_NAME, NVL(t.NUM_ROWS,0) AS NUM_ROWS, c.COMMENTS AS TAB_COMMENT " +
            "FROM ALL_TABLES@" + l + " t " +
            "LEFT JOIN ALL_TAB_COMMENTS@" + l + " c " +
            " ON c.OWNER = t.OWNER AND c.TABLE_NAME = t.TABLE_NAME AND c.TABLE_TYPE = 'TABLE' " +
            "WHERE t.OWNER = '" + o + "'";
        runRemoteSelect(sql, user, sid, lang, req, fr, cb);
    }

    function fetchRemoteAllColumns(owner, dblink, user, sid, lang, req, fr, cb) {
        var o = oraIdent(owner);
        var l = oraIdent(dblink);
        if (!o || !l) {
            return cb(new Error("invalid owner or database link for remote ALL_TAB_COLUMNS"));
        }
        var sql =
            "SELECT c.OWNER AS OWNER, c.TABLE_NAME AS TABLE_NAME, c.COLUMN_NAME AS COLUMN_NAME, " +
            "c.DATA_TYPE AS DATA_TYPE, c.DATA_LENGTH AS DATA_LENGTH, c.NULLABLE AS NULLABLE, c.COLUMN_ID AS COLUMN_ID, " +
            "cc.COMMENTS AS COL_COMMENT " +
            "FROM ALL_TAB_COLUMNS@" + l + " c " +
            "LEFT JOIN ALL_COL_COMMENTS@" + l + " cc " +
            " ON cc.OWNER = c.OWNER AND cc.TABLE_NAME = c.TABLE_NAME AND cc.COLUMN_NAME = c.COLUMN_NAME " +
            "WHERE c.OWNER = '" + o + "'";
        runRemoteSelect(sql, user, sid, lang, req, fr, cb);
    }

    function fetchRemoteSampleDistinct(owner, table, column, dblink, maxRows, user, sid, lang, req, fr, cb) {
        var o = oraIdent(owner);
        var l = oraIdent(dblink);
        var tab = oraIdent(table);
        var col = oraIdent(column);
        if (!o || !l || !tab || !col) {
            return cb(new Error("invalid identifier for DISTINCT sample"));
        }
        var mx = Math.min(Math.max(parseInt(String(maxRows || MAX_SAMPLE), 10) || MAX_SAMPLE, 1), 500);
        var sql =
            "SELECT VAL FROM ( SELECT DISTINCT " + col + " AS VAL FROM " + o + "." + tab + "@" + l +
            " WHERE " + col + " IS NOT NULL ) WHERE ROWNUM <= " + mx;
        runRemoteSelect(sql, user, sid, lang, req, fr, cb);
    }

    module.scan = function () {
        app.post("/api/ai/schema/scan", function (req, res) {
            res.setHeader("Access-Control-Allow-Origin", "*");
            const retailer_id = req.body.retailer_id;
            const corpenv_id  = req.body.corpenv_id;
            if (!retailer_id || !corpenv_id) {
                return res.status(400).json({ error: "retailer_id and corpenv_id are required" });
            }

            const user = req.header("USER") || "SYSTEM";
            const sid  = "'{" + req.header("DATABASE_SID") + "}'";
            const lang = "'{" + req.header("LANGUAGE") + "}'";
            const fr   = fakeRes();

            SQL.executeLibQueryUsingMyCallback(
                SQL.getNextTicketID(),
                Q.RESOLVE_ENV,
                "'{" + seg(retailer_id) + "}'", user, sid, lang, req, res,
                function (err, envData) {
                    if (err || !envData || !envData.length) {
                        return res.status(404).json({ error: "Retailer/CORPENV not found: " + retailer_id });
                    }

                    var envRow = envData[0];
                    var centralDbLink = pickEnvField(envRow, ['ENVCENTRALDBLINK', 'CENTRAL_ENVDBLINK', 'ENVDBLINK']);
                    var stkDbLink = pickEnvField(envRow, ['ENVSTKDBLINK', 'STK_ENVDBLINK', 'ENVDBLINK_STK']);
                    var prefix = pickEnvField(envRow, ['ENVGOLDSCHEMA']) || (envRow.ENVGOLDSCHEMA || '');
                    const schemas = GOLD_SCHEMAS.map(function(s) { return prefix.substring(0,3) + s; });

                    
                    // Open scan log
                    SQL.executeLibQueryUsingMyCallback(
                        SQL.getNextTicketID(),
                        Q.OPEN_SCAN_LOG,
                        "'{" + seg(retailer_id) + "," + seg(user) + "}'", user, sid, lang, req, fr,
                        function () {
                            res.status(202).json({
                                success: true,
                                retailer_id: retailer_id,
                                db_link: centralDbLink,
                                db_link_central: centralDbLink,
                                db_link_stock: stkDbLink,
                                schemas: schemas,
                                message: "Schema scan started for " + schemas.join(", ")
                            });

                            var totalTables = 0, totalCols = 0, totalVals = 0;
                            var scanHadHardFailure = false;
                            var scanIssueLines = [];

                            function recordScanIssue(line) {
                                var safe = escParamSegment(line);
                                if (!safe) { return; }
                                scanIssueLines.push(safe);
                            }

                            function finalizeScanLog() {
                                var status = scanHadHardFailure ? 'ERROR' : 'COMPLETE';
                                var summary = '-';
                                if (scanIssueLines.length) {
                                    // Never pass variable error details through CALLQUERY: constant-size token only.
                                    summary = 'ERR_COUNT=' + scanIssueLines.length;
                                }
                                SQL.executeLibQueryUsingMyCallback(
                                    SQL.getNextTicketID(),
                                    Q.CLOSE_SCAN_LOG,
                                    "'{" + totalTables + "," + totalCols + "," + totalVals + "," + segLimit(retailer_id, 40) + "," + segLimit(user, 40) + "," + segLimit(status, 20) + "," + segLimit(summary, 40) + "}'",
                                    user, sid, lang, req, fr, function() {}
                                );
                            }

                            function scanSchema(idx) {
                                if (idx >= schemas.length) {
                                    finalizeScanLog();
                                    return;
                                }

                                var owner = schemas[idx];
                                var schemaDbLink = resolveGoldDbLink(owner, envRow);
                                if (!schemaDbLink) {
                                    scanHadHardFailure = true;
                                    var linkHint = (owner || '').toUpperCase().endsWith('STK')
                                        ? 'set CORPENV.ENVSTKDBLINK to the stock GOLD link (objects are not on central)'
                                        : 'set CORPENV.ENVDBLINK for central (CEN/GWR)';
                                    recordScanIssue(owner + ': missing DB link — ' + linkHint);
                                    scanSchema(idx + 1);
                                    return;
                                }

                                // ── Step A: fetch tables + Oracle table comments (dynamic @dblink — not LIBQUERY-safe)
                                fetchRemoteAllTables(owner, schemaDbLink, user, sid, lang, req, fr, function (tErr, tables) {
                                        if (tErr) {
                                            scanHadHardFailure = true;
                                            recordScanIssue(owner + ' ALL_TABLES@' + schemaDbLink + ': ' + summarizeErr(tErr));
                                            scanSchema(idx + 1);
                                            return;
                                        }
                                        if (!tables || !tables.length) {
                                            scanHadHardFailure = true;
                                            recordScanIssue(owner + ' ALL_TABLES: 0 rows (link/privileges on ' + schemaDbLink + ')');
                                            scanSchema(idx + 1);
                                            return;
                                        }
                                        totalTables += tables.length;

                                        // Build MERGE tasks — batch of BATCH_SIZE concurrent
                                        var tableTasks = tables.map(function(t) {
                                            return function(done) {
                                                var tname = pickStr(t, "TABLE_NAME", "").trim();
                                                if (!tname) {
                                                    done();
                                                    return;
                                                }
                                                SQL.executeLibQueryUsingMyCallback(
                                                    SQL.getNextTicketID(),
                                                    Q.UPSERT_TABLE,
                                                    "'{" + segLimit(retailer_id, 40) + "," + segLimit(owner, 30) + "," + segLimit(tname, 128) + "," + pickNum(t, "NUM_ROWS", 0) + "," + segLimit(pickStr(t, "TAB_COMMENT", ""), 120) + "}'",
                                                    user, sid, lang, req, fr,
                                                    function(uErr) {
                                                        if (uErr) {
                                                            scanHadHardFailure = true;
                                                            recordScanIssue(owner + '.' + tname + ' AI0000028: ' + summarizeErr(uErr));
                                                        }
                                                        done();
                                                    }
                                                );
                                            };
                                        });

                                        // Run table MERGEs in batches of BATCH_SIZE
                                        runBatch(tableTasks, BATCH_SIZE, function() {

                                            // ── Step B: columns + Oracle column comments
                                            fetchRemoteAllColumns(owner, schemaDbLink, user, sid, lang, req, fr, function (cErr, cols) {
                                                    if (cErr) {
                                                        scanHadHardFailure = true;
                                                        recordScanIssue(owner + ' ALL_TAB_COLUMNS@' + schemaDbLink + ': ' + summarizeErr(cErr));
                                                        scanSchema(idx + 1);
                                                        return;
                                                    }
                                                    if (!cols || !cols.length) {
                                                        scanHadHardFailure = true;
                                                        recordScanIssue(owner + ' ALL_TAB_COLUMNS: 0 rows on ' + schemaDbLink);
                                                        scanSchema(idx + 1);
                                                        return;
                                                    }
                                                    totalCols += cols.length;

                                                    // Build column MERGE tasks
                                                    var colTasks = cols.map(function(c) {
                                                        return function(done) {
                                                            var ctab = pickStr(c, "TABLE_NAME", "").trim();
                                                            var ccol = pickStr(c, "COLUMN_NAME", "").trim();
                                                            if (!ctab || !ccol) {
                                                                done();
                                                                return;
                                                            }
                                                            SQL.executeLibQueryUsingMyCallback(
                                                                SQL.getNextTicketID(),
                                                                Q.UPSERT_COLUMN,
                                                                "'{" + segLimit(retailer_id, 40) + "," + segLimit(owner, 30) + "," + segLimit(ctab, 128) + "," +
                                                                segLimit(ccol, 128) + "," + segLimit(pickStr(c, "DATA_TYPE", "VARCHAR2"), 40) + "," +
                                                                pickNum(c, "DATA_LENGTH", 0) + "," + segLimit(pickStr(c, "NULLABLE", "Y"), 1) + "," +
                                                                pickNum(c, "COLUMN_ID", 0) + "," + segLimit(pickStr(c, "COL_COMMENT", ""), 120) + "}'",
                                                                user, sid, lang, req, fr,
                                                                function(uErr) {
                                                                    if (uErr) {
                                                                        scanHadHardFailure = true;
                                                                        recordScanIssue(owner + '.' + ctab + '.' + ccol + ' AI0000031: ' + summarizeErr(uErr));
                                                                    }
                                                                    done();
                                                                }
                                                            );
                                                        };
                                                    });

                                                    // Run column MERGEs in batches of BATCH_SIZE
                                                    runBatch(colTasks, BATCH_SIZE, function() {

                                                        // ── Step C: sample enum/code columns ──────────
                                                        var codeColTasks = cols
                                                            .filter(function(c) {
                                                                return isCodeColumn(
                                                                    pickStr(c, "COLUMN_NAME", ""),
                                                                    pickStr(c, "DATA_TYPE", ""),
                                                                    pickNum(c, "DATA_LENGTH", 0)
                                                                );
                                                            })
                                                            .map(function(c) {
                                                                return function(done) {
                                                                    var st = pickStr(c, "TABLE_NAME", "").trim();
                                                                    var sc = pickStr(c, "COLUMN_NAME", "").trim();
                                                                    if (!st || !sc) {
                                                                        done();
                                                                        return;
                                                                    }
                                                                    fetchRemoteSampleDistinct(owner, st, sc, schemaDbLink, MAX_SAMPLE, user, sid, lang, req, fr,
                                                                        function (sErr, vals) {
                                                                            if (sErr || !vals) { done(); return; }
                                                                            totalVals += vals.length;

                                                                            var valTasks = vals
                                                                                .filter(function(v) {
                                                                                    var pv = pick(v, "VAL");
                                                                                    return pv !== null && pv !== undefined;
                                                                                })
                                                                                .map(function(v) {
                                                                                    return function(vDone) {
                                                                                        SQL.executeLibQueryUsingMyCallback(
                                                                                            SQL.getNextTicketID(),
                                                                                            Q.UPSERT_SAMPLE_VALUE,
                                                                                            "'{" + segLimit(retailer_id, 40) + "," + segLimit(owner, 30) + "," + segLimit(st, 128) + "," +
                                                                                            segLimit(sc, 128) + "," + segLimit(String(pick(v, "VAL")), 120) + "}'",
                                                                                            user, sid, lang, req, fr,
                                                                                            function() { vDone(); }
                                                                                        );
                                                                                    };
                                                                                });

                                                                            runBatch(valTasks, BATCH_SIZE, function() { done(); });
                                                                        });
                                                                };
                                                            });

                                                        // Sample code columns in batches — then move to next schema
                                                        runBatch(codeColTasks, BATCH_SIZE, function() {
                                                            scanSchema(idx + 1);
                                                        });
                                                    });
                                                });
                                            });
                                        });
                            }

                            scanSchema(0);
                        }
                    );
                }
            );
        });
    };

    module.scanStatus = function () {
        app.get("/api/ai/schema/scan-status", function (req, res) {
            res.setHeader("Access-Control-Allow-Origin", "*");
            const retailer_id = req.query.retailer_id;
            if (!retailer_id) return res.status(400).json({ error: "retailer_id required" });

            const user = req.header("USER") || "SYSTEM";
            const sid  = "'{" + req.header("DATABASE_SID") + "}'";
            const lang = "'{" + req.header("LANGUAGE") + "}'";

            SQL.executeLibQueryUsingMyCallback(
                SQL.getNextTicketID(),
                Q.SCAN_STATUS,
                "'{" + seg(retailer_id) + "}'", user, sid, lang, req, res,
                function (err, data) {
                    if (err) return res.status(500).json({ error: JSON.stringify(err) });
                    return res.status(200).json(data && data[0] ? data[0] : { STATUS: "NEVER_RUN" });
                }
            );
        });
    };

    module.scan();
    module.scanStatus();
    return module;
};
