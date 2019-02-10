var t = Date.now()
var ports = {
  'user.test.js':3018,
  'censor.test.js':3019,
  'like.test.js':3020,
  'permission.test.js':3021,
  'question.test.js':3022,
  'selected.test.js':3023,
  'spam.test.js':3024,
  'staff.test.js':3025,
  'user.test.js':3026,
  'picture.test.js':3027,
}
var p = 3030
module.exports = {
  logTime (msg){
    console.log(`${msg||''} ${Date.now() - t} ms`)
    t = Date.now()
  },
  getPort(name){
    if (ports.hasOwnProperty(name)) {
      return ports[name]
    } else {
      ports[name] = p
      p++
      return ports[name]
    }
  }
}
