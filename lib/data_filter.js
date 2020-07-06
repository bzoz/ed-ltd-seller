const db = require('./memurai_db')

let refSystem;
let refCoords;
let distanceLimit;
let minSupply;
let minDemand;
let commodityFilter;

async function setRefSystem(system) {
  refSystem = system.toUpperCase();
  refCoords = await db.getSystem(refSystem);
  if (!refCoords) {
    console.error(`Unknown system ${system}, use setRefCoords to set coordinates manually`)
  }
}

function setRefCoords(coords) {
  refCoords = coords;
}

function getDistanceToRef(coords) {
  if (refCoords) {
    return Math.sqrt((refCoords.x - coords.x)**2 +
                     (refCoords.y - coords.y)**2 +
                     (refCoords.z - coords.z)**2);
  }
}

function setDistanceLimit(limit) {
  distanceLimit = limit;
}

function inDistanceLimit(coords) {
  if (refCoords && distanceLimit) {
    if (!coords || !coords.x || !coords.y || !coords.z)
      return false
    return getDistanceToRef(coords) <= distanceLimit
  }
  else
    return true;
}

function setMinSupply(supply) {
  minSupply = supply;
}

function hasEnoughSupply(supply) {
  if (minSupply && supply)
    return supply >= minSupply;
  else
    return true;
}

function setMinDemand(demand) {
  minDemand = demand;
}

function hasEnoughDemand(demand) {
  if (minDemand && demand)
    return demand >= minDemand;
  else
    return true;
}

function setCommodityFilter(commodities) {
  commodityFilter = new Set();
  for (let commodity of commodities) {
    commodityFilter.add(commodity.toUpperCase())
  }
}

function isFilteredCommodity(commodity) {
  if (commodityFilter)
    return commodityFilter.has(commodity.toUpperCase())
  else 
    return true;
}

module.exports = {
  setRefSystem, setRefCoords,
  getDistanceToRef,
  setDistanceLimit, inDistanceLimit,
  setMinSupply, hasEnoughSupply,
  setMinDemand, hasEnoughDemand,
  setCommodityFilter, isFilteredCommodity
}
