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

  var cid, cid2, cid3, cid4, cid5, cid6, cid7, cid8, cid9
  test('create comment', async () => {
    //  c
    //      c2
    //      c3 -> c2
    //      c5
    //  c4
    //      c6
    //      c8
    //      c9 -> c6
    //      c10
    //      c11
    //      c12
    //      c13
    //  c7
    //

    try {
      clock = sinon.useFakeTimers(new Date(2000,1,1,10))
      res = await http.post(`/c/`, {pid, content:'comment'})
      cid = res.data.comment.id
      expect(res.data.comment.content).toBe('comment')

      clock = sinon.useFakeTimers(new Date(2000,1,1,11))
      res = await http.post('/c', {pid, content:'comment2', reply_to_id:cid})
      cid2 = res.data.comment.id
      expect(res.data.comment.content).toBe('comment2')

      await signupAndLogin('test3')
      clock = sinon.useFakeTimers(new Date(2000,1,1,13))
      res = await http.post('/c', {pid, content:'comment3', reply_to_id:cid2})
      cid3 = res.data.comment.id
      expect(res.data.comment.content).toBe('comment3')

      await signupAndLogin('test4')
      clock = sinon.useFakeTimers(new Date(2000,1,1,14))
      res = await http.post('/c', {pid, content:'comment4'})
      cid4 = res.data.comment.id
      expect(res.data.comment.content).toBe('comment4')

      clock = sinon.useFakeTimers(new Date(2000,1,1,15))
      res = await http.post('/c', {pid, content:'comment5', reply_to_id:cid})
      cid5 = res.data.comment.id
      expect(res.data.comment.content).toBe('comment5')

      clock = sinon.useFakeTimers(new Date(2000,1,1,16))
      res = await http.post('/c', {pid, content:'comment6', reply_to_id:cid4})
      cid6 = res.data.comment.id
      expect(res.data.comment.content).toBe('comment6')

      clock = sinon.useFakeTimers(new Date(2000,1,1,17))
      res = await http.post('/c', {pid, content:'comment7'})
      cid7 = res.data.comment.id
      expect(res.data.comment.content).toBe('comment7')

      clock = sinon.useFakeTimers(new Date(2000,1,1,18))
      res = await http.post('/c', {pid, content:'comment8', reply_to_id:cid4})
      cid8 = res.data.comment.id
      expect(res.data.comment.content).toBe('comment8')

      clock = sinon.useFakeTimers(new Date(2000,1,1,19))
      res = await http.post('/c', {pid, content:'comment9', reply_to_id:cid6})
      cid9 = res.data.comment.id
      expect(res.data.comment.content).toBe('comment9')

      clock = sinon.useFakeTimers(new Date(2000,1,1,20))
      res = await http.post('/c', {pid, content:'comment10', reply_to_id:cid4})
      expect(res.data.comment.content).toBe('comment10')

      clock = sinon.useFakeTimers(new Date(2000,1,1,21))
      res = await http.post('/c', {pid, content:'comment11', reply_to_id:cid4})
      expect(res.data.comment.content).toBe('comment11')

      clock = sinon.useFakeTimers(new Date(2000,1,1,22))
      res = await http.post('/c', {pid, content:'comment12', reply_to_id:cid4})
      expect(res.data.comment.content).toBe('comment12')

      clock = sinon.useFakeTimers(new Date(2000,1,1,23))
      res = await http.post('/c', {pid, content:'comment13', reply_to_id:cid4})
      expect(res.data.comment.content).toBe('comment13')

    } catch (e) {
      console.log(e.response ? e.response.data : e)
    }
    
  })


  test('get nestsed comments', async () => {
    try {
      res = await http.get(`/p/${pid}`)
      // NOTE: orderby DESC
      //
      //  c7
      //  c4
      //      c13
      //      c12
      //      c11
      //      c10
      //      c9 -> c6
      //      ... c8
      //          c6
      //  c
      //      c5
      //      c3 -> c2
      //      c2


      expect(res.data.comments.total).toBe(3)
      // console.log(res.data.comments.results)
      // console.log(res.data.comments.results[1].child_comments)
      
      expect(res.data.comments.results[0].child_count).toBe(3)
      expect(res.data.comments.results[0].child_comments[1].id).toBe(cid3)
      expect(res.data.comments.results[0].child_comments[1].comment_reply_to.id).toBe(cid2)

      expect(res.data.comments.results[1].child_count).toBe(7)
      expect(res.data.comments.results[1].child_comments.length).toBe(5)

      expect(res.data.comments.results[1].child_comments[4].id).toBe(cid9)
      expect(res.data.comments.results[1].child_comments[4].comment_reply_to.id).toBe(cid6)
      expect(res.data.comments.results[1].child_comments[0].content).toBe('comment13')

      expect(res.data.comments.results[2].child_count).toBe(0)

    } catch (e) {
      console.log(e.response ? e.response.data : e)
    }
  })

})
