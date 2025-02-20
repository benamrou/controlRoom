

DELETE FROM ALERTXNTFAC WHERE EXISTS (SELECT 1 FROM sql_tbl_FROM_GOLD_Cfdenfac_TO_InvoiceHead@Heinens_Custom_Prod WHERE "InvoiceNumber"="Invoice #" AND "InvoiceHeadID"  > 3000000
and "SupplierCode"="Vendor code");

insert into alertxntfac
SELECT  foucnuf "Vendor code", efarfou "Invoice #", efadatf "Invoice date", efamfac "Invoice amount", efacfin, sysdate snapdate, foulibl "Supplier desc"
FROM cfdenfac@HEINENS_CUSTOM_PROD, foudgene@HEINENS_CUSTOM_PROD
WHERE efaetat = 3 
and efacfin=foucfin
AND TRUNC(efadatf) >= TRUNC(SYSDATE)
AND NOT EXISTS (SELECT 1 FROM sql_tbl_FROM_GOLD_Cfdenfac_TO_InvoiceHead@Heinens_Custom_Prod WHERE "InvoiceNumber"=efarfou AND "InvoiceHeadID"  > 3000000 
and "SupplierCode"=foucnuf )
AND NOT EXISTS (select 1 FROM XNTFAC@HEINENS_CUSTOM_PROD where xcfrfou=efarfou and xcfcfin=efacfin);

COMMIT;
exit;
/

