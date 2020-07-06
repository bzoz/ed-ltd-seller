const db = require('./memurai_db');
const { setBuyPrice } = require('./memurai_db');

async function commodity(marketId, commodity, buyPrice, supply, sellPrice, demand) {
  if (!marketId || !commodity)
    return;
  if ((!buyPrice || !demand) && (!sellPrice || !supply))
    return;
  commodity = commodity.toUpperCase();
  let setBuy, setSell
  if (buyPrice && demand)
    setBuy = db.setBuyPrice(marketId, commodity, buyPrice, demand)
  if (sellPrice && supply && supply > 0)
    setSell = db.setSellPrice(marketId, commodity, sellPrice, supply)
  return Promise.all([setBuy, setSell])
}

async function starsystem(name, x, y, z) {
  if (!name || !x || !y || !z)
    return;
  name = name.toUpperCase();
  return db.setSystem(name, x, y, z)
}

async function station(marketId, name, system, distance, type) {
  if (!marketId || !name || !system)
    return;
  name = name.toUpperCase();
  system = system.toUpperCase();
  return db.setMarket(marketId, name, system, distance, type)
}

module.exports = {
  commodity,
  starsystem,
  station
}