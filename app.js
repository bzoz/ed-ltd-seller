const handlers = require('./lib/handle_data')
const filter = require('./lib/data_filter')
const printBest = require('./lib/print_best')

const zlib = require('zlib');
const zmq = require('zeromq');
const sock = zmq.socket('sub');
sock.connect('tcp://eddn.edcd.io:9500');
sock.subscribe('');

filter.setRefCoords('Col 285 Sector CC-K a38-2', { x: -237.125, y: -38.84375, z: 61.34375});
filter.setDistanceLimit(30)
filter.setMinDemand(200);
filter.setCommodityFilter(['LOWTEMPERATUREDIAMOND']);


sock.on('message', async (topic) => {
  const payload = JSON.parse(zlib.inflateSync(topic));
  const schema = payload['$schemaRef'];
  const header = payload.header;
  const message = payload.message;
  
  let needsUpdate = false;
  if (schema.startsWith('https://eddn.edcd.io/schemas/commodity/3')) {
    const intereting = await handlers.station(message.marketId, message.stationName, message.systemName)
    if (intereting) {
      let priceUpdatedPromise = new Array();
      for (let commodity of message.commodities) {
        priceUpdatedPromise.push(handlers.commodity(message.marketId,
                                 commodity.name,
                                 commodity.buyPrice,
                                 commodity.stock,
                                 commodity.sellPrice,
                                 commodity.demand))
      }
      const updated = await Promise.all(priceUpdatedPromise)
      needsUpdate |= updated.includes(true)
    } else {
      needsUpdate |= await handlers.dropIfOutOfRage(message.marketId, message.systemName)
    }
  } else if (schema.startsWith('https://eddn.edcd.io/schemas/journal/1')) {
    await handlers.starsystem(message.StarSystem, message.StarPos[0], message.StarPos[1], message.StarPos[2])
    if (message.event === 'Location' && message.BodyType === 'Station') {
       await handlers.station(message.MarketID, message.Body, message.StarSystem, null, message.StationType)
    }
    if (message.event === 'Docked') {
      await handlers.station(message.MarketID, message.StationName, message.StarSystem, message.DistFromStarLS, message.StationType)
    }
    if (message.event === 'CarrierJump') {
      needsUpdate |= await handlers.dropIfOutOfRage(message.marketId, message.StationName, message.StarSystem);
    }
  } 
  if (needsUpdate) {
    printBest.printBestSell('LOWTEMPERATUREDIAMOND', process.stdout.rows - 5);
  }
});
