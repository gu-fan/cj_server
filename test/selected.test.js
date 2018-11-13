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
const port = 3018

const http = axios.create({
  baseURL : 'http://localhost:'+port,
})

const { login, signup, signupAndLogin,  getRes } = require('./common')(http)
const { logError } = require('./common/error')

const sinon = require('sinon')

describe('user tests', () => {
  let session
  let clock
  let res

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

  var uid, aid, qid
  test('signup', async () => {
      await signupAndLogin(2)
      await signupAndLogin(1)
      res = await http.get('/u/.ping')
      uid = res.data.user.id
      res = await http.get('/pub/grant',
                      {params: {uid, code:'FZBB'} })
      res = await http.get('/u/.ping')
      expect(res.data.user.is_staff).toBe(true)
  })

  test('create post', async () => {
    var question = {
      title: "H1",
      content: "HELLO WORLD"
    }
    res = await http.post('/q', question)
    qid = res.data.question.id
    expect(res.data.question.title).toBe('H1')

    res = await http.post('/a', {qid, content:'A1'})
    aid = res.data.answer.id
    expect(res.data.answer.content).toBe('A1')
  })

  var aid2,qid2
  test('select post', async () => {

    await login(2)
    try {
      res = await http.get('/a/'+ aid + '/select')
    } catch (e) {
      expect(e.response.data.code).toBe('NO_PERMISSION')
    }
    await login(1)
    res = await http.get('/a/'+ aid + '/select')
    expect(res.data.answer.is_selected) .toBe(1)
    res = await http.get('/a/'+ aid + '/unselect')
    expect(res.data.answer.is_selected) .toBe(0)

  })

  test('delete answer', async () => {

    await login(2)
    res = await http.post('/a', {qid, content:'A2'})
    aid2 = res.data.answer.id

    try {
      res = await http.delete('/a/'+aid)
    } catch (e) {
      // logError(e)
      expect(e.response.data.code).toBe('NOT_AUTHOR')
    }

    await login(1)
    res = await http.delete('/a/'+aid)
    expect(res.data.deleted).toBe(1)

    res = await http.delete('/a/'+aid2)
    expect(res.data.deleted).toBe(1)

    try {
      res = await http.delete('/a/'+aid)
    } catch (e) {
      expect(e.response.data.code).toBe('ALREADY_DELETED')
    }

  })

  test('delete question', async () => {

    await login(2)
    res = await http.post('/q', {title:"H2", content:'A2'})
    qid2 = res.data.question.id

    try {
      res = await http.delete('/q/'+qid)
    } catch (e) {
      // logError(e)
      expect(e.response.data.code).toBe('NOT_AUTHOR')
    }

    await login(1)
    res = await http.delete('/q/'+qid)
    expect(res.data.deleted).toBe(1)

    res = await http.delete('/q/'+qid2)
    expect(res.data.deleted).toBe(1)

    try {
      res = await http.delete('/q/'+qid)
    } catch (e) {
      expect(e.response.data.code).toBe('ALREADY_DELETED')
    }

  })

})

