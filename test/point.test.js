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


  var pid
  test('send points ', async () => {
    expect.assertions(7)
    try {
      clock = sinon.useFakeTimers(new Date(2000,1,1,10))
      await signupAndLoginWX(1)

        
      var post = {
        content: "HELLO WORLD",
        content_json: {
          v:0,
          images:[{url:'111'}, {url:'222'}]
        }
      }

      res = await http.post('/p', post)
      pid = res.data.post.id
      
      res = await http.get('/u/.ping')
      var u1 = res.data.user.id

        
      await signupAndLoginWX(2)
      res = await http.get('/u/.ping')
      var u2 = res.data.user.id


      res = await http.post('/u/'+u1+'/thank',{ count:10})

      res = await http.get('/u/'+u1)
      expect(res.data.user.detail.total_points).toBe(110)

      res = await http.get('/u/'+u2)
      expect(res.data.user.detail.total_points).toBe(90)

      res = await http.get('/u/checkpoint')
      expect(res.data.user.detail.total_points).toBe(91)

      // NOTE: seems utc issue made it's not the right time
      clock = sinon.useFakeTimers(new Date(2000,1,2, 8))

      res = await http.get('/u/checkpoint')
      expect(res.data.user.detail.total_points).toBe(92)

      try {
        clock = sinon.useFakeTimers(new Date(2000,1,2, 18))
        res = await http.get('/u/checkpoint')
      } catch (e) {
        expect(e.response.data.code).toBe('ALREADY_CHECKED')
      }
      expect(res.data.user.detail.total_points).toBe(92)

      clock = sinon.useFakeTimers(new Date(2000,1,10, 8))
      await signupAndLoginWX(2)
      res = await http.get('/u/checkpoint')
      expect(res.data.user.detail.total_points).toBe(93)

    } catch (e) {
      var msg = e.response ? e.response.data : e.message
      console.log(msg)
      
    }

  })
})
