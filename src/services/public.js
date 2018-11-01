
const express = require('express')
const router = express.Router()
const {promisify, wrap, delay} = require('../common/promise')
const jwt = require('../common/jwt-auth')
const {ERR, MSG} = require('../code')

const {uid, slug}= require('../models/mixin/_uid')

const {Question, User, Answer}  = require('../models')

router.get('/answer', wrap(async function(req, res, next) {
  var all = await Answer.query().count()
  var answers = await Answer.query().limit(5)
          .eager('[author, question]')

  res.json({
      msg:"answerlist",
      code:0,
      answers,
      total:all[0]['count(*)'],
  })

}))


module.exports = router
