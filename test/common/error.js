function logError(e){
  var msg = e.response ? e.response.data : e.message
  console.log(msg)
}

module.exports = {
  logError
}
