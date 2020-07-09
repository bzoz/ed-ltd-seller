const db = require('./memurai_db')
const filter = require('./data_filter');
const tableModule = require('table');
const chalk = require('chalk')

function table(data) {
  const options = {
    border: tableModule.getBorderCharacters(`norc`),
    drawHorizontalLine: (index, size) => { 
      return index == 0 || index == 1 || index == size
    }
  }
  return tableModule.table(data, options)
}
function h(data) {
  return chalk.white.bold(data)
}
function text(data) {
  return chalk.yellowBright(data)
}
function num(data) {
  return chalk.greenBright(data)
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
    [h('System'), h('Distance'), h('Market'), h('Price'), h('Demand')]
  ];
  const bestSells = await db.getBestSell(commodity, limit);
  for (let marketId of bestSells) {
    const market = await db.getMarket(marketId)
    const distance = filter.getDistanceToRef({x: market.x, y: market.y, z:market.z })
    const distanceStr = distance ? `${Math.round(distance).toLocaleString()} ly` : '-'
    const price = await db.getPrice(marketId, commodity)
    result.push([
      text(market.system),
      text(distanceStr),
      text(getStationDetails(market.name, market.distance, market.type)),
      num(parseInt(price.sell).toLocaleString()),
      num(parseInt(price.demand).toLocaleString())
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
    [h('System'), h('Distance'), h('Market'), h('Price'), h('Supply')]
  ];
  const bestBuys = await db.getBestBuy(commodity, limit);
  for (let marketId of bestBuys) {
    const market = await db.getMarket(marketId)
    const distance = filter.getDistanceToRef({x: market.x, y: market.y, z:market.z })
    const distanceStr = distance ? `${Math.round(distance).toLocaleString()} ly` : '-'
    const price = await db.getPrice(marketId, commodity)
    result.push([
      text(market.system),
      text(distanceStr),
      text(getStationDetails(market.name, market.distance, market.type)),
      num(parseInt(price.buy).toLocaleString()),
      num(parseInt(price.supply).toLocaleString())
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
    ['System', 'Distance', 'Commodity', 'Profit', 'Buy At', 'Price', 'Supply', 'Sell At', 'Price', 'Demand'].map(h)
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
      text(system),
      text(distanceStr),
      text(commodity),
      num((bestSellPrice.sell - bestBuyPrice.buy).toLocaleString()),
      text(getStationDetails(buyMarket.name, buyMarket.distance, buyMarket.type)),
      num(parseInt(bestBuyPrice.buy).toLocaleString()),
      num(parseInt(bestBuyPrice.supply).toLocaleString()),
      text(getStationDetails(sellMarket.name, sellMarket.distance, sellMarket.type)),
      num(parseInt(bestSellPrice.sell).toLocaleString()),
      num(parseInt(bestSellPrice.demand).toLocaleString())
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