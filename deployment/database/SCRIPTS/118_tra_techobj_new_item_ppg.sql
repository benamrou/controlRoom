-- =============================================================================
-- 118_tra_techobj_new_item_ppg.sql
-- TRA_TECHOBJ helper (page-header purple info) for New Item PPG mass-load
-- Screen: SCR0000000091  |  Route: /newitemppg  |  Tool: 23
-- Idempotent MERGE — safe to re-run.
-- =============================================================================

SET DEFINE OFF;
SET SCAN OFF;

-- us_US
MERGE INTO TRA_TECHOBJ t
USING (
  SELECT 'SCR0000000091' AS TOBID,
         'Mass-change' AS TOBCAT,
         'us_US' AS TOBLANGUE,
         q'[<div><i class="bbs-keywords">What is it : </i>Mass-load used by <b>Data Integrity</b> to create a <b>new PPG list</b> and attach items to it.</div>
<div><i class="bbs-keywords">Business context : </i>Load new PPG lists with their items from one Excel file. Each row assigns one UPC to a PPG list code and description.</div>
<div><i class="bbs-keywords">Prerequisites : </i>
<ul>
<li><b>UPC must be active</b> in GOLD.</li>
<li><b>PPG_ID must not already exist</b> — this load creates a new list.</li>
<li>The item must <b>not</b> already sit on another active PPG list.</li>
</ul></div>
<div><i class="bbs-keywords">What the load does : </i>Creates the PPG list (<code>PPG_ID</code> / <code>PPG_NAME</code>) and attaches each corresponding UPC.</div>
<div><i class="bbs-keywords">Excel columns : </i><code>UPC</code>, <code>PPG_NAME</code>, <code>PPG_ID</code> — download the template first.</div>]' AS TOBDESC,
         q'[<div><i class="bbs-keywords">When to use : </i><ul>
<li>You need to create one or more new PPG lists and attach items in bulk.</li>
<li>The PPG codes are already chosen (they are not allocated automatically).</li>
</ul></div>
<div><i class="bbs-keywords">How it works : </i><ol>
<li>Download the template, fill it, then Browse / Confirm the file.</li>
<li>Validate: UPC must be active and PPG_ID must not already exist.</li>
<li>Execute now (or schedule). The PPG list is created and each UPC is attached.</li>
</ol></div>
<div><i class="bbs-keywords">Tips : </i>Reselecting a file resets the wizard — always Confirm again before Validate. Use the Next PPG screen if you need to find free PPG numbers before building the file.</div>]' AS TOBDESC2
    FROM dual
) s
ON (t.TOBID = s.TOBID AND t.TOBLANGUE = s.TOBLANGUE)
WHEN MATCHED THEN UPDATE SET
  t.TOBCAT = s.TOBCAT, t.TOBDESC = s.TOBDESC, t.TOBDESC2 = s.TOBDESC2,
  t.TOBDMAJ = SYSDATE, t.TOBUTIL = 'admin'
WHEN NOT MATCHED THEN INSERT (TOBID, TOBCAT, TOBDESC, TOBDESC2, TOBLANGUE, TOBDCRE, TOBDMAJ, TOBUTIL)
VALUES (s.TOBID, s.TOBCAT, s.TOBDESC, s.TOBDESC2, s.TOBLANGUE, SYSDATE, SYSDATE, 'admin');

-- en_GB
MERGE INTO TRA_TECHOBJ t
USING (
  SELECT 'SCR0000000091' AS TOBID,
         'Mass-change' AS TOBCAT,
         'en_GB' AS TOBLANGUE,
         q'[<div><i class="bbs-keywords">What is it : </i>Mass-load used by <b>Data Integrity</b> to create a <b>new PPG list</b> and attach items to it.</div>
<div><i class="bbs-keywords">Business context : </i>Load new PPG lists with their items from one Excel file. Each row assigns one UPC to a PPG list code and description.</div>
<div><i class="bbs-keywords">Prerequisites : </i>
<ul>
<li><b>UPC must be active</b> in GOLD.</li>
<li><b>PPG_ID must not already exist</b> — this load creates a new list.</li>
<li>The item must <b>not</b> already sit on another active PPG list.</li>
</ul></div>
<div><i class="bbs-keywords">What the load does : </i>Creates the PPG list (<code>PPG_ID</code> / <code>PPG_NAME</code>) and attaches each corresponding UPC.</div>
<div><i class="bbs-keywords">Excel columns : </i><code>UPC</code>, <code>PPG_NAME</code>, <code>PPG_ID</code> — download the template first.</div>]' AS TOBDESC,
         q'[<div><i class="bbs-keywords">When to use : </i><ul>
