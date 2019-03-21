const assert = require('assert')
const sinon = require('sinon')

const ERR = require('../src/code').ERR_CODE
const MSG = require('../src/code').MSG_CODE

const _TEST_ = require('path').basename(__filename);
const { http, setupServer, closeServer } = require('./setup/server')(_TEST_)
const { logError, signup, login, signupAndLogin } = require('./common')(http)

describe('user tests', () => {
  let clock
  let res

  beforeAll(async ()=>{
    await setupServer()
  })

  afterAll(async ()=>{
    await closeServer()
  })

  var pid, pid2
  test('create post', async () => {
    expect.assertions(4)

    try {

      await signupAndLogin('test')
        
      var post = {
        content: "HELLO WORLD",
        is_public: true,
        content_json: {
          v:0,
          images:[{url:'111'},{url:'222'}]
        }
      }

      res = await http.post('/p', post)

      expect(res.data.msg).toBe(MSG.POST_SUCCESS)
      expect(res.data.post.content_json.images[0].url).toBe('111')
      expect(res.data.post.content).toBe('HELLO WORLD')

      pid = res.data.post.id
      post.content = 'HELLO2'
      post.is_public = false
      res = await http.post('/p', post)
      pid2 = res.data.post.id

      expect(res.data.post.content).toBe('HELLO2')

    } catch (e) {
      console.log(e.response ? e.response.data : e)
    }

    
  })

  test('get post', async () => {

    try {
      
      res = await http.get('/p')
      expect(res.data.count).toBe(2)

      res = await http.get(`/p/${pid}`)
      expect(res.data.post.content).toBe('HELLO WORLD')
      expect(res.data.comments.total).toBe(0)


      res = await http.get(`/p/${pid2}`)
      expect(res.data.post.content).toBe('HELLO2')
      expect(res.data.comments.total).toBe(0)

      await signupAndLogin('tmp1')

      try {
        res = await http.get(`/p/${pid2}`)
      } catch (e) {
        expect(e.response.data.code).toBe(ERR.NOT_AUTHOR)
      }
      await login('test')

    } catch (e) {
      console.log(e.response ? e.response.data : e)
    }
    
  })

  test('user can patch post', async () => {

    try {
      res = await http.put(`/p/${pid}`, {content:"WHAT"})
      expect(res.data.post.content).toBe('WHAT')
      expect(res.data.post.censor_status).toBe('pass')
    } catch (e) {
      console.log(e.response ? e.response.data : e)
    }
    
  })

  test('patch post should be same user', async () => {

    try {
      await signupAndLogin('test2')
      res = await http.put(`/p/${pid}`, {content:"WHAT2"})
    } catch (e) {
      expect(e.response.data.code).toBe(ERR.NOT_AUTHOR)
    }
    
  })

  test('user can delete post', async () => {

    try {
      await login('test')
      res = await http.delete(`/p/${pid}`)
      expect(res.data.deleted).toBe(1)

      res = await http.get(`/p/${pid}`)
      expect(res.data.post.is_deleted).toEqual(1)
      expect(res.data.post.content).toBeUndefined()

    } catch (e) {
      console.log(e.response ? e.response.data : e)
    }
    
  })


  test('post with tags', async () => {
    expect.assertions(19)

    try {
      res = await http.post('/p', {content:'hello',
        content_json: {
          tags: ['aaaa', 'bbbb', 'cccc']
        }
      })
      pid = res.data.post.id

      res = await http.get('/t/hot')
      expect(res.data.tags.plain.length).toBe(3)

      res = await http.get('/u/.ping')
      expect(res.data.user.tags.length).toBe(3)

      res = await http.get('/p/'+pid)
      expect(res.data.post.tags.length).toBe(3)

      res = await http.post('/p', {content:'hello',
        content_json: {
          tags: ['dddd', 'bbbb', 'eeee']
        }
      })
      pid = res.data.post.id

      res = await http.get('/t/hot')
      expect(res.data.tags.plain.length).toBe(5)

      res = await http.get('/u/.ping')
      expect(res.data.user.tags.length).toBe(3)
      expect(res.data.user.tags[0].name).toBe('bbbb')
      expect(res.data.user.tags[0].count).toBe(2)

      res = await http.get('/p/'+pid)
      expect(res.data.post.tags.length).toBe(3)



      await signupAndLogin('test3')

      res = await http.post('/p', {content:'hello3',
        content_json: {
          tags: ['aaaa', 'bbbb', 'kkkk']
        }
      })
      pid = res.data.post.id

      res = await http.get('/t/hot')
      expect(res.data.tags.plain.length).toBe(6)

      res = await http.get('/u/.ping')
      expect(res.data.user.tags.length).toBe(3)

      res = await http.get('/p/'+pid)
      expect(res.data.post.tags.length).toBe(3)
      expect(res.data.post.tags[0].name).toBe('aaaa')
      expect(res.data.post.tags[0].total_posts).toBe(2)
      expect(res.data.post.tags[1].name).toBe('bbbb')
      expect(res.data.post.tags[1].total_posts).toBe(3)
      expect(res.data.post.tags[2].name).toBe('kkkk')
      expect(res.data.post.tags[2].total_posts).toBe(1)

      try {
        res = await http.post('/p', {content:'hello3',
          content_json: {
            tags: ['11111111111111111111111111', 'bbbb', 'kkkk']
          }
        })
      } catch (e) {
        expect(e.response.data.code).toBe(ERR.TAG_EXCEED_LIMIT_15)
      }

      try {
        res = await http.post('/p', {content:'hello3',
          content_json: {
            tags: ['11', 'bbbb', 'kkkk','dddd']
          }
        })
      } catch (e) {
        expect(e.response.data.code).toBe(ERR.POST_LIMIT_3_TAG)
      }
      
    } catch (e) {
      console.log(e.response ? e.response.data : e)
    }

  })
  test('user can view only own public', async () => {
    expect.assertions(3)
    try {

      await signupAndLogin('p1')

      res = await http.get('/u/.ping')
      uid = res.data.user.id

      var post = {
        content: "HELLO WORLD",
        is_public: true,
      }

      res = await http.post('/p', post)
      pid = res.data.post.id
      var post = {
        content: "HELLO WORLD",
        is_public: false,
      }

      res = await http.post('/p', post)
      pid2 = res.data.post.id
      res = await http.get('/u/'+uid+'/posts')
      expect(res.data.posts.results.length).toBe(2)
      await signupAndLogin('p2')
      res = await http.get('/u/'+uid+'/posts')
      expect(res.data.posts.results.length).toBe(1)

      try {
        res = await http.get('/p/'+pid2)
      } catch (e) {
        expect(e.response.data.code).toBe(ERR.NOT_AUTHOR)
        
      }

    } catch (e) {
      logError(e)
    }


  })

})
