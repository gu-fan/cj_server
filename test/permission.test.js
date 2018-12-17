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
  var qid, aid, cid, uid
  test('permission test all', async () => {
    try {
      
      await SignupAndLogin(1)
      await BindUser(1)

      res = await http.get('/u/.ping')
      console.log(res.data)

      await SignupAndLogin(2)
      await BindUser(2)

      res = await http.get('/u/.ping')
      console.log(res.data)
      uid = res.data.user.id

      var question = {
        title: "hello",
        content: "HELLO WORLD"
      }
      res = await http.post('/q', question)
      qid = res.data.question.id

      res = await http.get('/pub/questions')
      // expect(res.data.questions.length).toBe(0)

      res = await http.get('/censor/questions')
      expect(res.data.questions.results.length).toBe(1)

      try {
        res = await http.get('/censor/q/'+qid)
        console.log(res.data)
      } catch (e) {
        expect(e.response.data.code).toBe('NO_PERMISSION')
      }

      res = await http.get('/pub/grant', {params:{uid, code:'FZBB'}})
      console.log(res.data)

      res = await http.post('/censor/q/'+qid, {
        action:'reject',
        reason:'MISLEADING'
      })
      console.log(res.data)

      res = await http.put('/q/'+qid, {title:'hello', content:'LLLLLOLLLL'})
      console.log(res.data)

      try {
      
        res = await http.post('/a', {qid, content:'ANS'})
        console.log(res.data)
        // expect(res.data.code).toBe('TARGET_LOCKED')
      } catch (e) {
        expect(e.response.data.code).toBe('CENSOR_NOT_PASS')
      
      }

      res = await http.post('/censor/q/'+qid,{
        action:'pass'
      })
      console.log(res.data)

      res = await http.get('/pub/questions')
      expect(res.data.questions.results.length).toBe(1)

      res = await http.get('/censor/questions')
      expect(res.data.questions.results.length).toBe(1)

      console.log("SHOULD PASS")
      res = await http.post('/a', {qid, content:'ANS'})
      console.log(res.data)

      res = await http.get('/q/'+qid+'/tracks')
      console.log(res.data)

      // try {
      
      //   res = await http.post('/a', {qid, content:'ANS'})
      //   // console.log(res.data)
      //   // expect(res.data.code).toBe('TARGET_LOCKED')
      // } catch (e) {
      //   expect(e.response.data.code).toBe('TARGET_LOCKED')
      
      // }


    } catch (e) {
      console.log(e)
      
    }


  })

  test('permission search', async () => {
      res = await http.post('/q', {title:'111', content:'222'})
      var qid2 = res.data.question.id
      res = await http.post('/q', {title:'社会的发展111', content:'222'})
      var qid3 = res.data.question.id
      var q= 'el'
      res = await http.get('/censor/search?q='+ q)
      expect(res.data.questions.results.length).toBe(1)

      res = await http.get('/censor/search?q=')
      expect(res.data.questions.results.length).toBe(3)

      res = await http.get('/censor/search?q=社会')
      expect(res.data.questions.results.length).toBe(1)

      res = await http.get('/censor/search?q=111')
      expect(res.data.questions.results.length).toBe(2)

  })

  var aid
  test('permission answer', async () => {
    try {
      
      res = await http.post('/a', {qid, content:'ANS'})
      console.log(res.data)

      aid = res.data.answer.id

      try {
        res = await http.post('/c', {aid, content:'hello comment'})
      } catch (e) {
        expect(e.response.data.code).toBe('CENSOR_NOT_PASS')
      }

    
      res = await http.post('/censor/a/'+aid, {
        action:'reject',
        reason:'MISLEADING'
      })
      expect(res.data.answer.censor_status).toBe('reject')

      res = await http.post('/c', {aid, content:'hello comment'})
      expect(res.data.code).toBe(0)

      res = await http.post('/censor/a/'+aid,{
        action:'pass'
      })
      expect(res.data.answer.censor_status).toBe('pass')

      res = await http.post('/c', {aid, content:'hello comment'})
      expect(res.data.comment.answer.content).toBe('ANS')

    } catch (e) {
      console.log(e.response && e.response.data || e)
    }

  })
  test('permission grant and give', async () => {
    try {
      
      await SignupAndLogin(3)
      res = await http.get('/u/.ping')
      expect(res.data.user.is_staff).toBe(false)
      var uid3 = res.data.user.id
      await SignupAndLogin(5)
      res = await http.get('/u/.ping')
      var uid5 = res.data.user.id
      expect(res.data.user.is_admin).toBe(false)

      try {
        res = await http.post('/u/.grant', {uid:uid3})
      } catch (e) {
        expect(e.response.data.code).toBe('NO_PERMISSION')
      }
      
      res = await http.get('/pub/grant', {params:{uid:uid5, code:'FZBB'}})
      res = await http.get('/u/.ping')
      expect(res.data.user.is_admin).toBe(true)

      try {
        
      res = await http.post('/u/.grant', {uid:uid5})
      } catch (e) {
        expect(e.response.data.code).toBe('ALREADY_GOT_PERM')
        
      }

      res = await http.post('/u/.grant', {uid:uid3})
      await SignupAndLogin(3)

      res = await http.get('/u/.ping')
      expect(res.data.user.is_staff).toBe(true)
      
    } catch (e) {
      console.log(e)
      
    }
  })
})

