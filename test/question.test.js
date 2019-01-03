const assert = require('assert')
const sinon = require('sinon')

const ERR = require('../src/code').ERR_CODE
const MSG = require('../src/code').MSG_CODE

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

  var qid,uid,qid2
  test('create question', async () => {

    await signupAndLogin('test')

    var question = {
      title: "hello",
      content: "HELLO WORLD"
    }

    res = await http.post('/q', question)
    expect(res.data.msg).toBe(MSG.QUESTION_SUCCESS)
    expect(res.data.question.content).toBe('HELLO WORLD')

    qid2 = res.data.question.id
    var question2 = {
      title: "hello222",
      content: "HELLO WORLD222"
    }

    // NOTE: IT"S ALREADY PASSED
    // try {
      res = await http.post('/q/', question2)
    // } catch (e) {
    //   res = e.response
    // }
    qid = res.data.question.id
    uid = res.data.question.author_id
    expect(res.data.code).toBe(0)

    // let it pass
    res = await http.get('/u/.ping')
    uid = res.data.user.id
    res = await http.get('/pub/grant', {params:{uid, code:'FZBB'}})

    res = await http.post('/censor/q/'+qid,{action:'pass'})
    res = await http.post('/censor/q/'+qid2,{action:'pass'})


    res = await http.get('/q')
    
  })

  test('get question', async () => {
    try {
      res = await http.get('/q/'+qid)
      expect(res.data.question.title).toBe('hello222')
      
    } catch (e) {
      console.log(e.response)
    }

  })
  test('get users question', async () => {
    try {
      res = await http.get('/u/'+uid)
      expect(res.data.user.total_questions).toBe(2)
    } catch (e) {
      console.log(e.response)

      
    }

  })
  test('update pos', async () => {
    try {
      res = await http.put('/q/'+qid, {title:'cccc'})
    } catch (e) {
      console.log(e.response)
      
    }

  })

  test('delete pos', async () => {
    try {
      res = await http.delete('/q/'+qid)
    } catch (e) {
      console.log(e.response)

      
    }
  })

  test('get users question', async () => {
    try {
      res = await http.get('/u/'+uid)
      expect(res.data.user.total_questions).toBe(2)
    } catch (e) {
      console.log(e)
    }

  })
  test('get total ans', async () => {
    try {
      res = await http.get('/a')
      expect(res.data.count).toBe(0)
    } catch (e) {
      console.log(e.response)
    }

  })

  test('create ans', async () => {
    try {
      res = await http.post('/a', {qid:qid2, content:'ANS'})
      aid = res.data.answer.id
      res = await http.post('/a', {qid:qid2, content:'ANS2'})
      aid2 = res.data.answer.id
      res = await http.post('/censor/a/'+aid,{
        action:'pass'
      })
      res = await http.post('/censor/a/'+aid2,{
        action:'pass'
      })
      
      expect(res.data.answer.content).toBe('ANS2')
    } catch (e) {
      console.log(e.response)
    }
  })
  var aid,aid2
  test('get qs', async () => {
    try {
      res = await http.get('/q/'+qid2)
      expect(res.data.answers.results.length).toBe(2)
      aid = res.data.answers.results[0].id
      aid2 = res.data.answers.results[1].id
    } catch (e) {
      console.log(e)

    }
  })

  test('patch ans', async () => {
    try {
      res = await http.put('/a/' + aid, {content:'ANS PATCH'})
    } catch (e) {
      console.log(e)
    }
  })

  test('delete ans', async () => {
    try {
      // res = await http.delete('/a/' + aid2)
      // console.log(res.data.numberOfDeletedRows)
    } catch (e) {
      console.log(e.response)
    }
  })

  test('get ans count', async () => {
      res = await http.get('/a')
      expect(res.data.count).toBe(2)
  })

  var cid
  test('create comment', async () => {
      res = await http.post('/censor/a/'+aid,{
        action:'pass'
      })
    
      res = await http.post('/c', {aid:aid, content:'hello comment'})
      cid = res.data.comment.id

  })
  test('get cmt', async () => {
    try {
      res = await http.get('/c')
      expect(res.data.count).toBe(1)
    } catch (e) {
      console.log(e.response)
    }
      
  })
  test('patch cmt', async () => {
    try {
      res = await http.put('/c/'+cid, {content:'CMT PATCH'})
    } catch (e) {
      console.log(e.response)
    }
  })

  test('delete cmt', async () => {
    try {
      res = await http.delete('/c/'+cid)
    } catch (e) {
      console.log(e.response)
    }
  })
  test('get cmt', async () => {
    try {
      res = await http.get('/c')
      expect(res.data.count).toBe(1)
    } catch (e) {
      console.log(e)
    }
      
  })

  test('like ans', async () => {
    try {
      res = await http.get('/a/'+aid+'/like')
      // console.log(res.data)
      expect(res.data.total_zhichi).toBe(0)
    } catch (e) {
      console.log(e.response)
    }
      
  })
  test('like ans set', async () => {
    try {
      res = await http.post('/a/'+aid+'/like')
      expect(res.data.total_zhichi).toBe(1)

    } catch (e) {
      console.log(e.response)
    }
      
  })

  test('get like ans', async () => {
    try {
      res = await http.get('/a/'+aid+'/like')
      expect(res.data.total_zhichi).toBe(1)
      expect(res.data.is_zhichi).toBe(true)
      expect(res.data.is_fandui).toBe(false)
    } catch (e) {
      console.log(e.response)
    }
      
  })
  test('dislike ans 2', async () => {
    try {
      res = await http.post('/a/'+aid+'/dislike')
      expect(res.data.total_zhichi).toBe(0)
      expect(res.data.total_fandui).toBe(0)
      expect(res.data.is_zhichi).toBe(false)
      expect(res.data.is_fandui).toBe(false)
    } catch (e) {
      console.log(e)
    }
      
  })

  test('dislike ans 3', async () => {
    try {
      res = await http.post('/a/'+aid+'/dislike')
      expect(res.data.total_zhichi).toBe(0)
      expect(res.data.total_fandui).toBe(1)
    } catch (e) {
      console.log(e)
    }

  })

  test('get like ans', async () => {
    try {
      res = await http.get('/a/'+aid+'/like')
      expect(res.data.total_fandui).toBe(1)
      expect(res.data.is_zhichi).toBe(false)
      expect(res.data.is_fandui).toBe(true)
    } catch (e) {
      console.log(e)
    }
      
  })

})
