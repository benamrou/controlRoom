DECLARE numerrs PLS_INTEGER;
BEGIN 

	DBMS_MVIEW.REFRESH(
                LIST => 'MV_SALES',
                method => 'C',
                atomic_refresh => FALSE,
                parallelism => '8');
	DBMS_STATS.gather_table_stats(
                ownname => 'HNCUSTOM2',
                tabname => 'MV_SALES');

END;
/
EXIT;
