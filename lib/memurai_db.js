const preloaded = require('./preloaded_system')
const Redis = require('ioredis')
const child_process = require('child_process')
const getPort = require('get-port')


let storedDb;
async function getDB() {
  if (storedDb)
    return storedDb;
  const port = await getPort();
  child_process.spawn('memurai', ['--port', port, '--save', '""', "--appendonly", "no"], {stdio:'ignore'})
  storedDb = new Redis({port})
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

async function setBuyPrice(marketId, commodity, price, supply) {
  const db = await getDB();
  return Promise.all([
      db.hset(`commodities:${marketId}-${commodity}`,
              'buy', price,
              'supply', supply),
      db.zadd(`commodities-best-buy:${commodity}`, price, marketId)
  ])
}

async function setSellPrice(marketId, commodity, price, demand) {
  const db = await getDB();
  return Promise.all([
    db.hset(`commodities:${marketId}-${commodity}`,
            'sell', price,
            'demand', demand),
    db.zadd(`commodities-best-sell:${commodity}`, price, marketId)
  ])
}

async function getPrice(marketId, commodity) {
  const db = await getDB();
  return db.hgetall(`commodities:${marketId}-${commodity}`)
}

async function getBestBuy(commodity, limit) {
  const db = await getDB();
  return db.zrange(`commodities-best-buy:${commodity}`, 0, limit)
}

async function getBestSell(commodity, limit) {
  const db = await getDB();
  return db.zrevrange(`commodities-best-sell:${commodity}`, 0, limit)
}

async function dropMarket(marketId) {
  const db = await getDB();
  let update = await db.del(`markets:${marketId}`)
  const keysToDelete = await db.keys(`commodities:${marketId}*`)
  let keysToDeletePromises = new Array()
  for (let key of keysToDelete) {
    keysToDeletePromises.push(db.del(key))
    const commodity = key.split('-')[1];
    keysToDeletePromises.push(db.zrem(`commodities-best-sell:${commodity}`, marketId))
    keysToDeletePromises.push(db.zrem(`commodities-best-buy:${commodity}`, marketId))
  }
  
  await Promise.all(keysToDeletePromises)
  return update
}

async function dropBuyPrice(marketId, commodity) {
  const db = await getDB();
  return Promise.all([
    db.zrem(`commodities-best-buy:${commodity}`, marketId),
    db.hdel(`commodities:${marketId}-${commodity}`, 'buy', 'supply')
  ])
}

async function dropSellPrice(marketId, commodity) {
  const db = await getDB();
  return Promise.all([
    db.zrem(`commodities-best-sell:${commodity}`, marketId),
    db.hdel(`commodities:${marketId}-${commodity}`, 'sell', 'demand')
  ])
}

module.exports = {
  setSystem, getSystem,
  setMarket, getMarket,
  setBuyPrice, setSellPrice,
  getPrice,
  getBestBuy, getBestSell,
  dropMarket, dropBuyPrice, dropSellPrice
}