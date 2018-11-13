const express = require('express')
const router = express.Router({mergeParams: true})
const {promisify, wrap, delay} = require('../common/promise')
const jwt = require('../common/jwt-auth')
const {ERR, MSG} = require('../code')

const {uid, slug}= require('../models/mixin/_uid')

const {TrackA, TrackQ, User, Answer, Comment, Question}  = require('../models')

router.get('/.ping', jwt.auth(), wrap(async function(req, res, next) {


  res.json({
      msg:"censor",
      code:0,
  })

}))

router.get('/questions', jwt.auth(), wrap(async function(req, res, next) {

  var questions = await Question.query()
          .whereNull('censor_status')
          .orWhere('censor_status', 'reject_review')
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


// XXX
// this should put ahead /:qid
router.get('/q/:qid/', jwt.auth(), wrap(async function(req, res, next) {

  var user = await User.query()
                    .findById(req.user.sub)

  if (user == undefined) throw ERR.NO_SUCH_TARGET
  if (!/censor/.test(user.permission)) {

      throw ERR.NO_PERMISSION
  }

  var question = await Question.query()
                        .patchAndFetchById(req.params.qid, {
                          "censor_status": "pass"
                        })
                        .eager('author')
  if (question == undefined) throw ERR.NO_SUCH_TARGET

  var tracks = await question.$relatedQuery('tracks')
     .insertAndFetch({content:'pass', setter_id:req.user.sub})

  if (question == undefined) throw ERR.NO_SUCH_TARGET
  
  res.json({
      msg:"got question censor track",
      question,
      tracks,
      code:0,
  })

}))

router.post('/q/:qid', jwt.auth(), wrap(async function(req, res, next) {

  var user = await User.query()
                    .findById(req.user.sub)

  if (user == undefined) throw ERR.NO_SUCH_TARGET
  if (!/censor/.test(user.permission)) {
      throw ERR.NO_PERMISSION
  }

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

router.post('/a/:aid', jwt.auth(), wrap(async function(req, res, next) {
    
  if (req.body.action == undefined) throw ERR.NEED_ARGUMENT

  var user = await User.query()
                    .findById(req.user.sub)

  if (user == undefined) throw ERR.NO_SUCH_TARGET

  var permission = user.permission || ''
  if (!/censor/.test(permission)) {
      throw ERR.NO_PERMISSION
  }


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
      .eager('[author,question, tracks(desc).setter]',{
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
router.get('/a/:aid', wrap(async function(req, res, next) {

  var user = await User.query()
                    .findById(req.user.sub)

  if (user == undefined) throw ERR.NO_SUCH_TARGET
  
  if (!/censor/.test(user.permission||'')) {
      throw ERR.NO_PERMISSION
  }

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


router.get('/answers', jwt.auth(), wrap(async function(req, res, next) {

  var answers = await Answer.query()
          .whereNull('censor_status')
          .orWhere('censor_status', 'reject_review')
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

module.exports = router

