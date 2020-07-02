const systems = new Map()

function update (system, position) {
  systems.set(system.toUpperCase(), position)
}

function distance (a, b) {
  const sys_a = systems.get(a.toUpperCase())
  const sys_b = systems.get(b.toUpperCase())
  if (!sys_a || !sys_b) {
    return NaN
  }
  return Math.sqrt((sys_a[0] - sys_b[0]) ** 2 +
                   (sys_a[1] - sys_b[1]) ** 2 +
                   (sys_a[2] - sys_b[2]) ** 2)
}

function count () {
  return systems.size
}

module.exports = {
  update,
  distance,
  count
}
