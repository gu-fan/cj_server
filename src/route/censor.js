const express = require('express')
const router = express.Router({mergeParams: true})
const {promisify, wrap, delay} = require('../common/promise')
const jwt = require('../common/jwt-auth')
const {ERR, MSG} = require('../code')

const {uid, slug}= require('../models/mixin/_uid')

const {hasPermission} = require('../common/permission')

const {TrackA, TrackQ, User, Answer, Comment, Question, Staff}  = require('../models')

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

router.get('/search', jwt.auth(), wrap(async function(req, res, next) {

  var questions
  if (req.query.q == undefined){
    questions = await Question.query()
             .eager('author')
            .page(req.query.page||0, 10)
  } else {
    questions = await Question.query()
            .where('title','like', '%'+req.query.q+'%')
             .eager('author')
            .page(req.query.page||0, 10)
            
  }

  res.json({
      msg:"censor question list",
      code:0,
      q:req.query.q,
      questions,
  })

}))

router.get('/q/:qid/answers', jwt.auth(), 
  hasPermission('censor'),
  wrap(async function(req, res, next) {

  var question = await Question.query()
                        .findById(req.params.qid)
  // var question = await Question.query()
  //                       .findById(req.params.qid)
  //                       .eagerAlgorithm(Question.NaiveEagerAlgorithm)
  //                       .eager('[author, answers(page).author]',{
  //                         page:builder => builder.page(0, 5) 
  //                       })
  
  if (question == undefined) throw ERR.NO_SUCH_TARGET
  var answers = await question.$relatedQuery('answers')
                        .eager('[author, question]')
                        .page(0, 5)
                        .orderBy('created_at', 'desc')

  res.json({
      msg:"got question with answers",
      answers,
      code:0,
  })

}))

// XXX
// this should put ahead /:qid
router.get('/q/:qid/', jwt.auth(), hasPermission('censor'),
    wrap(async function(req, res, next) {

  var question = await Question.query()
                        .patchAndFetchById(req.params.qid, {
                          "censor_status": "pass"
                        })
                        .eager('author')

  if (question == undefined) throw ERR.NO_SUCH_TARGET

  var tracks = await question.$relatedQuery('tracks')
     .insertAndFetch({content:'pass', setter_id:req.user.sub})

  res.json({
      msg:"got question censor track",
      question,
      tracks,
      code:0,
  })

}))

router.post('/q/:qid', jwt.auth(), hasPermission('censor'), 
  wrap(async function(req, res, next) {


  if (req.body.action == undefined ) throw ERR.NEED_ARGUMENT
  var question = await Question.query()
                        .findById(req.params.qid)

  console.log(question)
  if (question == undefined) throw ERR.NO_SUCH_TARGET

  await TrackQ.query()
     .insert({
           question_id:req.params.qid,
           content: req.body.action,
           reason: req.body.reason, 
           setter_id:req.user.sub
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

router.post('/a/:aid', jwt.auth(), hasPermission('censor'),
  wrap(async function(req, res, next) {
    
  if (req.body.action == undefined) throw ERR.NEED_ARGUMENT

  await TrackA.query()
     .insert({
           answer_id:req.params.aid,
           content: req.body.action, 
           reason: req.body.reason, 
           setter_id:req.user.sub
       })

  await Answer.query()
      .findById(req.params.aid)
      .patch({
        "censor_status": req.body.action
      })
  var answer = await Answer
      .query()
      .findById(req.params.aid)
      .eager('[author, question, tracks(desc).setter]',{
        desc:(builder)=>{
          builder.orderBy('created_at', 'desc')
        }
      })

  if (answer == undefined) throw ERR.NO_SUCH_TARGET
  
  res.json({
      msg:"answer censor finish",
      answer,
      code:0,
  })

}))
router.get('/a/:aid',  wrap(async function(req, res, next) {

  var answer = await Answer.query()
                  .patchAndFetchById(req.params.aid, {
                    "censor_status": "pass"
                  })
             .eager('[author, question]')

  if (answer == undefined) throw ERR.NO_SUCH_TARGET

  var tracks = await answer.$relatedQuery('tracks')
     .insertAndFetch({content:'pass', setter_id:req.user.sub})

  
  res.json({
      msg:"got answer censor track",
      answer,
      tracks,
      code:0,
  })

}))


router.get('/answers', jwt.auth(), hasPermission('censor'),
  wrap(async function(req, res, next) {

  var answers = await Answer.query()
          .modify(withQueryContent, req.query.title)
          .modify(withQueryStatus, req.query.censor_status)
          // .whereNull('censor_status')
          // .orWhere('censor_status', 'reject_review')
          .orderBy("created_at", "DESC")
          .page(req.query.page||0, 10)
             .eager('[author, question]')

  res.json({
      msg:"censor question list",
      code:0,
      answers,
  })

}))

router.get('/answer_search', jwt.auth(), wrap(async function(req, res, next) {

  var answers
  if (req.query.q == undefined){
    answers = await Answer.query()
             .eager('[author, question]')
            .page(req.query.page||0, 10)
  } else {
    answers = await Answer.query()
            .where('content','like', '%'+req.query.q+'%')
             .eager('[author, question]')
            .page(req.query.page||0, 10)
            
  }

  res.json({
      msg:"censor answer search list",
      code:0,
      q:req.query.q,
      answers,
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

router.post('/user', jwt.auth(),
  hasPermission('censor'),
  wrap(async function(req, res, next) {

  var user = await User.query()
          .insertAndFetch({
            name: req.body.name,
            password: req.body.password,
            phone: req.body.phone,
            avatar: req.body.avatar,
            r_type: 1,
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
  console.log(req.body)

  var user = await User.query()
          .patchAndFetchById(req.params.uid, {
            name: req.body.name,
            password: req.body.password,
            phone: req.body.phone,
            avatar: req.body.avatar,
            r_type: 1,
          })

  res.json({
      msg:"user patched",
      code:0,
      user,
  })

}))

module.exports = router

