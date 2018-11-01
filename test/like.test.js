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
const port = 3014
const http = axios.create({
  baseURL : 'http://localhost:'+port,
})

const { signup, signupAndLogin,  getRes } = require('./common')(http)

const sinon = require('sinon')

async function SignupAndLogin(idx){
  var wx_id= 'wx_20000' + idx
  var res = await http.post('/auth/wx_code_fake', {wx_id})
  http.defaults.headers.common['Authorization'] ='Bearer '+ res.data.t
}

async function BindUser(idx){
  var nickName = 'wx' + idx
  var res = await http.post('/wx_sign/bind', {userInfo:{avatarUrl:'http://xxxxxx',nickName}})
}



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
  var pid, aid, cid
  test('create user1', async () => {
      await SignupAndLogin(1)
      await BindUser(1)

      res = await http.get('/user/.ping')
      console.log(res.data)

      await SignupAndLogin(2)
      await BindUser(2)

      res = await http.get('/user/.ping')
      console.log(res.data)
        
      var question = {
        title: "hello",
        content: "HELLO WORLD"
      }
      res = await http.post('/question', question)
      pid = res.data.question.id


      await SignupAndLogin(3)
      res = await http.post('/question/'+pid+'/a', {content:'ANS'})
      aid = res.data.answer.id

      await SignupAndLogin(1)
      res = await http.post('/question/'+pid+'/a/'+aid+'/like')
      expect(res.data.answer.total_zhichi).toBe(1)

      await SignupAndLogin(3)
      res = await http.post('/question/'+pid+'/a/'+aid+'/like')
      expect(res.data.answer.total_zhichi).toBe(2)

      await SignupAndLogin(2)
      res = await http.post('/question/'+pid+'/a/'+aid+'/dislike')
      expect(res.data.answer.total_zhichi).toBe(2)
      expect(res.data.answer.total_fandui).toBe(1)
    
      console.log(res.data)

      try {
        
        await SignupAndLogin(4)
        res = await http.post('/question/'+pid+'/a/'+aid+'/c', {content:'hello comment'})
        console.log(res.data)
        cid = res.data.comment.id

      } catch (e) {
        console.log(e)
        
      }

      await SignupAndLogin(4)
      res = await http.post('/question/'+pid+'/a/'+aid+'/c', {content:'hello comment2',reply_id:cid})
      await SignupAndLogin(2)
      res = await http.post('/question/'+pid+'/a/'+aid+'/c', {content:'hello comment3',reply_id:cid})
      console.log(res.data)

      res = await http.get('/question/'+pid+'/a/'+aid+'/c/'+cid)
      console.log(res.data)
      expect(res.data.comment.comments.length).toBe(2)


      await SignupAndLogin(1)
      res = await http.post('/question/'+pid+'/a/'+aid+'/c/'+cid +'/like')
      expect(res.data.comment.total_likes).toBe(1)

      await SignupAndLogin(2)
      res = await http.post('/question/'+pid+'/a/'+aid+'/c/'+cid +'/like')
      expect(res.data.comment.total_likes).toBe(2)

      await SignupAndLogin(3)
      res = await http.post('/question/'+pid+'/a/'+aid+'/c/'+cid +'/like')
      expect(res.data.comment.total_likes).toBe(3)
      await SignupAndLogin(2)
    try {
      res = await http.post('/question/'+pid+'/a/'+aid+'/c/'+cid +'/dislike')
      expect(res.data.comment.total_likes).toBe(2)
      await SignupAndLogin(4)
      
      res = await http.post('/question/'+pid+'/a/'+aid+'/c/'+cid +'/dislike')
      expect(res.data.comment.total_likes).toBe(2)
    } catch (e) {
      console.log(e)
    }

  })
  
})

