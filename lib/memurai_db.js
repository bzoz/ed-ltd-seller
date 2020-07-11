const preloaded = require('./preloaded_system')
const Redis = require('ioredis')
const child_process = require('child_process')
const getPort = require('get-port')


let storedDb;
async function getDB() {
  if (storedDb)
    return storedDb;
  const port = getPort();
  // Checks if a Redis default instance is running
  storedDb = new Redis()
  storedDb.on('error', err => {
    // If not invokes an instance of Redis
    child_process.spawn(process.platform === 'win32' ? 'memurai' : 'redis', ['--port', port, '--save', '""', "--appendonly", "no"], {stdio:'ignore'})
    storedDb = new Redis({port})
  })
  return storedDb;
}

async function setSystem(name, x, y, z) {
  const db = await getDB();
  let id = await db.hget('systems', name)
  if (!id) {
    id = await db.incr('systems-index')
  }
  return Promise.all([
    db.hset(`system:${id}`, 'x', x, 'y', y, 'z', z),
    db.hset('systems', name, id)
  ]);
}

async function getSystem(name) {
  const db = await getDB();
  const preloadedPromise = preloaded.getSystem(name)
  let id = await db.hget('systems', name)
  if (id) {
    return db.hgetall(`system:${id}`)
  } else {
    const coords = await preloadedPromise
    if (coords) {
      id = await db.incr('systems-index')
      await Promise.all([
        db.hset(`system:${id}`, 'x', coords.x, 'y', coords.y, 'z', coords.z),
        db.hset('systems', name, id)
      ]);
      return coords
    }
  }
  return null;
}

async function setMarket(marketId, name, system, coords, distance, type) {
  const db = await getDB();
  await Promise.all([
    db.hset(`markets:${marketId}`,
            'name', name,
            'system', system,
            'x', coords ? coords.x : null,
            'y', coords ? coords.y : null,
            'z', coords ? coords.z : null),
    distance ? db.hset(`markets:${marketId}`, 'distance', distance) : true,
    type ? db.hset(`markets:${marketId}`, 'type', type) : true
  ]);
}

async function getMarket(marketId) {
  const db = await getDB();
  return db.hgetall(`markets:${marketId}`)
}

async function reacalculateBestTranser(db, system, commodity) {
  const [bestBuyMarket, bestSellMarket] = await Promise.all([
    getBestBuyInSystem(system, commodity, 1),
    getBestSellInSystem(system, commodity, 1)
  ])
  let bestPrice
  if (bestBuyMarket && bestSellMarket) {
    const [bestBuyPrice, bestSellPrice] = await Promise.all([
      getPrice(bestBuyMarket,commodity),
      getPrice(bestSellMarket, commodity)
    ])
    if (bestBuyPrice && bestSellPrice)
      bestPrice = bestSellPrice.sell - bestBuyPrice.buy
  }
  if (bestPrice)
    return db.zadd('commodites-best-transfer', bestPrice, `${system}:${commodity}`)
  else
    return db.zrem('commodites-best-transfer', `${system}:${commodity}`)
}

async function getBestTransfers(limit) {
  const db = await getDB();
  const bestTransfers = await db.zrevrange('commodites-best-transfer', 0, limit - 1)
  return bestTransfers.map((idx) => {
    const [system, commodity] = idx.split(':')
    return { system, commodity }
  })
}

async function setBuyPrice(marketId, commodity, price, supply) {
  const db = await getDB();
  const system = await db.hget(`markets:${marketId}`, 'system')
  await Promise.all([
      db.hset(`commodities:${marketId}-${commodity}`,
              'buy', price,
              'supply', supply),
      db.zadd(`commodities-best-buy:${commodity}`, price, marketId),
      db.zadd(`commodities-best-buy:${commodity}:${system}`, price, marketId)
  ])
  return reacalculateBestTranser(db, system, commodity)
}

async function getBestBuy(commodity, limit) {
  const db = await getDB();
  return db.zrange(`commodities-best-buy:${commodity}`, 0, limit - 1)
}

async function getBestBuyInSystem(system, commodity, limit) {
  const db = await getDB();
  return db.zrange(`commodities-best-buy:${commodity}:${system}`, 0, limit - 1)
}

async function dropBuyPrice(marketId, commodity) {
  const db = await getDB();
  const system = await db.hget(`markets:${marketId}`, 'system')
  await Promise.all([
    db.zrem(`commodities-best-buy:${commodity}`, marketId),
    db.zrem(`commodities-best-buy:${commodity}:${system}`, marketId),
    db.hdel(`commodities:${marketId}-${commodity}`, 'buy', 'supply')
  ])
  return reacalculateBestTranser(db, system, commodity)
}

async function setSellPrice(marketId, commodity, price, demand) {
  const db = await getDB();
  const system = await db.hget(`markets:${marketId}`, 'system')
  await Promise.all([
    db.hset(`commodities:${marketId}-${commodity}`,
            'sell', price,
            'demand', demand),
    db.zadd(`commodities-best-sell:${commodity}`, price, marketId),
    db.zadd(`commodities-best-sell:${commodity}:${system}`, price, marketId)
  ])
  return reacalculateBestTranser(db, system, commodity)
}

async function getBestSell(commodity, limit) {
  const db = await getDB();
  return db.zrevrange(`commodities-best-sell:${commodity}`, 0, limit - 1)
}

async function getBestSellInSystem(system, commodity, limit) {
  const db = await getDB();
  return db.zrevrange(`commodities-best-sell:${commodity}:${system}`, 0, limit - 1)
}

async function dropSellPrice(marketId, commodity) {
  const db = await getDB();
  const system = await db.hget(`markets:${marketId}`, 'system')
  return Promise.all([
    db.zrem(`commodities-best-sell:${commodity}`, marketId),
    db.zrem(`commodities-best-sell:${commodity}:${system}`, marketId),
    db.hdel(`commodities:${marketId}-${commodity}`, 'sell', 'demand')
  ])
}

async function getPrice(marketId, commodity) {
  const db = await getDB();
  return db.hgetall(`commodities:${marketId}-${commodity}`)
}

async function dropMarket(marketId) {
  const db = await getDB();
  const system = await db.hget(`markets:${marketId}`, 'system')
  let update = await db.del(`markets:${marketId}`)
  const keysToDelete = await db.keys(`commodities:${marketId}*`)
  let keysToDeletePromises = new Array()
  let tradedCommodities = new Array()
  for (let key of keysToDelete) {
    keysToDeletePromises.push(db.del(key))
    const commodity = key.split('-')[1];
    keysToDeletePromises.push(db.zrem(`commodities-best-sell:${commodity}`, marketId))
    keysToDeletePromises.push(db.zrem(`commodities-best-sell:${commodity}:${system}`, marketId))
    keysToDeletePromises.push(db.zrem(`commodities-best-buy:${commodity}`, marketId))
    keysToDeletePromises.push(db.zrem(`commodities-best-buy:${commodity}:${system}`, marketId))
    tradedCommodities.push(commodity)
  }
  await Promise.all(keysToDeletePromises)
  let recalculatePromises = new Array()
  for (let commodity of tradedCommodities)
    recalculatePromises.push(reacalculateBestTranser(db, system, commodity))
  await Promise.all(recalculatePromises)
  return update
}

module.exports = {
  setSystem, getSystem,
  setMarket, getMarket,
  setBuyPrice, setSellPrice,
  getPrice,
  getBestBuy, getBestSell,
  getBestTransfers,
  getBestBuyInSystem, getBestSellInSystem,
  dropMarket, dropBuyPrice, dropSellPrice
}