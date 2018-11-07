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

const {Question, Answer, User}  = require('../models')
const {normalizeUser} =require('../common')
function getUser(id){
return new Promise((resolve, reject)=>{
  User.query()
        .findById(id)
        .eager('[questions(count), answers(count)]',{
          count:(builder)=>{
              builder.count()
          }
        })
  .then((user)=>{
    if (user == undefined) reject(ERR.NO_SUCH_TARGET)
    else {
      resolve(normalizeUser(user))
    }

  })
  .catch((e)=>{
    reject(e)
  })

})
  
}
router.use('/.ping', jwt.auth(), wrap(async function(req, res, next) {

  var user = await getUser(req.user.sub)

  res.json({
    msg:'user ping valid',
    user,
    code:0
  })
}))
router.post('/.grant', jwt.auth(), wrap(async function(req, res, next) {

  if (req.body.uid == undefined ) throw ERR.NEED_ARGUMENT
  var user = await getUser(req.body.uid)

  user = await user.$query()
        .patchAndFetch({'permission': 'censor'})

  res.json({
    msg:'user granted',
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

router.post('/:uid/thank', jwt.auth(), wrap(async function(req, res, next) {

  if (req.body.aid == undefined) throw ERR.NEED_ARGUMENT
  if (req.user.sub == req.params.uid) {
    return  res.json({
            msg:'TARGET_SHOULD_VARY',
            code:2
          })
  }
  var sender = await User.query()
                .findById(req.user.sub)

  if (sender == undefined) throw ERR.NO_SUCH_TARGET
  var user = await User.query()
                .findById(req.params.uid)
  
  if (user == undefined) throw ERR.NO_SUCH_TARGET

  var count = req.body.count
  if (count > 50 || count < 0) throw ERR.EXCEED_RANGE
  if (sender.total_points < count ){
    return  res.json({
            msg:'not enough pints',
            points:sender.total_points,
            code:1
          })
  }


  var answer = await Answer.query()
                .findById(req.body.aid)
  if (answer == undefined) throw ERR.NO_SUCH_TARGET

  await sender.$query().decrement('total_points', count)
  await user.$query().increment('total_answer_thanks', 1)
  await user.$query().increment('total_points', count)
  await answer.$query().increment('total_thanks', 1)
  
  sender = await User.query()
                .findById(req.user.sub)

  res.json({
    msg:'points send',
    points:sender.total_points,
    code:0
  })
}))

module.exports = router
