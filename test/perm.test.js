
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

  var qid, aid, cid, uid, pid
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

      var post = {
        title: "hello",
        content: "HELLO WORLD"
      }
      res = await http.post('/p', post)
      pid = res.data.post.id

      res = await http.get('/pub/posts')
      // expect(res.data.questions.length).toBe(0)

      res = await http.get('/censor/posts')
      expect(res.data.posts.results.length).toBe(1)

      try {
        res = await http.get('/censor/p/'+pid)
        console.log(res.data)
      } catch (e) {
        expect(e.response.data.code).toBe('NO_PERMISSION')
      }

      res = await http.get('/pub/grant', {params:{uid, code:'FZBB'}})
      // console.log(res.data)

      res = await http.post('/censor/p/'+pid, {
        action:'reject',
        reason:'MISLEADING'
      })


      res = await http.get('/pub/posts')
      expect(res.data.posts.results.length).toBe(0)
      res = await http.get('/censor/posts')
      expect(res.data.posts.results.length).toBe(1)

      res = await http.post('/censor/p/'+pid,{
        action:'pass'
      })
      // console.log(res.data)

      res = await http.get('/pub/posts')
      expect(res.data.posts.results.length).toBe(1)

      res = await http.get('/censor/posts')
      expect(res.data.posts.results.length).toBe(1)

    } catch (e) {
      console.log(e)
      
    }


  })

  test('permission search', async () => {
      res = await http.post('/p', { content:'222 111'})
      res = await http.post('/p', { content:' aa a 111'})
      var qid2 = res.data.post.id
      res = await http.post('/p', { content:'社会'})
      var qid3 = res.data.post.id
      var q= 'el'
      res = await http.get('/censor/search?q='+ q)
      expect(res.data.posts.results.length).toBe(1)

      res = await http.get('/censor/search?q=')
      expect(res.data.posts.results.length).toBe(4)

      res = await http.get('/censor/search?q=社会')
      expect(res.data.posts.results.length).toBe(1)

      res = await http.get('/censor/search?q=111')
      expect(res.data.posts.results.length).toBe(2)

  })

  test('permission grant and give', async () => {
    expect.assertions(6)
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

