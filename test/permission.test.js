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
      console.log(res.data)
      expect(res.data.question.verify).toBe(undefined)
      qid = res.data.question.id

      try {
        
      res = await http.get('/q/'+qid+'/verify')
      console.log(res.data)
      } catch (e) {
        expect(e.response.data.code).toBe('NO_PERMISSION')
        
      }

      res = await http.post('/u/.grant', {uid})
      console.log(res.data)

      res = await http.get('/q/'+qid+'/verify')
      console.log(res.data)

      res = await http.post('/a/', {qid, content:'ANS'})
      console.log(res.data)
      aid = res.data.answer.id

      expect(res.data.answer.verify).toBe(undefined)
      res = await http.get('/a/'+aid+'/verify')
      console.log(res.data)


    } catch (e) {
      console.log(e)
      
    }


  })
})

