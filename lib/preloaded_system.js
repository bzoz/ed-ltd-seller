const util = require('util')
const execFile = util.promisify(require('child_process').execFile)

async function getSystem(name) {
  try {
    const { stdout } = await execFile(
        process.argv0,
        ['system_coords.js', name],
        {
          windowsVerbatimArguments: false
        });
    const coords = stdout.split(',');
    if (coords.length != 3)
        return null
    else
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