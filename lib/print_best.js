const db = require('./memurai_db')
const filter = require('./data_filter')

async function printBestSell(commodity, limit) {
  commodity = commodity.toUpperCase()
  let result = '===\n';
  const bestSells = await db.getBestSell(commodity, limit);
  for (let marketId of bestSells) {
    const market = await db.getMarket(marketId)
    const distance = filter.getDistanceToRef({x: market.x, y: market.y, z:market.z })
    const distanceStr = distance ? ` (${distance.toFixed(2)} ly)` : ''
    const price = await db.getPrice(marketId, commodity)
    result += `${market.name} in ${market.system}${distanceStr} is buying ${commodity} at ${price.sell} CR/T, demand ${price.demand}\n`
  }
  console.log(result)
}


module.exports = {
  printBestSell
}