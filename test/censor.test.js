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
const port = 3017
const http = axios.create({
  baseURL : 'http://localhost:'+port,
})

const { signupAndLogin, staffSignup, staffLogin } = require('./common')(http)

const sinon = require('sinon')

describe('censor tests', () => {
  let session
  let clock

  beforeAll(async ()=>{
    session = new Session(config.db)
    Model.knex(session.knex)
    await session.createTables()

    this.server = app.listen(port)
    await this.server.once('listening', () =>{} )

    clock = sinon.useFakeTimers(new Date(2000,1,1,8));

  })

  afterAll(()=>{
    this.server.close()
    clock.restore()
    http = null 
    
  })

  var qid, aid, cid, uid
  test('censor test all', async () => {
    try {
      var res = await staffSignup('A1')
      expect(res.status).toBe(200)
      var res = await staffSignup('A1')
    } catch (e) {
      expect(e.response.data.code).toBe(ERR_CODE.NAME_REGISTERED)
    }
  })

  test('censor get users', async () => {
    try {
      await signupAndLogin(1)
      res = await http.get('/censor/users')
    } catch (e) {
      expect(e.response.data.code).toBe(ERR_CODE.NO_PERMISSION)
    }

    await staffLogin('A1')
    res = await http.get('/censor/users')
    console.log(res.data.users)
    expect(res.data.users.total).toBe(1)
    expect(res.data.users.results[0].phone).toBe('sl200001')

  })

  var uid
  test('censor create user', async () => {

    res = await http.post('/censor/user')
    console.log(res.data.user)

    res = await http.post('/censor/user', {
      name: 'hello',
      phone: '1000',
      password: '12312311',
      avatar: 'test',
    })

    expect(res.data.user.name).toBe('hello')
    uid = res.data.user.id

  })

  test('censor patch user', async () => {


    res = await http.patch('/censor/user/'+uid, {
      name: 'hello222',
    })

    console.log(res.data.user)
    expect(res.data.user.name).toBe('hello222')
    expect(res.data.user.phone).toBe('1000')

  })



})

