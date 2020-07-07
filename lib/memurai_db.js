const preloaded = require('./preloaded_system')
const Redis = require('ioredis')
const db = new Redis()

db.flushall();

async function setSystem(name, x, y, z) {
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
  return db.hgetall(`markets:${marketId}`)
}

async function setBuyPrice(marketId, commodity, price, supply) {
  return Promise.all([
      db.hset(`commodities:${marketId}-${commodity}`,
              'buy', price,
              'supply', supply),
      db.zadd(`commodities-best-buy:${commodity}`, price, marketId)
  ])
}

async function setSellPrice(marketId, commodity, price, demand) {
  return Promise.all([
    db.hset(`commodities:${marketId}-${commodity}`,
            'sell', price,
            'demand', demand),
    db.zadd(`commodities-best-sell:${commodity}`, price, marketId)
  ])
}

async function getPrice(marketId, commodity) {
  return db.hgetall(`commodities:${marketId}-${commodity}`)
}

async function getBestBuy(commodity, limit) {
  return db.zrange(`commodities-best-buy:${commodity}`, 0, limit)
}

async function getBestSell(commodity, limit) {
  return db.zrevrange(`commodities-best-sell:${commodity}`, 0, limit)
}

async function dropMarket(marketId) {
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
  return Promise.all([
    db.zrem(`commodities-best-buy:${commodity}`, marketId),
    db.hdel(`commodities:${marketId}-${commodity}`, 'buy', 'supply')
  ])
}

async function dropSellPrice(marketId, commodity) {
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