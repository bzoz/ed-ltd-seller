const db = require('./memurai_db')
const filter = require('./data_filter');
const tableModule = require('table');
const { options } = require('zeromq/lib');

function table(data) {
  const options = {
    border: tableModule.getBorderCharacters(`norc`),
    drawHorizontalLine: (index, size) => { 
      return index == 0 || index == 1 || index == size
    }
  }
  return tableModule.table(data, options)
}

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
  let result = [
    ['System', 'Distance', 'Market', 'Price', 'Demand']
  ];
  const bestSells = await db.getBestSell(commodity, limit);
  for (let marketId of bestSells) {
    const market = await db.getMarket(marketId)
    const distance = filter.getDistanceToRef({x: market.x, y: market.y, z:market.z })
    const distanceStr = distance ? `${Math.round(distance).toLocaleString()} ly` : '-'
    const price = await db.getPrice(marketId, commodity)
    result.push([
      market.system,
      distanceStr,
      getStationDetails(market.name, market.distance, market.type),
      parseInt(price.sell).toLocaleString(),
      parseInt(price.demand).toLocaleString()
    ])
  }
  console.log(`Best ${limit} sell prices for ${commodity}`)
  console.log(table(result))
  for (let i = result.length; i < limit - 1; ++i)
    console.log('')
}

async function printBestBuy(commodity, limit) {
  commodity = commodity.toUpperCase()
  let result = [
    ['System', 'Distance', 'Market', 'Price', 'Supply']
  ];
  const bestBuys = await db.getBestBuy(commodity, limit);
  for (let marketId of bestBuys) {
    const market = await db.getMarket(marketId)
    const distance = filter.getDistanceToRef({x: market.x, y: market.y, z:market.z })
    const distanceStr = distance ? `${Math.round(distance).toLocaleString()} ly` : '-'
    const price = await db.getPrice(marketId, commodity)
    result.push([
      market.system,
      distanceStr,
      getStationDetails(market.name, market.distance, market.type),
      parseInt(price.buy).toLocaleString(),
      parseInt(price.supply).toLocaleString()
    ])
  }
  console.log(`Best ${limit} buy prices for ${commodity}`)
  console.log(table(result))
  for (let i = result.length; i < limit - 1; ++i)
    console.log('')
}

async function printBestTransfer(limit) {
  const bestTransfers = await db.getBestTransfers(limit)
  let result = [
    ['Sysntem', 'Distance', 'Commodity', 'Profit', 'Buy At', 'Price', 'Supply', 'Sell At', 'Price', 'Demand']
  ]
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
    result.push([
      system,
      distanceStr,
      commodity,
      (bestSellPrice.sell - bestBuyPrice.buy).toLocaleString(),
      getStationDetails(buyMarket.name, buyMarket.distance, buyMarket.type),
      parseInt(bestBuyPrice.buy).toLocaleString(),
      parseInt(bestBuyPrice.supply).toLocaleString(),
      getStationDetails(sellMarket.name, sellMarket.distance, sellMarket.type),
      parseInt(bestSellPrice.sell).toLocaleString(),
      parseInt(bestSellPrice.demand).toLocaleString()
    ])
  }
  console.log(`Best ${limit} in-system trade prices`)
  console.log(table(result))
  for (let i = result.length; i < limit - 1; ++i)
    console.log('')
}

module.exports = {
  printBestSell,
  printBestBuy,
  printBestTransfer
}