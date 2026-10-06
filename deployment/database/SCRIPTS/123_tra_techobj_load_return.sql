-- =============================================================================
-- 123_tra_techobj_load_return.sql
-- TRA_TECHOBJ helper (page-header purple info) for Load for return mass-load
-- Screen: SCR0000000092  |  Route: /loadreturn  |  Tool: 24
-- Audience: Buyer Assistant — keep wording non-technical.
-- Idempotent MERGE — safe to re-run.
-- =============================================================================

SET DEFINE OFF;
SET SCAN OFF;

-- us_US
MERGE INTO TRA_TECHOBJ t
USING (
  SELECT 'SCR0000000092' AS TOBID,
         'Mass-change' AS TOBCAT,
         'us_US' AS TOBLANGUE,
         q'[<div><i class="bbs-keywords">What is it : </i>A simple way for the <b>Buyer Assistant</b> to create many <b>supplier returns</b> at once from an Excel file.</div>
<div><i class="bbs-keywords">Business context : </i>When you need to return items from a store or warehouse to a supplier, fill the template and load it here instead of entering each line by hand.</div>
<div><i class="bbs-keywords">Before you load : </i>
<ul>
<li>The <b>store or warehouse</b> must be valid.</li>
<li>The <b>supplier</b> must be valid.</li>
<li>The <b>item and pack (LV)</b> must be valid.</li>
<li>The <b>quantity</b> must be greater than 0 and expressed in <b>SKU</b>.</li>
<li>That item/pack must be (or have been) <b>orderable</b> for that site from that supplier.</li>
</ul></div>
<div><i class="bbs-keywords">What happens : </i>The system creates the return lines and processes them for store and warehouse automatically.</div>
<div><i class="bbs-keywords">Excel columns : </i><code>SITE</code>, <code>VENDOR_CODE</code>, <code>ITEM_CODE</code>, <code>LV</code>, <code>QTY</code> — download the template first.</div>]' AS TOBDESC,
         q'[<div><i class="bbs-keywords">When to use : </i><ul>
<li>You have several supplier-return lines to create in one go.</li>
<li>You already know the site, supplier, item, pack, and quantity.</li>
</ul></div>
<div><i class="bbs-keywords">How it works : </i><ol>
<li>Download the template, fill it, then Browse / Confirm the file.</li>
<li>Validate — the screen checks site, supplier, item/pack, quantity, and that the item was orderable.</li>
<li>Execute now (or schedule) — returns are created and processed.</li>
</ol></div>
<div><i class="bbs-keywords">Tips : </i>If you pick another file, Confirm again before Validate. Lines for the same site and supplier share one return number.</div>]' AS TOBDESC2
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
  SELECT 'SCR0000000092' AS TOBID,
         'Mass-change' AS TOBCAT,
         'en_GB' AS TOBLANGUE,
         q'[<div><i class="bbs-keywords">What is it : </i>A simple way for the <b>Buyer Assistant</b> to create many <b>supplier returns</b> at once from an Excel file.</div>
<div><i class="bbs-keywords">Business context : </i>When you need to return items from a store or warehouse to a supplier, fill the template and load it here instead of entering each line by hand.</div>
<div><i class="bbs-keywords">Before you load : </i>
<ul>
<li>The <b>store or warehouse</b> must be valid.</li>
<li>The <b>supplier</b> must be valid.</li>
<li>The <b>item and pack (LV)</b> must be valid.</li>
<li>The <b>quantity</b> must be greater than 0 and expressed in <b>SKU</b>.</li>
<li>That item/pack must be (or have been) <b>orderable</b> for that site from that supplier.</li>
</ul></div>
<div><i class="bbs-keywords">What happens : </i>The system creates the return lines and processes them for store and warehouse automatically.</div>
<div><i class="bbs-keywords">Excel columns : </i><code>SITE</code>, <code>VENDOR_CODE</code>, <code>ITEM_CODE</code>, <code>LV</code>, <code>QTY</code> — download the template first.</div>]' AS TOBDESC,
         q'[<div><i class="bbs-keywords">When to use : </i><ul>
<li>You have several supplier-return lines to create in one go.</li>
<li>You already know the site, supplier, item, pack, and quantity.</li>
</ul></div>
<div><i class="bbs-keywords">How it works : </i><ol>
<li>Download the template, fill it, then Browse / Confirm the file.</li>
<li>Validate — the screen checks site, supplier, item/pack, quantity, and that the item was orderable.</li>
<li>Execute now (or schedule) — returns are created and processed.</li>
</ol></div>
<div><i class="bbs-keywords">Tips : </i>If you pick another file, Confirm again before Validate. Lines for the same site and supplier share one return number.</div>]' AS TOBDESC2
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
  SELECT 'SCR0000000092' AS TOBID,
         'Mass-change' AS TOBCAT,
         'fr_FR' AS TOBLANGUE,
         q'[<div><i class="bbs-keywords">Objet : </i>Un moyen simple pour l''<b>assistant acheteur</b> de creer plusieurs <b>retours fournisseur</b> a la fois a partir d''un fichier Excel.</div>
<div><i class="bbs-keywords">Contexte metier : </i>Pour retourner des articles d''un magasin ou entrepot vers un fournisseur, remplir le modele et le charger ici plutot que de saisir chaque ligne a la main.</div>
<div><i class="bbs-keywords">Avant de charger : </i>
<ul>
<li>Le <b>magasin ou entrepot</b> doit etre valide.</li>
<li>Le <b>fournisseur</b> doit etre valide.</li>
<li>L''<b>article et le conditionnement (LV)</b> doivent etre valides.</li>
<li>La <b>quantite</b> doit etre superieure a 0 et exprimee en <b>SKU</b>.</li>
<li>Cet article/conditionnement doit etre (ou avoir ete) <b>commandable</b> pour ce site chez ce fournisseur.</li>
</ul></div>
<div><i class="bbs-keywords">Effet : </i>Le systeme cree les lignes de retour et les traite automatiquement pour magasin et entrepot.</div>
<div><i class="bbs-keywords">Colonnes Excel : </i><code>SITE</code>, <code>VENDOR_CODE</code>, <code>ITEM_CODE</code>, <code>LV</code>, <code>QTY</code> — telecharger le modele d''abord.</div>]' AS TOBDESC,
         q'[<div><i class="bbs-keywords">Quand l''utiliser : </i><ul>
<li>Vous avez plusieurs lignes de retour fournisseur a creer d''un coup.</li>
<li>Vous connaissez deja le site, le fournisseur, l''article, le conditionnement et la quantite.</li>
</ul></div>
<div><i class="bbs-keywords">Fonctionnement : </i><ol>
<li>Telecharger le modele, le remplir, puis Parcourir / Confirmer.</li>
<li>Valider — controle du site, fournisseur, article/conditionnement, quantite et commandabilite.</li>
<li>Executer (ou planifier) — les retours sont crees et traites.</li>
</ol></div>
<div><i class="bbs-keywords">Astuce : </i>Si vous choisissez un autre fichier, Confirmer a nouveau avant Valider. Les lignes d''un meme site et fournisseur partagent un numero de retour.</div>]' AS TOBDESC2
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

PROMPT 123_tra_techobj_load_return.sql complete — SCR0000000092 buyer-facing helper
/
