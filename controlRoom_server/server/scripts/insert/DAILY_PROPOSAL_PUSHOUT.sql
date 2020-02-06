

INSERT INTO HEI_PUSHOUT
SELECT pdcdcde ORDER_DATE, SOCSITE WHS_CODE, SOCLMAG WHS_DESC, FOUCNUF VENDOR_CODE, FOULIBL VENDOR_DESC,
       (SELECT COUNT(1) FROM prpdetprop a WHERE  pdcnprop=lpcnprop AND foucfin=a.lpccfin AND lpcsite=pdcsite AND lpcqtec != lpcqtei AND lpcqtei IS NOT NULL) NB_PUSHOUT,
       (SELECT COUNT(1) FROM prpdetprop a WHERE  pdcnprop=lpcnprop AND foucfin=a.lpccfin AND lpcsite=pdcsite AND lpcqtec > 0) NB_ITEM_PROPOSED,
       (SELECT COUNT(1) FROM prpdetprop a WHERE  pdcnprop=lpcnprop AND foucfin=a.lpccfin AND lpcsite=pdcsite ) NB_TOTAL_ITEM,
       (SELECT tparlibl FROM tra_parpostes WHERE tpartabl=1703 AND tparpost=pdctpro AND langue='HN' AND tparcmag=0) PROPOSAL_TYPE,
       PDCVALIDE VALIDATED
FROM prpentprop, sitdgene, foudgene
WHERE pdcsite=socsite
AND pdccfin=foucfin
AND pdcvalide =1 ;

commit;

exit;
/
