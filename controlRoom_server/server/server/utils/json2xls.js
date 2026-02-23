"use strict";

const JSZip = require('jszip'); // already bundled as ExcelJS dependency

let heap = {
    logger: require("../utils/logger.js"),
    excel : require('exceljs'),
    TABLE_HEADER : 4
}

/**
 * Sub-function to autofitColums function
 */
function eachColumnInRange(ws, col1, col2, cb){
    for(let c = col1; c <= col2; c++){
        cb(ws.getColumn(c));
    }
}

/**
 * Function autofitColumns auto-adjust the length of the cell accordingly to the column max length
 * OPTIMIZED: For large datasets (>1000 rows), sample only first 1000 rows instead of all rows
 */
function autofitColumns(ws, rowCount){
    let sampleSize;
    if (rowCount <= 1000) {
        sampleSize = rowCount;
    } else if (rowCount <= 10000) {
        sampleSize = 1000;
    } else if (rowCount <= 50000) {
        sampleSize = 500;
    } else {
        sampleSize = 300;
    }
    
    if (rowCount > 1000) {
        heap.logger.log('alert', `[AUTOFIT] Sampling ${sampleSize} of ${rowCount} rows for column width calculation`, 'alert', 1);
    }
    
    const startTime = Date.now();
    
    eachColumnInRange(ws, 1, ws.columnCount, column => {
        let maxWidth=10;
        let cellCount = 0;
        column.eachCell( cell => {
            cellCount++;
            if (cellCount > sampleSize + 5) return;
            if( !cell.isMerged && cell.value ){
                let text = "";
                if( typeof cell.value != "object" ){
                    text = cell.value.toString();
                } else if( cell.value.richText ){
                    text = cell.value.richText.reduce((text, obj)=>text+obj.text.toString(),"");
                }
                let values = text.split(/[\n\r]+/);
                let width;
                for( let value of values ){
                    width = value.length;
                    if(cell.font && cell.font.bold){
                        width *= 1.08;
                    }
                    maxWidth = Math.max(maxWidth, width);
                }
            }
        });
        maxWidth += 0.71;
        maxWidth += 1;
        column.width = maxWidth;
    });
    
    if (rowCount > 1000) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        heap.logger.log('alert', `[AUTOFIT] Completed in ${duration}s (sampled ${sampleSize} rows)`, 'alert', 1);
    }
}

/**
 * Function setPageBreak define the page Break in the Excel file
 */
function setPageBreak(ws, alertData, alert) {
    let rowBreak = 0;
    if (alert.ALTXLSBREAK) {
        let xlsBreak=JSON.parse(alert.ALTXLSBREAK);
        for (let i=0; i <  xlsBreak.pageBreak.length ; i ++) {
            if (xlsBreak.pageBreak[i].hasOwnProperty('every')) {
                for(let j = xlsBreak.pageBreak[i].row; j < alertData.length; j += every) {
                    rowBreak = +xlsBreak.pageBreak[i].row;
                    ws.getRow(rowBreak+j).addPageBreak();
                }
            }
            else {
                rowBreak = +xlsBreak.pageBreak[i].row;
                ws.getRow(rowBreak).addPageBreak();
            }
        }
    }            
}

/**
 * Function setPrintArea define the printing area and orientation defined in the alert Header
 */
