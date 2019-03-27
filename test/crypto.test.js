const assert = require('assert')
const sinon = require('sinon')

const ERR = require('../src/code').ERR_CODE
const MSG = require('../src/code').MSG_CODE

const _TEST_ = require('path').basename(__filename);
const { http, setupServer, closeServer } = require('./setup/server')(_TEST_)
const { signup, login, signupAndLogin } = require('./common')(http)
const {encrypt,decrypt, generateKey, checkValid}  = require('../src/common/crypto')


describe('crypto tests', () => {
  let clock
  let res

  beforeAll(async ()=>{
    // await setupServer()
  })

  afterAll(async ()=>{
    // await closeServer()
  })

  test('test crypto', async () => {

    let key = 'hello'
    let hash = encrypt(key)
    console.log(hash)
    let _key = decrypt(hash)
    console.log(_key)
    expect(_key).toBe(key)

    try {
      let fake_hash = 'jaifjeoif893lka'
      let fake_key = decrypt(fake_hash)
    } catch (e) {
      expect(e.message).toBe('Bad input string')
      console.log(e.message)
    }


  })
  test('test key', async ()=>{
    expect.assertions(3)
    let id = 'aaabbb'
    clock = sinon.useFakeTimers(new Date(2000,1,2, 8))
    let st = generateKey(id)

    let ret
    clock = sinon.useFakeTimers(new Date(2000,1,2, 10))
    ret = checkValid(id, st)

    try {
      clock = sinon.useFakeTimers(new Date(2000,1,6, 10))
      
      ret = checkValid(id, st)
    } catch (e) {
      expect(e.code).toBe(ERR.SHARE_EXPIRED)
    }

    try {
      ret = checkValid(id, 'kkkkk')
    } catch (e) {
      expect(e.code).toBe(ERR.BAD_ARGUMENT)
    }
    try {
      ret = checkValid(id, '')
    } catch (e) {
      expect(e.code).toBe(ERR.BAD_ARGUMENT)
    }



  })


})
