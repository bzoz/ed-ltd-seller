const db = require('./memurai_db')
const filter = require('./data_filter');
const { getMarket } = require('./memurai_db');

async function printBestSell(commodity, limit) {
  commodity = commodity.toUpperCase()
  let result = [];
  const bestSells = await db.getBestSell(commodity, limit);
  for (let marketId of bestSells) {
    const market = await db.getMarket(marketId)
    const distance = filter.getDistanceToRef({x: market.x, y: market.y, z:market.z })
    const distanceStr = distance ? `${distance.toFixed(0)} ly` : 'N/A'
    const arrivalStr = market.distance ? `${parseFloat(market.distance).toFixed(0)} ls` : 'N/A'
    const typeStr = market.type ? market.type : 'N/A'
    const price = await db.getPrice(marketId, commodity)
    result.push({
      name: market.name,
      system: market.system,
      distance: distanceStr,
      arrival: arrivalStr,
      type: typeStr,
      price: price.sell,
      demand: price.demand
    })
  }
  console.table(result)
  for (let i = result.length; i < limit - 1; ++i)
    console.log('')
}

async function printBestBuy(commodity, limit) {
  commodity = commodity.toUpperCase()
  let result = [];
  const bestBuys = await db.getBestBuys(commodity, limit);
  for (let marketId of bestBuys) {
    const market = await db.getMarket(marketId)
    const distance = filter.getDistanceToRef({x: market.x, y: market.y, z:market.z })
    const distanceStr = distance ? `${distance.toFixed(0)} ly` : 'N/A'
    const arrivalStr = market.distance ? `${parseFloat(market.distance).toFixed(0)} ls` : 'N/A'
    const typeStr = market.type ? market.type : 'N/A'
    const price = await db.getPrice(marketId, commodity)
    result.push({
      name: market.name,
      system: market.system,
      distance: distanceStr,
      arrival: arrivalStr,
      type: typeStr,
      price: price.buy,
      supply: price.supply
    })
  }
  console.table(result)
  for (let i = result.length; i < limit - 1; ++i)
    console.log('')
}

async function printBestTransfer(limit) {
  const bestTransfers = await db.getBestTransfers(limit)
  let result = []
  for (let  {system, commodity} of bestTransfers) {
    const [bestBuyMarket, bestSellMarket] = await Promise.all([
      db.getBestBuyInSystem(system, commodity, 1),
      db.getBestSellInSystem(system, commodity, 1)
    ])
    const [bestBuyPrice, buyMarket, bestSellPrice, sellMarket] = await Promise.all([
      db.getPrice(bestBuyMarket,commodity),
      db.getMarket(bestBuyMarket),
      db.getPrice(bestSellMarket, commodity),
      db.getMarket(bestSellMarket)
    ])
    const distance = filter.getDistanceToRef({x: bestBuyMarket.x, y: bestBuyMarket.y, z: bestBuyMarket.z })
    const distanceStr = distance ? `${distance.toFixed(0)} ly` : 'N/A'
    result.push({
      system: system,
      distance: distanceStr,
      commodity: commodity,
      profit: bestSellPrice.sell - bestBuyPrice.buy,
      buyAt: buyMarket.name,
      buyPrice: bestBuyPrice.buy,
      supply: bestBuyPrice.supply,
      sellAt: sellMarket.name,
      sellPrice: bestSellPrice.sell,
      demand: bestSellPrice.demand
    })
  }
  console.table(result)
  //for (let i = result.length; i < limit - 1; ++i)
//    console.log('')
}

module.exports = {
  printBestSell,
  printBestBuy,
  printBestTransfer
}