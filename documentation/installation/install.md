
## Installing

The following topics provide information and instructions for installing the BMC Cloud Lifecycle Management solution:

- Preparing for installation
- Performing the installation
- Verifying the installation
- Uninstalling ICR


## Planning your installation
Before you start installing ICR solution, you must gather information about the required parameters that the installer prompts for the product. You can then review the installation timing of each product to plan for the installation.

?> **Note**
If any of your hosts accidentally crashes after you install a product successfully, you must reinstall the product on the same host or a different host. The installer allows you to perform such an installation.

The following sections explain how you can plan for the ICR solution installation:

- Gathering information for the installation
- Installation timing
- Enabling logs if you run into problems
- Related topics

## Gathering information for the installation
Use the planning spreadsheet to help prepare input values for the installer. To avoid installation errors, refer to the spreadsheet when you run the installation.

To plan for your installation using the check/task list:


### ICR Server 
#### Pre-requisite

!> **Important** notice ICR server requires [NodeJs](https://nodejs.org/) installation. NodeJs installation instruction are available on NodeJs website https://nodejs.org/. To ease the deployment install [NPM](https://www.npmjs.com/). NodeJs and NPM are coming bundled from NodeJs installation , if that's not the case you will have to install them separately.

Command for NodeJs unix installation
```console
sudo apt install nodejs
```
Command for NPM unix installation
```console
sudo apt install npm
```
####  Server Check/Task list

| Step                 | Task description                            |
| -------------------- | ------------------------------------------  |
| #1                   | Select a remote Staging Directory Information     |
| #2                   | Define ICR_SERVER variable in .profile pointing to server folder      |

Set command to be deploy in .profile or equivalent when loggin with the user
```console
[hnapptest02:hntcen]/home/hntcen>set ICR_SERVER=/opt/apps/controlRoom/controlRoom_server/server
[hnapptest02:hntcen]/home/hntcen>echo $ICR_SERVER
/opt/apps/controlRoom/controlRoom_server/server
[hnapptest02:hntcen]/home/hntcen>
```

### ICR Client 

##### Pre-requisite

!> **Important** notice ICR client requires a web server. The webtool distribution are deployed inside the web server. The development team have been worjing with Tomee web server.

####  Client Check/Task list
| Step                 | Task description                              |
| -------------------- | ------------------------------------------  |
| #1                   | Gather the web server (e.g. Tomee) path ..../apache-tomee-webprofile-1.7.3/webapps/  |
| #2                   | Define ICR_CLIENT variable in .profile pointing to server folder      |

ICR client file are deployed in the webapps/icr/ folder:
```console
[server:user]/.../apache-tomee-webprofile-1.7.3/webapps/icr>ls
3.7b571afe96169742ccfe.js  34.c3f31d734ebd6192a7a4.js                 fa-solid-900.c2801fb415f03c7b1709.svg
14.bf4170de7415d24d1bdf.js  35.3b2a338a104b756b9634.js                 favicon.ico
15.b5d5246009ae091ff731.js  36.78f09d9b185f66641d85.js                 fontawesome-webfont.674f50d287a8c48dc19b.eot
1.6a243d540a456e077177.js   37.943c5a1985346a9cd9aa.js                 fontawesome-webfont.912ec66d7572ff821749.svg
16.ef7461d35fe82a5db4c7.js  3.d6abb47831ac546fcde6.js                  fontawesome-webfont.af7ae505a9eed503f8b8.woff2
17.cd2e576a21917c9be53a.js  3rdpartylicenses.txt                       fontawesome-webfont.b06871f281fee6b241d6.ttf
18.37d12185a17bbc455d3b.js  5.d900d6e4be322b9e8439.js                  fontawesome-webfont.fee66e712a8a08eef580.woff
19.20bb742a1c29373b36b6.js  6.2e7e4621a2e83816c612.js                  hue.0614c27197fc3ce572e1.png
20.46cf4ef77adff8a59824.js  7.167247159ec5accd3bd8.js                  index.html
21.104003ac6110c9b0de16.js  8.e957fbd524b370143fa9.js                  line.567f57385ea3dde2c9ae.gif
22.556d43ef40b8ccc20ecf.js  9.35f3b2059858c28add0a.js                  loading.8732a6660b528fadfaeb.gif
23.e5f34b302f64b7e41d48.js  assets                                     main.c1e70b886a4820630313.js
24.3de436f5ae5eb2536957.js  color.c7a33805ffda0d32bd2a.png             password-meter.d59e6dc2616c53ce8e77.png
25.f95933d056661a6393cd.js  common.44499ce48aea54d68556.js             polyfills.2284e5e75c7810bf611a.js
26.9960d7c9155b097b5d0f.js  fa-regular-400.65b286af947c0d982ca0.ttf    primeicons.38d77552b0353684a208.svg
27.e31598790229b6fd635f.js  fa-regular-400.7b9568e6389b1f8ae090.svg    primeicons.473e2a746d3c151d7dca.ttf
28.b1ca346fb3bd488f807d.js  fa-regular-400.c1a866ec0e04a5e1915b.eot    primeicons.71bb3d79dcf18b45ae84.woff
29.5efc88de995492ad56d5.js  fa-regular-400.c4f508e7c4f01a9eeba7.woff   primeicons.b8eccb1059ea5faaf6d8.eot
2.bac16f927179b7185bbd.js   fa-regular-400.f5f2566b93e89391da4d.woff2  runtime.6fb204d8f3386a54a4e9.js
30.15b5b01f0897e5a5e4b9.js  fa-solid-900.0bff33a5fd7ec3902354.ttf      scripts.d166cef3882d735b5181.js
31.4223bce70c5c8ead6c30.js  fa-solid-900.333bae208dc363746961.woff     styles.874b72628ea073e14c25.css
32.8f41288b7d4eacf9fd7b.js  fa-solid-900.44d537ab79f921fde5a2.woff2
33.bc5170eec7e4c0390af8.js  fa-solid-900.8e4a6dcc692b3887f9f5.eot
```

### Installation timing
The following table lists the estimated installation timing of ICR solution. You can use this information for planning your installation of the solution.

?> **Note**
The installation timing varies, based on the hardware configuration and system performance of the installer host and the product target hosts.


| Product              | Installation timing    (hh:mm)               |
| -------------------- | ------------------------------------------  |
| ICR Server           | 01:15  |
| ICR Client           | 00:20     |
