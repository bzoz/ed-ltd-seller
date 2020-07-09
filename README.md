# ed-ltd-seller
Live tracker of buy and sell prices accros the Elite Dangerous universe
![app screenshot](https://github.com/bzoz/ed-ltd-seller/blob/main/screenshots/all.png?raw=true)

This app connects to [EDDN](https://github.com/EDSM-NET/EDDN/wiki) and listens for commodities market updates. It can:
 - print highest sell price (and location) of the given commodity
 - lowest buying price
 - it can also find in-system trade routes, like a carrier selling LTD at a lower price than a station next to it is buying
 
You can also:
 - only show markets within given distance from given star system
 - only show prices with minimum demand and supply

The tool will not connect to any other data service, you will only get prices reported after the app was started. This also includes star system - until the app sees the location of the given star system in the data stream, it will produce not be able to calculate distances. You can preload star system data with the `init.cmd` script.

## Installation

You will need:
 - [Node.js v12.x](https://nodejs.org) - the app runtime. Get the LTS version.
 - Database:
   - Windows: [Memurai](https://www.memurai.com/get-memurai) - Redis-compatible datastore, get the free Developer Edition.
   - Linux/MacOS: [Redis](https://redis.io/) - Well, Redis, get one sutible for your system.
 - [Thie app itself](https://github.com/bzoz/ed-ltd-seller/archive/v0.1.0.zip)

To run the app:
 - Install both Memurai and Node.js
 - Extract the ZIP-file with the app to any folder
 - Run `init.cmd` - it will install dependencies for the app and will download the star system data from [EDSM](https://www.edsm.net/). The download is about 2GB, and it will use about 4GB of disk space. Alternatively, run `init-nodb.cmd`. It will not download any star data but will only rely on the data from the EDDN messages. In practice this means it will take the app some time before it will start displaying distances to the selling carriers. 

## Helper scripts

The app takes reference system etc., through command line. Some sample scripts are included to get you running:

### `run_ltd_icebox.cmd`
![run_ltd_icebox.cmd screenshot](https://github.com/bzoz/ed-ltd-seller/blob/main/screenshots/run_ltd_icebox.png?raw=true)  
Show best LTD buying carriers within 30ly from Kirre's Icebox with at least 200 demand

### `run_ltd_hip4351.cmd`
![run_ltd_4351.cmd screenshot](https://github.com/bzoz/ed-ltd-seller/blob/main/screenshots/run_lyd_hip4351.png?raw=true)  
Show best LTD buying carriers within 30ly from HIP 4351 with at least 200 demand

### `run_buy_ltd.cmd`
![run_buy_ltd.cmd screenshot](https://github.com/bzoz/ed-ltd-seller/blob/main/screenshots/run_buy_ltd.png?raw=true)  
Show best LTD selling stations anywhere in the galaxy

### `run_tritium_trader.cmd`
![run_tritium_trader.cmd screenshot](https://github.com/bzoz/ed-ltd-seller/blob/main/screenshots/run_tritium_trader.png?raw=true)  
Show global best buying and selling prices for Tritium. Also find systems, where one station is selling tritium cheaper than other station in that system is buying. Also display distance to Sol.

## Running - command line

### Installation
```console
npm install
```
### Optional system data
```console
node download-systems-data.js
```

### Command line arguments

- `--system "system name"` - Set reference system, used for distance limit and for displayed distance. Put the system name in `"` if it contains space.
- `--coords 0,0,0` - Set reference system coords. Those will be set automatically if you use `--system` and have downloaded optional system data. You can use [EDSM](https://www.edsm.net/) to get the coordinates. For example [Col 285 Sector CC-K a38-2 (Kirre's Icebox)](https://www.edsm.net/en/system/id/3165155/name/Col+285+Sector+CC-K+a38-2) is `--coords -237.125,-38.84375,61.34375`.

- `--distance 30` -Set maximum distance to 30 LY.
- `--demand 200` - Set mimimum demand to 200.
- `--supply 300` - Set miminum supply to 300.
- `--commodity lowtemperaturediamond` - Show only LTD prices. You can use any commodity name, just remove spaces or hyphens.
- `--bestbuy` - Show stations with lowest buy prices.
- `--bestsell` - Show stations with highest buy prices.
- `--besttransfer` - Show systems with highest profit for in-system trading.

For `--bestbuy` and --`bestsell` you need to use `--commodity`. You also must specify at lest one of the `--best...` options, but you can also use all of them.

### Bugs
Open an issue if you find any bugs.

Known bugs:
 - If the station is in the same system as reference system, `-` will be displayed as distance
 - "Distance" should be removed from the table if no reference system is set
 - The way we are querying coords from download star system data set should be improved
