const assert = require('assert')
const sinon = require('sinon')

const ERR = require('../../src/code').ERR_CODE
const MSG = require('../../src/code').MSG_CODE

const _TEST_ = require('path').basename(__filename);
const { http, setupServer, closeServer } = require('../setup/server')(_TEST_)

const { signupAndLoginWX, bindUserWX } = require('../common')(http)

describe('picture tests', () => {
  let clock
  let res

  beforeAll(async ()=>{
    await setupServer()
  })

  afterAll(async ()=>{
    await closeServer()
  })

  var qid, aid, cid, uid
  test('picture test all', async () => {
    try {
      await signupAndLoginWX(1)
      await bindUserWX(1)

      res = await http.get('/u/.ping')
      var question = {
        title: "hello",
        content: "HELLO WORLD"
      }

      res = await http.post('/q', question)
      expect(res.data.msg).toBe(MSG.QUESTION_SUCCESS)
      expect(res.data.question.content).toBe('HELLO WORLD')
      qid = res.data.question.id
      res = await http.post('/a', {qid:qid, content_json:{v:'0',data:[{t:'text',text:"hhhh"},{t:'img',url:"https://www.vincit.fi/wp-content/uploads/2015/11/relational-documents-schema.png"}]}})
      aid = res.data.answer.id
      expect(res.data.answer.content_json.data[0].t).toBe('text')
    } catch (e) {
      console.log(e.response ? e.response.data : e.message)
    }
    
  })
})

