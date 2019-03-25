const express = require('express')
const router = express.Router()
const moment = require('moment')

// app specific
const jwt = require('../common/jwt-auth')
const {ERR, MSG} = require('../code')

// help functions
const {wrap, delay} = require('../common/promise')
const isEmpty = require('lodash').isEmpty
const key = require('config').key
const auth = require('express-jwt')

const {Question, Answer, User}  = require('../models')

const {getUserWithCount, getUserWithCensorCount} = require('../services/user')
const {encrypt, decrypt, generateKey, checkValid}  =require('../common/crypto')

router.use('/.ping', jwt.auth(), wrap(async function(req, res, next) {

  var user = await getUserWithCount(req.user.sub)

  res.json({
    msg:'user ping valid',
    user,
    code:0
  })
}))

router.post('/.grant', jwt.auth(), wrap(async function(req, res, next) {

  if (req.body.uid == undefined ) throw ERR.NEED_ARGUMENT

  var admin = await getUserWithCount(req.user.sub)

  if (!admin.is_admin) throw ERR.NO_PERMISSION

  var user = await getUserWithCount(req.body.uid)

  var permission = user.permission ||  ''
  if (/censor/.test(permission)) {
    // do nothing
    throw ERR.ALREADY_GOT_PERM
  } else {
    permisson = permission += ':censor'
    user = await user.$query()
          .patchAndFetch({'permission': permission})
  }

  res.json({
    msg:'user granted',
    user,
    code:0
  })

}))

router.post('/set', jwt.auth(), wrap(async function(req, res, next) {

  let {avatar, background, name} = req.body
  if (name && name.length > 15) throw ERR.NAME_EXCEED_LIMIT_15

  // assign to object only if it's valid
  // https://stackoverflow.com/questions/11704267/in-javascript-how-to-conditionally-add-a-member-to-an-object
  var user = await User.query()
          .patchAndFetchById(req.user.sub, 
          {
            ... avatar && {avatar},
            ... background && {background},
            ... name && {name},
          })
          .pick(['id', 'name','avatar','background','created_at']);
  

  res.json({
    msg:'user set',
    user,
    code:0
  })

}))

// XXX: this should put before /:uid
router.get('/checkpoint', jwt.auth(), wrap(async function(req, res, next) {

  var user = await User.query()
                .findById(req.user.sub)
                .eager('detail')

  if (user == undefined) throw ERR.NO_SUCH_TARGET

  var last = moment(user.detail.last_checkin_at)
  var today = moment().set({'hour':7, 'minute':0})
  var hr = today.diff(last, 'hours') 

  if (user.detail.last_checkin_at == null || (last.isBefore(today) && hr > 7) ) {

    user.detail = await user.detail.$query()
                .patchAndFetch({
                  last_checkin_at:moment().format(),
                  total_points:user.detail.total_points+1,
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

router.post('/:uid/thank', jwt.auth(), wrap(async function(req, res, next) {

  if (req.body.count == null) throw ERR.NEED_ARGUMENT
  if (req.user.sub == req.params.uid) {
    return  res.json({
            msg:'TARGET_SHOULD_VARY',
            code:2
          })
  }
  var sender = await User.query()
                .findById(req.user.sub)
                .eager('detail')

  if (sender == undefined) throw ERR.NO_SUCH_TARGET
  var user = await User.query()
                .findById(req.params.uid)
                .eager('detail')
  
  if (user == undefined) throw ERR.NO_SUCH_TARGET

  var count = req.body.count
  if (count > 50 || count < 0) throw ERR.EXCEED_RANGE
  if (sender.detail.total_points < count ){
    return  res.json({
            msg:'not enough pints',
            points:sender.detail.total_points,
            code:1
          })
  }

  await sender.detail.$query().decrement('total_points', count)
  await user.detail.$query().increment('total_points', count)
  
  sender = await User.query()
                .findById(req.user.sub)
                .eager('detail')

  res.json({
    msg:'points send',
    points:sender.detail.total_points,
    code:0
  })
}))

router.get('/:uid', jwt.auth(), wrap(async function(req, res, next) {

  var user
  if (req.user.sub == req.params.uid) {
      user = await getUserWithCount(req.params.uid)
  } else {
      user = await getUserWithCensorCount(req.params.uid)
  }

  res.json({
    msg:'user got',
    user,
    code:0
  })

}))

// NOTE: NO DELETE FROM HERE
router.delete('/:uid', jwt.auth(), wrap(async function(req, res, next) {

  res.json({
    msg: 'can not delete',
    code: 0
  })

  // var user = await User.query()
  //               .findById(req.params.uid)

  // if (user == undefined) throw ERR.NO_SUCH_TARGET
  // const numberOfDeletedRows = await User  
  //         .query()
  //         .deleteById(req.params.uid)

  // res.json({
  //     msg:"user delete",
  //     numberOfDeletedRows,
  //     code:0,
  // })
  
}))


router.get('/:uid/posts', jwt.auth(), wrap(async function(req, res, next) {
  var page = req.query.page || 0
  var user, posts

  user = await User.query()
                  .findById(req.params.uid)

  if (user == undefined) throw ERR.NO_SUCH_TARGET

  let uid = req.user && req.user.sub || '0'
  if (req.user.sub == req.params.uid) { // is_author
    posts = await user.$relatedQuery('posts')
      .eager('[author(safe),liked_by_users(byMe)]', {
        byMe: builder=>{
          builder.where('uid', uid)
        }
      })
      .where('is_deleted', false)
      .orderBy('created_at', 'desc')
      .page(page, 5)
  } else {
    posts = await user.$relatedQuery('posts')
      .where('censor_status', 'pass')
      .where('is_deleted', false)
      .where('is_public', true)
      .orderBy('created_at', 'desc')
      .eager('[author(safe),liked_by_users(byMe)]', {
        byMe: builder=>{
          builder.where('uid', uid)
        }
      })

      .page(page, 5)
  }
    posts.results.map((item)=>{
      if (item.liked_by_users.length>0) {
        item.is_like_by_me = true
      } else {
        item.is_like_by_me = false
      }
      if (item.author.id == uid) {
        let st = generateKey(item.id)
        item.st = st
      }
      delete item.liked_by_users
    })
  
  res.json({
    msg:'user posts got',
    posts,
    code:0
  })

}))

module.exports = router
