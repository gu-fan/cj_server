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

router.get('/:qid', jwt.auth(), wrap(async function(req, res, next) {

  var question = await Question.query()
                        .findById(req.params.qid)
                        .eager('[author, answers.[question, author]]')

  if (question == undefined) throw ERR.NO_SUCH_TARGET
  
  res.json({
      msg:"question got",
      question,
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
