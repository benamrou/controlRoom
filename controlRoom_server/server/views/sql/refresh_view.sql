DECLARE numerrs PLS_INTEGER;
BEGIN 
	DBMS_MVIEW.REFRESH(
		LIST => 'MV_DSHSAL000001',         
		method => 'C', 
		atomic_refresh => FALSE, 
		parallelism => '8');

END;
/
EXIT;
