set termout off
set feed off
set head off
set echo off

update cdeentcde ecd1 set ecdetat=7, ecdmotifsol=14, ecddmaj=sysdate, ecdutil='minwell' 
where ecdnfilf=1
and ecdetat=3
and exists (select 1 from foudgene where foucfin=ecdcfin and foucnuf='08531')
and exists (select 1 from fouccom where fccccin=ecdccin and fccnum='08531CCW')
and trunc(ecddenvoi)=trunc(sysdate)
and (select sum(pcdmont) from cdeentcde ecd2, cdepied
      where ecd2.ecdcfin=ecd1.ecdcfin
      and ecd2.ecdnfilf=ecd1.ecdnfilf
      and ecd2.ecdccin=ecd1.ecdccin
      and ecd2.ecdsite=ecd1.ecdsite
      and ecd2.ecdcincde=pcdcincde
      and trunc(ecd2.ecddenvoi)=trunc(ecd1.ecddenvoi)
      and pcdrubr=1) < 150;


update cdedetcde set dcdetat=7, dcddmaj=sysdate, dcdutil='minwell' 
where exists (select 1 from cdeentcde where dcdcincde=ecdcincde and dcdcfin=ecdcfin and dcdsite=ecdsite and ecdetat=7 and trunc(ecddenvoi)=trunc(sysdate) and ecdmotifsol=14);

commit;

exit success;

