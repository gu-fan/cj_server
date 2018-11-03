const express = require('express')
const router = express.Router()
const moment = require('moment')

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
const {normalizeUser} =require('../common')
async function getUser(id){
  var user = await User.query()
                .findById(id)
                .eager('[questions(count), answers(count)]',{
                  count:(builder)=>{
                      builder.count()
                  }
                })
  if (user == undefined) throw ERR.NO_SUCH_TARGET
  
  user = normalizeUser(user)

  return user
}
router.use('/.ping', jwt.auth(), wrap(async function(req, res, next) {

  var user = await getUser(req.user.sub)

  res.json({
    msg:'user valid',
    user,
    code:0
  })
}))
router.get('/checkpoint', jwt.auth(), wrap(async function(req, res, next) {
  var user = await User.query()
                .findById(req.user.sub)
  if (user == undefined) throw ERR.NO_SUCH_TARGET

  var last = moment(user.checkpoint_at)
  var today = moment().set({'hour':7, 'minute':30})

  if (user.checkpoint_at == null || last.isBefore(today) ) {
    user = await user.$query()
                .patchAndFetch({
                  checkpoint_at:new Date().toISOString(),
                  total_points:user.total_points+1,
                })
    res.json({
      msg:'checked',
      user,
      code:0
    })
  } else {
      // already checked _ today
        res.json({
          msg:'has checked today',
          user,
          code:1
        })

  }

}))

router.get('/:uid', jwt.auth(), wrap(async function(req, res, next) {
  var user = await User.query()
                .findById(req.params.uid)
                .eager('[questions(count), answers(count)]',{
                  count:(builder)=>{
                      builder.count()
                  }
                })
  if (user == undefined) throw ERR.NO_SUCH_TARGET
  
  user = normalizeUser(user)

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
  if (user == undefined) throw ERR.NO_SUCH_TARGET
  
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

  if (user == undefined) throw ERR.NO_SUCH_TARGET
  const numberOfDeletedRows = await User  
          .query()
          .deleteById(req.params.uid)

  res.json({
      msg:"user delete",
      numberOfDeletedRows,
      code:0,
  })
  
}))

router.post('/:uid/thank10', jwt.auth(), wrap(async function(req, res, next) {
  if (req.user.sub == req.params.uid) {
    return  res.json({
            msg:'target not valid',
            points:sender.total_points,
            code:2
          })
  }
  var sender = await User.query()
                .findById(req.user.sub)

  if (sender == undefined) throw ERR.NO_SUCH_TARGET
  var user = await User.query()
                .findById(req.params.uid)
  
  if (user == undefined) throw ERR.NO_SUCH_TARGET

  if (sender.total_points < 10 ){
    return  res.json({
            msg:'not enough pints',
            points:sender.total_points,
            code:1
          })
  }

  await sender.$query().decrement('total_points', 10)
  await user.$query().increment('total_answer_thanks', 1)
  await user.$query().increment('total_points', 10)
  
  sender = await User.query()
                .findById(req.user.sub)

  res.json({
    msg:'points send',
    points:sender.total_points,
    code:0
  })
}))

module.exports = router
