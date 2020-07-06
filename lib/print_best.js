const db = require('./memurai_db')
const filter = require('./data_filter')

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


module.exports = {
  printBestSell
}