const assert = require('assert')
const sinon = require('sinon')

const ERR = require('../src/code').ERR_CODE
const MSG = require('../src/code').MSG_CODE

const _TEST_ = require('path').basename(__filename);
const { http, setupServer, closeServer } = require('./setup/server')(_TEST_)
const { signup, login, signupAndLogin } = require('./common')(http)

describe('user tests', () => {
  let clock
  let res

  beforeAll(async ()=>{
    await setupServer()
  })

  afterAll(async ()=>{
    await closeServer()
  })

  var pid
  test('create post', async () => {
    try {
      
      await signupAndLogin('test')
        
      var post = {
        content: "HELLO WORLD",
        content_json: {
          v:0,
          images:[{url:'111'}, {url:'222'}]
        }
      }

      res = await http.post('/p', post)

      pid = res.data.post.id
      expect(res.data.msg).toBe(MSG.POST_SUCCESS)
    } catch (e) {
      console.log(e.response ? e.response.data : e)
    }
    
  })

  var cid, cid2, cid3
  test('create comment', async () => {

    try {
      clock = sinon.useFakeTimers(new Date(2000,1,1,10))
      res = await http.post(`/c/`, {pid, content:'hello'})
      cid = res.data.comment.id
      expect(res.data.comment.content).toBe('hello')

      clock = sinon.useFakeTimers(new Date(2000,1,1,11))
      res = await http.post('/c', {pid, content:'comment2'})
      cid2 = res.data.comment.id
      expect(res.data.comment.content).toBe('comment2')


      await signupAndLogin('test3')
      clock = sinon.useFakeTimers(new Date(2000,1,1,13))
      res = await http.post('/c', {pid, content:'comment3'})
      cid3 = res.data.comment.id
      expect(res.data.comment.content).toBe('comment3')

    } catch (e) {
      console.log(e.response ? e.response.data : e)
    }
    
  })

  test('get post comments', async () => {
      res = await http.get(`/p/${pid}`)
      expect(res.data.comments.total).toBe(3)
  })

  test('like comment', async () => {
    try {
      // c1: 1 1 0
      // c2: 0 1 0
      // c3: 1 1 1
      await login('test')
      res = await http.post(`/c/${cid}/like`)
      expect(res.data.total_likes).toBe(1)
      expect(res.data.is_like_by_me).toBe(true)

      await signupAndLogin('test2')
      res = await http.post(`/c/${cid}/like`)
      expect(res.data.total_likes).toBe(2)
      expect(res.data.is_like_by_me).toBe(true)

      await login('test2')
      res = await http.post(`/c/${cid2}/like`)
      expect(res.data.total_likes).toBe(1)
      expect(res.data.is_like_by_me).toBe(true)

      await login('test')
      res = await http.post(`/c/${cid3}/like`)
      expect(res.data.total_likes).toBe(1)
      expect(res.data.is_like_by_me).toBe(true)

      await login('test2')
      res = await http.post(`/c/${cid3}/like`)
      expect(res.data.total_likes).toBe(2)
      expect(res.data.is_like_by_me).toBe(true)

      await login('test3')
      res = await http.post(`/c/${cid3}/like`)
      expect(res.data.total_likes).toBe(3)
      expect(res.data.is_like_by_me).toBe(true)

    } catch (e) {
      console.log(e.response ? e.response.data : e)
    }
  })

  test('get comment like', async () => {
    try {
      await login('test')
      res = await http.get(`/c/${cid}/like`)
      expect(res.data.total_likes).toBe(2)
      expect(res.data.is_like_by_me).toBe(true)

    } catch (e) {
      console.log(e.response ? e.response.data : e)
    }

  })

  test('dislike comment', async () => {
    try {
      // c1: 0 1 0
      // c2: 0 1 0
      // c3: 1 0 1
      await login('test')
      res = await http.post(`/c/${cid}/dislike`)
      expect(res.data.total_likes).toBe(1)
      expect(res.data.is_like_by_me).toBe(false)

      await login('test2')
      res = await http.post(`/c/${cid3}/dislike`)
      expect(res.data.total_likes).toBe(2)
      expect(res.data.is_like_by_me).toBe(false)

    } catch (e) {
      console.log(e.response ? e.response.data : e)
    }
  })

  test('get like from post', async () => {
    try {
      // c1: 0 1 0
      // c2: 0 1 0
      // c3: 1 0 1
      // NOTE: DESC
      await login('test')
      res = await http.get(`/p/${pid}`)
      expect(res.data.comments.results[2].is_like_by_me).toBe(false)
      expect(res.data.comments.results[1].is_like_by_me).toBe(false)
      expect(res.data.comments.results[0].is_like_by_me).toBe(true)

      await login('test2')
      res = await http.get(`/p/${pid}`)
      expect(res.data.comments.results[2].is_like_by_me).toBe(true)
      expect(res.data.comments.results[1].is_like_by_me).toBe(true)
      expect(res.data.comments.results[0].is_like_by_me).toBe(false)

      await login('test3')
      res = await http.get(`/p/${pid}`)
      expect(res.data.comments.results[2].is_like_by_me).toBe(false)
      expect(res.data.comments.results[1].is_like_by_me).toBe(false)
      expect(res.data.comments.results[0].is_like_by_me).toBe(true)

    } catch (e) {
      console.log(e.response ? e.response.data : e)
    }
  })


})
