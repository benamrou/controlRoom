// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  serverURL: 'http://localhost:8090',
  serverBatchURL: 'http://localhost:8091'
  // @HOME
  //serverURL: 'http://192.168.1.101:8090'
  // EYC Office
};