function setPrintArea(ws, alert) {
    if (alert.ALTORIENTATION) {
        ws.pageSetup.orientation = alert.ALTORIENTATION;
    }
    ws.pageSetup.fitToPage = false;
    if (alert.ALTFITPAGE) {
        ws.pageSetup.fitToPage = alert.ALTFITPAGE === 1;
        if (ws.pageSetup.fitToPage) {
            ws.pageSetup.fitToHeight = alert.ALTFITHEIGHT;
            ws.pageSetup.fitToWidth = alert.ALTFITWIDTH;
        }
        else {
            if (alert.ALTSCALE) {
                ws.pageSetup.scale = alert.ALTSCALE;
            }
        }
    }
    else {
        ws.pageSetup.fitToPage = false;
        ws.pageSetup.fitToHeight = '';
        ws.pageSetup.fitToWidth = '';
    }
    if (alert.ALTTITLEREPEAT) {
        ws.pageSetup.printTitlesRow = alert.ALTTITLEREPEAT;
    }
    if (alert.ALTFOOTER) {
        ws.headerFooter.oddFooter = alert.ALTFOOTER;
    }
    if (alert.ALTPRINTAREA) {
        if (! ws.pageSetup.fitToPage) {
            ws.pageSetup.fitToHeight = '';
            ws.pageSetup.fitToWidth = '';
        }
        ws.pageSetup.printArea = alert.ALTPRINTAREA;
    }

    if (alert.ALTMARGIN) {
        try {
            let margins;
            if (typeof alert.ALTMARGIN === 'string') {
                try {
                    margins = JSON.parse(alert.ALTMARGIN);
                } catch (jsonErr) {
                    const normalized = alert.ALTMARGIN
                        .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
                    margins = JSON.parse(normalized);
                }
            } else if (typeof alert.ALTMARGIN === 'object') {
                margins = alert.ALTMARGIN;
            }
            if (margins && typeof margins === 'object') {
                const requiredProps = ['left', 'right', 'top', 'bottom'];
                const hasAllProps = requiredProps.every(prop => 
                    margins.hasOwnProperty(prop) && typeof margins[prop] === 'number'
                );
                if (hasAllProps) {
                    ws.pageSetup.margins = margins;
                } else {
                    throw new Error('Missing required margin properties');
                }
            } else {
                throw new Error('Invalid margins object');
            }
        } catch (parseError) {
            heap.logger.log('alert', 
                `ALTMARGIN parse error: ${parseError.message} | ` +
                `Type: ${typeof alert.ALTMARGIN} | ` +
                `Value: ${JSON.stringify(alert.ALTMARGIN).substring(0, 100)}`, 
                'alert', 3);
            ws.pageSetup.margins = { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 };
        }
    }

    if (ws.pageSetup.margins) {
        const margins = ws.pageSetup.margins;
        ws.pageSetup.margins = {
            left: parseFloat(margins.left) || 0.7,
            right: parseFloat(margins.right) || 0.7,
            top: parseFloat(margins.top) || 0.75,
            bottom: parseFloat(margins.bottom) || 0.75,
            header: parseFloat(margins.header) || 0.3,
            footer: parseFloat(margins.footer) || 0.3
        };
    }
    if (ws.pageSetup.horizontalDpi && (ws.pageSetup.horizontalDpi > 1200 || ws.pageSetup.horizontalDpi < 0)) {
        delete ws.pageSetup.horizontalDpi;
    }
    if (ws.pageSetup.verticalDpi && (ws.pageSetup.verticalDpi > 1200 || ws.pageSetup.verticalDpi < 0)) {
        delete ws.pageSetup.verticalDpi;
    }
    if (ws.pageSetup.scale) {
        ws.pageSetup.scale = parseInt(ws.pageSetup.scale) || 100;
    }
    if (ws.pageSetup.fitToWidth) {
        ws.pageSetup.fitToWidth = parseInt(ws.pageSetup.fitToWidth) || 1;
    }
    if (ws.pageSetup.fitToHeight) {
        ws.pageSetup.fitToHeight = parseInt(ws.pageSetup.fitToHeight) || 1;
    }
}

function lettersToNumber(letters){
    let chrs = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ', mode = chrs.length - 1, number = 0;
    for(let p = 0; p < letters.length; p++){
        number = number * mode + chrs.indexOf(letters[p]);
    }
    return number;
}

/********************************************************************************************/

/**
 * Function formatXLS define the conditional rule in FormatRule for the worksheet
 *
 * FIX — CF rule explosion (was causing 18 000+ rules on filtered sheets):
 *
 *   Root cause 1 — formulae rules (static ref like "G5:G99999") were being
 *   added inside the per-row k-loop, producing N identical CF entries where
 *   N = row count.  Fix: collect them in a dedup map and add ONCE after the
 *   loop.
 *
 *   Root cause 2 — style/cfvo rules used a per-row ref (A6:D6, A7:D7 …),
 *   creating one CF entry per row.  Fix: build a single consolidated range
 *   ref (A6:D2263) covering all rows and add ONE entry.  Excel's relative
 *   formula evaluation makes this equivalent to the old per-row behaviour.
 *
 *   The direct cell-style path (condRule.style — writes dxf, not CF XML)
 *   is unchanged; it must still iterate rows.
 */
