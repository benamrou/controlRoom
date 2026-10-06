-- =============================================================================
-- 113_tra_techobj_ref_to_order.sql
-- TRA_TECHOBJ helper (page-header info) for Reference to order mass-load
-- Screen: SCR0000000090  |  Route: /referencetoorder  |  Tool: 22
-- Idempotent MERGE — safe to re-run.
-- =============================================================================

SET DEFINE OFF;
SET SCAN OFF;

-- us_US
MERGE INTO TRA_TECHOBJ t
USING (
  SELECT 'SCR0000000090' AS TOBID,
         'Mass-change' AS TOBCAT,
         'us_US' AS TOBLANGUE,
         q'[<div><i class="bbs-keywords">What is it : </i>Mass-load to change the supplier <b>Reference to order</b> on active orderable assortment (<code>ARTUC.ARAREFC</code>). The load closes the current OA period and opens a new one with the new ref (via <code>INTARTASS</code> / <code>psifa07p</code>).</div>
<div><i class="bbs-keywords">Business context : </i>UNFI item references to order were not consistent across sites. <b>UNFI asked to remove the check digit</b> from the ref-to-order value so GOLD matches their ordering reference. Use this screen to apply the corrected ref (without check digit) for the UNFI vendor / item / LV rows in scope.</div>
<div><i class="bbs-keywords">Excel columns : </i><code>VENDOR</code>, <code>ITEM_NUMBER</code>, <code>LV</code>, <code>REF_TO_ORDER</code> — download the template first. Put the <b>new</b> ref (no check digit) in <code>REF_TO_ORDER</code>.</div>]' AS TOBDESC,
         q'[<div><i class="bbs-keywords">When to use : </i><ul>
<li>UNFI (or another vendor) requests a systematic ref-to-order correction (e.g. strip check digit).</li>
<li>Orderable assortment exists for vendor + item (+ optional LV) and must keep the same end date while switching <code>ARAREFC</code>.</li>
</ul></div>
<div><i class="bbs-keywords">How it works : </i><ol>
<li>Browse / Confirm the Excel file (tool 22, template <code>ICR_TEMPLATE021</code>).</li>
<li>Execute now (or schedule). Package loads two <code>INTARTASS</code> rows per hit: close OA at <code>TRUNC(SYSDATE-3)</code>, create OA from <code>TRUNC(SYSDATE-2)</code> with the new ref and the previous end date.</li>
<li>GOLD job <code>psifa07p</code> applies the interface into assortment.</li>
</ol></div>
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
  SELECT 'SCR0000000090' AS TOBID,
         'Mass-change' AS TOBCAT,
         'fr_FR' AS TOBLANGUE,
         q'[<div><i class="bbs-keywords">Objet : </i>Chargement de masse pour modifier la <b>reference a la commande</b> fournisseur sur l''assortiment commandable actif (<code>ARTUC.ARAREFC</code>). Le traitement cloture la periode OA courante et en ouvre une nouvelle avec la nouvelle reference (via <code>INTARTASS</code> / <code>psifa07p</code>).</div>
<div><i class="bbs-keywords">Contexte metier : </i>Les references a la commande UNFI n''etaient pas coherentes. <b>UNFI a demande de retirer la cle de controle (check digit)</b> de la reference afin d''aligner GOLD sur leur reference de commande. Utiliser cet ecran pour appliquer la reference corrigee (sans check digit) pour les lignes fournisseur / article / LV concernees.</div>
<div><i class="bbs-keywords">Colonnes Excel : </i><code>VENDOR</code>, <code>ITEM_NUMBER</code>, <code>LV</code>, <code>REF_TO_ORDER</code> — telecharger le modele. Saisir la <b>nouvelle</b> reference (sans check digit) dans <code>REF_TO_ORDER</code>.</div>]' AS TOBDESC,
         q'[<div><i class="bbs-keywords">Quand l''utiliser : </i><ul>
<li>UNFI (ou un autre fournisseur) demande une correction systematique de la reference a la commande (ex. suppression du check digit).</li>
<li>Un assortiment commandable existe pour fournisseur + article (+ LV optionnel) et doit conserver la meme date de fin en changeant <code>ARAREFC</code>.</li>
</ul></div>
<div><i class="bbs-keywords">Fonctionnement : </i><ol>
<li>Parcourir / Confirmer le fichier Excel (outil 22, modele <code>ICR_TEMPLATE021</code>).</li>
<li>Executer (ou planifier). Le package charge deux lignes <code>INTARTASS</code> par occurrence : cloture OA a <code>TRUNC(SYSDATE-3)</code>, creation OA a partir de <code>TRUNC(SYSDATE-2)</code> avec la nouvelle reference et l''ancienne date de fin.</li>
<li>Le job GOLD <code>psifa07p</code> integre l''interface dans l''assortiment.</li>
</ol></div>
<div><i class="bbs-keywords">Astuce : </i>Reselectionner un fichier reinitialise l''assistant — Confirmer a nouveau avant Valider. Consulter le recapitulatif pour les erreurs d''interface.</div>]' AS TOBDESC2
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

PROMPT 113_tra_techobj_ref_to_order.sql complete — SCR0000000090 helper (us_US + fr_FR)
/