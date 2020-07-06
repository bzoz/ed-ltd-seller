const zlib = require('zlib')
const request = require('request')
const readline = require('readline')

const level = require('level')
const db = level('systems-leveldb')

const stream = request('https://www.edsm.net/dump/systemsWithCoordinates.json.gz').pipe(zlib.createGunzip());
const rl = readline.createInterface({
  input: stream,
  crlfDelay: Infinity
})

let loaded = 0
process.stdout.write('There are about 50000k systems in the database.\n');
rl.on('line', (line) => {
  let data;
  try {
    data = JSON.parse(line.slice(0,-1));
  } catch (err) { 
    if (err instanceof SyntaxError) return; else throw err;
  }
  rl.pause();
  db.put(data.name.toUpperCase(), [data.coords.x, data.coords.y, data.coords.z])
    .then(() => {
      rl.resume();
      ++loaded;
      if (loaded%10000 == 0) {
        process.stdout.write(`Loaded ${loaded/1000}k systems...\r`);
      }
    });
})
.on('close', () => {
  process.stdout.write(`Loaded ${loaded} systems. Done!\n`);
});
