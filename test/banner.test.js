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

  var bid
  test('create banner', async () => {

    try {
      
      await signupAndLogin(1)
      res = await http.get('/u/.ping')
      uid = res.data.user.id
      res = await http.get('/pub/grant', {params:{uid, code:'FZBB'}})

      res = await http.get('/banner/.ping')
      expect(res.data.count).toBe(0)

      res = await http.post('/banner/', {
        title:'aa',
        image:'xxx',
        tag:'aaa',
        link:'/aaa/aa',
      })
      bid = res.data.banner.id
      expect(res.data.banner.title).toBe('aa')
    } catch (e) {
      console.log(e.response ? e.response.data : e)
    }

  })


  test('patch banner', async () => {

    try {
      
      res = await http.put(`/banner/${bid}`, {
        title:'bb',
        tag: 'aaa',
      })

      expect(res.data.banner.title).toBe('bb')
      expect(res.data.banner.image).toBe('xxx')

    } catch (e) {
      console.log(e.response ? e.response.data : e)
    }

  })

  test('delete banner', async () => {

    try {
      
      res = await http.delete(`/banner/${bid}`)

      expect(res.data.deleted).toBe(1)

    } catch (e) {
      console.log(e.response ? e.response.data : e)
    }

  })


})
