const markets = require('./markets')
const commodities = new Map()
const bestRoute = {}
let minimumDemand = 0
let minimumSupply = 0

function setMinimumDemand (demand) {
  minimumDemand = demand
}

function setMinimumSupply (supply) {
  minimumSupply = supply
}

function update (system, station, marketId, data) {
  markets.update(marketId, system, station)
  let updated = false
  if (data) {
    for (const commodity of data) {
      commodity.name = commodity.name.toLowerCase()
      if (!commodities.has(commodity.name)) {
        commodities.set(commodity.name, {})
      }
      const db = commodities.get(commodity.name)

      if (commodity.stock >= minimumSupply && (!db.lowestPrice || db.lowestPrice.price > commodity.buyPrice)) {
        db.lowestPrice = {
          system, station, marketId, price: commodity.buyPrice, supply: commodity.stock
        }
      }
      if (commodity.demand >= minimumDemand && (!db.highestPrice || db.highestPrice.price < commodity.sellPrice)) {
        db.highestPrice = {
          system, station, marketId, price: commodity.sellPrice, demand: commodity.demand
        }
      }
      updated |= update_best_route(db, commodity.name)
    }
  }
  return updated
}

function update_best_route (commodity, name) {
  if (commodity.highestPrice &&
      bestRoute.profit &&
      name === bestRoute.name &&
      commodity.highestPrice.marketId === bestRoute.highestPrice.marketId &&
      commodity.highestPrice.price !== bestRoute.highestPrice.price) {
    bestRoute.profit = null
  }
  if (commodity.lowestPrice &&
      bestRoute.profit &&
      name === bestRoute.name &&
      commodity.lowestPrice.marketId === bestRoute.lowestPrice.marketId &&
      commodity.lowestPrice.price !== bestRoute.lowestPrice.price) {
    bestRoute.profit = null
  }
  if (commodity.highestPrice &&
      commodity.lowestPrice &&
      (!bestRoute.profit || commodity.highestPrice.price - commodity.lowestPrice.price > bestRoute.profit)) {
    bestRoute.profit = commodity.highestPrice.price - commodity.lowestPrice.price
    bestRoute.name = name
    bestRoute.lowestPrice = { ...commodity.lowestPrice }
    bestRoute.highestPrice = { ...commodity.highestPrice }
    return true
  }
  return false
}

function getBestRoute () {
  return bestRoute
}

function getAll () {
  return commodities
}

function get (commodity) {
  return commodities.get(commodity)
}
module.exports = {
  setMinimumDemand,
  setMinimumSupply,
  update,
  getBestRoute,
  getAll,
  get
}
