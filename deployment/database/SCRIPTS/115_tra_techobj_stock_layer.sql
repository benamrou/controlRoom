-- =============================================================================
-- 115_tra_techobj_stock_layer.sql
-- TRA_TECHOBJ helper (page-header info) for Stock layer initialization in cost
-- Screen: SCR0000000050  |  Route: /stocklayer  |  Tool: 20
-- Idempotent MERGE — safe to re-run.
-- =============================================================================

SET DEFINE OFF;
SET SCAN OFF;

-- us_US
MERGE INTO TRA_TECHOBJ t
USING (
  SELECT 'SCR0000000050' AS TOBID,
         'Mass-change' AS TOBCAT,
         'us_US' AS TOBLANGUE,
         q'[<div><i class="bbs-keywords">What is it : </i>Initialize or update a GOLD <b>stock layer cost (WAC)</b> — and optionally quantity — from an Excel file.</div>
<div>Mostly used during <b>warehouse initialization</b>, or on <b>Finance request</b> when WAC was never set for an item (not received yet).</div>
<div><i class="bbs-keywords">Rules : </i>
<ul>
<li><b>Quantity :</b> Can be <b>0</b> (WAC-only initialization) or a quantity for inventory load.</li>
<li><b>Unit cost :</b> Warehouse average SKU cost (WAC). Posted <b>as-is</b> to the layer (<code>UNIT_COST</code> column) — no case-pack conversion.</li>
<li><b>Site :</b> Blank or <code>ALL</code> = all stores except HQ (0) and test (30); numeric = one site.</li>
<li><b>Position :</b> Blank or <code>ALL</code> = types 0–11; numeric = one position type.</li>
<li><b>LV code :</b> Required — exact match on <code>ARTVL</code> (item + LV).</li>
</ul></div>]' AS TOBDESC,
         q'[<div><i class="bbs-keywords">How it works : </i>
<ol>
<li>Browse / Confirm the Excel file (tool 20, template <code>ICR_TEMPLATE018</code>).</li>
<li><b>No stock layer</b> in <code>STOCOUCH</code> → insert <code>ITFSTOCK</code> → GOLD job <code>psitf03p</code>.</li>
<li><b>Layer exists</b> with on-hand &gt; 0 → insert <code>INTMVTSTO</code> cost change (<code>IMSTMVT=100</code>, <code>IMSMOTF=903</code>) → <code>pssti06p</code>.</li>
<li><b>Layer exists</b> with on-hand = 0 → cost alone is ignored by GOLD, so the load writes three movements under the same sequence: qty adj +1 (<code>IMSTMVT=101</code>, <code>IMSMOTF=2</code>), cost 903, then qty adj −1 — then <code>pssti06p</code>.</li>
</ol></div>
<div><i class="bbs-keywords">Excel columns : </i><code>SITE_CODE</code>, <code>ITEM_CODE</code>, <code>LV_CODE</code>, <code>POSITION</code>, <code>QTY</code>, <code>UNIT_COST</code>.</div>
<div><i class="bbs-keywords">Tips : </i>Reselecting a file resets the wizard — always Confirm again before Validate. Review the execution recap for interface errors.</div>]' AS TOBDESC2
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
  SELECT 'SCR0000000050' AS TOBID,
         'Mass-change' AS TOBCAT,
         'en_GB' AS TOBLANGUE,
         q'[<div><i class="bbs-keywords">What is it : </i>Initialize or update a GOLD <b>stock layer cost (WAC)</b> — and optionally quantity — from an Excel file.</div>
<div>Mostly used during <b>warehouse initialization</b>, or on <b>Finance request</b> when WAC was never set for an item (not received yet).</div>
<div><i class="bbs-keywords">Rules : </i>
<ul>
<li><b>Quantity :</b> Can be <b>0</b> (WAC-only initialization) or a quantity for inventory load.</li>
<li><b>Unit cost :</b> Warehouse average SKU cost (WAC). Posted <b>as-is</b> to the layer (<code>UNIT_COST</code> column) — no case-pack conversion.</li>
<li><b>Site :</b> Blank or <code>ALL</code> = all stores except HQ (0) and test (30); numeric = one site.</li>
<li><b>Position :</b> Blank or <code>ALL</code> = types 0–11; numeric = one position type.</li>
<li><b>LV code :</b> Required — exact match on <code>ARTVL</code> (item + LV).</li>
</ul></div>]' AS TOBDESC,
         q'[<div><i class="bbs-keywords">How it works : </i>