function formatXLS (worksheet, dataRows, formatRule) {
    heap.logger.log('alert', 'Formatting EXCEL file : ' + formatRule, 'alert', 1);
    if (formatRule) {
        try {
            formatRule = formatRule.replace('}null','}\n');
            let cellRuleXLS=JSON.parse(formatRule);
            if(cellRuleXLS != null) {

                // conditionalRule is optional — a preFilter-only config won't have it
                if (!Array.isArray(cellRuleXLS.conditionalRule) || cellRuleXLS.conditionalRule.length === 0) {
                    heap.logger.log('alert', '[FORMAT] No conditionalRule found — skipping conditional formatting', 'alert', 1);
                    return;
                }

                heap.logger.log('alert', 'conditionalRule EXCEL : ' + JSON.stringify(cellRuleXLS.conditionalRule), 'alert', 1);

                for (let i = 0; i < cellRuleXLS.conditionalRule.length; i++) {
                    const condRule = cellRuleXLS.conditionalRule[i];
                    const easeRule = condRule.easeRule;

                    let row   = 0;
                    let maxRow = 1;
                    let every  = 1;

                    if (easeRule.repeat === '1') {
                        row    = +easeRule.lineStart;
                        maxRow = easeRule.hasOwnProperty('lineStop')
                                    ? +easeRule.lineStop + 1
                                    : dataRows.length + row + 1;
                        every  = +easeRule.every;
                    }

                    // ── FIX: one consolidated ref for the full repeating range ──────
                    // Used for style/cfvo CF rules that previously fired per-row.
                    // For non-repeat rules (maxRow === 1) this resolves to a single row
                    // ref, which is the same as before.
                    const consolidatedRef = easeRule.columnStart + row + ':' +
                                            easeRule.columnEnd   + (maxRow - 1);

                    // ── FIX: dedup map for formulae-type rules (static ref) ──────────
                    // Key = ref + serialised rule so two genuinely different rules on
                    // the same ref are both preserved.
                    const formulaeAdded = new Map();

                    if (condRule.hasOwnProperty('rules')) {
                        for (let j = 0; j < condRule.rules.length; j++) {
                            for (let l = 0; l < condRule.rules[j].rule.length; l++) {
                                const rule = condRule.rules[j].rule[l];

                                // ── formulae rules: add ONCE (deduped by ref + body) ──
                                if (rule.hasOwnProperty('formulae')) {
                                    const dedupKey = condRule.rules[j].ref + '|' + JSON.stringify(rule);
                                    if (!formulaeAdded.has(dedupKey)) {
                                        formulaeAdded.set(dedupKey, true);
                                        worksheet.addConditionalFormatting({
                                            ref: condRule.rules[j].ref,
                                            rules: [{
                                                type    : rule.type,
                                                formulae: rule.formulae,
                                                style   : rule.style
                                            }]
                                        });
                                    }
                                    continue; // do NOT fall through to style/cfvo checks
                                }

                                // ── style rules: one consolidated range, not per-row ──
                                if (rule.hasOwnProperty('style')) {
                                    worksheet.addConditionalFormatting({
                                        ref  : consolidatedRef,
                                        rules: [{
                                            type    : rule.type,
                                            operator: rule.operator,
                                            text    : rule.text,
                                            style   : rule.style
                                        }]
                                    });
                                    continue;
                                }

                                // ── cfvo rules: one consolidated range, not per-row ──
                                if (rule.hasOwnProperty('cfvo')) {
                                    worksheet.addConditionalFormatting({
                                        ref  : consolidatedRef,
                                        rules: [{
                                            type    : rule.type,
                                            operator: rule.operator,
                                            cfvo    : rule.cfvo,
                                            color   : rule.color
                                        }]
                                    });
                                }
                            }
                        }
                    }

                    // ── Direct cell-style path (condRule.style) — unchanged ──────────
                    // This writes actual dxf cell styles (not CF XML entries) so it
                    // must still iterate over every row.  It does not contribute to the
                    // CF rule count in the XLSX and is safe to leave as-is.
                    if (condRule.hasOwnProperty('style')) {
                        for (let k = row; k < maxRow; k += every) {
                            const rowChange = worksheet.getRow(k);
                            for (let m = lettersToNumber(easeRule.columnStart);
                                     m <= lettersToNumber(easeRule.columnEnd); m++) {
                                if (condRule.style.hasOwnProperty('alignment')) {
                                    rowChange.getCell(m).alignment = condRule.style.alignment;
                                } else {
                                    rowChange.getCell(m).style = condRule.style;
                                    if (condRule.style.numFmt) {
                                        rowChange.getCell(m).numFmt = condRule.style.numFmt;
                                    }
                                }
                            }
                        }
                    }
                }

                heap.logger.log('alert', '[FORMAT] Conditional formatting applied successfully', 'alert', 1);
            }
        }
        catch (e) {
            heap.logger.log('alert', "Error format " + formatRule + e, 'alert', 3);
        }
    }
}

/********************************************************************************************/
/*  PRE-FILTER — OOXML INJECTION APPROACH                                                   */
/*                                                                                          */
/*  How it works:                                                                           */
/*    1. json2xls() calls resolvePreFilters() to translate the preFilter JSON config        */
/*       into concrete { colIdx, filterValues } descriptors and stores them on              */
/*       workbook._preFilterDefs (one entry per table/sheet).                               */
/*                                                                                          */
/*    2. The caller replaces workbook.xlsx.writeBuffer() with writeBufferWithFilters().     */
/*       That function writes the buffer normally, then pipes it through                    */
/*       injectAutoFilters() which:                                                         */
/*         - Opens the XLSX zip with JSZip                                                  */
/*         - Locates the table XML file matching each registered tableName                  */
/*         - Expands the <autoFilter/> self-closing element into a full element             */
/*           with <filterColumn><filters><filter val="..."/> children                       */
/*         - Repacks the ZIP and returns the modified buffer                                */
/*                                                                                          */
/*  Result: native Excel autoFilter state — dropdown shows active filter indicator,         */
/*  no row.hidden flags, zero scroll lag regardless of row count.                           */
/********************************************************************************************/

