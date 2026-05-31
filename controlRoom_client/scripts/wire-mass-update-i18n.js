#!/usr/bin/env node
/**
 * Per-screen mass-update body labels + HTML repair.
 * Run: cd controlRoom_client && node scripts/wire-mass-update-i18n.js
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const MU_DIR = path.join(ROOT, 'src/app/pages/mass.update');
const SQL_OUT = path.join(
  ROOT,
  '..',
  'deployment/database/SCRIPTS/91_tra_labels_mass_update_screens.sql',
);

const PREFIX_OVERRIDE = {
  'category.manager': 'S13.CM',
  'sku.dimension': 'S13.SKU',
  'item.attribute': 'S16.ATTR',
  'item.retail': 'S16.RTL',
};

const SKIP = new Set(['journal', 'item.brand']);

/** Screens whose CNM was lost in a bad script run — restore from last committed HTML. */
const CNM_FROM_GIT = new Set([
  'item.attribute',
  'sv.info',
  'sv.attribute',
  'stock.layer',
  'purchase.order.push',
  'purchase.order',
  'item.retail',
  'item.logistic.code',
  'item.images',
  'item.end.upc',
  'item.attribute.dated',
  'item.address',
]);

const CNM_GIT_TEXT =
  'Respect column header names from the template file (see columns above).';

