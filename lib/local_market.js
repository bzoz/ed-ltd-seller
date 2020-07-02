const systems = require('./systems');

let reference;
let tracked;
let limit = 100000;
let minimumDemand = 0;
let trackedBuyers = new Map();

let bestMarketId;
let bestMarketPrice = 0;
let bestMarketDemand = 0;

function setReference(system) {
  reference = system;
}

function setDistanceLimit(trackLimit) {
  limit = trackLimit;
}

function setMinimumDemand(demand) {
  minimumDemand = demand;
}

function track(commodity) {
  tracked = commodity;
}

function findNewBest() {
  bestMarketId = null;
  bestMarketPrice = 0;
  bestMarketDemand = 0;
  for (let [marketId, data] of trackedBuyers) {
    if (data.price > bestMarketPrice) {
      bestMarketPrice = data.price;
      bestMarketDemand = data.demand;
      bestMarketId = marketId;
    }
  }
}

function updateCommodities(marketId, system, data) {
  const distance = systems.distance(system, reference);
  if (isNaN(distance)) {
    return false;
  }
  if (distance > limit) {
    // test if we do not need to drop the market
    if (trackedBuyers.has(marketId)) {
      trackedBuyers.delete(marketId);
      if (marketId == bestMarketId) {
        findNewBest();
        return true;
      }
    }
    return false;
  }
  if (!data) {
    return false;
  }
  for (let commodity of data) {
    commodity.name = commodity.name.toLowerCase();
    if (commodity.name != tracked || commodity.demand < minimumDemand) {
      continue;
    }
    const price = commodity.sellPrice;
    const demand = commodity.demand;
    trackedBuyers.set(marketId, {price, demand});
    if (marketId === bestMarketId) {
      findNewBest();
      return true;
    }
    if (price > bestMarketPrice) {
      bestMarketPrice = price;
      bestMarketId = marketId;
      bestMarketDemand = commodity.demand;
      return true;
    }
    return false;
  }
}

function jumpCarrier(marketId) {
  if (trackedBuyers.has(marketId)) {
    trackedBuyers.delete(marketId);
    if (marketId == bestMarketId) {
      findNewBest();
      return true;
    }
  }
  return false;
}

function getBest() {
  return {bestMarketId, bestMarketPrice, bestMarketDemand}
}

module.exports = {
  setReference,
  setDistanceLimit,
  setMinimumDemand,
  track,
  updateCommodities,
  jumpCarrier,
  getBest
}