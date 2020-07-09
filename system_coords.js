const level = require('level')

function get_coords() {
  level('systems-leveldb', (err, db)=> {
    if (err) {
      if (err instanceof level.errors.OpenError) {
        // try agian in 50ms
        setTimeout(get_coords, 50)
        return
      } else {
        throw err
      }
    }
    if (process.argv.length < 3) {
      console.log('Usage: node system_coords.js system name')
    } else {
      (async () => {
        const name = process.argv.slice(2).join(' ')
        try {
          const coordsTxt = await db.get(name.toUpperCase());
          const coords = coordsTxt.split(',');
          console.log(`${coords[0]},${coords[1]},${coords[2]}`)
        } catch {
          console.log(`Unkonw system: ${name}`)
          process.exit(-1)
        }
      })();
    }
  })
}

get_coords()
