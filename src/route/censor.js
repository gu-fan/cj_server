const express = require('express')
const router = express.Router({mergeParams: true})
const {promisify, wrap, delay} = require('../common/promise')
const jwt = require('../common/jwt-auth')
const {ERR, MSG} = require('../code')

const {uid, slug}= require('../models/mixin/_uid')

const {hasPermission} = require('../common/permission')

const { Post, Track, User, Answer, Comment, Question, Staff}  = require('../models')

const { checkSpam } = require('../common/spam')

const { getUser } = require('../services/user')

router.get('/.ping', jwt.auth(), wrap(async function(req, res, next) {

  res.json({
      msg:"censor",
      code:0,
  })

}))

const withQueryTitle = function(queryBuilder, title) {
  if (title!= null && title.trim() != '') {
    queryBuilder
      .where('title','like', '%'+title+'%')
  }
};

const withQueryContent = function(queryBuilder, content) {
  if (content) {
    queryBuilder
      .where('content','like', '%'+content+'%')
  }
};

const withQueryStatus = function(queryBuilder, status) {
  if (status == 'pass') {
    queryBuilder
      .where('censor_status', 'pass')
  } else if (status == 'waiting' ) {
    queryBuilder
      .whereNull('censor_status')
  } else if (status == 'reject' ) {
    queryBuilder
      .orWhere('censor_status', 'reject')
  } else if (status == 'review' ) {
    queryBuilder
      .orWhere('censor_status', 'reject_review')
  }
};
router.get('/posts', wrap(async function(req, res, next) {

  var posts = await Post.query()
          .modify(withQueryStatus, req.query.censor_status)
          .orderBy('created_at', 'desc')
          .page(req.query.page||0, 10)
          .eager('author(safe)')

  res.json({
      msg:"censor post list",
      code:0,
      posts,
  })

}))
// FIXED
// this should put ahead /:qid
//
router.get('/p/:pid/', jwt.auth(), hasPermission('censor'),
    wrap(async function(req, res, next) {

  var post = await Post.query()
                        .patchAndFetchById(req.params.qid, {
                          "censor_status": "pass"
                        })
                        .eager('author(safe)')

  if (post == undefined) throw ERR.NO_SUCH_TARGET

  res.json({
      msg:"got post censor",
      post,
      code:0,
  })

}))
// CENSOR QUESTION
router.post('/p/:pid', jwt.auth(), hasPermission('censor'), 
  wrap(async function(req, res, next) {


  if (req.body.action == undefined ) throw ERR.NEED_ARGUMENT
  var post = await Post.query()
                        .findById(req.params.pid)

  if (post == undefined) throw ERR.NO_SUCH_TARGET

  await Track.query()
     .insert({
           content: req.body.action + ':post:' + req.param.pid+":" + req.body.reason,
           topic: 'censor',
           operator_id: req.user.sub,
       })

  post = await Post.query()
                        .patchAndFetchById(req.params.pid, {
                          "censor_status": req.body.action
                        })
                        .eager('[author(safe)]',{
                          desc:(builder)=>{
                            builder.orderBy('created_at', 'desc')
                          }
                        })

  
  res.json({
      msg:"post censor finish",
      censor: post.censor_status,
      post,
      code:0,
  })

}))

router.get('/search', jwt.auth(), wrap(async function(req, res, next) {

  var posts
  if (req.query.q == undefined){
    posts = await Question.query()
             .eager('author')
            .page(req.query.page||0, 10)
  } else {
    posts = await Post.query()
            .where('content','like', '%'+req.query.q+'%')
            .eager('author')
            .page(req.query.page||0, 10)
            
  }

  res.json({
      msg:"search censor post",
      code:0,
      q:req.query.q,
      posts,
  })

}))


router.get('/posts',  jwt.auth(), wrap(async function(req, res, next) {

  var user = await getUser(req.user.sub)
  if (!user.is_staff) throw ERR.NO_PERMISSION

  var day_before = moment().subtract(7, 'day').format()

  var page = req.query.page || 0
  var posts = await Post.query()
          .where('is_deleted', false)
          .where('is_public', true)
          .eager('[author(safe)]')
          .orderBy('created_at', 'desc')
          .where('created_at', '>', day_before)
          .page(page, 5)

  res.json({
      msg:"post list",
      code:0,
      posts,
  })

}))



//////////////////////
// CHECKED HERE
//////////////////////

router.get('/questions', jwt.auth(), wrap(async function(req, res, next) {

  var questions = await Question.query()
          .modify(withQueryTitle, req.query.title)
          .modify(withQueryStatus, req.query.censor_status)
          // .whereNull('censor_status')
          // .orWhere('censor_status', 'reject_review')
          .orderBy("created_at", "DESC")
          .page(req.query.page||0, 10)
          .eager('author')

  res.json({
      msg:"censor question list",
      code:0,
      questions,
  })

}))




