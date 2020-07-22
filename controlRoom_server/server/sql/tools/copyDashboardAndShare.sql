
-- copy Ahmed dashboard and spread it;

DELETE FROM User_Widget WHERE uwpuserid NOT LIKE 'abe%';
INSERT INTO User_Widget
SELECT USERid,
uwpwidid,
uwpdesc,
uwpcontainer,
uwpw_x,
uwpw_y,
uwpwidth,
uwpheight,
uwprows,
upwsnapfile,
SYSDATE,
SYSDATE,
'admin',
uwpchartx,
uwpchartdata,
uwpchartlegend,
uwpcollapse
FROM user_widget, Usersroom
WHERE userid != 'abe'
AND uwpuserid='abe'