
DELETE FROM ALERTXNTCDE WHERE exists(select 1  FROM SQL_tbl_FROM_GOLD_Cdeentcde_TO_POHeader@Heinens_Custom_Prod where "SupplierCode"="Vendor code" and "PurchaseOrder"="PO#");

/* DELETE FROM ALERTXNTCDE;i */
insert into ALERTXNTCDE
select ecdcincde,ecdsite "Location", ecdcexcde "PO#", foucnuf "Vendor code",  foulibl "Vendor desc.", fccnum "Comm. contract",
        to_char(ecddcom,'MM/DD/RR') "Order date", ecdetat "Status", to_char(ecddliv,'MM/DD/RR') "Delivery date",
        NVL(ecdintf, liscomc) || ' | ' || pkparpostes.get_postlibl@heinens_custom_prod(1,10,114,NVL(ecdintf, liscomc),'HN') "Communication mode",
       (select count(1) from cdedetcde@heinens_custom_prod where dcdcincde=ecdcincde and ecdcfin=dcdcfin) "Nb items",
	SYSDATE "SNAPDATE"
from cdeentcde@heinens_custom_prod, foudgene@heinens_custom_prod,
     fouccom@heinens_custom_prod, lienserv@heinens_custom_prod
where ecdcfin=foucfin
and ecdccin=fccccin
/* TODAY PO */
and trunc(ecddcom)=trunc(sysdate)
and ecdetat=5
AND ecdcfin = liscfin
AND ecdccin = lisccin
AND ecdnfilf = lisnfilf
AND trunc(ecddcom) BETWEEN lisddeb AND lisdfin
and lissite=ecdsite
and ecdsite !=93080
/* EDI */
--AND NVL(pkparpostes.get_parcopie_postvan2(1,114,NVL(ecdintf, liscomc)), 0) = 1
--AND liscomc in (8,9)
and foutype =1 /* External */
/** NOT in SQL **/
and not exists (select 1  FROM SQL_tbl_FROM_GOLD_Cdeentcde_TO_POHeader@Heinens_Custom_Prod where "PurchaseOrder"=ecdcexcde and "SupplierCode"=foucnuf)
and not exists (select 1 from XNTCDE@heinens_custom_prod where xcdcincde=ecdcincde)

COMMIT;
exit;
/

