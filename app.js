const handlers = require('./lib/handle_data')


const zlib = require('zlib');
const zmq = require('zeromq');
const sock = zmq.socket('sub');
sock.connect('tcp://eddn.edcd.io:9500');
sock.subscribe('');

/*systems.update('Col 285 Sector CC-K a38-2', [ -237.125, -38.84375, 61.34375]);
systems.update('ref', [ -237.125, -38.84375, 61.34375]);
localMarket.setReference('Col 285 Sector CC-K a38-2');
localMarket.setDistanceLimit(30);
localMarket.setMinimumDemand(512);
localMarket.track('lowtemperaturediamond');

commodities.setMinimumSupply(2000);
commodities.setMinimumDemand(2000);
*/

sock.on('message', topic => {
  const payload = JSON.parse(zlib.inflateSync(topic));
  const schema = payload['$schemaRef'];
  const header = payload.header;
  const message = payload.message;
  
  if (schema.startsWith('https://eddn.edcd.io/schemas/commodity/3')) {
    handlers.station(message.marketId, message.stationName, message.systemName)
            .then(() => {
              for (let commodity of message.commodities) {
                handlers.commodity(message.marketId,
                                  commodity.name,
                                  commodity.buyPrice,
                                  commodity.stock,
                                  commodity.sellPrice,
                                  commodity.demand);
              }
            });
  }
  else if (schema.startsWith('https://eddn.edcd.io/schemas/journal/1')) {
    handlers.starsystem(message.StarSystem, message.StarPos[0], message.StarPos[1], message.StarPos[2])
            .then(() => {
              if (message.event === 'Location' && message.BodyType === 'Station') {
                handlers.station(message.MarketID, message.Body, message.StarSystem, null, message.StationType)
              }
              if (message.event === 'Docked') {
                handlers.station(message.MarketID, message.StationName, message.StarSystem, message.DistFromStarLS, message.StationType)
              }
              if (message.event === 'CarrierJump') {
                handlers.station(message.marketId, message.StationName, message.StarSystem);
              }
            });
  } 
});
