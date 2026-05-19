"use strict";
module.exports = function (app, SQL) {
    let module = {};
    module.pingDbLink = function () {
        app.post("/api/ai/retailer/ping-dblink", function (req, res) {
            res.setHeader("Access-Control-Allow-Origin", "*");
            const dbLink    = req.body.db_link;
            const goldSchema = req.body.gold_schema;
            if (!dbLink) return res.status(400).json({ success: false,
                checks: [{ label: "DB link provided", status: "FAIL",
                           detail: "db_link is required" }] });
            const pingQ = "SELECT COUNT(*) AS TABLE_COUNT FROM ALL_TABLES@" + dbLink +
                " WHERE TABLE_NAME IN (''ARTUL'',''ARTRAC'',''ARTSITE'',''STOCOUCH'',''STOMVT'')";
            SQL.executeQueryUsingMyCallBack(
                SQL.getNextTicketID(), pingQ, "'{}'",
                req.header("USER") || "SYSTEM",
                "'{" + req.header("DATABASE_SID") + "}'",
                "'{" + req.header("LANGUAGE") + "}'",
                req, res,
                function (err, data) {
                    const tableCount = data && data[0] ? data[0].TABLE_COUNT : 0;
                    const ok = !err;
                    return res.status(200).json({
                        success: ok,
                        dbLink,
                        goldSchema,
                        checks: [
                            { label: "ENVDBLINK set",     status: "OK",  detail: dbLink },
                            { label: "ENVGOLDSCHEMA set", status: goldSchema ? "OK" : "WARN",
                              detail: goldSchema || "Not set" },
                            { label: "DB link reachable",
                              status: ok ? (tableCount >= 3 ? "OK" : "WARN") : "FAIL",
                              detail: ok ? tableCount + " of 5 core GOLD tables found"
                                       : JSON.stringify(err) }
                        ]
                    });
                }
            );
        });
    };
    module.pingDbLink();
    return module;
};
