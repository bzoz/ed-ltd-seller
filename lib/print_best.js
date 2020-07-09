const db = require('./memurai_db')
const filter = require('./data_filter');
const { getMarket } = require('./memurai_db');

function getStationDetails(name, arrival, type) {
  let result = name;
  let open = false 
  if (arrival) {
    open = true
    result +=` (${Math.round(arrival).toLocaleString()}ls`
  }
  if (type) {
    result += open ? ', ' : ' ('
    result += type
    open = true
  }
  if (open)
    result +=')'
  return result
}

async function printBestSell(commodity, limit) {
  commodity = commodity.toUpperCase()
  let result = [];
  const bestSells = await db.getBestSell(commodity, limit);
  for (let marketId of bestSells) {
    const market = await db.getMarket(marketId)
    const distance = filter.getDistanceToRef({x: market.x, y: market.y, z:market.z })
    const distanceStr = distance ? `${Math.round(distance).toLocaleString()} ly` : '-'
    const price = await db.getPrice(marketId, commodity)
    result.push({
      name: getStationDetails(market.name, market.distance, market.type),
      system: market.system,
      distance: distanceStr,
      price: parseInt(price.sell).toLocaleString(),
      demand: parseInt(price.demand).toLocaleString()
    })
  }
  console.log(`Best ${limit} sell prices for ${commodity}`)
  console.table(result)
  for (let i = result.length; i < limit - 1; ++i)
    console.log('')
}

async function printBestBuy(commodity, limit) {
  commodity = commodity.toUpperCase()
  let result = [];
  const bestBuys = await db.getBestBuy(commodity, limit);
  for (let marketId of bestBuys) {
    const market = await db.getMarket(marketId)
    const distance = filter.getDistanceToRef({x: market.x, y: market.y, z:market.z })
    const distanceStr = distance ? `${Math.round(distance).toLocaleString()} ly` : '-'
    const price = await db.getPrice(marketId, commodity)
    result.push({
      name: getStationDetails(market.name, market.distance, market.type),
      system: market.system,
      distance: distanceStr,
      price: parseInt(price.buy).toLocaleString(),
      supply: parseInt(price.supply).toLocaleString()
    })
  }
  console.log(`Best ${limit} buy prices for ${commodity}`)
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
    const distance = filter.getDistanceToRef({x: buyMarket.x, y: buyMarket.y, z: buyMarket.z })
    const distanceStr = distance ? `${Math.round(distance).toLocaleString()} ly` : '-'
    result.push({
      system: system,
      distance: distanceStr,
      commodity: commodity,
      profit: (bestSellPrice.sell - bestBuyPrice.buy).toLocaleString(),
      buyAt: getStationDetails(buyMarket.name, buyMarket.distance, buyMarket.type),
      buyPrice: parseInt(bestBuyPrice.buy).toLocaleString(),
      supply: parseInt(bestBuyPrice.supply).toLocaleString(),
      sellAt: getStationDetails(sellMarket.name, sellMarket.distance, sellMarket.type),
      sellPrice: parseInt(bestSellPrice.sell).toLocaleString(),
      demand: parseInt(bestSellPrice.demand).toLocaleString()
    })
  }
  console.log(`Best ${limit} in-system trade prices`)
  console.table(result)
  for (let i = result.length; i < limit - 1; ++i)
    console.log('')
}

module.exports = {
  printBestSell,
  printBestBuy,
  printBestTransfer
}