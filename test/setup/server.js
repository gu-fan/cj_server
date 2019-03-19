const axios = require('axios')
const { Model } = require('objection')

const Session= require('./session')
const path = require('path')

const { getPort } = require('../common/util')
const config = require('config')

var server, session

function getDB(name){
  return config.db
  // return {
  //   client: 'sqlite3',
  //   connection: {
  //     filename: path.join(__dirname, '../../data/' + name + '.sqlite3')
  //   },
  //   useNullAsDefault: true
  // }
}

async function setupTables(name){
    session = new Session(getDB(name))
    Model.knex(session.knex)
    await session.clearTables()
    await session.createTables()
    return session
}

function setupServerFac(name, port){
  return async ()=>{
    await setupTables(name)


    // XXX: FIXED
    // this db is different in test mode for app
    // we should set env before load it

    process.env.TEST_DB = name

    const app = require('../../src/app')

    server = app.listen(port)

    await server.once('listening', () =>{
      // console.log('start')
    })
  }
}

async function closeServer(){
    
  // XXX process is not exit,
  // use jest --forceExit
    server.close(()=>{
        // console.log('Closed out remaining connections')
        session.knex.destroy()
        .then(e=>{
          // console.log('destroy knex over')
          setTimeout(() => process.exit(), 1000)
        })
    })

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
