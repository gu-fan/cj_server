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

    clock = sinon.useFakeTimers(new Date(2000,1,1,8));

  })

  afterAll(()=>{
    this.server.close()
    clock.restore()
    http = null 
    
  })
  var qid, aid, cid, uid, aid3
  test('like test all', async () => {
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

      res = await http.get('/u/.ping')
      console.log(res.data)
      uid = res.data.user.id
      res = await http.post('/u/.grant', {uid})
      console.log(res.data)
      res = await http.post('/censor/q/'+qid,{
        action:'pass'
      })

      try {
        
        await SignupAndLogin(2)
        res = await http.post('/a', {qid, content:'ANS'})
        aid3 = res.data.answer.id
      } catch (e) {
        console.log( e)
      }
     
      try {
        await SignupAndLogin(1)
        res = await http.post('/censor/a/'+aid3,{
          action:'pass'
        })
      } catch (e) {
        expect(e.response.data.code).toBe('NO_PERMISSION')
      }

      try {
        
        res = await http.get('/censor/a/'+aid3)
        console.log(res.data)
      } catch (e) {
          expect(e.response.data.code).toBe('NO_PERMISSION')
      }

      await SignupAndLogin(2)
      res = await http.post('/censor/a/'+aid3,{
        action:'pass'
      })
      expect(res.data.answer.censor_status).toBe('pass')
        
      await SignupAndLogin(3)
      res = await http.post('/a', {qid, content:'ANS2'})
      aid = res.data.answer.id
      expect(res.data.answer.question.total_answers).toBe(2)

      try {
        
        await SignupAndLogin(4)
        res = await http.post('/c', {aid, content:'hello comment'})

      } catch (e) {
          expect(e.response.data.code).toBe('CENSOR_NOT_PASS')

      }
    

      await SignupAndLogin(2)
      res = await http.post('/censor/a/'+aid,{
        action:'pass'
      })
      expect(res.data.answer.censor_status).toBe('pass')




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


      // author zhichi count
      await SignupAndLogin(3)
      res = await http.get('/u/.ping')
      console.log(res.data)
      expect(res.data.user.total_answer_zhichi).toBe(2)
      expect(res.data.user.total_answer_fandui).toBe(1)
    
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
      console.log(res.data.comments)
      for (var i = 0; i < res.data.comments.results.length; ++i) {
        // console.log(res.data.answer.comments[i].liked_users)
      }
      // expect(res.data.answer.comments[0].liked_users.length).toBe(1)
      // expect(res.data.answer.comments[1].liked_users.length).toBe(0)
      expect(res.data.comments.results[0].is_like).toBe(true)
      expect(res.data.comments.results[1].is_like).toBe(true)
      expect(res.data.comments.results[2].is_like).toBe(false)

      await SignupAndLogin(3)
      // not liked by me
      res = await http.get('/a/'+aid)
      console.log("comments not like")
      // console.log(res.data.answer.comments)
      for (var i = 0; i < res.data.comments.results.length; ++i) {
        // console.log(res.data.answer.comments[i].liked_users)
      }
      // expect(res.data.answer.comments[0].liked_users.length).toBe(0)
      // expect(res.data.answer.comments[1].liked_users.length).toBe(0)
      expect(res.data.comments.results[0].is_like).toBe(false)
      expect(res.data.comments.results[1].is_like).toBe(false)

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
  
  test('send points ', async () => {
    try {
      
      await SignupAndLogin(1)
      res = await http.get('/u/.ping')
      var u1 = res.data.user.id
        
      await SignupAndLogin(2)
      res = await http.get('/u/.ping')
      var u2 = res.data.user.id
      res = await http.post('/u/'+u1+'/thank',{aid, count:10})
      console.log(res.data)
      res = await http.get('/a/'+aid)
      expect(res.data.answer.total_thanks).toBe(1)
      

      res = await http.get('/u/'+u1)
      console.log(res.data.user.total_points)
      expect(res.data.user.total_points).toBe(30)
      expect(res.data.user.total_answer_thanks).toBe(1)

      res = await http.get('/u/'+u2)
      console.log(res.data.user.total_points)
      console.log(res.data)
      expect(res.data.user.total_points).toBe(10)

      res = await http.get('/u/checkpoint')
      console.log(res.data)
      expect(res.data.user.total_points).toBe(11)

      res = await http.get('/u/checkpoint')
      expect(res.data.user.total_points).toBe(11)

      clock = sinon.useFakeTimers(new Date(2000,1,1,10))
      res = await http.get('/u/checkpoint')
      console.log(res.data.user)
      expect(res.data.user.total_points).toBe(11)

      // NOTE: seems utc issue made it's not the right time
      clock = sinon.useFakeTimers(new Date(2000,1,2, 8))

      res = await http.get('/u/checkpoint')
      console.log(res.data.user)
      expect(res.data.user.total_points).toBe(12)
      clock = sinon.useFakeTimers(new Date(2000,1,2, 18))

      res = await http.get('/u/checkpoint')
      expect(res.data.user.total_points).toBe(12)

      clock = sinon.useFakeTimers(new Date(2000,1,10, 8))
      await SignupAndLogin(2)
      res = await http.get('/u/checkpoint')
      console.log(res.data.user)
      expect(res.data.user.total_points).toBe(13)



    } catch (e) {
      console.log(e)
      
    }

  })
})