function escapeSql(s) {
  return (s || '').replace(/'/g, "''").substring(0, 100);
}

function escapeTpl(s) {
  return (s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function keyId(prefix, suffix) {
  const id = prefix.includes('.') ? `${prefix}.${suffix}` : `${prefix}.MU.${suffix}`;
  if (id.length > 15) {
    throw new Error(`TLAID too long: ${id} (${id.length})`);
  }
  return id;
}

function colKey(prefix, idx) {
  const letters = 'ABCDEFGHIJ';
  return keyId(prefix, `C${letters[idx] || idx}`);
}

function unescapeLbl(s) {
  return (s || '').replace(/\\'/g, "'");
}

function extractLbl(html, keySuffix) {
  const re = new RegExp(
    `'([^']*${keySuffix.replace(/\./g, '\\.')})'\\s*\\|\\s*lbl:'((?:\\\\'|[^'])*)'`,
    'i',
  );
  const m = html.match(re);
  return m ? { key: m[1], text: unescapeLbl(m[2]) } : null;
}

function normalizePrefixKey(key, folder) {
  if (!key) {
    return null;
  }
  if (key.includes('.CM.MU.')) {
    return key.replace('.CM.MU.', '.CM.');
  }
  if (key.includes('.SKU.MU.')) {
    return key.replace('.SKU.MU.', '.SKU.');
  }
  if (key.includes('.RTL.MU.')) {
    return key.replace('.RTL.MU.', '.RTL.');
  }
  if (key.includes('.ATTR.MU.')) {
    return key.replace('.ATTR.MU.', '.ATTR.');
  }
  return key;
}

function detectPrefix(html, folder) {
  if (PREFIX_OVERRIDE[folder]) {
    return PREFIX_OVERRIDE[folder];
  }
  const m = html.match(/'(S\d+)\.TITLE'/);
  if (!m) {
    throw new Error(`No Sxx.TITLE in ${folder}`);
  }
  return m[1];
}

function parseColumns(html) {
  const cols = [];
  const re = /<li>\{\{\s*'([^']+)'\s*\|\s*lbl:'((?:\\'|[^'])*)'\s*\}\}\s*<\/li>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    cols.push(unescapeLbl(m[2]));
  }
  if (cols.length) {
    return cols;
  }
  const plain = [...html.matchAll(/<li>(COLUMN [^<]+)<\/li>/gi)].map((x) => x[1].trim());
  return plain;
}

function parseData(html, prefix, folder) {
  const selHit = extractLbl(html, '.SEL') || extractLbl(html, '.MU.SEL');
  const xlsHit = extractLbl(html, '.XLS') || extractLbl(html, '.MU.XLS');
  const whenHit = extractLbl(html, '.WHEN') || extractLbl(html, '.MU.WHEN');
  let cnmHit = extractLbl(html, '.CNM') || extractLbl(html, '.MU.CNM');

  let sel = selHit?.text;
  let xls = xlsHit?.text;
  let when = whenHit?.text;

  if (!sel || !xls) {
    const intro = html.match(
      /Select your ([^.]+)\.\s*The XLS\(x\) Excel file should contai(?:n|)s? ([^:<]+):/i,
    );
    if (intro) {
      sel = sel || `Select your ${intro[1].trim()}.`;
      xls = xls || `The XLS(x) Excel file should contain ${intro[2].trim()}:`;
    }
  }

  const cols = parseColumns(html);

  if (!when) {
    const wm = html.match(/When do you want to execute ([^?<]+)\??/i);
    if (wm) {
      when = `When do you want to execute ${wm[1].trim()}?`;
    }
  }

  if (cnmHit?.text && (cnmHit.text.includes("{{") || cnmHit.text === "\\" || cnmHit.text.length < 4)) {
    cnmHit = null;
  }

  let colnm = cnmHit?.text || '';
  if (!colnm || colnm.includes("{{ 'MU.FILE.HINT'")) {
    if (CNM_FROM_GIT.has(folder)) {
      colnm = CNM_GIT_TEXT;
    }
  }

  if (!sel || !xls || !cols.length) {
    return null;
  }
  return { sel, xls, cols, when: when || '', colnm };
}

function buildIntroBlock(prefix, data) {
  const selK = keyId(prefix, 'SEL');
  const xlsK = keyId(prefix, 'XLS');
  const colLis = data.cols
    .map((col, i) => {
      const k = colKey(prefix, i);
      return `                    <li>{{ '${k}' | lbl:'${escapeTpl(col)}' }}</li>`;
    })
    .join('\n');
  return `                {{ '${selK}' | lbl:'${escapeTpl(data.sel)}' }}
                {{ '${xlsK}' | lbl:'${escapeTpl(data.xls)}' }}
                <ul>
${colLis}
                </ul>`;
}

function buildColnmLine(prefix, colnm) {
  const cnmK = keyId(prefix, 'CNM');
  if (!colnm) {
    return `            {{ 'MU.FILE.HINT' | lbl:'Use the template file as example for column headers.' }}`;
  }
  return `            {{ 'MU.FILE.HINT' | lbl:'Use the template file as example for column headers.' }} {{ '${cnmK}' | lbl:'${escapeTpl(colnm)}' }}`;
}

function wireHtml(html, prefix, data) {
  let out = html;

  const introReplace = buildIntroBlock(prefix, data);
  const introRe =
    /(\s*)\{\{\s*'[^']*\.SEL'[^}]+\}\}[\s\S]*?<\/ul>/i;
  if (!introRe.test(out)) {
    const legacyRe =
      /Select your [^.]+\.\s*The XLS\(x\) Excel file should contai(?:n|)s? [^:]+:\s*<ul>[\s\S]*?<\/ul>/i;
    if (!legacyRe.test(out)) {
      throw new Error('Intro block not found');
    }
    out = out.replace(legacyRe, `\n${introReplace}\n`);
  } else {
    out = out.replace(introRe, `\n${introReplace}\n`);
  }

  const colnmLine = buildColnmLine(prefix, data.colnm);
  out = out.replace(
    /<div class="row" style="padding-left: 15px">\s*[\s\S]*?<\/div>\s*\n\s*<div class="alert alert-danger"/i,
    `<div class="row" style="padding-left: 15px">\n${colnmLine}</div>\n\n        <div class="alert alert-danger"`,
  );

  if (data.when) {
    const whenK = keyId(prefix, 'WHEN');
    const whenLbl = `{{ '${whenK}' | lbl:'${escapeTpl(data.when)}' }}`;
    out = out.replace(
      /<span style="padding-left: 15px; font-weight: bolder">\s*[\s\S]*?(<p-toggleButton)/i,
      `<span style="padding-left: 15px; font-weight: bolder">\n                    ${whenLbl}\n                </span>\n                &nbsp;&nbsp;\n                $1`,
    );
    out = out.replace(
      /\{\{\s*'MU\.LBL\.WHEN'[^}]+\}\}/g,
      whenLbl,
    );
  }

  return out;
}

function wireTs(tsPath, prefix, data) {
  if (!fs.existsSync(tsPath)) {
    return;
  }
  let ts = fs.readFileSync(tsPath, 'utf8');
  const stp0K = keyId(prefix, 'STP0');
  const arg = `this._labels.text('${stp0K}', '${escapeTpl(data.sel)}')`;
  ts = ts.replace(
    /buildMassUpdateMenuItems\(\s*this\._labels(?:,\s*this\._labels\.text\([^)]*\))?\s*\)/,
    `buildMassUpdateMenuItems(this._labels, ${arg})`,
  );
  fs.writeFileSync(tsPath, ts);
}

function frText(en) {
  const map = [
    [/Select your (.+)\./gi, 'Choisir votre fichier $1.'],
    [/The XLS\(x\) Excel file should contain/gi, 'Le fichier Excel XLS(x) doit contenir'],
    [/When do you want to execute/gi, 'Quand souhaitez-vous executer'],
    [/COLUMN A:/gi, 'COLONNE A :'],
    [/COLUMN B:/gi, 'COLONNE B :'],
    [/COLUMN C:/gi, 'COLONNE C :'],
    [/COLUMN D:/gi, 'COLONNE D :'],
    [/COLUMN E:/gi, 'COLONNE E :'],
    [/COLUMN F:/gi, 'COLONNE F :'],
    [/COLUMN G:/gi, 'COLONNE G :'],
    [/COLUMN H:/gi, 'COLONNE H :'],
    [/COLUMN I:/gi, 'COLONNE I :'],
    [/COLUMN J:/gi, 'COLONNE J :'],
    [
      /Respect column header names from the template file \(see columns above\)\./gi,
      'Respecter les entetes du modele (voir colonnes ci-dessus).',
    ],
    [
      /Use the template file as example for column headers\./gi,
      'Utilisez le modele comme exemple pour les entetes.',
    ],
  ];
  let fr = en;
  for (const [re, rep] of map) {
    fr = fr.replace(re, rep);
  }
  return fr.substring(0, 100);
}

function patchTitles(html, folder) {
  let out = html;
  if (folder === 'category.manager') {
    out = out.replace(
      /'S13\.TITLE' \| lbl:'Item Category Manager change'/,
      `'S13.CM.TITLE' | lbl:'Item Category Manager change'`,
    );
  }
  if (folder === 'sku.dimension') {
    out = out.replace(
      /'S13\.TITLE' \| lbl:'Item SKU Dimension change'/,
      `'S13.SKU.TITLE' | lbl:'Item SKU Dimension change'`,
    );
  }
  return out;
}

function main() {
  const seeds = [];
  const errors = [];

  for (const dirent of fs.readdirSync(MU_DIR, { withFileTypes: true })) {
    if (!dirent.isDirectory() || SKIP.has(dirent.name)) {
      continue;
    }
    const folderName = dirent.name;
    const dir = path.join(MU_DIR, folderName);
    const htmlFile = fs
      .readdirSync(dir)
      .find((f) => f.endsWith('.component.html') && !f.includes(' copy'));
    if (!htmlFile) {
      continue;
    }
    const htmlPath = path.join(dir, htmlFile);
    let html = fs.readFileSync(htmlPath, 'utf8');
    if (!html.includes('MU.BTN.TMPL') && !html.includes('p-steps')) {
      continue;
    }
    if (!html.includes('.SEL') && !html.includes('Select your')) {
      continue;
    }

    try {
      const prefix = detectPrefix(html, folderName);
      const data = parseData(html, prefix, folderName);
      if (!data) {
        errors.push(`${folderName}: could not parse intro/columns`);
        continue;
      }

      const tsFile = fs
        .readdirSync(dir)
        .find((f) => f.endsWith('.component.ts') && !f.includes('copy'));
      const scr = tsFile
        ? (fs.readFileSync(path.join(dir, tsFile), 'utf8').match(/screenID = '(SCR\d+)'/) || [])[1]
        : 'MASS_UPDATE';

      let wired = wireHtml(html, prefix, data);
      wired = patchTitles(wired, folderName);
      fs.writeFileSync(htmlPath, wired);

      if (tsFile) {
        wireTs(path.join(dir, tsFile), prefix, data);
      }

      const push = (suffix, text) => {
        if (!text) {
          return;
        }
        const id = keyId(prefix, suffix);
        seeds.push({ id, us: text, scr });
      };

      push('SEL', data.sel);
      push('XLS', data.xls);
      push('WHEN', data.when);
      push('CNM', data.colnm);
      push('STP0', data.sel);
      data.cols.forEach((col, i) => {
        seeds.push({ id: colKey(prefix, i), us: col, scr });
      });

      if (folderName === 'category.manager') {
        seeds.push({
          id: 'S13.CM.TITLE',
          us: 'Item Category Manager change',
          scr: 'SCR0000000013',
        });
      }
      if (folderName === 'sku.dimension') {
        seeds.push({
          id: 'S13.SKU.TITLE',
          us: 'Item SKU Dimension change',
          scr: 'SCR0000000013',
        });
      }

      console.log(`OK ${folderName} -> ${prefix} (${data.cols.length} cols)`);
    } catch (e) {
      errors.push(`${folderName}: ${e.message}`);
    }
  }

  let sql = `-- Per-screen mass-update wizard body (Sxx.MU.*, S13.CM.*, S13.SKU.*, S16.ATTR.*, S16.RTL.*)
-- Deploy after 90. TLAID max 15; TLADESC max 100.
SET DEFINE OFF;
SET SCAN OFF;

DECLARE
  PROCEDURE seed3(p_id VARCHAR2, p_us VARCHAR2, p_gb VARCHAR2, p_fr VARCHAR2, p_screen VARCHAR2) IS
  BEGIN
    MERGE INTO TRA_LABELS t USING (SELECT p_id TLAID, 'us_US' TLALANGUE FROM DUAL) s
    ON (t.TLAID = s.TLAID AND t.TLALANGUE = s.TLALANGUE)
    WHEN MATCHED THEN UPDATE SET t.TLADESC = p_us, t.TLASCREEN = p_screen, t.TLADMAJ = SYSDATE
    WHEN NOT MATCHED THEN INSERT (TLAID, TLADESC, TLAMENU, TLASCREEN, TLALANGUE, TLADCRE, TLADMAJ, TLAUTIL)
    VALUES (p_id, p_us, 0, p_screen, 'us_US', SYSDATE, SYSDATE, 'admin');
    MERGE INTO TRA_LABELS t USING (SELECT p_id TLAID, 'en_GB' TLALANGUE FROM DUAL) s
    ON (t.TLAID = s.TLAID AND t.TLALANGUE = s.TLALANGUE)
    WHEN MATCHED THEN UPDATE SET t.TLADESC = p_gb, t.TLASCREEN = p_screen, t.TLADMAJ = SYSDATE
    WHEN NOT MATCHED THEN INSERT (TLAID, TLADESC, TLAMENU, TLASCREEN, TLALANGUE, TLADCRE, TLADMAJ, TLAUTIL)
    VALUES (p_id, p_gb, 0, p_screen, 'en_GB', SYSDATE, SYSDATE, 'admin');
    MERGE INTO TRA_LABELS t USING (SELECT p_id TLAID, 'fr_FR' TLALANGUE FROM DUAL) s
    ON (t.TLAID = s.TLAID AND t.TLALANGUE = s.TLALANGUE)
    WHEN MATCHED THEN UPDATE SET t.TLADESC = p_fr, t.TLASCREEN = p_screen, t.TLADMAJ = SYSDATE
    WHEN NOT MATCHED THEN INSERT (TLAID, TLADESC, TLAMENU, TLASCREEN, TLALANGUE, TLADCRE, TLADMAJ, TLAUTIL)
    VALUES (p_id, p_fr, 0, p_screen, 'fr_FR', SYSDATE, SYSDATE, 'admin');
  END;
BEGIN
`;

  const seen = new Set();
  for (const s of seeds.sort((a, b) => a.id.localeCompare(b.id))) {
    if (seen.has(s.id)) {
      continue;
    }
    seen.add(s.id);
    if (s.id.length > 15) {
      errors.push(`TLAID too long: ${s.id}`);
      continue;
    }
    const us = escapeSql(s.us);
    const gb = escapeSql(s.us);
    const fr = escapeSql(frText(s.us));
    sql += `  seed3('${s.id}', '${us}', '${gb}', '${fr}', '${s.scr}');\n`;
  }

  sql += `END;
/
COMMIT;
SET DEFINE ON;
`;

  fs.writeFileSync(SQL_OUT, sql);
  console.log(`\nWrote ${seen.size} labels -> ${SQL_OUT}`);
  if (errors.length) {
    console.error('Errors:\n' + errors.join('\n'));
    process.exit(1);
  }
}

main();
