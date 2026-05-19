/**
 * AI View Controller
 * GET /api/ai/view/status handled by LIBQUERY AI0000006.
 * Only the Oracle stored procedure call remains here.
 *
 * Routes:
 *   POST /api/ai/view/generate — EXEC AI_GENERATE_ACTIVE_ITEM_VIEW (Oracle stored procedure)
 */
"use strict";

module.exports = function (app, SQL) {

    let module = {};

    module.generateView = function () {
        app.post("/api/ai/view/generate", function (req, res) {
            res.setHeader("Access-Control-Allow-Origin", "*");
            const retailer_id = req.body.retailer_id;
            if (!retailer_id) return res.status(400).json({ error: "retailer_id is required" });

            const user = req.header("USER") || "SYSTEM";

            // Oracle stored procedure — single quotes must be doubled inside EXECUTEQUERY wrapper
            const execQ = "BEGIN AI_GENERATE_ACTIVE_ITEM_VIEW(''" + retailer_id + "''); END;";

            SQL.executeQueryUsingMyCallBack(
                SQL.getNextTicketID(), execQ, "'{}'", user,
                "'{" + req.header("DATABASE_SID") + "}'",
                "'{" + req.header("LANGUAGE") + "}'",
                req, res,
                function (err) {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            retailer_id,
                            error: JSON.stringify(err),
                            hint: "Ensure ITEM_ACTIVE is locked in AI_RETAILER_CONTEXT " +
                                  "and CORPENV.ENVDBLINK is set for this retailer."
                        });
                    }
                    const viewName = "V_GOLD_ACTIVE_ITEM_" + retailer_id.toUpperCase();
                    return res.status(200).json({
                        success: true,
                        retailer_id,
                        view_name: viewName,
                        message: viewName + " generated successfully."
                    });
                }
            );
        });
    };

    module.generateView();
    return module;
};
