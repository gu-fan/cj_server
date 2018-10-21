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

  var pid,uid
  test('create post', async () => {

    var phone = 'hello'
    res = await http.post('/auth/signup', {phone: phone , password: 'test'})

    var token = res.data.t
    var payload = await jwt.verify(token)
    http.defaults.headers.common['Authorization'] ='Bearer '+token

    var res
    var post = {
      title: "hello",
      content: "HELLO WORLD"
    }

    // try {
    //   res = await http.post('/post/new', {title:'Miss Content'})
    // } catch (e) {
    //   res = e.response
    // }

    // expect(res.data.err).toBe('no_content')

    // try {
    //   res = await http.post('/post/new', {content:'Miss Title'})
    // } catch (e) {
    //   res = e.response
    // }
    // expect(res.data.err).toBe('no_title')
    try {
      res = await http.post('/post', post)
    } catch (e) {
      res = e.response
    }
    var post2 = {
      title: "hello222",
      content: "HELLO WORLD222"
    }

    try {
      res = await http.post('/post/', post2)
    } catch (e) {
      res = e.response
    }
    pid = res.data.post.id
    uid = res.data.post.author_id
    expect(res.data.code).toBe(0)
  })

  test('get post', async () => {
    try {
      res = await http.get('/post/'+pid)
      expect(res.data.post.title).toBe('hello222')
      
    } catch (e) {
      console.log(e)
      
    }

  })
  test('get users post', async () => {
    try {
      res = await http.get('/user/'+uid)
      expect(res.data.user.posts[0].title).toBe('hello')
      expect(res.data.user.posts[1].title).toBe('hello222')
    } catch (e) {
      console.log(e)
      
    }

  })
  test('update pos', async () => {
    try {
      res = await http.put('/post/'+pid, {title:'aaa'})
      console.log(res.data)
    } catch (e) {
      console.log(e)
      
    }

  })
  test('delete pos', async () => {
    try {
      res = await http.delete('/post/'+pid)
      console.log(res.data)
    } catch (e) {
      console.log(e)
      
    }

  })
  test('get users post', async () => {
    try {
      res = await http.get('/user/'+uid)
      console.log(res.data.user.posts)
      expect(res.data.user.posts.length).toBe(1)
    } catch (e) {
      console.log(e)
      
    }

  })

})
