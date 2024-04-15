

insert into hei_neg
select  trunc(sysdate)
        stosite STORE_NUM,
        foucnuf supplier_code,
        foulibl supplier_desc,
        pkstrucobj.get_cext(1, dep.strpere) DEPT_CODE,
        pkstrucobj.get_desc(1, dep.strpere, 'HN') DEPT_DESC,
        pkstrucobj.get_cext(1, sdep.strpere) SUB_DEPT_CODE,
        pkstrucobj.get_desc(1, sdep.strpere, 'HN') SUB_DEPT_DESC,
        pkstrucobj.get_cext(1, cat.strpere) CAT_CODE,
        pkstrucobj.get_desc(1, cat.strpere, 'HN') CAT_DESC,
	COUNT(stocinr) OVER ( PARTITION BY cat.strpere ) no_of_items,
        NVL(artuv.arvcexr, pkartrac.Get_Artcexr(1, stocinr)) item_code,
        arvcexv sv,
        barcode UPC,
        pkartuv.get_libelle_long(1,arvcinv, 'HN') SV_DESC,
        qte qty,
        NVL(( SELECT 'Yes' FROM artreap WHERE arecinr = stocinr AND aresite = stosite AND TRUNC(SYSDATE) BETWEEN areddeb AND aredfin AND arecomm != 1 and rownum=1),'No') cgo,
        NVL((SELECT sum(dcdcoli) from CDEDETCDE, CDEENTCDE where ecdcincde=dcdcincde and ecdetat in(1,2,5) and dcdetat in (1,2,5) and dcdcinr=stocinr and ecdsite=stosite and rownum=1), 0) qty_on_order,
        NVL((SELECT to_char(max(ecddliv),'MM/DD/RRRR') from CDEDETCDE, CDEENTCDE where ecdcincde=dcdcincde and ecdetat in (1,2,5) and dcdetat in (1,2,5) and dcdcinr=stocinr and ecdsite=stosite and rownum=1),'')  next_delivery,
        null, null, null,
        sysdate, null
FROM    (
        SELECT stosite, qte,
        decode(qte, 0, 1, 0) zero_stock,
        decode(qte, 0, 0, 1) neg_stock,
        NVL((select 1 from dual where exists (select 1 from stodetre
        where sdrsite = stosite
        and sdrcinr = stocinr
        and pkartstock.RecupCinlUVCparCINRetSEQVL(1, stocinr,sdrseqvl) =stocinl
        and sdrdcre > sysdate - 365)),0) rec_365,
        NVL( (select 1 from dual where exists (select 1 from stomvt
        where stmsite = stosite
        and stmcinl = stocinl
        and stmdmvt > sysdate - 90
        and stmtmvt between 150 and 174)), 0) sold_31,
        stocinl,
        stocinr,
        artetat,
        foucfin,
        foucnuf,
        foulibl,
        (SELECT arccode FROM artcoca
         WHERE ROWID = (SELECT max(ROWID) FROM artcoca
        WHERE stocinl=arccinv AND TRUNC(SYSDATE) BETWEEN arcddeb AND arcdfin)) barcode
        FROM (
        SELECT SUM(NVL(storeai, 0) + NVL(storeal, 0) - NVL(storeav, 0) +
                NVL(storeae, 0) + NVL(storeac, 0) - NVL(storear, 0)) qte,
                stocinl,
                stocinr,
                artetat,
                stosite,
                foucfin,
                foulibl,
                foucnuf
                FROM stocouch  ,  artrac, tbl_REF_HEINENS_SiteAttribute,
                     (SELECT aracinr ,araseqvl, foucfin, foulibl, foucnuf ,COUNT(arasite)
                     FROM artuc , (SELECT foucfin, foulibl, foucnuf FROM foudgene 
                                                       WHERE ( foucnuf = '-1' OR '-1' = '-1' )),
                                   tbl_REF_HEINENS_SiteAttribute,
                         (SELECT objcint
                         FROM strucrel
                         WHERE TRUNC(SYSDATE) BETWEEN objddeb AND objdfin
                         CONNECT BY PRIOR objcint = objpere
                         START WITH objpere IN (SELECT sobcint FROM strucobj WHERE sobcextin = DECODE('-1','-1','1000000000000','-1' ))
                         UNION
                         SELECT sobcint objcint FROM strucobj WHERE sobcextin = DECODE('-1','-1','1000000000000','-1' ))
                     WHERE aracinr = objcint
		     AND ARATCDE=1
             AND  "SiteType" = 10 AND "TopaseGoLiveDate" BETWEEN '1-JAN-18' AND trunc(sysdate)
		     --AND aracexr='960093'
                     AND TRUNC(SYSDATE) BETWEEN araddeb AND aradfin
                                         AND aratfou = 1
                     AND EXISTS ( SELECT 1 FROM reseau WHERE arasite = respere AND ressite = "SiteCode" AND TRUNC(SYSDATE) BETWEEN resddeb AND resdfin )
                     AND ( 1 = -1 OR EXISTS ( SELECT 1 FROM artreap WHERE arecinr = aracinr AND aresite = "SiteCode" AND TRUNC(SYSDATE) BETWEEN areddeb AND aredfin AND arecomm != 1))
                     AND foucfin = aracfin
                     GROUP BY aracinr ,araseqvl, foucfin, foulibl, foucnuf)
                WHERE stotpos = 0
                AND  "SiteType" = 10 AND "TopaseGoLiveDate" BETWEEN '1-JAN-18' AND trunc(sysdate)
                and stosite = "SiteCode"
                and aracinr = stocinr
		and stocinl=pkartstock.RecupCinlUVCparCINRetSEQVL(1, aracinr,araseqvl)
                AND aracinr = artcinr
                GROUP BY stocinl,
                        stocinr,
                        artetat,
                        stosite,
                        foucfin,
                        foulibl,
                        foucnuf )
         WHERE 0 >= qte ),
        artuv,
        strucrel, STRUCTURE cat,
        STRUCTURE sdep,
        STRUCTURE dep
        where arvcinv(+) = stocinl
        and objcint = stocinr
        and trunc(sysdate) between strucrel.objddeb and strucrel.objdfin
        and cat.strcint = objpere
        and cat.strprof = 4
        and cat.stridstr = '1'
        and sdep.strcint = objpere
        and sdep.strprof = 3
        and sdep.stridstr = '1'
        and dep.strcint = objpere
        and dep.strprof = 2
        and dep.stridstr = '1'
        and rec_365 = 1
        and sold_31 = 1
        AND trunc(sysdate) between cat.strddeb and cat.strdfin
        AND trunc(sysdate) between sdep.strddeb and sdep.strdfin
        AND trunc(sysdate) between dep.strddeb and dep.strdfin
	ORDER BY no_of_items DESC, CAT_CODE, qty ASC, item_code  ASC;

commit;

exit;
/
