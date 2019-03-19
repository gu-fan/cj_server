const sinon = require('sinon')

const ERR = require('../src/code').ERR_CODE

const _TEST_ = require('path').basename(__filename);
const { http, setupServer, closeServer } = require('./setup/server')(_TEST_)

const { signupAndLogin, staffSignup, staffLogin } = require('./common')(http)
const { 
    NotNullViolationError,
    UniqueViolationError,
    ConstraintViolationError,
    ForeignKeyViolationError,
    CheckViolationError,
    DataError
  } = require('objection-db-errors');

const { User } = require('../src/models')


describe('model tests', () => {
  beforeAll(async ()=>{
    await setupServer()
  })

  afterAll(async ()=>{
    await closeServer()
  })

  let clock
  let res


  var qid, aid, cid, uid
  test('model should have unique id', async () => {
      
      var u = await User.query()
          .insert({id:'01'})
    try {
      var u2 = await User.query()
          .insert({id:'01'})
    } catch (e) {
      expect(e instanceof UniqueViolationError).toBe(true)
    }

  })
  test('model should have unique phone', async () => {
      
      var u = await User.query()
          .insert({id:'03', phone: '111'})
    try {
      var u2 = await User.query()
          .insert({id:'04', phone: '111'})
    } catch (e) {
      expect(e instanceof UniqueViolationError).toBe(true)
    }

  })




})

