const level = require('level')
const path = require('path')
const db = level('systems-leveldb')

async function getSystem(name) {
  try {
    const coordsTxt = await db.get(name);
    const coords = coordsTxt.split(',');
    return {
      x: coords[0],
      y: coords[1],
      z: coords[2]
    }
  } catch {
    return null;
  }
}

module.exports = {
  getSystem
}