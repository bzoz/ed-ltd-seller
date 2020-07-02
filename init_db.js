const zlib = require('zlib')
const fs = require('fs')
const path = require('path')
const es = require('event-stream')
const level = require('level')


function loadSystems() {
  let loaded = 0;
  const db = level(path.join('database','systems-db'))
  fs.createReadStream(path.join('database','systemsWithCoordinates.json.gz'))
  .pipe(zlib.createGunzip())
  .pipe(es.split())
  .pipe(es.mapSync(line => {
    try {
      const data = JSON.parse(line.slice(0,-1));
      db.get(data.name.toUpperCase())
        .catch(() => { db.put(data.name.toUpperCase(), [data.coords.x, data.coords.y, data.coords.z]) })
      ++loaded;
      if (loaded % 1000000 === 0) {
        console.log(`Loaded ${loaded/1000000}m systems...`)
      }
    } catch (e) { if (!e instanceof SyntaxError) console.log(e) }
  }))
  .on('end', ()=>{
    db.close(loadStations)
  })
}
function loadStations() {
  const systems = level(path.join('database','systems-db'))
  const stations = level(path.join('database','stations-db'))
  fs.createReadStream(path.join('database','stations.json.gz'))
    .pipe(zlib.createGunzip())
    .pipe(es.split())
    .pipe(es.mapSync(line => {
      try {
        const data = JSON.parse(line.slice(0,-1));
        if (!data.marketId || !data.haveMarket)
          return;
        systems.get(data.systemName.toUpperCase())
        .then((coords)=>{
          stations.put(data.marketId, {
            type: data.type,
            name: data.name,
            distance: data.distanceToArrival,
            system: data.systemName.toUpperCase(),
            coords
          })
         })
      } catch (e) { if (!e instanceof SyntaxError) console.log(e) }
    }))
    .on('end', () => {
      stations.close()
        .then(()=>{return systems.close()})
        .then(()=>{console.log('All done!')})
    })
}

loadSystems();