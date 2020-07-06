# ed-ltd-seller
Find best place to sell LTD near Kirre's Icebox

This app connects to [EDDN](https://github.com/EDSM-NET/EDDN/wiki) and listens for commodities market updates. It will print the ID, location, price and demand of the carrier with the best LTD price:
 - the carrier needs to be no further than 30 LY from Kirre's Icebox (Col 285 Sector CC-K a38-2)
 - the demand needs to be higher than 200

The tool will not connect to any other data service, you will only get prices reported after the app was started. This also includes star system - until the app sees the location of the given star system in the datastream, it will produce `NaN LY` distances.

You can find those values hardcoded in the `app.js` file.

## Running
Uses Node.js v12.x

```console
npm install
node app.js
```

Optionally call:
```console
node download-systems-data.js
```
This will download star systems data, so you won't get those `NaN ly`.