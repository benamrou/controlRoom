DROP MATERIALIZED VIEW MV_DSHSAL000001;
CREATE MATERIALIZED VIEW MV_DSHSAL000001
NOLOGGING
AS
SELECT DISTINCT socsite STORE_ID, 
       soclmag STORE_DESC, 
       res_stomvt.reslevel NETWORK_LEVEL, 
       res_stomvt.respere PARENT_NETWORK_ID,
       trobdesc PARENT_NETWORK_DESC,
       TRUNC(stmdmvt),
       arvcexr ITEM_ID,
       pkartuv.get_libelle_long@heinens_custom_prod(1, arvcinv, 'HN') ITEM_DESC,
       strlevel STRUCTURE_LEVEL,
       sobcext PARENT_STRUCTURE_ID,
       tsobdesc PARENT_STRUCTURE_DESC,
       foucnuf  VENDOR_ID,
       foulibl  VENDOR_DESC,
       foutype VENDOR_TYPE,
       DECODE(aresite, NULL, 0, 1) CAO,
       stmtmvt,
       stmval,
       stmvpr,
       stmvpv,
       (stmvpv-stmvpr)/stmvpr margin
 FROM stomvt@heinens_custom_prod, 
     sitdgene@heinens_custom_prod,
     reseau@heinens_custom_prod res_stomvt,
     reseau@heinens_custom_prod res_artuc,
     tra_resobj@heinens_custom_prod t,
     strucrel@heinens_custom_prod,
     STRUCTURE@heinens_custom_prod str,
     tra_strucobj@heinens_custom_prod s,
     strucobj@heinens_custom_prod,
     artuv@heinens_custom_prod,
     foudgene@heinens_custom_prod,
     artuc@heinens_custom_prod,
     artreap@heinens_custom_prod
WHERE socsite=stmsite
AND soccmag=10
AND stmtmvt =150
AND TRUNC(stmdmvt) >= TRUNC(SYSDATE-7*5*8)  -- Last three months
AND res_stomvt.ressite=socsite
AND TRUNC(stmdmvt) BETWEEN res_stomvt.resddeb AND res_stomvt.resdfin
AND trobid=res_stomvt.respere
AND t.langue='HN'
--AND arvcexr='900627'
AND stmcinl=arvcinv
AND objcint=arvcinr
AND TRUNC(stmdmvt) BETWEEN objddeb AND objdfin
AND strcint=objpere
AND TRUNC(stmdmvt) BETWEEN strddeb AND strdfin
AND sobcint=strcint
AND tsobcint=sobcint
AND s.langue=t.langue
-- Vendor information
AND stmseqvl=araseqvl  (+)
AND arvcinr=aracinr  (+)
AND stmsite=res_artuc.ressite
AND res_artuc.respere= arasite(+)
AND TRUNC(stmdmvt) BETWEEN res_artuc.resddeb AND res_artuc.resdfin
AND aratcde (+)=1 
AND aratfou (+)=1 
AND foucfin=aracfin 
-- CAO parameter
AND stmcinl=arecinl (+)
AND stmsite = aresite (+)
AND TRUNC(stmdmvt) BETWEEN areddeb (+) AND aredfin (+);

