
const { Model } = require('objection')
const Session= require('../test/setup/session')


async function init(){
  var session = new Session(require('config').db)
  Model.knex(session.knex)
  await session.clearTables()
  return 1
}
init()
  .then(res=>{
    console.log(res)
  })
