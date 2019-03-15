const assert = require('assert')
const sinon = require('sinon')

const ERR = require('../src/code').ERR_CODE

const _TEST_ = require('path').basename(__filename);
const { http, setupServer, closeServer } = require('./setup/server')(_TEST_)

const { signup, signupAndLogin, login } = require('./common')(http)

describe(_TEST_, () => {
  let clock
  let res

  beforeAll(async ()=>{
    await setupServer()
  })

  afterAll(async ()=>{
    await closeServer()
  })

  var uid, aid, qid
  test('signup', async () => {
      // logTime()

      await signupAndLogin(2)
      // logTime('signup 2')
      await signupAndLogin(1)
      // logTime('signup 1')
      res = await http.get('/u/.ping')
      uid = res.data.user.id
      res = await http.get('/pub/grant',
                      {params: {uid, code:'FZBB'} })
      // logTime('grant')
      res = await http.get('/u/.ping')
      expect(res.data.user.is_staff).toBe(true)
      // logTime()
  })

  var pid
  test('create post', async () => {
    try {
      
    var post = {
      content: "HELLO WORLD"
    }

    res = await http.post('/p', post)
    pid = res.data.post.id

      
    } catch (e) {
      console.log(e)
    }
  })

  var aid2,qid2
  test('select post', async () => {
    expect.assertions(3)
    try {
      

    await login(2)
    try {
      res = await http.get('/p/'+ pid + '/set_choice')
    } catch (e) {
      expect(e.response.data.code).toBe('NO_PERMISSION')
    }
    await login(1)
    res = await http.get('/p/'+ pid + '/set_choice')
    expect(res.data.post.is_editor_choice) .toBe(1)
    res = await http.get('/p/'+ pid + '/unset_choice')
    expect(res.data.post.is_editor_choice) .toBe(0)
    } catch (e) {
      console.log(e)
    }

  })


})

