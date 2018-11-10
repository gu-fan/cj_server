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

  var admin = await getUser(req.user.sub)

  if (!admin.is_admin) throw ERR.NO_PERMISSION

  var user = await getUser(req.body.uid)

  var permission = user.permission ||  ''
  console.log(permission)
  if (/censor/.test(permission)) {
    // do nothing
    throw ERR.ALREADY_GOT_PERM
  } else {
    permisson = permission += ':censor'
    user = await user.$query()
          .patchAndFetch({'permission': permission})
  }
  console.log(permission)


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
                  checkpoint_at:moment().format(),
                  // checkpoint_at:new Date().toISOString(),
                  total_points:user.total_points+1,
                })
    res.json({
      msg:'check success',
      user,
      code:0
    })
  } else {
    throw ERR.ALREADY_CHECKED
  }

}))

router.get('/:uid', jwt.auth(), wrap(async function(req, res, next) {

  var user
  if (req.user.sub == req.params.uid) {
      user = await User.query()
                .findById(req.params.uid)
                .eager('[questions(count), answers(count)]',{
                  count:(builder)=>{
                      builder.count()
                    }
                })
  } else {
      user = await User.query()
                .findById(req.params.uid)
                .eager('[questions(count), answers(count)]',{
                  count:(builder)=>{
                      builder
                        .where('censor_status', 'pass')
                        .count()
                  }
                })
  }

  if (user == undefined) throw ERR.NO_SUCH_TARGET
  
  user = normalizeUser(user)

  res.json({
    msg:'user got',
    user,
    code:0
  })

}))

router.get('/:uid/questions', jwt.auth(), wrap(async function(req, res, next) {
  var user ,questions
    user = await User.query()
                  .findById(req.params.uid)

  if (user == undefined) throw ERR.NO_SUCH_TARGET

  if (req.user.sub == req.params.uid) {
    questions = await user.$relatedQuery('questions')
                    .eager('author')
  } else {
    questions = await user.$relatedQuery('questions')
                    .where('censor_status', 'pass')
                    .eager('author')
  }
  
  res.json({
    msg:'user questions got',
    questions,
    code:0
  })
}))

router.get('/:uid/answers', jwt.auth(), wrap(async function(req, res, next) {

  var user ,answers
    user = await User.query()
                  .findById(req.params.uid)

  if (req.user.sub == req.params.uid) {
    answers = await user.$relatedQuery('answers')
                  .eager('[author, question]')
  } else {
    answers = await user.$relatedQuery('answers')
                .eager('[author, question]')
                .where('censor_status', 'pass')
  }
  
  res.json({
    msg:'user answers got',
    answers,
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
