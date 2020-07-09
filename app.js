const handlers = require('./lib/handle_data')
const filter = require('./lib/data_filter')
const printBest = require('./lib/print_best')
const stats = require('./lib/packets_stats')

const zlib = require('zlib');
const zmq = require('zeromq');
const sock = zmq.socket('sub');
sock.connect('tcp://eddn.edcd.io:9500');
sock.subscribe('');

const argv = require('yargs').argv;

if (argv.system) {
  filter.setRefSystem(argv.system)
}
if (argv.coords) {
  const coords = argv.coords.split(',')
  filter.setRefCoords('ref', {x:coords[0], y:coords[1], z:coords[2]})
}
if (argv.distance) {
  filter.setDistanceLimit(argv.distance)
}
if (argv.demand) {
  filter.setMinDemand(argv.demand)
}
if (argv.supply) {
  filter.setMinSupply(argv.supply)
}
if (argv.commodity) {
  filter.setCommodityFilter(argv.commodity)
}
if (argv.bestbuy)
  printType = 'best-buy'
if (argv.bestsell)
  printType = 'best-sell'
if (argv.besttransfer)
  printType = 'best-transfer'

if (!argv.bestbuy && !argv.bestsell && !argv.besttransfer) {
  console.log('What to do? Please use either --bestbuy --bestsell or --besttransfer')
  process.exit(-1)
}
if ((argv.bestbuy || argv.bestsell) && !argv.commodity) {
  console.log('Select commodity to track with --commodity, e.g. --commodity lowtemperaturediamond')
  process.exit(-1)
}


/*filter.setRefCoords('Col 285 Sector CC-K a38-2', { x: -237.125, y: -38.84375, z: 61.34375});
filter.setDistanceLimit(30)
filter.setMinDemand(200);
filter.setCommodityFilter(['LOWTEMPERATUREDIAMOND']);*/

let firstLoop = true
setInterval(()=>{firstLoop = true}, 2500)
sock.on('message', async (topic) => {
  stats.packet()
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
  if (needsUpdate || firstLoop) {
    firstLoop = false
    let count = 0
    if (argv.bestbuy) ++count
    if (argv.bestsell) ++count
    if (argv.besttransfer) ++count
    const lines = Math.floor((process.stdout.rows - 3 - count*5) / count)
    console.clear()
    if (argv.bestbuy) await printBest.printBestBuy(argv.commodity.toUpperCase(), lines)
    if (argv.bestsell) await printBest.printBestSell(argv.commodity.toUpperCase(), lines)
    if (argv.besttransfer) await printBest.printBestTransfer(lines)
    printBest.logStats()
  }
});
