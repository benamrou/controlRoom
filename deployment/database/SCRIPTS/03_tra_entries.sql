-- Create table
create table TRA_ENTRIES
(
  tentryparamid INTEGER not null,
  tentryid      INTEGER not null,
  tentrydesc    VARCHAR2(100),
  tentrycomment VARCHAR2(300),
  tentrylang    VARCHAR2(5) default 'us_US' not null,
  tentrydcre    DATE default SYSDATE,
  tentrydmaj    DATE default SYSDATE,
  tentryutil    VARCHAR2(20)
)
tablespace USERS
  pctfree 10
  initrans 1
  maxtrans 255
  storage
  (
    initial 64K
    next 1M
    minextents 1
    maxextents unlimited
  );
-- Add comments to the columns 
comment on column TRA_ENTRIES.tentryid
  is 'Entry id number';
comment on column TRA_ENTRIES.tentrydesc
  is 'Description';
comment on column TRA_ENTRIES.tentrycomment
  is 'Comments';
comment on column TRA_ENTRIES.tentrylang
  is 'Language';
comment on column TRA_ENTRIES.tentrydcre
  is 'Creation date';
comment on column TRA_ENTRIES.tentrydmaj
  is 'Last update';
comment on column TRA_ENTRIES.tentryutil
  is 'Last user update';
comment on column TRA_ENTRIES.tentryparamid
  is 'Parameter id number';
-- Create/Recreate primary, unique and foreign key constraints 
alter table TRA_ENTRIES
  add constraint TRA_ENTRIES_PKEY primary key (TENTRYID, TENTRYLANG, tentryparamid)
  using index 
  tablespace USERS
  pctfree 10
  initrans 2
  maxtrans 255
  storage
  (
    initial 64K
    next 1M
    minextents 1
    maxextents unlimited
  );
alter table TRA_ENTRIES
  add constraint TRA_ENTRIES_FKEY foreign key (TENTRYLANG)
  references LANGUAGE (LANID);
