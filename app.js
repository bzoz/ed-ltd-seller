const commodities = require('./lib/commodities');
const systems = require('./lib/systems')
const markets = require('./lib/markets')
const localMarket = require('./lib/local_market');

const zlib = require('zlib');
const zmq = require('zeromq');
const sock = zmq.socket('sub');
sock.connect('tcp://eddn.edcd.io:9500');
sock.subscribe('');

systems.update('Col 285 Sector CC-K a38-2', [ -237.125, -38.84375, 61.34375]);
systems.update('ref', [ -237.125, -38.84375, 61.34375]);
localMarket.setReference('Col 285 Sector CC-K a38-2');
localMarket.setDistanceLimit(30);
localMarket.setMinimumDemand(512);
localMarket.track('lowtemperaturediamond');

commodities.setMinimumSupply(2000);
commodities.setMinimumDemand(2000);

const knownTypes = ['Scan', 'FSDJump', 'SAASignalsFound', 'Location', 'Docked', 'CarrierJump']

let unknowRoute1, unknownRoute2, unknownBest1, unknownBest2;

sock.on('message', topic => {
  const payload = JSON.parse(zlib.inflateSync(topic));
  const schema = payload['$schemaRef'];
  const header = payload.header;
  const message = payload.message;
  
  let updated = false;
  if (schema.startsWith('https://eddn.edcd.io/schemas/commodity/3')) {
    updated |= commodities.update(message.systemName, message.stationName, message.marketId, message.commodities);
    updated |= localMarket.updateCommodities(message.marketId, message.systemName, message.commodities);
  }
  else if (schema.startsWith('https://eddn.edcd.io/schemas/journal/1')) {
    systems.update(message.StarSystem, message.StarPos);
    if (message.StarSystem == unknowRoute1 ||
        message.StarSystem == unknownRoute2 ||
        message.StarSystem == unknownBest1 ||
        message.StarSystem == unknownBest2) {
      updated = true;
    }
    if (message.event === 'Location' && message.BodyType === 'Station') {
      markets.update(message.MarketID, message.StarSystem, message.Body);
      markets.setType(message.MarketID, message.StationType);
    }
    if (message.event === 'Docked') {
      markets.update(message.MarketID, message.StarSystem, message.StationName);
      markets.setType(message.MarketID, message.StationType);
    }
    if (message.event === 'CarrierJump') {
      markets.update(message.MarketID, message.StarSystem, message.StationName);
      markets.setType(message.MarketID, message.StationType);
      updated |= localMarket.jumpCarrier(message.marketId);
    }
    if (!knownTypes.includes(message.event)) {
      console.error(JSON.stringify(payload, null, 2));
    }
  } else if (schema.startsWith('https://eddn.edcd.io/schemas/outfitting') ||
             schema.startsWith('https://eddn.edcd.io/schemas/shipyard') ||
             schema.startsWith('https://eddn.edcd.io/schemas/blackmarket')) {
    return;
  } else {
    // dump unsupported messages to stream
    console.error(JSON.stringify(payload, null, 2));
  }
  if (updated) {
    print_update();
  }
});



function print_update() {
  const bestRoute = commodities.getBestRoute();
  if (bestRoute.highestPrice) {
    const distance = systems.distance(bestRoute.highestPrice.system, bestRoute.lowestPrice.system);
    if (isNaN(distance)) {
      unknownRoute1 = bestRoute.highestPrice.system;
      unknownRoute2 = bestRoute.lowestPrice.system;
    } else {
      unknownRoute1 = null;
      unknownRoute2 = null;
    }
    console.log(`Best route for ${bestRoute.profit} CR/ton: ${bestRoute.name}, ${distance} LY`);
    console.log(`  from ${bestRoute.lowestPrice.station} in ${bestRoute.lowestPrice.system} - ${bestRoute.lowestPrice.price} CR/ton, supply: ${bestRoute.lowestPrice.supply}`)
    console.log(`  to ${bestRoute.highestPrice.station} in ${bestRoute.highestPrice.system} - ${bestRoute.highestPrice.price} CR/ton, demand: ${bestRoute.highestPrice.demand}`)
  }
  const bestLocal = localMarket.getBest();
  if (bestLocal.bestMarketId) {
    const market = markets.get(bestLocal.bestMarketId);
    const distance = systems.distance('ref', market.system);
    if (isNaN(distance)) {
      unknownBest1 = market.system;
    } else {
      unknownBest1 = null;
    }
    console.log(`Best local LTD: ${market.station} in ${market.system} (${distance} LY), ${bestLocal.bestMarketPrice} CR, demand: ${bestLocal.bestMarketDemand}`)
  }
  const bestGlobal = commodities.get('lowtemperaturediamond');
  if (bestGlobal.highestPrice) {
    const distance = systems.distance('ref', bestGlobal.highestPrice.system);
    if (isNaN(distance)) {
      unknownBest2 = bestGlobal.highestPrice.system;
    } else {
      unknownBest2 = null;
    }
    console.log(`Best global LTD: ${bestGlobal.highestPrice.station} in ${bestGlobal.highestPrice.system} (${distance} LY), ${bestGlobal.highestPrice.price} CR, demand: ${bestGlobal.highestPrice.demand}`)
  }
  console.log('');
}