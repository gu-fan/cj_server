const sinon = require('sinon')

const ERR = require('../src/code').ERR_CODE

const _TEST_ = require('path').basename(__filename);
const { http, setupServer, closeServer } = require('./setup/server')(_TEST_)
const { signup, signupAndLogin } = require('./common')(http)

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
      var res = await signup('A1', http)
      expect(res.status).toBe(200)
      var res = await signup('A1', http)
    } catch (e) {
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
    var res

    try {
      clock = sinon.useFakeTimers(new Date(2019,1,21,0,0,1))
      res = await http.get('/u/.ping')
    } catch (e) {
      res = e.response
    }

    expect(res.status).toBe(401)
    expect(res.data.code).toBe('token_expired')
  })

})
