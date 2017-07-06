-- Create table
create table PARAMETERS
(
  paramid    INTEGER not null,
  paramentry INTEGER not null,
  paramappli INTEGER not null,
  paramcorp  VARCHAR2(5),
  paramval1  INTEGER,
  paramval2  INTEGER,
  paramval3  INTEGER,
  paramval4  INTEGER,
  paramval5  INTEGER,
  paramchar1 VARCHAR2(50),
  paramchar2 VARCHAR2(50),
  paramchar3 VARCHAR2(50),
  paramchar4 VARCHAR2(50),
  paramchar5 VARCHAR2(50),
  paramdcre  DATE default Sysdate,
  paramdmaj  DATE default Sysdate,
  paramutil  VARCHAR2(20)
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
comment on column PARAMETERS.paramid
  is 'Parameter id';
comment on column PARAMETERS.paramentry
  is 'Entry number';
comment on column PARAMETERS.paramappli
  is 'Parameter application';
comment on column PARAMETERS.paramcorp
  is 'Parameter corporation';
comment on column PARAMETERS.paramval1
  is 'Numerical parameter value #1';
comment on column PARAMETERS.paramval2
  is 'Numerical parameter value #2';
comment on column PARAMETERS.paramval3
  is 'Numerical parameter value #3';
comment on column PARAMETERS.paramval4
  is 'Numerical parameter value #4';
comment on column PARAMETERS.paramval5
  is 'Numerical parameter value #5';
comment on column PARAMETERS.paramchar1
  is 'Alphanumerical parameter value #1';
comment on column PARAMETERS.paramchar2
  is 'Alphanumerical parameter value #2';
comment on column PARAMETERS.paramchar3
  is 'Alphanumerical parameter value #3';
comment on column PARAMETERS.paramchar4
  is 'Alphanumerical parameter value #4';
comment on column PARAMETERS.paramchar5
  is 'Alphanumerical parameter value #5';
comment on column PARAMETERS.paramdcre
  is 'Creation date';
comment on column PARAMETERS.paramdmaj
  is 'Last update';
comment on column PARAMETERS.paramutil
  is 'Last user update';
-- Create/Recreate primary, unique and foreign key constraints 
alter table PARAMETERS
  add constraint PARAMETERS_PKEY primary key (PARAMID, PARAMAPPLI, PARAMENTRY)
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
