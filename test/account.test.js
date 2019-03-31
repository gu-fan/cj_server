const sinon = require('sinon')

const ERR = require('../src/code').ERR_CODE

const _TEST_ = require('path').basename(__filename);
const { http, setupServer, closeServer } = require('./setup/server')(_TEST_)
const { loginAccount, login, signup, signupAndLogin, signupAndLoginWX } = require('./common')(http)
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

  test('signup ', async () => {
    try {
      res = await signup('A1', http)
      expect(res.status).toBe(200)
    } catch (e) {
      logError(e)
    }
  })

  test('account', async () => {
    try {
      await login('A1')
      res = await http.post('/account/.ping')
      expect(res.status).toBe(200)
    } catch (e) {
      logError(e)
    }
  })

  let uid, cid
  test('account create', async () => {
    try {
      res = await http.post('/account/create')
      expect(res.data.main.child_accounts.length).toBe(1)
      uid = res.data.main.id
      cid = res.data.main.child_accounts[0].id
      res = await http.post('/account/create')
      expect(res.data.main.child_accounts.length).toBe(2)
    } catch (e) {
      logError(e)
    }
  })

  test('account login', async () => {
    try {
      await loginAccount(cid)
      res = await http.get('/account/.ping')
      expect(res.data.main.child_accounts.length).toBe(2)
    } catch (e) {
      logError(e)
    }
  })

  test('account create with child', async () => {
    expect.assertions(1)
    try {
      await loginAccount(cid)
      res = await http.post('/account/create')
      expect(res.data.main.child_accounts.length).toBe(3)
    } catch (e) {
      logError(e)
    }
  })

  test('account create with main', async () => {
    expect.assertions(1)
    try {
      await loginAccount(uid)
      res = await http.post('/account/create')
      expect(res.data.main.child_accounts.length).toBe(4)
    } catch (e) {
      logError(e)
    }
  })

  test('another user\'s account', async () => {
    expect.assertions(1)
    try {
      await signupAndLogin('A2')
      res = await http.post('/account/create')
      expect(res.data.main.child_accounts.length).toBe(1)
    } catch (e) {
      logError(e)
    }
  })

  test('another user not signable', async () => {
    expect.assertions(1)
    try {
      await loginAccount(uid)
    } catch (e) {
      expect(e.response.data.code).toBe(ERR.NO_RELATED_ACCOUNT)
    }
  })

  test('sign back', async () => {
    expect.assertions(4)
    try {
      await login('A1')
      res = await http.get('/account/.ping')
      expect(res.data.is_child).toBe(false)
      await loginAccount(cid)
      res = await http.get('/account/.ping')
      expect(res.data.main.child_accounts.length).toBe(4)
      expect(res.data.is_child).toBe(true)
      res = await http.post('/account/create')

    } catch (e) {
      expect(e.response.data.code).toBe(ERR.MAX_ACCOUNT_EXCEEDS)
    }
  })



})
