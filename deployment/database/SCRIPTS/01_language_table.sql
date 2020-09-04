-- Create table
create table LANGUAGE
(
  lanid   VARCHAR2(5) not null,
  landesc VARCHAR2(30) not null,
  landcre DATE not null,
  landmaj DATE not null,
  lanutil VARCHAR2(20) not null
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
comment on column LANGUAGE.lanid
  is 'Language ID ';
comment on column LANGUAGE.landesc
  is 'Lamguage description';
comment on column LANGUAGE.landcre
  is 'Creation date';
comment on column LANGUAGE.landmaj
  is 'Update date';
comment on column LANGUAGE.lanutil
  is 'Last user update';
-- Create/Recreate primary, unique and foreign key constraints 
alter table LANGUAGE
  add constraint LANGUAGE_PKEY primary key (LANID)
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
