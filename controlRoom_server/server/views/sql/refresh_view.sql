DECLARE numerrs PLS_INTEGER;
BEGIN 
/*	DBMS_MVIEW.REFRESH(
		LIST => 'MV_DSHPI000001',         
		method => 'C', 
		atomic_refresh => FALSE, 
		parallelism => '8');


	DBMS_STATS.gather_table_stats(
    		ownname => 'HNCUSTOM2',
    		tabname => 'MV_DSHPI000001');
*/

/* dbms_mview.refresh('mv_onecount_meat_items');*/
  EXECUTE IMMEDIATE 'drop materialized view mv_onecount_meat_items' ;
  
  EXECUTE IMMEDIATE 'create materialized view mv_onecount_meat_items
  NOLOGGING
  PARALLEL
  BUILD IMMEDIATE
  REFRESH FORCE ON DEMAND
  as
  SELECT * FROM vw_onecount_meat_items';



	DBMS_STATS.gather_table_stats(
                ownname => 'HNCUSTOM2',
                tabname => 'MV_ONECOUNT_MEAT_ITEMS');
END;
/
EXIT;
