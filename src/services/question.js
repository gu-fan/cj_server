const express = require('express')
const router = express.Router()
const {promisify, wrap, delay} = require('../common/promise')
const jwt = require('../common/jwt-auth')
const {ERR, MSG} = require('../code')

const {uid, slug}= require('../models/mixin/_uid')

const {Question, User, Answer}  = require('../models')

const answerRoute = require('./answer')

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


// XXX
// this should put ahead /:qid
router.get('/:qid/verify', jwt.auth(), wrap(async function(req, res, next) {

  var user = await User.query()
                    .findById(req.user.sub)

  if (user == undefined) throw ERR.NO_SUCH_TARGET
  if (!/verify/.test(user.permission)) {

      throw ERR.NO_PERMISSION
  }

  var question = await Question.query()
                        .patchAndFetchById(req.params.qid, {
                          "verify": "pass"
                        })

  if (question == undefined) throw ERR.NO_SUCH_TARGET
  
  res.json({
      msg:"question verify",
      verify: question.verify,
      code:0,
  })

}))

router.get('/:qid', jwt.auth(), wrap(async function(req, res, next) {
  var question = await Question.query()
                        .findById(req.params.qid)
                        .eager('[author]')

  if (question == undefined) throw ERR.NO_SUCH_TARGET
  var answers = await question.$relatedQuery('answers')
                        .eager('[question, author]')
                        .orderBy('created_at', 'desc')
                        .page(req.query.page||0,5)
  
  res.json({
      msg:"question got",
      question,
      answers,
      code:0,
  })

}))
router.put('/:qid', jwt.auth(), wrap(async function(req, res, next) {

  var question = await Question.query()
                        .findById(req.params.qid)
                        .eager('author')
  if (question == undefined) throw ERR.NO_SUCH_TARGET

  const updatedQuestion = await Question
    .query()
    .patchAndFetchById(req.params.qid, 
            {title: req.body.title,content:req.body.content});
  
  res.json({
      msg:"question patch",
      updatedQuestion,
      code:0,
  })

}))

router.delete('/:qid', jwt.auth(), wrap(async function(req, res, next) {

  var question = await Question.query()
                        .findById(req.params.qid)
                        .eager('author')
  if (question == undefined) throw ERR.NO_SUCH_TARGET
  
  const numberOfDeletedRows = await Question
            .query()
            .deleteById(req.params.qid)

  res.json({
      msg:"question delete",
      numberOfDeletedRows,
      code:0,
  })

}))

// this is too cumbersome
// you can nest routers by attaching them as middleware:
// router.use('/:qid/a', answerRoute);


module.exports = router
