const db = require('./memurai_db');
const filter = require('./data_filter')
const stats = require('./packets_stats')

async function commodity(marketId, commodity, buyPrice, supply, sellPrice, demand) {
  if (!marketId || !commodity)
    return false
  stats.price()
  commodity = commodity.toUpperCase();
  if (!filter.isFilteredCommodity(commodity))
    return false
  
  let setBuy, setSell
  let updated = false
  if (buyPrice >= 0 && supply >= 0) {
    updated = true
    if (filter.hasEnoughSupply(supply) && buyPrice > 0)
      setBuy = db.setBuyPrice(marketId, commodity, buyPrice, supply)
    else
      setBuy = db.dropBuyPrice(marketId, commodity)
  }
  if (sellPrice >= 0 && demand >= 0) {
    updated = true
    if (filter.hasEnoughDemand(demand) && sellPrice > 0)
      setSell = db.setSellPrice(marketId, commodity, sellPrice, demand)
    else
      setSell = db.dropSellPrice(marketId, commodity)
  }
  await Promise.all([setBuy, setSell])
  return updated
}

async function starsystem(name, x, y, z) {
  if (!name || !x || !y || !z)
    return false
  stats.system()
  name = name.toUpperCase();
  await db.setSystem(name, x, y, z)
  return true
}

async function station(marketId, name, system, distance, type) {
  if (!marketId || !name || !system)
    return false;
  stats.station()
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

async function dropIfOutOfRage(marketId, system) {
  stats.station()
  system = system.toUpperCase();
  const coords = await db.getSystem(system)
  if (!filter.inDistanceLimit(coords)) {
    return await db.dropMarket(marketId)
  } else {
    return false
  }
}

module.exports = {
  commodity,
  starsystem,
  station,
  dropIfOutOfRage
}