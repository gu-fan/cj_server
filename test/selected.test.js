const assert = require('assert')
const sinon = require('sinon')

const ERR = require('../src/code').ERR_CODE

const _TEST_ = require('path').basename(__filename);
const { http, setupServer, closeServer } = require('./setup/server')(_TEST_)

const { signup, signupAndLogin, login } = require('./common')(http)

describe(_TEST_, () => {
  let clock
  let res

  beforeAll(async ()=>{
    await setupServer()
  })

  afterAll(async ()=>{
    await closeServer()
  })

  var uid, aid, qid
  test('signup', async () => {
      // logTime()

      await signupAndLogin(2)
      // logTime('signup 2')
      await signupAndLogin(1)
      // logTime('signup 1')
      res = await http.get('/u/.ping')
      uid = res.data.user.id
      res = await http.get('/pub/grant',
                      {params: {uid, code:'FZBB'} })
      // logTime('grant')
      res = await http.get('/u/.ping')
      expect(res.data.user.is_staff).toBe(true)
      // logTime()
  })

  test('create post', async () => {
    try {
      
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
      
    } catch (e) {
      console.log(e)
    }
  })

  var aid2,qid2
  test('select post', async () => {
    try {
      

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
    } catch (e) {
      console.log(e)
      
    }

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

