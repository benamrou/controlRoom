set termout off
set feed off
set head off
set echo off

INSERT INTO FILL_RATE
WITH ITEM_SCOPE AS
 (SELECT DISTINCT FOUCNUF, ARACEXR, ARACINR, ARASITE
    FROM ARTUC@HEINENS_CUSTOM_PROD, FOUDGENE@HEINENS_CUSTOM_PROD
   WHERE ARACFIN = FOUCFIN
     AND aradfin >= TRUNC(SYSDATE-365)),
ORDERS AS
 (SELECT SC.FOUCNUF,
         ARASITE,
         DCDCINCDE,
         DCDSITE,
         DCDCINR,
         DCDDLIV,
         ARACEXR,
         DCDUAUVC,
         SUM(DCDQTEC / DCDUAUVC) QTY_ORDERED,
	 DCDCEXCDE
    FROM CDEDETCDE@HEINENS_CUSTOM_PROD,
         FOUDGENE@HEINENS_CUSTOM_PROD  CENTRAL,
         ITEM_SCOPE                    SC
   WHERE CENTRAL.FOUCNUF = 'H0' || ARASITE
     AND DCDCFIN = CENTRAL.FOUCFIN
     AND DCDCINR = ARACINR
     AND DCDETAT > 5
     AND TRUNC(DCDDCOM) >= TRUNC(SYSDATE-2)
     AND NOT EXISTS (SELECT 1 FROM FILL_RATE WHERE PO_NUM_INT=DCDCINCDE)
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
               FROM STODETRE@HEINENS_CUSTOM_PROD ORD
              WHERE SDRCINCDE = DCDCINCDE
                AND SDRCINR = DCDCINR
                AND ROWNUM = 1),
             TRUNC(DCDDLIV)) PREP_DAY,
         NVL((SELECT SUM(NVL(ORD.SDRQTEA, 0) / ORD.SDRUAUVC)
               FROM STODETRE@HEINENS_CUSTOM_PROD ORD
              WHERE SDRCINCDE = DCDCINCDE
                AND SDRCINR = DCDCINR),
             0) QTY_RECEIVED
    FROM ORDERS)
SELECT WHS_CODE,
       VENDOR_CODE,
       DCDSITE STORE_CODE,DCDCINCDE PO_NUM_INT,
       ITEM_CODE,
       PREP_DAY,
       DCDUAUVC SKU_PU,
       QTY_ORDERED,
       QTY_RECEIVED,
       NULL FILL_RATE,
	DCDCEXCDE
  FROM RECEIPT RCP
 ORDER BY PREP_DAY ASC;
 
MERGE INTO fill_rate dst
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
  WHERE sercinrec=sdrcinrec AND TRUNC(serdrec)>=TRUNC(SYSDATE-1)
  AND sercfin=foucfin
  AND foutype=3
  GROUP BY sercincde,foucnuf,sersite,sdrcexr,sdruauvc, TRUNC(serdrec)
) src ON (src.PO_INT = dst.PO_NUM_INT
          AND src.sdrcexr=dst.item_code)
WHEN MATCHED THEN UPDATE 
  SET dst.qty_received = src.sdrqtea/src.sdruauvc,
      fill_rate=DECODE(qty_ordered,0,1,qty_received/qty_ordered);


COMMIT;





exit success
