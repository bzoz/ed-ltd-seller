const stats = {
  total: 0,
  systems: 0,
  stations: 0,
  prices: 0
}

module.exports = {
  packet: ()=>{ ++stats.total },
  system: ()=>{ ++stats.systems },
  station: ()=>{ ++stats.stations },
  price: ()=>{ ++stats.prices },
  stats: ()=>{ return stats }
}
