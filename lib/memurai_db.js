const preloaded = require('./preloaded_system')
const Redis = require('ioredis')
const db = new Redis()

async function setSystem(name, x, y, z) {
  let id = await db.hget('systems', name)
  if (!id) {
    id = await db.incr('systems-index')
  }
  return db.hset(`system:${id}`, 'x', x, 'y', y, 'z', 'z')
}

async function getSystem(name) {
  const id = await db.hget('systems', name)
  if (id) {
    return db.hgetall(`system:${id}`)
  } else {
    return null;
  }
}

async function setMarket(marketId, name, system, distance, type) {
  const coords_memurai = await getSystem(system)
  const coords_preloaded = await preloaded.getSystem(system)
  let coords = {};
  if (!coords_memurai && coords_preloaded) {
    setSystem(system, coords_preloaded.x, coords_preloaded.y, coords_preloaded.z)
    coords = coords_preloaded
  } else if (coords_memurai) {
    coords = coords_memurai
  }
  return db.hset(`markets:${marketId}`,
                 'name', name,
                 'system', system,
                 'x', coords.x,
                 'y', coords.y,
                 'z', coords.z,
                 'distance', distance,
                 'type', type);
}

async function getMarket(marketId) {
  return db.hgetall(`markets:${marketId}`)
}

async function setBuyPrice(marketId, commodity, price, demand) {
  return db.hset(`commodities:${marketId}-${commodity}`,
                 'buy', price,
                 'demand', demand);
}

async function setSellPrice(marketId, commodity, price, supply) {
  return db.hset(`commodities:${marketId}-${commodity}`,
                 'sell', price,
                 'supply', supply);
}

async function getPrice(marketId, commodity) {
  return db.hgetall(`commodities:${marketId}-${commodity}`)
}

module.exports = {
  setSystem, getSystem,
  setMarket, getMarket,
  setBuyPrice, setSellPrice,
  getPrice
}