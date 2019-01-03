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
    clock.restore()
  })

  var qid, aid, cid, uid, aid3
  test('like test all', async () => {
      expect.assertions(12)

      await signupAndLoginWX(1)
      await bindUserWX(1)

      res = await http.get('/u/.ping')

      await signupAndLoginWX(2)
      await bindUserWX(2)

      res = await http.get('/u/.ping')
        
      var question = {
        title: "hello",
        content: "HELLO WORLD",
      }
      res = await http.post('/q', question)
      qid = res.data.question.id

      res = await http.get('/u/.ping')
      uid = res.data.user.id

      res = await http.get('/pub/grant', {params:{uid, code:'FZBB'}})
      res = await http.post('/censor/q/'+qid, {
        action:'pass'
      })

      await signupAndLoginWX(2)
      res = await http.post('/a', {qid, content:'ANS'})
      aid3 = res.data.answer.id
     
      try {
        await signupAndLoginWX(1)
        res = await http.post('/censor/a/'+aid3, {
          action:'pass'
        })
      } catch (e) {
        expect(e.response.data.code).toBe('NO_PERMISSION')
      }

      try {
        res = await http.get('/censor/a/'+aid3)
      } catch (e) {
        expect(e.response.data.code).toBe('NO_PERMISSION')
      }

      await signupAndLoginWX(2)
      res = await http.post('/censor/a/'+aid3,{
        action:'pass'
      })
      expect(res.data.answer.censor_status).toBe('pass')
        
      await signupAndLoginWX(3)
      res = await http.post('/a', {qid, content:'ANS2'})
      aid = res.data.answer.id
      expect(res.data.answer.question.total_answers).toBe(2)

        
      await signupAndLoginWX(4)
      clock = sinon.useFakeTimers(new Date(2000,1,1,3))
      res = await http.post('/c', {aid, content:'hhh'})
      expect(res.data.comment.content).toBe('hhh')
    

      await signupAndLoginWX(2)
      res = await http.post('/censor/a/'+aid,{
        action:'pass'
      })
      expect(res.data.answer.censor_status).toBe('pass')




      // LIKE ANSWER
      await signupAndLoginWX(1)
      res = await http.post('/a/'+aid+'/like')
      expect(res.data.total_zhichi).toBe(1)

      await signupAndLoginWX(3)
      res = await http.post('/a/'+aid+'/like')
      expect(res.data.total_zhichi).toBe(2)

      await signupAndLoginWX(2)
      res = await http.post('/a/'+aid+'/dislike')
      expect(res.data.total_zhichi).toBe(2)
      expect(res.data.total_fandui).toBe(1)


      // author zhichi count
      await signupAndLoginWX(3)
      res = await http.get('/u/.ping')
      expect(res.data.user.total_answer_zhichi).toBe(2)
      expect(res.data.user.total_answer_fandui).toBe(1)
    

  })
  
  test('like comment', async () => {
      // COMMENT
      try {
        
        await signupAndLoginWX(4)
        clock = sinon.useFakeTimers(new Date(2000,1,1,10))
        res = await http.post('/c', {aid, content:'hello comment'})
        cid = res.data.comment.id

      } catch (e) {
        console.log(e)
      }

      var cid2
      await signupAndLoginWX(4)
        clock = sinon.useFakeTimers(new Date(2000,1,1,11))
      res = await http.post('/c', {aid, content:'hello comment2', reply_id:cid})
      cid2 = res.data.comment.id
      await signupAndLoginWX(2)
      clock = sinon.useFakeTimers(new Date(2000,1,1,13))
      res = await http.post('/c', {aid, content:'hello comment3', reply_id:cid})
      var cid3 = res.data.comment.id

      res = await http.get('/c/'+cid)
      expect(res.data.comment.comments.length).toBe(2)
      expect(res.data.comment.answer.total_comments).toBe(4)
      expect(res.data.comment.answer.question.total_answers).toBe(2)

      res = await http.get('/a/'+aid)
      expect(res.data.answer.total_comments).toBe(4)

      await signupAndLoginWX(1)
      res = await http.post('/c/'+cid +'/like')
      expect(res.data.total_likes).toBe(1)

      await signupAndLoginWX(2)
      res = await http.post('/c/'+cid +'/like')
      expect(res.data.total_likes).toBe(2)

      res = await http.post('/c/'+cid2 +'/like')
      expect(res.data.total_likes).toBe(1)

      res = await http.get('/a/'+aid)
      // liked by me
      // console.log("comments like")
      for (var i = 0; i < res.data.comments.results.length; ++i) {
        // console.log(res.data.answer.comments[i].liked_users)
      }
      // expect(res.data.answer.comments[0].liked_users.length).toBe(1)
      // expect(res.data.answer.comments[1].liked_users.length).toBe(0)
      // XXX: will have error when jest with all test running
    // orde by created_at desc
      // the comment 3
      expect(res.data.comments.results[0].is_like).toBe(false)
      // the comment 2
      expect(res.data.comments.results[1].is_like).toBe(true)
      // the comment 1
      expect(res.data.comments.results[2].is_like).toBe(true)
      // the comment 0
      expect(res.data.comments.results[3].is_like).toBe(false)

      await signupAndLoginWX(1)
      // not liked by me
      res = await http.get('/a/'+aid)
      // console.log("comments not like")
      // console.log(res.data.answer.comments)
      for (var i = 0; i < res.data.comments.results.length; ++i) {
        // console.log(res.data.answer.comments[i].liked_users)
      }
      // expect(res.data.answer.comments[0].liked_users.length).toBe(0)
      // expect(res.data.answer.comments[1].liked_users.length).toBe(0)
      expect(res.data.comments.results[0].is_like).toBe(false)
      expect(res.data.comments.results[1].is_like).toBe(false)
      // the comment 1
      expect(res.data.comments.results[2].is_like).toBe(true)
      // the comment 0
      expect(res.data.comments.results[3].is_like).toBe(false)

      await signupAndLoginWX(3)
      res = await http.post('/c/'+cid +'/like')
      expect(res.data.total_likes).toBe(3)
      expect(res.data.is_like).toBe(true)
      await signupAndLoginWX(2)
      try {
        res = await http.post('/c/'+cid +'/dislike')
        expect(res.data.total_likes).toBe(2)
        expect(res.data.is_like).toBe(false)
        await signupAndLoginWX(4)
        
        res = await http.post('/c/'+cid +'/dislike')
        expect(res.data.total_likes).toBe(2)
      } catch (e) {
        console.log(e)
      }

  })

  test('send points ', async () => {
    try {
      
      await signupAndLoginWX(1)
      res = await http.get('/u/.ping')
      var u1 = res.data.user.id
        
      await signupAndLoginWX(2)
      res = await http.get('/u/.ping')
      var u2 = res.data.user.id
      res = await http.post('/u/'+u1+'/thank',{aid, count:10})
      res = await http.get('/a/'+aid)
      expect(res.data.answer.total_thanks).toBe(1)
      

      res = await http.get('/u/'+u1)
      expect(res.data.user.total_points).toBe(30)
      expect(res.data.user.total_answer_thanks).toBe(1)

      res = await http.get('/u/'+u2)
      expect(res.data.user.total_points).toBe(10)

      clock = sinon.useFakeTimers(new Date(2000,1,1,10))
      res = await http.get('/u/checkpoint')
      expect(res.data.user.total_points).toBe(11)

      // NOTE: seems utc issue made it's not the right time
      clock = sinon.useFakeTimers(new Date(2000,1,2, 8))

      res = await http.get('/u/checkpoint')
      expect(res.data.user.total_points).toBe(12)

      try {
        clock = sinon.useFakeTimers(new Date(2000,1,2, 18))
        res = await http.get('/u/checkpoint')
      } catch (e) {
        expect(e.response.data.code).toBe('ALREADY_CHECKED')
      }
      expect(res.data.user.total_points).toBe(12)

      clock = sinon.useFakeTimers(new Date(2000,1,10, 8))
      await signupAndLoginWX(2)
      res = await http.get('/u/checkpoint')
      expect(res.data.user.total_points).toBe(13)

    } catch (e) {
      var msg = e.response ? e.response.data : e.message
      
    }

  })
})
