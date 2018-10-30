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

  var pid,uid,pid2
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

    // try {
    //   res = await http.post('/question/new', {title:'Miss Content'})
    // } catch (e) {
    //   res = e.response
    // }

    // expect(res.data.err).toBe('no_content')

    // try {
    //   res = await http.post('/question/new', {content:'Miss Title'})
    // } catch (e) {
    //   res = e.response
    // }
    // expect(res.data.err).toBe('no_title')
    try {
      res = await http.post('/question', question)
    } catch (e) {
      res = e.response
    }
    pid2 = res.data.question.id
    var question2 = {
      title: "hello222",
      content: "HELLO WORLD222"
    }

    try {
      res = await http.post('/question/', question2)
    } catch (e) {
      res = e.response
    }
    pid = res.data.question.id
    uid = res.data.question.author_id
    expect(res.data.code).toBe(0)


    res = await http.get('/question')
    console.log(res.data)
    
  })

  test('get question', async () => {
    try {
      res = await http.get('/question/'+pid)
      expect(res.data.question.title).toBe('hello222')
      
    } catch (e) {
      console.log(e.response)

      
    }

  })
  test('get users question', async () => {
    try {
      res = await http.get('/user/'+uid)
      expect(res.data.user.questions[0].title).toBe('hello')
      expect(res.data.user.questions[1].title).toBe('hello222')
    } catch (e) {
      console.log(e.response)

      
    }

  })
  test('update pos', async () => {
    try {
      res = await http.put('/question/'+pid, {title:'aaa'})
      console.log(res.data)
    } catch (e) {
      console.log(e.response)

      
    }

  })

  test('delete pos', async () => {
    try {
      res = await http.delete('/question/'+pid)
      console.log(res.data)
    } catch (e) {
      console.log(e.response)


      
    }
  })

  test('get users question', async () => {
    try {
      res = await http.get('/user/'+uid)
      console.log(res.data.user.questions)
      expect(res.data.user.questions.length).toBe(1)
    } catch (e) {
      console.log(e.response)
    }

  })
  test('get question ans', async () => {
    try {
      res = await http.get('/question/'+pid2+'/a')
      console.log(res.data.answers)
      expect(res.data.answers.length).toBe(0)
    } catch (e) {
      console.log(e.response)
    }

  })

  test('create ans', async () => {
    try {
      res = await http.post('/question/'+pid2+'/a', {content:'ANS'})
      res = await http.post('/question/'+pid2+'/a', {content:'ANS2'})
      console.log(res.data)
      expect(res.data.newAnswer.content).toBe('ANS2')
    } catch (e) {
      console.log(e.response)
    }
  })
  var aid,aid2
  test('get ans', async () => {
    try {
      res = await http.get('/question/'+pid2+'/a')
      console.log(res.data.answers)
      expect(res.data.answers.length).toBe(2)
      aid = res.data.answers[0].id
      aid2 = res.data.answers[1].id
      
    } catch (e) {
      console.log(e.response)

    }
  })
  test('patch ans', async () => {
    try {
      res = await http.put('/question/'+pid2+'/a/' + aid, {content:'ANS PATCH'})
      console.log(res.data.updatedAnswer)
    } catch (e) {
      console.log(e.response)
    }
  })

  test('delete ans', async () => {
    try {
      res = await http.delete('/question/'+pid2+'/a/' + aid2)
      console.log(res.data.numberOfDeletedRows)
    } catch (e) {
      console.log(e.response)
    }
  })

  test('get question ans', async () => {
      res = await http.get('/question/'+pid2+'/a')
      console.log(res.data.answers)
      expect(res.data.answers.length).toBe(1)

  })

  test('create comment', async () => {
      res = await http.post('/question/'+pid2+'/a/'+aid+'/c', {content:'hello comment'})
      console.log(res.data.newComment)

  })
  var cid
  test('get cmt', async () => {
    try {
      res = await http.get('/question/'+pid2+'/a/'+aid+'/c')
      console.log(res.data)
      expect(res.data.comments.length).toBe(1)
      cid = res.data.comments[0].id
    } catch (e) {
      console.log(e.response)
    }
      
  })
  test('patch cmt', async () => {
    try {
      res = await http.put('/question/'+pid2+'/a/' + aid+'/c/'+cid, {content:'CMT PATCH'})
      console.log(res.data.updatedComment)
    } catch (e) {
      console.log(e.response)
    }
  })

  test('delete cmt', async () => {
    try {
      res = await http.delete('/question/'+pid2+'/a/' + aid2+'/c/'+cid)
      console.log(res.data.numberOfDeletedRows)
    } catch (e) {
      console.log(e.response)
    }
  })
  test('get cmt', async () => {
    try {
      res = await http.get('/question/'+pid2+'/a/'+aid+'/c')
      console.log(res.data)
      expect(res.data.comments.length).toBe(0)
    } catch (e) {
      console.log(e.response)
    }
      
  })



})