/**
 * Format a JS Date to match the Oracle/display date format used in cell data.
 * Supports tokens: MM, DD, RRRR, RR
 * @param {Date}   date
 * @param {string} fmt  - Oracle-style format string e.g. 'MM/DD/RRRR'
 * @returns {string}
 */
function formatDateForFilter(date, fmt) {
    const pad = n => String(n).padStart(2, '0');
    const y4  = date.getFullYear();
    const y2  = String(y4).slice(-2);
    const m   = pad(date.getMonth() + 1);
    const d   = pad(date.getDate());
    return (fmt || 'MM/DD/RR')
        .replace('RRRR', y4)   // must come before 'RR'
        .replace('RR',   y2)
        .replace('MM',   m)
        .replace('DD',   d);
}

/**
 * Escape special XML characters in filter values.
 * Required so values like "B&B Foods" don't break the injected XML.
 * @param {string} str
 * @returns {string}
 */
function escapeXml(str) {
    return String(str)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&apos;');
}

/**
 * resolvePreFilters — Translate the raw preFilter JSON config into concrete
 * filter descriptors ready for XML injection.
 *
 * JSON schema (inside the formatRule object):
 * "preFilter": [
 *   {
 *     "columnName": "Hole date",    // display column name (after rename) — preferred
 *     "column"    : "C",            // column letter fallback if columnName not found
 *     "type"      : "today",        // "today" | "value"
 *     "dateFormat": "MM/DD/RRRR"    // Oracle-style fmt matching the cell value string
 *   },
 *   {
 *     "columnName": "Dept.",
 *     "type"      : "value",
 *     "values"    : ["Grocery", "Dairy"]   // OR within same column
 *   },
 *   {
 *     "columnName": "Last delivery status",
 *     "type"      : "value",
 *     "value"     : "NOT ORDERED"          // single value shorthand
 *   }
 * ]
 *
 * Multiple entries = AND logic at row level.
 * Multiple values within one entry = OR logic within that column.
 *
 * @param {Array} dataColumns - [{name, filterButton}] after rename
 * @param {Array} preFilters  - raw preFilter array from JSON
 * @returns {Array} resolved filter descriptors [{colIdx, colLabel, filterValues, dateFormat}]
 */
function resolvePreFilters(dataColumns, preFilters) {
    const resolved = [];

    for (const filter of preFilters) {
        try {
            // Resolve column index (1-based)
            let colIdx = -1;
            if (filter.columnName) {
                for (let i = 0; i < dataColumns.length; i++) {
                    if (dataColumns[i].name === filter.columnName) {
                        colIdx = i + 1;
                        break;
                    }
                }
            }
            if (colIdx === -1 && filter.column) {
                colIdx = lettersToNumber(filter.column.toUpperCase());
            }
            if (colIdx === -1) {
                heap.logger.log('alert',
                    `[PREFILTER] Column not found: "${filter.columnName || filter.column}" — skipping`,
                    'alert', 3);
                continue;
            }

            const colLabel = filter.columnName || filter.column || `col${colIdx}`;
            const fmt      = filter.dateFormat || 'MM/DD/RR';
            let filterValues = [];

            if (filter.type === 'today') {
                filterValues = [ formatDateForFilter(new Date(), fmt) ];
                heap.logger.log('alert',
                    `[PREFILTER] "${colLabel}" — "today" → "${filterValues[0]}" (fmt: ${fmt})`,
                    'alert', 1);
            } else if (filter.type === 'value') {
                if (Array.isArray(filter.values)) {
                    filterValues = filter.values.map(String);
                } else if (filter.value !== undefined) {
                    filterValues = [ String(filter.value) ];
                }
            } else {
                heap.logger.log('alert',
                    `[PREFILTER] Unknown type "${filter.type}" for "${colLabel}" — skipping`,
                    'alert', 3);
                continue;
            }

            if (filterValues.length === 0) {
                heap.logger.log('alert',
                    `[PREFILTER] No values resolved for "${colLabel}" — skipping`,
                    'alert', 3);
                continue;
            }

            heap.logger.log('alert',
                `[PREFILTER] "${colLabel}" (col ${colIdx}) → [${filterValues.join(' | ')}]`,
                'alert', 1);

            resolved.push({ colIdx, colLabel, filterValues, dateFormat: fmt });

        } catch (e) {
            heap.logger.log('alert', `[PREFILTER] Error resolving filter: ${e.message}`, 'alert', 3);
        }
    }

    return resolved;
}

/**
 * injectFilterColumnsIntoTableXml — Injects <filterColumn> children into the
 * <autoFilter> element of a table XML string.
 *
 * ExcelJS writes the table autoFilter as self-closing:
 *   <autoFilter ref="A5:V150"/>
 *
 * We expand it to the full OOXML filter state that Excel produces natively:
 *   <autoFilter ref="A5:V150">
 *     <filterColumn colId="1">
 *       <filters>
 *         <filter val="02/22/2026"/>
 *       </filters>
 *     </filterColumn>
 *   </autoFilter>
 *
 * colId is 0-based from the start of the autoFilter range.
 * Our table always starts at column A (ref "A5:..."), so colId = colIdx - 1.
 *
 * @param {string} tableXml       - raw XML string of the table file
 * @param {Array}  resolvedFilters - output of resolvePreFilters()
 * @returns {string} modified XML
 */
