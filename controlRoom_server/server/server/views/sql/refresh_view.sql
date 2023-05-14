DECLARE numerrs PLS_INTEGER;
BEGIN 
	DBMS_MVIEW.REFRESH(
		LIST => 'MV_DSHPI000001',         
		method => 'C', 
		atomic_refresh => FALSE, 
		parallelism => '8');


	DBMS_STATS.gather_table_stats(
    		ownname => 'CONTROLROOM',
    		tabname => 'MV_DSHPI000001');

END;
/
EXIT;
