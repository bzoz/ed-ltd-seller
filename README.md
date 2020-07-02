# ed-ltd-seller
Find best place to sell LTD near Kirre's Icebox

This app connects to [EDDN](https://github.com/EDSM-NET/EDDN/wiki) and listens for commodities market updates. It will print the ID, location, price and demand of the carrier with the best LTD price:
 - the carrier needs to be no further than 30 LY from Kirre's Icebox (Col 285 Sector CC-K a38-2)
 - the demand needs to be higher than 512

The tool will not connect to any other data service, you will only get prices reported after the app was started. This also includes star system - until the app sees the location of the given star system in the datastream, it will produce `NaN LY` distances.

As a bonus, it will also show:
 - the best one way trade route, but only if it finds one with supply and demand higher than 2000
 - the best overall LTD buy price, but also only if the demand is over 2000

You can find those values hardcoded in the `app.js` file.

This is more a POC than a real app, it will also print all unrecognized EDDN messages to the stderr.


## Running
Uses Node.js

```console
npm install
npm start
```

For Windows VS2015 (this exact version) needs to be installed for zeromqjs to build.