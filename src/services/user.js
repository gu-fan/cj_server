const express = require('express')
const router = express.Router()

// model

// app specific
const jwt = require('../common/jwt-auth')
const {ERR, MSG} = require('../code')

// help functions
const {wrap, delay} = require('../common/promise')
const isEmpty = require('lodash').isEmpty
const key = require('config').key
const auth = require('express-jwt')

const {Question, User}  = require('../models')

router.use('/.ping', jwt.auth(), wrap(async function(req, res, next) {
  var user = await User.query()
                .findById(req.user.sub)
  res.json({
    msg:'user valid',
    user,
    code:0
  })
}))

router.get('/:uid', jwt.auth(), wrap(async function(req, res, next) {
  var user = await User.query()
                .findById(req.params.uid)
                .eager('[questions(count), answers(count)]',{
                  count:(builder)=>{
                      builder.count()
                  }
                })
  
  user.total_questions = user.questions[0]['count(*)']
  user.total_answers = user.answers[0]['count(*)']
  delete user.questions
  delete user.answers

  res.json({
    msg:'user got',
    user,
    code:0
  })
}))
router.get('/:uid/questions', jwt.auth(), wrap(async function(req, res, next) {
  var user = await User.query()
                .findById(req.params.uid)
                .eager('[questions.author]')
  
  res.json({
    msg:'user questions got',
    questions:user.questions,
    code:0
  })
}))
router.get('/:uid/answers', jwt.auth(), wrap(async function(req, res, next) {
  var user = await User.query()
                .findById(req.params.uid)
                .eager('answers.[question, author]')
  
  res.json({
    msg:'user answers got',
    answers:user.answers,
    code:0
  })
}))

router.delete('/:uid', jwt.auth(), wrap(async function(req, res, next) {
  var user = await User.query()
                .findById(req.params.uid)
  const numberOfDeletedRows = await User  
          .query()
          .deleteById(req.params.uid)

  res.json({
      msg:"user delete",
      numberOfDeletedRows,
      code:0,
  })
  
}))


module.exports = router
