-- Language table
INSERT INTO LANGUAGE (lanid,landesc,landcre,landmaj,lanutil) VALUES ('us_US', 'American', SYSDATE, SYSDATE, 'bbs');
-- USERSROOM table
INSERT INTO USERSROOM (userid,usercorp,userprof,userappli,userpass,userauth,userlang,userfname,userlname,useremail,usermobile,
                       userteam,useractive,userdcre,userdmaj,userutil) 
                VALUES ('us', NULL, NULL, 1,NULL, 0, 'us_US', 'Master', 'Master admin', 'masteradmin@bbsymphony.com', '+16789863021',
								       1, 1, SYSDATE, SYSDATE, 'bbs');

