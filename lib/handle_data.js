const db = require('./memurai_db');
const filter = require('./data_filter')

async function commodity(marketId, commodity, buyPrice, supply, sellPrice, demand) {
  if (!marketId || !commodity)
    return false
  commodity = commodity.toUpperCase();
  if (!filter.isFilteredCommodity(commodity))
    return false
  
  let setBuy, setSell
  let updated = false
  if (buyPrice > 0 && supply > 0 && filter.hasEnoughSupply(supply)) {
    updated = true
    setBuy = db.setBuyPrice(marketId, commodity, buyPrice, supply)
    const market = await db.getMarket(marketId)
    const distance = filter.getDistanceToRef({x: market.x, y: market.y, z:market.z })
    const distanceStr = distance ? ` (${distance.toFixed(2)} ly)` : ''
    }
  if (sellPrice > 0 && demand > 0 && filter.hasEnoughDemand(demand)) {
    updated = true
    setSell = db.setSellPrice(marketId, commodity, sellPrice, demand)
    const market = await db.getMarket(marketId)
    const distance = filter.getDistanceToRef({x: market.x, y: market.y, z:market.z })
    const distanceStr = distance ? ` (${distance.toFixed(2)} ly)` : ''
  }
  await Promise.all([setBuy, setSell])
  return updated
}

async function starsystem(name, x, y, z) {
  if (!name || !x || !y || !z)
    return false
  name = name.toUpperCase();
  await db.setSystem(name, x, y, z)
  return true
}

async function station(marketId, name, system, distance, type) {
  if (!marketId || !name || !system)
    return false;
  name = name.toUpperCase();
  system = system.toUpperCase();
  const coords = await db.getSystem(system)
  if (filter.inDistanceLimit(coords)) {
    await db.setMarket(marketId, name, system, coords, distance, type)
    return true
  } else {
    return false
  }
}

async function carrierJump(marketId, system) {
  // todo - remove the carrier from the list
  return true
}

module.exports = {
  commodity,
  starsystem,
  station,
  carrierJump
}