# ed-ltd-seller
Live updated best place to sell LTD near Kirre's Icebox:
![app screenshot](https://github.com/bzoz/ed-ltd-seller/blob/main/screenshot.png?raw=true)

This app connects to [EDDN](https://github.com/EDSM-NET/EDDN/wiki) and listens for commodities market updates. It will print the ID, location, price and demand of the carrier with the best LTD price:
 - the carrier needs to be no further than 30 LY from Kirre's Icebox (Col 285 Sector CC-K a38-2)
 - the demand needs to be higher than 200
 
You can find those values hardcoded in the `app.js` file.

Basically, you will get the most up-to-date data about the market.

The tool will not connect to any other data service, you will only get prices reported after the app was started. This also includes star system - until the app sees the location of the given star system in the datastream, it will produce `NaN LY` distances.

## Running

You will need:
 - [Node.js v12.x](https://nodejs.org/dist/v12.18.2/node-v12.18.2-x64.msi) - the app is written using this
 - [Memurai](https://www.memurai.com/get-memurai) - for the database
 - [Thie app itself](https://github.com/bzoz/ed-ltd-seller/archive/main.zip)

To run the app:
 - Install both Memurai and Node.js
 - Extract the ZIP-file with the app to any folder
 - Run `init.cmd` - it will install dependancied for the app and will download the starsystem data from [EDSM](https://www.edsm.net/). The download is about 2GB, and it will use about 4GB of disk space. Alternatively, run `init-nodb.cmd`. It will not download any star data, but will only rely on the data from the EDDN messages. In practice this means it will take the app some time before it will start displaying distances to the selling carriers. 
 - Run `run.cmd` - this will start the app. It will take some time before first info about carriers buyin LTD arrives, be paintent.
 
 
## Running - command line
```console
npm install
node app.js
```

Optionally call:
```console
node download-systems-data.js
```
This will download star systems data, so you won't get those `NaN ly`.
