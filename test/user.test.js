const sinon = require('sinon')

const ERR = require('../src/code').ERR_CODE

const _TEST_ = require('path').basename(__filename);
const { http, setupServer, closeServer } = require('./setup/server')(_TEST_)
const { login, signup, signupAndLogin, signupAndLoginWX } = require('./common')(http)
const {logError} = require('./common/error')

describe('user tests', () => {
  let clock
  let res

  beforeAll(async ()=>{
    await setupServer()
  })

  afterAll(async ()=>{
    await closeServer()
  })

  test('signup and only once', async () => {
    try {
      res = await signup('A1', http)
      expect(res.status).toBe(200)
      res = await signup('A1', http)
    } catch (e) {
      expect(e.response.data.code).toBe(ERR.PHONE_REGISTERED)
    }
  })

  test('signup and login with wechat ', async () => {
    try {
      res = await signupAndLoginWX('A1', http)
      expect(res.status).toBe(200)
      res = await signupAndLoginWX('A1', http)
    } catch (e) {
      console.log(e.response.data)
      expect(e.response.data.code).toBe(ERR.PHONE_REGISTERED)
    }
  })

  test('login with username and password', async()=>{
    clock = sinon.useFakeTimers(new Date(2019,1,1))
    res = await signupAndLogin('TIME', http)
    expect(res.data.code).toBe(0)
  })

  test('token is valid after 100s', async()=>{
    clock = sinon.useFakeTimers(new Date(2019,1,1,0,0,5))
      res = await http.get('/u/.ping')
    expect(res.status).toBe(200)
    expect(res.data.msg).toBe('user ping valid')
  })

  test('token is expired after 20d', async ()=>{

    try {
      clock = sinon.useFakeTimers(new Date(2019,1,21,0,0,1))
      res = await http.get('/u/.ping')
    } catch (e) {
      res = e.response
    }

    expect(res.status).toBe(401)
    expect(res.data.code).toBe('token_expired')
  })

  test('set user setting', async () => {
    expect.assertions(11)
    try {
      await login('A1')
      res = await http.post('/u/set', {avatar:'hhhh'})
      expect(res.data.user.avatar).toBe('hhhh')
      res = await http.post('/u/set', {background:'BBBB'})
      expect(res.data.user.avatar).toBe('hhhh')
      expect(res.data.user.background).toBe('BBBB')
      res = await http.post('/u/set', {background:''})
      expect(res.data.user.avatar).toBe('hhhh')
      expect(res.data.user.background).toBe('BBBB')
      res = await http.post('/u/set', {background:false})
      expect(res.data.user.avatar).toBe('hhhh')
      expect(res.data.user.background).toBe('BBBB')

      res = await http.post('/u/set', {name:'XXXX'})
      expect(res.data.user.avatar).toBe('hhhh')
      expect(res.data.user.background).toBe('BBBB')
      expect(res.data.user.name).toBe('XXXX')

      try {
        res = await http.post('/u/set', {name:'xxjaiojsidjoijfiefiajweofijaweif'})
      } catch (e) {
        expect(e.response.data.code).toBe(ERR.NAME_EXCEED_LIMIT_15)
      }

    } catch (e) {
      logError(e)
    }
  })


})
