function logError(e){
  var msg = e.response ? e.response.data : e.message
  console.log(msg)
}

function wrap(fn){
  return (done)=>{
    fn(done).catch(e=>{
      var msg = e.response ? e.response.data : e.message
      console.log(msg)
      done()
    })
  }
}

module.exports = {
  logError,
  wrap
}
