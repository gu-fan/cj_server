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
  var res = await http.post('/wx/bind', {userInfo:{avatarUrl:'http://xxxxxx',nickName}})
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
  var qid, aid, cid
  test('create user1', async () => {
      await SignupAndLogin(1)
      await BindUser(1)

      res = await http.get('/u/.ping')
      console.log(res.data)

      await SignupAndLogin(2)
      await BindUser(2)

      res = await http.get('/u/.ping')
      console.log(res.data)
        
      var question = {
        title: "hello",
        content: "HELLO WORLD"
      }
      res = await http.post('/q', question)
      qid = res.data.question.id

      await SignupAndLogin(2)
      res = await http.post('/a', {qid, content:'ANS'})

      await SignupAndLogin(3)
      res = await http.post('/a', {qid, content:'ANS2'})
      aid = res.data.answer.id
      expect(res.data.answer.question.total_answers).toBe(2)

      // LIKE ANSWER
      await SignupAndLogin(1)
      res = await http.post('/a/'+aid+'/like')
      expect(res.data.total_zhichi).toBe(1)

      await SignupAndLogin(3)
      res = await http.post('/a/'+aid+'/like')
      expect(res.data.total_zhichi).toBe(2)

      await SignupAndLogin(2)
      res = await http.post('/a/'+aid+'/dislike')
      expect(res.data.total_zhichi).toBe(2)
      expect(res.data.total_fandui).toBe(1)
    
      console.log(res.data)

      // COMMENT
      try {
        
        await SignupAndLogin(4)
        res = await http.post('/c', {aid, content:'hello comment'})
        console.log(res.data)
        cid = res.data.comment.id

      } catch (e) {
        console.log(e)
      }

      var cid2
      await SignupAndLogin(4)
      res = await http.post('/c', {aid, content:'hello comment2', reply_id:cid})
      cid2 = res.data.comment.id
      await SignupAndLogin(2)
      res = await http.post('/c', {aid, content:'hello comment3', reply_id:cid})
      console.log(res.data)

      res = await http.get('/c/'+cid)
      console.log(res.data)
      expect(res.data.comment.comments.length).toBe(2)
      expect(res.data.comment.answer.total_comments).toBe(3)
      expect(res.data.comment.answer.question.total_answers).toBe(2)
      try {
      
        res = await http.get('/a/'+aid)
        console.log("ANSWER")
        console.log(res.data)
        expect(res.data.answer.total_comments).toBe(3)
      } catch (e) {
        console.log(e.response)
        
      }


      await SignupAndLogin(1)
      res = await http.post('/c/'+cid +'/like')
      expect(res.data.total_likes).toBe(1)

      await SignupAndLogin(2)
      res = await http.post('/c/'+cid +'/like')
      expect(res.data.total_likes).toBe(2)

      res = await http.post('/c/'+cid2 +'/like')
      expect(res.data.total_likes).toBe(1)

      res = await http.get('/a/'+aid)
      // liked by me
      console.log("comments like")
      console.log(res.data.answer.comments)
      for (var i = 0; i < res.data.answer.comments.length; ++i) {
        console.log(res.data.answer.comments[i].liked_users)
      }
      // expect(res.data.answer.comments[0].liked_users.length).toBe(1)
      // expect(res.data.answer.comments[1].liked_users.length).toBe(0)
      expect(res.data.answer.comments[0].is_like).toBe(true)
      expect(res.data.answer.comments[1].is_like).toBe(true)
      expect(res.data.answer.comments[2].is_like).toBe(false)

      await SignupAndLogin(3)
      // not liked by me
      res = await http.get('/a/'+aid)
      console.log("comments not like")
      // console.log(res.data.answer.comments)
      for (var i = 0; i < res.data.answer.comments.length; ++i) {
        // console.log(res.data.answer.comments[i].liked_users)
      }
      // expect(res.data.answer.comments[0].liked_users.length).toBe(0)
      // expect(res.data.answer.comments[1].liked_users.length).toBe(0)
      expect(res.data.answer.comments[0].is_like).toBe(false)
      expect(res.data.answer.comments[1].is_like).toBe(false)

      await SignupAndLogin(3)
      res = await http.post('/c/'+cid +'/like')
      expect(res.data.total_likes).toBe(3)
      expect(res.data.is_like).toBe(true)
      await SignupAndLogin(2)
      try {
        res = await http.post('/c/'+cid +'/dislike')
        expect(res.data.total_likes).toBe(2)
        expect(res.data.is_like).toBe(false)
        await SignupAndLogin(4)
        
        res = await http.post('/c/'+cid +'/dislike')
        expect(res.data.total_likes).toBe(2)
      } catch (e) {
        console.log(e)
      }

  })
  
})

