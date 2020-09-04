-- Create table
create table TRA_PARAMETERS
(
  tparamid      INTEGER not null,
  tparamdesc    VARCHAR2(100),
  tparamcomment VARCHAR2(300),
  tparamlang    VARCHAR2(5) default 'us_US' not null,
  tparamdcre    DATE default SYSDATE,
  tparamdmaj    DATE default SYSDATE,
  tparamutil    VARCHAR2(20)
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
comment on column TRA_PARAMETERS.tparamid
  is 'Parameter id number';
comment on column TRA_PARAMETERS.tparamdesc
  is 'Description';
comment on column TRA_PARAMETERS.tparamcomment
  is 'Comments';
comment on column TRA_PARAMETERS.tparamlang
  is 'Language';
comment on column TRA_PARAMETERS.tparamdcre
  is 'Creation date';
comment on column TRA_PARAMETERS.tparamdmaj
  is 'Last update';
comment on column TRA_PARAMETERS.tparamutil
  is 'Last user update';
-- Create/Recreate primary, unique and foreign key constraints 
alter table TRA_PARAMETERS
  add constraint TRA_PARAMETER_PKEY primary key (TPARAMID, TPARAMLANG)
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
alter table TRA_PARAMETERS
  add constraint TRA_PARAMETER_FKEY foreign key (TPARAMLANG)
  references LANGUAGE (LANID);
