
const express = require('express')
const router = express.Router()
const {promisify, wrap, delay} = require('../common/promise')
const jwt = require('../common/jwt-auth')
const {ERR, MSG} = require('../code')

const {uid, slug}= require('../models/mixin/_uid')

const {Question, User, Answer}  = require('../models')

const {getHotAnswers, getNewAnswers, getGoldAnswers} = require('../services/answer')

router.get('/answers', wrap(async function(req, res, next) {
  var page = req.query.page || 0

  var new_answers = await getNewAnswers(page)
  var hot_answers = await getHotAnswers(page)
  var gold_answers = await getGoldAnswers(page)
  
  res.json({
      msg:"answerlist",
      code:0,
      new_answers,
      hot_answers,
      gold_answers,
      page,
  })

}))

router.get('/gold_answers', wrap(async function(req, res, next) {
  var page = req.query.page || 0
  var gold_answers = await getGoldAnswers(page);
  res.json({
      msg:"answerlist gold",
      code:0,
      gold_answers,
      page,
  })

}))
router.get('/new_answers', wrap(async function(req, res, next) {
  var page = req.query.page || 0

  var new_answers = await getNewAnswers(page);
  
  res.json({
      msg:"answerlist new",
      code:0,
      new_answers,
      page,
  })

}))

router.get('/hot_answers', wrap(async function(req, res, next) {
  var page = req.query.page || 0

  var hot_answers = await getHotAnswers(page);
  
  res.json({
      msg:"answerlist hot",
      code:0,
      hot_answers,
      page,
  })

}))

router.get('/grant', wrap(async function(req, res, next) {

  if (req.query.uid == undefined) throw ERR.NEED_ARGUMENT
  if (req.query.code != 'FZBB') throw ERR.NEED_ARGUMENT

  var user = await User.query()
              .findById(req.query.uid)

  if (user == undefined ) throw ERR.NO_SUCH_TARGET

  user = await user.$query()
        .patchAndFetch({'permission': 'admin:censor'})

  res.json({
      msg:"grant",
      code:0,
      user
  })

}))

router.get('/questions', wrap(async function(req, res, next) {

  var page = req.query.page || 0
  var questions = await Question.query()
          .where('censor_status', 'pass')
          .where('is_deleted', false)
          .eager('[author]')
          .page(page, 5)

  res.json({
      msg:"question list",
      code:0,
      questions,
  })

}))


module.exports = router
