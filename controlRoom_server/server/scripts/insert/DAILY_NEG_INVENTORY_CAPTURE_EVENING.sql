


UPDATE hei_neg
SET eod_qty = (SELECT SUM(NVL(storeai, 0) + NVL(storeal, 0) - NVL(storeav, 0) +
                NVL(storeae, 0) + NVL(storeac, 0) - NVL(storear, 0))
                FROM stocouch  ,  artuv
                WHERE arvcexr=item_code
                AND arvcexv=sv
                AND stocinl=arvcinv
                AND stosite=STORE_NUM
                AND stotpos=0),
     eod_qty_on_order=
     NVL((SELECT sum(dcdcoli) from CDEDETCDE, CDEENTCDE, artrac
          where ecdcincde=dcdcincde and ecdetat=5 and dcdetat=5 and dcdcinr=artcinr AND artcexr=ITEM_CODE and ecdsite=STORE_NUM), 0),
     eod_next_delivery=
     (SELECT TRUNC(MAX(ecddliv)) from CDEDETCDE, CDEENTCDE, artrac, foudgene
      where ecdcincde=dcdcincde and ecdetat=5 and dcdetat=5 and dcdcinr=artcinr AND artcexr=item_code and ecdsite=STORE_NUM AND ecdcfin=foucfin AND foucnuf=supplier_code),
      snapeod=SYSDATE;
commit;

exit;
/
