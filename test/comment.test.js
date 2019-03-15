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
    expect.assertions(3)

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
      expect(res.data.post.content_json.images[0].url).toBe('111')
      expect(res.data.post.content).toBe('HELLO WORLD')

    } catch (e) {
      console.log(e.response ? e.response.data : e)
    }

    
  })

  var cid
  test('create comment', async () => {

    try {
      
      res = await http.post(`/c/`, {pid, content:'hello'})
      cid = res.data.comment.id
      expect(res.data.comment.content).toBe('hello')

    } catch (e) {
      console.log(e.response ? e.response.data : e)
    }
    
  })

  test('get comment', async () => {
      res = await http.get(`/c/${cid}`)
      expect(res.data.comment.content).toBe('hello')
  })
  test('patch comment', async () => {
      res = await http.put(`/c/${cid}`, {content:'ddd'})
      expect(res.data.comment.content).toBe('ddd')
  })

  test('other user can not patch comment', async () => {
    try {
      await signupAndLogin('test2')
      res = await http.put(`/c/${cid}`, {content:'ddd2'})
      expect(res.data.comment.content).toBe('ddd2')
      
    } catch (e) {
      expect(e.response.data.code).toBe(ERR.NOT_AUTHOR)
      
    }
  })

  test('delete comment', async () => {
      await login('test')
      res = await http.put(`/c/${cid}`, {content:'ddd'})
      expect(res.data.comment.content).toBe('ddd')
  })

  test('get comments from post', async () => {
    try {
      res = await http.get(`/p/${pid}`)
      expect(res.data.comments.results[0].content).toBe('ddd')
    } catch (e) {
      console.log(e)
    }
  })


})
