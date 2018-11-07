
const express = require('express')
const router = express.Router()
const {promisify, wrap, delay} = require('../common/promise')
const jwt = require('../common/jwt-auth')
const {ERR, MSG} = require('../code')

const {uid, slug}= require('../models/mixin/_uid')

const {Question, User, Answer}  = require('../models')

router.get('/answers', wrap(async function(req, res, next) {
  var page = req.query.page || 0

  var new_answers = await Answer.query().limit(5)
          .eager('[author, question]')
          .where('censor_status', 'pass')
          .orderBy('created_at', 'desc')
          .page(page, 10);

  var hot_answers = await Answer.query().limit(5)
          .eager('[author, question]')
          .where('censor_status', 'pass')
          .orderBy('total_zhichi', 'desc')
          .page(page, 10);
  
  res.json({
      msg:"answerlist",
      code:0,
      new_answers,
      hot_answers,
      page,
  })

}))
router.get('/new_answers', wrap(async function(req, res, next) {
  var page = req.query.page || 0

  var new_answers = await Answer.query().limit(5)
          .eager('[author, question]')
          .where('censor_status', 'pass')
          .orderBy('created_at', 'desc')
          .page(page, 10);
  
  res.json({
      msg:"answerlist",
      code:0,
      new_answers,
      page,
  })

}))

router.get('/hot_answers', wrap(async function(req, res, next) {
  var page = req.query.page || 0

  var hot_answers = await Answer.query().limit(5)
          .eager('[author, question]')
          .where('censor_status', 'pass')
          .orderBy('total_zhichi', 'desc')
          .page(page, 10);
  
  res.json({
      msg:"answerlist",
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
        .patchAndFetch({'permission': 'censor'})

  res.json({
      msg:"grant",
      code:0,
      user
  })

}))

router.get('/questions', wrap(async function(req, res, next) {

  var all = await Question.query().count()
  var questions = await Question.query()
          .limit(10)
          .where('censor_status', 'pass')
          .eager('[author]')

  res.json({
      msg:"question list",
      code:0,
      questions,
      total:all[0]['count(*)'],
  })

}))


module.exports = router