function injectFilterColumnsIntoTableXml(tableXml, resolvedFilters) {
    const filterColumnsXML = resolvedFilters.map(rf => {
        const valuesXML = rf.filterValues
            .map(v => `<filter val="${escapeXml(v)}"/>`)
            .join('');
        return `<filterColumn colId="${rf.colIdx - 1}"><filters>${valuesXML}</filters></filterColumn>`;
    }).join('');

    // Case 1: self-closing autoFilter — the ExcelJS default output
    const selfClosing = /<autoFilter([^>]*?)\/>/;
    if (selfClosing.test(tableXml)) {
        heap.logger.log('alert',
            '[PREFILTER] XML — expanding self-closing <autoFilter/> with filterColumns', 'alert', 1);
        return tableXml.replace(
            selfClosing,
            `<autoFilter$1>${filterColumnsXML}</autoFilter>`
        );
    }

    // Case 2: autoFilter already has content (re-inject overwrites it cleanly)
    const withContent = /<autoFilter([^>]*?)>[\s\S]*?<\/autoFilter>/;
    if (withContent.test(tableXml)) {
        heap.logger.log('alert',
            '[PREFILTER] XML — replacing existing <autoFilter> content with filterColumns', 'alert', 1);
        return tableXml.replace(
            withContent,
            `<autoFilter$1>${filterColumnsXML}</autoFilter>`
        );
    }

    heap.logger.log('alert',
        '[PREFILTER] XML — no <autoFilter> element found in table XML, cannot inject', 'alert', 3);
    return tableXml;
}

/**
 * injectHiddenRowsIntoSheetXml — Adds hidden="1" to non-matching rows in the
 * worksheet XML so Excel hides them immediately on open.
 *
 * ExcelJS writes data rows like:
 *   <row r="6" spans="1:3" x14ac:dyDescent="0.25">
 * or self-closing:
 *   <row r="6" spans="1:3"/>
 *
 * We add hidden="1" to each row whose r attribute is in hiddenRows.
 * Rows that already have hidden="1" are left unchanged (idempotent).
 *
 * @param {string} sheetXml  - raw XML of xl/worksheets/sheetN.xml
 * @param {Set}    hiddenRows - Set of Excel row numbers (1-based) to hide
 * @returns {string} modified XML
 */
function injectHiddenRowsIntoSheetXml(sheetXml, hiddenRows) {
    if (!hiddenRows || hiddenRows.size === 0) return sheetXml;

    let hiddenCount = 0;

    // Match every <row ...> opening tag (both regular and self-closing)
    const result = sheetXml.replace(/<row r="(\d+)"([^>]*?)(\/?>)/g, (match, rowNum, attrs, closing) => {
        if (!hiddenRows.has(Number(rowNum))) return match;    // not in hide list
        if (attrs.includes('hidden="1"'))    return match;    // already hidden

        hiddenCount++;
        return `<row r="${rowNum}"${attrs} hidden="1"${closing}`;
    });

    heap.logger.log('alert',
        `[PREFILTER] Sheet XML — marked ${hiddenCount} of ${hiddenRows.size} rows as hidden="1"`,
        'alert', 1);

    return result;
}

/**
 * injectAutoFilters — Post-processes an XLSX buffer to write native Excel
 * autoFilter XML directly into the table and worksheet files inside the ZIP.
 *
 * Two injections per filter def:
 *   1. xl/tables/tableN.xml   → <filterColumn> inside <autoFilter> (dropdown indicator)
 *   2. xl/worksheets/sheetN.xml → hidden="1" on non-matching rows (visual hiding on open)
 *
 * Both together produce the same state Excel writes when you filter manually.
 *
 * @param {Buffer} xlsxBuffer    - from workbook.xlsx.writeBuffer() or readFile(tempFile)
 * @param {Array}  preFilterDefs - [{tableName, resolvedFilters, hiddenRows, worksheetIndex}]
 * @returns {Promise<Buffer>}
 */