// CREATE QUESTION
router.post('/q', jwt.auth(), hasPermission('censor'),
  wrap(async function(req, res, next) {

  var content = req.body.content || ''

  if (checkSpam(req.body.title) || checkSpam(content)) {
    throw ERR.IS_SPAM
  }

  var question = await Question.query().insertGraph([{
    title: req.body.title,
    content: req.body.content, 
    censor_status: 'pass',
    author: {
      id: req.body.author_id,
    },
    // author_id: req.user.sub,
  }], {
    relate: true
  })
  .eager('author');

  question = question[0]

  res.json({
      msg:"question created",
      question,
      code:0,
  })



}))


router.patch('/q', jwt.auth(), hasPermission('censor'),
  wrap(async function(req, res, next) {

  var content = req.body.content || ''

  if (checkSpam(req.body.title) || checkSpam(content)) {
    throw ERR.IS_SPAM
  }

  var question = await Question.query().patchAndFetchById(req.body.id,  {
    title: req.body.title,
    content: content, 
  })
  .eager('author');

  res.json({
      msg:"question patched",
      question,
      code:0,
  })


}))


// FIXED
// this should put ahead /:qid
//
router.get('/q/:qid/', jwt.auth(), hasPermission('censor'),
    wrap(async function(req, res, next) {

  var question = await Question.query()
                        .patchAndFetchById(req.params.qid, {
                          "censor_status": "pass"
                        })
                        .eager('author')

  if (question == undefined) throw ERR.NO_SUCH_TARGET

  var tracks = await question.$relatedQuery('tracks')
     .insertAndFetch({content:'pass', setter_id:null})

  res.json({
      msg:"got question censor track",
      question,
      tracks,
      code:0,
  })

}))


// CENSOR QUESTION
router.post('/q/:qid', jwt.auth(), hasPermission('censor'), 
  wrap(async function(req, res, next) {


  if (req.body.action == undefined ) throw ERR.NEED_ARGUMENT
  var question = await Question.query()
                        .findById(req.params.qid)

  if (question == undefined) throw ERR.NO_SUCH_TARGET

  await TrackQ.query()
     .insert({
           question_id:req.params.qid,
           content: req.body.action,
           reason: req.body.reason, 
           setter_id: null,
       })

  question = await Question.query()
                        .patchAndFetchById(req.params.qid, {
                          "censor_status": req.body.action
                        })
                        .eager('[author, tracks(desc).setter]',{
                          desc:(builder)=>{
                            builder.orderBy('created_at', 'desc')
                          }
                        })

  
  res.json({
      msg:"question censor finish",
      censor: question.censor_status,
      question,
      code:0,
  })

}))



const withQueryName = function(queryBuilder, name) {
  if (name) {
    queryBuilder
      .where('name','like', '%'+name+'%')
  }
}

const withQueryType = function(queryBuilder, type) {
  if (type) {
    queryBuilder
      .where('r_type',type)
  }
}

const withQueryID = function(queryBuilder, id) {
  if (id) {
    queryBuilder
      .where('id',id)
  }
}
router.get('/users', jwt.auth(),
  hasPermission('censor'),
  wrap(async function(req, res, next) {

  var users = await User.query()
          .modify(withQueryName, req.query.name)
          .modify(withQueryType, req.query.r_type)
          .modify(withQueryID, req.query.id)
          .orderBy("created_at", "DESC")
          .page(req.query.page || 0, 10)

  res.json({
      msg:"censor question list",
      code:0,
      users,
  })

}))


// CREATE USER
router.post('/user', jwt.auth(),
  hasPermission('censor'),
  wrap(async function(req, res, next) {

  var user = await User.query()
          .insertAndFetch({
            name: req.body.name,
            password: req.body.password,
            phone: req.body.phone,
            avatar: req.body.avatar,
            r_type: "web",
          })

  res.json({
      msg:"user created",
      code:0,
      user,
  })

}))

router.patch('/user/:uid', jwt.auth(),
  hasPermission('censor'),
  wrap(async function(req, res, next) {

  var user = await User.query()
          .patchAndFetchById(req.params.uid, {
            name: req.body.name,
            password: req.body.password,
            phone: req.body.phone,
            avatar: req.body.avatar,
            r_type: "web",
          })

  res.json({
      msg:"user patched",
      code:0,
      user,
  })

}))
router.post('/user/:uid/verify', jwt.auth(),
  hasPermission('censor'),
  wrap(async function(req, res, next) {

  var user = await User.query()
          .patchAndFetchById(req.params.uid, {
            is_verified: req.body.is_verified,
            verify_quote: req.body.verify_quote,
          })

  res.json({
      msg:"user verified",
      code:0,
      user,
  })

}))




module.exports = router

