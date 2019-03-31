const express = require('express')
const router = express.Router({mergeParams: true})
const {promisify, wrap, delay} = require('../common/promise')
const jwt = require('../common/jwt-auth')
const {ERR, MSG} = require('../code')
const { UniqueViolationError} = require('objection-db-errors');

const { User, Tag, TagTopic, Post }  = require('../models')
const { checkSpam,checkSpamExact } = require('../common/spam')
const {relateTagNameWithPost,relateTagWithUser} = require('../services/tag')
const moment = require('moment')

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

router.get('/:tid/posts',jwt.auth(), wrap(async function(req, res, next) {


  let tag = await Tag
                .query()
                .findById(req.params.tid)

  if (tag == undefined) throw ERR.NO_SUCH_TARGET

  if (tag.is_blocked) {
    return  res.json({
      msg:"tag posts locked",
      code:1,
      posts:{results:[],total:0},
      tag,
    })
  }

  let page = req.query.page || 0
  let uid = req.user && req.user.sub || '0'
  var day_before = moment().subtract(30, 'day').format()
  let posts = await tag.$relatedQuery('posts')
          .where('censor_status', 'pass')
          .where('is_deleted', false)
          .where('is_public', true)
          .eager('[author(safe),liked_by_users(byMe)]', {
            byMe: builder=>{
              builder.where('uid', uid)
            }
          })
          .orderBy('created_at', 'desc')
          .where('created_at', '>', day_before)
          .page(page, 5)
    posts.results.map((item)=>{
      if (item.liked_by_users.length>0) {
        item.is_like_by_me = true
      } else {
        item.is_like_by_me = false
      }
      delete item.liked_by_users
    })

  res.json({
      msg:"tag posts",
      code:0,
      posts,
      tag,
  })

}))
router.get('/of', wrap(async function(req, res, next) {


  if (req.query.name == '' || req.query.name == null)
    throw ERR.NEED_ARGUMENT

  let tag = await Tag
                .query()
                .findOne({name: req.query.name})
  if (tag==null) {
    throw ERR.NOT_FOUND
  }
  res.json({
    msg: 'get tag by name',
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
router.get('/hot', jwt.auth(), wrap(async function(req, res, next) {

  let uid = req.user && req.user.sub

  if (!uid) throw ERR.NOT_LOGIN

  var h_tags = await Tag.query()
                      .orderBy('total_posts', 'desc')
                      .where('is_blocked', false)
                      .where('is_public', true)
                      .limit(5)

  var u = await User.query()
                        .findById(req.user.sub)

  let u_tags = await u.$relatedQuery('tags')
                        .orderBy('count', 'desc')
                        .where('is_blocked', false)
                        .limit(5)

  let plain_u = u_tags.map(t=>{
      return t.name
    }) 
  h_tags = h_tags.filter(item=>{
      return plain_u.indexOf(item.name) == -1
  })
  var tags = {plain:[],results:[]}

  let total_tags = u_tags.concat(h_tags)
  
  tags.user = u_tags
  tags.hot = h_tags
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
  try {
    
  await tag
      .$relatedQuery('topics')
      .relate(topic.id)
  } catch (e) {
    if (e instanceof UniqueViolationError) {
      // skip
      tag = await tag.$query()
                    .eager('topics')

      return res.json({
          msg:"tag topic already set",
          tag,
          code:0,
      })
    } else {
      throw e
    }

  }

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

  if (tag == null) {
    throw ERR.NOT_FOUND
  } else {
    await tag.$relatedQuery('topics')
              .unrelate()
              .where('tag_topic.id', topic.id);
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

router.post('/:tid/toggle_public',jwt.auth(), wrap(async function(req, res, next) {

  if (req.params.tid=='undefined' ) throw ERR.NEED_ARGUMENT

  let tag = await Tag
                .query()
                .findById(req.params.tid)

  if (tag == undefined) throw ERR.NO_SUCH_TARGET

  tag = await tag.$query()
          .patchAndFetch({is_public: !tag.is_public})


  res.json({
      msg:"tag toggle public",
      code:0,
      tag,
  })

}))

router.post('/:tid/toggle_block',jwt.auth(), wrap(async function(req, res, next) {

  if (req.params.tid=='undefined' ) throw ERR.NEED_ARGUMENT

  let tag = await Tag
                .query()
                .findById(req.params.tid)

  if (tag == undefined) throw ERR.NO_SUCH_TARGET

  tag = await tag.$query()
          .patchAndFetch({is_blocked: !tag.is_blocked})


  res.json({
      msg:"tag toggle lock",
      code:0,
      tag,
  })

}))