async function injectAutoFilters(xlsxBuffer, preFilterDefs) {
    if (!preFilterDefs || preFilterDefs.length === 0) return xlsxBuffer;

    const zip        = await JSZip.loadAsync(xlsxBuffer);
    const tableFiles = Object.keys(zip.files).filter(f =>
        /^xl\/tables\/table\d+\.xml$/i.test(f)
    );

    heap.logger.log('alert',
        `[PREFILTER] injectAutoFilters — ${tableFiles.length} table file(s) in XLSX, ` +
        `${preFilterDefs.length} filter def(s) to process`,
        'alert', 1);

    for (const def of preFilterDefs) {

        // ── Step 1: inject <filterColumn> into table XML ──────────────────────
        let tableMatched = false;

        for (const tableFile of tableFiles) {
            let tableXml = await zip.files[tableFile].async('string');

            if (!tableXml.includes(`displayName="${def.tableName}"`) &&
                !tableXml.includes(`name="${def.tableName}"`)) {
                continue;
            }

            heap.logger.log('alert',
                `[PREFILTER] Matched table "${def.tableName}" → ${tableFile}`,
                'alert', 1);

            tableXml = injectFilterColumnsIntoTableXml(tableXml, def.resolvedFilters);
            zip.file(tableFile, tableXml);
            tableMatched = true;
            break;
        }

        if (!tableMatched) {
            heap.logger.log('alert',
                `[PREFILTER] Table "${def.tableName}" not found in any table XML file — filter indicator not injected`,
                'alert', 3);
        }

        // ── Step 2: inject hidden="1" into worksheet XML ──────────────────────
        if (def.hiddenRows && def.hiddenRows.size > 0) {
            const sheetFile = `xl/worksheets/sheet${def.worksheetIndex}.xml`;

            if (zip.files[sheetFile]) {
                let sheetXml = await zip.files[sheetFile].async('string');
                sheetXml = injectHiddenRowsIntoSheetXml(sheetXml, def.hiddenRows);
                zip.file(sheetFile, sheetXml);
                heap.logger.log('alert',
                    `[PREFILTER] Patched worksheet ${sheetFile} — ${def.hiddenRows.size} rows hidden`,
                    'alert', 1);
            } else {
                heap.logger.log('alert',
                    `[PREFILTER] Worksheet file ${sheetFile} not found in XLSX zip`,
                    'alert', 3);
            }
        } else {
            heap.logger.log('alert',
                `[PREFILTER] Table "${def.tableName}" — all rows pass filter, no rows to hide`,
                'alert', 1);
        }
    }

    const modifiedBuffer = await zip.generateAsync({
        type              : 'nodebuffer',
        compression       : 'DEFLATE',
        compressionOptions: { level: 6 }
    });

    heap.logger.log('alert',
        `[PREFILTER] injectAutoFilters done — buffer: ${modifiedBuffer.length} bytes`,
        'alert', 1);

    return modifiedBuffer;
}

/**
 * writeBufferWithFilters — Drop-in replacement for workbook.xlsx.writeBuffer().
 *
 * Change this:
 *   const buffer = await workbook.xlsx.writeBuffer();
 *
 * To this:
 *   const buffer = await writeBufferWithFilters(workbook);
 *
 * If no preFilter was configured on any sheet, it behaves identically to
 * workbook.xlsx.writeBuffer() with zero overhead.
 *
 * @param {object} workbook - ExcelJS workbook (after all json2xls() calls are done)
 * @returns {Promise<Buffer>}
 */
async function writeBufferWithFilters(workbook) {
    const buffer = await workbook.xlsx.writeBuffer();

    if (!workbook._preFilterDefs || workbook._preFilterDefs.length === 0) {
        heap.logger.log('alert',
            '[PREFILTER] writeBufferWithFilters — no preFilter defs, returning buffer as-is',
            'alert', 1);
        return buffer;
    }

    heap.logger.log('alert',
        `[PREFILTER] writeBufferWithFilters — injecting filters for ${workbook._preFilterDefs.length} table(s)`,
        'alert', 1);

    return injectAutoFilters(buffer, workbook._preFilterDefs);
}

/********************************************************************************************/

/**
 * Function setXLSHeader define top X rows header in the template report
 */
function setXLSHeader(worksheet, alertData, extensionHeader) {
    let tableRow = heap.TABLE_HEADER;

    worksheet.getCell('B2').value = 'Report Title';
    worksheet.getCell('C2').value = alertData[0].ALTSUBJECT + ' ' + extensionHeader;
    worksheet.getCell('C3').value = alertData[0].ALTCONTENT;
    worksheet.mergeCells('C2','G2');
    worksheet.mergeCells('C3','G3');

    worksheet.getCell('H2').value = 'Report ID';
    worksheet.getCell('I2').value = alertData[0].ALTID;
    worksheet.mergeCells('I2','K2');
    worksheet.mergeCells('I3','K3');
    worksheet.getCell('H3').value = 'Report date';
    worksheet.getCell('I3').value = new Date(); 
    worksheet.getCell('I2').alignment = { vertical: 'top', horizontal: 'left' };
    worksheet.getCell('I3').alignment = { vertical: 'top', horizontal: 'left' };

    for (let i = 0; i< tableRow; i ++) {
        worksheet.getRow(i).fill = {
            type: 'pattern',
            pattern:'lightTrellis',
            fgColor:{argb:'FFFFFFFF'},
            bgColor:{argb:'FF002060'}
        };
    }

    worksheet.getCell('B2').font = { name: 'Arial', family: 4, color: { argb: 'FFFFFFFF' }, size: 11, underline: false, bold: true };
    worksheet.getCell('H2').font = worksheet.getCell('B2').font;
    worksheet.getCell('H3').font = worksheet.getCell('B2').font;
    worksheet.getCell('C2').font = { name: 'Arial', family: 4, color: { argb: 'FFFFFFFF' }, size: 14, underline: false, bold: true };
    worksheet.getCell('C3').font = { name: 'Arial', family: 4, color: { argb: '000000' },   size: 14, underline: false, bold: false };
    worksheet.getCell('I2').font = worksheet.getCell('C2').font;
    worksheet.getCell('I3').font = worksheet.getCell('C2').font;
}

