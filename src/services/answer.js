const express = require('express')
const router = express.Router({mergeParams: true})
const {promisify, wrap, delay} = require('../common/promise')
const jwt = require('../common/jwt-auth')
const {ERR, MSG} = require('../code')

const {uid, slug}= require('../models/mixin/_uid')

const {Question, User, Answer}  = require('../models')

const commentRoute = require('./comment')

router.get('/', jwt.auth(), wrap(async function(req, res, next) {

  var question = await Question.query()
                        .findById(req.params.pid)
                        .eager('[author, answers]')

  if (question == undefined) throw ERR.NO_SUCH_NOTE


  var answers = question.answers


  res.json({
      msg:"answers got",
      answers,
      code:0,
  })

}))

router.post('/', jwt.auth(), wrap(async function(req, res, next) {

  var answers = await Answer.query().insertGraph([{
    content: req.body.content, 
    question:{
      id: req.params.pid,
    },
    author: {
      id: req.user.sub,
    },
  }], {
    relate: true
  })
    .eager('[author, question]');

  var newAnswer = answers[0]

  res.json({
      msg:"answer create",
      newAnswer,
      code:0,
  })

}))

router.get('/:aid', jwt.auth(), wrap(async function(req, res, next) {

  var answer = await Answer.query()
                        .findById(req.params.aid)
                        .eager('[author, question]')

  if (answer == undefined) throw ERR.NO_SUCH_NOTE
  
  res.json({
      msg:"answer got",
      answer,
      code:0,
  })

}))

router.put('/:aid', jwt.auth(), wrap(async function(req, res, next) {

  var answer = await Answer.query()
                        .findById(req.params.aid)
                        .eager('author')
  if (answer == undefined) throw ERR.NO_SUCH_NOTE
  const updatedAnswer = await Answer
    .query()
    .patchAndFetchById(req.params.aid, {content:req.body.content});
    

  res.json({
      msg:"answer patch",
      updatedAnswer,
      code:0,
  })

}))

router.delete('/:aid', jwt.auth(), wrap(async function(req, res, next) {

  var answer = await Answer.query()
                        .findById(req.params.aid)
                        .eager('author')
  if (answer == undefined) throw ERR.NO_SUCH_NOTE
  
  const numberOfDeletedRows = await Answer 
    .query()
    .deleteById(req.params.aid)

  res.json({
      msg:"answer delete",
      numberOfDeletedRows,
      code:0,
  })

}))

router.use('/:aid/c', commentRoute);

module.exports = router

