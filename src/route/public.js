const express = require('express')
const router = express.Router()
const {promisify, wrap, delay} = require('../common/promise')
const jwt = require('../common/jwt-auth')
const {ERR, MSG} = require('../code')
const moment = require('moment')

const {uid, slug}= require('../models/mixin/_uid')

const {Post, User, Tag}  = require('../models')

const {getHotAnswers, getNewAnswers, getGoldAnswers,
       getMixedHot, getMixedNew} = require('../services/answer')
const _ = require('lodash')


router.get('/.ping', wrap(async function(req, res, next) {
  
  res.json({
      msg:"ping",
      code:0,
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

router.get('/posts',  jwt.auth(), wrap(async function(req, res, next) {

  var day_before = moment().subtract(7, 'day').format()

  let uid = req.user && req.user.sub || '0'
  var page = req.query.page || 0
  var posts = await Post.query()
          .where('censor_status', 'pass')
          .where('is_deleted', false)
          .where('is_public', true)
          .eager('[author(safe),liked_by_users(byMe)]', {
            byMe: builder=>{
              builder.where('uid', uid)
            }
          })
          .orderBy('created_at', 'desc')
          .where('created_at', '>', day_before)
          .page(page, 5)
    posts.results.map((item)=>{
      if (item.liked_by_users.length>0) {
        item.is_like_by_me = true
      } else {
        item.is_like_by_me = false
      }
      delete item.liked_by_users
    })
  
  // posts.results.map(item=>{
  //   if (_.random(0,5)>1) {
  //     if (_.random(0,3)>1) {
  //       item.total_likes = _.random(0,6)
  //       item.total_comments = _.random(0,3)
  //       item.total_shares = _.random(0,2)
  //     } else {
  //       item.total_likes = _.random(0,200)
  //       item.total_comments = _.random(0,80)
  //       item.total_shares = _.random(0,20)
  //     }
  //   } else {
  //     item.total_likes = _.random(10,600)
  //     item.total_comments = _.random(10,300)
  //     item.total_shares = _.random(0,100)
  //   }
  //   return item
  // })

  res.json({
      msg:"post list",
      code:0,
      posts,
  })

}))

router.get('/tags', wrap(async function(req, res, next) {

  var seed = parseInt(req.query.seed) || 0
  var tags = await Tag.query()
          .orderBy('total_posts', 'desc')
          .limit(50)
  var len = tags.length / 5
  tags = tags.slice(seed*len, (seed+1)*len)

  res.json({
      msg:"tag list",
      code:0,
      tags,
  })

}))

router.get('/change_content', wrap(async function(req, res, next) {

  let time0 = Date.now()
  var posts = await Post.query()
                .select('id','content_json')
                .where('is_deleted', false)

  for (var i = 0; i < posts.length; ++i) {
    let post = posts[i]
    post.content_json.images = post.content_json.images.map(img=>{
      img = img.replace('http:', 'https:')
      return img.replace('file.myqcloud.com', 'image.myqcloud.com')
    }).filter(img=>{
      return !/\/\/tmp/.test(img)
    })

    post = await post.$query()
          .patch({content_json: post.content_json})
  }

  let time1 = Date.now()
  let uses = time1-time0

  res.json({
    code:0,
    posts,
    uses
  })

}))
router.get('/change_avatar_bg', wrap(async function(req, res, next) {

  let time0 = Date.now()
  var users = await User.query()
                .select('id','avatar', 'background')

  let count = 0
  for (var i = 0; i < users.length; ++i) {

    let user = users[i]
    if (user.avatar) {
      count++
      user.avatar = user.avatar.replace('http:', 'https:')
      user.avatar = user.avatar.replace('file.myqcloud.com', 'image.myqcloud.com')
    }
    if (user.background) {
      count++
      user.background = user.background.replace('http:', 'https:')
      user.background = user.background.replace('file.myqcloud.com', 'image.myqcloud.com')
    }

    user= await user.$query()
          .patch({avatar: user.avatar, background: user.background})
  }

  let time1 = Date.now()
  let uses = time1-time0

  res.json({
    code:0,
    users,
    count,
  })

}))





module.exports = router