<li>You need to create one or more new PPG lists and attach items in bulk.</li>
<li>The PPG codes are already chosen (they are not allocated automatically).</li>
</ul></div>
<div><i class="bbs-keywords">How it works : </i><ol>
<li>Download the template, fill it, then Browse / Confirm the file.</li>
<li>Validate: UPC must be active and PPG_ID must not already exist.</li>
<li>Execute now (or schedule). The PPG list is created and each UPC is attached.</li>
</ol></div>
<div><i class="bbs-keywords">Tips : </i>Reselecting a file resets the wizard — always Confirm again before Validate. Use the Next PPG screen if you need to find free PPG numbers before building the file.</div>]' AS TOBDESC2
    FROM dual
) s
ON (t.TOBID = s.TOBID AND t.TOBLANGUE = s.TOBLANGUE)
WHEN MATCHED THEN UPDATE SET
  t.TOBCAT = s.TOBCAT, t.TOBDESC = s.TOBDESC, t.TOBDESC2 = s.TOBDESC2,
  t.TOBDMAJ = SYSDATE, t.TOBUTIL = 'admin'
WHEN NOT MATCHED THEN INSERT (TOBID, TOBCAT, TOBDESC, TOBDESC2, TOBLANGUE, TOBDCRE, TOBDMAJ, TOBUTIL)
VALUES (s.TOBID, s.TOBCAT, s.TOBDESC, s.TOBDESC2, s.TOBLANGUE, SYSDATE, SYSDATE, 'admin');

-- fr_FR
MERGE INTO TRA_TECHOBJ t
USING (
  SELECT 'SCR0000000091' AS TOBID,
         'Mass-change' AS TOBCAT,
         'fr_FR' AS TOBLANGUE,
         q'[<div><i class="bbs-keywords">Objet : </i>Chargement de masse utilise par <b>Data Integrity</b> pour creer une <b>nouvelle liste PPG</b> et y rattacher des articles.</div>
<div><i class="bbs-keywords">Contexte metier : </i>Charger de nouvelles listes PPG avec leurs articles dans un seul fichier Excel. Chaque ligne associe un UPC a un code et une description de liste PPG.</div>
<div><i class="bbs-keywords">Prerequis : </i>
<ul>
<li><b>UPC actif</b> dans GOLD.</li>
<li><b>PPG_ID inexistant</b> — ce chargement cree une nouvelle liste.</li>
<li>L''article ne doit <b>pas</b> deja etre sur une autre liste PPG active.</li>
</ul></div>
<div><i class="bbs-keywords">Effet du chargement : </i>Cree la liste PPG (<code>PPG_ID</code> / <code>PPG_NAME</code>) et rattache chaque UPC correspondant.</div>
<div><i class="bbs-keywords">Colonnes Excel : </i><code>UPC</code>, <code>PPG_NAME</code>, <code>PPG_ID</code> — telecharger le modele d''abord.</div>]' AS TOBDESC,
         q'[<div><i class="bbs-keywords">Quand l''utiliser : </i><ul>
<li>Vous devez creer une ou plusieurs nouvelles listes PPG et y rattacher des articles en masse.</li>
<li>Les codes PPG sont deja choisis (pas d''allocation automatique).</li>
</ul></div>
<div><i class="bbs-keywords">Fonctionnement : </i><ol>
<li>Telecharger le modele, le remplir, puis Parcourir / Confirmer le fichier.</li>
<li>Valider : l''UPC doit etre actif et le PPG_ID ne doit pas deja exister.</li>
<li>Executer (ou planifier). La liste PPG est creee et chaque UPC est rattache.</li>
</ol></div>
<div><i class="bbs-keywords">Astuce : </i>Reselectionner un fichier reinitialise l''assistant — Confirmer a nouveau avant Valider. Utiliser l''ecran Next PPG pour trouver des numeros PPG libres avant de construire le fichier.</div>]' AS TOBDESC2
    FROM dual
) s
ON (t.TOBID = s.TOBID AND t.TOBLANGUE = s.TOBLANGUE)
WHEN MATCHED THEN UPDATE SET
  t.TOBCAT = s.TOBCAT, t.TOBDESC = s.TOBDESC, t.TOBDESC2 = s.TOBDESC2,
  t.TOBDMAJ = SYSDATE, t.TOBUTIL = 'admin'
WHEN NOT MATCHED THEN INSERT (TOBID, TOBCAT, TOBDESC, TOBDESC2, TOBLANGUE, TOBDCRE, TOBDMAJ, TOBUTIL)
VALUES (s.TOBID, s.TOBCAT, s.TOBDESC, s.TOBDESC2, s.TOBLANGUE, SYSDATE, SYSDATE, 'admin');

COMMIT;

SET DEFINE ON;
SET SCAN ON;

PROMPT 118_tra_techobj_new_item_ppg.sql complete — SCR0000000091 helper (us_US + en_GB + fr_FR)
/