/**
 * Function setXLSProperties define the EXCEL file property
 */
function setXLSProperties(workbook) {
    workbook.creator = 'B&B SYMPHONY LLC';
    workbook.lastModifiedBy = 'B&B SYMPHONY LLC';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.lastPrinted = new Date();
    workbook.calcProperties.fullCalcOnLoad = true;
}

/********************************************************************************************/

function json2xls(workbook, worksheet, alertData, detailData, extensionHeader, tableName, formatingRules, renameColumn) {
    let valueColumns = Object.keys(detailData[0] || {});
    let dataColumns = [];
    let colMove = null;
    renameColumn = renameColumn || [];

    if ( alertData[0].ALTCOLMOVE) {
        let element;
        let colMove=JSON.parse(alertData[0].ALTCOLMOVE);
        for (let j=0; j < colMove.move2end.length ; j++) {
            element = valueColumns[colMove.move2end[j]-j];
            valueColumns.splice(colMove.move2end[j]-j,1);
            valueColumns.splice(valueColumns.length,0, element);
        }
    }

    for(let i =0;i < valueColumns.length ; i ++) {
        dataColumns.push({name: valueColumns[i], filterButton: true});
    }

    /* Rename columns */
    for (let i=0; i<renameColumn.length; i++) {
        let k = lettersToNumber(renameColumn[i].RENAMECOL);
        dataColumns[k-1].name=renameColumn[i].COLNAME;
    }

    // Add rows detail
    let dataRows = [];
    
    if (alertData[0].ALTCOLMOVE) {
        colMove = JSON.parse(alertData[0].ALTCOLMOVE);
        heap.logger.log('alert', `[COLMOVE] Moving ${colMove.move2end.length} columns to end for ${detailData.length} rows`, 'alert', 1);
        
        const moveIndices = colMove.move2end.map(idx => idx - 1);
        const keepIndices = [];
        const movedIndices = [];
        
        for (let i = 0; i < valueColumns.length; i++) {
            if (moveIndices.includes(i)) {
                movedIndices.push(i);
            } else {
                keepIndices.push(i);
            }
        }
        
        heap.logger.log('alert', `[COLMOVE] Calculated reordering: ${keepIndices.length} kept, ${movedIndices.length} moved`, 'alert', 1);
        const startTime = Date.now();
        
        for (let i = 0; i < detailData.length; i++) {
            const values = Object.values(detailData[i]);
            const reordered = [];
            for (const idx of keepIndices)  reordered.push(values[idx]);
            for (const idx of movedIndices) reordered.push(values[idx]);
            dataRows.push(reordered);
        }
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        heap.logger.log('alert', `[COLMOVE] Reordered ${detailData.length} rows in ${duration}s`, 'alert', 1);
    } else {
        const startTime = Date.now();
        for (let i = 0; i < detailData.length; i++) {
            dataRows.push(Object.values(detailData[i]));
        }
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        if (detailData.length > 1000) {
            heap.logger.log('alert', `[ROWS] Built ${detailData.length} rows in ${duration}s`, 'alert', 1);
        }
    }

    setXLSHeader(worksheet, alertData, extensionHeader);

    try {
        if (alertData[0].ALTTITLEXLS) {
            worksheet.getCell('A4').value = Object.values(detailData[alertData[0].ALTTITLEXLS])[0];
            worksheet.getCell('A4').font = {
                name: 'Arial', family: 4, color: { argb: alertData[0].ALTTITLEXLSCOLOR },
                size: 18, underline: false, bold: true
            };
            worksheet.mergeCells('A4:J4');
            worksheet.getCell('A4').alignment = { vertical: 'middle', horizontal: 'left' };
            dataRows.splice(alertData[0].ALTTITLEXLS, 1);
        }
    }
    catch(e) {
        heap.logger.log('alert', e, 'alert', 3);
    }

    /**************************************************************************/  
    if (dataRows.length == 0) {
        worksheet.getCell('A6').value = 'No reported elements';
        worksheet.getCell('A6').font = { name: 'Arial', family: 4, size: 10, underline: false, bold: true };
    }
    else {
        worksheet.addTable({
            name: tableName,
            ref: 'A5',
            headerRow: true,
            totalsRow: true,
            style: {
                theme: alertData[0].ALTBORDER === 1 ? 'TableStyleLight1' : 'TableStyleLight1',
                showRowStripes: true,
            },
            columns: [...dataColumns],  // Spread IS needed - cleanup code empties original arrays!
            rows: [...dataRows]          // Spread IS needed - cleanup code empties original arrays!
        });
        
        if (alertData[0].ALTBORDER === 1) {
            heap.logger.log('alert', `[BORDERS] Using TableStyleLight1 for ${dataRows.length} rows`, 'alert', 1);
        }
    }

    // ── Conditional formatting ────────────────────────────────────────────────
    try {
        if (formatingRules) {
            formatXLS(worksheet, dataRows, formatingRules);
        }
    } catch (err) {
        heap.logger.log('alert', 'Error formatting XLS ' + JSON.stringify(err.message), 'alert', 3);
    }

    // ── Pre-filters: resolve and register for post-writeBuffer OOXML injection ─
    //
    // No row hiding is done here. Filter values are resolved now (while
    // dataColumns is still available) and stored on workbook._preFilterDefs.
    // The actual XML injection happens in writeBufferWithFilters() after the
    // full workbook has been serialised — at that point we can open the XLSX
    // zip and patch the table XML directly.
    //
    // Caller must use writeBufferWithFilters(workbook) instead of
    // workbook.xlsx.writeBuffer() to activate the injection.
    try {
        if (formatingRules && dataRows.length > 0) {
            let parsedRules = null;
            try {
                parsedRules = JSON.parse(formatingRules.replace('}null', '}\n'));
            } catch (parseErr) { /* already logged by formatXLS */ }

            if (parsedRules && Array.isArray(parsedRules.preFilter) && parsedRules.preFilter.length > 0) {
                const resolvedFilters = resolvePreFilters(dataColumns, parsedRules.preFilter);
                if (resolvedFilters.length > 0) {
                    // Pre-compute which Excel rows must be hidden while dataRows is still in memory.
                    // Table header is at row (TABLE_HEADER + 1) = row 5, data starts at row 6.
                    const DATA_START_ROW = heap.TABLE_HEADER + 2; // = 6
                    const hiddenRows = new Set();

                    for (let i = 0; i < dataRows.length; i++) {
                        let passesAll = true;
                        for (const rf of resolvedFilters) {
                            const filterSet = new Set(rf.filterValues.map(v => v.toUpperCase()));
                            const cellVal   = dataRows[i][rf.colIdx - 1];
                            const cellStr   = (cellVal !== null && cellVal !== undefined)
                                ? String(cellVal).trim()
                                : '';
                            if (!filterSet.has(cellStr.toUpperCase())) {
                                passesAll = false;
                                break;
                            }
                        }
                        if (!passesAll) hiddenRows.add(DATA_START_ROW + i);
                    }

                    // Worksheet index (1-based) — ExcelJS adds sheets in order,
                    // so sheet N maps to xl/worksheets/sheetN.xml
                    const worksheetIndex = workbook.worksheets.length;

                    workbook._preFilterDefs = workbook._preFilterDefs || [];
                    workbook._preFilterDefs.push({ tableName, resolvedFilters, hiddenRows, worksheetIndex });
                    heap.logger.log('alert',
                        `[PREFILTER] Registered ${resolvedFilters.length} filter(s) for table "${tableName}" ` +
                        `| sheet index: ${worksheetIndex} | rows to hide: ${hiddenRows.size}`,
                        'alert', 1);
                }
            }
        }
    } catch (err) {
        heap.logger.log('alert', 'Error resolving preFilters ' + JSON.stringify(err.message), 'alert', 3);
    }
    // ─────────────────────────────────────────────────────────────────────────

    try {
        autofitColumns(worksheet, dataRows.length);
    } catch (err) {
        heap.logger.log('alert', 'Error autofitColumns '  + JSON.stringify(err.message), 'alert', 3);
    }
    try {
        setPrintArea(worksheet, alertData[0]);
    } catch (err) {
        heap.logger.log('alert', 'Error setPrintArea ' + JSON.stringify(err.message), 'alert', 3);
    }
    try {
        setPageBreak(worksheet, dataRows, alertData[0]);
    } catch (err) {
        heap.logger.log('alert', 'Error setPageBreak ' + JSON.stringify(err), 'alert', 3);
    }
    try {
        setXLSProperties(workbook);
    } catch (err) {
        heap.logger.log('alert', 'Error setXLSProperties ' + JSON.stringify(err), 'alert', 3);
    }

    heap.logger.log('alert', 'ws.pageSetup : ' + JSON.stringify(worksheet.pageSetup), 'alert', 1);

    dataRows.length = 0;
    dataColumns.length = 0;
    valueColumns.length = 0;
    dataRows = null;
    dataColumns = null;
    valueColumns = null;
    return {wb: workbook, ws: worksheet};
}

module.exports.json2xls               = json2xls;
module.exports.writeBufferWithFilters = writeBufferWithFilters;
module.exports.injectAutoFilters      = injectAutoFilters;