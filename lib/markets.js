const systems = require('./systems')
const markets = new Map()

function update (marketId, system, station) {
  markets.set(marketId, { station, system })
}

function setType (marketId, type) {
  markets.get(marketId).type = type
}

function get (marketId) {
  return markets.get(marketId)
}

function getDistance (marketIdA, marketIdB) {
  const marketA = get(marketIdA)
  const marketB = get(marketIdB)
  if (!marketA || !marketB) { return NaN }
  return systems.distance(marketA.system, marketB.system)
}

function getAll () { return markets };

module.exports = {
  update,
  get,
  setType,
  getDistance,
  getAll
}
