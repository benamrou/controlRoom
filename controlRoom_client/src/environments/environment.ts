// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: true,
  hostURL           : "http://10.200.14.232:9086",
  serverURL_local   : "http://10.200.14.232:8090",
  serverURL         : "http://10.200.14.232:8090",
  serverBatchURL    : "http://10.200.14.232:8091",
  baseURL           : "http://10.200.14.232:9086/icr",
  message: ""
  //serverURL: 'http://localhost:8090',
  // serverBatchURL: 'http://localhost:8091'
  // @HOME
  //serverURL: 'http://192.168.1.101:8090'
  // HEINENS Office
};
