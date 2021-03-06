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
  let uid
  test('create post', async () => {

    try {
      await signupAndLogin('A1')
      res = await http.get('/u/.ping')
      uid = res.data.user.id
      res = await http.get('/pub/grant', {params:{uid, code:'FZBB'}})

      
      res = await http.get('/t/.ping')
      expect(res.data.count).toBe(0)
    } catch (e) {
      console.log(e.response ? e.response.data : e)
    }

  })

  test('create topic tag', async () => {

    try {
      
    res = await http.post('/t/topic', {name:'hello'})
    expect(res.data.topic.name).toBe('hello')

    } catch (e) {
      console.log(e.response ? e.response.data : e)
      
    }
    
  })

  test('create sub tag', async () => {

    try {
      res = await http.post('/t', {name:'hello'})
      expect(res.data.tag.name).toBe('hello')
      res = await http.post('/t', {name:'hello2'})
      expect(res.data.tag.name).toBe('hello2')
      try {
        res = await http.post('/t', {name:'hello2'})
        expect(res.data.tag.name).toBe('hello2')
      } catch (e) {
        expect(e.response.data.code).toBe('unique_violation')
      }

    } catch (e) {
      console.log(e.response ? e.response.data : e)
    }
  })

  test('set sub tag to topic ', async () => {
    try {

      res = await http.post('/t/set_topic', {tag:'test',topic:'test'})
      expect(res.data.tag.topics.length).toBe(1)
      expect(res.data.tag.topics[0].name).toBe('test')

      res = await http.post('/t/set_topic', {tag:'test',topic:'test'})
      expect(res.data.tag.topics.length).toBe(1)
      res = await http.post('/t/set_topic', {tag:'test',topic:'test2'})
      expect(res.data.tag.topics.length).toBe(2)

    } catch (e) {
      console.log(e.response ? e.response.data : e)
    }

  })

  test('unset sub tag to topic', async () => {

    try {

      res = await http.post('/t/unset_topic', {tag:'test',topic:'test'})
      expect(res.data.tag.topics.length).toBe(1)

        
      res = await http.post('/t/unset_topic', {tag:'test',topic:'test'})
      expect(res.data.tag.topics.length).toBe(1)

      res = await http.post('/t/unset_topic', {tag:'test',topic:'test2'})
      expect(res.data.tag.topics.length).toBe(0)
        

    } catch (e) {
      console.log(e.response ? e.response.data : e)
    }

  })


  test('get tags', async () => {

    try {
      res = await http.get('/t/tags')
      // console.log(res.data.tags)
      // expect(res.data.tags.total).toBe(3)
    } catch (e) {
      console.log(e.response ? e.response.data : e)
    }

  })

  var pid, pid2
  test('create post', async () => {

    try {

      await signupAndLogin('t1')
      res = await http.get('/u/.ping')
      uid = res.data.user.id
      res = await http.get('/pub/grant', {params:{uid, code:'FZBB'}})


      res = await http.post('/p', {content:'hello'})
      pid = res.data.post.id

      res = await http.post('/p', {content:'hello 2'})
      pid2 = res.data.post.id
      
    } catch (e) {
      console.log(e.response ? e.response.data : e)
    }

  })

  test('set tag to post', async () => {
    expect.assertions(8)

    try {

      res = await http.post('/t/set_post', {pid, tag:'hello'})

      // THESE SHOULD HAVE NO EFFECT
      res = await http.post('/t/set_post', {pid, tag:'hello'})
      res = await http.post('/t/set_post', {pid, tag:'hello'})
      res = await http.post('/t/set_post', {pid, tag:'hello'})

      res = await http.post('/t/set_post', {pid, tag:'hello2'})
      expect(res.data.post.tags.length).toBe(2)

      res = await http.post('/t/set_post', {pid:pid2, tag:'hello2'})
      expect(res.data.post.tags.length).toBe(1)

      // check user.tags
      res = await http.get('/u/.ping')
      expect(res.data.user.tags.length).toBe(2)
      // user have 2 tags,
      // the first is hello2
      expect(res.data.user.tags[0].count).toBe(2)
      expect(res.data.user.tags[0].name).toBe('hello2')

      res = await http.get('/t/hot')
      expect(res.data.tags.plain.length).toBe(3)

      // hot have 3 tags
      // the most tag is hello,
      // related in 2 posts
      expect(res.data.tags.results[0].name).toBe('hello2')
      expect(res.data.tags.results[0].total_posts).toBe(2)
      
      try {
        
        // should have no effects
        res = await http.post('/t/set_post', {pid, tag:'hello'})
      } catch (e) {
        // expect(e.response.data.code).toBe('SQLITE_CONSTRAINT')
        
      }

      // console.log(res.data.post)
      
    } catch (e) {
      console.log(e.response ? e.response.data : e)
    }

  })

  test('unset tag to post', async () => {

    try {

      res = await http.post('/t/unset_post', {pid, tag:'hello'})
      expect(res.data.post.tags.length).toBe(1)
      
    } catch (e) {
      console.log(e.response ? e.response.data : e)
    }

  })


  let tag_id, topic_id
  test('get tag related posts', async () => {

    expect.assertions(7)

    try {

      res = await http.post('/p', {content:'hello', content_json: {tags:['aaa']}})

      res = await http.get(`/t/of`, {params:{name:'aaa'}})
      tag_id = res.data.tag.id

      res = await http.get(`/t/${tag_id}/relate_posts`)
      expect(res.data.posts.results.length).toBe(1)

      res = await http.post('/t/set_topic', {tag:'aaa',topic:'AAA'})

      res = await http.get(`/t/${tag_id}/relate_posts`)
      expect(res.data.posts.results.length).toBe(1)

      res = await http.post('/p', {content:'hello', content_json: {tags:['bbb']}})
      res = await http.post('/t/set_topic', {tag:'bbb',topic:'AAA'})
      res = await http.get(`/t/${tag_id}/relate_posts`)
      expect(res.data.posts.results.length).toBe(2)

      res = await http.post('/p', {content:'hello', content_json: {tags:['ccc']}})
      res = await http.post('/t/set_topic', {tag:'ccc',topic:'AAA'})
      res = await http.get(`/t/${tag_id}/relate_posts`)
      expect(res.data.posts.results.length).toBe(3)
      res = await http.post('/p', {content:'hello', content_json: {tags:['ddd','aaa']}})
      res = await http.get(`/t/${tag_id}/relate_posts`)
      expect(res.data.posts.results.length).toBe(4)

      // SET MORE TOPIC OF TAG aaa
      res = await http.post('/t/set_topic', {tag:'aaa',topic:'KKK'})
      res = await http.post('/p', {content:'hello', content_json: {tags:['kkk']}})
      res = await http.post('/t/set_topic', {tag:'kkk',topic:'KKK'})
      res = await http.get(`/t/${tag_id}/relate_posts`)
      expect(res.data.posts.results.length).toBe(5)
      res = await http.post('/p', {content:'hello', content_json: {tags:['kkk','aaa']}})
      res = await http.get(`/t/${tag_id}/relate_posts`)
      expect(res.data.posts.total).toBe(6)

    
      
    } catch (e) {
      console.log(e.response ? e.response.data : e)
    }

  })

})
