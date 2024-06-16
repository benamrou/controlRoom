// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: true,
  //Heinen's PROD OCI
  hostURL           : "http://10.227.100.75:8090",
  serverURL_local   : "http://10.227.100.75:8093",
  serverURL         : "http://10.227.100.75:8093",
  serverBatchURL    : "http://10.227.100.75:8091",
  baseURL           : "http://10.227.100.75:8090/icr",
 
   //hostURL           : "http://heinens-prdapp.srai.heinens.com:8090",
   //serverURL_local   : "http://heinens-prdapp.srai.heinens.com:8093",
   //serverURL         : "http://heinens-prdapp.srai.heinens.com:8093",
   //serverBatchURL    : "http://heinens-prdapp.srai.heinens.com:8091",
   //baseURL           : "http://heinens-prdapp.srai.heinens.com:8090/icr",
  //Heinen's TEST
  //hostURL           : "http://10.200.14.232:9086",
  //serverURL_local   : "http://10.200.14.232:8093",
  //serverURL         : "http://10.200.14.232:8093",
  //serverBatchURL    : "http://10.200.14.232:8091",
  //baseURL           : "http://10.200.14.232:9086/icr",
  //message: "",
  // @HOME
  //hostURL           : "http://locahost:9086",
  //serverURL         : 'http://localhost:8090',
  //serverURL_local   : "http://localhost:8090",
  //serverBatchURL    : 'http://localhost:8091',
  //baseURL           : "http://localhost:9086/icr",
};
 