<ol>
<li>Browse / Confirm the Excel file (tool 20, template <code>ICR_TEMPLATE018</code>).</li>
<li><b>No stock layer</b> in <code>STOCOUCH</code> → insert <code>ITFSTOCK</code> → GOLD job <code>psitf03p</code>.</li>
<li><b>Layer exists</b> with on-hand &gt; 0 → insert <code>INTMVTSTO</code> cost change (<code>IMSTMVT=100</code>, <code>IMSMOTF=903</code>) → <code>pssti06p</code>.</li>
<li><b>Layer exists</b> with on-hand = 0 → cost alone is ignored by GOLD, so the load writes three movements under the same sequence: qty adj +1 (<code>IMSTMVT=101</code>, <code>IMSMOTF=2</code>), cost 903, then qty adj −1 — then <code>pssti06p</code>.</li>
</ol></div>
<div><i class="bbs-keywords">Excel columns : </i><code>SITE_CODE</code>, <code>ITEM_CODE</code>, <code>LV_CODE</code>, <code>POSITION</code>, <code>QTY</code>, <code>UNIT_COST</code>.</div>
<div><i class="bbs-keywords">Tips : </i>Reselecting a file resets the wizard — always Confirm again before Validate. Review the execution recap for interface errors.</div>]' AS TOBDESC2
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
  SELECT 'SCR0000000050' AS TOBID,
         'Mass-change' AS TOBCAT,
         'fr_FR' AS TOBLANGUE,
         q'[<div><i class="bbs-keywords">What is it : </i>Initialiser ou mettre a jour le <b>cout de couche stock (WAC)</b> — et optionnellement la quantite — via un fichier Excel.</div>
<div>Principalement utilise lors de l <b>initialisation entrepot</b>, ou sur <b>demande Finance</b> lorsque le WAC n a jamais ete pose pour un article (pas encore receptionne).</div>
<div><i class="bbs-keywords">Rules : </i>
<ul>
<li><b>Quantity :</b> Peut etre <b>0</b> (WAC seul) ou une quantite pour chargement d inventaire.</li>
<li><b>Unit cost :</b> Cout moyen SKU entrepot (WAC). Pose <b>tel quel</b> (<code>UNIT_COST</code>) — pas de conversion case pack.</li>
<li><b>Site :</b> Vide ou <code>ALL</code> = tous les magasins sauf HQ (0) et test (30) ; numerique = un site.</li>
<li><b>Position :</b> Vide ou <code>ALL</code> = types 0–11 ; numerique = un type.</li>
<li><b>LV code :</b> Obligatoire — correspondance exacte <code>ARTVL</code> (article + LV).</li>
</ul></div>]' AS TOBDESC,
         q'[<div><i class="bbs-keywords">How it works : </i>
<ol>
<li>Parcourir / Confirmer le fichier Excel (outil 20, modele <code>ICR_TEMPLATE018</code>).</li>
<li><b>Pas de couche</b> dans <code>STOCOUCH</code> → insert <code>ITFSTOCK</code> → job GOLD <code>psitf03p</code>.</li>
<li><b>Couche existante</b> avec stock &gt; 0 → insert <code>INTMVTSTO</code> cout (<code>IMSTMVT=100</code>, <code>IMSMOTF=903</code>) → <code>pssti06p</code>.</li>
<li><b>Couche existante</b> avec stock = 0 → le cout seul est ignore par GOLD : trois mouvements (qty +1 en <code>IMSTMVT=101</code>/<code>IMSMOTF=2</code>, cout 903, qty −1) puis <code>pssti06p</code>.</li>
</ol></div>
<div><i class="bbs-keywords">Excel columns : </i><code>SITE_CODE</code>, <code>ITEM_CODE</code>, <code>LV_CODE</code>, <code>POSITION</code>, <code>QTY</code>, <code>UNIT_COST</code>.</div>
<div><i class="bbs-keywords">Tips : </i>Reselectionner un fichier reinitialise l assistant — toujours Confirmer avant Valider. Consulter le recap pour les erreurs d interface.</div>]' AS TOBDESC2
    FROM dual
) s
ON (t.TOBID = s.TOBID AND t.TOBLANGUE = s.TOBLANGUE)
WHEN MATCHED THEN UPDATE SET
  t.TOBCAT = s.TOBCAT, t.TOBDESC = s.TOBDESC, t.TOBDESC2 = s.TOBDESC2,
  t.TOBDMAJ = SYSDATE, t.TOBUTIL = 'admin'
WHEN NOT MATCHED THEN INSERT (TOBID, TOBCAT, TOBDESC, TOBDESC2, TOBLANGUE, TOBDCRE, TOBDMAJ, TOBUTIL)
VALUES (s.TOBID, s.TOBCAT, s.TOBDESC, s.TOBDESC2, s.TOBLANGUE, SYSDATE, SYSDATE, 'admin');

COMMIT;
