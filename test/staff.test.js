const sinon = require('sinon')

const ERR = require('../src/code').ERR_CODE
const MSG = require('../src/code').MSG_CODE

const _TEST_ = require('path').basename(__filename);
const { http, setupServer, closeServer } = require('./setup/server')(_TEST_)

const { signup, signupAndLogin, staffLogin, staffSignup } = require('./common')(http)

describe('staff tests', () => {
  beforeAll(async ()=>{
    await setupServer()
  })

  afterAll(async ()=>{
    await closeServer()
  })

  let clock
  let res

  test('signup only once', async () => {

    try {
      var res = await staffSignup('A1')
      expect(res.status).toBe(200)
      var res = await staffSignup('A1')
    } catch (e) {
      expect(e.response.data.code).toBe(ERR.NAME_REGISTERED)
    }

  })

  let token
  test('login with username and password', async()=>{
    try {
      clock = sinon.useFakeTimers(1529344000000) // exp in : 7d
      var res = await staffLogin('A1')
    } catch (e) {
      console.log(e.response && e.response.data || e)
    }
  })

  test('login valid after 100s', async()=>{
    clock = sinon.useFakeTimers(1529344005000) // exp + 5s

    res = await http.get('/sa/.ping')
    expect(res.status).toBe(200)
    expect(res.data.msg).toBe(MSG.STAFF_VALID)
    expect(res.data.u.permission).toBe('superadmin')
    
  }, 10000)

  test('login expire after 7d', async ()=>{
    clock = sinon.useFakeTimers(1639549005000) // exp +604800s = 24*60*60*7
    var res

    try {
      res = await http.get('/sas/.ping')
    } catch (e) {
      res = e.response
    }

    expect(res.status).toBe(401)
    expect(res.data.code).toBe('token_expired')

  }, 10000)

})
