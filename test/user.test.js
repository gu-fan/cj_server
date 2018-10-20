const assert = require('assert')
const axios = require('axios')
const app = require('../src/app')
const {ERR_CODE}  = require('../src/code')

const Session= require('./setup/session')
const config = require('config')
const Knex = require('knex')
const {raw, Model } = require('objection')
const {User} = require('../src/models')


const jwt = require('../src/common/jwt-auth')
const port = 3013
const http = axios.create({
  baseURL : 'http://localhost:'+port,
})

const { signup, signupAndLogin,  getRes } = require('./common')(http)

const sinon = require('sinon')


describe('user tests', () => {
  let session
  let clock

  beforeAll(async ()=>{
    session = new Session(config.db)
    Model.knex(session.knex)
    await session.createTables()

    this.server = app.listen(port)
    await this.server.once('listening', () =>{} )

  })

  afterAll(()=>{
    this.server.close()
    http = null 
    
  })

  test('signup only once', async () => {

    try {
      var res = await signup('A1', http)
      expect(res.status).toBe(200)
      var res = await signup('A1', http)
    } catch (e) {
      expect(e.response.data.code).toBe(ERR_CODE.PHONE_REGISTERED)
    }

  })
  let token
  test('login with username and password', async()=>{
    clock = sinon.useFakeTimers(1529344000000) // exp in : 7d
    var res = await signupAndLogin('TIME', http)
    token = res.data.t
  })
  test('login valid after 100s', async()=>{
    clock = sinon.useFakeTimers(1529344005000) // exp + 5s

      res = await http.get('/user/.ping')
    expect(res.status).toBe(200)
    expect(res.data.msg).toBe('user valid')
    
  }, 10000)
  test('login expire after 7d', async ()=>{
    var res

    try {
      clock = sinon.useFakeTimers(1539549005000) // exp +604800s = 24*60*60*7

      res = await http.get('/user/.ping')
    } catch (e) {
      res = e.response
    }
    expect(res.status).toBe(401)
    expect(res.data.code).toBe('invalid_token')

  })

})
