const assert = require('assert')
const sinon = require('sinon')

const ERR = require('../src/code').ERR_CODE

const _TEST_ = require('path').basename(__filename);
const { http, setupServer, closeServer } = require('./setup/server')(_TEST_)

const { signupAndLoginWX, bindUserWX } = require('./common')(http)

describe('user tests', () => {
  let clock
  let res

  beforeAll(async ()=>{
    await setupServer()
  })

  afterAll(async ()=>{
    await closeServer()
  })

  var qid, aid, cid, uid
  test('permission test all', async () => {
    try {
      
      await signupAndLoginWX(1)
      await bindUserWX(1)

      res = await http.get('/u/.ping')

      await signupAndLoginWX(2)
      await bindUserWX(2)

      res = await http.get('/u/.ping')
      // console.log(res.data)
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
      // console.log(res.data)

      res = await http.post('/censor/q/'+qid, {
        action:'reject',
        reason:'MISLEADING'
      })
      // console.log(res.data)

      res = await http.put('/q/'+qid, {title:'hello', content:'LLLLLOLLLL'})
      // console.log(res.data)

      // try {
      
        res = await http.post('/a', {qid, content:'ANS'})
        // expect(res.data.code).toBe('TARGET_LOCKED')
      // } catch (e) {
      //   expect(e.response.data.code).toBe('CENSOR_NOT_PASS')
      
      // }

      res = await http.post('/censor/q/'+qid,{
        action:'pass'
      })
      // console.log(res.data)

      res = await http.get('/pub/questions')
      expect(res.data.questions.results.length).toBe(1)

      res = await http.get('/censor/questions')
      expect(res.data.questions.results.length).toBe(1)

      res = await http.post('/a', {qid, content:'ANS'})
      // console.log(res.data)

      res = await http.get('/q/'+qid+'/tracks')
      // console.log(res.data)

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
      
      await signupAndLoginWX(3)
      res = await http.get('/u/.ping')
      expect(res.data.user.is_staff).toBe(false)
      var uid3 = res.data.user.id
      await signupAndLoginWX(5)
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
      await signupAndLoginWX(3)

      res = await http.get('/u/.ping')
      expect(res.data.user.is_staff).toBe(true)
      
    } catch (e) {
      console.log(e)
      
    }
  })
})

