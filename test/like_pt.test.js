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
          images:[{url:'111'},{url:'222'}]
        }
      }

      res = await http.post('/p', post)

      pid = res.data.post.id
      expect(res.data.msg).toBe(MSG.POST_SUCCESS)
    } catch (e) {
      console.log(e.response ? e.response.data : e)
      
    }
    
  })

  test('get post likes', async () => {
      
      res = await http.get(`/p/${pid}/like`)
      expect(res.data.is_like_by_me).toBe(false)
  })
  
  test('like post', async () => {
    try {
      
      res = await http.post(`/p/${pid}/like`)
      expect(res.data.total_likes).toBe(1)
      expect(res.data.is_like_by_me).toBe(true)

      await signupAndLogin('test2')
      res = await http.post(`/p/${pid}/like`)
      expect(res.data.total_likes).toBe(2)
      expect(res.data.is_like_by_me).toBe(true)

      await signupAndLogin('test3')
      res = await http.post(`/p/${pid}/like`)
      expect(res.data.total_likes).toBe(3)
      expect(res.data.is_like_by_me).toBe(true)

    } catch (e) {
      console.log(e.response ? e.response.data : e)
      
    }
  })

  test('dislike post', async () => {
    try {
      await login('test')
      
      res = await http.post(`/p/${pid}/dislike`)
      expect(res.data.total_likes).toBe(2)
      expect(res.data.is_like_by_me).toBe(false)

    } catch (e) {
      console.log(e.response ? e.response.data : e)
      
    }
  })

  test('get like from post', async () => {
    try {
      await login('test2')
      res = await http.get(`/p/${pid}`)
      expect(res.data.post.is_like_by_me).toBe(true)

      await login('test')
      res = await http.get(`/p/${pid}`)
      expect(res.data.post.is_like_by_me).toBe(false)

    } catch (e) {
      console.log(e.response ? e.response.data : e)
      
    }
  })


})
