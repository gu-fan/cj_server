const express = require('express')
const router = express.Router()
const knex = require('knex')

const {promisify, wrap, delay} = require('../common/promise')
const jwt = require('../common/jwt-auth')
const {ERR, MSG} = require('../code')

const {uid, slug}= require('../models/mixin/_uid')

const {TrackQ, Question, User, Answer}  = require('../models')

const {normalizeUser} =require('../services/user')

const {getUser} = require('../services/user')
const {normAnswers} = require('../services/answer')
const {getQuestion} = require('../services/question')

router.get('/', jwt.auth(), wrap(async function(req, res, next) {
  var all = await Question.query().count()
  var questions = await Question.query().limit(5)

  res.json({
      msg:"question list",
      code:0,
      questions,
      count:all[0]['count(*)'],
  })

}))


router.post('/', jwt.auth(), wrap(async function(req, res, next) {

  if (req.body.title == '' || req.body.content == '')  throw ERR.NEED_CONTENT
  var question = await Question.query().insertGraph([{
    title: req.body.title,
    content: req.body.content, 
    author: {
      id: req.user.sub,
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



router.get('/:qid/tracks', jwt.auth(), wrap(async function(req, res, next) {

  var tracks = await TrackQ.query()
                        .where('question_id', req.params.qid)

  res.json({
      msg:"tracks got",
      tracks,
      code:0,
  })

}))

router.get('/:qid', jwt.auth(), wrap(async function(req, res, next) {

  if (req.query.t == 'edit') {
    var question = await Question.query()
                          .findById(req.params.qid)

    if (question == undefined) throw ERR.NO_SUCH_TARGET
    res.json({
        msg:"question got",
        question,
        code:0,
    })
  } else {
    var question = await Question.query()
                          .findById(req.params.qid)
                          .eager('[author, tracks(desc).setter]', {
                            desc:(builder)=>{
                              builder.orderBy('created_at', 'desc')
                            }
                          })
    if (question == undefined) throw ERR.NO_SUCH_TARGET
    var user = await User.query()
                          .findById(req.user.sub)
    user = normalizeUser(user)

    var answers = await question.$relatedQuery('answers')
                          .eager('[question, author]')
                          .orderBy('total_zhichi', 'desc')
                          .orderBy('created_at', 'desc')
                          .where('is_deleted', false)
                          .where('censor_status', 'pass')
                          .page(req.query.page||0,5)
    
    answers = normAnswers(answers)

    res.json({
        msg:"question got",
        question,
        answers,
        user,
        code:0,
    })
  }




}))

router.put('/:qid', jwt.auth(), wrap(async function(req, res, next) {

  var question = await Question.query()
                        .findById(req.params.qid)
  if (question == undefined) throw ERR.NO_SUCH_TARGET
  if (req.user.sub != question.author_id) throw ERR.NOT_AUTHOR

  var status 
  if (question.censor_status == 'reject') {
        status = 'reject_review'
  } else {
        status = question.censor_status
  }

  await question.$relatedQuery('tracks')
       .insertAndFetch({content:'edit', setter_id:req.user.sub})

  question = await Question
    .query()
    .patchAndFetchById(req.params.qid, 
            {title:req.body.title, content:req.body.content, censor_status:status})
      .eager('author')
  
  res.json({
      msg:"question patch",
      question,
      code:0,
  })

}))

router.delete('/:qid', jwt.auth(), wrap(async function(req, res, next) {

  var question = await getQuestion(req.params.qid)
  var user = await getUser(req.user.sub)

  if (question.is_deleted) throw ERR.ALREADY_DELETED

  if (!user.is_staff && req.user.sub != question.author_id) {
    if (req.user.sub != question.author_id) throw ERR.NOT_AUTHOR
    if (!user.is_staff) throw ERR.NO_PERMISSION
  }

  const deleted = await question 
          .$query()
          .patch({'is_deleted': true})

  res.json({
      msg:"question delete",
      deleted,
      code:0,
  })


}))

// this is too cumbersome
// you can nest routers by attaching them as middleware:
// router.use('/:qid/a', answerRoute);


module.exports = router
