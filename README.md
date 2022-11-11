# ICR - Inventory Control Room

ICR Dashboard Admin App built using Angular, PrimeNG and Bootstrap 
This tool provides an overview of a company's key Supply chain metrics. More View Dashboard Supply Chain Management, this inventory management tool displays key metrics such as inventory information and englobs tool supporting the operations.

Extended tools deployed:
 * Third-party company inventory automatic load results
 * Supplier schedule management: Holiday management and schedule generation
 * Smart Use-By-date reporting
 * Item look-up information
 * Run batch/jobs
 * Help desk support - Tracking and auto-fixing issues
 * Mass data change:
    - Item/Category
    - Item attribute
    - Item/SV attribute
    - SV notes
 * Alerts reports

## Coding skills
The client (frontend) is requesting the following skillset: 
 * Angular (Typescript)
 * HTML/CSS
 * PrimeNG toolkit
 
The server (backend) is developped with the following technologies:
 * NodeJS
 * Javascript
 * Unix Bash
 * Oracle SQL

node-oracle is the api used interoperabilty with Oracle and the middleware.

## Install
In order to start the project use:

```bash
$ git clone https://github.com/benamrou/controlRoom
$ cd controlRoom_client
# install the project's dependencies
$ npm install

# edit the environment information located in src/environments/environment.ts
export const environment = {
  production: true,
  //XXXXXXXX
  hostURL           : "http://xx.xxx.xx.xxx:9086",
  serverURL_local   : "http://xx.xxx.xx.xxx:8090",
  serverURL         : "http://xx.xxx.xx.xxx:8090",
  serverBatchURL    : "http://xx.xxx.xx.xxx:8091",
  baseURL           : "http://xx.xxx.xx.xxx:9086/icr",
};

# Start the client
$ npm start


