set termout off
set feed off
set head off
set echo off


INSERT INTO service_rate
WITH ITEM_SCOPE AS
 (SELECT DISTINCT FOUCNUF, foucfin, ARACEXR, ARACINR, ARASITE, ARASEQVL
    FROM ARTUC, FOUDGENE
   WHERE ARACFIN = FOUCFIN
     AND aradfin >= TRUNC(SYSDATE-365)),
ORDERS AS
 (SELECT SC.FOUCNUF,
         ARASITE,
	 DCDCEXCDE,
         DCDCINCDE,
         DCDSITE,
         DCDCINR,
         DCDDLIV,
         ARACEXR,
         DCDUAUVC,
         SUM(DCDQTEC / DCDUAUVC) QTY_ORDERED
    FROM CDEDETCDE,
         ITEM_SCOPE                    SC
   WHERE DCDCFIN = FOUCFIN
     AND DCDCINR = ARACINR
     AND dcdseqvl=ARASEQVL
     AND DCDETAT > 5
     AND TRUNC(DCDDCOM) >= TRUNC(SYSDATE-2)
     AND NOT EXISTS (SELECT 1 FROM SERVICE_RATE WHERE PO_NUM_INT=dcdcincde AND item_code=aracexr)
   GROUP BY SC.FOUCNUF, ARASITE, DCDCINCDE, DCDCINR, ARACEXR, DCDDLIV, DCDSITE,DCDUAUVC),
RECEIPT AS
 (SELECT FOUCNUF VENDOR_CODE,
         ARASITE WHS_CODE,
         ARACEXR ITEM_CODE,
         QTY_ORDERED,
         DCDSITE,
         DCDCINCDE,
	 DCDCEXCDE,
         DCDUAUVC,
         NVL((SELECT TRUNC(ORD.SDRSDRC)
               FROM STODETRE ORD
              WHERE SDRCINCDE = DCDCINCDE
                AND SDRCINR = DCDCINR
                AND ROWNUM = 1),
             TRUNC(DCDDLIV)) RECEIVING_DAY,
         NVL((SELECT SUM(NVL(ORD.SDRQTEA, 0) / ORD.SDRUAUVC)
               FROM STODETRE ORD
              WHERE SDRCINCDE = DCDCINCDE
                AND SDRCINR = DCDCINR),
             0) QTY_RECEIVED
    FROM ORDERS)
SELECT WHS_CODE,
       VENDOR_CODE,
       DCDSITE STORE_CODE,DCDCINCDE PO_NUM_INT,
       ITEM_CODE,
       RECEIVING_DAY,
       DCDUAUVC SKU_PU,
       QTY_ORDERED,
       QTY_RECEIVED,
       0 FILL_RATE,
	DCDCEXCDE
  FROM RECEIPT RCP;



/** Service rate update */
MERGE INTO service_rate dst
USING (
  SELECT sercincde PO_INT,
         foucnuf,
         sersite,
         sdrcexr,
         TRUNC(serdrec) RECEIVING_DAY,
         SUM(sdrqteo) sdrqteo,
         SUM(sdrqtea) sdrqtea,
         sdruauvc
  FROM   stodetre@heinens_custom_prod, stoentre@heinens_custom_prod, 
         foudgene@HEINENS_CUSTOM_PROD
  WHERE sercinrec=sdrcinrec AND TRUNC(serdrec)=TRUNC(SYSDATE)
  AND sercfin=foucfin
  GROUP BY sercincde,foucnuf,sersite,sdrcexr,sdruauvc, TRUNC(serdrec)
) src ON (src.PO_INT = dst.PO_NUM_INT
          AND src.sdrcexr=dst.item_code)
WHEN MATCHED THEN UPDATE 
  SET dst.qty_received = src.sdrqtea/src.sdruauvc,
      fill_rate=DECODE(qty_ordered,0,1,qty_received/qty_ordered);


COMMIT;





exit success
