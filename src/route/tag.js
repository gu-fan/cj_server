const express = require('express')
const router = express.Router({mergeParams: true})
const {promisify, wrap, delay} = require('../common/promise')
const jwt = require('../common/jwt-auth')
const {ERR, MSG} = require('../code')

const { User, Tag, TagTopic, Post }  = require('../models')
const { checkSpam,checkSpamExact } = require('../common/spam')
const {relateTagNameWithPost,relateTagWithUser} = require('../services/tag')

module.exports = router

router.get('/.ping',  wrap(async function(req, res, next) {

  var count = await Tag.query()
                          .select('id')
                          .count()

  res.json({
      msg:"tag count",
      count:count[0]['count(*)'],
      code:0,
  })

}))

router.post('/',  wrap(async function(req, res, next) {

  if (req.body.name == '' || req.body.name == null) 
    throw ERR.NEED_CONTENT
  if (checkSpam(req.body.name)) throw ERR.IS_SPAM
  if (req.body.name.length > 15) throw ERR.TAG_EXCEED_LIMIT_15

  var tag = await Tag.query()
                          .insert({name: req.body.name})

  res.json({
      msg:"tag create",
      tag,
      code:0,
  })

}))
router.post('/check',  wrap(async function(req, res, next) {

  if (req.body.name == '' || req.body.name == null) 
    throw ERR.NEED_CONTENT

  if (checkSpam(req.body.name)) throw ERR.IS_SPAM
  if (req.body.name.length > 15) throw ERR.TAG_EXCEED_LIMIT_15

  res.json({
      msg:"tag check valid",
      tag:req.body.name,
      code:0,
  })

}))

// get 15 hot tags
// XXX?
// 如何实现不同批次？
// page = 1,2,3,4?
router.get('/hot',  wrap(async function(req, res, next) {

  var total_tags = await Tag.query()
                      .orderBy('total_posts', 'desc')
                      .limit(15)

  var tags = {plain:[]}
  if (total_tags.length != 0) {
    tags.results = total_tags
    tags.plain = total_tags.map(tag=>{
      return tag.name
    })
  }

  res.json({
      msg:"get hot tags",
      tags,
      code:0,
  })

}))

router.post('/topic',  wrap(async function(req, res, next) {

  if (req.body.name == '' || req.body.name == null) 
    throw ERR.NEED_CONTENT

  var topic = await TagTopic.query()
                          .insert({name: req.body.name})

  res.json({
      msg:"tag topic create",
      topic,
      code:0,
  })

}))

router.post('/set_topic',  wrap(async function(req, res, next) {

  if (req.body.tag == '' || req.body.tag == null) 
    throw ERR.NEED_CONTENT
  if (req.body.topic == '' || req.body.topic == null) 
    throw ERR.NEED_CONTENT

  let topic = await TagTopic.query()
                          .findOne({name: req.body.topic})

  if (topic == null) {
    topic = await TagTopic.query()
                    .insert({name: req.body.topic})
  }

  let tag = await Tag.query()
                      .findOne({name: req.body.tag})
  if (tag == null) {
    tag = await Tag.query()
      .insert({
        name: req.body.tag,
      })
  }
  await tag
      .$relatedQuery('topics')
      .relate(topic.id)

  tag = await tag.$query()
                .eager('topics')

  res.json({
      msg:"tag topic set",
      tag,
      code:0,
  })

}))

router.post('/unset_topic',  wrap(async function(req, res, next) {

  if (req.body.tag == '' || req.body.tag == null) 
    throw ERR.NEED_CONTENT
  if (req.body.topic == '' || req.body.topic == null) 
    throw ERR.NEED_CONTENT


  let topic = await TagTopic.query()
                          .findOne({name: req.body.topic})

  if (topic == null) {
    throw ERR.NOT_FOUND
  }

  let tag = await Tag.query()
                          .findOne({name: req.body.tag})
                          .eager('topics')

  console.log(tag.topics)
  if (tag == null) {
    throw ERR.NOT_FOUND
  } else {
    await tag.$relatedQuery('topics')
              .unrelate()
              .where('tag_topic.id', topic.id);
    console.log('unrelate')
    console.log(topic.id)
    console.log(tag.id)
  }

  tag = await tag.$query()
                .eager('topics')

  res.json({
      msg:"tag topic unset",
      tag,
      code:0,
  })

}))

router.get('/tags',  wrap(async function(req, res, next) {

  var page = req.query.page || 0
  var tags = await Tag.query()
                        .orderBy('total_posts', 'desc')
                        .page(page, 10)

  res.json({
      msg:"tags get",
      tags,
      code:0,
  })

}))

router.post('/set_post', jwt.auth(), wrap(async function(req, res, next) {

  if (req.body.tag == '' || req.body.tag == null) 
    throw ERR.NEED_CONTENT
  if (req.body.pid == '' || req.body.pid == null) 
    throw ERR.NEED_ARGUMENT

  var post = await Post.query()
                          .findById(req.body.pid)

  if (post == null) {
    throw ERR.NOT_FOUND
  }

  var {tag,is_unique}= await relateTagNameWithPost(req.body.tag, post) 

  post = await Post.query()
                  .findById(req.body.pid)
                  .eager('tags')



  await relateTagWithUser(tag.id, req.user.sub, is_unique)

  // user = await User.query().findById(req.user.sub)
  //                   .eager('tags')

  // console.log(user)


  res.json({
      msg:"tag topic set",
      tag,
      post,
      code:0,
  })

}))

router.post('/unset_post',  wrap(async function(req, res, next) {

  if (req.body.tag == '' || req.body.tag == null) 
    throw ERR.NEED_CONTENT
  if (req.body.pid == '' || req.body.pid == null) 
    throw ERR.NEED_ARGUMENT

  var post = await Post.query()
                          .findById(req.body.pid)

  if (post == null) throw ERR.NOT_FOUND
  

  var tag = await post.$relatedQuery('tags')
                      .findOne({name: req.body.tag})

  if (tag == null) {
    throw ERR.NOT_FOUND
  }

  await post.$relatedQuery('tags')
    .unrelate()
    .where('tag.id', tag.id)
  
  post = await Post.query()
                  .findById(req.body.pid)
                  .eager('tags')

  res.json({
      msg:"tag topic unset",
      tag,
      post,
      code:0,
  })

}))

