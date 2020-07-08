const level = require('level')
const db = level('systems-leveldb')

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