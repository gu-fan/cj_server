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
const port = 3013
const http = axios.create({
  baseURL : 'http://localhost:'+port,
})

const { signup, signupAndLogin,  getRes } = require('./common')(http)

const sinon = require('sinon')


describe('user tests', () => {
  let session
  let clock

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

  var qid,uid,qid2
  test('create question', async () => {

    var phone = 'hello'
    res = await http.post('/auth/signup', {phone: phone , password: 'test'})

    var token = res.data.t
    var payload = await jwt.verify(token)
    http.defaults.headers.common['Authorization'] ='Bearer '+token

    var res
    var question = {
      title: "hello",
      content: "HELLO WORLD"
    }

    try {
      res = await http.post('/q', question)
    } catch (e) {
      res = e.response
    }
    qid2 = res.data.question.id
    var question2 = {
      title: "hello222",
      content: "HELLO WORLD222"
    }

    try {
      res = await http.post('/q/', question2)
    } catch (e) {
      res = e.response
    }
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
    console.log(res.data)
    
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
      res = await http.put('/q/'+qid, {title:'aaa'})
      console.log(res.data)
    } catch (e) {
      console.log(e.response)

      
    }

  })

  test('delete pos', async () => {
    try {
      res = await http.delete('/q/'+qid)
      console.log(res.data)
    } catch (e) {
      console.log(e.response)

      
    }
  })

  test('get users question', async () => {
    try {
      res = await http.get('/u/'+uid)
      console.log(res.data.user.total_questions)
      expect(res.data.user.total_questions).toBe(1)
    } catch (e) {
      console.log(e)
    }

  })
  test('get total ans', async () => {
    try {
      res = await http.get('/a')
      console.log(res.data.count)
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
      
      console.log(res.data)
      expect(res.data.answer.content).toBe('ANS2')
    } catch (e) {
      console.log(e.response)
    }
  })
  var aid,aid2
  test('get qs', async () => {
    try {
      res = await http.get('/q/'+qid2)
      console.log(res.data.answers)
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
      console.log(res.data.answer)
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
      console.log(res.data.comment)
      cid = res.data.comment.id

  })
  test('get cmt', async () => {
    try {
      res = await http.get('/c')
      console.log(res.data)
      expect(res.data.count).toBe(1)
    } catch (e) {
      console.log(e.response)
    }
      
  })
  test('patch cmt', async () => {
    try {
      res = await http.put('/c/'+cid, {content:'CMT PATCH'})
      console.log(res.data.updatedComment)
    } catch (e) {
      console.log(e.response)
    }
  })

  test('delete cmt', async () => {
    try {
      res = await http.delete('/c/'+cid)
      console.log(res.data)
    } catch (e) {
      console.log(e.response)
    }
  })
  test('get cmt', async () => {
    try {
      res = await http.get('/c')
      console.log(res.data)
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
