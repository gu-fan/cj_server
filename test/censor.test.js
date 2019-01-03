const sinon = require('sinon')

const ERR = require('../src/code').ERR_CODE

const _TEST_ = require('path').basename(__filename);
const { http, setupServer, closeServer } = require('./setup/server')(_TEST_)

const { signupAndLogin, staffSignup, staffLogin } = require('./common')(http)


describe('censor tests', () => {
  beforeAll(async ()=>{
    await setupServer()
  })

  afterAll(async ()=>{
    await closeServer()
  })

  let clock
  let res


  var qid, aid, cid, uid
  test('censor test all', async () => {
    try {
      var res = await staffSignup('A1')
      expect(res.status).toBe(200)
      var res = await staffSignup('A1')
    } catch (e) {
      expect(e.response.data.code).toBe(ERR.NAME_REGISTERED)
    }
  })

  test('censor get users', async () => {
    try {
      await signupAndLogin(1)
      res = await http.get('/censor/users')
    } catch (e) {
      expect(e.response.data.code).toBe(ERR.NO_PERMISSION)
    }

    await staffLogin('A1')
    res = await http.get('/censor/users')
    expect(res.data.users.total).toBe(1)
    expect(res.data.users.results[0].phone).toBe('p20000_1')

  })

  var uid
  test('censor create user', async () => {

    res = await http.post('/censor/user')
    // console.log(res.data.user)

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

    // console.log(res.data.user)
    expect(res.data.user.name).toBe('hello222')
    expect(res.data.user.phone).toBe('1000')

  })



})

