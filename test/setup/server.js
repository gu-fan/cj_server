const axios = require('axios')
const { Model } = require('objection')

const Session= require('./session')
const app = require('../../src/app')
const path = require('path')

const { getPort } = require('../common/util')

var session, server

function getDB(name){
  return {
    client: 'sqlite3',
    connection: {
      filename: path.join(__dirname, '../../data/' + name + '.sqlite3')
    },
    useNullAsDefault: true
  }
}

async function setupTables(name){
    var session = new Session(getDB(name))
    Model.knex(session.knex)
    await session.clearTables()
    await session.createTables()
}

function setupServerFac(name, port){
  return async ()=>{
    await setupTables(name)

    server = app.listen(port)
    await server.once('listening', () =>{})
  }
}

async function closeServer(){
    server.close()
    await clearTables()
}

async function clearTables(){
    await session.clearTables()
}

module.exports = function(name){

  var PORT = getPort(name)
  var http = axios.create({ baseURL : 'http://localhost:' + PORT })
  return {
    http,
    setupServer: setupServerFac(name, PORT),
    closeServer
  }

}
